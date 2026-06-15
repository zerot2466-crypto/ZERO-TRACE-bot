/**
 * ZERO TRACE BOT v5.0 - Chatbot IA Humanisé v3
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * ✅ Mode groupe : .chatbot on/off dans un groupe
 * ✅ Mode privé  : .chatbot private on/off — répond en DM à tous
 * ✅ Mot-clé "zero trace activé" pour activer/désactiver depuis un DM
 * ✅ Langue auto-détectée
 * ✅ Mémoire persistante par utilisateur
 * ✅ Silence en cas d'erreur (pas de message d'erreur dans le groupe)
 */
'use strict';

const config = require('../config');
const ai     = require('../lib/openrouter_ai');
const fs     = require('fs-extra');
const path   = require('path');

// Fichier de persistance pour le mode chatbot privé
const CHATBOT_PRIVATE_PATH = path.join(__dirname, '../data/chatbot_private.json');

function loadPrivateChatbot() {
  try {
    if (fs.existsSync(CHATBOT_PRIVATE_PATH)) return fs.readJsonSync(CHATBOT_PRIVATE_PATH);
    return { enabled: false };
  } catch { return { enabled: false }; }
}

function savePrivateChatbot(data) {
  try { fs.writeJsonSync(CHATBOT_PRIVATE_PATH, data, { spaces: 2 }); } catch (e) {}
}

function isPrivateChatbotEnabled() {
  return !!loadPrivateChatbot().enabled;
}

function setPrivateChatbot(enabled) {
  savePrivateChatbot({ enabled });
}

// Exporter pour usage dans handler.js
module.exports.isPrivateChatbotEnabled = isPrivateChatbotEnabled;
module.exports.setPrivateChatbot = setPrivateChatbot;

