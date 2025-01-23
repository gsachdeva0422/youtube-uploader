const db = require("../utils/database");
const logger = require("../utils/logger");

class FolderConfigModel {
  static async create(folderName, folderPath, cronExpression) {
    const query = `
            INSERT INTO folder_configurations (folder_name, folder_path, cron_expression)
            VALUES ($1, $2, $3)
            RETURNING *
        `;
    try {
      const result = await db.query(query, [
        folderName,
        folderPath,
        cronExpression,
      ]);
      return result.rows[0];
    } catch (error) {
      logger.error("Error creating folder configuration:", error);
      throw error;
    }
  }

  static async getActive() {
    const query = `
            SELECT * FROM folder_configurations 
            WHERE is_active = true
            ORDER BY created_at DESC
        `;
    try {
      const result = await db.query(query);
      return result.rows;
    } catch (error) {
      logger.error("Error getting active folder configurations:", error);
      throw error;
    }
  }

  static async getById(id) {
    const query = "SELECT * FROM folder_configurations WHERE id = $1";
    try {
      const result = await db.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      logger.error("Error getting folder configuration:", error);
      throw error;
    }
  }
}

module.exports = FolderConfigModel;
