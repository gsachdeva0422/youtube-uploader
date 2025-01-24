const { google } = require("googleapis");
const fs = require("fs");
const path = require("path");
const logger = require("../utils/logger");
const rateLimiter = require("../utils/rateLimiter");

class YouTubeService {
  constructor() {
    console.log("YouTube credentials check:", {
      hasClientId: !!process.env.YOUTUBE_CLIENT_ID,
      hasClientSecret: !!process.env.YOUTUBE_CLIENT_SECRET,
      hasRedirectUri: !!process.env.YOUTUBE_REDIRECT_URI,
      hasRefreshToken: !!process.env.YOUTUBE_REFRESH_TOKEN,
    });
    this.oauth2Client = new google.auth.OAuth2(
      process.env.YOUTUBE_CLIENT_ID,
      process.env.YOUTUBE_CLIENT_SECRET,
      process.env.YOUTUBE_REDIRECT_URI
    );

    console.log("Setting refresh token...");
    if (process.env.YOUTUBE_REFRESH_TOKEN) {
      this.oauth2Client.setCredentials({
        refresh_token: process.env.YOUTUBE_REFRESH_TOKEN,
      });
    }

    try {
      this.youtube = google.youtube({
        version: "v3",
        auth: this.oauth2Client,
      });
      console.log("YouTube client initialized successfully");
    } catch (error) {
      console.error("Failed to initialize YouTube client:", error);
      throw error;
    }

    this.rateLimiter = rateLimiter;
    this.maxRetries = 3;
    this.retryDelay = 5000;

    // Add test mode flag
    this.testMode = process.env.NODE_ENV === "development";
  }

  async uploadVideo(videoPath, metadata, attempt = 1) {
    try {
      await this.rateLimiter.canMakeRequest();

      logger.info("Starting YouTube upload process:", {
        videoPath,
        attempt,
        maxAttempts: this.maxRetries,
      });

      // In test mode, simulate upload without calling YouTube API
      if (this.testMode) {
        logger.info("Test mode: Simulating successful upload");
        await new Promise((resolve) => setTimeout(resolve, 2000)); // Simulate upload time

        return {
          success: true,
          videoId: `TEST-${Date.now()}`,
          testMode: true,
        };
      }

      const fileSize = fs.statSync(videoPath).size;
      logger.info("Video file stats:", {
        path: videoPath,
        size: fileSize,
      });

      const response = await this.youtube.videos.insert({
        part: ["snippet", "status"],
        requestBody: {
          snippet: {
            title: metadata.title,
            description: metadata.description,
            tags: metadata.tags || [],
          },
          status: {
            privacyStatus: metadata.privacyStatus || "private",
          },
        },
        media: {
          body: fs.createReadStream(videoPath),
        },
      });

      const videoId = response.data.id;
      logger.info("Video uploaded successfully:", { videoId });

      // Handle thumbnail if exists
      if (metadata.thumbnailPath) {
        try {
          await this.youtube.thumbnails.set({
            videoId: videoId,
            media: {
              body: fs.createReadStream(metadata.thumbnailPath),
            },
          });
          logger.info("Thumbnail uploaded successfully");
        } catch (thumbnailError) {
          logger.error("Error uploading thumbnail:", thumbnailError);
          // Don't fail the whole upload if thumbnail fails
        }
      }

      return {
        success: true,
        videoId: videoId,
      };
    } catch (error) {
      if (error.response?.status === 503 && attempt < this.maxRetries) {
        const delay = this.retryDelay * Math.pow(2, attempt - 1);
        logger.warn(`Upload failed, retrying in ${delay}ms...`, {
          attempt,
          maxRetries: this.maxRetries,
        });

        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.uploadVideo(videoPath, metadata, attempt + 1);
      }

      if (
        error.response?.data?.error?.errors?.[0]?.reason === "quotaExceeded"
      ) {
        throw new QuotaExceededError("Daily YouTube API quota exceeded");
      }

      logger.error("Error in YouTube upload:", error);
      if (error.response) {
        logger.error("YouTube API Error Response:", {
          status: error.response.status,
          data: error.response.data,
        });
      }
      throw error;
    }
  }

  async listAllVideos(params) {
    return this.youtube.search
      .list({
        part: ["snippet"],
        forMine: true,
        type: "video",
        maxResults: 50,
      })
      .then((response) => response.data.items);
  }

  async updateVideo(
    videoId,
    { title, description, tags, thumbnailPath, privacyStatus, publishAt }
  ) {
    console.log("Updating video:", videoId);
    console.log("Updating video:publishAt", publishAt);
    return this.youtube.videos.update({
      part: ["snippet", "status"],
      requestBody: {
        id: videoId,
        snippet: {
          categoryId: "22", // Required field
          title: title,
          description: description,
          tags: tags,
        },
        status: {
          privacyStatus: privacyStatus,
          publishAt: publishAt,
        },
      },
    });
  }
}

class QuotaExceededError extends Error {
  constructor(message) {
    super(message);
    this.name = "QuotaExceededError";
  }
}

module.exports = {
  YouTubeService,
  QuotaExceededError,
};
