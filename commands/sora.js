/**
 * ZERO TRACE BOT v3.0 - Commande Sora / Video
 * Génération de vidéo (placeholder — API à configurer dans .env)
 */

module.exports = {
  name: 'sora',
  description: 'Générer une vidéo IA (nécessite une API)',
  usage: '.sora [prompt] | .video [prompt]',
  category: 'media',

  async execute(ctx) {
    const { sock, jid, msg, args, antiBan } = ctx;

    if (args.length === 0) {
      await antiBan.safeSend(sock, jid, {
        text: `🎬 *ZERO TRACE VIDEO GEN*\n\nUsage: *.sora [description]*\n\nExemple:\n• .sora a cat walking in the rain\n• .video futuristic robot battle\n\n⚠️ _Nécessite VIDEO_API_URL dans keys.js_`,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    const videoApiUrl = process.env.VIDEO_API_URL;
    if (!videoApiUrl || videoApiUrl.includes('example.com')) {
      await antiBan.safeSend(sock, jid, {
        text: `⚠️ *Génération vidéo non configurée*\n\nConfigure *VIDEO_API_URL* dans *keys.js* pour activer cette fonctionnalité.\n\nAPI suggérées:\n• Runway ML\n• Stability AI Video\n• Pika Labs`,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    const prompt = args.join(' ');
    await antiBan.safeSend(sock, jid, {
      text: `🎬 _Génération vidéo en cours..._\n📝 Prompt: *${prompt}*\n\n⏳ _Cela peut prendre quelques minutes..._`,
    }, { msgOptions: { quoted: msg } });

    // Intégration API à personnaliser selon le provider choisi
    try {
      const axios = require('axios');
      const resp  = await axios.post(videoApiUrl, { prompt }, {
        timeout: 120000,
        headers: { 'Authorization': `Bearer ${process.env.VIDEO_API_KEY || ''}`, 'Content-Type': 'application/json' },
      });

      const videoUrl = resp.data?.url || resp.data?.video_url;
      if (!videoUrl) throw new Error('Pas d\'URL vidéo dans la réponse');

      await antiBan.safeSend(sock, jid, {
        text: `🎬 *Vidéo générée !*\n\n📝 Prompt: _${prompt}_\n🔗 URL: ${videoUrl}`,
      }, { typing: false });

    } catch (err) {
      await antiBan.safeSend(sock, jid, {
        text: `❌ Erreur génération vidéo:\n${err.message}`,
      }, { typing: false });
    }
  },
};
