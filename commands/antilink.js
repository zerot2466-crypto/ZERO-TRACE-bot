/**
 * ZERO TRACE BOT v5.0 - Antilink
 * .antilink on/off → Supprimer les liens automatiquement
 */
const gs = require('../lib/groupSettings');

module.exports = {
  name: 'antilink',
  description: 'Supprimer automatiquement les liens dans le groupe',
  usage: '.antilink on | .antilink off',
  category: 'admin',

  async execute(ctx) {
    const { sock, jid, msg, args, antiBan, isOwner, isSudo, sender, isGroupAdmin} = ctx;

    if (!jid.endsWith('@g.us')) {
      await antiBan.safeSend(sock, jid, { text: '❌ Cette commande est réservée aux groupes.' }, { msgOptions: { quoted: msg } });
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
      await antiBan.safeSend(sock, jid, { text: '❌ Réservé aux admins du groupe.' }, { msgOptions: { quoted: msg } });
      return;
    }

    const sub = (args[0] || '').toLowerCase();
    if (!sub) {
      const etat = gs.isEnabled('antilink', jid) ? '🟢 ACTIVÉ' : '🔴 DÉSACTIVÉ';
      await antiBan.safeSend(sock, jid, {
        text: `🔗 *ANTILINK* — État: ${etat}\n\n• *.antilink on* — Activer\n• *.antilink off* — Désactiver`,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    if (sub === 'on') {
      gs.setEnabled('antilink', jid, true);
      await antiBan.safeSend(sock, jid, {
        text: `✅ *Antilink activé !*\nTous les liens seront supprimés automatiquement.\n\n> *ZERO TRACE BOT v5.0*`,
      }, { msgOptions: { quoted: msg } });
    } else if (sub === 'off') {
      gs.setEnabled('antilink', jid, false);
      await antiBan.safeSend(sock, jid, {
        text: `🔴 *Antilink désactivé.*\n\n> *ZERO TRACE BOT v5.0*`,
      }, { msgOptions: { quoted: msg } });
    } else {
      await antiBan.safeSend(sock, jid, { text: '❌ Utilise *.antilink on* ou *.antilink off*' }, { msgOptions: { quoted: msg } });
    }
  },
};
