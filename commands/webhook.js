/**
 * ZERO TRACE BOT v5.0 — webhook.js
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Envoyer des notifications vers Discord ou Telegram
 *
 * Commandes :
 *   .webhook                      — voir la config actuelle
 *   .webhook set discord [url]    — configurer Discord
 *   .webhook set telegram [token] [chatId] — configurer Telegram
 *   .webhook test                 — envoyer un message test
 *   .webhook off                  — désactiver
 *   .webhook events [on/off]      — choisir quels événements notifier
 *
 * Événements notifiés :
 *   - Démarrage/redémarrage du bot
 *   - Commande owner utilisée
 *   - Nouveau membre dans un groupe
 *   - Erreur critique
 */
'use strict';

const axios  = require('axios');
const fs     = require('fs-extra');
const path   = require('path');

const WH_FILE = path.join(__dirname, '../data/webhook.json');
const BOT_TAG = '> ⚡ _ZERO TRACE BOT v5.0_';

function load() {
  try { return fs.readJsonSync(WH_FILE); }
  catch { return { enabled: false, type: null, discord: null, telegram: null, events: { startup: true, ownerCmd: true, error: true, newMember: false } }; }
}
function save(d) {
  fs.ensureDirSync(path.dirname(WH_FILE));
  fs.writeJsonSync(WH_FILE, d, { spaces: 2 });
}

// ── Envoyer une notification ──────────────────────────────────────────────────
async function notify(event, message, data = {}) {
  const d = load();
  if (!d.enabled) return;
  if (d.events && d.events[event] === false) return;

  const timestamp = new Date().toLocaleString('fr-FR');
  const eventLabels = {
    startup:   '🟢 Démarrage',
    ownerCmd:  '⚡ Commande Owner',
    error:     '🔴 Erreur',
    newMember: '👋 Nouveau Membre',
    shutdown:  '🔴 Arrêt',
    custom:    '📡 Notification',
  };
  const label = eventLabels[event] || '📡';

  try {
    if (d.type === 'discord' && d.discord) {
      const embed = {
        embeds: [{
          title:       `${label} — ZERO TRACE BOT`,
          description: message,
          color:       event === 'error' ? 0xff0000 : event === 'startup' ? 0x00ff00 : 0x7289da,
          footer:      { text: `Zero Trace Bot v5.0 • ${timestamp}` },
          fields:      Object.entries(data).map(([k, v]) => ({ name: k, value: String(v), inline: true })),
        }],
      };
      await axios.post(d.discord, embed, { timeout: 10000 });
    }

    if (d.type === 'telegram' && d.telegram?.token && d.telegram?.chatId) {
      const text =
        `*${label} — ZERO TRACE BOT*\n\n` +
        `${message}\n\n` +
        Object.entries(data).map(([k, v]) => `• ${k}: \`${v}\``).join('\n') +
        (Object.keys(data).length ? '\n\n' : '') +
        `_${timestamp}_`;
      await axios.post(
        `https://api.telegram.org/bot${d.telegram.token}/sendMessage`,
        { chat_id: d.telegram.chatId, text, parse_mode: 'Markdown' },
        { timeout: 10000 }
      );
    }
  } catch (e) {
    console.error('[WEBHOOK] Erreur envoi:', e.message);
  }
}

