/**
 * ZERO TRACE BOT v5.0 — .resume
 * Résume un texte via IA OpenRouter
 */
'use strict';
const ai = require('../lib/openrouter_ai');

module.exports = {
  name: 'resume',
  description: "Résume un texte ou message cité avec l'IA",
  usage: '.resume [texte] ou répondre à un message avec .resume',
  category: 'ai',
  async execute(ctx) {
    const { sock, jid, msg, args, antiBan, pushName } = ctx;
    const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const texteQuote = quoted?.conversation || quoted?.extendedTextMessage?.text || '';
    const texteArgs  = args.join(' ');
    const texte = texteArgs || texteQuote;

    if (!texte || texte.length < 20) {
      await antiBan.safeSend(sock, jid, { text: '❌ Fournis un texte à résumer (min 20 caractères), ou réponds à un message.' }, { msgOptions: { quoted: msg } });
      return;
    }
    await antiBan.safeSend(sock, jid, { text: '✍️ _Résumé en cours..._' }, { msgOptions: { quoted: msg } });
    try {
      const result = await ai.ask(`Résume ce texte en français de façon claire et concise (max 5 lignes) :\n\n${texte}`, `resume_${jid}`);
      await antiBan.safeSend(sock, jid, {
        text: `📝 *RÉSUMÉ*\n\n${result}\n\n> _ZERO TRACE 😈_`,
      }, { msgOptions: { quoted: msg } });
    } catch (e) {
      await antiBan.safeSend(sock, jid, { text: '❌ Erreur IA. Réessaie.' }, { msgOptions: { quoted: msg } });
    }
  },
};
