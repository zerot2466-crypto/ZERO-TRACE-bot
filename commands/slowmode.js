/**
 * ZERO TRACE BOT v5.0 — .slowmode
 * Anti-spam : délai minimum entre messages d'un même user
 */
'use strict';
const fs   = require('fs-extra');
const path = require('path');

const DATA_FILE = path.join(__dirname, '..', 'data', 'slowmode.json');
const LAST_MSG  = {};  // en mémoire: { jid_sender: timestamp }

function load() { try { return fs.readJsonSync(DATA_FILE); } catch { return {}; } }
function save(d) { fs.ensureDirSync(path.dirname(DATA_FILE)); fs.writeJsonSync(DATA_FILE, d, { spaces: 2 }); }

module.exports = {
  name: 'slowmode',
  description: 'Limite la fréquence des messages dans le groupe',
  usage: '.slowmode [secondes] | .slowmode off',
  category: 'admin',

  // Vérifie si un sender doit être ralenti (appelé depuis handler)
  checkSlowMode(jid, sender, data) {
    if (!data[jid] || !data[jid].active) return false;
    const delay = (data[jid].delay || 10) * 1000;
    const key   = `${jid}_${sender}`;
    const now   = Date.now();
    if (LAST_MSG[key] && now - LAST_MSG[key] < delay) return true;
    LAST_MSG[key] = now;
    return false;
  },

  loadData: load,

  async execute(ctx) {
    const { sock, jid, msg, args, antiBan, isGroup, isSudo } = ctx;
    if (!isGroup) { await antiBan.safeSend(sock, jid, { text: '❌ Groupes uniquement.' }, { msgOptions: { quoted: msg } }); return; }
    if (!isSudo)  { await antiBan.safeSend(sock, jid, { text: '❌ Admins/sudos uniquement.' }, { msgOptions: { quoted: msg } }); return; }

    const data = load();
    const sub  = args[0]?.toLowerCase();

    if (sub === 'off' || sub === 'désactiver') {
      data[jid] = { active: false, delay: 0 };
      save(data);
      await antiBan.safeSend(sock, jid, { text: '✅ *Slow mode désactivé.*' }, { msgOptions: { quoted: msg } });
      return;
    }

    const secs = parseInt(args[0]) || 10;
    if (secs < 1 || secs > 3600) {
      await antiBan.safeSend(sock, jid, { text: '❌ Délai entre 1 et 3600 secondes.' }, { msgOptions: { quoted: msg } });
      return;
    }
    data[jid] = { active: true, delay: secs };
    save(data);
    await antiBan.safeSend(sock, jid, {
      text: `🐢 *SLOW MODE ACTIVÉ*\n\n⏱️ Délai entre messages : *${secs} seconde${secs > 1 ? 's' : ''}*\nLes membres ne peuvent envoyer qu'un message toutes les ${secs}s.\n\nDésactiver : *.slowmode off*`,
    }, { msgOptions: { quoted: msg } });
  },
};
