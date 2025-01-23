const express = require("express");
const router = express.Router();
const youtubeService = require("../services/youtubeService");
const logger = require("../utils/logger");

router.get("/youtube", (req, res) => {
  const authUrl = youtubeService.getAuthUrl();
  res.redirect(authUrl);
});

router.get("/youtube/callback", async (req, res) => {
  try {
    const { code } = req.query;
    if (!code) {
      throw new Error("No authorization code received");
    }

    const tokens = await youtubeService.setTokens(code);

    logger.info("Successfully authenticated with YouTube");
    // Important: Show this to user so they can add it to their .env file
    logger.info("IMPORTANT: Add this refresh token to your .env file:", {
      refresh_token: tokens.refresh_token,
    });

    res.send(`
            <h1>Authentication successful!</h1>
            <p>Please check your console logs for the refresh token.</p>
            <p>Add this refresh token to your .env file as YOUTUBE_REFRESH_TOKEN</p>
            <p>You can close this window after copying the token.</p>
        `);
  } catch (error) {
    logger.error("Authentication failed:", error);
    res.status(500).send("Authentication failed: " + error.message);
  }
});

module.exports = router;