// ── Commande .chatbot ──────────────────────────────────────────────────────────
module.exports = {
  name: 'chatbot',
  description: 'Activer/désactiver le chatbot IA humanisé',
  usage: '.chatbot on | .chatbot off | .chatbot private on | .chatbot private off',
  category: 'admin',

  async execute(ctx) {
    const { sock, jid, msg, args, antiBan, isOwner, isSudo, sender, isGroup, pushName} = ctx;
    const sub  = (args[0] || '').toLowerCase();
    const sub2 = (args[1] || '').toLowerCase();

    // ── .chatbot private on/off (owner seulement) ─────────────────────────────
    if (sub === 'private') {
      if (!isOwner) {
        await antiBan.safeSend(sock, jid, {
          text: '❌ Seul le propriétaire peut gérer le chatbot privé.',
        }, { msgOptions: { quoted: msg } });
        return;
      }

      if (!sub2 || sub2 === 'status') {
        const etat = isPrivateChatbotEnabled() ? '🟢 ACTIVÉ' : '🔴 DÉSACTIVÉ';
        await antiBan.safeSend(sock, jid, {
          text:
            `🤖 *CHATBOT PRIVÉ — ZERO TRACE*\n\n` +
            `État : ${etat}\n\n` +
            `Quand activé, le bot répond aux DM\n` +
            `de *toutes les personnes* qui lui écrivent.\n\n` +
            `*Commandes :*\n` +
            `• *.chatbot private on*  → Activer\n` +
            `• *.chatbot private off* → Désactiver\n\n` +
            `💡 Les gens peuvent aussi taper :\n` +
            `"*zero trace activé*" dans leur DM\n` +
            `pour activer le chatbot avec toi.\n\n` +
            `> *ZERO TRACE BOT v5.0*`,
        }, { msgOptions: { quoted: msg } });
        return;
      }

      if (sub2 === 'on') {
        setPrivateChatbot(true);
        await antiBan.safeSend(sock, jid, {
          text:
            `🟢 *Chatbot Privé activé !*\n\n` +
            `Le bot va maintenant répondre à tous\n` +
            `les messages reçus en DM.\n\n` +
            `💡 Les gens peuvent aussi écrire :\n` +
            `"*zero trace activé*" pour activer\n` +
            `le chatbot dans leur conversation.\n\n` +
            `> *ZERO TRACE BOT v5.0*`,
        }, { msgOptions: { quoted: msg } });
      } else if (sub2 === 'off') {
        setPrivateChatbot(false);
        await antiBan.safeSend(sock, jid, {
          text:
            `🔴 *Chatbot Privé désactivé.*\n\n` +
            `Le bot ne répondra plus automatiquement\n` +
            `en DM.\n\n` +
            `> *ZERO TRACE BOT v5.0*`,
        }, { msgOptions: { quoted: msg } });
      } else {
        await antiBan.safeSend(sock, jid, {
          text: '❌ Utilise *.chatbot private on* ou *.chatbot private off*',
        }, { msgOptions: { quoted: msg } });
      }
      return;
    }

    // ── .chatbot on/off dans un groupe ────────────────────────────────────────
    if (!sub) {
      const etatGroupe  = config.isChatbotEnabled(jid) ? '🟢 ACTIVÉ' : '🔴 DÉSACTIVÉ';
      const etatPrivate = isPrivateChatbotEnabled() ? '🟢 ACTIVÉ' : '🔴 DÉSACTIVÉ';
      await antiBan.safeSend(sock, jid, {
        text:
          `🤖 *CHATBOT ZERO TRACE*\n\n` +
          `État groupe : ${etatGroupe}\n` +
          `État DM privé : ${etatPrivate}\n\n` +
          `*Commandes :*\n` +
          `• *.chatbot on/off* → Activer dans ce groupe\n` +
          `• *.chatbot private on/off* → Activer en DM\n\n` +
          `> *ZERO TRACE BOT v5.0*`,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    let hasRight = isOwner || isSudo;
    if (!hasRight && jid.endsWith('@g.us')) {
      try {
        const meta = await sock.groupMetadata(jid);
        hasRight = meta.participants.some(
          p => p.id === sender && (p.admin === 'admin' || p.admin === 'superadmin')
        );
      } catch (e) {}
    }

    if (!hasRight) {
      await antiBan.safeSend(sock, jid, {
        text: '❌ Seuls les admins ou le propriétaire peuvent gérer le chatbot.',
      }, { msgOptions: { quoted: msg } });
      return;
    }

    if (sub === 'on') {
      if (config.isChatbotEnabled(jid)) {
        await antiBan.safeSend(sock, jid, { text: '⚠️ Chatbot déjà actif.' }, { msgOptions: { quoted: msg } });
        return;
      }
      config.setChatbot(jid, true);
      await antiBan.safeSend(sock, jid, {
        text: '🟢 Chatbot activé. Je vais répondre naturellement à tous les messages.',
      }, { msgOptions: { quoted: msg } });

    } else if (sub === 'off') {
      if (!config.isChatbotEnabled(jid)) {
        await antiBan.safeSend(sock, jid, { text: '⚠️ Chatbot déjà désactivé.' }, { msgOptions: { quoted: msg } });
        return;
      }
      config.setChatbot(jid, false);
      await antiBan.safeSend(sock, jid, {
        text: '🔴 Chatbot désactivé.',
      }, { msgOptions: { quoted: msg } });

    } else {
      await antiBan.safeSend(sock, jid, {
        text: '❌ Utilise .chatbot on ou .chatbot off',
      }, { msgOptions: { quoted: msg } });
    }
  },
};

// ── Handler chatbot (appelé depuis handler.js sur chaque message) ─────────────
async function handleChatbotResponse(sock, jid, msg, body, sender, isOwner, isSudo) {
  const isGroup   = jid.endsWith('@g.us');
  const isDM      = !isGroup;
  const cleanMsg  = body.trim();

  if (!cleanMsg || cleanMsg.length < 2) return;

  // ── Détection mot-clé "zero trace activé" en DM ────────────────────────────
  if (isDM && /zero\s*trace\s*activ[eé]/i.test(cleanMsg)) {
    setPrivateChatbot(true);
    try {
      await sock.sendMessage(jid, {
        text:
          `🤖 *ZERO TRACE activé !*\n\n` +
          `Le chatbot est maintenant actif dans cette conversation.\n` +
          `Je vais répondre à tous tes messages.\n\n` +
          `Pour désactiver : écris "*zero trace désactivé*"\n\n` +
          `> *ZERO TRACE BOT v5.0*`,
      }, { quoted: msg });
    } catch (e) {}
    return;
  }

  // ── Détection mot-clé "zero trace désactivé" en DM ────────────────────────
  if (isDM && /zero\s*trace\s*d[ée]sactiv[eé]/i.test(cleanMsg)) {
    setPrivateChatbot(false);
    try {
      await sock.sendMessage(jid, {
        text:
          `🔴 *ZERO TRACE désactivé.*\n\n` +
          `Le chatbot est maintenant inactif.\n\n` +
          `> *ZERO TRACE BOT v5.0*`,
      }, { quoted: msg });
    } catch (e) {}
    return;
  }

  // ── Vérifier si le chatbot doit répondre ────────────────────────────────────
  const groupChatbotActive   = isGroup && config.isChatbotEnabled(jid);
  const privateChatbotActive = isDM && isPrivateChatbotEnabled();

  if (!groupChatbotActive && !privateChatbotActive) return;

  // En mode privé du bot, bloquer les inconnus (sauf en DM chatbot privé)
  if (config.isPrivateMode() && !isOwner && !isSudo && !privateChatbotActive) return;

  try {
    const antiBanLib = require('../lib/antiBan');

    // Durée de frappe adaptée
    const isComplex = cleanMsg.length > 60 || /[?]|comment|pourquoi|why|how|what/i.test(cleanMsg);
    await antiBanLib.simulateTyping(sock, jid, isComplex ? 3000 : 1500);

    // Contexte groupe ou privé
    let groupName   = null;
    let memberCount = null;
    let contextType = isDM ? 'privé' : 'groupe';

    if (isGroup) {
      try {
        const meta = await sock.groupMetadata(jid);
        groupName   = meta.subject;
        memberCount = meta.participants?.length;
      } catch (e) {}
    }

    const conversationId = `chatbot_${sender}`;

    // Détecter si l'utilisateur veut ouvrir le menu
    const menuIntent = /\b(ouvre?\s+(le\s+)?menu|affiche?\s+(le\s+)?menu|montre?\s+(le\s+)?menu|aide|help|commandes?|liste\s+des\s+commandes?)\b/i.test(cleanMsg);
    if (menuIntent) {
      try {
        const menuFile = require('./help');
        const prefix   = config.getPrefix ? config.getPrefix(jid) : '.';
        await menuFile.execute({ sock, jid, msg, args: [], antiBan: antiBanLib, isOwner, isSudo, command: 'menu', prefix, sender, pushName: '' });
      } catch (e) { console.error('[CHATBOT] Menu error:', e.message); }
      return;
    }

    const contextLine = isDM
      ? `CONTEXTE : Tu parles en DM (conversation privée) avec cette personne.`
      : `CONTEXTE : Tu es dans un groupe WhatsApp${groupName ? ` nommé "${groupName}"` : ''}${memberCount ? ` (${memberCount} membres)` : ''}.`;

    const systemPrompt =
      `${ai.SYSTEM_PROMPT}\n\n` +
      `${contextLine}\n` +
      `Réponds directement et naturellement. Ne te présente pas à chaque fois.\n` +
      `Adapte ta longueur : court pour les petits messages, plus développé si la question le mérite.\n\n` +
      `TES COMMANDES PRINCIPALES :\n` +
      `- .ai [question] → IA principale, .imagine [desc] → image IA\n` +
      `- .yt [lien] → YouTube vidéo, .song [titre/lien] → MP3, .tiktok [lien] → TikTok\n` +
      `- .sticker → convertir image en sticker, .removebg → supprimer fond d'image\n` +
      `- .weather [ville] → météo, .news → actualités, .translate [langue] [texte] → traduction\n` +
      `- .joke → blague, .roast @user → vannes, .quote → citation\n` +
      `- .warn @user, .kick @user, .mute, .tagall → modération groupe\n` +
      `- .chatbot on/off → activer/désactiver ce mode, .menu → voir toutes les commandes`;

    const aiResult = await ai.chat(conversationId, cleanMsg, {
      systemPrompt,
      maxTokens:  500,
      groupName,
      memberCount,
    });

    if (!aiResult?.content) return;

    await sock.sendMessage(jid, { text: aiResult.content }, { quoted: msg });

  } catch (err) {
    console.error('[CHATBOT] Erreur:', err.message);
    // Silencieux — on ne pollue pas le chat avec des erreurs
  }
}

Object.assign(module.exports, { handleChatbotResponse });
