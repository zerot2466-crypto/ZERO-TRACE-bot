/**
 * ZERO TRACE BOT v5.0 — mail.js
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Email temporaire via mail.tm API
 *
 * Commandes :
 *   .mail gen       — créer un email temporaire
 *   .mail inbox     — voir les messages reçus
 *   .mail read [n]  — lire un message
 *   .mail info      — infos sur l'email actif
 *   .mail delete    — supprimer l'email
 */
'use strict';

const axios    = require('axios');
const settings = require('../settings');

const API_BASE    = 'https://api.mail.tm';
const CHANNEL     = process.env.CHANNEL_LINK || settings.channelLink || 'https://whatsapp.com/channel/0029VbCEDif84OmANqy2xI0X';
const OWNER_NUM   = process.env.OWNER_NUMBER  || settings.ownerNumber || '260956849240';
const OWNER_LINK  = `https://wa.me/${OWNER_NUM}`;
const BOT_TAG     = `> ⚡ _ZERO TRACE BOT v5.0_\n> 👑 _Owner : wa.me/${OWNER_NUM}_`;

// ── Sessions en mémoire (par sender) ─────────────────────────────────────────
const mailSessions = new Map();

// ── Classe TempMail ───────────────────────────────────────────────────────────
class TempMail {
  constructor(email, password, id) {
    this.email     = email;
    this.password  = password;
    this.id        = id;
    this.createdAt = Date.now();
    this.messages  = [];
    this.token     = null;
  }
  getAge()    { return Math.floor((Date.now() - this.createdAt) / 60000); }
  isExpired() { return this.getAge() > 60; }
  timeLeft()  { return Math.max(0, 60 - this.getAge()); }
}

// ── API mail.tm ───────────────────────────────────────────────────────────────
async function createTempEmail() {
  const domainRes = await axios.get(`${API_BASE}/domains`, { timeout: 15000 });
  const domain    = domainRes.data['hydra:member'][0].domain;
  const name      = Math.random().toString(36).substring(2, 12);
  const email     = `${name}@${domain}`;
  const password  = Math.random().toString(36).substring(2, 15);
  const res       = await axios.post(`${API_BASE}/accounts`, { address: email, password }, { timeout: 15000 });
  if (!res.data?.id) throw new Error('Création compte mail échouée');
  return { email, password, id: res.data.id };
}

async function getToken(email, password) {
  const res = await axios.post(`${API_BASE}/token`, { address: email, password }, { timeout: 10000 });
  return res.data.token;
}

