require("dotenv").config({ path: "./config/default.env" });
const fs = require("fs");
const path = require("path");

function tailLog(logFile) {
  const logPath = path.join(__dirname, "../../logs", logFile);

  if (!fs.existsSync(logPath)) {
    fs.writeFileSync(logPath, "");
  }

  console.log(`Monitoring ${logFile}...`);

  let buffer = "";
  fs.watchFile(logPath, () => {
    const data = fs.readFileSync(logPath, "utf8");
    const lines = data.split("\n");
    const newLines = lines.slice(-10); // Show last 10 lines

    newLines.forEach((line) => {
      if (line.trim()) {
        try {
          const parsed = JSON.parse(line);
          console.clear();
          console.log(
            `${parsed.timestamp} [${parsed.level}]: ${parsed.message}`
          );
          if (parsed.stack) console.log(parsed.stack);
        } catch (e) {
          // Ignore parse errors
        }
      }
    });
  });
}

["error.log", "combined.log"].forEach(tailLog);
