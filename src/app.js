require("dotenv").config({ path: "./config/default.env" });
const express = require("express");
const logger = require("./utils/logger");
const cronService = require("./services/cronService");
const authRoutes = require("./routes/auth");

const app = express();
const port = process.env.PORT || 3000;

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Auth routes
app.use("/auth", authRoutes);

// Health check endpoint with cron jobs status
app.get("/health", (req, res) => {
  const activeJobs = cronService.getActiveJobs();
  res.json({
    status: "ok",
    timestamp: new Date(),
    activeJobs: activeJobs.length,
  });
});

// Initialize cron jobs when app starts
app.listen(port, async () => {
  logger.info(`Server started on port ${port}`);
  try {
    await cronService.initializeJobs();
    logger.info("Cron jobs initialized successfully");
  } catch (error) {
    logger.error("Failed to initialize cron jobs:", error);
  }
});

// Global error handler
app.use((err, req, res, next) => {
  logger.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});
