require("dotenv").config({ path: "./config/default.env" });
const VideoUploadService = require("../services/videoUploadService");
const FolderConfigModel = require("../models/folderConfigModel");
const logger = require("../utils/logger");

async function testVideoUpload() {
  try {
    // Get first active folder config
    const configs = await FolderConfigModel.getActive();
    if (configs.length === 0) {
      throw new Error("No active folder configurations found");
    }

    // Process first video folder in the config's path
    const result = await VideoUploadService.processVideoUpload(
      configs[0].id,
      process.env.BASE_VIDEOS_PATH + "/riddles-videos/1-video"
    );

    logger.info("Upload test result:", result);
  } catch (error) {
    logger.error("Upload test failed:", error);
  }
}

testVideoUpload();
