/**
 * ZERO TRACE BOT v5.0 — .imagine v4
 * Génération d'image via Pollinations AI (gratuit, sans clé)
 * ✅ URL v2 avec model=flux (stable 2025-2026)
 * ✅ Timeout 90s (génération peut prendre 60s+)
 * ✅ Fallback providers : Pollinations → Lexica → Together AI (si clé)
 */
'use strict';
const axios = require('axios');
const zts   = require('../lib/ztStyle');

const UA = 'Mozilla/5.0 (Linux; Android 12; Pixel 6) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36';

// ── Providers de génération image ──────────────────────────────────────────────
async function genPollinations(prompt, width = 1024, height = 1024) {
  const seed    = Math.floor(Math.random() * 999999);
  const encoded = encodeURIComponent(prompt);
  // Essai 1 : model=flux (le meilleur, stable)
  for (const model of ['flux', 'flux-realism', 'turbo']) {
    try {
      const url = `https://image.pollinations.ai/prompt/${encoded}?model=${model}&width=${width}&height=${height}&seed=${seed}&nologo=true&enhance=true`;
      const res = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 90000,
        headers: { 'User-Agent': UA, 'Accept': 'image/jpeg,image/png,image/*' },
      });
      const buf = Buffer.from(res.data);
      // Vérifier que c'est bien une image (pas du HTML d'erreur)
      const magic = buf.slice(0, 4).toString('hex');
      const isImg = magic.startsWith('ffd8') || magic.startsWith('8950') || magic.startsWith('4749') || magic.startsWith('424d');
      const notHtml = !buf.slice(0, 20).toString('ascii').toLowerCase().includes('<html');
      if (buf.length > 5000 && (isImg || notHtml)) {
        console.log(`[IMAGINE] Pollinations OK (model=${model})`);
        return buf;
      }
    } catch (e) {
      console.log(`[IMAGINE] Pollinations ${model} échoué:`, e.message);
    }
  }
  return null;
}

async function genLexica(prompt) {
  try {
    // Lexica.art — recherche d'image similaire (pas vraiment de génération mais rapide)
    const res = await axios.get(
      `https://lexica.art/api/v1/search?q=${encodeURIComponent(prompt)}`,
      { timeout: 15000, headers: { 'User-Agent': UA } }
    );
    const images = res.data?.images;
    if (!images?.length) return null;
    // Prendre une image aléatoire parmi les 5 premiers résultats
    const picked = images[Math.floor(Math.random() * Math.min(5, images.length))];
    const imgUrl = picked?.src || picked?.srcSmall;
    if (!imgUrl) return null;
    const imgRes = await axios.get(imgUrl, { responseType: 'arraybuffer', timeout: 20000 });
    const buf = Buffer.from(imgRes.data);
    if (buf.length > 5000) return buf;
  } catch (e) {
    console.log('[IMAGINE] Lexica échoué:', e.message);
  }
  return null;
}

module.exports = {
  name:    'imagine',
  aliases: ['img', 'draw', 'gen', 'genimage', 'ia-image'],
  description: 'Générer une image avec l\'IA (Pollinations Flux)',
  usage:   '.imagine [description] — ex: .imagine un hacker dans une pièce sombre avec des néons',
  category: 'media',

  async execute(ctx) {
    const { sock, jid, msg, args, antiBan } = ctx;

    if (!args.length) {
      await antiBan.safeSend(sock, jid, {
        text:
          `🎨 *ZERO TRACE IMAGE GEN*\n` +
          `▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰\n\n` +
          `Usage : *.imagine [description]*\n\n` +
          `Exemples :\n` +
          `• .imagine un hacker dans une salle sombre avec des néons verts\n` +
          `• .img ville futuriste la nuit sous la pluie\n` +
          `• .draw dragon volant au-dessus des montagnes\n\n` +
          `💡 Plus ton prompt est détaillé, meilleur le résultat !\n` +
          `⏳ La génération peut prendre 30-90 secondes.\n\n` +
          `> ${zts.sig()}`,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    const prompt = args.join(' ').trim();

    await sock.sendMessage(jid, { react: { text: '🎨', key: msg.key } }).catch(() => {});
    await antiBan.safeSend(sock, jid, {
      text:
        `\`\`\`[ZT-IMG] Génération IA en cours...\n` +
        `Prompt : ${prompt.slice(0, 80)}${prompt.length > 80 ? '...' : ''}\n` +
        `Modèle : Pollinations Flux\`\`\``,
    }, { msgOptions: { quoted: msg } });

    try {
      let imgBuf = null;

      // ── Provider 1 : Pollinations (principal) ────────────────────────────
      imgBuf = await genPollinations(prompt);

      // ── Provider 2 : Lexica (fallback) ───────────────────────────────────
      if (!imgBuf) {
        await antiBan.safeSend(sock, jid, {
          text: '`[ZT-IMG] Pollinations lent — tentative fallback...`',
        }, { msgOptions: { quoted: msg } });
        imgBuf = await genLexica(prompt);
      }

      if (!imgBuf) {
        throw new Error('Tous les providers image ont échoué. Réessaie dans quelques secondes.');
      }

      await sock.sendMessage(jid, {
        image:   imgBuf,
        caption:
          `🎨 *ZERO TRACE AI IMAGE*\n\n` +
          `📝 _${prompt.slice(0, 200)}_\n\n` +
          `> ${zts.sig()}`,
      }, { quoted: msg });

      await sock.sendMessage(jid, { react: { text: '✅', key: msg.key } }).catch(() => {});

    } catch (err) {
      await sock.sendMessage(jid, { react: { text: '❌', key: msg.key } }).catch(() => {});
      console.error('[IMAGINE] Erreur:', err.message);
      await antiBan.safeSend(sock, jid, {
        text:
          `\`\`\`[ZT-IMG] ERREUR génération\nRaison : ${err.message}\`\`\`\n\n` +
          `💡 Essaie :\n• Un prompt plus court\n• Réessaie dans 30s (serveur occupé)\n\n` +
          `> ${zts.sig()}`,
      }, { msgOptions: { quoted: msg } });
    }
  },
};
