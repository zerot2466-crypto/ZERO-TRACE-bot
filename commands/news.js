/**
 * ZERO TRACE BOT v5.0 - News
 * .news → Dernières actualités en français
 * Clé API : GNEWS_API_KEY dans le fichier .env
 *           Gratuit sur https://gnews.io (100 req/jour)
 */
const fetch = require('node-fetch');

module.exports = {
  name: 'news',
  description: 'Dernières actualités en français',
  usage: '.news',
  category: 'info',

  async execute(ctx) {
    const { sock, jid, msg, antiBan } = ctx;

    const apiKey = process.env.GNEWS_API_KEY;

    if (!apiKey || apiKey === 'METS-TA-CLE-ICI') {
      await antiBan.safeSend(sock, jid, {
        text:
          `📰 *ACTUALITÉS*\n\n` +
          `⚠️ Clé API GNews non configurée.\n\n` +
          `Pour activer cette commande :\n` +
          `1. Va sur *https://gnews.io*\n` +
          `2. Crée un compte gratuit\n` +
          `3. Copie ta clé dans le fichier *.env*\n` +
          `   \`GNEWS_API_KEY dans keys.js\`\n\n` +
          `> *ZERO TRACE BOT v5.0*`,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    try {
      await antiBan.safeSend(sock, jid, { text: '📰 Chargement des actualités...' }, { msgOptions: { quoted: msg } });

      const res  = await fetch(`https://gnews.io/api/v4/top-headlines?lang=fr&max=5&apikey=${apiKey}`);
      const data = await res.json();

      if (!data.articles || data.articles.length === 0) {
        await antiBan.safeSend(sock, jid, {
          text: '📰 Aucune actualité disponible pour le moment.',
        }, { msgOptions: { quoted: msg } });
        return;
      }

      const text = data.articles.slice(0, 5).map((a, i) =>
        `${i + 1}. *${a.title}*\n   📌 ${a.source?.name || 'Source inconnue'}`
      ).join('\n\n');

      await antiBan.safeSend(sock, jid, {
        text: `📰 *ACTUALITÉS DU JOUR*\n\n${text}\n\n> *ZERO TRACE BOT v5.0*`,
      }, { msgOptions: { quoted: msg } });

    } catch (e) {
      await antiBan.safeSend(sock, jid, {
        text: `❌ Impossible de charger les actualités : ${e.message}`,
      }, { msgOptions: { quoted: msg } });
    }
  },
};
