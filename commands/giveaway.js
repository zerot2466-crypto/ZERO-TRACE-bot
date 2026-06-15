/**
 * .giveaway — Organiser un tirage au sort dans le groupe
 */
module.exports = {
  name: 'giveaway',
  description: 'Tirer au sort un gagnant dans le groupe',
  usage: '.giveaway [titre du lot]',
  category: 'fun',
  async execute(ctx) {
    const { sock, jid, msg, args, antiBan, sender, isOwner, isSudo, isGroupAdmin} = ctx;
    if (!jid.endsWith('@g.us')) {
      await antiBan.safeSend(sock, jid, { text: '❌ Commande de groupe uniquement.' }, { msgOptions: { quoted: msg } });
      return;
    }
    let isAdmin = isOwner || isSudo || isGroupAdmin;
    try {
      const meta = await sock.groupMetadata(jid);
      isAdmin = isAdmin || meta.participants.some(p => p.id === sender && (p.admin === 'admin' || p.admin === 'superadmin'));
    } catch (e) {}
    if (!isAdmin) {
      await antiBan.safeSend(sock, jid, { text: '❌ Seuls les admins peuvent organiser un tirage.' }, { msgOptions: { quoted: msg } });
      return;
    }
    const lot = args.join(' ').trim() || '🎁 Surprise';
    try {
      const meta   = await sock.groupMetadata(jid);
      const eligibles = meta.participants.filter(p => p.id !== sender);
      if (!eligibles.length) {
        await antiBan.safeSend(sock, jid, { text: '❌ Pas assez de membres.' }, { msgOptions: { quoted: msg } });
        return;
      }
      const gagnant = eligibles[Math.floor(Math.random() * eligibles.length)];
      await antiBan.safeSend(sock, jid, {
        text:
          `🎉 *TIRAGE AU SORT !*\n\n` +
          `🏆 Lot : *${lot}*\n\n` +
          `🥁 Et le gagnant est...\n\n` +
          `🎊 *@${gagnant.id.split('@')[0]}* ! 🎊\n\n` +
          `Félicitations ! 🥳\n\n> ZERO TRACE BOT v5.0`,
        mentions: [gagnant.id],
      }, { msgOptions: { quoted: msg } });
    } catch (e) {
      await antiBan.safeSend(sock, jid, { text: `❌ Erreur : ${e.message}` }, { msgOptions: { quoted: msg } });
    }
  },
};
