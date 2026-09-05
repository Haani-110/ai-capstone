import { validateField, validateSettings } from "/validateSettings.js";

const form = document.getElementById("settings-form");
const statusEl = document.getElementById("form-status");
const formErrorsEl = document.getElementById("form-errors");
const submitButton = document.getElementById("submit-button");
const submitButtonDefaultText = submitButton.textContent;

const FIELD_ORDER = [
  "developerName",
  "email",
  "editorTheme",
  "commitPrefix",
  "enableAiSuggestions",
];

function getControl(name) {
  return form.elements[name];
}

function showFieldError(name, message) {
  const field = getControl(name)?.closest(".field");
  const errorEl = document.querySelector(`[data-error-for="${name}"]`);
  const control = getControl(name);

  if (errorEl) {
    errorEl.textContent = message;
  }

  if (field) {
    field.classList.toggle("invalid", Boolean(message));
  }

  if (control) {
    control.setAttribute("aria-invalid", message ? "true" : "false");
  }
}

function clearAllFieldErrors() {
  for (const name of FIELD_ORDER) {
    showFieldError(name, "");
  }
}

function applyErrors(errors) {
  for (const name of FIELD_ORDER) {
    showFieldError(name, errors[name] ?? "");
  }
}

function focusFirstInvalidField(errors) {
  for (const name of FIELD_ORDER) {
    if (errors[name]) {
      const control = getControl(name);
      control?.focus();
      return;
    }
  }
}

function announceFormErrors(errors) {
  const messages = FIELD_ORDER.filter((name) => errors[name]).map(
    (name) => `${name}: ${errors[name]}`
  );

  if (messages.length === 0) {
    formErrorsEl.textContent = "";
    return;
  }

  formErrorsEl.textContent = `Form has ${messages.length} error${messages.length === 1 ? "" : "s"}. ${messages.join(". ")}`;
}

function validateForm() {
  const payload = formDataToObject();
  const result = validateSettings(payload);
  applyErrors(result.errors);
  return result.errors;
}

function setStatus(message, type = "") {
  statusEl.textContent = message;
  statusEl.className = type;
}

function setSavingState(isSaving) {
  submitButton.disabled = isSaving;
  submitButton.textContent = isSaving ? "Saving…" : submitButtonDefaultText;
  submitButton.setAttribute("aria-busy", isSaving ? "true" : "false");
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
  if (!settings) {
    return;
  }

  form.developerName.value = settings.developerName ?? "";
  form.email.value = settings.email ?? "";
  form.editorTheme.value = settings.editorTheme ?? "";
  form.commitPrefix.value = settings.commitPrefix ?? "";
  form.enableAiSuggestions.checked = Boolean(settings.enableAiSuggestions);
}

for (const name of FIELD_ORDER) {
  const control = getControl(name);
  if (!control) {
    continue;
  }

  const eventName = control.type === "checkbox" ? "change" : "input";

  control.addEventListener("blur", () => {
    const message = validateField(
      name,
      control.value,
      control.checked
    );
    showFieldError(name, message);
  });

  control.addEventListener(eventName, () => {
    if (control.closest(".field")?.classList.contains("invalid")) {
      const message = validateField(
        name,
        control.value,
        control.checked
      );
      showFieldError(name, message);
    }

    if (statusEl.classList.contains("error")) {
      setStatus("");
    }
  });
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  setStatus("");
  formErrorsEl.textContent = "";

  const errors = validateForm();
  if (Object.keys(errors).length > 0) {
    setStatus("Fix the highlighted errors before saving.", "error");
    announceFormErrors(errors);
    focusFirstInvalidField(errors);
    return;
  }

  setSavingState(true);

  try {
    const response = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formDataToObject()),
    });

    let payload = {};
    try {
      payload = await response.json();
    } catch {
      payload = {};
    }

    if (!response.ok) {
      if (payload.errors) {
        applyErrors(payload.errors);
        announceFormErrors(payload.errors);
        focusFirstInvalidField(payload.errors);
      }

      const message =
        payload.error ||
        (response.status === 422
          ? "Server rejected the settings. Review the highlighted fields and try again."
          : "Unable to save settings. Check your connection and try again.");

      setStatus(message, "error");
      return;
    }

    clearAllFieldErrors();
    populateForm(payload.settings);
    setStatus("Settings saved successfully.", "success");
  } catch {
    setStatus(
      "Network error — settings were not saved. Check that the server is running and try again.",
      "error"
    );
  } finally {
    setSavingState(false);
  }
});

async function loadSettings() {
  try {
    const response = await fetch("/api/settings");
    const payload = await response.json();
    populateForm(payload.settings);
  } catch {
    setStatus(
      "Could not load saved settings. You can still edit and save new values.",
      "error"
    );
  }
}

loadSettings();
