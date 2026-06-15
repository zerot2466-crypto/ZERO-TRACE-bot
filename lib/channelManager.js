/**
 * ZERO TRACE BOT v5.0 — channelManager.js
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Gestion de la chaîne WhatsApp (newsletter) :
 *  - Publication immédiate (texte / image / vidéo)
 *  - Publications programmées (scheduler persistant)
 *  - Stats (abonnés, vues)
 */
'use strict';

const fs   = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '..', 'data', 'channel_scheduler.json');

function _load() {
  try {
    if (!fs.existsSync(DATA_FILE)) return { channelJid: null, posts: [] };
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    const json = JSON.parse(raw);
    if (!Array.isArray(json.posts)) json.posts = [];
    return json;
  } catch (e) {
    return { channelJid: null, posts: [] };
  }
}

function _save(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('[CHANNEL] Erreur sauvegarde:', e.message);
  }
}

function setChannelJid(jid) {
  const data = _load();
  data.channelJid = jid;
  _save(data);
}

function getChannelJid() {
  return _load().channelJid;
}

/**
 * Ajoute une publication programmée.
 * @param {object} post - { type: 'text'|'image'|'video', text, mediaPath, when (ISO ou timestamp ms) }
 * @returns {object} le post créé (avec son id)
 */
function addScheduledPost(post) {
  const data = _load();
  const id = `sp_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  const entry = {
    id,
    type: post.type || 'text',
    text: post.text || '',
    mediaPath: post.mediaPath || null,
    when: post.when,
    sent: false,
    createdAt: Date.now(),
  };
  data.posts.push(entry);
  _save(data);
  return entry;
}

function listScheduledPosts(includeSent = false) {
  const data = _load();
  return includeSent ? data.posts : data.posts.filter(p => !p.sent);
}

function removeScheduledPost(id) {
  const data = _load();
  const before = data.posts.length;
  data.posts = data.posts.filter(p => p.id !== id);
  _save(data);
  return data.posts.length < before;
}

function markPostSent(id) {
  const data = _load();
  const post = data.posts.find(p => p.id === id);
  if (post) {
    post.sent = true;
    post.sentAt = Date.now();
    _save(data);
  }
}

/**
 * Vérifie les publications dues et les envoie via le sock fourni.
 * À appeler périodiquement (ex: setInterval toutes les 60s).
 */
async function processDuePosts(sock) {
  const data = _load();
  const channelJid = data.channelJid;
  if (!channelJid) return;

  const now = Date.now();
  for (const post of data.posts) {
    if (post.sent) continue;
    const when = typeof post.when === 'number' ? post.when : new Date(post.when).getTime();
    if (isNaN(when) || when > now) continue;

    try {
      let content;
      if (post.type === 'image' && post.mediaPath && fs.existsSync(post.mediaPath)) {
        content = { image: fs.readFileSync(post.mediaPath), caption: post.text || '' };
      } else if (post.type === 'video' && post.mediaPath && fs.existsSync(post.mediaPath)) {
        content = { video: fs.readFileSync(post.mediaPath), caption: post.text || '' };
      } else {
        content = { text: post.text || '' };
      }

      await sock.sendMessage(channelJid, content);
      post.sent = true;
      post.sentAt = Date.now();
      console.log(`[CHANNEL] Publication programmée envoyée: ${post.id}`);
    } catch (e) {
      console.error(`[CHANNEL] Erreur envoi publication programmée ${post.id}:`, e.message);
    }
  }
  _save(data);
}

/**
 * Démarre le scheduler (vérification périodique).
 * @param {object} sock - socket Baileys
 * @param {number} intervalMs - intervalle de vérification (par défaut 60s)
 */
function startScheduler(sock, intervalMs = 60 * 1000) {
  if (global._ztChannelSchedulerStarted) return;
  global._ztChannelSchedulerStarted = true;
  setInterval(() => {
    processDuePosts(sock).catch(e => console.error('[CHANNEL] Erreur scheduler:', e.message));
  }, intervalMs);
  console.log('[CHANNEL] Scheduler de publications démarré.');
}

/**
 * Récupère les métadonnées (stats) de la chaîne configurée.
 */
async function getChannelStats(sock) {
  const channelJid = getChannelJid();
  if (!channelJid) return null;
  if (typeof sock.newsletterMetadata !== 'function') return null;

  const meta = await sock.newsletterMetadata('jid', channelJid);
  return meta;
}

module.exports = {
  setChannelJid,
  getChannelJid,
  addScheduledPost,
  listScheduledPosts,
  removeScheduledPost,
  markPostSent,
  processDuePosts,
  startScheduler,
  getChannelStats,
};
