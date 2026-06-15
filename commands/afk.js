/**
 * ZERO TRACE BOT v5.0 - AFK (Away From Keyboard)
 * .afk [raison] → Mode absent, le bot prévient quand tu es mentionné
 */
const afkUsers = new Map(); // { jid: { reason, since } }

module.exports = {
  name: 'afk',
  description: 'Mode absent — le bot prévient si tu es mentionné',
  usage: '.afk [raison]',
  category: 'util',

  async execute(ctx) {
    const { sock, jid, msg, args, antiBan, sender } = ctx;

    const reason = args.join(' ') || 'Absent';
    afkUsers.set(sender, { reason, since: Date.now(), jid });

    const num = sender.split('@')[0];
    await antiBan.safeSend(sock, jid, {
      text:
        `😴 *@${num} est maintenant AFK*\n\n` +
        `📝 Raison : *${reason}*\n\n` +
        `Le bot préviendra si tu es mentionné.\nPour revenir, envoie n'importe quel message.`,
      mentions: [sender],
    }, { msgOptions: { quoted: msg } });
  },

  afkUsers,

  // Appelé par le handler pour chaque message
  async checkAFK(sock, jid, msg, body, sender, antiBan) {
    // Si l'expéditeur est AFK → le retirer
    if (afkUsers.has(sender)) {
      const info = afkUsers.get(sender);
      const seconds = Math.floor((Date.now() - info.since) / 1000);
      const time = seconds < 60 ? `${seconds}s` : `${Math.floor(seconds/60)}min`;
      afkUsers.delete(sender);
      await antiBan.safeSend(sock, jid, {
        text: `✅ *@${sender.split('@')[0]} est de retour !*\nAbsent pendant *${time}*.`,
        mentions: [sender],
      }, { msgOptions: { quoted: msg } });
    }

    // Vérifier si un AFK est mentionné
    const mentions = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    for (const mentioned of mentions) {
      if (afkUsers.has(mentioned)) {
        const info = afkUsers.get(mentioned);
        const seconds = Math.floor((Date.now() - info.since) / 1000);
        const time = seconds < 60 ? `${seconds}s` : `${Math.floor(seconds/60)}min`;
        await antiBan.safeSend(sock, jid, {
          text:
            `😴 *@${mentioned.split('@')[0]} est AFK*\n\n` +
            `📝 Raison : *${info.reason}*\n` +
            `⏱️ Absent depuis *${time}*`,
          mentions: [mentioned],
        }, { msgOptions: { quoted: msg } });
      }
    }
  },
};
