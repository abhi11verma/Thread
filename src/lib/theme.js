import builtinThemes from '../themes.json';

const CUSTOM_KEY = 'thread-custom-themes';
const ACTIVE_KEY = 'thread-theme';

let appliedVars = new Set();

export function getBuiltinThemes() {
  return builtinThemes.themes;
}

export function getCustomThemes() {
  try {
    return JSON.parse(localStorage.getItem(CUSTOM_KEY) || '[]');
  } catch {
    return [];
  }
}

export function getAllThemes() {
  return [...getBuiltinThemes(), ...getCustomThemes()];
}

export function saveCustomTheme(theme) {
  const existing = getCustomThemes();
  const idx = existing.findIndex(t => t.key === theme.key);
  if (idx >= 0) existing[idx] = theme;
  else existing.push(theme);
  localStorage.setItem(CUSTOM_KEY, JSON.stringify(existing));
}

export function removeCustomTheme(key) {
  const themes = getCustomThemes().filter(t => t.key !== key);
  localStorage.setItem(CUSTOM_KEY, JSON.stringify(themes));
}

export function findTheme(key) {
  return getAllThemes().find(t => t.key === key);
}

export function getActiveThemeKey() {
  const saved = localStorage.getItem(ACTIVE_KEY);
  return findTheme(saved) ? saved : 'warm';
}

export function applyTheme(theme) {
  if (!theme) return;
  const root = document.documentElement;

  // Clear any vars applied by the previous theme
  for (const varName of appliedVars) {
    root.style.removeProperty(varName);
  }
  appliedVars.clear();

  // Flatten all token groups and apply as CSS custom properties
  const flat = flattenTokens(theme.tokens || {});
  for (const [key, value] of Object.entries(flat)) {
    const cssVar = `--${key}`;
    root.style.setProperty(cssVar, value);
    appliedVars.add(cssVar);
  }

  // data-dark drives structural CSS overrides (shadow removal, btn-primary inversion)
  if (theme.meta?.dark) {
    root.setAttribute('data-dark', '');
  } else {
    root.removeAttribute('data-dark');
  }
}

// Validates an uploaded theme object; returns an error string or null if valid.
export function validateTheme(obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return 'Must be a JSON object';
  if (!obj.key || typeof obj.key !== 'string') return 'Missing field: key (string)';
  if (!obj.label || typeof obj.label !== 'string') return 'Missing field: label (string)';
  if (!obj.tokens || typeof obj.tokens !== 'object') return 'Missing field: tokens (object)';
  const flat = flattenTokens(obj.tokens);
  for (const required of ['paper', 'ink', 'accent']) {
    if (!flat[required]) return `Missing required token: ${required}`;
  }
  return null;
}

function flattenTokens(tokens) {
  const result = {};
  for (const group of Object.values(tokens)) {
    if (group && typeof group === 'object') Object.assign(result, group);
  }
  return result;
}
