/**
 * ZERO TRACE BOT v5.0 — .improve
 * Améliore un texte via IA
 */
'use strict';
const ai = require('../lib/openrouter_ai');

module.exports = {
  name: 'improve',
  description: "Améliore le style et la clarté d'un texte",
  usage: '.improve [texte] | .improve [pro|casual|formal] [texte]',
  category: 'ai',
  async execute(ctx) {
    const { sock, jid, msg, args, antiBan } = ctx;
    const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const texteQuote = quoted?.conversation || quoted?.extendedTextMessage?.text || '';

    const STYLES = ['pro', 'casual', 'formal', 'court', 'détaillé'];
    let style = 'professionnel';
    let texte = args.join(' ') || texteQuote;

    if (STYLES.includes(args[0]?.toLowerCase())) {
      const map = { pro: 'professionnel', casual: 'décontracté', formal: 'formel', court: 'court et concis', détaillé: 'détaillé' };
      style = map[args[0].toLowerCase()];
      texte = args.slice(1).join(' ') || texteQuote;
    }
    if (!texte) {
      await antiBan.safeSend(sock, jid, {
        text: '❌ Fournis un texte.\n\nStyles : *.improve pro* | *.improve casual* | *.improve formal* | *.improve court*',
      }, { msgOptions: { quoted: msg } });
      return;
    }
    await antiBan.safeSend(sock, jid, { text: '✨ _Amélioration en cours..._' }, { msgOptions: { quoted: msg } });
    try {
      const result = await ai.ask(
        `Réécris ce texte en français avec un style *${style}*. Garde le sens original mais améliore la clarté, le style et la fluidité. Retourne uniquement le texte amélioré.\n\nTexte :\n${texte}`,
        `improve_${jid}`
      );
      await antiBan.safeSend(sock, jid, {
        text: `✨ *TEXTE AMÉLIORÉ* _(style ${style})_\n\n${result}\n\n> _ZERO TRACE 😈_`,
      }, { msgOptions: { quoted: msg } });
    } catch {
      await antiBan.safeSend(sock, jid, { text: '❌ Erreur IA. Réessaie.' }, { msgOptions: { quoted: msg } });
    }
  },
};
