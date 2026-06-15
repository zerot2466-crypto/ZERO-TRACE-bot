/**
 * ZERO TRACE BOT v5.0 — vision.js
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Analyse une image envoyée ou citée via IA (vision multimodale)
 *
 * USAGE :
 *   .vision                   → analyse générale de l'image
 *   .vision qu'est-ce que c'est ?  → question spécifique sur l'image
 *   .vision ocr               → extraire le texte visible dans l'image
 *   .vision face              → décrire les personnes visibles
 *   .vision code              → analyser du code dans un screenshot
 *
 * COMMENT L'UTILISER :
 *   1. Envoie une image avec .vision en légende
 *   2. OU réponds à une image existante avec .vision
 *
 * PROVIDERS SUPPORTÉS (vision) :
 *   - OpenRouter : deepseek/deepseek-chat-v3-0324 (vision)
 *   - OpenRouter : google/gemini-flash-1.5 (fallback vision)
 *   - Groq       : meta-llama/llama-4-scout-17b-16e-instruct (fallback)
 */

'use strict';

const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const axios  = require('axios');
const fs     = require('fs-extra');
const path   = require('path');

// ── Modes prédéfinis ──────────────────────────────────────────────────────────
const VISION_MODES = {
  ocr:   'Extrais TOUT le texte visible dans cette image, mot pour mot. Si c\'est du code, garde la structure. Si aucun texte visible, dis-le.',
  face:  'Décris les personnes visibles dans cette image : apparence, expression, tenue, ambiance générale. Pas de noms.',
  code:  'Analyse ce code ou screenshot de terminal. Identifie le langage, explique ce que fait le code, et signale tout bug ou problème potentiel.',
  meme:  'Explique ce mème : décris l\'image, le texte, et pourquoi c\'est supposé être drôle ou viral.',
  lieu:  'Identifie ce lieu ou paysage. Donne des détails sur l\'environnement, l\'architecture, ou la nature visible.',
  objet: 'Identifie et décris cet objet en détail : ce que c\'est, à quoi ça sert, marque/modèle si visible.',
};

const DEFAULT_PROMPT =
  'Analyse cette image en détail. Décris ce que tu vois : objets, personnes, texte, couleurs, ambiance, contexte. Sois précis et utile.';

// ── Télécharger l'image depuis le message ─────────────────────────────────────
async function getImageBuffer(sock, msg) {
  const m = msg.message || {};

  // Message direct avec image
  const directImg  = m.imageMessage;
  // Message cité (reply) avec image
  const quotedMsg  = m.extendedTextMessage?.contextInfo?.quotedMessage;
  const quotedImg  = quotedMsg?.imageMessage;

  let targetMsg = null;
  let imageMsg  = null;

  if (directImg) {
    targetMsg = msg;
    imageMsg  = directImg;
  } else if (quotedImg) {
    const quotedKey = m.extendedTextMessage?.contextInfo?.stanzaId;
    targetMsg = {
      key:     { remoteJid: msg.key.remoteJid, id: quotedKey || '' },
      message: quotedMsg,
    };
    imageMsg = quotedImg;
  }

  if (!targetMsg || !imageMsg) return null;

  try {
    const buffer = await downloadMediaMessage(
      targetMsg,
      'buffer',
      {},
      {}  // compat Baileys 6.x
    );
    if (!buffer || buffer.length < 500) return null;
    return { buffer, mime: imageMsg.mimetype || 'image/jpeg' };
  } catch (err) {
    console.error('[VISION] Erreur téléchargement:', err.message);
    return null;
  }
}

// ── Appel API vision via OpenRouter ──────────────────────────────────────────
async function callVisionAPI(imageBuffer, mime, prompt) {
  const base64 = imageBuffer.toString('base64');
  const dataUrl = `data:${mime};base64,${base64}`;

  // Tronquer si trop grand (limite ~4MB base64)
  if (base64.length > 4_000_000) {
    throw new Error('Image trop volumineuse (max ~3MB). Compresse-la d\'abord.');
  }

  const errors = [];

  // ── Provider 1 : OpenRouter — DeepSeek V3 (vision) ──────────────────────
  if (process.env.OPENROUTER_API_KEY) {
    try {
      const res = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model: 'deepseek/deepseek-chat-v3-0324',
          max_tokens: 800,
          messages: [{
            role: 'user',
            content: [
              { type: 'image_url', image_url: { url: dataUrl } },
              { type: 'text',      text: prompt },
            ],
          }],
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
            'Content-Type':  'application/json',
            'HTTP-Referer':  'https://zero-trace.app',
            'X-Title':       'ZERO TRACE BOT',
          },
          timeout: 40000,
        }
      );
      const content = res.data?.choices?.[0]?.message?.content?.trim();
      if (content) return { content, provider: 'OpenRouter/DeepSeek' };
    } catch (e) {
      errors.push(`OpenRouter/DeepSeek: ${e.response?.data?.error?.message || e.message}`);
    }

    // Fallback OpenRouter — Gemini Flash (très bon en vision)
    try {
      const res = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model: 'google/gemini-flash-1.5',
          max_tokens: 800,
          messages: [{
            role: 'user',
            content: [
              { type: 'image_url', image_url: { url: dataUrl } },
              { type: 'text',      text: prompt },
            ],
          }],
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
            'Content-Type':  'application/json',
            'HTTP-Referer':  'https://zero-trace.app',
            'X-Title':       'ZERO TRACE BOT',
          },
          timeout: 40000,
        }
      );
      const content = res.data?.choices?.[0]?.message?.content?.trim();
      if (content) return { content, provider: 'OpenRouter/Gemini' };
    } catch (e) {
      errors.push(`OpenRouter/Gemini: ${e.response?.data?.error?.message || e.message}`);
    }
  }

  // ── Provider 2 : Groq — Llama 4 Scout (vision) ──────────────────────────
  if (process.env.GROQ_API_KEY) {
    try {
      const res = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          model: 'meta-llama/llama-4-scout-17b-16e-instruct',
          max_tokens: 800,
          messages: [{
            role: 'user',
            content: [
              { type: 'image_url', image_url: { url: dataUrl } },
              { type: 'text',      text: prompt },
            ],
          }],
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
            'Content-Type':  'application/json',
          },
          timeout: 30000,
        }
      );
      const content = res.data?.choices?.[0]?.message?.content?.trim();
      if (content) return { content, provider: 'Groq/Llama4' };
    } catch (e) {
      errors.push(`Groq/Llama4: ${e.response?.data?.error?.message || e.message}`);
    }
  }

  throw new Error(`Tous les providers vision ont échoué:\n${errors.join('\n')}`);
}

