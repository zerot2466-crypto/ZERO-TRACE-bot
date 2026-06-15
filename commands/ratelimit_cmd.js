/**
 * ZERO TRACE BOT v5.0 — Commandes de gestion du Rate Limit
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * .rlstatus  → voir la config et les stats (owner)
 * .rlreset [@user] → débloquer un utilisateur (owner)
 * .rlset [max] [window] → changer les limites à chaud (owner)
 */
'use strict';

const rl = require('../lib/ratelimit');

module.exports = {
  name:    'rlstatus',
  aliases: ['ratelimit', 'rlstats', 'antispam'],
  description: 'Gérer le rate limit (anti-spam commandes)',
  usage:   '.rlstatus | .rlreset @user | .rlset 2 30',
  category: 'owner',

  async execute(ctx) {
    const { sock, jid, msg, args, antiBan, isOwner, isSudo, command } = ctx;

    if (!isOwner && !isSudo) {
      await antiBan.safeSend(sock, jid, {
        text: '❌ Réservé au propriétaire et aux sudos.',
      }, { msgOptions: { quoted: msg } });
      return;
    }

    // ── .rlreset [@user ou numéro] ─────────────────────────────────────────
    if (command === 'rlreset') {
      let targetJid = null;

      // Mention @user
      if (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length) {
        targetJid = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
      } else if (args[0]) {
        const num = args[0].replace(/[^0-9]/g, '');
        if (num.length >= 8) targetJid = `${num}@s.whatsapp.net`;
      }

      if (!targetJid) {
        await antiBan.safeSend(sock, jid, {
          text:
            `❌ Mentionne un utilisateur ou donne son numéro.\n\n` +
            `Ex : *.rlreset @user*\n` +
            `Ex : *.rlreset 22656354706*`,
        }, { msgOptions: { quoted: msg } });
        return;
      }

      const existed = rl.resetUser(targetJid);
      await antiBan.safeSend(sock, jid, {
        text: existed
          ? `✅ *Rate limit réinitialisé* pour\n+${targetJid.split('@')[0]}\n\nIl peut à nouveau utiliser le bot.\n\n> *ZERO TRACE BOT v5.0*`
          : `⚠️ Cet utilisateur n'avait pas de rate limit actif.\n\n> *ZERO TRACE BOT v5.0*`,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    // ── .rlstatus → Statistiques ───────────────────────────────────────────
    const stats = rl.getStats();

    await antiBan.safeSend(sock, jid, {
      text:
        `⏳ *RATE LIMIT — ZERO TRACE*\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `🔧 *Configuration :*\n` +
        `• Statut : ${stats.config.enabled ? '🟢 Activé' : '🔴 Désactivé'}\n` +
        `• Max commandes : *${stats.config.maxCmds}* par fenêtre\n` +
        `• Fenêtre : *${Math.ceil(stats.config.windowMs / 1000)} secondes*\n\n` +
        `📊 *Statistiques temps réel :*\n` +
        `• Utilisateurs suivis : *${stats.totalTracked}*\n` +
        `• Fenêtres actives : *${stats.activeWindows}*\n` +
        `• Utilisateurs bloqués : *${stats.blockedUsers}*\n\n` +
        `⚡ *Commandes exemptées :*\n` +
        `_${[...rl.EXEMPT_CMDS].join(', ')}_\n\n` +
        `*Commandes de gestion :*\n` +
        `• *.rlreset @user* → débloquer\n` +
        `• *.rlreset [numéro]* → débloquer par numéro\n\n` +
        `> *ZERO TRACE BOT v5.0*`,
    }, { msgOptions: { quoted: msg } });
  },
};
