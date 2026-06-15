/**
 * ZERO TRACE BOT v5.0 — .imagine2 v3
 * Génération d'image avec style artistique
 * ✅ URL Pollinations v2 (model=flux)
 * ✅ Timeout 90s
 * ✅ Prompt enrichi par style
 */
'use strict';
const axios = require('axios');
const zts   = require('../lib/ztStyle');

const UA = 'Mozilla/5.0 (Linux; Android 12; Pixel 6) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36';

const STYLES = {
  anime:     { suffix: 'anime style, vibrant colors, detailed, studio ghibli quality', emoji: '🎌', model: 'flux' },
  realistic: { suffix: 'photorealistic, 8k ultra HD, highly detailed, DSLR photo', emoji: '📷', model: 'flux-realism' },
  cartoon:   { suffix: 'cartoon style, colorful, fun, Disney-like illustration', emoji: '🎭', model: 'flux' },
  cyber:     { suffix: 'cyberpunk neon aesthetic, futuristic city, rain reflections, blade runner', emoji: '🌆', model: 'flux' },
  oil:       { suffix: 'oil painting, classical art style, museum quality, impressionist', emoji: '🖼️', model: 'flux' },
  pixel:     { suffix: '16-bit pixel art, retro game style, 8-bit colors', emoji: '👾', model: 'flux' },
  dark:      { suffix: 'dark fantasy, gothic, dramatic lighting, shadows, atmospheric', emoji: '🌑', model: 'flux' },
  logo:      { suffix: 'modern logo design, minimalist, professional, vector style, white background', emoji: '✏️', model: 'flux' },
  hacker:    { suffix: 'hacker aesthetic, green terminal glow, dark room, neon code, cybersecurity', emoji: '💻', model: 'flux' },
  watercolor:{ suffix: 'watercolor painting, soft colors, artistic brush strokes, delicate', emoji: '🎨', model: 'flux' },
};

module.exports = {
  name:    'imagine2',
  aliases: ['img2', 'draw2', 'style'],
  description: 'Générer une image avec style artistique',
  usage:   '.imagine2 [style] [description]',
  category: 'media',

  async execute(ctx) {
    const { sock, jid, msg, args, antiBan } = ctx;

    const style = args[0]?.toLowerCase();
    const desc  = args.slice(1).join(' ').trim();

    if (!style || !desc || !STYLES[style]) {
      const list = Object.entries(STYLES)
        .map(([k, v]) => `${v.emoji} *${k}*`)
        .join(' · ');
      await antiBan.safeSend(sock, jid, {
        text:
          `🎨 *IMAGE IA AVEC STYLE*\n` +
          `▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰\n\n` +
          `Usage : *.imagine2 [style] [description]*\n\n` +
          `🎭 *Styles disponibles :*\n${list}\n\n` +
          `Exemples :\n` +
          `• .imagine2 anime fille aux cheveux bleus sous la pluie\n` +
          `• .imagine2 cyber ville futuriste la nuit\n` +
          `• .imagine2 hacker salle de serveurs sombre\n\n` +
          `> ${zts.sig()}`,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    const s          = STYLES[style];
    const fullPrompt = `${desc}, ${s.suffix}`;
    const seed       = Math.floor(Math.random() * 999999);

    await sock.sendMessage(jid, { react: { text: s.emoji, key: msg.key } }).catch(() => {});
    await antiBan.safeSend(sock, jid, {
      text: `\`\`\`[ZT-IMG] Style ${style.toUpperCase()} en cours...\nPrompt : ${desc.slice(0, 80)}\`\`\``,
    }, { msgOptions: { quoted: msg } });

    try {
      const encoded = encodeURIComponent(fullPrompt);
      const url = `https://image.pollinations.ai/prompt/${encoded}?model=${s.model}&width=1024&height=1024&seed=${seed}&nologo=true&enhance=true`;

      const res = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 90000,
        headers: { 'User-Agent': UA, 'Accept': 'image/jpeg,image/png,image/*' },
      });

      const imgBuf = Buffer.from(res.data);
      const notHtml = !imgBuf.slice(0, 20).toString('ascii').toLowerCase().includes('<html');
      if (imgBuf.length < 5000 || !notHtml) throw new Error('Réponse invalide du serveur image');

      await sock.sendMessage(jid, {
        image:   imgBuf,
        caption:
          `${s.emoji} *STYLE ${style.toUpperCase()}*\n\n` +
          `📝 _${desc.slice(0, 200)}_\n\n` +
          `> ${zts.sig()}`,
      }, { quoted: msg });

      await sock.sendMessage(jid, { react: { text: '✅', key: msg.key } }).catch(() => {});

    } catch (e) {
      await sock.sendMessage(jid, { react: { text: '❌', key: msg.key } }).catch(() => {});
      await antiBan.safeSend(sock, jid, {
        text: `\`\`\`[ZT-IMG] Erreur : ${e.message}\`\`\`\n\n> ${zts.sig()}`,
      }, { msgOptions: { quoted: msg } });
    }
  },
};
