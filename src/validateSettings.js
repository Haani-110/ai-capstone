export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const VALID_THEMES = ["light", "dark", "system"];
export const VALID_COMMIT_PREFIXES = ["feat", "fix", "docs", "chore", "refactor", "test"];

function validateDeveloperName(raw) {
  if (raw === undefined || raw === null) {
    return { error: "Developer name is required." };
  }
  if (typeof raw !== "string") {
    return { error: "Developer name must be text." };
  }
  const name = raw.trim();
  if (!name) {
    return { error: "Developer name is required." };
  }
  if (name.length < 2) {
    return { error: "Developer name must be at least 2 characters." };
  }
  if (name.length > 50) {
    return { error: "Developer name must be 50 characters or fewer." };
  }
  return { value: name };
}

function validateEmail(raw) {
  if (raw === undefined || raw === null) {
    return { error: "Email is required." };
  }
  if (typeof raw !== "string") {
    return { error: "Email must be text." };
  }
  const email = raw.trim();
  if (!email) {
    return { error: "Email is required." };
  }
  if (!EMAIL_PATTERN.test(email)) {
    return { error: "Enter a valid email address." };
  }
  return { value: email };
}

function validateEditorTheme(raw) {
  if (raw === undefined || raw === null) {
    return { error: "Editor theme is required." };
  }
  if (typeof raw !== "string") {
    return { error: "Editor theme must be text." };
  }
  const theme = raw.trim();
  if (!theme) {
    return { error: "Editor theme is required." };
  }
  if (!VALID_THEMES.includes(theme)) {
    return { error: "Select a valid theme." };
  }
  return { value: theme };
}

function validateCommitPrefix(raw) {
  if (raw === undefined || raw === null || raw === "") {
    return { value: "" };
  }
  if (typeof raw !== "string") {
    return { error: "Commit prefix must be text." };
  }
  const prefix = raw.trim();
  if (!prefix) {
    return { value: "" };
  }
  if (!VALID_COMMIT_PREFIXES.includes(prefix)) {
    return { error: "Choose a valid commit prefix or leave blank." };
  }
  return { value: prefix };
}

function validateEnableAiSuggestions(raw) {
  if (raw === true || raw === "on") {
    return { value: true };
  }
  if (raw === false || raw === "off" || raw === undefined || raw === null || raw === "") {
    return { value: false };
  }
  return { error: "Enable AI suggestions must be a boolean value." };
}

export function validateSettings(raw) {
  if (raw === null || raw === undefined || typeof raw !== "object" || Array.isArray(raw)) {
    return {
      valid: false,
      errors: { _form: "Settings payload must be a JSON object." },
      data: {},
    };
  }

  const errors = {};
  const data = {};

  const nameResult = validateDeveloperName(raw.developerName);
  if (nameResult.error) {
    errors.developerName = nameResult.error;
  } else {
    data.developerName = nameResult.value;
  }

  const emailResult = validateEmail(raw.email);
  if (emailResult.error) {
    errors.email = emailResult.error;
  } else {
    data.email = emailResult.value;
  }

  const themeResult = validateEditorTheme(raw.editorTheme);
  if (themeResult.error) {
    errors.editorTheme = themeResult.error;
  } else {
    data.editorTheme = themeResult.value;
  }

  const prefixResult = validateCommitPrefix(raw.commitPrefix);
  if (prefixResult.error) {
    errors.commitPrefix = prefixResult.error;
  } else {
    data.commitPrefix = prefixResult.value;
  }

  const aiResult = validateEnableAiSuggestions(raw.enableAiSuggestions);
  if (aiResult.error) {
    errors.enableAiSuggestions = aiResult.error;
  } else {
    data.enableAiSuggestions = aiResult.value;
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    data,
  };
}

export function validateField(name, value, checked = false) {
  switch (name) {
    case "developerName":
      return validateDeveloperName(value).error ?? "";
    case "email":
      return validateEmail(value).error ?? "";
    case "editorTheme":
      return validateEditorTheme(value).error ?? "";
    case "commitPrefix":
      return validateCommitPrefix(value).error ?? "";
    case "enableAiSuggestions":
      return validateEnableAiSuggestions(checked).error ?? "";
    default:
      return "";
  }
}
