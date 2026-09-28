const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { spawn } = require("node:child_process");

const port = Number(process.env.PORT || 3000);
const gateway = spawn(process.execPath, [path.join(__dirname, "gateway", "server.js")], {
  env: {
    ...process.env,
    PORT: "5000",
    JWT_SECRET: process.env.JWT_SECRET || "govconnect-development-secret",
  },
  stdio: "inherit",
});

gateway.on("error", (error) => {
  console.error("Unable to start API gateway:", error.message);
});

const shutdown = () => {
  gateway.kill("SIGTERM");
  process.exit(0);
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
const publicDir = path.join(__dirname, "frontend");
const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
};

const server = http.createServer((request, response) => {
  const requestedPath = decodeURIComponent(request.url.split("?")[0]);
  const relativePath = requestedPath === "/" ? "/index.html" : requestedPath;
  const filePath = path.normalize(path.join(publicDir, relativePath));

  if (!filePath.startsWith(`${publicDir}${path.sep}`)) {
    response.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Bad request");
    return;
  }

  fs.readFile(filePath, (error, file) => {
    if (error) {
      response.writeHead(error.code === "ENOENT" ? 404 : 500, {
        "Content-Type": "text/plain; charset=utf-8",
      });
      response.end(error.code === "ENOENT" ? "Not found" : "Internal server error");
      return;
    }

    response.writeHead(200, {
      "Content-Type": contentTypes[path.extname(filePath)] || "application/octet-stream",
      "Cache-Control": "no-cache",
    });
    response.end(file);
  });
});

server.listen(port, "0.0.0.0", () => {
  console.log(`GovConnect frontend listening on port ${port}`);
});
