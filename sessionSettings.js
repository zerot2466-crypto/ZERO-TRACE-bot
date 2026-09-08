// ZERO TRACE — Paramètres de session
const fs = require("fs");
const path = require("path");

const sessionsRoot = path.join(__dirname, "sessions");

// Default settings template
const DEFAULT_SETTINGS = {
  // ───── GLOBAL AUTO FEATURES ─────
  autoread: { enabled: false },
  autorecord: { enabled: false },
  autotyping: { enabled: false },
  autoreact: { enabled: false },

  // ───── BOT MODE ─────
  public: true,

  // ───── GROUP FEATURES ─────
  groups: {},

  // ───── ANTI FEATURES ─────
  antipromote: {},
  antidemote: {}
};

// Ensure session folder exists
function ensureSession(userKey) {
    const userDir = path.join(sessionsRoot, String(userKey));
    if (!fs.existsSync(userDir)) {
        fs.mkdirSync(userDir, { recursive: true });
    }
    return userDir;
}

// Cache mémoire — évite de relire settings.json depuis le disque à chaque message
const settingsCache = new Map();

// Load settings PER SESSION
function loadSettings(userKey) {
    if (!userKey) throw new Error("loadSettings requires userKey");
    if (settingsCache.has(userKey)) return settingsCache.get(userKey);

    const userDir = ensureSession(userKey);
    const settingsPath = path.join(userDir, "settings.json");

    let settings;
    if (!fs.existsSync(settingsPath)) {
        fs.writeFileSync(settingsPath, JSON.stringify(DEFAULT_SETTINGS, null, 2));
        settings = { ...DEFAULT_SETTINGS };
    } else {
        try {
            settings = JSON.parse(fs.readFileSync(settingsPath, "utf-8"));
        } catch (e) {
            console.error(`Settings corrupted for ${userKey}, resetting.`);
            fs.writeFileSync(settingsPath, JSON.stringify(DEFAULT_SETTINGS, null, 2));
            settings = { ...DEFAULT_SETTINGS };
        }
    }
    settingsCache.set(userKey, settings);
    return settings;
}

// Save settings PER SESSION
function saveSettings(userKey, settings) {
    if (!userKey) throw new Error("saveSettings requires userKey");

    const userDir = ensureSession(userKey);
    const settingsPath = path.join(userDir, "settings.json");

    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
    settingsCache.set(userKey, settings);
}

module.exports = { loadSettings, saveSettings };