require("dotenv").config({ path: "./config/default.env" });
const logger = require("../utils/logger");
const FolderConfigModel = require("../models/folderConfigModel");
const VideoUploadModel = require("../models/videoUploadModel");

async function monitorCron() {
  try {
    console.log("\n=== Cron Job Monitor ===");

    // Check folder configs
    const configs = await FolderConfigModel.getActive();
    console.log(`\nActive Folder Configurations (${configs.length}):`);
    configs.forEach((c) =>
      console.log(`- ${c.folder_name}: ${c.cron_expression}`)
    );

    // Check recent uploads
    const uploads = await VideoUploadModel.getRecent();
    console.log("\nRecent Uploads:");
    uploads.forEach((u) =>
      console.log(
        `- ${u.video_name}: ${u.status} (${u.youtube_video_id || "pending"})`
      )
    );
  } catch (error) {
    console.error("Monitor error:", error);
  }
}

// Run initially and every 30 seconds
monitorCron();
setInterval(monitorCron, 30000);
