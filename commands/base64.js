/**
 * .base64 — Encodage/décodage Base64
 */
module.exports = {
  name: 'base64',
  description: 'Encoder ou décoder en Base64',
  usage: '.base64 encode [texte] | .base64 decode [texte]',
  category: 'util',
  async execute(ctx) {
    const { sock, jid, msg, args, antiBan } = ctx;
    const sub  = (args[0] || '').toLowerCase();
    const text = args.slice(1).join(' ').trim();
    if (!sub || !text) {
      await antiBan.safeSend(sock, jid, {
        text: `🔢 *BASE64*\n\nUsage :\n.base64 encode [texte]\n.base64 decode [texte]`,
      }, { msgOptions: { quoted: msg } });
      return;
    }
    try {
      let result;
      if (sub === 'encode') {
        result = Buffer.from(text, 'utf8').toString('base64');
        await antiBan.safeSend(sock, jid, {
          text: `🔒 *Base64 Encodé*\n\nEntrée : ${text}\nSortie : \`${result}\``,
        }, { msgOptions: { quoted: msg } });
      } else if (sub === 'decode') {
        result = Buffer.from(text, 'base64').toString('utf8');
        await antiBan.safeSend(sock, jid, {
          text: `🔓 *Base64 Décodé*\n\nEntrée : ${text}\nSortie : \`${result}\``,
        }, { msgOptions: { quoted: msg } });
      } else {
        await antiBan.safeSend(sock, jid, { text: '❌ Utilise encode ou decode.' }, { msgOptions: { quoted: msg } });
      }
    } catch (e) {
      await antiBan.safeSend(sock, jid, { text: `❌ Erreur : ${e.message}` }, { msgOptions: { quoted: msg } });
    }
  },
};
