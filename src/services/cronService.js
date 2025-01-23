const schedule = require("node-schedule");
const logger = require("../utils/logger");
const VideoUploadService = require("./videoUploadService");
const fs = require("fs").promises;
const path = require("path");

class CronService {
  constructor() {
    this.jobs = new Map();
    this.lastStatus = new Map(); // Track job status
    this.isProcessing = false;

    // Log status every minute
    setInterval(() => {
      const status = {
        activeJobs: this.jobs.size,
        isProcessing: this.isProcessing,
        lastRun: this.lastStatus,
      };
      logger.info("Cron Status:", status);
    }, 60000);
  }

  async initializeJobs() {
    try {
      // Cancel any existing jobs
      this.cancelAllJobs();

      // Get active folder configurations
      const FolderConfigService = require("./folderConfigService");
      const configs = await FolderConfigService.getActiveFolderConfigs();

      for (const config of configs) {
        await this.scheduleJob(config);
      }

      logger.info(`Initialized ${this.jobs.size} cron jobs`);
    } catch (error) {
      logger.error("Error initializing cron jobs:", error);
      throw error;
    }
  }

  async scheduleJob(folderConfig) {
    try {
      const job = schedule.scheduleJob(
        folderConfig.cron_expression,
        async () => {
          if (this.isProcessing) {
            logger.info(
              `Previous job still running for ${folderConfig.folder_name}, skipping this run`
            );
            return;
          }

          this.isProcessing = true;
          logger.info(
            `Starting scheduled job for folder: ${folderConfig.folder_name}`
          );

          try {
            await this.processFolder(folderConfig);
          } catch (error) {
            logger.error(
              `Error processing folder ${folderConfig.folder_name}:`,
              error
            );
          } finally {
            this.isProcessing = false;
          }
        }
      );

      this.jobs.set(folderConfig.id, job);
      logger.info(`Scheduled job for folder: ${folderConfig.folder_name}`);
    } catch (error) {
      logger.error(
        `Error scheduling job for folder ${folderConfig.folder_name}:`,
        error
      );
      throw error;
    }
  }

  async processFolder(folderConfig) {
    try {
      const VideoUploadModel = require("../models/videoUploadModel");
      const folders = await fs.readdir(folderConfig.folder_path);

      // Filter out 'archive' folder, .DS_Store and other hidden files
      const pendingFolders = folders
        .filter((folder) => {
          return (
            folder !== "archive" &&
            !folder.startsWith(".") && // Filters .DS_Store and other hidden files
            folder !== "Thumbs.db"
          ); // Windows thumbnail file
        })
        .sort((a, b) => {
          const numA = parseInt(a.split("-")[0]);
          const numB = parseInt(b.split("-")[0]);
          return numA - numB;
        });

      if (pendingFolders.length === 0) {
        logger.info(`No pending videos found in ${folderConfig.folder_name}`);
        return;
      }

      // Process the first folder (lowest number)
      const nextFolder = pendingFolders[0];
      const fullPath = path.join(folderConfig.folder_path, nextFolder);

      // Check if video already exists in database
      const videoFiles = await fs.readdir(fullPath);
      const videoFile = videoFiles.find((file) => file.endsWith(".mp4"));

      if (!videoFile) {
        logger.warn(`No video file found in folder: ${fullPath}`);
        return;
      }

      const videoPath = path.join(fullPath, videoFile);
      const existingUpload = await VideoUploadModel.findByVideoPath(videoPath);

      if (existingUpload) {
        logger.warn(
          `Skipping video ${videoFile} - already uploaded with ID: ${existingUpload.youtube_video_id}`
        );
        return;
      }

      logger.info(`Processing video from folder: ${nextFolder}`);
      const result = await VideoUploadService.processVideoUpload(
        folderConfig.id,
        fullPath
      );

      if (result.quotaExceeded) {
        logger.warn(
          `Stopping cron job until ${result.retryAfter} due to quota limits`
        );
        this.pauseUntil = result.retryAfter;
        return;
      }
    } catch (error) {
      logger.error(
        `Error processing folder ${folderConfig.folder_name}:`,
        error
      );
    }
  }

  cancelAllJobs() {
    for (const [id, job] of this.jobs) {
      job.cancel();
    }
    this.jobs.clear();
    this.isProcessing = false; // Reset processing flag
    logger.info("Cancelled all cron jobs");
  }

  getActiveJobs() {
    return Array.from(this.jobs.keys());
  }
}

module.exports = new CronService();
