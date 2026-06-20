const express = require("express");
const router = express.Router();
const admin = require("./admin");
const intern = require("./internship");
const job = require("./job");
const application = require("./application");
const community = require("./community");
const security = require("./security");
const subscription = require("./subscription");

router.use("/admin", admin);
router.use("/internship", intern);
router.use("/job", job);
router.use("/application", application);
router.use("/community", community);
router.use("/security", security);
router.use("/subscription", subscription);


module.exports = router;
