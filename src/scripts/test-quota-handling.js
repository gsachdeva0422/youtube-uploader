// src/scripts/test-quota-handling.js
require("dotenv").config({ path: "./config/default.env" });
const VideoUploadService = require("../services/videoUploadService");
const FolderConfigModel = require("../models/folderConfigModel");
const logger = require("../utils/logger");

async function testQuotaHandling() {
  try {
    const configs = await FolderConfigModel.getActive();
    if (configs.length === 0) {
      throw new Error("No active folder configurations found");
    }

    const result = await VideoUploadService.processVideoUpload(
      configs[0].id,
      process.env.BASE_VIDEOS_PATH + "/riddles-videos/3-video"
    );

    if (result.quotaExceeded) {
      logger.info("Successfully detected quota exceeded", {
        retryAfter: result.retryAfter,
      });
    }
  } catch (error) {
    logger.error("Test failed:", error);
  }
}

testQuotaHandling();
