const fs = require("fs").promises;
const path = require("path");
const logger = require("../utils/logger");
const VideoUploadModel = require("../models/videoUploadModel");
const { YouTubeService } = require("./youtubeService");

class VideoUploadService {
  constructor() {
    this.youtubeService = new YouTubeService();
  }

  async processVideoUpload(folderConfigId, videoFolderPath) {
    // Remove static
    let videoName = null;
    let videoPath = null;
    let metadata = null;

    try {
      // Read metadata.json
      const metadataPath = path.join(videoFolderPath, "metadata.json");
      metadata = JSON.parse(await fs.readFile(metadataPath, "utf8"));

      // Get video file
      const videoFiles = await fs.readdir(videoFolderPath);
      const videoFile = videoFiles.find((file) => file.endsWith(".mp4"));
      if (!videoFile) {
        throw new Error("No video file found in folder");
      }

      videoPath = path.join(videoFolderPath, videoFile);
      videoName = path.basename(videoFile);

      // Check for thumbnail (both PNG and JPG)
      const thumbnailFile = videoFiles.find(
        (file) => file.endsWith(".png") || file.endsWith(".jpg")
      );
      if (thumbnailFile) {
        metadata.thumbnailPath = path.join(videoFolderPath, thumbnailFile);
        logger.info(`Found thumbnail: ${thumbnailFile}`);
      }

      // Upload to YouTube
      const uploadResult = await this.youtubeService.uploadVideo(
        videoPath,
        metadata
      );
      logger.info("Upload completed:", {
        videoId: uploadResult.videoId,
        testMode: uploadResult.testMode,
      });

      // Create success entry in database
      const uploadEntry = await VideoUploadModel.createUploadEntry(
        folderConfigId,
        videoName,
        videoPath,
        metadata
      );

      // Update database with success
      await VideoUploadModel.updateUploadSuccess(
        uploadResult.id,
        uploadResult.videoId
      );

      // Move to archive
      try {
        const archivePath = path.join(
          path.dirname(videoFolderPath),
          "archive",
          path.basename(videoFolderPath)
        );

        // Create archive directory if it doesn't exist
        await fs.mkdir(archivePath, { recursive: true });

        // Read all files in source directory
        const files = await fs.readdir(videoFolderPath);

        // Move each file individually
        for (const file of files) {
          const sourcePath = path.join(videoFolderPath, file);
          const destPath = path.join(archivePath, file);
          await fs.rename(sourcePath, destPath);
          logger.info(`Moved file to archive: ${file}`);
        }

        // Remove the now-empty source directory
        await fs.rmdir(videoFolderPath);

        logger.info("Successfully moved files to archive:", {
          sourceDir: videoFolderPath,
          archiveDir: archivePath,
          fileCount: files.length,
        });
      } catch (archiveError) {
        logger.error("Error moving files to archive:", archiveError);
        // Don't throw error since upload was successful
      }

      return uploadResult;
    } catch (error) {
      logger.error("Error in video upload process:", error);
      if (folderConfigId && videoName) {
        await VideoUploadModel.createFailureEntry(
          folderConfigId,
          videoName,
          videoPath || "unknown",
          error.message,
          metadata || {}
        );
      }
      throw error;
    }
  }
}

module.exports = new VideoUploadService();
