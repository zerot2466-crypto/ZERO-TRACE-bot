const zts = require('../lib/ztStyle');
/**
 * .promote / .demote — Promouvoir/rétrograder un admin de groupe
 */
module.exports = {
  name: 'promote',
  description: 'Promouvoir un membre en admin',
  usage: '.promote @user | .demote @user',
  category: 'admin',
  async execute(ctx) {
    const { sock, jid, msg, args, antiBan, isOwner, isSudo, command, sender, isGroupAdmin} = ctx;
    if (!jid.endsWith('@g.us')) {
      await antiBan.safeSend(sock, jid, { text: zts.randErr(zts.GROUP_ONLY) }, { msgOptions: { quoted: msg } });
      return;
    }
    // Vérifier droits admin bot
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
      await antiBan.safeSend(sock, jid, {
        text: command === 'promote' ? `\`\`\`[ZT-ADMIN] Usage: .promote @user\`\`\`\n\n> ${zts.sig()}` : `\`\`\`[ZT-ADMIN] Usage: .demote @admin\`\`\`\n\n> ${zts.sig()}`,
      }, { msgOptions: { quoted: msg } });
      return;
    }
    try {
      if (command === 'promote') {
        await sock.groupParticipantsUpdate(jid, mentioned, 'promote');
        await antiBan.safeSend(sock, jid, {
          text: `⬆️ ${mentioned.map(m => '@' + m.split('@')[0]).join(', ')} promu(s) admin !`,
          mentions: mentioned,
        }, { msgOptions: { quoted: msg } });
      } else {
        await sock.groupParticipantsUpdate(jid, mentioned, 'demote');
        await antiBan.safeSend(sock, jid, {
          text: `⬇️ ${mentioned.map(m => '@' + m.split('@')[0]).join(', ')} rétrogradé(s).`,
          mentions: mentioned,
        }, { msgOptions: { quoted: msg } });
      }
    } catch (e) {
      await antiBan.safeSend(sock, jid, { text: `❌ Erreur : ${e.message}` }, { msgOptions: { quoted: msg } });
    }
  },
};
