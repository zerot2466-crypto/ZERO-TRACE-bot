/**
 * ZERO TRACE BOT v5.0 - myid · about · start
 */
const settings = require('../settings');
const config   = require('../config');

const myid = {
  name: 'myid',
  execute: async (ctx) => {
    const { sock, jid, msg, antiBan, sender, pushName, isGroup } = ctx;
    const num = sender.split('@')[0];
    const mentions = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const target   = mentions[0] || sender;
    const targetNum = target.split('@')[0];
    await antiBan.safeSend(sock, jid, {
      text:
        `🪪 *INFOS UTILISATEUR*\n\n` +
        `👤 Nom : *${pushName}*\n` +
        `📱 Numéro : *+${targetNum}*\n` +
        `🔗 JID : \`${target}\`\n` +
        `📍 Contexte : ${isGroup ? '👥 Groupe' : '💬 Privé'}\n\n` +
        `> *ZERO TRACE BOT v5.0*`,
      mentions,
    }, { msgOptions: { quoted: msg } });
  },
};

const about = {
  name: 'about',
  execute: async (ctx) => {
    const { sock, jid, msg, antiBan } = ctx;
    await antiBan.safeSend(sock, jid, {
      text:
        `🤖 *À PROPOS DE ZERO TRACE BOT*\n\n` +
        `📦 Version : *${settings.version || '5.0.0'}*\n` +
        `👨‍💻 Dev : *ZT Team*\n` +
        `⚙️ Préfixe : \`${config.getPrefix()}\`\n` +
        `🔗 Canal : ${settings.channelLink || 'N/A'}\n\n` +
        `💡 *Fonctionnalités :*\n` +
        `• IA multi-provider (GPT, Gemini, Groq)\n` +
        `• Agent IA autonome\n` +
        `• Vocaux → transcription + réponse audio\n` +
        `• Jeux de rôle RPG complets\n` +
        `• OSINT & outils réseau\n` +
        `• Célébrations, bien-être, mystique\n` +
        `• Téléchargements (YT, TikTok, IG...)\n` +
        `• Modération de groupe avancée\n\n` +
        `> *ZERO TRACE BOT v5.0*`,
    }, { msgOptions: { quoted: msg } });
  },
};

const start = {
  name: 'start',
  execute: async (ctx) => {
    const { sock, jid, msg, antiBan, pushName } = ctx;
    const p = config.getPrefix();
    await antiBan.safeSend(sock, jid, {
      text:
        `⚡ *ZERO TRACE BOT — DÉMARRÉ !*\n\n` +
        `Salut *${pushName}* ! 👋\n\n` +
        `Je suis opérationnel et prêt à tout faire.\n\n` +
        `📋 *Commandes de base :*\n` +
        `• \`${p}menu\` — Liste complète\n` +
        `• \`${p}ai [question]\` — Parler à l'IA\n` +
        `• \`${p}help\` — Aide\n\n` +
        `> *ZERO TRACE BOT v5.0*`,
    }, { msgOptions: { quoted: msg } });
  },
};

module.exports = { myid, about, start };
