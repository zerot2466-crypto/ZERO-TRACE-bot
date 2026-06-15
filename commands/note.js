/**
 * ZERO TRACE BOT v5.0 — .note
 * Sauvegarder et afficher des notes/règles de groupe
 */
'use strict';
const zts = require('../lib/ztStyle');
const fs   = require('fs-extra');
const path = require('path');

const DATA_FILE = path.join(__dirname, '..', 'data', 'notes.json');
function load() { try { return fs.readJsonSync(DATA_FILE); } catch { return {}; } }
function save(d) { fs.ensureDirSync(path.dirname(DATA_FILE)); fs.writeJsonSync(DATA_FILE, d, { spaces: 2 }); }

module.exports = {
  name: 'note',
  description: 'Gérer les notes/règles du groupe',
  usage: '.note add [titre] [texte] | .note list | .note [titre] | .note del [titre]',
  category: 'admin',
  async execute(ctx) {
    const { sock, jid, msg, args, antiBan, isSudo } = ctx;
    const data = load();
    if (!data[jid]) data[jid] = {};
    const sub = args[0]?.toLowerCase();

    if (!sub || sub === 'list') {
      const keys = Object.keys(data[jid]);
      if (!keys.length) { await antiBan.safeSend(sock, jid, { text: '📋 Aucune note enregistrée.\n\nAjouter : *.note add [titre] [texte]*' }, { msgOptions: { quoted: msg } }); return; }
      await antiBan.safeSend(sock, jid, {
        text: `📋 *NOTES DU GROUPE*\n\n${keys.map((k, i) => `${i + 1}. *${k}*`).join('\n')}\n\nAfficher : *.note [titre]*`,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    if (sub === 'add') {
      if (!isSudo) { await antiBan.safeSend(sock, jid, { text: '❌ Admins uniquement.' }, { msgOptions: { quoted: msg } }); return; }
      const titre = args[1];
      const texte = args.slice(2).join(' ');
      if (!titre || !texte) { await antiBan.safeSend(sock, jid, { text: '❌ Usage : .note add [titre] [texte]' }, { msgOptions: { quoted: msg } }); return; }
      data[jid][titre.toLowerCase()] = { titre, texte, at: new Date().toISOString() };
      save(data);
      await antiBan.safeSend(sock, jid, { text: `✅ Note *${titre}* enregistrée.` }, { msgOptions: { quoted: msg } });
      return;
    }

    if (sub === 'del' || sub === 'delete' || sub === 'supprimer') {
      if (!isSudo) { await antiBan.safeSend(sock, jid, { text: '❌ Admins uniquement.' }, { msgOptions: { quoted: msg } }); return; }
      const titre = args[1]?.toLowerCase();
      if (!titre || !data[jid][titre]) { await antiBan.safeSend(sock, jid, { text: `\`\`\`[ZT-NOTE] ERREUR: Note introuvable\`\`\`\n\n> ${zts.sig()}` }, { msgOptions: { quoted: msg } }); return; }
      delete data[jid][titre]; save(data);
      await antiBan.safeSend(sock, jid, { text: `🗑️ Note *${titre}* supprimée.` }, { msgOptions: { quoted: msg } });
      return;
    }

    // Afficher une note
    const note = data[jid][sub];
    if (!note) { await antiBan.safeSend(sock, jid, { text: `❌ Note *${sub}* introuvable.\n\nListe : *.note list*` }, { msgOptions: { quoted: msg } }); return; }
    await antiBan.safeSend(sock, jid, {
      text: `📌 *${note.titre.toUpperCase()}*\n\n${note.texte}\n\n> _ZERO TRACE 😈_`,
    }, { msgOptions: { quoted: msg } });
  },
};
