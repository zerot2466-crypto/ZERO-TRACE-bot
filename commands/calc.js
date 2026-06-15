const zts = require('../lib/ztStyle');
/**
 * ZERO TRACE BOT v3.0 - Commande Calc
 */

module.exports = {
  name: 'calc',
  description: 'Calculatrice simple',
  usage: '.calc 2+2 | "zero trace calcule 10*5"',
  category: 'util',

  async execute(ctx) {
    const { sock, jid, msg, args, antiBan, modeType } = ctx;

    // En mode naturel, filtrer les mots inutiles
    let expression = args.join(' ').replace(/calcule|combien fait|résultat de|=|\?/gi, '').trim();

    if (!expression) {
      await antiBan.safeSend(sock, jid, {
        text:
          `\`\`\`[ZT-CALC] Calculatrice système\nUsage    : .calc [expression]\nEx       : .calc 2+2 | .calc 100/4 | .calc 5^3\nFonctions: sqrt(), log(), cos(), sin()\`\`\`\n\n> ${zts.sig()}`,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    // Sécuriser l'expression (autoriser seulement chiffres + opérateurs math)
    const safe = expression.replace(/[^0-9+\-*/().^%\s]/g, '').trim();
    if (!safe) {
      await antiBan.safeSend(sock, jid, {
        text: `\`\`\`[ZT-CALC] ERREUR: Expression invalide\nUtilise des chiffres et opérateurs : + - * / ^ %\`\`\`\n\n> ${zts.sig()}`,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    try {
      // Remplacer ^ par ** pour JS
      const jsExpr = safe.replace(/\^/g, '**');
      // eslint-disable-next-line no-new-func
      const result = Function(`"use strict"; return (${jsExpr})`)();

      if (!isFinite(result)) throw new Error('Résultat infini ou invalide');

      const intro = modeType === 'natural' ? '🧮 Voilà le résultat :\n\n' : '';

      await antiBan.safeSend(sock, jid, {
        text:
          `\`\`\`[ZT-CALC] Résultat\nExpression : ${safe}\nRésultat   : ${result}\`\`\`\n\n> ${zts.sig()}`,
      }, { msgOptions: { quoted: msg } });
    } catch (err) {
      await antiBan.safeSend(sock, jid, {
        text: `❌ Erreur de calcul: ${err.message}\n\nVérifie ton expression.`,
      }, { msgOptions: { quoted: msg } });
    }
  },
};
