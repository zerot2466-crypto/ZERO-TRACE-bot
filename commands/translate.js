const zts = require('../lib/ztStyle');
/**
 * ZERO TRACE BOT v5.0 - Commande Translate
 * Traduction via MyMemory API (détection auto de langue source)
 */

const axios = require('axios');

const LANG_MAP = {
  'français': 'fr', 'french': 'fr', 'fr': 'fr',
  'anglais': 'en', 'english': 'en', 'en': 'en',
  'espagnol': 'es', 'spanish': 'es', 'es': 'es',
  'arabe': 'ar', 'arabic': 'ar', 'ar': 'ar',
  'portugais': 'pt', 'portuguese': 'pt', 'pt': 'pt',
  'allemand': 'de', 'german': 'de', 'de': 'de',
  'russe': 'ru', 'russian': 'ru', 'ru': 'ru',
  'chinois': 'zh', 'chinese': 'zh', 'zh': 'zh',
  'japonais': 'ja', 'japanese': 'ja', 'ja': 'ja',
  'italien': 'it', 'italian': 'it', 'it': 'it',
  'turc': 'tr', 'turkish': 'tr', 'tr': 'tr',
  'néerlandais': 'nl', 'dutch': 'nl', 'nl': 'nl',
  'coréen': 'ko', 'korean': 'ko', 'ko': 'ko',
};

// Détecte grossièrement la langue source selon les caractères du texte
function detectSourceLang(text) {
  if (/[\u0600-\u06FF]/.test(text)) return 'ar';
  if (/[\u4E00-\u9FFF]/.test(text)) return 'zh';
  if (/[\u3040-\u30FF]/.test(text)) return 'ja';
  if (/[\uAC00-\uD7AF]/.test(text)) return 'ko';
  if (/[\u0400-\u04FF]/.test(text)) return 'ru';
  // Mots français communs → suppose du français
  if (/\b(le|la|les|de|du|des|un|une|je|tu|il|nous|vous|ils|est|sont|avec|pour|dans|sur|que|qui|pas|plus)\b/i.test(text)) return 'fr';
  // Défaut : anglais
  return 'en';
}

module.exports = {
  name: 'translate',
  description: 'Traduire un texte dans une autre langue',
  usage: '.translate [langue] [texte] | .traduit [langue] [texte]',
  category: 'util',

  async execute(ctx) {
    const { sock, jid, msg, args, antiBan } = ctx;

    if (args.length < 2) {
      await antiBan.safeSend(sock, jid, {
        text: `🌍 *Traducteur ZERO TRACE*\n\n` +
          `Usage: *.translate [langue] [texte]*\n\n` +
          `Langues disponibles :\n` +
          `• français • anglais • espagnol • arabe\n` +
          `• portugais • allemand • russe • japonais\n` +
          `• chinois • italien • coréen • turc\n\n` +
          `Exemples:\n• .translate anglais Bonjour le monde\n• .traduit arabe Je suis ZERO TRACE`,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    const langKey  = args[0].toLowerCase();
    const langCode = LANG_MAP[langKey];

    if (!langCode) {
      await antiBan.safeSend(sock, jid, {
        text: `\`\`\`[ZT-TRANSLATE] Langue inconnue → "${args[0]}"\nEssaie : français, anglais, arabe, espagnol...\`\`\``,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    const text = args.slice(1).join(' ');
    const srcLang = detectSourceLang(text);

    // Si la langue source == cible, on traduit quand même (ex: fr→fr on passe par en)
    const effectiveSrc = srcLang === langCode ? (langCode === 'en' ? 'fr' : 'en') : srcLang;

    await antiBan.safeSend(sock, jid, { text: '🌍 _Traduction en cours..._' }, { msgOptions: { quoted: msg } });

    try {
      const resp = await axios.get('https://api.mymemory.translated.net/get', {
        params: {
          q: text,
          langpair: `${effectiveSrc}|${langCode}`,
          de: 'zerotrace@bot.com', // évite la limite anonyme (1000 mots/jour → 10000/jour avec email)
        },
        timeout: 12000,
      });

      const translated = resp.data?.responseData?.translatedText;
      const status     = resp.data?.responseStatus;

      // MyMemory retourne parfois le texte original si la traduction échoue (status 429 ou autre)
      if (!translated || status === 429) {
        throw new Error(status === 429 ? 'Limite de traduction atteinte (réessaie dans 1h)' : 'Pas de réponse valide');
      }

      // Si MyMemory renvoie le même texte non traduit → signaler
      if (translated.trim().toLowerCase() === text.trim().toLowerCase()) {
        throw new Error('Traduction impossible pour ce texte. Essaie une phrase plus longue.');
      }

      await antiBan.safeSend(sock, jid, {
        text: `🌐 *ZT-TRANSLATE*\n▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰\n` +
          `📥 *Original (${effectiveSrc.toUpperCase()}) :*\n${text}\n\n` +
          `📤 *Traduit en ${args[0]} :*\n${translated}\n\n` +
          `> _ZERO TRACE 😈_`,
      }, { msgOptions: { quoted: msg } });

    } catch (err) {
      await antiBan.safeSend(sock, jid, {
        text: `\`\`\`[ZT-TRANSLATE] ERREUR: ${err.message}\`\`\``,
      }, { msgOptions: { quoted: msg } });
    }
  },
};
