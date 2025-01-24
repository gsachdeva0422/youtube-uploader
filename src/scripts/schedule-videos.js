// scripts/schedule-videos.js
const logger = require("../utils/logger");
const {
  parseScheduleInterval,
  generateScheduleTimes,
} = require("../utils/scheduleUtils");
const {
  getMetadataFromFolder,
  archiveFolder,
} = require("../services/scheduleMetadataService");

// At the top of schedule-videos.js
require("dotenv").config({ path: "./config/default.env" });
const { YouTubeService } = require("../services/youtubeService");
const youtubeService = new YouTubeService();

async function scheduleVideos(folderPaths, firstVideoTime, interval) {
  try {
    // 1. Get all draft videos from YouTube
    const allVideos = await youtubeService.listAllVideos({ status: "draft" });

    console.log(
      "Found videos:",
      allVideos.map((v) => v)
    );

    console.log("Processing folders:", folderPaths);
    // 2. Process each folder
    for (const folderPath of folderPaths) {
      console.log("Processing folder:", folderPath);
      const metadataFolders = await getMetadataFromFolder(folderPath);
      console.log("metadataFolders:", metadataFolders);
      // Generate schedule times
      const parsedInterval = parseScheduleInterval(interval);
      let scheduleTime = new Date(firstVideoTime);

      for (const folder of metadataFolders) {
        const folderName = folder.name;
        const metadata = folder.metadata;

        console.log("Processing folder:", folderName);
        console.log("Processing folder:metadata", metadata);

        // Find matching video
        const video = allVideos.find((v) => v.snippet.title === folderName);
        if (!video) {
          logger.error(`No matching video found for ${folderName}`);
          continue;
        }

        // Use metadata's publishAt or next schedule time
        const publishTime = metadata.publishAt || scheduleTime.toISOString();

        // Update video with metadata and schedule
        await youtubeService.updateVideo(video.id?.videoId || video.videoId, {
          title: metadata.title,
          description: metadata.description,
          tags: metadata.tags,
          thumbnailPath: folder.thumbnailPath,
          privacyStatus: "private",
          publishAt: publishTime,
        });

        // Update schedule time for next video if not using metadata's publishAt
        if (!metadata.publishAt) {
          scheduleTime = generateScheduleTimes(scheduleTime, parsedInterval);
        }
      }

      // Archive processed folder
      await archiveFolder(folderPath);
    }
  } catch (error) {
    logger.error("Error in scheduling videos:", error);
    throw error;
  }
}

// CLI handling
const args = require("yargs")
  .option("folders", {
    array: true,
    describe: "Folder paths to process",
    demandOption: true,
  })
  .option("startTime", {
    describe: "Schedule time for first video",
    demandOption: true,
  })
  .option("interval", {
    describe: "Interval between videos (e.g. 2h30m, 1d4h)",
    demandOption: true,
  }).argv;

scheduleVideos(args.folders, args.startTime, args.interval);
