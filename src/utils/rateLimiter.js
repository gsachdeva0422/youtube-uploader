const logger = require("./logger");

class RateLimiter {
  constructor(maxRequests = 10, timeWindow = 60000) {
    // 10 requests per minute by default
    this.maxRequests = maxRequests;
    this.timeWindow = timeWindow;
    this.requests = [];
  }

  async canMakeRequest() {
    const now = Date.now();
    // Remove old requests
    this.requests = this.requests.filter(
      (time) => now - time < this.timeWindow
    );

    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = this.requests[0];
      const waitTime = this.timeWindow - (now - oldestRequest);
      logger.info(
        `Rate limit reached. Waiting ${waitTime}ms before next request`
      );
      await new Promise((resolve) => setTimeout(resolve, waitTime));
      return this.canMakeRequest();
    }

    this.requests.push(now);
    return true;
  }

  reset() {
    this.requests = [];
  }
}

module.exports = new RateLimiter();
