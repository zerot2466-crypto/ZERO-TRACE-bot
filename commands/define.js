/**
 * .define — Définition d'un mot via dictionnaire
 */
const axios = require('axios');
module.exports = {
  name: 'define',
  description: 'Définir un mot ou une expression',
  usage: '.define [mot]',
  category: 'info',
  async execute(ctx) {
    const { sock, jid, msg, args, antiBan } = ctx;
    const word = args.join(' ').trim();
    if (!word) {
      await antiBan.safeSend(sock, jid, { text: '📖 Donne-moi un mot !\nEx : .define intelligence' }, { msgOptions: { quoted: msg } });
      return;
    }
    try {
      // Essai dictionnaire anglais (free-dictionary)
      const res = await axios.get(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`, { timeout: 10000 });
      const entry = res.data?.[0];
      if (!entry) throw new Error('Aucune définition');
      const meanings = entry.meanings?.slice(0, 2).map(m => {
        const def = m.definitions?.[0];
        return `[${m.partOfSpeech}] ${def?.definition || ''}\n${def?.example ? `Ex: "${def.example}"` : ''}`;
      }).join('\n\n');
      const phonetic = entry.phonetics?.[0]?.text || '';
      await antiBan.safeSend(sock, jid, {
        text: `📖 *${entry.word}* ${phonetic}\n\n${meanings || 'Aucune définition trouvée.'}`,
      }, { msgOptions: { quoted: msg } });
    } catch (e) {
      // Fallback : utiliser l'IA
      try {
        const { chat } = require('../lib/openrouter_ai');
        const result = await chat(`define_${jid}`, `Donne-moi la définition courte du mot "${word}" en français. Format : [catégorie grammaticale] définition.`);
        await antiBan.safeSend(sock, jid, {
          text: `📖 *Définition de "${word}"*\n\n${result.content}`,
        }, { msgOptions: { quoted: msg } });
      } catch (e2) {
        await antiBan.safeSend(sock, jid, { text: `❌ Définition introuvable pour "${word}"` }, { msgOptions: { quoted: msg } });
      }
    }
  },
};
