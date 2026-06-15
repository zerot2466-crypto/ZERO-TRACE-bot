/**
 * ZERO TRACE BOT v5.0 — Stats d'usage
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Compte les commandes utilisées, utilisateurs uniques, providers IA.
 * Stocké dans data/usage_stats.json
 */

'use strict';

const fs   = require('fs-extra');
const path = require('path');

const STORE_PATH = path.join(__dirname, '../data/usage_stats.json');

const DEFAULT = {
  totalCommands: 0,
  uniqueUsers:   {},    // jid → count
  commands:      {},    // cmdKey → count
  providers:     {},    // providerName → count
  aiQuotaAlerts: 0,
  startedAt:     new Date().toISOString(),
};

let _store = null;

function load() {
  if (_store) return _store;
  try {
    _store = fs.existsSync(STORE_PATH)
      ? { ...DEFAULT, ...fs.readJsonSync(STORE_PATH) }
      : { ...DEFAULT };
  } catch (e) { _store = { ...DEFAULT }; }
  return _store;
}

function save() {
  try {
    fs.ensureDirSync(path.dirname(STORE_PATH));
    fs.writeJsonSync(STORE_PATH, _store, { spaces: 2 });
  } catch (e) {}
}

function trackCommand(senderJid, cmdKey) {
  const s = load();
  s.totalCommands++;
  const key = senderJid.replace(/@.*$/, '').replace(/:[0-9]+$/, '');
  s.uniqueUsers[key] = (s.uniqueUsers[key] || 0) + 1;
  s.commands[cmdKey] = (s.commands[cmdKey] || 0) + 1;
  // Sauvegarder toutes les 10 commandes (pas à chaque fois pour la perf)
  if (s.totalCommands % 10 === 0) save();
}

function trackProvider(providerName) {
  const s = load();
  s.providers[providerName] = (s.providers[providerName] || 0) + 1;
}

function trackAiQuotaAlert() {
  const s = load();
  s.aiQuotaAlerts = (s.aiQuotaAlerts || 0) + 1;
  save();
}

function getReport() {
  const s = load();
  save(); // flush avant rapport

  const topCmds = Object.entries(s.commands)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([k, v]) => `  ${k} → ${v}x`);

  const topProviders = Object.entries(s.providers)
    .sort(([, a], [, b]) => b - a)
    .map(([k, v]) => `  ${k} → ${v}x`);

  const uniqueCount = Object.keys(s.uniqueUsers).length;
  const uptime = Math.round((Date.now() - new Date(s.startedAt).getTime()) / 60000);

  return (
    `📊 *STATS D'USAGE — ZERO TRACE*\n\n` +
    `⚡ Commandes totales : *${s.totalCommands}*\n` +
    `👥 Utilisateurs uniques : *${uniqueCount}*\n` +
    `🕐 Uptime stats : *${uptime} min*\n\n` +
    `🏆 *Top 5 commandes :*\n${topCmds.join('\n') || '  (aucune)'}\n\n` +
    `🤖 *Providers IA utilisés :*\n${topProviders.join('\n') || '  (aucun)'}\n\n` +
    (s.aiQuotaAlerts > 0 ? `⚠️ Alertes quota IA : *${s.aiQuotaAlerts}*\n\n` : '') +
    `> ⚡ _ZERO TRACE BOT v5.0_`
  );
}

function reset() {
  _store = { ...DEFAULT, startedAt: new Date().toISOString() };
  save();
}

module.exports = { trackCommand, trackProvider, trackAiQuotaAlert, getReport, reset };
