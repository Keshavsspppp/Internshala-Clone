const express = require("express");
const router = express.Router();
const Internship = require("../Model/Internship");

// POST / — Create new internship
router.post("/", async (req, res) => {
  try {
    const internshipData = new Internship({
      title: req.body.title,
      company: req.body.company,
      location: req.body.location,
      category: req.body.category,
      aboutCompany: req.body.aboutCompany,
      aboutInternship: req.body.aboutInternship,
      whoCanApply: req.body.whoCanApply,
      perks: req.body.perks,
      numberOfOpening: req.body.numberOfOpening,
      stipend: req.body.stipend,
      startDate: req.body.startDate,
      additionalInfo: req.body.additionalInfo,
    });
    const saved = await internshipData.save();
    return res.status(201).json(saved);
  } catch (error) {
    console.error("Error creating internship:", error);
    return res.status(500).json({ error: "Unable to create internship." });
  }
});

// GET / — Fetch all internships
router.get("/", async (req, res) => {
  try {
    const data = await Internship.find();
    return res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching internships:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
});

// GET /:id — Fetch single internship by ID
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const data = await Internship.findById(id);
    if (!data) {
      return res.status(404).json({ error: "Internship not found." });
    }
    return res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching internship:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
});

module.exports = router;
