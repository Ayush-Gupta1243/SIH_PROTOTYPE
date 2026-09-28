const fs = require("fs");
const path = require("path");

const logDirectory = path.join(__dirname, "..", "logs");
const logFile = path.join(logDirectory, "audit.log");

// Create logs directory if it doesn't exist
if (!fs.existsSync(logDirectory)) {
    fs.mkdirSync(logDirectory, { recursive: true });
}

function auditLogger(req, res, next) {

    const startTime = Date.now();

    res.on("finish", () => {

        const logEntry = {
            timestamp: new Date().toISOString(),
            method: req.method,
            endpoint: req.originalUrl,
            statusCode: res.statusCode,
            citizenId: req.user?.citizenId || "anonymous",
            role: req.user?.role || "anonymous",
            ip: req.ip,
            responseTime: `${Date.now() - startTime}ms`
        };

        fs.appendFile(
            logFile,
            JSON.stringify(logEntry) + "\n",
            (error) => {

                if (error) {
                    console.error(
                        "Audit logging error:",
                        error.message
                    );
                }
            }
        );
    });

    next();
}

module.exports = auditLogger;