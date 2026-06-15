/**
 * ZERO TRACE BOT v5.0 - Grouplist
 * .grouplist → Lister tous les groupes du bot
 */
module.exports = {
  name: 'grouplist',
  description: 'Lister tous les groupes où le bot est présent',
  usage: '.grouplist',
  category: 'owner',

  async execute(ctx) {
    const { sock, jid, msg, antiBan, isOwner } = ctx;

    if (!isOwner) {
      await antiBan.safeSend(sock, jid, { text: '❌ Commande réservée au propriétaire.' }, { msgOptions: { quoted: msg } });
      return;
    }

    try {
      const chats = await sock.groupFetchAllParticipating();
      const groups = Object.values(chats);

      if (groups.length === 0) {
        await antiBan.safeSend(sock, jid, { text: '📭 Le bot n\'est dans aucun groupe.' }, { msgOptions: { quoted: msg } });
        return;
      }

      const list = groups.map((g, i) => `${i + 1}. *${g.subject}* — ${g.participants.length} membres`).join('\n');

      await antiBan.safeSend(sock, jid, {
        text:
          `📋 *GROUPES DU BOT (${groups.length})*\n\n` +
          `${list}\n\n` +
          `> *ZERO TRACE BOT v5.0*`,
      }, { msgOptions: { quoted: msg } });
    } catch (e) {
      await antiBan.safeSend(sock, jid, { text: `❌ Erreur : ${e.message}` }, { msgOptions: { quoted: msg } });
    }
  },
};
