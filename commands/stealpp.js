/**
 * .stealpp / .pp — Voler/voir la photo de profil
 */
const axios = require('axios');
module.exports = {
  name: 'stealpp',
  description: 'Voir la photo de profil d\'un membre',
  usage: '.stealpp @user | .pp @user',
  category: 'util',
  async execute(ctx) {
    const { sock, jid, msg, antiBan, sender } = ctx;
    const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const target    = mentioned[0] || sender;
    try {
      const ppUrl = await sock.profilePictureUrl(target, 'image');
      const res   = await axios.get(ppUrl, { responseType: 'arraybuffer', timeout: 15000 });
      await sock.sendMessage(jid, {
        image: Buffer.from(res.data),
        caption: `🖼️ *Photo de profil*\n@${target.split('@')[0]}`,
        mentions: [target],
      }, { quoted: msg });
    } catch (e) {
      await antiBan.safeSend(sock, jid, {
        text: `❌ Impossible de récupérer la photo de profil de @${target.split('@')[0]}\n(Profil peut-être privé)`,
        mentions: [target],
      }, { msgOptions: { quoted: msg } });
    }
  },
};
