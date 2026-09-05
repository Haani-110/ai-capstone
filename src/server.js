import { createServer } from "node:http";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validateSettings } from "./validateSettings.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const PUBLIC_DIR = path.join(ROOT, "public");
const VALIDATION_MODULE = path.join(__dirname, "validateSettings.js");
const DEFAULT_SETTINGS_PATH = path.join(ROOT, "data", "settings.json");
const PORT = process.env.PORT || 3000;
const MAX_BODY_BYTES = 10 * 1024;

const MIME_TYPES = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "text/javascript",
  ".json": "application/json",
};

export async function readSettings(settingsPath = DEFAULT_SETTINGS_PATH) {
  if (!existsSync(settingsPath)) {
    return null;
  }

  try {
    const raw = await readFile(settingsPath, "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function saveSettings(data, settingsPath = DEFAULT_SETTINGS_PATH) {
  await mkdir(path.dirname(settingsPath), { recursive: true });
  await writeFile(settingsPath, JSON.stringify(data, null, 2));
}

function sendJson(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}

async function readRequestBody(req, maxBytes = MAX_BODY_BYTES) {
  let body = "";
  let totalBytes = 0;

  for await (const chunk of req) {
    totalBytes += chunk.length;
    if (totalBytes > maxBytes) {
      throw new Error("BODY_TOO_LARGE");
    }
    body += chunk;
  }

  return body;
}

async function serveStatic(req, res) {
  const urlPath = req.url === "/" ? "/index.html" : req.url.split("?")[0];
  const filePath = path.join(PUBLIC_DIR, urlPath);

  if (!filePath.startsWith(PUBLIC_DIR)) {
    sendJson(res, 403, { error: "Forbidden" });
    return;
  }

  try {
    const content = await readFile(filePath);
    const ext = path.extname(filePath);
    res.writeHead(200, { "Content-Type": MIME_TYPES[ext] || "text/plain" });
    res.end(content);
  } catch {
    sendJson(res, 404, { error: "Not found" });
  }
}

async function serveValidationModule(res) {
  try {
    const content = await readFile(VALIDATION_MODULE);
    res.writeHead(200, { "Content-Type": "text/javascript" });
    res.end(content);
  } catch {
    sendJson(res, 500, { error: "Validation module unavailable." });
  }
}

export function createRequestHandler(options = {}) {
  const settingsPath = options.settingsPath ?? DEFAULT_SETTINGS_PATH;

  return async function handleRequest(req, res) {
    if (req.method === "GET" && req.url === "/api/settings") {
      const settings = await readSettings(settingsPath);
      sendJson(res, 200, { settings });
      return;
    }

    if (req.method === "POST" && req.url === "/api/settings") {
      let body;

      try {
        body = await readRequestBody(req, options.maxBodyBytes ?? MAX_BODY_BYTES);
      } catch (error) {
        if (error.message === "BODY_TOO_LARGE") {
          sendJson(res, 413, { error: "Request body is too large." });
          return;
        }
        sendJson(res, 400, { error: "Unable to read request body." });
        return;
      }

      let parsed;
      try {
        parsed = JSON.parse(body);
      } catch {
        sendJson(res, 400, { error: "Invalid JSON body." });
        return;
      }

      const result = validateSettings(parsed);
      if (!result.valid) {
        sendJson(res, 422, { errors: result.errors });
        return;
      }

      try {
        await saveSettings(result.data, settingsPath);
      } catch {
        sendJson(res, 500, { error: "Unable to save settings." });
        return;
      }

      sendJson(res, 200, { settings: result.data });
      return;
    }

    if (req.method === "GET" && req.url === "/validateSettings.js") {
      await serveValidationModule(res);
      return;
    }

    if (req.method === "GET") {
      await serveStatic(req, res);
      return;
    }

    sendJson(res, 405, { error: "Method not allowed" });
  };
}

const server = createServer(createRequestHandler());

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  server.listen(PORT, () => {
    console.log(`Settings app running at http://localhost:${PORT}`);
  });
}

export { server, DEFAULT_SETTINGS_PATH, PUBLIC_DIR };
