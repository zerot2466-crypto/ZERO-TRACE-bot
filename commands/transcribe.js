/**
 * ZERO TRACE BOT v5.0 — transcribe.js
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Transcrire un message vocal en texte via Groq Whisper
 *
 * Commandes :
 *   .transcribe         — réponds à un vocal pour le transcrire
 *   .transcribe fr      — forcer la langue (fr/en/ar/es...)
 */
'use strict';

const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const axios  = require('axios');
const fs     = require('fs-extra');
const path   = require('path');
const os     = require('os');
const FormData = require('form-data');

const BOT_TAG = '> ⚡ _ZERO TRACE BOT v5.0_';

// ── Télécharger l'audio du message ────────────────────────────────────────────
async function getAudioBuffer(sock, msg) {
  const m = msg.message || {};

  const directAudio = m.audioMessage;
  const quotedMsg   = m.extendedTextMessage?.contextInfo?.quotedMessage;
  const quotedAudio = quotedMsg?.audioMessage;

  let targetMsg = null;
  let audioMsg  = null;

  if (directAudio) {
    targetMsg = msg;
    audioMsg  = directAudio;
  } else if (quotedAudio) {
    const quotedKey = m.extendedTextMessage?.contextInfo?.stanzaId;
    targetMsg = {
      key:     { remoteJid: msg.key.remoteJid, id: quotedKey || '' },
      message: quotedMsg,
    };
    audioMsg = quotedAudio;
  }

  if (!targetMsg || !audioMsg) return null;

  try {
    // Essai 1 : downloadMediaMessage avec reuploadRequest
    try {
      const buffer = await downloadMediaMessage(
        targetMsg, 'buffer', {},
        { reuploadRequest: sock.updateMediaMessage }
      );
      if (buffer && buffer.length >= 100) {
        return { buffer, mime: audioMsg.mimetype || 'audio/ogg; codecs=opus', duration: audioMsg.seconds || 0 };
      }
    } catch (e1) {
      console.log('[TRANSCRIBE] downloadMediaMessage v1 échoué:', e1.message);
    }
    // Essai 2 : sans reuploadRequest (compatibilité Baileys 6.x)
    try {
      const buffer = await downloadMediaMessage(targetMsg, 'buffer', {});
      if (buffer && buffer.length >= 100) {
        return { buffer, mime: audioMsg.mimetype || 'audio/ogg; codecs=opus', duration: audioMsg.seconds || 0 };
      }
    } catch (e2) {
      console.error('[TRANSCRIBE] downloadMediaMessage v2 échoué:', e2.message);
    }
    return null;
  } catch (e) {
    console.error('[TRANSCRIBE] Erreur téléchargement:', e.message);
    return null;
  }
}

module.exports = {
  name:    'transcribe',
  aliases: ['stt', 'vocal2text', 'voicetotext', 'vtt'],

  execute: async (ctx) => {
    const { sock, jid, msg, args, antiBan } = ctx;

    const lang = (args[0] || '').toLowerCase() || null;

    // ── Vérifier qu'il y a un audio ──────────────────────────────────────────
    const m         = msg.message || {};
    const hasAudio  = !!m.audioMessage;
    const hasQuoted = !!m.extendedTextMessage?.contextInfo?.quotedMessage?.audioMessage;

    if (!hasAudio && !hasQuoted) {
      await antiBan.safeSend(sock, jid, {
        text:
          '🎙️ *TRANSCRIPTION VOCALE*\n\n' +
          'Envoie un vocal avec `.transcribe` en légende,\nOU réponds à un vocal avec `.transcribe`\n\n' +
          '🌍 Langues supportées :\n' +
          '  `.transcribe fr` — français\n' +
          '  `.transcribe en` — anglais\n' +
          '  `.transcribe ar` — arabe\n' +
          '  `.transcribe es` — espagnol\n' +
          '  _(sans langue : détection auto)_\n\n' + BOT_TAG,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    if (!process.env.GROQ_API_KEY) {
      await antiBan.safeSend(sock, jid, {
        text: '❌ *GROQ_API_KEY* manquante dans keys.js\nCette commande nécessite Groq Whisper.\n\n' + BOT_TAG,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    try {
      await sock.sendPresenceUpdate('recording', jid).catch(() => {});
      await antiBan.safeSend(sock, jid, {
        text: '🎙️ _Transcription en cours..._',
      }, { msgOptions: { quoted: msg } });

      // ── Télécharger l'audio ───────────────────────────────────────────────
      const audioData = await getAudioBuffer(sock, msg);
      if (!audioData) {
        await antiBan.safeSend(sock, jid, {
          text: '❌ Impossible de télécharger le vocal. Réessaie.',
        }, { msgOptions: { quoted: msg } });
        return;
      }

      // ── Sauvegarder temporairement ────────────────────────────────────────
      const tmpFile = path.join(os.tmpdir(), `zt_audio_${Date.now()}.ogg`);
      await fs.writeFile(tmpFile, audioData.buffer);

      // ── Appel Groq Whisper ────────────────────────────────────────────────
      const form = new FormData();
      form.append('file', fs.createReadStream(tmpFile), {
        filename:    'audio.ogg',
        contentType: 'audio/ogg',
      });
      form.append('model', 'whisper-large-v3-turbo');
      form.append('response_format', 'json');
      if (lang) form.append('language', lang);

      const res = await axios.post(
        'https://api.groq.com/openai/v1/audio/transcriptions',
        form,
        {
          headers: {
            'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
            ...form.getHeaders(),
          },
          timeout: 60000,
        }
      );

      // ── Nettoyage ─────────────────────────────────────────────────────────
      await fs.remove(tmpFile).catch(() => {});

      const text     = res.data?.text?.trim();
      const detected = res.data?.language || 'auto';
      const duration = audioData.duration;

      if (!text) {
        await antiBan.safeSend(sock, jid, {
          text: '⚠️ Vocal vide ou inaudible — aucun texte détecté.\n\n' + BOT_TAG,
        }, { msgOptions: { quoted: msg } });
        return;
      }

      await antiBan.safeSend(sock, jid, {
        text:
          `🎙️ *TRANSCRIPTION*\n` +
          `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
          `${text}\n\n` +
          `🌍 Langue : ${detected}${duration ? ` | ⏱️ ${duration}s` : ''}\n` +
          `_via Groq Whisper_\n\n` + BOT_TAG,
      }, { msgOptions: { quoted: msg } });

    } catch (e) {
      const errMsg = e.response?.data?.error?.message || e.message;
      await antiBan.safeSend(sock, jid, {
        text: `❌ Transcription échouée : \`${errMsg}\`\n\n` + BOT_TAG,
      }, { msgOptions: { quoted: msg } });
    } finally {
      await sock.sendPresenceUpdate('paused', jid).catch(() => {});
    }
  },
};
