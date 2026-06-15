const zts = require('../lib/ztStyle');
/**
 * ZERO TRACE BOT v3.0 - Commande Sudo
 */

const config = require('../config');

module.exports = {
  name: 'sudo',
  description: 'Gérer les utilisateurs sudo (owner only)',
  usage: '.sudo [add/del/list] [@user ou numéro]',
  category: 'admin',

  async execute(ctx) {
    const { sock, jid, msg, args, antiBan, isOwner } = ctx;

    if (!isOwner) {
      await antiBan.safeSend(sock, jid, {
        text: zts.randErr(zts.OWNER_ERRORS),
      }, { msgOptions: { quoted: msg } });
      return;
    }

    const sub = args[0]?.toLowerCase();
    if (!sub || !['add', 'del', 'remove', 'list'].includes(sub)) {
      await antiBan.safeSend(sock, jid, {
        text: `👥 *Gestion Sudo*\n\n` +
          `• .sudo add @user → Ajouter\n• .sudo del @user → Retirer\n• .sudo list → Lister`,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    if (sub === 'list') {
      const list = config.getSudoUsers();
      const text = list.length === 0
        ? '👥 Aucun sudo configuré.'
        : `👥 *Sudos (${list.length}):*\n\n` + list.map((s, i) => `${i + 1}. +${s.split('@')[0]}`).join('\n');
      await antiBan.safeSend(sock, jid, { text }, { msgOptions: { quoted: msg } });
      return;
    }

    // Récupérer la cible
    const mentions = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    let targetJid  = mentions[0] || msg.message?.extendedTextMessage?.contextInfo?.participant;
    if (!targetJid && args[1]) {
      const num = args[1].replace(/[^0-9]/g, '');
      if (num.length >= 10) targetJid = `${num}@s.whatsapp.net`;
    }

    if (!targetJid) {
      await antiBan.safeSend(sock, jid, {
        text: `\`\`\`[ZT-SUDO] Usage: .sudo add @user | .sudo remove @user\`\`\`\n\n> ${zts.sig()}`,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    if (sub === 'add') {
      const ok = config.addSudo(targetJid);
      await antiBan.safeSend(sock, jid, {
        text: ok ? `✅ +${targetJid.split('@')[0]} ajouté comme sudo.` : `⚠️ +${targetJid.split('@')[0]} est déjà sudo.`,
        mentions: [targetJid],
      }, { msgOptions: { quoted: msg } });
    } else {
      const ok = config.removeSudo(targetJid);
      await antiBan.safeSend(sock, jid, {
        text: ok ? `✅ +${targetJid.split('@')[0]} retiré des sudos.` : `⚠️ +${targetJid.split('@')[0]} n'était pas sudo.`,
        mentions: [targetJid],
      }, { msgOptions: { quoted: msg } });
    }
  },
};
