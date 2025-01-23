require("dotenv").config({ path: "./config/default.env" });
const path = require("path");
const videoUploadService = require("../services/videoUploadService");
const FolderConfigModel = require("../models/folderConfigModel");
const logger = require("../utils/logger");

async function testManualUpload() {
  try {
    const configs = await FolderConfigModel.getActive();
    if (configs.length === 0) {
      throw new Error("No active folder configurations found");
    }

    const folderPath = path.join(configs[0].folder_path, "1-video");
    logger.info("Starting manual upload test from folder:", folderPath);

    const result = await videoUploadService.processVideoUpload(
      configs[0].id,
      folderPath
    );

    logger.info("Manual upload test completed:", result);
  } catch (error) {
    logger.error("Manual upload test failed:", error);
  }
}

testManualUpload();
