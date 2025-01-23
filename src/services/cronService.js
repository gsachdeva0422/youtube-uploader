const schedule = require("node-schedule");
const logger = require("../utils/logger");
const VideoUploadService = require("./videoUploadService");
const fs = require("fs").promises;
const path = require("path");

class CronService {
  constructor() {
    this.jobs = new Map();
    this.processingFolders = new Set();
    this.lastStatus = new Map();
    this.quotaLimits = new Map();

    setInterval(() => {
      const status = {
        activeJobs: this.jobs.size,
        processingFolders: Array.from(this.processingFolders),
        quotaLimits: Object.fromEntries(this.quotaLimits),
        lastRun: Object.fromEntries(this.lastStatus),
      };
      logger.info("Cron Status:", status);
    }, 60000);
  }

  async initializeJobs() {
    try {
      this.cancelAllJobs();
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
          if (this.processingFolders.has(folderConfig.id)) {
            logger.info(
              `Previous job still running for ${folderConfig.folder_name}`
            );
            return;
          }

          const quotaLimit = this.quotaLimits.get(folderConfig.id);
          if (quotaLimit && quotaLimit > Date.now()) {
            logger.info(
              `Quota limit active for ${
                folderConfig.folder_name
              } until ${new Date(quotaLimit)}`
            );
            return;
          }

          this.processingFolders.add(folderConfig.id);
          this.lastStatus.set(folderConfig.id, new Date());

          try {
            await this.processFolder(folderConfig);
          } catch (error) {
            logger.error(
              `Error processing folder ${folderConfig.folder_name}:`,
              error
            );
          } finally {
            this.processingFolders.delete(folderConfig.id);
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

      const pendingFolders = folders
        .filter(
          (folder) =>
            !folder.startsWith(".") &&
            folder !== "archive" &&
            folder !== "Thumbs.db"
        )
        .sort((a, b) => {
          const numA = parseInt(a.split("-")[0]);
          const numB = parseInt(b.split("-")[0]);
          return numA - numB;
        });

      if (pendingFolders.length === 0) {
        logger.info(`No pending videos found in ${folderConfig.folder_name}`);
        return;
      }

      const nextFolder = pendingFolders[0];
      const fullPath = path.join(folderConfig.folder_path, nextFolder);

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
        const retryAfter = new Date(result.retryAfter).getTime();
        this.quotaLimits.set(folderConfig.id, retryAfter);
        logger.warn(
          `Quota exceeded for ${folderConfig.folder_name}, pausing until ${result.retryAfter}`
        );
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
    this.processingFolders.clear();
    this.quotaLimits.clear();
    logger.info("Cancelled all cron jobs");
  }

  getActiveJobs() {
    return {
      jobs: Array.from(this.jobs.keys()),
      processing: Array.from(this.processingFolders),
      quotaLimits: Object.fromEntries(this.quotaLimits),
    };
  }
}

module.exports = new CronService();
