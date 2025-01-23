require("dotenv").config({ path: "./config/default.env" });
const FolderConfigService = require("../services/folderConfigService");
const logger = require("../utils/logger");

async function testFolderConfig() {
  try {
    // Test creating folder configurations
    const riddlesConfig =
      await FolderConfigService.validateAndCreateFolderConfig(
        "riddles-videos",
        process.env.BASE_VIDEOS_PATH + "/riddles-videos",
        "0 */3 * * *" // Every 3 hours
      );
    logger.info("Created riddles folder config:", riddlesConfig);

    const riddlesShortsConfig =
      await FolderConfigService.validateAndCreateFolderConfig(
        "riddles-shorts",
        process.env.BASE_VIDEOS_PATH + "/riddles-shorts",
        "0 */4 * * *" // Every 4 hours
      );
    logger.info("Created riddles-shorts folder config:", riddlesShortsConfig);

    // Test getting active configurations
    const activeConfigs = await FolderConfigService.getActiveFolderConfigs();
    logger.info("Active configurations:", activeConfigs);
  } catch (error) {
    logger.error("Test failed:", error);
  }
}

testFolderConfig();
