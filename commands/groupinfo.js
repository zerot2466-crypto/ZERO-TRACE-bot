/**
 * .groupinfo — Informations complètes sur le groupe
 */
module.exports = {
  name: 'groupinfo',
  description: 'Informations complètes sur le groupe',
  usage: '.groupinfo',
  category: 'info',
  async execute(ctx) {
    const { sock, jid, msg, antiBan } = ctx;
    if (!jid.endsWith('@g.us')) {
      await antiBan.safeSend(sock, jid, { text: '❌ Commande de groupe uniquement.' }, { msgOptions: { quoted: msg } });
      return;
    }
    try {
      const meta   = await sock.groupMetadata(jid);
      const total  = meta.participants.length;
      const admins = meta.participants.filter(p => p.admin).length;
      const membres = total - admins;
      const creation = new Date(meta.creation * 1000).toLocaleDateString('fr-FR');
      await antiBan.safeSend(sock, jid, {
        text:
          `📊 *INFOS DU GROUPE*\n\n` +
          `📌 Nom : ${meta.subject}\n` +
          `🆔 ID : ${jid.split('@')[0]}\n` +
          `👥 Membres : ${total}\n` +
          `👑 Admins : ${admins}\n` +
          `👤 Membres simples : ${membres}\n` +
          `📅 Créé le : ${creation}\n` +
          `📝 Description :\n${meta.desc || 'Aucune description'}\n\n` +
          `> ZERO TRACE BOT v5.0`,
      }, { msgOptions: { quoted: msg } });
    } catch (e) {
      await antiBan.safeSend(sock, jid, { text: `❌ Erreur : ${e.message}` }, { msgOptions: { quoted: msg } });
    }
  },
};
