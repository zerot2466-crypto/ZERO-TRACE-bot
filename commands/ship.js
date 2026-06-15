/**
 * ZERO TRACE BOT v3.0 - Commande Ship
 * Compatibilité amoureuse entre deux personnes
 */

module.exports = {
  name: 'ship',
  description: 'Calculer la compatibilité entre deux personnes',
  usage: '.ship [@user1] [@user2] | .ship Nom1 Nom2',
  category: 'fun',

  async execute(ctx) {
    const { sock, jid, msg, args, antiBan, pushName, modeType } = ctx;

    // Récupérer les deux noms via mentions ou arguments
    const mentions = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    let name1, name2;

    if (mentions.length >= 2) {
      name1 = mentions[0].split('@')[0];
      name2 = mentions[1].split('@')[0];
    } else if (args.length >= 2) {
      name1 = args[0].replace(/@/g, '');
      name2 = args[1].replace(/@/g, '');
    } else if (mentions.length === 1 && args.length >= 1) {
      name1 = mentions[0].split('@')[0];
      name2 = args.find(a => !a.includes('@')) || pushName;
    } else {
      await antiBan.safeSend(sock, jid, {
        text: `💘 *Commande Ship*\n\n` +
          `Usage:\n• .ship @user1 @user2\n• .ship Nom1 Nom2\n\n` +
          `Exemple: *.ship Alice Bob*`,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    // Calcul déterministe basé sur les noms (reproductible)
    const seed = (name1 + name2).toLowerCase().split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const percent = (seed % 101); // 0-100

    // Construire la barre visuelle
    const filled  = Math.floor(percent / 10);
    const bar     = '❤️'.repeat(filled) + '🖤'.repeat(10 - filled);

    let label, emoji;
    if      (percent >= 90) { label = 'Âmes sœurs absolues !!';      emoji = '💞'; }
    else if (percent >= 75) { label = 'Excellente compatibilité !';   emoji = '💖'; }
    else if (percent >= 60) { label = 'Bonne compatibilité';          emoji = '💕'; }
    else if (percent >= 45) { label = 'Compatibilité moyenne';        emoji = '💗'; }
    else if (percent >= 30) { label = 'Ça peut marcher avec efforts'; emoji = '💔'; }
    else                    { label = 'Incompatibles... pour l\'instant'; emoji = '💀'; }

    const shipName = name1.slice(0, Math.ceil(name1.length / 2)) + name2.slice(Math.floor(name2.length / 2));

    await antiBan.safeSend(sock, jid, {
      text: `${emoji} *SHIP METER* ${emoji}\n\n` +
        `👤 *${name1}*\n` +
        `💘\n` +
        `👤 *${name2}*\n\n` +
        `${bar}\n` +
        `💯 *Compatibilité: ${percent}%*\n\n` +
        `💑 *Ship Name:* _${shipName}_\n` +
        `📊 *Verdict:* ${label}\n\n` +
        `> ⚡ ZERO TRACE SHIP CALCULATOR`,
      mentions,
    }, { msgOptions: { quoted: msg } });
  },
};
