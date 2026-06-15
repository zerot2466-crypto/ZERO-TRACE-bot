/**
 * ZERO TRACE BOT v5.0 - Admin Plus
 * warnlist · unmute · modstatus · heatmap · unban · antispam · ban
 */
'use strict';

const config = require('../config');
const fs     = require('fs-extra');
const path   = require('path');

// ── Données warns persistantes ────────────────────────────────────────────────
const WARNS_FILE = path.join(__dirname, '../data/warns.json');
fs.ensureDirSync(path.dirname(WARNS_FILE));

function loadWarns() {
  try { return fs.existsSync(WARNS_FILE) ? fs.readJsonSync(WARNS_FILE) : {}; } catch { return {}; }
}
function saveWarns(data) {
  try { fs.writeJsonSync(WARNS_FILE, data, { spaces: 2 }); } catch (e) {}
}

// ── Données antispam ──────────────────────────────────────────────────────────
const SPAM_MAP  = new Map(); // jid → { enabled, msgCount: Map<sender, [{ts}]> }
const SPAM_FILE = path.join(__dirname, '../data/antispam.json');

function loadSpam() {
  try { return fs.existsSync(SPAM_FILE) ? fs.readJsonSync(SPAM_FILE) : {}; } catch { return {}; }
}
function saveSpam(data) {
  try { fs.writeJsonSync(SPAM_FILE, data, { spaces: 2 }); } catch (e) {}
}

// ── Activité heatmap (stocké en mémoire pour la session) ─────────────────────
const heatmapData = new Map(); // jid → { hour: count }

