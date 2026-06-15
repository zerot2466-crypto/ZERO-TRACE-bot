const zts = require('../lib/ztStyle');
/**
 * .resetwarn — Réinitialiser les avertissements d'un membre
 */
const fs   = require('fs-extra');
const path = require('path');
const warnFile = path.join(__dirname, '../data/warnings.json');

function loadWarns() {
  try { return fs.readJsonSync(warnFile); } catch { return {}; }
}
function saveWarns(data) { fs.writeJsonSync(warnFile, data, { spaces: 2 }); }

module.exports = {
  name: 'resetwarn',
  description: 'Réinitialiser les avertissements d\'un membre',
  usage: '.resetwarn @user',
  category: 'admin',
  async execute(ctx) {
    const { sock, jid, msg, antiBan, sender, isOwner, isSudo, isGroupAdmin} = ctx;
    if (!jid.endsWith('@g.us')) {
      await antiBan.safeSend(sock, jid, { text: zts.randErr(zts.GROUP_ONLY) }, { msgOptions: { quoted: msg } });
      return;
    }
    let isAdmin = isOwner || isSudo || isGroupAdmin;
    try {
      const meta = await sock.groupMetadata(jid);
      isAdmin = isAdmin || meta.participants.some(p => p.id === sender && (p.admin === 'admin' || p.admin === 'superadmin'));
    } catch (e) {}
    if (!isAdmin) {
      await antiBan.safeSend(sock, jid, { text: zts.randErr(zts.PERM_ERRORS) }, { msgOptions: { quoted: msg } });
      return;
    }
    const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    if (!mentioned.length) {
      await antiBan.safeSend(sock, jid, { text: `\`\`\`[ZT-WARN] Usage: .resetwarn @user\`\`\`\n\n> ${zts.sig()}` }, { msgOptions: { quoted: msg } });
      return;
    }
    const warns = loadWarns();
    for (const m of mentioned) {
      const key = `${jid}_${m}`;
      delete warns[key];
    }
    saveWarns(warns);
    await antiBan.safeSend(sock, jid, {
      text: `✅ Avertissements réinitialisés pour ${mentioned.map(m => '@' + m.split('@')[0]).join(', ')}`,
      mentions: mentioned,
    }, { msgOptions: { quoted: msg } });
  },
};
