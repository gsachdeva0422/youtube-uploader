const FolderConfigModel = require("../models/folderConfigModel");
const logger = require("../utils/logger");
const path = require("path");
const fs = require("fs").promises;

class FolderConfigService {
  static async validateAndCreateFolderConfig(
    folderName,
    folderPath,
    cronExpression
  ) {
    try {
      // Validate folder path exists
      await fs.access(folderPath);

      // Check if archive folder exists, if not create it
      const archivePath = path.join(folderPath, "archive");
      try {
        await fs.access(archivePath);
      } catch {
        await fs.mkdir(archivePath);
        logger.info(`Created archive directory at: ${archivePath}`);
      }

      // Create folder configuration in database
      const config = await FolderConfigModel.create(
        folderName,
        folderPath,
        cronExpression
      );
      logger.info(`Created folder configuration for: ${folderName}`);

      return config;
    } catch (error) {
      logger.error("Error in folder configuration creation:", error);
      throw error;
    }
  }

  static async getActiveFolderConfigs() {
    try {
      return await FolderConfigModel.getActive();
    } catch (error) {
      logger.error("Error getting active folder configurations:", error);
      throw error;
    }
  }
}

module.exports = FolderConfigService;