function recordActivity(jid) {
  const hour = new Date().getHours();
  if (!heatmapData.has(jid)) heatmapData.set(jid, {});
  const m = heatmapData.get(jid);
  m[hour] = (m[hour] || 0) + 1;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
async function isAdmin(sock, jid, sender) {
  try {
    const meta = await sock.groupMetadata(jid);
    return meta.participants.some(p => p.id === sender && (p.admin === 'admin' || p.admin === 'superadmin'));
  } catch { return false; }
}

function mentionFromMsg(msg) {
  return msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
}

// ── COMMANDES ─────────────────────────────────────────────────────────────────

const warnlist = {
  name: 'warnlist',
  execute: async (ctx) => {
    const { sock, jid, msg, antiBan, sender, isOwner, isSudo } = ctx;
    if (!isOwner && !isSudo && !(await isAdmin(sock, jid, sender))) {
      await antiBan.safeSend(sock, jid, { text: '❌ Réservé aux admins.' }, { msgOptions: { quoted: msg } });
      return;
    }
    const warns = loadWarns();
    const groupWarns = warns[jid];
    if (!groupWarns || Object.keys(groupWarns).length === 0) {
      await antiBan.safeSend(sock, jid, {
        text: '📋 *LISTE DES WARNS*\n\nAucun warn actif dans ce groupe.\n\n> *ZERO TRACE BOT v5.0*',
      }, { msgOptions: { quoted: msg } });
      return;
    }
    const lines = Object.entries(groupWarns)
      .filter(([, w]) => w.count > 0)
      .map(([id, w]) => `• +${id.split('@')[0]} — ${w.count}/3 avert.`)
      .join('\n');
    await antiBan.safeSend(sock, jid, {
      text:
        `📋 *LISTE DES WARNS*\n\n` +
        (lines || 'Aucun warn actif.') +
        `\n\n> *ZERO TRACE BOT v5.0*`,
    }, { msgOptions: { quoted: msg } });
  },
};

const unmute = {
  name: 'unmute',
  execute: async (ctx) => {
    const { sock, jid, msg, antiBan, sender, isOwner, isSudo } = ctx;
    if (!jid.endsWith('@g.us')) {
      await antiBan.safeSend(sock, jid, { text: '❌ Commande réservée aux groupes.' }, { msgOptions: { quoted: msg } });
      return;
    }
    if (!isOwner && !isSudo && !(await isAdmin(sock, jid, sender))) {
      await antiBan.safeSend(sock, jid, { text: '❌ Réservé aux admins.' }, { msgOptions: { quoted: msg } });
      return;
    }
    try {
      await sock.groupSettingUpdate(jid, 'not_announcement');
      await antiBan.safeSend(sock, jid, {
        text: '🔊 *Groupe démute !*\nTous les membres peuvent à nouveau envoyer des messages.\n\n> *ZERO TRACE BOT v5.0*',
      }, { msgOptions: { quoted: msg } });
    } catch (e) {
      await antiBan.safeSend(sock, jid, { text: `❌ Impossible de démuter : ${e.message}` }, { msgOptions: { quoted: msg } });
    }
  },
};

const modstatus = {
  name: 'modstatus',
  execute: async (ctx) => {
    const { sock, jid, msg, antiBan } = ctx;
    if (!jid.endsWith('@g.us')) {
      await antiBan.safeSend(sock, jid, {
        text: '⚙️ *MOD STATUS*\n\nCette commande fonctionne uniquement en groupe.\n\n> *ZERO TRACE BOT v5.0*',
      }, { msgOptions: { quoted: msg } });
      return;
    }
    try {
      const spamData    = loadSpam();
      const antilinkOn  = config.isAntilinkEnabled    ? config.isAntilinkEnabled(jid)    : false;
      const chatbotOn   = config.isChatbotEnabled     ? config.isChatbotEnabled(jid)     : false;
      const antispamOn  = spamData[jid]?.enabled || false;
      const muteRes     = await sock.groupMetadata(jid).catch(() => null);
      const isMuted     = muteRes?.announce === true;
      const welcomeOn   = config.isWelcomeEnabled     ? config.isWelcomeEnabled(jid)     : false;
      const antidelOn   = config.isAntideleteEnabled  ? config.isAntideleteEnabled(jid)  : false;

      await antiBan.safeSend(sock, jid, {
        text:
          `⚙️ *MOD STATUS*\n\n` +
          `🔇 Groupe muté   : ${isMuted   ? '🟢 Oui' : '🔴 Non'}\n` +
          `🔗 Anti-lien     : ${antilinkOn ? '🟢 ON'  : '🔴 OFF'}\n` +
          `🤖 Chatbot IA    : ${chatbotOn  ? '🟢 ON'  : '🔴 OFF'}\n` +
          `🚫 Anti-spam     : ${antispamOn ? '🟢 ON'  : '🔴 OFF'}\n` +
          `👋 Bienvenue     : ${welcomeOn  ? '🟢 ON'  : '🔴 OFF'}\n` +
          `🗑️ Anti-delete   : ${antidelOn  ? '🟢 ON'  : '🔴 OFF'}\n\n` +
          `> *ZERO TRACE BOT v5.0*`,
      }, { msgOptions: { quoted: msg } });
    } catch (e) {
      await antiBan.safeSend(sock, jid, { text: `❌ Erreur : ${e.message}` }, { msgOptions: { quoted: msg } });
    }
  },
};

const heatmap = {
  name: 'heatmap',
  execute: async (ctx) => {
    const { sock, jid, msg, antiBan } = ctx;
    // Enregistrer l'activité actuelle
    recordActivity(jid);
    const data = heatmapData.get(jid) || {};
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const max   = Math.max(...hours.map(h => data[h] || 0), 1);

    const rows = [];
    rows.push('📊 *ACTIVITÉ DU GROUPE (24H)*\n');
    for (let h = 0; h < 24; h += 6) {
      let row = `${String(h).padStart(2,'0')}h `;
      for (let i = h; i < h + 6; i++) {
        const count = data[i] || 0;
        const fill  = Math.round((count / max) * 5);
        const emoji = ['⬜','🟦','🟩','🟨','🟧','🟥'][fill];
        row += emoji;
      }
      rows.push(row);
    }
    rows.push('\n⬜ Vide → 🟥 Très actif');
    rows.push('(Données de la session actuelle)');

    await antiBan.safeSend(sock, jid, {
      text: rows.join('\n') + '\n\n> *ZERO TRACE BOT v5.0*',
    }, { msgOptions: { quoted: msg } });
  },
  recordActivity, // Export pour usage dans handler.js
};

const unban = {
  name: 'unban',
  execute: async (ctx) => {
    const { sock, jid, msg, antiBan, sender, isOwner, isSudo } = ctx;
    if (!jid.endsWith('@g.us')) return;
    if (!isOwner && !isSudo && !(await isAdmin(sock, jid, sender))) {
      await antiBan.safeSend(sock, jid, { text: '❌ Réservé aux admins.' }, { msgOptions: { quoted: msg } });
      return;
    }
    const mentions = mentionFromMsg(msg);
    if (mentions.length === 0) {
      await antiBan.safeSend(sock, jid, {
        text: '❌ Mentionne le membre à débannir : *.unban @membre*',
      }, { msgOptions: { quoted: msg } });
      return;
    }
    try {
      await sock.groupParticipantsUpdate(jid, mentions, 'add');
      const nums = mentions.map(m => '+' + m.split('@')[0]).join(', ');
      await antiBan.safeSend(sock, jid, {
        text: `✅ *${nums}* a été débanni(e) et réajouté(e).\n\n> *ZERO TRACE BOT v5.0*`,
        mentions,
      }, { msgOptions: { quoted: msg } });
    } catch (e) {
      await antiBan.safeSend(sock, jid, { text: `❌ Impossible de débannir : ${e.message}` }, { msgOptions: { quoted: msg } });
    }
  },
};

const ban = {
  name: 'ban',
  execute: async (ctx) => {
    const { sock, jid, msg, antiBan, sender, isOwner, isSudo } = ctx;
    if (!jid.endsWith('@g.us')) return;
    if (!isOwner && !isSudo && !(await isAdmin(sock, jid, sender))) {
      await antiBan.safeSend(sock, jid, { text: '❌ Réservé aux admins.' }, { msgOptions: { quoted: msg } });
      return;
    }
    const mentions = mentionFromMsg(msg);
    if (mentions.length === 0) {
      await antiBan.safeSend(sock, jid, {
        text: '❌ Mentionne le membre à bannir : *.ban @membre*',
      }, { msgOptions: { quoted: msg } });
      return;
    }
    try {
      await sock.groupParticipantsUpdate(jid, mentions, 'remove');
      const nums = mentions.map(m => '+' + m.split('@')[0]).join(', ');
      await antiBan.safeSend(sock, jid, {
        text: `🔨 *${nums}* a été banni(e) du groupe.\n\n> *ZERO TRACE BOT v5.0*`,
        mentions,
      }, { msgOptions: { quoted: msg } });
    } catch (e) {
      await antiBan.safeSend(sock, jid, { text: `❌ Impossible de bannir : ${e.message}` }, { msgOptions: { quoted: msg } });
    }
  },
};

const antispam = {
  name: 'antispam',
  execute: async (ctx) => {
    const { sock, jid, msg, antiBan, sender, isOwner, isSudo, args } = ctx;
    if (!jid.endsWith('@g.us')) return;
    if (!isOwner && !isSudo && !(await isAdmin(sock, jid, sender))) {
      await antiBan.safeSend(sock, jid, { text: '❌ Réservé aux admins.' }, { msgOptions: { quoted: msg } });
      return;
    }
    const sub = (args[0] || '').toLowerCase();
    const spamData = loadSpam();
    if (!spamData[jid]) spamData[jid] = { enabled: false };

    if (!sub) {
      const status = spamData[jid].enabled ? '🟢 ACTIVÉ' : '🔴 DÉSACTIVÉ';
      await antiBan.safeSend(sock, jid, {
        text:
          `🚫 *ANTI-SPAM*\n\nÉtat : ${status}\n\n` +
          `Détecte et avertit les membres qui envoient\n` +
          `trop de messages en peu de temps.\n\n` +
          `Commandes : .antispam on | .antispam off\n\n` +
          `> *ZERO TRACE BOT v5.0*`,
      }, { msgOptions: { quoted: msg } });
      return;
    }
    spamData[jid].enabled = sub === 'on';
    saveSpam(spamData);
    await antiBan.safeSend(sock, jid, {
      text: `🚫 Anti-spam ${sub === 'on' ? '🟢 activé' : '🔴 désactivé'}.\n\n> *ZERO TRACE BOT v5.0*`,
    }, { msgOptions: { quoted: msg } });
  },

  // Appelé depuis handler.js sur chaque message
  checkSpam: async (sock, jid, sender, antiBanLib) => {
    const spamData = loadSpam();
    if (!spamData[jid]?.enabled) return false;
    if (!SPAM_MAP.has(jid)) SPAM_MAP.set(jid, new Map());
    const groupMap = SPAM_MAP.get(jid);
    const now      = Date.now();
    const window   = 10000; // 10 secondes
    const limit    = 6;     // 6 messages max en 10s

    const msgs = (groupMap.get(sender) || []).filter(t => now - t < window);
    msgs.push(now);
    groupMap.set(sender, msgs);

    if (msgs.length >= limit) {
      groupMap.set(sender, []); // reset
      try {
        await antiBanLib.safeSend(sock, jid, {
          text: `⚠️ @${sender.split('@')[0]} — Ralentis ! Tu envoies trop de messages trop vite. (Anti-spam)\n\n> *ZERO TRACE BOT v5.0*`,
          mentions: [sender],
        });
        return true;
      } catch (e) {}
    }
    return false;
  },
};

module.exports = { warnlist, unmute, modstatus, heatmap, unban, ban, antispam, recordActivity };
