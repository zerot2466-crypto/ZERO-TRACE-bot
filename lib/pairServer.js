/**
 * ZERO TRACE BOT v5.0 — Serveur API Pairing
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Expose une API REST + page HTML pour la connexion WhatsApp.
 *
 * Sur KataBump (pas de port public exposé) :
 *   → Lance automatiquement un tunnel localtunnel
 *   → Affiche l'URL publique dans les logs
 *   → Met à jour PAIR_HOST dans le process pour que le bot la connaisse
 *
 * Routes :
 *   GET /          → page HTML de connexion
 *   GET /health    → statut du bot
 *   GET /pair?number=XXXXXXXX → génère un code pair
 */

'use strict';

const express = require('express');
const path    = require('path');
const chalk   = require('chalk');

const COOLDOWN_MS = 70 * 1000;
const cooldowns   = new Map();

let _sock      = null;
let _server    = null;
let _publicUrl = null;

// ── Tunnel localtunnel (pour KataBump et hébergeurs sans port public) ─────────
async function startTunnel(port) {
  try {
    const localtunnel = require('localtunnel');
    const tunnel = await localtunnel({ port });
    _publicUrl = tunnel.url;

    console.log(chalk.green.bold('\n┌─────────────────────────────────────────────┐'));
    console.log(chalk.green.bold('│        🌐 TUNNEL PUBLIC ACTIF               │'));
    console.log(chalk.green.bold(`│  ${_publicUrl.padEnd(43)}│`));
    console.log(chalk.green.bold('│  → Copie cette URL dans PAIR_HOST de keys.js│'));
    console.log(chalk.green.bold('└─────────────────────────────────────────────┘\n'));

    // Mise à jour dynamique pour que le bot connaisse son URL publique
    process.env.PAIR_HOST = _publicUrl;

    tunnel.on('close', () => {
      console.log(chalk.yellow('[TUNNEL] Tunnel fermé — redémarrage dans 5s...'));
      setTimeout(() => startTunnel(port), 5000);
    });

    tunnel.on('error', (err) => {
      console.error(chalk.red('[TUNNEL] Erreur:', err.message, '— redémarrage dans 10s...'));
      setTimeout(() => startTunnel(port), 10000);
    });

    return _publicUrl;
  } catch (e) {
    console.error(chalk.red('[TUNNEL] localtunnel indisponible:', e.message));
    console.log(chalk.yellow('[TUNNEL] Remplis PAIR_HOST manuellement dans keys.js'));
    return null;
  }
}

// ── Démarrage du serveur ──────────────────────────────────────────────────────
function startPairServer(sock, port = 3000, origin = '*') {
  _sock = sock;

  const app = express();
  app.use(express.json());

  // ── CORS — accepte Netlify + tunnel localtunnel ───────────────────────────
  app.use((req, res, next) => {
    // On accepte toujours le tunnel + l'origine Netlify configurée
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    next();
  });

  // ── Page HTML ─────────────────────────────────────────────────────────────
  const HTML_FILE = path.join(__dirname, '../assets/pair.html');
  app.get('/', (req, res) => res.sendFile(HTML_FILE));

  // ── Santé ─────────────────────────────────────────────────────────────────
  app.get('/health', (req, res) => {
    res.json({
      status:     'ok',
      bot:        'ZERO TRACE v5.0',
      connected:  !!_sock,
      public_url: _publicUrl || process.env.PAIR_HOST || null,
    });
  });

  // ── Génération du code pair ───────────────────────────────────────────────
  app.get('/pair', async (req, res) => {
    const raw = (req.query.number || '').replace(/[^0-9]/g, '').trim();

    if (!raw || raw.length < 6 || raw.length > 20) {
      return res.status(400).json({
        success: false,
        error: 'Numéro invalide. Format : indicatif pays + numéro (ex: 26095696285)',
      });
    }

    if (!_sock) {
      return res.status(503).json({
        success: false,
        error: 'Bot non connecté. Réessaie dans quelques secondes.',
      });
    }

    // Rate-limit
    const now  = Date.now();
    const last = cooldowns.get(raw);
    if (last) {
      const remaining = Math.ceil((last + COOLDOWN_MS - now) / 1000);
      if (remaining > 0) {
        return res.status(429).json({
          success:  false,
          error:    `Code déjà demandé. Réessaie dans ${remaining} secondes.`,
          retry_in: remaining,
        });
      }
    }
    cooldowns.set(raw, now);

    try {
      let code = null;
      try { code = await _sock.requestPairingCode(raw, 'ZTRACE01'); }
      catch { code = await _sock.requestPairingCode(raw); }

      if (!code) throw new Error('Code non reçu');

      const formatted = String(code)
        .replace(/[^A-Z0-9]/gi, '')
        .match(/.{1,4}/g)?.join('-') || String(code);

      console.log(chalk.green(`[PAIR API] ✅ Code généré pour +${raw}: ${formatted}`));
      return res.json({ success: true, code: formatted });

    } catch (err) {
      cooldowns.delete(raw);
      let message = 'Erreur lors de la génération du code.';
      const msg = err.message || '';
      if (msg.includes('already registered') || msg.includes('already linked'))
        message = 'Ce numéro est déjà lié au bot.';
      else if (msg.includes('401') || msg.includes('not-authorized'))
        message = 'Session bot expirée. Contacte l\'owner.';
      else if (msg.includes('429') || msg.includes('rate-overlimit'))
        message = 'Trop de demandes WhatsApp. Attends quelques minutes.';
      else if (msg.includes('timeout'))
        message = 'Délai dépassé. Réessaie.';
      else if (msg.includes('not on whatsapp') || msg.includes('not-on-whatsapp'))
        message = 'Ce numéro n\'est pas enregistré sur WhatsApp.';

      console.error(chalk.red(`[PAIR API] ❌ Erreur pour +${raw}:`, msg));
      return res.status(500).json({ success: false, error: message });
    }
  });

  // ── Écoute + lancement du tunnel ─────────────────────────────────────────
  _server = app.listen(port, async () => {
    console.log(chalk.green(`[PAIR SERVER] ✅ Serveur démarré sur le port ${port}`));

    const pairHost = process.env.PAIR_HOST || '';

    if (!pairHost) {
      // Pas d'URL configurée → lancer le tunnel automatiquement
      console.log(chalk.yellow('[PAIR SERVER] PAIR_HOST vide → lancement du tunnel localtunnel...'));
      await startTunnel(port);
    } else {
      _publicUrl = pairHost;
      console.log(chalk.cyan(`[PAIR SERVER] 🌐 URL publique : ${pairHost}`));
    }

    console.log(chalk.cyan(`[PAIR SERVER] 🔑 API pair    : /pair?number=XXXXXXXX`));
  });

  _server.on('error', (e) => {
    if (e.code === 'EADDRINUSE') {
      console.error(chalk.red(`[PAIR SERVER] Port ${port} déjà utilisé — change PAIR_PORT dans keys.js`));
    } else {
      console.error(chalk.red('[PAIR SERVER] Erreur:', e.message));
    }
  });

  return _server;
}

function updateSock(sock) {
  _sock = sock;
}

module.exports = { startPairServer, updateSock };
