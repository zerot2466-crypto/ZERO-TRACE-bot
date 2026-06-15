/**
 * .profile — Carte de profil WhatsApp
 */
module.exports = {
  name: 'profile',
  description: 'Voir le profil d\'un membre',
  usage: '.profile [@user]',
  category: 'info',
  async execute(ctx) {
    const { sock, jid, msg, args, antiBan, sender, pushName } = ctx;
    const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const target    = mentioned[0] || sender;
    const targetNum = target.split('@')[0];
    try {
      // Récupérer PP
      let ppBuffer = null;
      try {
        const ppUrl = await sock.profilePictureUrl(target, 'image');
        const axios = require('axios');
        const res   = await axios.get(ppUrl, { responseType: 'arraybuffer', timeout: 10000 });
        ppBuffer    = Buffer.from(res.data);
      } catch (e) {}

      // Récupérer statut
      let status = 'Aucun statut';
      try {
        const s = await sock.fetchStatus(target);
        status  = s?.status || 'Aucun statut';
      } catch (e) {}

      const text =
        `👤 *PROFIL ZERO TRACE*\n\n` +
        `📱 Numéro : +${targetNum}\n` +
        `💬 Statut : ${status.length > 100 ? status.slice(0, 100) + '...' : status}` +
        `\n\n> ZERO TRACE BOT v5.0`;

      if (ppBuffer) {
        await sock.sendMessage(jid, { image: ppBuffer, caption: text }, { quoted: msg });
      } else {
        await antiBan.safeSend(sock, jid, { text }, { msgOptions: { quoted: msg } });
      }
    } catch (e) {
      await antiBan.safeSend(sock, jid, { text: `❌ Erreur profil : ${e.message}` }, { msgOptions: { quoted: msg } });
    }
  },
};
