/**
 * ZERO TRACE BOT v5.0 - Commande Private (CORRIGÉE)
 *
 * LOGIQUE MODE PRIVÉ :
 *   - .private on  → Seuls l'owner ET les sudos peuvent interagir avec le bot
 *                    (partout : DM et groupes)
 *   - .private off → Tout le monde peut utiliser le bot (mode normal)
 *
 * L'owner reste capable de tout faire en groupe même en mode privé.
 * Les étrangers sont complètement ignorés (ni commandes, ni chatbot, ni agent).
 */

const config = require('../config');

module.exports = {
  name: 'private',
  description: 'Activer/désactiver le mode privé du bot',
  usage: '.private on | .private off | .private status',
  category: 'owner',

  async execute(ctx) {
    const { sock, jid, msg, args, antiBan, isOwner } = ctx;

    if (!isOwner) {
      await antiBan.safeSend(sock, jid, {
        text: '❌ Seul le propriétaire du bot peut changer le mode privé.',
      }, { msgOptions: { quoted: msg } });
      return;
    }

    const sub = (args[0] || '').toLowerCase();

    // Afficher le statut actuel
    if (!sub || sub === 'status') {
      const etat      = config.isPrivateMode() ? '🔒 PRIVÉ' : '🌐 PUBLIC';
      const sudoCount = config.getSudoUsers().length;
      await antiBan.safeSend(sock, jid, {
        text:
          `🔒 *MODE PRIVÉ — ZERO TRACE*\n\n` +
          `État actuel : *${etat}*\n` +
          `Sudos autorisés : *${sudoCount}*\n\n` +
          `*Commandes :*\n` +
          `• *.private on* — Mode privé\n` +
          `  └ Seuls toi + sudos peuvent utiliser le bot\n` +
          `  └ Fonctionne en DM ET dans les groupes\n` +
          `• *.private off* — Mode public\n` +
          `  └ Tout le monde peut utiliser le bot\n\n` +
          `💡 Ajoute des sudos avec *.sudo add @user*\n\n` +
          `> *ZERO TRACE BOT v5.0*`,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    if (sub === 'on') {
      if (config.isPrivateMode()) {
        await antiBan.safeSend(sock, jid, {
          text: '⚠️ Le bot est déjà en *mode privé*.',
        }, { msgOptions: { quoted: msg } });
        return;
      }
      config.setPrivateMode(true);
      await antiBan.safeSend(sock, jid, {
        text:
          `🔒 *Mode Privé activé !*\n\n` +
          `✅ *Qui peut utiliser le bot :*\n` +
          `• Toi (owner)\n` +
          `• Tes sudos (.sudo list)\n\n` +
          `❌ *Bloqués partout (DM et groupes) :*\n` +
          `• Tout autre utilisateur\n\n` +
          `📌 Tu peux continuer à utiliser toutes les commandes\n` +
          `dans tes groupes normalement.\n\n` +
          `> *ZERO TRACE BOT v5.0*`,
      }, { msgOptions: { quoted: msg } });

    } else if (sub === 'off') {
      if (!config.isPrivateMode()) {
        await antiBan.safeSend(sock, jid, {
          text: '⚠️ Le bot est déjà en *mode public*.',
        }, { msgOptions: { quoted: msg } });
        return;
      }
      config.setPrivateMode(false);
      await antiBan.safeSend(sock, jid, {
        text:
          `🌐 *Mode Public activé !*\n\n` +
          `Le bot répond maintenant à tout le monde\n` +
          `dans tous les chats.\n\n` +
          `> *ZERO TRACE BOT v5.0*`,
      }, { msgOptions: { quoted: msg } });

    } else {
      await antiBan.safeSend(sock, jid, {
        text: `❌ Argument invalide.\nUtilise *.private on*, *.private off* ou *.private status*`,
      }, { msgOptions: { quoted: msg } });
    }
  },
};