module.exports = {
  name:    'webhook',
  aliases: ['notif', 'notification'],
  notify,

  execute: async (ctx) => {
    const { sock, jid, msg, args, antiBan, isOwner, isSudo } = ctx;

    if (!isOwner && !isSudo) {
      await antiBan.safeSend(sock, jid, {
        text: '🔒 Réservé owner/sudo.\n\n' + BOT_TAG,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    const sub  = (args[0] || '').toLowerCase();
    const sub2 = (args[1] || '').toLowerCase();
    const d    = load();

    // ── .webhook off ──────────────────────────────────────────────────────────
    if (sub === 'off') {
      d.enabled = false;
      save(d);
      await antiBan.safeSend(sock, jid, {
        text: '🔴 Webhook désactivé.\n\n' + BOT_TAG,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    // ── .webhook test ─────────────────────────────────────────────────────────
    if (sub === 'test') {
      if (!d.enabled || !d.type) {
        await antiBan.safeSend(sock, jid, {
          text: '❌ Aucun webhook configuré.\n\nUtilise `.webhook set discord [url]`\n\n' + BOT_TAG,
        }, { msgOptions: { quoted: msg } });
        return;
      }
      try {
        await notify('custom', '🧪 Test de notification depuis ZERO TRACE BOT', {
          'Statut': 'Opérationnel',
          'Version': 'v5.0',
        });
        await antiBan.safeSend(sock, jid, {
          text: '✅ Notification test envoyée !\n\n' + BOT_TAG,
        }, { msgOptions: { quoted: msg } });
      } catch (e) {
        await antiBan.safeSend(sock, jid, {
          text: `❌ Échec : \`${e.message}\`\n\n` + BOT_TAG,
        }, { msgOptions: { quoted: msg } });
      }
      return;
    }

    // ── .webhook events [event] [on/off] ──────────────────────────────────────
    if (sub === 'events') {
      const evName = sub2;
      const toggle = (args[2] || '').toLowerCase() === 'on';
      const validEvents = ['startup', 'ownerCmd', 'error', 'newMember', 'shutdown'];
      if (!validEvents.includes(evName)) {
        if (!d.events) d.events = {};
        const eventList = validEvents.map(e =>
          `${d.events?.[e] !== false ? '✅' : '❌'} ${e}`
        ).join('\n');
        await antiBan.safeSend(sock, jid, {
          text:
            `📡 *ÉVÉNEMENTS WEBHOOK*\n\n${eventList}\n\n` +
            `Activer : \`.webhook events [nom] on\`\n` +
            `Désactiver : \`.webhook events [nom] off\`\n\n` + BOT_TAG,
        }, { msgOptions: { quoted: msg } });
        return;
      }
      if (!d.events) d.events = {};
      d.events[evName] = toggle;
      save(d);
      await antiBan.safeSend(sock, jid, {
        text: `${toggle ? '✅' : '❌'} Événement *${evName}* ${toggle ? 'activé' : 'désactivé'}.\n\n` + BOT_TAG,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    // ── .webhook set discord [url] ────────────────────────────────────────────
    if (sub === 'set' && sub2 === 'discord') {
      const url = args[2];
      if (!url || !url.startsWith('https://discord.com/api/webhooks/')) {
        await antiBan.safeSend(sock, jid, {
          text:
            '🎮 *DISCORD WEBHOOK*\n\n' +
            'Usage : `.webhook set discord [url]`\n\n' +
            'Comment obtenir l\'URL :\n' +
            '1. Serveur Discord → Paramètres du salon\n' +
            '2. Intégrations → Webhooks → Nouveau webhook\n' +
            '3. Copier l\'URL\n\n' + BOT_TAG,
        }, { msgOptions: { quoted: msg } });
        return;
      }
      d.type    = 'discord';
      d.discord = url;
      d.enabled = true;
      save(d);
      await antiBan.safeSend(sock, jid, {
        text: '✅ Discord webhook configuré !\n\nTape `.webhook test` pour vérifier.\n\n' + BOT_TAG,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    // ── .webhook set telegram [token] [chatId] ────────────────────────────────
    if (sub === 'set' && sub2 === 'telegram') {
      const token  = args[2];
      const chatId = args[3];
      if (!token || !chatId) {
        await antiBan.safeSend(sock, jid, {
          text:
            '✈️ *TELEGRAM WEBHOOK*\n\n' +
            'Usage : `.webhook set telegram [token] [chatId]`\n\n' +
            'Comment obtenir :\n' +
            '1. Parle à @BotFather sur Telegram\n' +
            '2. /newbot → récupère le token\n' +
            '3. ChatId = ton ID Telegram (via @userinfobot)\n\n' + BOT_TAG,
        }, { msgOptions: { quoted: msg } });
        return;
      }
      d.type     = 'telegram';
      d.telegram = { token, chatId };
      d.enabled  = true;
      save(d);
      await antiBan.safeSend(sock, jid, {
        text: '✅ Telegram webhook configuré !\n\nTape `.webhook test` pour vérifier.\n\n' + BOT_TAG,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    // ── .webhook — état actuel ────────────────────────────────────────────────
    await antiBan.safeSend(sock, jid, {
      text:
        `📡 *WEBHOOK*\n━━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `État    : ${d.enabled ? '🟢 Actif' : '🔴 Inactif'}\n` +
        `Type    : ${d.type || 'Non configuré'}\n\n` +
        `💡 Commandes :\n` +
        `\`.webhook set discord [url]\`\n` +
        `\`.webhook set telegram [token] [chatId]\`\n` +
        `\`.webhook test\`\n` +
        `\`.webhook events\`\n` +
        `\`.webhook off\`\n\n` + BOT_TAG,
    }, { msgOptions: { quoted: msg } });
  },
};