async function getMessages(token) {
  const res = await axios.get(`${API_BASE}/messages`, {
    headers: { Authorization: `Bearer ${token}` }, timeout: 10000,
  });
  const msgs = res.data['hydra:member'] || [];
  return msgs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

async function getMessageContent(token, id) {
  const res = await axios.get(`${API_BASE}/messages/${id}`, {
    headers: { Authorization: `Bearer ${token}` }, timeout: 10000,
  });
  return res.data;
}

// ── COMMANDE ──────────────────────────────────────────────────────────────────
module.exports = {
  name:    'mail',
  aliases: ['tempmail', 'email', 'mailtemp'],

  execute: async (ctx) => {
    const { sock, jid, msg, args, antiBan, sender } = ctx;
    const sub = (args[0] || '').toLowerCase();

    // ── .mail / .mail help ────────────────────────────────────────────────────
    if (!sub || sub === 'help') {
      await antiBan.safeSend(sock, jid, {
        text:
          `📧 *EMAIL TEMPORAIRE*\n` +
          `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
          `📝 *Commandes :*\n` +
          `  \`.mail gen\`       — créer un email\n` +
          `  \`.mail inbox\`     — voir les messages\n` +
          `  \`.mail read [n]\`  — lire un message\n` +
          `  \`.mail info\`      — infos email actif\n` +
          `  \`.mail delete\`    — supprimer l'email\n\n` +
          `⏳ Durée de vie : *1 heure*\n` +
          `🔗 Canal : ${CHANNEL}\n\n` + BOT_TAG,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    // ── .mail gen ─────────────────────────────────────────────────────────────
    if (['gen', 'generate', 'new', 'create'].includes(sub)) {
      const old = mailSessions.get(sender);
      if (old && !old.isExpired()) {
        await antiBan.safeSend(sock, jid, {
          text:
            `⚠️ *Email déjà actif*\n\n` +
            `📧 \`${old.email}\`\n` +
            `⏱️ Expire dans *${old.timeLeft()} minutes*\n\n` +
            `Utilise \`.mail delete\` pour en créer un nouveau.\n\n` + BOT_TAG,
        }, { msgOptions: { quoted: msg } });
        return;
      }

      await antiBan.safeSend(sock, jid, {
        text: '🔄 _Création de l\'email en cours..._',
      }, { msgOptions: { quoted: msg } });

      try {
        const data    = await createTempEmail();
        const session = new TempMail(data.email, data.password, data.id);
        mailSessions.set(sender, session);

        await antiBan.safeSend(sock, jid, {
          text:
            `✅ *EMAIL TEMPORAIRE CRÉÉ*\n` +
            `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
            `⏳ Expire dans *60 minutes*\n\n` +
            `📌 *Étapes :*\n` +
            `  1️⃣ Copie l'email envoyé ci-dessous\n` +
            `  2️⃣ Utilise-le pour t'inscrire\n` +
            `  3️⃣ \`.mail inbox\` pour voir les messages\n` +
            `  4️⃣ \`.mail read 1\` pour lire + récupérer l'OTP\n\n` +
            `💡 L'email, le mot de passe et les codes OTP sont\n` +
            `envoyés *séparément* pour pouvoir les *copier d'un tap*\n\n` +
            `🔗 Canal : ${CHANNEL}\n\n` + BOT_TAG,
        }, { msgOptions: { quoted: msg } });
        // ✅ Email seul — copiable d'un tap
        await sock.sendMessage(jid, { text: data.email });
        // ✅ Mot de passe seul — copiable
        await sock.sendMessage(jid, { text: `🔑 ${data.password}` });

      } catch (e) {
        await antiBan.safeSend(sock, jid, {
          text: `❌ Erreur création email : \`${e.message}\`\n\n` + BOT_TAG,
        }, { msgOptions: { quoted: msg } });
      }
      return;
    }

    // ── .mail inbox ───────────────────────────────────────────────────────────
    if (['inbox', 'messages', 'list', 'msgs'].includes(sub)) {
      const s = mailSessions.get(sender);
      if (!s) {
        await antiBan.safeSend(sock, jid, {
          text: `❌ Aucun email actif.\nTape \`.mail gen\` pour en créer un.\n\n` + BOT_TAG,
        }, { msgOptions: { quoted: msg } });
        return;
      }
      if (s.isExpired()) {
        mailSessions.delete(sender);
        await antiBan.safeSend(sock, jid, {
          text: `❌ Ton email a expiré.\nTape \`.mail gen\` pour en créer un nouveau.\n\n` + BOT_TAG,
        }, { msgOptions: { quoted: msg } });
        return;
      }

      await antiBan.safeSend(sock, jid, {
        text: '📥 _Récupération des messages..._',
      }, { msgOptions: { quoted: msg } });

      try {
        if (!s.token) s.token = await getToken(s.email, s.password);
        const msgs  = await getMessages(s.token);
        s.messages  = msgs;

        if (!msgs.length) {
          await antiBan.safeSend(sock, jid, {
            text:
              `📭 *BOÎTE VIDE*\n\n` +
              `📧 \`${s.email}\`\n` +
              `⏱️ Expire dans *${s.timeLeft()} min*\n\n` +
              `💡 Astuce : envoie un email à cette adresse depuis n'importe quel service, puis refais \`.mail inbox\`\n\n` +
              `🔗 Canal : ${CHANNEL}\n\n` + BOT_TAG,
          }, { msgOptions: { quoted: msg } });
          return;
        }

        let text = `📥 *INBOX (${msgs.length} message${msgs.length > 1 ? 's' : ''})*\n`;
        text    += `📧 \`${s.email}\`\n`;
        text    += `⏱️ Expire dans *${s.timeLeft()} min*\n`;
        text    += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;
        msgs.slice(0, 10).forEach((m, i) => {
          const date = new Date(m.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
          text += `*${i + 1}.* ${m.subject || '(Sans objet)'}\n`;
          text += `   ✉️ De : ${m.from?.address || '?'}\n`;
          text += `   🕐 ${date}\n`;
          text += `   → \`.mail read ${i + 1}\`\n\n`;
        });
        text += `🔗 Canal : ${CHANNEL}\n\n` + BOT_TAG;

        await antiBan.safeSend(sock, jid, { text }, { msgOptions: { quoted: msg } });

      } catch (e) {
        await antiBan.safeSend(sock, jid, {
          text: `❌ Erreur inbox : \`${e.message}\`\n\n` + BOT_TAG,
        }, { msgOptions: { quoted: msg } });
      }
      return;
    }

    // ── .mail read [n] ────────────────────────────────────────────────────────
    if (sub === 'read') {
      const num = parseInt(args[1]);
      const s   = mailSessions.get(sender);

      if (!s) {
        await antiBan.safeSend(sock, jid, {
          text: `❌ Aucun email actif. Tape \`.mail gen\`\n\n` + BOT_TAG,
        }, { msgOptions: { quoted: msg } });
        return;
      }
      if (isNaN(num) || num < 1) {
        await antiBan.safeSend(sock, jid, {
          text: `❌ Usage : \`.mail read [numéro]\`\nEx : \`.mail read 1\`\n\n` + BOT_TAG,
        }, { msgOptions: { quoted: msg } });
        return;
      }

      try {
        if (!s.token) s.token = await getToken(s.email, s.password);
        if (!s.messages.length) s.messages = await getMessages(s.token);

        const target = s.messages[num - 1];
        if (!target) {
          await antiBan.safeSend(sock, jid, {
            text: `❌ Message n°${num} introuvable.\nTape \`.mail inbox\` pour voir la liste.\n\n` + BOT_TAG,
          }, { msgOptions: { quoted: msg } });
          return;
        }

        const full    = await getMessageContent(s.token, target.id);
        let content   = full.text || full.html || '(Contenu vide)';
        if (Array.isArray(content)) content = content[0];

        // Nettoyer le HTML basique
        content = content.replace(/<[^>]+>/g, ' ').replace(/\s{3,}/g, '\n\n').trim();
        if (content.length > 1500) content = content.slice(0, 1500) + '...';

        // Détecter le code OTP automatiquement
        const otpMatch = content.match(/\b\d{4,8}\b/);

        const date = new Date(full.createdAt).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });

        await antiBan.safeSend(sock, jid, {
          text:
            `📧 *MESSAGE N°${num}*\n` +
            `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
            `✉️ De     : \`${full.from?.address || '?'}\`\n` +
            `📌 Objet  : ${full.subject || '(Sans objet)'}\n` +
            `🕐 Reçu   : ${date}\n\n` +
            `${content}\n\n` +
            `🔗 Canal : ${CHANNEL}\n\n` + BOT_TAG,
        }, { msgOptions: { quoted: msg } });
        // ✅ OTP seul dans un message séparé — copiable d'un tap
        if (otpMatch) {
          await sock.sendMessage(jid, {
            text: `🔐 *CODE OTP*\n\n${otpMatch[0]}\n\n_Appuie longuement pour copier_`,
          });
        }

      } catch (e) {
        await antiBan.safeSend(sock, jid, {
          text: `❌ Erreur lecture : \`${e.message}\`\n\n` + BOT_TAG,
        }, { msgOptions: { quoted: msg } });
      }
      return;
    }

    // ── .mail info ────────────────────────────────────────────────────────────
    if (sub === 'info') {
      const s = mailSessions.get(sender);
      if (!s) {
        await antiBan.safeSend(sock, jid, {
          text: `❌ Aucun email actif. Tape \`.mail gen\`\n\n` + BOT_TAG,
        }, { msgOptions: { quoted: msg } });
        return;
      }
      await antiBan.safeSend(sock, jid, {
        text:
          `📧 *INFO EMAIL*\n` +
          `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
          `📧 Email    : \`${s.email}\`\n` +
          `🔑 Password : \`${s.password}\`\n` +
          `⏳ Actif    : depuis ${s.getAge()} min\n` +
          `⏱️ Expire   : dans ${s.timeLeft()} min\n` +
          `📬 Messages : ${s.messages.length} chargé(s)\n\n` +
          `🔗 Canal : ${CHANNEL}\n\n` + BOT_TAG,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    // ── .mail delete ──────────────────────────────────────────────────────────
    if (['delete', 'del', 'remove', 'supprimer'].includes(sub)) {
      const s = mailSessions.get(sender);
      if (!s) {
        await antiBan.safeSend(sock, jid, {
          text: `❌ Aucun email actif.\n\n` + BOT_TAG,
        }, { msgOptions: { quoted: msg } });
        return;
      }
      mailSessions.delete(sender);
      await antiBan.safeSend(sock, jid, {
        text:
          `✅ *EMAIL SUPPRIMÉ*\n\n` +
          `📧 \`${s.email}\`\n\n` +
          `Tape \`.mail gen\` pour en créer un nouveau.\n\n` +
          `🔗 Canal : ${CHANNEL}\n\n` + BOT_TAG,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    // Commande invalide
    await antiBan.safeSend(sock, jid, {
      text:
        `❌ Sous-commande invalide.\n\n` +
        `Tape \`.mail help\` pour voir les commandes.\n\n` + BOT_TAG,
    }, { msgOptions: { quoted: msg } });
  },
};
