const express = require("express");
const router = express.Router();
const application = require("../Model/Application");
const { verifiedAuthMiddleware: authMiddleware } = require("../middleware/auth");
const UserSubscription = require("../Model/UserSubscription");
const Internship = require("../Model/Internship");
const Job = require("../Model/Job");
const { getEndOfISTMonthUTC, getISTParts, getStartOfISTMonthUTC } = require("../utils/istTime");
const { SUBSCRIPTION_PLANS } = require("../utils/subscriptionPlans");
const { reserveUsage, releaseUsage } = require("../utils/usageQuota");

// POST / — Create new application
router.post("/", authMiddleware, async (req, res) => {
  const userEmail = req.user.email?.toLowerCase();
  const applicationType = String(req.body.applicationType || "").toLowerCase();
  if (!userEmail) {
    return res.status(400).json({ error: "User email is required to submit an application." });
  }
  if (!["internship", "job"].includes(applicationType)) {
    return res.status(400).json({ error: "Application type must be internship or job." });
  }

  let reservedQuotaKey = null;
  try {
    const OpportunityModel = applicationType === "internship" ? Internship : Job;
    const opportunity = await OpportunityModel.findById(req.body.Application).lean();
    if (!opportunity) {
      return res.status(404).json({ error: `${applicationType} not found.` });
    }

    if (applicationType === "internship") {
      const sub = await UserSubscription.findOne({
        userEmail,
        expiresAt: { $gt: new Date() }
      });
      const limit = SUBSCRIPTION_PLANS[sub?.planName]?.applicationLimit ?? 1;
      const startOfMonth = getStartOfISTMonthUTC();

      const used = await application.countDocuments({
        "user.email": userEmail,
        applicationType: "internship",
        createdAt: { $gte: startOfMonth }
      });

      if (used >= limit) {
        return res.status(403).json({ message: "Monthly internship application limit reached. Upgrade your plan." });
      }

      if (limit !== Infinity) {
        const { year, month } = getISTParts();
        const quotaKey = `internship-application:${userEmail}:${year}-${month + 1}`;
        const reservation = await reserveUsage({
          key: quotaKey,
          limit,
          initialCount: used,
          expiresAt: getEndOfISTMonthUTC(),
        });
        if (reservation.limitReached) {
          return res.status(403).json({ message: "Monthly internship application limit reached. Upgrade your plan." });
        }
        reservedQuotaKey = quotaKey;
      }
    }

    const applicationData = new application({
      company: opportunity.company,
      category: opportunity.category,
      coverLetter: req.body.coverLetter,
      applicationType,
      availability: req.body.availability,
      user: {
        uid: req.user.uid,
        email: userEmail,
        name: req.user.name || req.body.user?.name || "Applicant",
        photo: req.user.picture || req.user.photo || req.body.user?.photo || "",
      },
      Application: req.body.Application,
      body: req.body.body,
    });
    const saved = await applicationData.save();
    return res.status(201).json(saved);
  } catch (error) {
    if (reservedQuotaKey) await releaseUsage({ key: reservedQuotaKey }).catch(() => null);
    console.error("Error creating application:", error);
    return res.status(500).json({ error: "Unable to submit application." });
  }
});

// GET / — Fetch all applications (or filtered by uid/email)
router.get("/", authMiddleware, async (req, res) => {
  try {
    const callerEmail = req.user.email?.toLowerCase();
    const { uid, email } = req.query;
    let query = {};
    if (uid) {
      query["user.uid"] = uid;
    } else if (email) {
      query["user.email"] = String(email).trim().toLowerCase();
    }

    if (req.user.role !== "admin") {
      query["user.email"] = callerEmail;
    }

    const data = await application.find(query);
    return res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching applications:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
});

// GET /:id — Fetch single application by ID
router.get("/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    const data = await application.findById(id);
    if (!data) {
      return res.status(404).json({ error: "Application not found." });
    }
    if (req.user.role !== "admin" && data.user?.email?.toLowerCase() !== req.user.email?.toLowerCase()) {
      return res.status(403).json({ error: "You are not authorized to view this application." });
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
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Administrator access is required." });
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
