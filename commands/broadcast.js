const zts = require('../lib/ztStyle');
/**
 * ZERO TRACE BOT v5.0 - Broadcast
 * .broadcast [message] → Envoyer à tous les groupes
 */
const config = require('../config');

module.exports = {
  name: 'broadcast',
  description: 'Envoyer un message à tous les groupes',
  usage: '.broadcast [message]',
  category: 'owner',

  async execute(ctx) {
    const { sock, jid, msg, args, antiBan, isOwner } = ctx;

    if (!isOwner) {
      await antiBan.safeSend(sock, jid, { text: '❌ Seul le propriétaire peut utiliser cette commande.' }, { msgOptions: { quoted: msg } });
      return;
    }

    const text = args.join(' ');
    if (!text) {
      await antiBan.safeSend(sock, jid, { text: `\`\`\`[ZT-BROADCAST] Usage: .broadcast [message]\`\`\`\n\n> ${zts.sig()}` }, { msgOptions: { quoted: msg } });
      return;
    }

    await antiBan.safeSend(sock, jid, { text: '📡 Envoi en cours...' }, { msgOptions: { quoted: msg } });

    let groups = [];
    try {
      const chats = await sock.groupFetchAllParticipating();
      groups = Object.keys(chats);
    } catch (e) {
      await antiBan.safeSend(sock, jid, { text: '❌ Impossible de récupérer la liste des groupes.' }, { msgOptions: { quoted: msg } });
      return;
    }

    const broadcastMsg =
      `📢 *BROADCAST — ZERO TRACE BOT*\n\n` +
      `${text}\n\n` +
      `> *ZERO TRACE BOT v5.0*`;

    let sent = 0;
    for (const groupJid of groups) {
      try {
        await sock.sendMessage(groupJid, { text: broadcastMsg });
        sent++;
        await new Promise(r => setTimeout(r, 1000));
      } catch (e) {}
    }

    await antiBan.safeSend(sock, jid, {
      text: `✅ Broadcast envoyé à *${sent}/${groups.length}* groupes.`,
    }, { msgOptions: { quoted: msg } });
  },
};
