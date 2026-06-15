/**
 * ZERO TRACE BOT v5.0 — Message de Bienvenue pour nouveaux utilisateurs
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Envoie un message d'accueil la première fois qu'un user interagit avec le bot.
 * Stocké dans data/welcomed_users.json pour ne jamais envoyer deux fois.
 */

'use strict';

const fs   = require('fs-extra');
const path = require('path');

const STORE_PATH = path.join(__dirname, '../data/welcomed_users.json');

let _store = null;

function load() {
  if (_store) return _store;
  try {
    _store = fs.existsSync(STORE_PATH) ? fs.readJsonSync(STORE_PATH) : {};
  } catch (e) { _store = {}; }
  return _store;
}

function save() {
  try {
    fs.ensureDirSync(path.dirname(STORE_PATH));
    fs.writeJsonSync(STORE_PATH, _store, { spaces: 2 });
  } catch (e) {}
}

function hasWelcomed(senderJid) {
  const store = load();
  const key = senderJid.replace(/@.*$/, '').replace(/:[0-9]+$/, '');
  return !!store[key];
}

function markWelcomed(senderJid) {
  const store = load();
  const key = senderJid.replace(/@.*$/, '').replace(/:[0-9]+$/, '');
  store[key] = Date.now();
  save();
}

/**
 * Envoie le message de bienvenue si c'est la première fois.
 * À appeler au début du messageHandler (après résolution sender).
 */
async function sendWelcomeIfNew(sock, jid, sender, pushName, prefix, antiBan, zts) {
  if (jid.endsWith('@g.us')) return;
  if (hasWelcomed(sender)) return;
  markWelcomed(sender);
  const name = pushName || 'Inconnu';
  const _zts = zts || null;
  const sig = _zts ? _zts.sig() : '⚡ ZERO TRACE v5.0';

  await antiBan.safeSend(sock, jid, {
    text:
      `╔═══════════════════════════════╗\n` +
      `║  ⚡  ZERO TRACE BOT v5.0  ⚡  ║\n` +
      `║   _Ghost Mode : ACTIVATED_    ║\n` +
      `╚═══════════════════════════════╝\n\n` +
      `Bienvenue dans la matrice, *${name}* 👾\n\n` +
      `🔮 Je suis *ZERO TRACE* — bot WhatsApp hacker-grade.\n` +
      `Aucune trace. Puissance maximale.\n\n` +
      `▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰\n` +
      `📌 *Commandes de base :*\n` +
      `  › \`${prefix}menu\`  — Arsenal complet\n` +
      `  › \`${prefix}ai\`    — IA multi-provider\n` +
      `  › \`${prefix}myprefix !\` — Ton prefix perso\n` +
      `  › \`${prefix}help\`  — Aide détaillée\n` +
      `▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰\n\n` +
      `⚙️ *Ton prefix actuel :* \`${prefix}\`\n\n` +
      `> ${sig}`,
  });
}

module.exports = { sendWelcomeIfNew, hasWelcomed, markWelcomed };
