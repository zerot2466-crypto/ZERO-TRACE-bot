/**
 * ZERO TRACE BOT v5.0 — .wiki
 * Wikipedia FR + EN avec résumé propre
 */
'use strict';
const zts = require('../lib/ztStyle');
const axios = require('axios');

async function searchWiki(query, lang = 'fr') {
  // Étape 1 : chercher le bon titre de page
  const searchRes = await axios.get(`https://${lang}.wikipedia.org/w/api.php`, {
    params: {
      action:   'query',
      list:     'search',
      srsearch: query,
      format:   'json',
      srlimit:  1,
      origin:   '*',
    },
    timeout: 15000,
    headers: { 'User-Agent': 'ZeroTraceBot/5.0 (WhatsApp Bot)' },
  });

  const hit = searchRes.data?.query?.search?.[0];
  if (!hit) return null;

  // Étape 2 : récupérer le résumé de la page via l'API REST (plus fiable qu'extracts)
  const title = encodeURIComponent(hit.title);
  try {
    const summaryRes = await axios.get(
      `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${title}`,
      {
        timeout: 15000,
        headers: { 'User-Agent': 'ZeroTraceBot/5.0 (WhatsApp Bot)' },
      }
    );
    const d = summaryRes.data;
    return {
      title:   d.title || hit.title,
      extract: d.extract || d.description || 'Aucun résumé disponible.',
      url:     d.content_urls?.mobile?.page || `https://${lang}.wikipedia.org/?curid=${hit.pageid}`,
    };
  } catch (e) {
    // Fallback : API query classique
    const detailRes = await axios.get(`https://${lang}.wikipedia.org/w/api.php`, {
      params: {
        action:      'query',
        prop:        'extracts',
        exintro:     '',
        explaintext: '',
        pageids:     hit.pageid,
        format:      'json',
        origin:      '*',
      },
      timeout: 15000,
      headers: { 'User-Agent': 'ZeroTraceBot/5.0 (WhatsApp Bot)' },
    });
    const page = detailRes.data?.query?.pages?.[hit.pageid];
    return {
      title:   page?.title || hit.title,
      extract: page?.extract || 'Aucun contenu.',
      url:     `https://${lang}.wikipedia.org/?curid=${hit.pageid}`,
    };
  }
}

module.exports = {
  name:        'wiki',
  aliases:     ['wikipedia', 'w'],
  description: 'Rechercher sur Wikipedia',
  usage:       '.wiki [sujet]',
  category:    'info',

  async execute(ctx) {
    const { sock, jid, msg, args, antiBan } = ctx;
    const query = args.join(' ').trim();

    if (!query) {
      await antiBan.safeSend(sock, jid, {
        text: `\`\`\`[ZT-WIKI] Base de connaissances
Usage : .wiki [sujet]
Ex    : .wiki intelligence artificielle\`\`\`

> ${zts.sig()}`,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    try {
      await sock.sendMessage(jid, { react: { text: '🔍', key: msg.key } }).catch(() => {});

      // Essayer FR d'abord, puis EN si pas de résultat
      let result = await searchWiki(query, 'fr');
      if (!result) result = await searchWiki(query, 'en');

      if (!result) {
        await sock.sendMessage(jid, { react: { text: '❌', key: msg.key } }).catch(() => {});
        await antiBan.safeSend(sock, jid, {
          text: `\`\`\`[ZT-WIKI] ERREUR: Aucun résultat pour "${query}"
Conseils : Essaie des mots-clés plus précis\`\`\`

> ${zts.sig()}`,
        }, { msgOptions: { quoted: msg } });
        return;
      }

      // Tronquer proprement à 900 chars sans couper au milieu d'un mot
      let extract = result.extract;
      if (extract.length > 900) {
        extract = extract.slice(0, 900).replace(/\s+\S*$/, '') + '…';
      }

      await sock.sendMessage(jid, { react: { text: '✅', key: msg.key } }).catch(() => {});
      await antiBan.safeSend(sock, jid, {
        text:
          `📖 *ZT-WIKI — ${result.title.toUpperCase()}*
▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰
${extract}

🔗 _${result.url}_

> ${zts.sig()}`,
      }, { msgOptions: { quoted: msg } });

    } catch (e) {
      await sock.sendMessage(jid, { react: { text: '❌', key: msg.key } }).catch(() => {});
      await antiBan.safeSend(sock, jid, {
        text: `\`\`\`[ZT-WIKI] ERREUR: Service indisponible
${e.message}\`\`\`

> ${zts.sig()}`,
      }, { msgOptions: { quoted: msg } });
    }
  },
};
