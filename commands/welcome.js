/**
 * ZERO TRACE BOT v3.0 - Commande Welcome
 * Activer/désactiver les messages de bienvenue
 */

const fs   = require('fs-extra');
const path = require('path');

const WELCOME_FILE = path.join(__dirname, '..', 'data', 'welcome.json');

function loadWelcome() {
  try { return fs.readJsonSync(WELCOME_FILE); } catch { return {}; }
}
function saveWelcome(data) {
  fs.ensureDirSync(path.dirname(WELCOME_FILE));
  fs.writeJsonSync(WELCOME_FILE, data, { spaces: 2 });
}

module.exports = {
  name: 'welcome',
  description: 'Activer/désactiver les messages de bienvenue',
  usage: '.welcome [on/off] [message personnalisé]',
  category: 'admin',

  async execute(ctx) {
    const { sock, jid, msg, args, antiBan, isGroup, isSudo } = ctx;

    if (!isGroup) {
      await antiBan.safeSend(sock, jid, { text: '❌ Groupes uniquement.' }, { msgOptions: { quoted: msg } });
      return;
    }
    if (!isSudo) {
      await antiBan.safeSend(sock, jid, { text: '❌ Admins/sudos uniquement.' }, { msgOptions: { quoted: msg } });
      return;
    }

    const action = args[0]?.toLowerCase();
    const data   = loadWelcome();

    if (!action) {
      const status = data[jid]?.enabled ? '✅ Activé' : '❌ Désactivé';
      await antiBan.safeSend(sock, jid, {
        text: `👋 *Welcome actuel:* ${status}\n\nUsage:\n• .welcome on\n• .welcome off\n• .welcome on Bienvenue {nom} dans le groupe !`,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    if (action === 'on') {
      const customMsg = args.slice(1).join(' ') || 'Bienvenue *{nom}* dans le groupe ! 🎉';
      data[jid] = { enabled: true, message: customMsg };
      saveWelcome(data);
      await antiBan.safeSend(sock, jid, {
        text: `✅ Messages de bienvenue *activés*!\n\n📝 Message: _${customMsg}_\n\n💡 Utilise *{nom}* pour le nom du nouveau membre.`,
      }, { msgOptions: { quoted: msg } });
    } else if (action === 'off') {
      data[jid] = { enabled: false };
      saveWelcome(data);
      await antiBan.safeSend(sock, jid, {
        text: '❌ Messages de bienvenue *désactivés*.',
      }, { msgOptions: { quoted: msg } });
    }
  },

  // Appelé quand un nouveau membre rejoint le groupe
  async onJoin(sock, jid, newMember, antiBan) {
    const data = loadWelcome();
    if (!data[jid]?.enabled) return;

    try {
      const meta    = await sock.groupMetadata(jid);
      const name    = newMember.split('@')[0];
      const message = (data[jid].message || 'Bienvenue *{nom}* !').replace('{nom}', name).replace('{groupe}', meta.subject);

      await antiBan.safeSend(sock, jid, {
        text: `👋 ${message}`,
        mentions: [newMember],
      });
    } catch (err) {
      console.error('[WELCOME] Erreur:', err.message);
    }
  },
};
