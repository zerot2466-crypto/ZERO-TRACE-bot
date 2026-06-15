/**
 * ZERO TRACE BOT v5.0 - Antiraid
 * .antiraid on/off → Protéger contre les raids (ajouts massifs)
 */
const gs = require('../lib/groupSettings');

module.exports = {
  name: 'antiraid',
  description: 'Protection contre les raids (ajouts massifs)',
  usage: '.antiraid on | .antiraid off',
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
      const etat = gs.isEnabled('antiraid', jid) ? '🟢 ACTIVÉ' : '🔴 DÉSACTIVÉ';
      await antiBan.safeSend(sock, jid, {
        text: `🛡️ *ANTIRAID* — État: ${etat}\n\nSi +5 membres rejoignent en moins de 30s, le bot verrouille le groupe.\n\n• *.antiraid on* — Activer\n• *.antiraid off* — Désactiver`,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    if (sub === 'on') {
      gs.setEnabled('antiraid', jid, true);
      await antiBan.safeSend(sock, jid, {
        text: `✅ *Antiraid activé !*\nLe groupe sera verrouillé en cas de raid détecté.\n\n> *ZERO TRACE BOT v5.0*`,
      }, { msgOptions: { quoted: msg } });
    } else if (sub === 'off') {
      gs.setEnabled('antiraid', jid, false);
      await antiBan.safeSend(sock, jid, {
        text: `🔴 *Antiraid désactivé.*\n\n> *ZERO TRACE BOT v5.0*`,
      }, { msgOptions: { quoted: msg } });
    } else {
      await antiBan.safeSend(sock, jid, { text: '❌ Utilise *.antiraid on* ou *.antiraid off*' }, { msgOptions: { quoted: msg } });
    }
  },
};
