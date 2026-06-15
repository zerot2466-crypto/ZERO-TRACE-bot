/**
 * ZERO TRACE BOT v5.0 - Supremacy Module
 * ─────────────────────────────────────────
 * ✅ Envoie une image aléatoire (rotation) après chaque commande
 * ✅ + Citation texte discrète
 */

'use strict';

const fs       = require('fs');
const path     = require('path');
const settings = require('../settings');

const QUOTES = [
  '🖤 "Le silence est ma marque." — ZT',
  '💀 "Ceux qui cherchent ma trace ne trouvent que l\'ombre." — ZT',
  '🔓 "Chaque système a une faille." — ZERO TRACE',
  '⚡ "L\'information est un pouvoir." — ZT',
  '🕶️ "Nous sommes tous connectés." — Anonymous',
  '🌐 "Le réseau est vaste et infini." — Ghost in the Shell',
  '💻 "Il n\'y a pas de patch pour la stupidité humaine." — K. Mitnick',
  '🔥 "Nous sommes les architectes du futur." — ZT',
  '🛡️ "La sécurité n\'est pas un produit. C\'est un processus." — B. Schneier',
  '👁️ "La vie privée est un droit fondamental." — ZT',
  '⚔️ "Explorer, c\'est comprendre." — ZERO TRACE',
  '🎯 "La meilleure défense, c\'est l\'attaque." — Sun Tzu',
  '🌑 "Dans l\'ombre, on trouve la vérité." — ZT',
  '🔑 "La connaissance est libre." — Anonymous',
  '💎 "Le code est de la poésie." — ZT',
  '🧠 "Pense comme un hacker. Agis comme un fantôme." — ZT',
  '🌀 "Derrière chaque pare-feu, une histoire à révéler." — ZT',
  '🚀 "La précision bat la rapidité." — ZERO TRACE',
  '🎭 "On ne règne pas par la force. Par l\'invisible." — ZT',
  '🔮 "Je ne laisse pas de trace. Je laisse des résultats." — ZT',
];

function getRandomQuote() {
  return QUOTES[Math.floor(Math.random() * QUOTES.length)];
}

// ── Chargement des images (mes_images + menu) ────────────────────────────────
let _imagePool = null;

function loadImagePool() {
  if (_imagePool) return _imagePool;

  const dirs = [
    path.join(__dirname, '..', 'assets', 'mes_images'),
    path.join(__dirname, '..', 'assets', 'menu'),
    path.join(__dirname, '..', 'assets', 'supremacy'),
  ];

  const images = [];
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) continue;
    const files = fs.readdirSync(dir).filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f));
    for (const f of files) {
      images.push(path.join(dir, f));
    }
  }

  _imagePool = images;
  return _imagePool;
}

// Index courant pour la rotation séquentielle
let _imgIndex = Math.floor(Math.random() * 1000); // démarrer aléatoirement

function getNextImage() {
  const pool = loadImagePool();
  if (!pool.length) return null;
  _imgIndex = (_imgIndex + 1) % pool.length;
  return pool[_imgIndex];
}

// Commandes qui n'ont PAS de supremacy (trop fréquentes ou silencieuses)
const NO_SUPREMACY = [
  'ping', 'alive', 'uptime', 'settings', 'config', 'setprefix',
  'menu', 'help', 'chatbot', 'agent', 'private', 'sudo',
  'antidelete', 'antilink', 'antibadword', 'antiraid', 'anticall',
  'welcome', 'setwelcome', 'setgoodbye', 'mute', 'afk',
  'cleartmp', 'clearsession', 'restart', 'broadcast', 'grouplist',
  'block', 'unblock', 'clonevoix', 'remindme', 'rappel',
  'warn', 'resetwarn', 'kick', 'ban', 'promote', 'demote',
  'link', 'revoke', 'poll', 'tagall', 'tag',
];

async function sendSupremacy(sock, jid, commandName, antiBan, category = null) {
  // Images désactivées après les commandes — elles s'affichent uniquement au niveau des catégories (.menu)
  return;
}

module.exports = { sendSupremacy, getRandomQuote, QUOTES };
