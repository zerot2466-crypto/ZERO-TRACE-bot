/**
 * ZERO TRACE BOT v5.0 — Commande .myprefix
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Chaque utilisateur pairé gère son propre prefix.
 *
 * Usage :
 *   .myprefix           → afficher son prefix actuel
 *   .myprefix !         → changer son prefix en "!"
 *   .myprefix reset     → revenir au prefix global
 *   .myprefix list      → [owner] voir tous les prefix custom
 */

'use strict';
const zts = require('../lib/ztStyle');

const userPrefix = require('../lib/userPrefix');
const config     = require('../config');
const { isPairedNumber } = require('./pair');

module.exports = {
  name: 'myprefix',
  aliases: ['monprefix', 'setmyprefix', 'mypfx'],
  description: 'Gérer ton prefix personnel',
  usage: '.myprefix [nouveau | reset]',
  category: 'util',

  async execute(ctx) {
    const { sock, jid, msg, args, sender, antiBan, isOwner, isSudo } = ctx;
    const globalPrefix = config.getPrefix();
    const sub = (args[0] || '').toLowerCase().trim();

    // ── [Owner] Lister tous les prefix custom (ne nécessite pas d'être pairé) ─
    if (sub === 'list' || sub === 'liste' || sub === 'all') {
      if (!isOwner && !isSudo) {
        await antiBan.safeSend(sock, jid, {
          text: zts.randErr(zts.OWNER_ERRORS),
        }, { msgOptions: { quoted: msg } });
        return;
      }
      const all = userPrefix.listAll(globalPrefix).filter(u => u.isCustom);
      if (!all.length) {
        await antiBan.safeSend(sock, jid, {
          text: `📋 Aucun utilisateur n'a de prefix custom.\nTous utilisent *${globalPrefix}*`,
        }, { msgOptions: { quoted: msg } });
        return;
      }
      const lines = all.map(u => `  +${u.number} → *${u.prefix}*`).join('\n');
      await antiBan.safeSend(sock, jid, {
        text:
          `📋 *PREFIXES PERSONNALISÉS* (${all.length})\n\n` +
          `${lines}\n\n` +
          `Prefix global : *${globalPrefix}*\n\n` +
          `> ⚡ _ZERO TRACE BOT v5.0_`,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    // ── Réservé aux comptes ayant pairé leur propre bot via .pair ──────────
    // (owner/sudo utilisent toujours le prefix global, jamais personnalisable)
    if (!isOwner && !isSudo && !isPairedNumber(sender)) {
      await antiBan.safeSend(sock, jid, {
        text:
          `❌ *Commande réservée aux comptes pairés.*\n\n` +
          `> 💡 Utilise \`${globalPrefix}pair\` pour connecter ton propre bot, ` +
          `tu pourras ensuite définir ton prefix personnel.\n\n` +
          `> ⚡ _ZERO TRACE BOT v5.0_`,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    if (isOwner || isSudo) {
      await antiBan.safeSend(sock, jid, {
        text:
          `⚙️ Le prefix de l'owner/sudo est toujours le prefix global : *${globalPrefix}*\n\n` +
          `Le prefix personnel (\`myprefix\`) est réservé aux comptes pairés via \`${globalPrefix}pair\`.\n\n` +
          `> ⚡ _ZERO TRACE BOT v5.0_`,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    const current = userPrefix.getPrefix(sender, globalPrefix);

    // ── Afficher son prefix actuel ──────────────────────────────────────────
    if (!sub) {
      const isCustom = current !== globalPrefix;
      await antiBan.safeSend(sock, jid, {
        text:
          `⚙️ *TON PREFIX PERSONNEL*\n\n` +
          `Ton prefix actuel : *${current}*\n` +
          `Prefix global du bot : *${globalPrefix}*\n` +
          `Status : ${isCustom ? '🔵 Personnalisé' : '⚪ Identique au global'}\n\n` +
          `📌 *Commandes :*\n` +
          `• \`${current}myprefix !\` → changer en "!"\n` +
          `• \`${current}myprefix /\` → changer en "/"\n` +
          `• \`${current}myprefix reset\` → revenir au global (*${globalPrefix}*)\n\n` +
          `> ⚡ _ZERO TRACE BOT v5.0_`,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    // ── Reset → prefix global ───────────────────────────────────────────────
    if (sub === 'reset' || sub === 'réinitialiser' || sub === 'default') {
      userPrefix.resetPrefix(sender);
      await antiBan.safeSend(sock, jid, {
        text:
          `🔄 *Prefix réinitialisé !*\n\n` +
          `Ton prefix revient au global : *${globalPrefix}*\n\n` +
          `> ⚡ _ZERO TRACE BOT v5.0_`,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    // ── Changer son prefix ──────────────────────────────────────────────────
    const newPrefix = args[0]; // on prend la valeur brute (pas .toLowerCase())

    // Validations
    if (!newPrefix || newPrefix.length > 3) {
      await antiBan.safeSend(sock, jid, {
        text:
          `❌ *Prefix invalide !*\n\n` +
          `• Max 3 caractères\n` +
          `• Exemples : \`!\` \`/\` \`#\` \`>\` \`?\`\n\n` +
          `Usage : \`${current}myprefix !\``,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    // Bloquer les lettres/chiffres seuls (risque de collision avec messages normaux)
    if (/^[a-zA-Z0-9]+$/.test(newPrefix)) {
      await antiBan.safeSend(sock, jid, {
        text:
          `❌ Un prefix ne peut pas être uniquement des lettres ou chiffres.\n\n` +
          `Utilise un symbole : \`!\` \`/\` \`#\` \`>\` \`?\` \`~\` \`;\``,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    const old = userPrefix.setPrefix(sender, newPrefix);
    const oldDisplay = old || globalPrefix;

    await antiBan.safeSend(sock, jid, {
      text:
        `✅ *Ton prefix a changé !*\n\n` +
        `${oldDisplay} → *${newPrefix}*\n\n` +
        `Utilise maintenant *${newPrefix}menu* ou *${newPrefix}help*\n\n` +
        `💡 Pour revenir au global : \`${newPrefix}myprefix reset\`\n\n` +
        `> ⚡ _ZERO TRACE BOT v5.0_`,
    }, { msgOptions: { quoted: msg } });
  },
};
