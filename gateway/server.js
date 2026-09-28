const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { spawn } = require("node:child_process");

// ===============================
// CONFIGURATION
// ===============================

const port = Number(process.env.PORT || 3000);

const JWT_SECRET =
  process.env.JWT_SECRET || "govconnect-development-secret";

// ===============================
// BACKEND SERVICES
// ===============================

const services = [
  {
    name: "housing",
    file: "housing-service/server.js",
    port: "5001",
  },
  {
    name: "income",
    file: "income-service/server.js",
    port: "5002",
  },
  {
    name: "land",
    file: "land-service/server.js",
    port: "5003",
  },
  {
    name: "gateway",
    file: "gateway/server.js",
    port: "5000",
  },
];

const children = [];

// ===============================
// START ALL SERVICES
// ===============================

for (const service of services) {
  console.log(
    `Starting ${service.name} service on port ${service.port}...`
  );

  const child = spawn(
    process.execPath,
    [path.join(__dirname, service.file)],
    {
      env: {
        ...process.env,

        // Port for each service
        PORT: service.port,

        // Same JWT secret everywhere
        JWT_SECRET,
      },

      // Show service logs in same terminal
      stdio: "inherit",
    }
  );

  child.on("error", (error) => {
    console.error(
      `Unable to start ${service.name} service:`,
      error.message
    );
  });

  child.on("exit", (code, signal) => {
    if (code !== 0 && signal !== "SIGTERM") {
      console.error(
        `${service.name} service stopped.`,
        `code=${code}, signal=${signal || "none"}`
      );
    }
  });

  children.push(child);
}

// ===============================
// GRACEFUL SHUTDOWN
// ===============================

const shutdown = () => {
  console.log("\nStopping all services...");

  for (const child of children) {
    if (!child.killed) {
      child.kill("SIGTERM");
    }
  }

  process.exit(0);
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

// ===============================
// FRONTEND STATIC SERVER
// ===============================

const publicDir = path.join(__dirname, "frontend");

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

// ===============================
// HTTP SERVER
// ===============================

const server = http.createServer((request, response) => {
  try {
    const requestedPath = decodeURIComponent(
      request.url.split("?")[0]
    );

    // =========================================
    // API PROXY
    // =========================================

    if (
      requestedPath === "/auth/login" ||
      requestedPath.startsWith("/api/")
    ) {
      const proxyRequest = http.request(
        {
          hostname: "127.0.0.1",
          port: 5000,

          path: request.url,

          method: request.method,

          headers: {
            ...request.headers,

            // Make sure gateway receives correct host
            host: "127.0.0.1:5000",
          },
        },

        (proxyResponse) => {
          response.writeHead(
            proxyResponse.statusCode || 502,
            proxyResponse.headers
          );

          proxyResponse.pipe(response);
        }
      );

      proxyRequest.on("error", (error) => {
        console.error(
          "API gateway proxy error:",
          error.message
        );

        if (!response.headersSent) {
          response.writeHead(502, {
            "Content-Type": "application/json",
          });
        }

        response.end(
          JSON.stringify({
            message: "API gateway unavailable",
          })
        );
      });

      request.pipe(proxyRequest);

      return;
    }

    // =========================================
    // FRONTEND FILE
    // =========================================

    const relativePath =
      requestedPath === "/"
        ? "/index.html"
        : requestedPath;

    const filePath = path.normalize(
      path.join(publicDir, relativePath)
    );

    // =========================================
    // SECURITY CHECK
    // Prevent ../ path traversal
    // =========================================

    if (
      !filePath.startsWith(
        `${publicDir}${path.sep}`
      )
    ) {
      response.writeHead(400, {
        "Content-Type": "text/plain; charset=utf-8",
      });

      response.end("Bad request");

      return;
    }

    // =========================================
    // READ FRONTEND FILE
    // =========================================

    fs.readFile(filePath, (error, file) => {
      if (error) {
        console.error(
          "Frontend file error:",
          error.message
        );

        response.writeHead(
          error.code === "ENOENT" ? 404 : 500,
          {
            "Content-Type":
              "text/plain; charset=utf-8",
          }
        );

        response.end(
          error.code === "ENOENT"
            ? "Not found"
            : "Internal server error"
        );

        return;
      }

      const extension =
        path.extname(filePath).toLowerCase();

      response.writeHead(200, {
        "Content-Type":
          contentTypes[extension] ||
          "application/octet-stream",

        "Cache-Control": "no-cache",
      });

      response.end(file);
    });
  } catch (error) {
    console.error("Server error:", error);

    if (!response.headersSent) {
      response.writeHead(500, {
        "Content-Type": "application/json",
      });
    }

    response.end(
      JSON.stringify({
        message: "Internal server error",
      })
    );
  }
});

// ===============================
// START FRONTEND SERVER
// ===============================

server.listen(
  port,
  "0.0.0.0",
  () => {
    console.log("");
    console.log("======================================");
    console.log("       GOVCONNECT STARTED");
    console.log("======================================");
    console.log(`Frontend: http://localhost:${port}`);
    console.log("Gateway:  http://localhost:5000");
    console.log("Housing:  http://localhost:5001");
    console.log("Income:   http://localhost:5002");
    console.log("Land:     http://localhost:5003");
    console.log("======================================");
    console.log("");
  }
);