/**
 * ZERO TRACE BOT v5.0 - Antidelete
 * .antidelete on/off → Renvoyer les messages supprimés
 */
const gs = require('../lib/groupSettings');

module.exports = {
  name: 'antidelete',
  description: 'Renvoyer les messages supprimés dans le groupe',
  usage: '.antidelete on | .antidelete off',
  category: 'admin',

  async execute(ctx) {
    const { sock, jid, msg, args, antiBan, isOwner, isSudo, sender, isGroupAdmin} = ctx;

    if (!jid.endsWith('@g.us')) {
      await antiBan.safeSend(sock, jid, { text: '❌ Groupes uniquement.' }, { msgOptions: { quoted: msg } });
      return;
    }

    let hasRight = isOwner || isSudo || isGroupAdmin;
    if (!hasRight) {
      try {
        const meta = await sock.groupMetadata(jid);
        hasRight = meta.participants.some(p => p.id === sender && p.admin);
      } catch (e) {}
    }
    if (!hasRight) {
      await antiBan.safeSend(sock, jid, { text: '❌ Réservé aux admins.' }, { msgOptions: { quoted: msg } });
      return;
    }

    const sub = (args[0] || '').toLowerCase();
    if (!sub) {
      const etat = gs.isEnabled('antidelete', jid) ? '🟢 ACTIVÉ' : '🔴 DÉSACTIVÉ';
      await antiBan.safeSend(sock, jid, {
        text: `🗑️ *ANTIDELETE* — État: ${etat}\n\n• *.antidelete on* — Activer\n• *.antidelete off* — Désactiver`,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    if (sub === 'on') {
      gs.setEnabled('antidelete', jid, true);
      await antiBan.safeSend(sock, jid, {
        text: `✅ *Antidelete activé !*\nLes messages supprimés seront renvoyés.\n\n> *ZERO TRACE BOT v5.0*`,
      }, { msgOptions: { quoted: msg } });
    } else if (sub === 'off') {
      gs.setEnabled('antidelete', jid, false);
      await antiBan.safeSend(sock, jid, {
        text: `🔴 *Antidelete désactivé.*\n\n> *ZERO TRACE BOT v5.0*`,
      }, { msgOptions: { quoted: msg } });
    } else {
      await antiBan.safeSend(sock, jid, { text: '❌ Utilise *.antidelete on* ou *.antidelete off*' }, { msgOptions: { quoted: msg } });
    }
  },
};
