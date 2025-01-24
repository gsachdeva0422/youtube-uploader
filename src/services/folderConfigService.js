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

  static async getMetadataFromFolder(folderPath) {
    const folders = await fs.readdir(folderPath);
    const metadataFolders = [];

    for (const folder of folders) {
      const folderFullPath = path.join(folderPath, folder);
      const metadataPath = path.join(folderFullPath, "metadata.json");
      const thumbnailPath = path.join(folderFullPath, "thumbnail.jpg");

      if (fs.existsSync(metadataPath)) {
        const metadata = JSON.parse(await fs.readFile(metadataPath, "utf8"));
        metadataFolders.push({
          name: folder,
          metadata,
          thumbnailPath: fs.existsSync(thumbnailPath) ? thumbnailPath : null,
        });
      }
    }

    return metadataFolders;
  }

  static async archiveFolder(folderPath) {
    const archivePath = path.join(
      path.dirname(folderPath),
      "archive",
      path.basename(folderPath)
    );
    await fs.mkdir(archivePath, { recursive: true });
    await fs.rename(folderPath, archivePath);
  }
}

module.exports = FolderConfigService;
