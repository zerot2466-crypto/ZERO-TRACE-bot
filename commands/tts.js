/**
 * ZERO TRACE BOT v5.0 — .tts (Text-to-Speech) v3
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Utilise voice.js v3 (providers avec fallback auto)
 * + fallback gTTS local si tous les providers échouent
 * Langues : fr (défaut), en, es, de, ar, pt, ...
 */
'use strict';
const zts = require('../lib/ztStyle');

const voiceLib = require('../lib/voice');
const path     = require('path');
const fs       = require('fs');

// Langues supportées (code ISO 639-1 → label)
const LANGS = {
  fr: 'Français', en: 'English', es: 'Español',
  de: 'Deutsch',  ar: 'العربية', pt: 'Português',
  it: 'Italiano', ru: 'Русский', zh: '中文', ja: '日本語',
};

module.exports = {
  name:     'tts',
  aliases:  ['vocal', 'parle', 'speak', 'voix', 'voice'],
  description: 'Convertir du texte en message vocal (bulle audio)',
  usage:    '.tts [texte] | .tts fr [texte] | .tts en Hello world',
  category: 'media',

  async execute(ctx) {
    const { sock, jid, msg, args, antiBan } = ctx;

    if (!args.length) {
      await antiBan.safeSend(sock, jid, {
        text:
          `🎙️ *.tts [texte]*\n\n` +
          `Exemples :\n` +
          `  *.tts Bonjour, je suis Zero Trace !*\n` +
          `  *.tts en Hello from the bot*\n` +
          `  *.tts ar مرحباً*\n\n` +
          `🌍 *Langues* : ${Object.entries(LANGS).map(([k,v]) => `\`${k}\` ${v}`).join(' · ')}\n\n` +
          `📏 Limite : 300 caractères\n` +
          `Alias : *.vocal* · *.parle* · *.speak*\n\n` +
          `> *ZERO TRACE BOT v5.0*`,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    // Détecter si le 1er arg est un code de langue
    let lang = 'fr';
    let textArgs = args;
    if (args[0]?.length === 2 && LANGS[args[0].toLowerCase()]) {
      lang     = args[0].toLowerCase();
      textArgs = args.slice(1);
    }

    const text = textArgs.join(' ').trim();

    if (!text) {
      await antiBan.safeSend(sock, jid, {
        text: `\`\`\`[ZT-TTS] Usage: .tts [langue] [texte]
Ex    : .tts fr Bonjour | .tts en Hello world\`\`\`

> ${zts.sig()}`,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    if (text.length > 300) {
      await antiBan.safeSend(sock, jid, {
        text: `\`\`\`[ZT-TTS] ERREUR: Texte trop long (${text.length}/300 chars max)\`\`\`

> ${zts.sig()}`,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    await sock.sendMessage(jid, { react: { text: '🎙️', key: msg.key } }).catch(() => {});
    await antiBan.safeSend(sock, jid, {
      text: `\`\`\`[ZT-TTS] Synthèse vocale en cours...
Langue : ${LANGS[lang] || lang}\`\`\``,
    }, { msgOptions: { quoted: msg } });

    try {
      // ── Tentative via voice.js (multi-providers) ──────────────────────
      const result = await voiceLib.synthesizeSpeech(text, false, lang);

      if (result?.buffer && voiceLib.isValidAudioBuffer(result.buffer)) {
        await sock.sendMessage(jid, {
          audio:    result.buffer,
          mimetype: 'audio/mpeg',
          ptt:      true,
        }, { quoted: msg });
        await sock.sendMessage(jid, { react: { text: '✅', key: msg.key } }).catch(() => {});
        return;
      }

      // ── Fallback : gTTS local ─────────────────────────────────────────
      let gTTS;
      try { gTTS = require('gtts'); } catch { gTTS = null; }

      if (gTTS) {
        const tmpDir  = path.join(process.cwd(), 'tmp');
        if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
        const tmpFile = path.join(tmpDir, `tts_${Date.now()}.mp3`);

        await new Promise((resolve, reject) => {
          const gtts = new gTTS(text, lang);
          gtts.save(tmpFile, (err) => err ? reject(err) : resolve());
        });

        const audioBuf = fs.readFileSync(tmpFile);
        try { fs.unlinkSync(tmpFile); } catch {}

        await sock.sendMessage(jid, {
          audio:    audioBuf,
          mimetype: 'audio/mpeg',
          ptt:      true,
        }, { quoted: msg });
        await sock.sendMessage(jid, { react: { text: '✅', key: msg.key } }).catch(() => {});
        return;
      }

      throw new Error('Tous les providers TTS ont échoué. Ajoute ELEVENLABS_API_KEY dans .env pour une meilleure qualité.');

    } catch (err) {
      await sock.sendMessage(jid, { react: { text: '❌', key: msg.key } }).catch(() => {});
      console.error('[TTS] Erreur:', err.message);
      await antiBan.safeSend(sock, jid, {
        text:
          `❌ *TTS échoué*\n\n` +
          `_${err.message}_\n\n` +
          `💡 Installe gTTS : \`npm install gtts\`\n` +
          `Ou ajoute \`ELEVENLABS_API_KEY\` dans ton *.env*\n\n` +
          `> *ZERO TRACE BOT v5.0*`,
      }, { msgOptions: { quoted: msg } });
    }
  },
};
