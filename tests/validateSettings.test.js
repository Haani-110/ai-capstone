import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { validateSettings, validateField } from "../src/validateSettings.js";

const validPayload = {
  developerName: "Haani",
  email: "haani@example.com",
  editorTheme: "dark",
  commitPrefix: "feat",
  enableAiSuggestions: true,
};

describe("validateSettings", () => {
  it("accepts valid settings", () => {
    const result = validateSettings(validPayload);
    assert.equal(result.valid, true);
    assert.deepEqual(result.errors, {});
    assert.deepEqual(result.data, {
      developerName: "Haani",
      email: "haani@example.com",
      editorTheme: "dark",
      commitPrefix: "feat",
      enableAiSuggestions: true,
    });
  });

  it("trims whitespace from string fields", () => {
    const result = validateSettings({
      ...validPayload,
      developerName: "  Haani  ",
      email: "  haani@example.com  ",
      commitPrefix: "  feat  ",
    });

    assert.equal(result.valid, true);
    assert.equal(result.data.developerName, "Haani");
    assert.equal(result.data.email, "haani@example.com");
    assert.equal(result.data.commitPrefix, "feat");
  });

  it("rejects null, undefined, and non-object payloads", () => {
    for (const payload of [null, undefined, "string", 42, []]) {
      const result = validateSettings(payload);
      assert.equal(result.valid, false);
      assert.ok(result.errors._form);
    }
  });

  it("reports required-field errors", () => {
    const result = validateSettings({
      developerName: "",
      email: "",
      editorTheme: "",
    });

    assert.equal(result.valid, false);
    assert.match(result.errors.developerName, /required/i);
    assert.match(result.errors.email, /required/i);
    assert.match(result.errors.editorTheme, /required/i);
  });

  it("rejects whitespace-only values", () => {
    const result = validateSettings({
      developerName: "   ",
      email: "   ",
      editorTheme: "   ",
    });

    assert.equal(result.valid, false);
    assert.match(result.errors.developerName, /required/i);
    assert.match(result.errors.email, /required/i);
    assert.match(result.errors.editorTheme, /required/i);
  });

  it("enforces developer name boundary values", () => {
    const tooShort = validateSettings({ ...validPayload, developerName: "A" });
    assert.equal(tooShort.valid, false);
    assert.match(tooShort.errors.developerName, /2 characters/i);

    const tooLong = validateSettings({
      ...validPayload,
      developerName: "A".repeat(51),
    });
    assert.equal(tooLong.valid, false);
    assert.match(tooLong.errors.developerName, /50 characters/i);

    const minOk = validateSettings({ ...validPayload, developerName: "Ab" });
    assert.equal(minOk.valid, true);

    const maxOk = validateSettings({
      ...validPayload,
      developerName: "A".repeat(50),
    });
    assert.equal(maxOk.valid, true);
  });

  it("rejects invalid email formats", () => {
    const result = validateSettings({
      ...validPayload,
      email: "not-an-email",
    });

    assert.equal(result.valid, false);
    assert.match(result.errors.email, /valid email/i);
  });

  it("rejects invalid field types", () => {
    const result = validateSettings({
      developerName: 123,
      email: true,
      editorTheme: 99,
      commitPrefix: false,
      enableAiSuggestions: "maybe",
    });

    assert.equal(result.valid, false);
    assert.match(result.errors.developerName, /text/i);
    assert.match(result.errors.email, /text/i);
    assert.match(result.errors.editorTheme, /text/i);
    assert.match(result.errors.commitPrefix, /text/i);
    assert.match(result.errors.enableAiSuggestions, /boolean/i);
  });

  it("rejects unknown enum values", () => {
    const themeResult = validateSettings({
      ...validPayload,
      editorTheme: "neon",
    });
    assert.equal(themeResult.valid, false);
    assert.match(themeResult.errors.editorTheme, /valid theme/i);

    const prefixResult = validateSettings({
      ...validPayload,
      commitPrefix: "wip",
    });
    assert.equal(prefixResult.valid, false);
    assert.match(prefixResult.errors.commitPrefix, /valid commit prefix/i);
  });

  it("allows blank commit prefix and coerces checkbox values", () => {
    const blankPrefix = validateSettings({
      ...validPayload,
      commitPrefix: "",
    });
    assert.equal(blankPrefix.valid, true);
    assert.equal(blankPrefix.data.commitPrefix, "");

    const offByDefault = validateSettings({
      developerName: "Haani",
      email: "haani@example.com",
      editorTheme: "light",
    });
    assert.equal(offByDefault.valid, true);
    assert.equal(offByDefault.data.enableAiSuggestions, false);

    const onString = validateSettings({
      ...validPayload,
      enableAiSuggestions: "on",
    });
    assert.equal(onString.valid, true);
    assert.equal(onString.data.enableAiSuggestions, true);
  });

  it("ignores unknown fields without failing validation", () => {
    const result = validateSettings({
      ...validPayload,
      unknownField: "ignored",
    });

    assert.equal(result.valid, true);
    assert.equal(result.data.unknownField, undefined);
  });
});

describe("validateField", () => {
  it("returns field-specific messages for client-side validation", () => {
    assert.match(validateField("developerName", ""), /required/i);
    assert.match(validateField("email", "bad"), /valid email/i);
    assert.match(validateField("editorTheme", "neon"), /valid theme/i);
    assert.equal(validateField("commitPrefix", ""), "");
    assert.equal(validateField("enableAiSuggestions", "", true), "");
  });
});
