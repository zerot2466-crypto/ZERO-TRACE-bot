/**
 * ZERO TRACE BOT v5.0 — .rename
 * Renommer le groupe
 */
'use strict';
module.exports = {
  name: 'rename',
  description: 'Renommer le groupe',
  usage: '.rename [nouveau nom]',
  category: 'admin',
  async execute(ctx) {
    const { sock, jid, msg, args, antiBan, isGroup, isSudo } = ctx;
    if (!isGroup) { await antiBan.safeSend(sock, jid, { text: '❌ Groupes uniquement.' }, { msgOptions: { quoted: msg } }); return; }
    if (!isSudo)  { await antiBan.safeSend(sock, jid, { text: '❌ Admins uniquement.' }, { msgOptions: { quoted: msg } }); return; }
    const newName = args.join(' ').trim();
    if (!newName) { await antiBan.safeSend(sock, jid, { text: '❌ Usage : *.rename [nouveau nom]*' }, { msgOptions: { quoted: msg } }); return; }
    if (newName.length > 100) { await antiBan.safeSend(sock, jid, { text: '❌ Nom trop long (max 100 caractères).' }, { msgOptions: { quoted: msg } }); return; }
    try {
      await sock.groupUpdateSubject(jid, newName);
      await antiBan.safeSend(sock, jid, { text: `✅ Groupe renommé : *${newName}*` }, { msgOptions: { quoted: msg } });
    } catch {
      await antiBan.safeSend(sock, jid, { text: '❌ Impossible de renommer. Le bot doit être admin.' }, { msgOptions: { quoted: msg } });
    }
  },
};
