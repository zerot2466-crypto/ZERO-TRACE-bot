const zts = require('../lib/ztStyle');
/**
 * .qrcode — Générer un QR Code depuis du texte/URL
 */
const axios = require('axios');
module.exports = {
  name: 'qrcode',
  description: 'Générer un QR Code',
  usage: '.qrcode [texte ou lien]',
  category: 'util',
  async execute(ctx) {
    const { sock, jid, msg, args, antiBan } = ctx;
    const text = args.join(' ').trim();
    if (!text) {
      await antiBan.safeSend(sock, jid, {
        text: `\`\`\`[ZT-QR] Générateur de QR Code
Usage : .qrcode [texte ou URL]
Ex    : .qrcode https://google.com\`\`\`

> ${zts.sig()}`,
      }, { msgOptions: { quoted: msg } });
      return;
    }
    try {
      const encoded = encodeURIComponent(text);
      const url = `https://api.qrserver.com/v1/create-qr-code/?size=512x512&data=${encoded}&format=png`;
      const res  = await axios.get(url, { responseType: 'arraybuffer', timeout: 15000 });
      await sock.sendMessage(jid, {
        image: Buffer.from(res.data),
        caption: `📱 *QR CODE*\n\nContenu : ${text.length > 60 ? text.slice(0, 60) + '...' : text}`,
      }, { quoted: msg });
    } catch (e) {
      await antiBan.safeSend(sock, jid, { text: `❌ Erreur QR Code : ${e.message}` }, { msgOptions: { quoted: msg } });
    }
  },
};
