/**
 * ZERO TRACE BOT v5.0 - Antibadword
 * .antibadword on/off → Supprimer les gros mots
 */
const gs = require('../lib/groupSettings');

const BAD_WORDS = [
  'putain','merde','connard','salope','enculé','fils de pute','pute','con','bâtard',
  'batard','fdp','ntm','va te faire','nique','fuck','shit','bitch','bastard',
  'asshole','cunt','damn','idiot','imbécile','abruti','crétin'
];

module.exports = {
  name: 'antibadword',
  description: 'Supprimer automatiquement les gros mots',
  usage: '.antibadword on | .antibadword off',
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
      const etat = gs.isEnabled('antibadword', jid) ? '🟢 ACTIVÉ' : '🔴 DÉSACTIVÉ';
      await antiBan.safeSend(sock, jid, {
        text: `🤬 *ANTIBADWORD* — État: ${etat}\n\n• *.antibadword on* — Activer\n• *.antibadword off* — Désactiver`,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    if (sub === 'on') {
      gs.setEnabled('antibadword', jid, true);
      await antiBan.safeSend(sock, jid, {
        text: `✅ *Antibadword activé !*\nLes gros mots seront supprimés.\n\n> *ZERO TRACE BOT v5.0*`,
      }, { msgOptions: { quoted: msg } });
    } else if (sub === 'off') {
      gs.setEnabled('antibadword', jid, false);
      await antiBan.safeSend(sock, jid, {
        text: `🔴 *Antibadword désactivé.*\n\n> *ZERO TRACE BOT v5.0*`,
      }, { msgOptions: { quoted: msg } });
    } else {
      await antiBan.safeSend(sock, jid, { text: '❌ Utilise *.antibadword on* ou *.antibadword off*' }, { msgOptions: { quoted: msg } });
    }
  },

  // Exporté pour le handler
  BAD_WORDS,
};
