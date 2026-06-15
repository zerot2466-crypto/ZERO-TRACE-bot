/**
 * ZERO TRACE BOT v5.0 — .lockgroup
 * Verrouiller/déverrouiller le groupe
 */
'use strict';
module.exports = {
  name: 'lockgroup',
  description: 'Verrouiller ou déverrouiller le groupe (admins seulement)',
  usage: '.lockgroup | .lockgroup off | .unlockgroup',
  category: 'admin',
  async execute(ctx) {
    const { sock, jid, msg, args, antiBan, isGroup, isSudo } = ctx;
    if (!isGroup) { await antiBan.safeSend(sock, jid, { text: '❌ Groupes uniquement.' }, { msgOptions: { quoted: msg } }); return; }
    if (!isSudo)  { await antiBan.safeSend(sock, jid, { text: '❌ Admins/sudos uniquement.' }, { msgOptions: { quoted: msg } }); return; }

    const unlock = args[0]?.toLowerCase() === 'off' || ctx.command === 'unlockgroup';
    try {
      await sock.groupSettingUpdate(jid, unlock ? 'not_announcement' : 'announcement');
      await antiBan.safeSend(sock, jid, {
        text: unlock
          ? '🔓 *Groupe déverrouillé.*\nTous les membres peuvent de nouveau écrire.'
          : '🔒 *Groupe verrouillé.*\nSeuls les admins peuvent écrire.',
      }, { msgOptions: { quoted: msg } });
    } catch (e) {
      await antiBan.safeSend(sock, jid, { text: '❌ Impossible de modifier le groupe. Le bot doit être admin.' }, { msgOptions: { quoted: msg } });
    }
  },
};
