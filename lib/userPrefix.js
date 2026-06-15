/**
 * ZERO TRACE BOT v5.0 — Prefix Personnel par Utilisateur
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Chaque utilisateur pairé peut avoir son propre prefix.
 * Stocké dans data/user_prefix.json — persiste entre redémarrages.
 */

'use strict';

const fs   = require('fs-extra');
const path = require('path');

const STORE_PATH = path.join(__dirname, '../data/user_prefix.json');

// Cache mémoire
let _store = null;

function load() {
  if (_store) return _store;
  try {
    if (fs.existsSync(STORE_PATH)) {
      _store = fs.readJsonSync(STORE_PATH);
    } else {
      _store = {};
      save();
    }
  } catch (e) {
    _store = {};
  }
  return _store;
}

function save() {
  try {
    fs.ensureDirSync(path.dirname(STORE_PATH));
    fs.writeJsonSync(STORE_PATH, _store, { spaces: 2 });
  } catch (e) {
    console.error('[USER_PREFIX] Erreur save:', e.message);
  }
}

// Normaliser le JID → numéro seulement
function norm(jid) {
  return jid.replace(/@.*$/, '').replace(/:[0-9]+$/, '').replace(/[^0-9]/g, '');
}

/**
 * Obtenir le prefix d'un utilisateur.
 * Si pas de prefix perso → retourne le prefix global.
 */
function getPrefix(senderJid, globalPrefix = '.') {
  const store = load();
  const key = norm(senderJid);
  return store[key] || globalPrefix;
}

/**
 * Définir le prefix d'un utilisateur.
 * @returns {string} ancien prefix
 */
function setPrefix(senderJid, newPrefix) {
  const store = load();
  const key = norm(senderJid);
  const old = store[key] || null;
  store[key] = newPrefix;
  save();
  return old;
}

/**
 * Réinitialiser le prefix d'un utilisateur (revenir au global).
 */
function resetPrefix(senderJid) {
  const store = load();
  const key = norm(senderJid);
  delete store[key];
  save();
}

/**
 * Vérifier si un message commence avec le prefix de l'utilisateur
 * OU le prefix global (double compatibilité).
 * Retourne { matched: bool, usedPrefix: string }
 */
function matchesPrefix(body, senderJid, globalPrefix) {
  if (!body) return { matched: false, usedPrefix: null };
  const personal = getPrefix(senderJid, globalPrefix);

  // Tester le prefix personnel en premier
  if (body.startsWith(personal)) return { matched: true, usedPrefix: personal };

  // Si différent du global, tester aussi le global (rétrocompat)
  if (personal !== globalPrefix && body.startsWith(globalPrefix)) {
    return { matched: true, usedPrefix: globalPrefix };
  }

  return { matched: false, usedPrefix: null };
}

/**
 * Liste tous les utilisateurs avec un prefix custom (pour owner).
 */
function listAll(globalPrefix) {
  const store = load();
  return Object.entries(store).map(([num, pfx]) => ({
    number: num,
    prefix: pfx,
    isCustom: pfx !== globalPrefix,
  }));
}

module.exports = { getPrefix, setPrefix, resetPrefix, matchesPrefix, listAll, norm };
