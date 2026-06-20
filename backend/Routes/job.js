const express = require("express");
const router = express.Router();
const Job = require("../Model/Job");

// POST / — Create new job
router.post("/", async (req, res) => {
  try {
    const jobData = new Job({
      title: req.body.title,
      company: req.body.company,
      location: req.body.location,
      Experience: req.body.Experience,
      category: req.body.category,
      aboutCompany: req.body.aboutCompany,
      aboutJob: req.body.aboutJob,
      whoCanApply: req.body.whoCanApply,
      perks: req.body.perks,
      AdditionalInfo: req.body.AdditionalInfo,
      CTC: req.body.CTC,
      StartDate: req.body.StartDate,
    });
    const saved = await jobData.save();
    return res.status(201).json(saved);
  } catch (error) {
    console.error("Error creating job:", error);
    return res.status(500).json({ error: "Unable to create job." });
  }
});

// GET / — Fetch all jobs
router.get("/", async (req, res) => {
  try {
    const data = await Job.find();
    return res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching jobs:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
});

// GET /:id — Fetch single job by ID
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const data = await Job.findById(id);
    if (!data) {
      return res.status(404).json({ error: "Job not found." });
    }
    return res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching job:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
});

module.exports = router;