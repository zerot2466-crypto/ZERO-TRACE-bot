/**
 * ZERO TRACE BOT v5.0 — .correct
 * Corrige les fautes d'un texte via IA
 */
'use strict';
const ai = require('../lib/openrouter_ai');

module.exports = {
  name: 'correct',
  description: "Corrige les fautes d'orthographe/grammaire d'un texte",
  usage: '.correct [texte] ou répondre à un message',
  category: 'ai',
  async execute(ctx) {
    const { sock, jid, msg, args, antiBan } = ctx;
    const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const texteQuote = quoted?.conversation || quoted?.extendedTextMessage?.text || '';
    const texte = args.join(' ') || texteQuote;

    if (!texte) {
      await antiBan.safeSend(sock, jid, { text: '❌ Fournis un texte, ou réponds à un message avec .correct' }, { msgOptions: { quoted: msg } });
      return;
    }
    await antiBan.safeSend(sock, jid, { text: '🔍 _Correction en cours..._' }, { msgOptions: { quoted: msg } });
    try {
      const result = await ai.ask(
        `Corrige UNIQUEMENT les fautes d'orthographe et de grammaire du texte suivant. Retourne d'abord le texte corrigé, puis liste les corrections effectuées en bullet points. Texte :\n\n${texte}`,
        `correct_${jid}`
      );
      await antiBan.safeSend(sock, jid, {
        text: `✅ *CORRECTION*\n\n${result}\n\n> _ZERO TRACE 😈_`,
      }, { msgOptions: { quoted: msg } });
    } catch {
      await antiBan.safeSend(sock, jid, { text: '❌ Erreur IA. Réessaie.' }, { msgOptions: { quoted: msg } });
    }
  },
};
