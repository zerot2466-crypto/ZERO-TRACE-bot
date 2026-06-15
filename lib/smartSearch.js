/**
 * ZERO TRACE BOT v5.0 - Recherche Web Intelligente
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Sources : DuckDuckGo Instant Answer (gratuit, sans clé)
 *           Wikipedia REST API       (gratuit, sans clé)
 * Objectif: donner à l'IA des infos actuelles sur demande
 */

'use strict';

const axios = require('axios');

// ── Mots-clés qui déclenchent une recherche web ───────────────────────────────
const SEARCH_TRIGGERS = /\b(actualit|récent|maintenant|aujourd'hui|aujourd|prix|météo|match|score|résultat|news|2025|2026|dernier|derniè|nouveau|sortie|vient de|vient de sortir|c'est qui|qui est|c'est quoi|qu'est-ce que|keskon|keski|latest|current|today|now|price|news)\b/i;

// ── Détection si recherche nécessaire ────────────────────────────────────────
function needsSearch(text) {
  return SEARCH_TRIGGERS.test(text);
}

// ── DuckDuckGo Instant Answer API (zéro clé requise) ────────────────────────
async function duckduckgo(query) {
  try {
    const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1&no_redirect=1`;
    const res  = await axios.get(url, { timeout: 6000, headers: { 'User-Agent': 'ZeroTraceBot/5.0' } });
    const data = res.data;

    if (data.AbstractText && data.AbstractText.length > 20) {
      return {
        source: data.AbstractSource || 'DuckDuckGo',
        text:   data.AbstractText.slice(0, 600),
      };
    }
    // Essayer les topics reliés
    if (data.RelatedTopics && data.RelatedTopics.length > 0) {
      const first = data.RelatedTopics.find(t => t.Text && t.Text.length > 20);
      if (first) {
        return { source: 'DuckDuckGo', text: first.Text.slice(0, 400) };
      }
    }
    return null;
  } catch (e) {
    return null;
  }
}

// ── Wikipedia REST API ───────────────────────────────────────────────────────
async function wikipedia(query, lang = 'fr') {
  try {
    // Nettoyer la query pour Wikipedia
    const clean = query
      .replace(/c'est quoi |qu'est-ce que |qui est |c'est qui |keskon |keski /gi, '')
      .replace(/[?!.,]/g, '')
      .trim()
      .slice(0, 100);

    const url = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(clean)}`;
    const res  = await axios.get(url, { timeout: 6000, headers: { 'User-Agent': 'ZeroTraceBot/5.0' } });

    if (res.data?.extract && res.data.extract.length > 20) {
      return {
        source: `Wikipedia (${lang.toUpperCase()})`,
        title:  res.data.title,
        text:   res.data.extract.slice(0, 500),
      };
    }
    return null;
  } catch (e) {
    // Essayer en anglais si pas trouvé en français
    if (lang === 'fr') return wikipedia(query, 'en');
    return null;
  }
}

// ── Recherche combinée (DDG + Wiki en parallèle) ─────────────────────────────
async function search(query) {
  try {
    const [ddg, wiki] = await Promise.allSettled([
      duckduckgo(query),
      wikipedia(query),
    ]);

    const ddgResult  = ddg.status  === 'fulfilled' ? ddg.value  : null;
    const wikiResult = wiki.status === 'fulfilled' ? wiki.value : null;

    // Prioriser Wikipedia (plus fiable) puis DDG
    if (wikiResult) {
      return {
        found:  true,
        source: wikiResult.source,
        text:   wikiResult.text,
      };
    }
    if (ddgResult) {
      return {
        found:  true,
        source: ddgResult.source,
        text:   ddgResult.text,
      };
    }
    return { found: false };
  } catch (e) {
    return { found: false };
  }
}

// ── Recherche avec timeout global de sécurité ────────────────────────────────
async function safeSearch(query, timeoutMs = 7000) {
  return Promise.race([
    search(query),
    new Promise(resolve => setTimeout(() => resolve({ found: false }), timeoutMs)),
  ]);
}

module.exports = { needsSearch, safeSearch, search, duckduckgo, wikipedia };
