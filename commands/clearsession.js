/**
 * ZERO TRACE BOT v3.0 - Commande ClearSession
 */

const fs   = require('fs-extra');
const path = require('path');

module.exports = {
  name: 'clearsession',
  description: 'Effacer la session WhatsApp (nécessite un reconnexion)',
  usage: '.clearsession',
  category: 'util',

  async execute(ctx) {
    const { sock, jid, msg, antiBan, isOwner } = ctx;

    if (!isOwner) {
      await antiBan.safeSend(sock, jid, { text: '❌ Owner uniquement.' }, { msgOptions: { quoted: msg } });
      return;
    }

    await antiBan.safeSend(sock, jid, {
      text: '⚠️ *Suppression de la session dans 5 secondes...*\nLe bot devra se reconnecter.',
    }, { msgOptions: { quoted: msg } });

    setTimeout(async () => {
      try {
        await fs.remove(path.join(__dirname, '..', 'session'));
        console.log('[CLEARSESSION] Session supprimée. Redémarrage...');
        process.exit(0);
      } catch (err) {
        console.error('[CLEARSESSION] Erreur:', err.message);
      }
    }, 5000);
  },
};
