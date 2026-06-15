'use strict';
const fs   = require('fs-extra');
const path = require('path');
const zts  = require('../lib/ztStyle');

const WARN_FILE = path.join(__dirname, '..', 'data', 'warnings.json');
function loadWarnings() { try { return fs.readJsonSync(WARN_FILE); } catch { return {}; } }
function saveWarnings(d) { fs.ensureDirSync(path.dirname(WARN_FILE)); fs.writeJsonSync(WARN_FILE, d, { spaces: 2 }); }

module.exports = {
  name: 'warn', aliases: ['avertir', 'avert'],
  description: 'Avertir un membre (3 warns = expulsion)',
  usage: '.warn @user [raison]', category: 'admin',

  async execute(ctx) {
    const { sock, jid, msg, args, antiBan, isGroup, isOwner, isSudo, isGroupAdmin } = ctx;

    if (!isGroup) {
      await antiBan.safeSend(sock, jid, { text: zts.randErr(zts.GROUP_ONLY) }, { msgOptions: { quoted: msg } });
      return;
    }
    if (!isOwner && !isSudo && !isGroupAdmin) {
      await antiBan.safeSend(sock, jid, { text: zts.randErr(zts.PERM_ERRORS) }, { msgOptions: { quoted: msg } });
      return;
    }

    const mentions = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const target   = mentions[0] || msg.message?.extendedTextMessage?.contextInfo?.participant;
    if (!target) {
      await antiBan.safeSend(sock, jid, {
        text:
          `⚠️ *PROTOCOLE WARN — USAGE*\n` +
          `▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰\n` +
          `Mentionne la cible : \`.warn @user [raison]\`\n\n` +
          `> ${zts.sig()}`,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    const reason   = args.filter(a => !a.startsWith('@')).join(' ') || 'Non précisée';
    const warnings = loadWarnings();
    const key      = `${jid}_${target}`;
    warnings[key]  = (warnings[key] || 0) + 1;
    saveWarnings(warnings);
    const count = warnings[key];

    const meterFull  = '🔴'.repeat(count) + '⚫'.repeat(Math.max(0, 3 - count));
    let kickResult = '';

    if (count >= 3) {
      try {
        await sock.groupParticipantsUpdate(jid, [target], 'remove');
        kickResult =
          `\n\n\`\`\`[ZT-OS] Exécution protocole EXPULSION\n` +
          `Target   : +${target.split('@')[0]}\n` +
          `Action   : REMOVED FROM GROUP\n` +
          `Status   : SUCCESS ✓\`\`\``;
      } catch (e) {
        kickResult = `\n\n⚠️ _Expulsion échouée — le bot doit être admin._`;
      }
      warnings[key] = 0;
      saveWarnings(warnings);
    }

    await antiBan.safeSend(sock, jid, {
      text:
        `⚔️ *AVERTISSEMENT OFFICIEL*\n` +
        `▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰\n` +
        `👤 Cible : @${target.split('@')[0]}\n` +
        `📋 Raison : _${reason}_\n` +
        `🎯 Niveau : ${meterFull} *${count}/3*\n` +
        (count === 2 ? `\n🚨 *DERNIER AVERTISSEMENT — Prochain = EXPULSION*` : '') +
        kickResult + `\n\n> ${zts.sig()}`,
      mentions: [target],
    }, { msgOptions: { quoted: msg } });
  },
};
