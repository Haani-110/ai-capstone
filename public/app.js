const form = document.getElementById("settings-form");
const statusEl = document.getElementById("form-status");

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_THEMES = ["light", "dark", "system"];
const VALID_COMMIT_PREFIXES = ["feat", "fix", "docs", "chore", "refactor", "test"];

function validateField(name, value, checked = false) {
  switch (name) {
    case "developerName": {
      const trimmed = value.trim();
      if (!trimmed) return "Developer name is required.";
      if (trimmed.length < 2) return "Developer name must be at least 2 characters.";
      if (trimmed.length > 50) return "Developer name must be 50 characters or fewer.";
      return "";
    }
    case "email": {
      const trimmed = value.trim();
      if (!trimmed) return "Email is required.";
      if (!EMAIL_PATTERN.test(trimmed)) return "Enter a valid email address.";
      return "";
    }
    case "editorTheme":
      if (!VALID_THEMES.includes(value)) return "Select a valid theme.";
      return "";
    case "commitPrefix":
      if (value && !VALID_COMMIT_PREFIXES.includes(value)) {
        return "Choose a valid commit prefix or leave blank.";
      }
      return "";
    case "enableAiSuggestions":
      return checked || !checked ? "" : "";
    default:
      return "";
  }
}

function showFieldError(name, message) {
  const field = form.elements[name]?.closest(".field");
  const errorEl = document.querySelector(`[data-error-for="${name}"]`);
  if (errorEl) errorEl.textContent = message;
  if (field) field.classList.toggle("invalid", Boolean(message));
}

function validateForm() {
  const errors = {};
  for (const element of form.elements) {
    if (!element.name) continue;
    const message = validateField(
      element.name,
      element.value,
      element.checked
    );
    if (message) errors[element.name] = message;
    showFieldError(element.name, message);
  }
  return errors;
}

function setStatus(message, type = "") {
  statusEl.textContent = message;
  statusEl.className = type;
}

function formDataToObject() {
  return {
    developerName: form.developerName.value,
    email: form.email.value,
    editorTheme: form.editorTheme.value,
    commitPrefix: form.commitPrefix.value,
    enableAiSuggestions: form.enableAiSuggestions.checked,
  };
}

function populateForm(settings) {
  if (!settings) return;
  form.developerName.value = settings.developerName ?? "";
  form.email.value = settings.email ?? "";
  form.editorTheme.value = settings.editorTheme ?? "";
  form.commitPrefix.value = settings.commitPrefix ?? "";
  form.enableAiSuggestions.checked = Boolean(settings.enableAiSuggestions);
}

for (const element of form.elements) {
  if (!element.name) continue;
  element.addEventListener("blur", () => {
    const message = validateField(element.name, element.value, element.checked);
    showFieldError(element.name, message);
  });
  element.addEventListener("input", () => {
    if (element.closest(".field")?.classList.contains("invalid")) {
      const message = validateField(element.name, element.value, element.checked);
      showFieldError(element.name, message);
    }
  });
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  setStatus("");

  const errors = validateForm();
  if (Object.keys(errors).length > 0) {
    setStatus("Fix the highlighted errors before saving.", "error");
    return;
  }

  try {
    const response = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formDataToObject()),
    });

    const payload = await response.json();

    if (!response.ok) {
      if (payload.errors) {
        for (const [name, message] of Object.entries(payload.errors)) {
          showFieldError(name, message);
        }
      }
      setStatus(payload.error || "Unable to save settings.", "error");
      return;
    }

    setStatus("Settings saved successfully.", "success");
  } catch {
    setStatus("Network error. Is the server running?", "error");
  }
});

async function loadSettings() {
  try {
    const response = await fetch("/api/settings");
    const payload = await response.json();
    populateForm(payload.settings);
  } catch {
    setStatus("Could not load saved settings.", "error");
  }
}

loadSettings();
