/**
 * ZERO TRACE BOT v3.0 - Commande Settings
 */

const config   = require('../config');
const settings = require('../settings');

module.exports = {
  name: 'settings',
  description: 'Voir les paramètres actuels du bot',
  usage: '.settings | .config',
  category: 'util',

  async execute(ctx) {
    const { sock, jid, msg, antiBan, isOwner } = ctx;

    if (!isOwner) {
      await antiBan.safeSend(sock, jid, {
        text: '❌ Seul le propriétaire peut voir les paramètres.',
      }, { msgOptions: { quoted: msg } });
      return;
    }

    const prefix     = config.getPrefix();
    const sudoUsers  = config.getSudoUsers();
    const cfg        = config.getRuntimeConfig();

    const text =
      `⚙️ *ZERO TRACE SETTINGS*\n\n` +
      `⚡ Préfixe: *${prefix}*\n` +
      `👑 Owner: *${settings.ownerNumber}*\n` +
      `👥 Sudos: *${sudoUsers.length}* utilisateur(s)\n` +
      `📦 Version: *${settings.version}*\n` +
      `📅 Créé le: *${cfg.createdAt ? new Date(cfg.createdAt).toLocaleDateString('fr-FR') : 'N/A'}*\n\n` +
      `🔧 *Commandes admin:*\n` +
      `• ${prefix}setprefix [nouveau] → Changer le préfixe\n` +
      `• ${prefix}sudo add/del/list → Gérer les sudos\n` +
      `• ${prefix}cleartmp → Vider les fichiers temp\n` +
      `• ${prefix}clearsession → Effacer la session`;

    await antiBan.safeSend(sock, jid, { text }, { msgOptions: { quoted: msg } });
  },
};
