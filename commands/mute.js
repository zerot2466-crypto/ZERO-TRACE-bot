/**
 * ZERO TRACE BOT v3.0 - Commande Mute
 * Activer/désactiver le mode silencieux du groupe
 */

module.exports = {
  name: 'mute',
  description: 'Mettre le groupe en lecture seule (admins seulement)',
  usage: '.mute [on/off]',
  category: 'admin',

  async execute(ctx) {
    const { sock, jid, msg, args, antiBan, isGroup, isOwner, isSudo, isGroupAdmin } = ctx;

    if (!isGroup) {
      await antiBan.safeSend(sock, jid, { text: '❌ Groupes uniquement.' }, { msgOptions: { quoted: msg } });
      return;
    }
    if (!isOwner && !isSudo && !isGroupAdmin) {
      await antiBan.safeSend(sock, jid, { text: '❌ Réservé aux admins du groupe, sudos et owner.' }, { msgOptions: { quoted: msg } });
      return;
    }

    const action = args[0]?.toLowerCase();
    if (!action || !['on', 'off'].includes(action)) {
      await antiBan.safeSend(sock, jid, {
        text: '🔇 Usage: *.mute on* | *.mute off*',
      }, { msgOptions: { quoted: msg } });
      return;
    }

    try {
      await sock.groupSettingUpdate(jid, action === 'on' ? 'announcement' : 'not_announcement');
      await antiBan.safeSend(sock, jid, {
        text: action === 'on'
          ? '🔇 *Groupe mis en silence.* Seuls les admins peuvent envoyer des messages.'
          : '🔊 *Groupe déverrouillé.* Tout le monde peut parler.',
      }, { msgOptions: { quoted: msg } });
    } catch (err) {
      await antiBan.safeSend(sock, jid, {
        text: `❌ Erreur: ${err.message}\n\n💡 Le bot doit être administrateur.`,
      }, { msgOptions: { quoted: msg } });
    }
  },
};
