import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { mkdtemp, writeFile, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  createRequestHandler,
  readSettings,
} from "../src/server.js";

function request(baseUrl, urlPath, options = {}) {
  return fetch(`${baseUrl}${urlPath}`, options);
}

describe("settings API", () => {
  /** @type {import("node:http").Server} */
  let server;
  let baseUrl;
  let tempDir;
  let settingsPath;

  before(async () => {
    tempDir = await mkdtemp(path.join(tmpdir(), "settings-test-"));
    settingsPath = path.join(tempDir, "settings.json");

    server = createServer(createRequestHandler({ settingsPath }));
    await new Promise((resolve) => {
      server.listen(0, "127.0.0.1", resolve);
    });

    const address = server.address();
    if (!address || typeof address === "string") {
      throw new Error("Unable to resolve test server port.");
    }

    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  after(async () => {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
    await rm(tempDir, { recursive: true, force: true });
  });

  it("returns null settings when no file exists", async () => {
    const response = await request(baseUrl, "/api/settings");
    assert.equal(response.status, 200);
    const payload = await response.json();
    assert.equal(payload.settings, null);
  });

  it("recovers from corrupt persisted settings data", async () => {
    await writeFile(settingsPath, "{ not valid json", "utf8");
    const fromDisk = await readSettings(settingsPath);
    assert.equal(fromDisk, null);

    const response = await request(baseUrl, "/api/settings");
    assert.equal(response.status, 200);
    const payload = await response.json();
    assert.equal(payload.settings, null);
  });

  it("accepts a successful POST and persists settings", async () => {
    const body = {
      developerName: "Haani",
      email: "haani@example.com",
      editorTheme: "dark",
      commitPrefix: "feat",
      enableAiSuggestions: true,
    };

    const response = await request(baseUrl, "/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    assert.equal(response.status, 200);
    const payload = await response.json();
    assert.deepEqual(payload.settings, body);

    const saved = JSON.parse(await readFile(settingsPath, "utf8"));
    assert.deepEqual(saved, body);
  });

  it("returns validation failure responses for invalid payloads", async () => {
    const response = await request(baseUrl, "/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        developerName: "",
        email: "bad-email",
        editorTheme: "neon",
      }),
    });

    assert.equal(response.status, 422);
    const payload = await response.json();
    assert.ok(payload.errors.developerName);
    assert.ok(payload.errors.email);
    assert.ok(payload.errors.editorTheme);
  });

  it("rejects malformed JSON bodies", async () => {
    const response = await request(baseUrl, "/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{ developerName:",
    });

    assert.equal(response.status, 400);
    const payload = await response.json();
    assert.match(payload.error, /invalid json/i);
  });

  it("rejects non-object payloads", async () => {
    const response = await request(baseUrl, "/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(["not", "an", "object"]),
    });

    assert.equal(response.status, 422);
    const payload = await response.json();
    assert.ok(payload.errors._form);
  });

  it("serves the shared validation module", async () => {
    const response = await request(baseUrl, "/validateSettings.js");
    assert.equal(response.status, 200);
    const source = await response.text();
    assert.match(source, /export function validateSettings/);
  });
});
