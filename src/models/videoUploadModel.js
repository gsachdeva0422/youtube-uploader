const db = require("../utils/database");
const logger = require("../utils/logger");

class VideoUploadModel {
  static async createUploadEntry(
    folderConfigId,
    videoName,
    videoPath,
    metadata
  ) {
    const query = `
            INSERT INTO video_uploads (
                folder_config_id, 
                video_name, 
                video_path, 
                status,
                metadata,
                upload_started_at
            )
            VALUES ($1, $2, $3, 'in_progress', $4, CURRENT_TIMESTAMP)
            RETURNING *
        `;

    try {
      const result = await db.query(query, [
        folderConfigId,
        videoName,
        videoPath,
        metadata,
      ]);
      return result.rows[0];
    } catch (error) {
      logger.error("Error creating video upload entry:", error);
      throw error;
    }
  }

  static async updateUploadSuccess(id, youtubeVideoId) {
    const query = `
            UPDATE video_uploads 
            SET status = 'completed',
                youtube_video_id = $1,
                upload_completed_at = CURRENT_TIMESTAMP
            WHERE id = $2
            RETURNING *
        `;

    try {
      const result = await db.query(query, [youtubeVideoId, id]);
      return result.rows[0];
    } catch (error) {
      logger.error("Error updating video upload success:", error);
      throw error;
    }
  }

  static async createFailureEntry(
    folderConfigId,
    videoName,
    videoPath,
    errorMessage,
    metadata
  ) {
    const query = `
        INSERT INTO upload_failures (
            folder_config_id,
            video_name,
            video_path,
            error_message,
            status,
            metadata
        )
        VALUES ($1, $2, $3, $4, 'failed', $5)
        RETURNING *
    `;

    try {
      const result = await db.query(query, [
        folderConfigId,
        videoName,
        videoPath,
        errorMessage,
        metadata || {},
      ]);
      return result.rows[0];
    } catch (error) {
      logger.error("Error creating failure entry:", error);
      throw error;
    }
  }

  static async updateRetryAttempt(id) {
    const query = `
            UPDATE upload_failures
            SET retry_count = retry_count + 1,
                last_retry_at = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING *
        `;

    try {
      const result = await db.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      logger.error("Error updating retry attempt:", error);
      throw error;
    }
  }

  static async findByVideoPath(videoPath) {
    const query = `
        SELECT * FROM video_uploads 
        WHERE video_path = $1 AND status = 'completed'
        LIMIT 1
    `;
    try {
      const result = await db.query(query, [videoPath]);
      return result.rows[0];
    } catch (error) {
      logger.error("Error finding video by path:", error);
      throw error;
    }
  }

  static async findSuccessfulUpload(videoPath) {
    const query = `
        SELECT * FROM video_uploads 
        WHERE video_path = $1 AND status = 'completed'
        LIMIT 1
    `;
    try {
      const result = await db.query(query, [videoPath]);
      return result.rows[0];
    } catch (error) {
      logger.error("Error finding successful upload:", error);
      throw error;
    }
  }
}

module.exports = VideoUploadModel;
