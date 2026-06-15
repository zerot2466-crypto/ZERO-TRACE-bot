const zts = require('../lib/ztStyle');
/**
 * ZERO TRACE BOT v3.0 - Commande ClearTmp
 */

const fs   = require('fs-extra');
const path = require('path');

module.exports = {
  name: 'cleartmp',
  description: 'Vider le dossier tmp',
  usage: '.cleartmp',
  category: 'util',

  async execute(ctx) {
    const { sock, jid, msg, antiBan, isOwner } = ctx;

    if (!isOwner) {
      await antiBan.safeSend(sock, jid, { text: zts.randErr(zts.OWNER_ERRORS) }, { msgOptions: { quoted: msg } });
      return;
    }

    const tmpDir = path.join(__dirname, '..', 'tmp');
    try {
      const files = fs.readdirSync(tmpDir).filter(f => f !== '.gitkeep');
      for (const f of files) fs.removeSync(path.join(tmpDir, f));
      await antiBan.safeSend(sock, jid, {
        text: `🧹 *Dossier tmp vidé !*\n${files.length} fichier(s) supprimé(s).`,
      }, { msgOptions: { quoted: msg } });
    } catch (err) {
      await antiBan.safeSend(sock, jid, { text: `❌ Erreur: ${err.message}` }, { msgOptions: { quoted: msg } });
    }
  },
};
