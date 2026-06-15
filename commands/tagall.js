const zts = require('../lib/ztStyle');
/**
 * ZERO TRACE BOT v3.0 - Commande Tagall
 * Mentionner tous les membres d'un groupe
 */

module.exports = {
  name: 'tagall',
  description: 'Mentionner tous les membres du groupe',
  usage: '.tagall [message optionnel]',
  category: 'admin',

  async execute(ctx) {
    const { sock, jid, msg, args, antiBan, isGroup, isOwner, isSudo, isGroupAdmin } = ctx;

    if (!isGroup) {
      await antiBan.safeSend(sock, jid, {
        text: zts.randErr(zts.GROUP_ONLY),
      }, { msgOptions: { quoted: msg } });
      return;
    }

    if (!isOwner && !isSudo && !isGroupAdmin) {
      await antiBan.safeSend(sock, jid, {
        text: zts.randErr(zts.PERM_ERRORS),
      }, { msgOptions: { quoted: msg } });
      return;
    }

    try {
      const groupMeta = await sock.groupMetadata(jid);
      const members   = groupMeta.participants.map(p => p.id);
      const message   = args.join(' ') || '📢 Attention tout le monde !';

      const mentions  = members.map(m => `@${m.split('@')[0]}`).join(' ');
      const text      = `📢 *${message}*\n\n${mentions}`;

      await antiBan.safeSend(sock, jid, { text, mentions: members }, { msgOptions: { quoted: msg } });
    } catch (err) {
      await antiBan.safeSend(sock, jid, {
        text: `❌ Erreur tagall: ${err.message}`,
      }, { msgOptions: { quoted: msg } });
    }
  },
};
