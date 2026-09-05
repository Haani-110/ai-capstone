const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_THEMES = ["light", "dark", "system"];
const VALID_COMMIT_PREFIXES = ["feat", "fix", "docs", "chore", "refactor", "test"];

export function validateSettings(raw) {
  const errors = {};
  const data = {};

  const name = typeof raw.developerName === "string" ? raw.developerName.trim() : "";
  if (!name) {
    errors.developerName = "Developer name is required.";
  } else if (name.length < 2) {
    errors.developerName = "Developer name must be at least 2 characters.";
  } else if (name.length > 50) {
    errors.developerName = "Developer name must be 50 characters or fewer.";
  } else {
    data.developerName = name;
  }

  const email = typeof raw.email === "string" ? raw.email.trim() : "";
  if (!email) {
    errors.email = "Email is required.";
  } else if (!EMAIL_PATTERN.test(email)) {
    errors.email = "Enter a valid email address.";
  } else {
    data.email = email;
  }

  const theme = typeof raw.editorTheme === "string" ? raw.editorTheme : "";
  if (!VALID_THEMES.includes(theme)) {
    errors.editorTheme = "Select a valid theme.";
  } else {
    data.editorTheme = theme;
  }

  const prefix = typeof raw.commitPrefix === "string" ? raw.commitPrefix.trim() : "";
  if (prefix && !VALID_COMMIT_PREFIXES.includes(prefix)) {
    errors.commitPrefix = "Choose a valid commit prefix or leave blank.";
  } else {
    data.commitPrefix = prefix;
  }

  data.enableAiSuggestions = raw.enableAiSuggestions === true || raw.enableAiSuggestions === "on";

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    data,
  };
}
