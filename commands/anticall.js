/**
 * ZERO TRACE BOT v5.0 - Anticall
 * .anticall on/off → Rejeter automatiquement les appels
 */
const gs = require('../lib/groupSettings');
const settings = require('../settings');

module.exports = {
  name: 'anticall',
  description: 'Rejeter automatiquement les appels entrants',
  usage: '.anticall on | .anticall off',
  category: 'owner',

  async execute(ctx) {
    const { sock, jid, msg, args, antiBan, isOwner } = ctx;

    if (!isOwner) {
      await antiBan.safeSend(sock, jid, { text: '❌ Seul le propriétaire peut gérer anticall.' }, { msgOptions: { quoted: msg } });
      return;
    }

    const sub = (args[0] || '').toLowerCase();
    if (!sub) {
      const etat = gs.isEnabled('anticall', 'global') ? '🟢 ACTIVÉ' : '🔴 DÉSACTIVÉ';
      await antiBan.safeSend(sock, jid, {
        text: `📵 *ANTICALL* — État: ${etat}\n\n• *.anticall on* — Rejeter tous les appels\n• *.anticall off* — Accepter les appels`,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    if (sub === 'on') {
      gs.setEnabled('anticall', 'global', true);
      await antiBan.safeSend(sock, jid, {
        text: `✅ *Anticall activé !*\nTous les appels entrants seront rejetés.\n\n> *ZERO TRACE BOT v5.0*`,
      }, { msgOptions: { quoted: msg } });
    } else if (sub === 'off') {
      gs.setEnabled('anticall', 'global', false);
      await antiBan.safeSend(sock, jid, {
        text: `🔴 *Anticall désactivé.*\n\n> *ZERO TRACE BOT v5.0*`,
      }, { msgOptions: { quoted: msg } });
    } else {
      await antiBan.safeSend(sock, jid, { text: '❌ Utilise *.anticall on* ou *.anticall off*' }, { msgOptions: { quoted: msg } });
    }
  },
};
