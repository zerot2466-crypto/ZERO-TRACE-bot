/**
 * ZERO TRACE BOT v5.0 - Web & API (Free APIs, aucune clé requise)
 * myip · catfact · dogpic · gif · lyrics · nasa · animals
 * Toutes les APIs utilisées sont gratuites et sans clé API
 */
'use strict';

const axios = require('axios');
const fs    = require('fs-extra');
const path  = require('path');

const TIMEOUT = 10000;

// ── myip ──────────────────────────────────────────────────────────────────────
const myip = {
  name: 'myip',
  execute: async (ctx) => {
    const { sock, jid, msg, antiBan } = ctx;
    try {
      await sock.sendMessage(jid, { react: { text: '🌐', key: msg.key } }).catch(() => {});
      const res = await axios.get('https://api.ipify.org?format=json', { timeout: TIMEOUT });
      const ip  = res.data.ip;
      const geo = await axios.get(`http://ip-api.com/json/${ip}?fields=country,city,isp,org,as`, { timeout: TIMEOUT });
      const g   = geo.data;
      await antiBan.safeSend(sock, jid, {
        text:
          `🌐 *IP DU BOT*\n\n` +
          `📡 IP : \`${ip}\`\n` +
          `🌍 Pays : ${g.country || 'N/A'}\n` +
          `🏙️ Ville : ${g.city || 'N/A'}\n` +
          `🏢 FAI : ${g.isp || 'N/A'}\n\n` +
          `> *ZERO TRACE BOT v5.0*`,
      }, { msgOptions: { quoted: msg } });
    } catch (e) {
      await antiBan.safeSend(sock, jid, { text: `❌ Erreur : ${e.message}` }, { msgOptions: { quoted: msg } });
    }
  },
};

// ── catfact ───────────────────────────────────────────────────────────────────
const catfact = {
  name: 'catfact',
  execute: async (ctx) => {
    const { sock, jid, msg, antiBan } = ctx;
    try {
      const res  = await axios.get('https://catfact.ninja/fact', { timeout: TIMEOUT });
      const fact = res.data.fact;
      // Traduire mentalement (on ne peut pas, mais on donne le fait en anglais avec explication)
      await antiBan.safeSend(sock, jid, {
        text:
          `🐱 *CAT FACT*\n\n` +
          `_"${fact}"_\n\n` +
          `> *ZERO TRACE BOT v5.0*`,
      }, { msgOptions: { quoted: msg } });
    } catch (e) {
      const FALLBACK = [
        "Les chats dorment en moyenne 12 à 16 heures par jour.",
        "Un chat peut sauter jusqu'à 6 fois sa propre hauteur.",
        "Les chats ont 32 muscles dans chaque oreille.",
        "Un groupe de chats s'appelle une 'clowder'.",
        "Les chats ne peuvent pas percevoir la douceur.",
      ];
      const r = Math.floor(Math.random() * FALLBACK.length);
      await antiBan.safeSend(sock, jid, {
        text: `🐱 *CAT FACT*\n\n${FALLBACK[r]}\n\n> *ZERO TRACE BOT v5.0*`,
      }, { msgOptions: { quoted: msg } });
    }
  },
};

// ── dogpic ────────────────────────────────────────────────────────────────────
const dogpic = {
  name: 'dogpic',
  execute: async (ctx) => {
    const { sock, jid, msg, antiBan, args } = ctx;
    try {
      await sock.sendMessage(jid, { react: { text: '🐕', key: msg.key } }).catch(() => {});
      const breed = args.join('/').toLowerCase().replace(/\s+/g, '-') || '';
      const url   = breed
        ? `https://dog.ceo/api/breed/${breed}/images/random`
        : 'https://dog.ceo/api/breeds/image/random';
      const res = await axios.get(url, { timeout: TIMEOUT });
      const imageUrl = res.data.message;

      const imgRes  = await axios.get(imageUrl, { responseType: 'arraybuffer', timeout: 15000 });
      const tmpPath = path.join(__dirname, '../tmp', `dog_${Date.now()}.jpg`);
      await fs.ensureDir(path.dirname(tmpPath));
      await fs.writeFile(tmpPath, imgRes.data);

      await sock.sendMessage(jid, {
        image: { url: imageUrl },
        caption: `🐕 *DOG PIC*${breed ? ` — Race : ${breed}` : ''}\n\n💡 *.dogpic [race]* pour une race spécifique\n\n> *ZERO TRACE BOT v5.0*`,
      }, { quoted: msg });
      fs.remove(tmpPath).catch(() => {});
    } catch (e) {
      await antiBan.safeSend(sock, jid, {
        text: `❌ Chien introuvable.\n${args.length ? 'Race inconnue : ' + args.join(' ') + '\n' : ''}Essaie : *.dogpic husky* ou *.dogpic labrador*`,
      }, { msgOptions: { quoted: msg } });
    }
  },
};

