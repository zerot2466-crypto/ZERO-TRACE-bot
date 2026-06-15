'use strict';
const zts = require('../lib/ztStyle');

module.exports = {
  name: 'kick', aliases: ['ban', 'expulser', 'virer'],
  description: 'Expulser un membre du groupe',
  usage: '.kick @user', category: 'admin',

  async execute(ctx) {
    const { sock, jid, msg, antiBan, isGroup, isOwner, isSudo, isGroupAdmin } = ctx;
    if (!isGroup) { await antiBan.safeSend(sock, jid, { text: zts.randErr(zts.GROUP_ONLY) }, { msgOptions: { quoted: msg } }); return; }
    if (!isOwner && !isSudo && !isGroupAdmin) { await antiBan.safeSend(sock, jid, { text: zts.randErr(zts.PERM_ERRORS) }, { msgOptions: { quoted: msg } }); return; }

    const mentions = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const target   = mentions[0] || msg.message?.extendedTextMessage?.contextInfo?.participant;
    if (!target) {
      await antiBan.safeSend(sock, jid, {
        text:
          `💀 *PROTOCOLE KICK — USAGE*\n▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰\n` +
          `Mentionne la cible : \`.kick @user\`\n\n> ${zts.sig()}`,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    try {
      await sock.groupParticipantsUpdate(jid, [target], 'remove');
      await antiBan.safeSend(sock, jid, {
        text:
          `\`\`\`[ZT-OS] Protocole EXPULSION exécuté\nTarget   : +${target.split('@')[0]}\nAction   : KICKED\nStatus   : SUCCESS ✓\`\`\`\n\n` +
          `💀 @${target.split('@')[0]} a été éjecté du groupe.\n_"Certains ne méritent pas l'accès au réseau."_\n\n> ${zts.sig()}`,
        mentions: [target],
      }, { msgOptions: { quoted: msg } });
    } catch (e) {
      await antiBan.safeSend(sock, jid, {
        text:
          `\`\`\`[ZT-OS] ERREUR — Expulsion échouée\nRaison   : ${e.message}\nFix      : Rendre le bot ADMIN du groupe\`\`\`\n\n> ${zts.sig()}`,
      }, { msgOptions: { quoted: msg } });
    }
  },
};
