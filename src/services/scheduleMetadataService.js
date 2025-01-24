const path = require("path");
const fs = require("fs"); // For existsSync
const fsPromises = require("fs").promises; // For async operations

class ScheduleMetadataService {
  static async getMetadataFromFolder(folderPath) {
    const folders = await fsPromises.readdir(folderPath);
    const metadataFolders = [];

    for (const folder of folders) {
      const folderFullPath = path.join(folderPath, folder);
      const metadataPath = path.join(folderFullPath, "metadata.json");
      const thumbnailPath = path.join(folderFullPath, "thumbnail.jpg");

      if (fs.existsSync(metadataPath)) {
        const metadata = JSON.parse(
          await fsPromises.readFile(metadataPath, "utf8")
        );
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
    await fsPromises.mkdir(archivePath, { recursive: true });
    await fsPromises.rename(folderPath, archivePath);
  }
}

module.exports = ScheduleMetadataService;
