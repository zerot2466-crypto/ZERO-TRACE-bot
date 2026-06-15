/**
 * ZERO TRACE BOT v5.0 — Loader de clés
 * Injecte les clés de keys.js dans process.env
 * Appelé UNE SEULE FOIS au tout début de index.js
 */

const keys = require('./keys');

for (const [k, v] of Object.entries(keys)) {
  // On n'écrase pas si déjà défini (ex: variables système injectées par le serveur)
  if (process.env[k] === undefined || process.env[k] === '') {
    process.env[k] = String(v);
  }
}
