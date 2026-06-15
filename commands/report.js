/**
 * ZERO TRACE BOT v5.0 — .report
 * Signaler un message à l'admin
 */
'use strict';
const fs   = require('fs-extra');
const path = require('path');
const settings = require('../settings');

const DATA_FILE = path.join(__dirname, '..', 'data', 'reports.json');
const COOLDOWNS = {};

function load() { try { return fs.readJsonSync(DATA_FILE); } catch { return []; } }
function save(d) { fs.ensureDirSync(path.dirname(DATA_FILE)); fs.writeJsonSync(DATA_FILE, d, { spaces: 2 }); }

module.exports = {
  name: 'report',
  description: 'Signaler un message ou un membre aux admins',
  usage: '.report [raison] (en répondant à un message)',
  category: 'admin',

  async execute(ctx) {
    const { sock, jid, msg, args, antiBan, pushName, sender, isGroup } = ctx;
    if (!isGroup) { await antiBan.safeSend(sock, jid, { text: '❌ Groupes uniquement.' }, { msgOptions: { quoted: msg } }); return; }

    // Cooldown 2 min par user
    const now = Date.now();
    if (COOLDOWNS[sender] && now - COOLDOWNS[sender] < 120000) {
      const reste = Math.ceil((120000 - (now - COOLDOWNS[sender])) / 1000);
      await antiBan.safeSend(sock, jid, { text: `⏳ Attends encore *${reste}s* avant de re-signaler.` }, { msgOptions: { quoted: msg } });
      return;
    }

    const raison   = args.join(' ') || 'Aucune raison précisée';
    const quoted   = msg.message?.extendedTextMessage?.contextInfo;
    const cible    = quoted?.participant || quoted?.remoteJid || 'Inconnu';
    const msgCite  = quoted?.quotedMessage?.conversation || quoted?.quotedMessage?.extendedTextMessage?.text || '(media ou message non textuel)';

    COOLDOWNS[sender] = now;
    const reports = load();
    reports.push({ jid, reporter: sender, reporterName: pushName, cible, raison, msgCite, at: new Date().toISOString() });
    save(reports);

    // Notifier les admins du groupe
    try {
      const groupMeta = await sock.groupMetadata(jid);
      const admins = groupMeta.participants.filter(p => p.admin).map(p => p.id);
      for (const admin of admins) {
        await antiBan.safeSend(sock, admin, {
          text: `🚨 *SIGNALEMENT*\n\n` +
            `📍 Groupe : *${groupMeta.subject}*\n` +
            `👤 Signalé par : *${pushName}*\n` +
            `🎯 Membre ciblé : @${cible.split('@')[0]}\n` +
            `📋 Raison : _${raison}_\n` +
            `💬 Message signalé : _${msgCite.slice(0, 200)}_\n` +
            `🕐 Date : ${new Date().toLocaleString('fr-FR')}\n\n` +
            `> _ZERO TRACE 😈_`,
          mentions: [cible],
        }, {});
      }
    } catch {}

    await antiBan.safeSend(sock, jid, {
      text: `✅ *Signalement envoyé aux admins.*\n\nMerci *${pushName}*, les admins ont été notifiés.`,
    }, { msgOptions: { quoted: msg } });
  },
};
