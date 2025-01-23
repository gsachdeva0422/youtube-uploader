class JobMonitor {
  constructor() {
    this.stats = {
      startTime: new Date(),
      jobsRun: 0,
      successfulUploads: 0,
      failedUploads: 0,
    };
  }

  logJobRun(success = true) {
    this.stats.jobsRun++;
    if (success) this.stats.successfulUploads++;
    else this.stats.failedUploads++;
  }

  getStats() {
    return {
      ...this.stats,
      uptime: Math.floor((new Date() - this.stats.startTime) / 1000),
    };
  }
}

module.exports = new JobMonitor();
