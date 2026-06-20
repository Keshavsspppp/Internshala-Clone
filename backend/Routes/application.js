const express = require("express");
const router = express.Router();
const application = require("../Model/Application");
const authMiddleware = require("../middleware/auth");
const UserSubscription = require("../Model/UserSubscription");

// POST / — Create new application
router.post("/", authMiddleware, async (req, res) => {
  const userEmail = req.body.user?.email?.toLowerCase();
  if (!userEmail) {
    return res.status(400).json({ error: "User email is required to submit an application." });
  }

  try {
    const sub = await UserSubscription.findOne({
      userEmail,
      expiresAt: { $gt: new Date() }
    });
    const limits = { Free: 1, Bronze: 3, Silver: 5, Gold: Infinity };
    const limit = limits[sub?.planName] ?? limits.Free;

    const startOfMonth = new Date(new Date().setDate(1));
    startOfMonth.setHours(0, 0, 0, 0);

    const used = await application.countDocuments({
      "user.email": userEmail,
      createdAt: { $gte: startOfMonth }
    });

    if (used >= limit) {
      return res.status(403).json({ message: "Monthly application limit reached. Upgrade your plan." });
    }

    const applicationData = new application({
      company: req.body.company,
      category: req.body.category,
      coverLetter: req.body.coverLetter,
      user: req.body.user,
      Application: req.body.Application,
      body: req.body.body,
    });
    const saved = await applicationData.save();
    return res.status(201).json(saved);
  } catch (error) {
    console.error("Error creating application:", error);
    return res.status(500).json({ error: "Unable to submit application." });
  }
});

// GET / — Fetch all applications (or filtered by uid/email)
router.get("/", async (req, res) => {
  try {
    const { uid, email } = req.query;
    let query = {};
    if (uid) {
      query["user.uid"] = uid;
    } else if (email) {
      query["user.email"] = String(email).trim().toLowerCase();
    }
    const data = await application.find(query);
    return res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching applications:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
});

// GET /:id — Fetch single application by ID
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const data = await application.findById(id);
    if (!data) {
      return res.status(404).json({ error: "Application not found." });
    }
    return res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching application:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
});

// PUT /:id — Accept or reject application
router.put("/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { action } = req.body;

  if (action !== "accepted" && action !== "rejected") {
    return res.status(400).json({ error: "Invalid action. Use 'accepted' or 'rejected'." });
  }

  try {
    const updated = await application.findByIdAndUpdate(
      id,
      { $set: { status: action } },
      { new: true }
    );
    if (!updated) {
      return res.status(404).json({ error: "Application not found." });
    }
    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error("Error updating application:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
});

module.exports = router;