// ── animals ───────────────────────────────────────────────────────────────────
const animals = {
  name: 'animals',
  execute: async (ctx) => {
    const { sock, jid, msg, antiBan, args } = ctx;
    const animal = (args[0] || 'cat').toLowerCase();
    const APIs = {
      cat:  'https://api.thecatapi.com/v1/images/search',
      dog:  'https://dog.ceo/api/breeds/image/random',
      fox:  'https://randomfox.ca/floof/',
      duck: 'https://random-d.uk/api/random',
    };
    const supported = Object.keys(APIs);
    if (!APIs[animal]) {
      await antiBan.safeSend(sock, jid, {
        text: `🦁 *.animals [animal]*\nDisponibles : ${supported.join(' · ')}\n\n> *ZERO TRACE BOT v5.0*`,
      }, { msgOptions: { quoted: msg } });
      return;
    }
    try {
      await sock.sendMessage(jid, { react: { text: '🦁', key: msg.key } }).catch(() => {});
      const res = await axios.get(APIs[animal], { timeout: TIMEOUT });
      let imageUrl;
      if (animal === 'cat')  imageUrl = res.data[0]?.url;
      if (animal === 'dog')  imageUrl = res.data.message;
      if (animal === 'fox')  imageUrl = res.data.image;
      if (animal === 'duck') imageUrl = res.data.url;
      if (!imageUrl) throw new Error('URL introuvable');
      await sock.sendMessage(jid, {
        image: { url: imageUrl },
        caption: `🦁 *ANIMAL — ${animal.toUpperCase()}*\n\n> *ZERO TRACE BOT v5.0*`,
      }, { quoted: msg });
    } catch (e) {
      await antiBan.safeSend(sock, jid, { text: `❌ Erreur : ${e.message}` }, { msgOptions: { quoted: msg } });
    }
  },
};

// ── gif ───────────────────────────────────────────────────────────────────────
const gif = {
  name: 'gif',
  execute: async (ctx) => {
    const { sock, jid, msg, antiBan, args } = ctx;
    if (!args.length) {
      await antiBan.safeSend(sock, jid, {
        text: '🎬 *.gif [recherche]*\nEx : *.gif cat funny* | *.gif hacker*\n\n> *ZERO TRACE BOT v5.0*',
      }, { msgOptions: { quoted: msg } });
      return;
    }
    try {
      await sock.sendMessage(jid, { react: { text: '🎬', key: msg.key } }).catch(() => {});
      const query  = encodeURIComponent(args.join(' '));
      // Giphy public beta key (limité mais sans inscription)
      const apiKey = process.env.GIPHY_API_KEY || 'dc6zaTOxFJmzC';
      const res    = await axios.get(
        `https://api.giphy.com/v1/gifs/search?api_key=${apiKey}&q=${query}&limit=5&rating=pg`,
        { timeout: TIMEOUT }
      );
      const gifs = res.data.data;
      if (!gifs || gifs.length === 0) throw new Error('Aucun GIF trouvé');
      const chosen  = gifs[Math.floor(Math.random() * gifs.length)];
      const gifUrl  = chosen.images.original.url;
      await sock.sendMessage(jid, {
        video: { url: gifUrl },
        caption: `🎬 *GIF — ${args.join(' ').toUpperCase()}*\n\n> *ZERO TRACE BOT v5.0*`,
        gifPlayback: true,
      }, { quoted: msg });
    } catch (e) {
      await antiBan.safeSend(sock, jid, {
        text: `❌ GIF introuvable.\nConfigure GIPHY_API_KEY dans keys.js pour de meilleurs résultats.\nErreur : ${e.message}`,
      }, { msgOptions: { quoted: msg } });
    }
  },
};

