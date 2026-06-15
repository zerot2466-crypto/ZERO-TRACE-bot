/**
 * .setwelcome / .setgoodbye — Personnaliser les messages d'accueil/au revoir
 */
const fs   = require('fs-extra');
const path = require('path');
const wFile = path.join(__dirname, '../data/welcome.json');

function load() { try { return fs.readJsonSync(wFile); } catch { return {}; } }
function save(d) { fs.writeJsonSync(wFile, d, { spaces: 2 }); }

module.exports = {
  name: 'setwelcome',
  description: 'Personnaliser le message de bienvenue/au revoir',
  usage: '.setwelcome [message] | .setgoodbye [message]\nVariables : {name} {group}',
  category: 'admin',
  async execute(ctx) {
    const { sock, jid, msg, args, antiBan, command, sender, isOwner, isSudo, isGroupAdmin} = ctx;
    if (!jid.endsWith('@g.us')) {
      await antiBan.safeSend(sock, jid, { text: '❌ Commande de groupe uniquement.' }, { msgOptions: { quoted: msg } });
      return;
    }
    let isAdmin = isOwner || isSudo || isGroupAdmin;
    try {
      const meta = await sock.groupMetadata(jid);
      isAdmin = isAdmin || meta.participants.some(p => p.id === sender && (p.admin === 'admin' || p.admin === 'superadmin'));
    } catch (e) {}
    if (!isAdmin) {
      await antiBan.safeSend(sock, jid, { text: '❌ Seuls les admins peuvent faire ça.' }, { msgOptions: { quoted: msg } });
      return;
    }
    const text = args.join(' ').trim();
    if (!text) {
      await antiBan.safeSend(sock, jid, {
        text: `❌ Donne un message !\nVariables disponibles : {name} {group}\nEx: .setwelcome Bienvenue {name} dans {group} ! 🎉`,
      }, { msgOptions: { quoted: msg } });
      return;
    }
    const data = load();
    if (!data[jid]) data[jid] = {};
    const field = command === 'setwelcome' ? 'customWelcome' : 'customGoodbye';
    data[jid][field] = text;
    save(data);
    const type = command === 'setwelcome' ? 'bienvenue' : 'au revoir';
    await antiBan.safeSend(sock, jid, {
      text: `✅ Message de ${type} mis à jour !\n\nAperçu :\n${text.replace('{name}', 'Exemple').replace('{group}', 'Ce Groupe')}`,
    }, { msgOptions: { quoted: msg } });
  },
};
