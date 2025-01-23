require("dotenv").config({ path: "./config/default.env" });
const fs = require("fs");
const path = require("path");

function tailLog(logFile) {
  const logPath = path.join(__dirname, "../../logs", logFile);

  if (!fs.existsSync(logPath)) {
    fs.writeFileSync(logPath, "");
  }

  let lastSize = 0;
  console.log(`Monitoring ${logFile}...`);

  setInterval(() => {
    const stats = fs.statSync(logPath);
    if (stats.size > lastSize) {
      const stream = fs.createReadStream(logPath, {
        start: lastSize,
        end: stats.size,
      });

      stream.on("data", (data) => {
        const lines = data.toString().split("\n");
        lines.forEach((line) => {
          if (line.trim()) {
            try {
              const parsed = JSON.parse(line);
              console.log(
                `${parsed.timestamp} [${parsed.level}]: ${parsed.message}`
              );
            } catch (e) {
              console.log(line);
            }
          }
        });
      });

      lastSize = stats.size;
    }
  }, 1000);
}

tailLog("combined.log");
