require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const helmet = require("helmet");
const { rateLimit } = require("express-rate-limit");
const path = require("path");
const { connect } = require("./db");
const router = require("./Routes/index");
const port = process.env.PORT || 5000;
const { startInvoiceWorker } = require("./utils/invoiceDelivery");
const {
  getConfigurationStatus,
  isConfigurationReady,
} = require("./utils/configurationStatus");

app.set("trust proxy", 1);
app.disable("x-powered-by");

const envOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map(o => o.trim())
  : [];

const developmentOrigins = process.env.NODE_ENV === "production"
  ? []
  : ["http://localhost:3000", "http://localhost:5173"];
const allowedOrigins = [...new Set([...developmentOrigins, ...envOrigins])];

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

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors(corsOptions));
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  skip: (req) => req.method === "OPTIONS",
  message: { message: "Too many requests. Please try again later." },
});
app.use("/api", apiLimiter);

// Serve static resumes
app.use("/resumes", express.static(path.join(__dirname, "public/resumes")));
// Serve static media
app.use("/media", express.static(path.join(__dirname, "public/media")));

app.get("/", (req, res) => {
  res.json({ message: "InternArea backend is running." });
});
app.get("/health", (req, res) => {
  const checks = getConfigurationStatus();
  const ready = isConfigurationReady(checks);
  return res.status(ready ? 200 : 503).json({ status: ready ? "ready" : "not_ready", checks });
});
app.use("/api", router);

app.use((req, res) => res.status(404).json({ message: "Route not found." }));
app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  console.error("Unhandled request error:", error);
  return res.status(error?.type === "entity.too.large" ? 413 : 500).json({
    message: error?.type === "entity.too.large" ? "Request body is too large." : "Internal server error.",
  });
});

const start = async () => {
  await connect();
  startInvoiceWorker();
  app.listen(port, () => {
    console.log(`Server is running on the port ${port}`);
  });
};

if (require.main === module) {
  start().catch((error) => {
    console.error("Server startup failed:", error);
    process.exit(1);
  });
}

module.exports = { app, start };