// ── lyrics ────────────────────────────────────────────────────────────────────
const lyrics = {
  name: 'lyrics2',
  execute: async (ctx) => {
    const { sock, jid, msg, antiBan, args } = ctx;
    if (args.length < 2) {
      await antiBan.safeSend(sock, jid, {
        text: '🎵 *.lyrics [artiste] - [titre]*\nEx : *.lyrics Stromae - Papaoutai*\n\n> *ZERO TRACE BOT v5.0*',
      }, { msgOptions: { quoted: msg } });
      return;
    }
    try {
      await sock.sendMessage(jid, { react: { text: '🎵', key: msg.key } }).catch(() => {});
      const input = args.join(' ');
      let artist, title;
      if (input.includes(' - ')) {
        [artist, title] = input.split(' - ').map(s => s.trim());
      } else if (input.includes('-')) {
        [artist, title] = input.split('-').map(s => s.trim());
      } else {
        artist = args[0];
        title  = args.slice(1).join(' ');
      }
      const url = `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`;
      const res = await axios.get(url, { timeout: TIMEOUT });
      const lyr = res.data.lyrics;
      if (!lyr) throw new Error('Paroles introuvables');
      // Tronquer à 1200 chars pour WhatsApp
      const truncated = lyr.length > 1200 ? lyr.slice(0, 1200) + '\n\n_(paroles tronquées)_' : lyr;
      await antiBan.safeSend(sock, jid, {
        text:
          `🎵 *${title.toUpperCase()}* — ${artist}\n\n` +
          `${truncated}\n\n` +
          `> *ZERO TRACE BOT v5.0*`,
      }, { msgOptions: { quoted: msg } });
    } catch (e) {
      await antiBan.safeSend(sock, jid, {
        text: `❌ Paroles introuvables.\nVérifie l'orthographe : *.lyrics Artiste - Titre*\nErreur : ${e.message}`,
      }, { msgOptions: { quoted: msg } });
    }
  },
};

// ── nasa ──────────────────────────────────────────────────────────────────────
const nasa = {
  name: 'nasa',
  execute: async (ctx) => {
    const { sock, jid, msg, antiBan } = ctx;
    try {
      await sock.sendMessage(jid, { react: { text: '🚀', key: msg.key } }).catch(() => {});
      const apiKey = process.env.NASA_API_KEY || 'DEMO_KEY';
      const res    = await axios.get(
        `https://api.nasa.gov/planetary/apod?api_key=${apiKey}`,
        { timeout: TIMEOUT }
      );
      const apod = res.data;

      // ── Traduire le titre et l'explication en français via MyMemory ──
      let titreFR       = apod.title || '';
      let explicationFR = apod.explanation ? apod.explanation.slice(0, 500) : '';
      try {
        const [resTitre, resExpl] = await Promise.all([
          axios.get('https://api.mymemory.translated.net/get', {
            params: { q: apod.title, langpair: 'en|fr', de: 'zerotrace@bot.com' },
            timeout: 8000,
          }),
          axios.get('https://api.mymemory.translated.net/get', {
            params: { q: explicationFR, langpair: 'en|fr', de: 'zerotrace@bot.com' },
            timeout: 8000,
          }),
        ]);
        titreFR       = resTitre.data?.responseData?.translatedText || titreFR;
        explicationFR = resExpl.data?.responseData?.translatedText  || explicationFR;
      } catch (_) { /* Si la traduction échoue, on garde l'anglais */ }

      const caption =
        `🚀 *NASA — IMAGE DU JOUR*\n` +
        `▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰\n` +
        `📅 Date : ${apod.date}\n` +
        `🌌 Titre : *${titreFR}*\n\n` +
        `📖 ${explicationFR ? explicationFR + (apod.explanation && apod.explanation.length > 500 ? '...' : '') : 'Aucune description.'}\n\n` +
        `> _ZERO TRACE 😈_`;

      if (apod.media_type === 'image' && apod.url) {
        await sock.sendMessage(jid, { image: { url: apod.url }, caption }, { quoted: msg });
      } else {
        await antiBan.safeSend(sock, jid, {
          text: caption + (apod.url ? `\n🔗 ${apod.url}` : ''),
        }, { msgOptions: { quoted: msg } });
      }
    } catch (e) {
      await antiBan.safeSend(sock, jid, {
        text: `❌ NASA API erreur : ${e.message}\nConfigure NASA_API_KEY dans .env pour plus de requêtes.`,
      }, { msgOptions: { quoted: msg } });
    }
  },
};

module.exports = { myip, catfact, dogpic, animals, gif, lyrics, nasa };
