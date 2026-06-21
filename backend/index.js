require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const path = require("path");
const { connect } = require("./db");
const router = require("./Routes/index");
const port = process.env.PORT || 5000;

const envOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map(o => o.trim())
  : [];

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "https://internshala-clone-kappa.vercel.app",
  ...envOrigins
];

// Middleware to collapse double slashes in request URLs (e.g. //api/internship -> /api/internship)
// to prevent route matching and CORS failures when the frontend API URL has a trailing slash.
app.use((req, res, next) => {
  if (req.url && req.url.includes("//")) {
    req.url = req.url.replace(/\/{2,}/g, "/");
  }
  next();
});

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    const isAllowed = allowedOrigins.includes(origin);
    console.log(`CORS Request: origin=${origin}, allowed=${isAllowed}`);

    if (isAllowed) {
      callback(null, true);
    } else {
      // Standard CORS behavior is to call callback(null, false).
      // Passing an Error object triggers a 500 server exception, which breaks preflight OPTIONS requests.
      callback(null, false);
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
