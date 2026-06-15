/**
 * .link / .revoke — Lien d'invitation du groupe
 */
module.exports = {
  name: 'link',
  description: 'Obtenir/révoquer le lien d\'invitation',
  usage: '.link | .revoke',
  category: 'admin',
  async execute(ctx) {
    const { sock, jid, msg, antiBan, command, sender, isOwner, isSudo, isGroupAdmin} = ctx;
    if (!jid.endsWith('@g.us')) {
      await antiBan.safeSend(sock, jid, { text: '❌ Commande de groupe uniquement.' }, { msgOptions: { quoted: msg } });
      return;
    }
    let isAdmin = isOwner || isSudo || isGroupAdmin;
    try {
      const meta = await sock.groupMetadata(jid);
      isAdmin = isAdmin || meta.participants.some(p => p.id === sender && (p.admin === 'admin' || p.admin === 'superadmin'));
    } catch (e) {}
    if (!isAdmin && command === 'revoke') {
      await antiBan.safeSend(sock, jid, { text: '❌ Seuls les admins peuvent révoquer le lien.' }, { msgOptions: { quoted: msg } });
      return;
    }
    try {
      if (command === 'revoke') {
        await sock.groupRevokeInvite(jid);
        await antiBan.safeSend(sock, jid, {
          text: `🔄 *Lien révoqué !*\nL'ancien lien ne fonctionne plus.\nTape .link pour obtenir le nouveau.`,
        }, { msgOptions: { quoted: msg } });
      } else {
        const code = await sock.groupInviteCode(jid);
        await antiBan.safeSend(sock, jid, {
          text: `🔗 *LIEN D'INVITATION*\n\nhttps://chat.whatsapp.com/${code}\n\nTape .revoke pour le changer.`,
        }, { msgOptions: { quoted: msg } });
      }
    } catch (e) {
      await antiBan.safeSend(sock, jid, { text: `❌ Erreur : ${e.message}` }, { msgOptions: { quoted: msg } });
    }
  },
};
