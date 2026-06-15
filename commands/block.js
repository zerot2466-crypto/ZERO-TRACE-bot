const zts = require('../lib/ztStyle');
/**
 * ZERO TRACE BOT v5.0 - Block / Unblock
 * .block @user | .unblock @user
 */
const config = require('../config');

module.exports = {
  name: 'block',
  description: 'Bloquer ou débloquer un contact',
  usage: '.block @user | .unblock @user',
  category: 'owner',

  async execute(ctx) {
    const { sock, jid, msg, args, antiBan, isOwner, command } = ctx;

    if (!isOwner) {
      await antiBan.safeSend(sock, jid, { text: zts.randErr(zts.OWNER_ERRORS) }, { msgOptions: { quoted: msg } });
      return;
    }

    const mentions = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    let target = mentions[0];
    if (!target && args[0]) {
      const num = args[0].replace(/[^0-9]/g, '');
      if (num.length >= 7) target = `${num}@s.whatsapp.net`;
    }

    if (!target) {
      await antiBan.safeSend(sock, jid, { text: `\`\`\`[ZT-BLOCK] Usage: .block @user ou .block numéro\`\`\`\n\n> ${zts.sig()}` }, { msgOptions: { quoted: msg } });
      return;
    }

    const action = command === 'unblock' ? 'unblock' : 'block';
    try {
      await sock.updateBlockStatus(target, action);
      const num = target.split('@')[0];
      await antiBan.safeSend(sock, jid, {
        text: action === 'block'
          ? `🚫 *+${num}* a été *bloqué*.`
          : `✅ *+${num}* a été *débloqué*.`,
        mentions: [target],
      }, { msgOptions: { quoted: msg } });
    } catch (e) {
      await antiBan.safeSend(sock, jid, { text: `❌ Erreur : ${e.message}` }, { msgOptions: { quoted: msg } });
    }
  },
};