// ── COMMANDE PRINCIPALE ───────────────────────────────────────────────────────
module.exports = {
  name:        'vision',
  aliases:     ['analyse', 'analyseimg', 'voir', 'describe', 'ocr'],
  description: 'Analyser une image par IA (description, OCR, code, mème...)',
  usage:       '.vision [question/mode] — envoie une image ou réponds à une image',
  category:    'ai',

  async execute(ctx) {
    const { sock, jid, msg, args, antiBan, pushName } = ctx;

    // ── Détecter le mode / prompt utilisateur ────────────────────────────
    const rawInput = args.join(' ').trim().toLowerCase();
    let prompt;

    if (VISION_MODES[rawInput]) {
      prompt = VISION_MODES[rawInput];
    } else if (args.length > 0) {
      // Question libre de l'utilisateur
      prompt =
        `L'utilisateur pose cette question sur l'image : "${args.join(' ')}"\n\n` +
        `Réponds précisément à sa question en analysant l'image. ` +
        `Sois direct et utile. Format WhatsApp (pas de markdown).`;
    } else {
      prompt = DEFAULT_PROMPT;
    }

    // ── Vérifier qu'il y a une image ─────────────────────────────────────
    const m       = msg.message || {};
    const hasImg  = !!m.imageMessage;
    const hasQuot = !!m.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;

    if (!hasImg && !hasQuot) {
      await antiBan.safeSend(sock, jid, {
        text:
          '🔍 *ZERO TRACE VISION*\n\n' +
          'Envoie une image avec `.vision` en légende,\n' +
          'OU réponds à une image avec `.vision`\n\n' +
          '📋 *Modes disponibles :*\n' +
          '- `.vision ocr` → extraire le texte\n' +
          '- `.vision code` → analyser du code\n' +
          '- `.vision face` → décrire les personnes\n' +
          '- `.vision meme` → expliquer le mème\n' +
          '- `.vision lieu` → identifier le lieu\n' +
          '- `.vision objet` → identifier l\'objet\n' +
          '- `.vision [ta question]` → question libre\n\n' +
          '> *ZERO TRACE BOT v5.0*',
      }, { msgOptions: { quoted: msg } });
      return;
    }

    // ── Indicateur de traitement ──────────────────────────────────────────
    try {
      await sock.sendPresenceUpdate('composing', jid);
    } catch (e) {}

    await antiBan.safeSend(sock, jid, {
      text: '🔍 _Analyse de l\'image en cours..._',
    }, { msgOptions: { quoted: msg } });

    // ── Télécharger l'image ───────────────────────────────────────────────
    const imgData = await getImageBuffer(sock, msg);
    if (!imgData) {
      await antiBan.safeSend(sock, jid, {
        text: '❌ Impossible de télécharger l\'image. Réessaie ou renvoie l\'image.',
      }, { msgOptions: { quoted: msg } });
      return;
    }

    // ── Appel vision IA ───────────────────────────────────────────────────
    try {
      const result = await callVisionAPI(imgData.buffer, imgData.mime, prompt);

      // Formater la réponse
      const modeLabel = VISION_MODES[rawInput]
        ? `Mode: *${rawInput.toUpperCase()}*`
        : args.length > 0
          ? `Question: _"${args.join(' ')}"_`
          : 'Analyse générale';

      const response =
        `🔍 *ZERO TRACE VISION*\n` +
        `${modeLabel}\n` +
        `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `${result.content}\n\n` +
        `> _via ${result.provider}_`;

      await antiBan.safeSend(sock, jid, {
        text: response,
      }, { msgOptions: { quoted: msg } });

    } catch (err) {
      console.error('[VISION] Erreur IA:', err.message);

      let errMsg = '❌ Analyse impossible.';
      if (err.message.includes('trop volumineuse')) {
        errMsg = `❌ ${err.message}`;
      } else if (err.message.includes('API')) {
        errMsg = '❌ Service IA indisponible. Vérifie tes clés API (OPENROUTER_API_KEY / GROQ_API_KEY).';
      }

      await antiBan.safeSend(sock, jid, {
        text: errMsg,
      }, { msgOptions: { quoted: msg } });
    } finally {
      try { await sock.sendPresenceUpdate('paused', jid); } catch (e) {}
    }
  },
};
