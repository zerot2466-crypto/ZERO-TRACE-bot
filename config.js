/**
 * ZERO TRACE BOT v5.0 - Config Runtime
 */

const fs = require('fs-extra');
const path = require('path');
const settings = require('./settings');

const CONFIG_PATH    = path.join(__dirname, 'data', 'config.json');
const CHATBOT_PATH   = path.join(__dirname, 'data', 'chatbot.json');
const PRIVATE_PATH   = path.join(__dirname, 'data', 'private.json');
let runtimeConfig = {};

function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      runtimeConfig = fs.readJsonSync(CONFIG_PATH);
    } else {
      runtimeConfig = { prefix: settings.prefix, sudoUsers: [], createdAt: new Date().toISOString() };
      saveConfig();
    }
  } catch (err) {
    runtimeConfig = { prefix: settings.prefix, sudoUsers: [] };
  }
  return runtimeConfig;
}

function saveConfig() {
  try {
    fs.ensureDirSync(path.dirname(CONFIG_PATH));
    fs.writeJsonSync(CONFIG_PATH, runtimeConfig, { spaces: 2 });
  } catch (err) {
    console.error('[CONFIG] Erreur sauvegarde:', err.message);
  }
}

// ── Prefix ────────────────────────────────────────────────────────────────────
function getPrefix()    { return runtimeConfig.prefix || settings.prefix; }
function setPrefix(p)   { runtimeConfig.prefix = p; saveConfig(); }

// ── Sudo ──────────────────────────────────────────────────────────────────────
function getSudoUsers() { return runtimeConfig.sudoUsers || []; }

function isOwner(jid) {
  if (!jid) return false;
  // Normaliser : retirer @s.whatsapp.net et la partie device (:12)
  const normalize = (j) => j.replace(/@.*$/, '').replace(/:[0-9]+$/, '').replace(/[^0-9]/g, '');
  const ownerNum = normalize(settings.ownerNumber);
  const senderNum = normalize(jid);
  return senderNum === ownerNum;
}

function isSudo(jid) {
  if (!jid) return false;
  if (isOwner(jid)) return true;
  // Normaliser le JID pour gérer les variantes multi-device (ex: 260951@s.whatsapp.net vs 260951:12@s.whatsapp.net)
  const normalize = (j) => j.replace(/@.*$/, '').replace(/:[0-9]+$/, '').replace(/[^0-9]/g, '');
  const senderNum = normalize(jid);
  return (runtimeConfig.sudoUsers || []).some(s => normalize(s) === senderNum);
}

function addSudo(jid) {
  if (!runtimeConfig.sudoUsers) runtimeConfig.sudoUsers = [];
  if (!runtimeConfig.sudoUsers.includes(jid)) { runtimeConfig.sudoUsers.push(jid); saveConfig(); return true; }
  return false;
}

function removeSudo(jid) {
  if (!runtimeConfig.sudoUsers) return false;
  const idx = runtimeConfig.sudoUsers.indexOf(jid);
  if (idx > -1) { runtimeConfig.sudoUsers.splice(idx, 1); saveConfig(); return true; }
  return false;
}

// ── Chatbot (per group/chat) ───────────────────────────────────────────────
function loadChatbot() {
  try {
    if (fs.existsSync(CHATBOT_PATH)) return fs.readJsonSync(CHATBOT_PATH);
    return {};
  } catch { return {}; }
}

function saveChatbot(data) {
  try { fs.writeJsonSync(CHATBOT_PATH, data, { spaces: 2 }); } catch (e) {}
}

function isChatbotEnabled(jid) {
  const data = loadChatbot();
  return !!data[jid];
}

function setChatbot(jid, enabled) {
  const data = loadChatbot();
  if (enabled) data[jid] = true;
  else delete data[jid];
  saveChatbot(data);
}

// ── Mode Privé ────────────────────────────────────────────────────────────────
function loadPrivate() {
  try {
    if (fs.existsSync(PRIVATE_PATH)) return fs.readJsonSync(PRIVATE_PATH);
    return { enabled: false };
  } catch { return { enabled: false }; }
}

function savePrivate(data) {
  try { fs.writeJsonSync(PRIVATE_PATH, data, { spaces: 2 }); } catch (e) {}
}

function isPrivateMode() {
  return !!loadPrivate().enabled;
}

function setPrivateMode(enabled) {
  savePrivate({ enabled });
}

module.exports = {
  loadConfig, saveConfig,
  getPrefix, setPrefix,
  getSudoUsers, isOwner, isSudo, addSudo, removeSudo,
  isChatbotEnabled, setChatbot,
  isPrivateMode, setPrivateMode,
  getRuntimeConfig: () => runtimeConfig,
};
