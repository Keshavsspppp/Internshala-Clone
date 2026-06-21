require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const path = require("path");
const { connect } = require("./db");
const router = require("./Routes/index");
const port = process.env.PORT || 5000;

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : ["http://localhost:3000", "http://localhost:5173"];

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));

// Serve static resumes
app.use("/resumes", express.static(path.join(__dirname, "public/resumes")));
// Serve static media
app.use("/media", express.static(path.join(__dirname, "public/media")));

app.get("/", (req, res) => {
  res.json({ message: "InternArea backend is running." });
});
app.use("/api", router);
connect();

app.listen(port, () => {
  console.log(`Server is running on the port ${port}`);
});
