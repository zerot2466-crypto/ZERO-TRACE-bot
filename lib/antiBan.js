/**
 * ZERO TRACE BOT v5.0 — Anti-Ban Module (v2 RENFORCÉ)
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Protection proactive contre le ban WhatsApp.
 *
 * PROTECTIONS ACTIVES :
 *  1. Rate-limit par chat ET global (fenêtre glissante)
 *  2. Délais humains aléatoires entre chaque envoi
 *  3. Simulation de frappe (typing) réaliste
 *  4. Présence "online" périodique (évite le fantôme)
 *  5. Rotation automatique du statut
 *  6. Anti-spam par sender (circuit-breaker)
 *  7. Retry intelligent avec backoff exponentiel
 *  8. Détection erreurs WA critiques (429, stream error)
 *     → réduction automatique des délais de sécurité
 *  9. Mode stress : si le bot détecte trop d'erreurs,
 *     il passe en mode "slow" pendant 5 minutes
 * 10. Ne bloque JAMAIS les messages de l'owner
 */

'use strict';

const NodeCache = require('node-cache');
const chalk     = require('chalk');

// ── Constantes de sécurité WhatsApp ──────────────────────────────────────────
const WA_LIMITS = {
  MSG_PER_MIN_GROUP:   10,   // max messages/min vers un groupe
  MSG_PER_MIN_DM:      20,   // max messages/min vers un DM
  MSG_PER_MIN_GLOBAL:  30,   // max messages/min toutes destinations
  BULK_PAUSE_MS:     2000,   // pause obligatoire entre envois en masse
  MIN_DELAY_MS:       200,   // délai minimum entre 2 envois (ms) — réduit pour réactivité IA
  MAX_DELAY_MS:       800,   // délai maximum entre 2 envois (ms) — réduit pour réactivité IA
  TYPING_MIN_MS:      300,   // durée min de simulation frappe — réduit
  TYPING_MAX_MS:      800,   // durée max de simulation frappe — réduit
  PRESENCE_INTERVAL: 4 * 60 * 1000,  // présence "online" toutes les 4 min
  STATUS_INTERVAL:  30 * 60 * 1000,  // rotation statut toutes les 30 min
  STRESS_THRESHOLD:     5,   // nb erreurs avant mode stress
  STRESS_DURATION:  5 * 60 * 1000,   // durée mode stress (5 min)
  STRESS_MULTIPLIER:    2,   // multiplicateur délai en mode stress (réduit de 3 à 2)
};

const STATUSES = [
  '⚡ ZERO TRACE — En ligne',
  '🤖 ZERO TRACE BOT — Opérationnel',
  '🔐 ZERO TRACE — Actif 24/7',
  '⚙️  Bot en service — ZERO TRACE',
];

class AntiBan {
  constructor() {
    // Compteurs fenêtre glissante (TTL = 60s)
    this.msgCounterChat   = new NodeCache({ stdTTL: 60,  checkperiod: 10 });
    this.msgCounterGlobal = new NodeCache({ stdTTL: 60,  checkperiod: 10 });

    // Cooldown par chat pour éviter les rafales
    this.cooldownCache = new NodeCache({ stdTTL: 3, checkperiod: 1 });

    // Spam par sender (TTL = 30s)
    this.spamCache = new NodeCache({ stdTTL: 30, checkperiod: 5 });

    // Circuit-breaker erreurs
    this.errorCount   = 0;
    this.stressMode   = false;
    this.stressUntil  = 0;

    // Référence sock pour les tâches de fond
    this._sock        = null;
    this._presenceInterval = null;
    this._statusInterval   = null;
    this._statusIndex      = 0;

    // Config depuis .env
    this.maxPerMin   = parseInt(process.env.MAX_MESSAGES_PER_MINUTE) || WA_LIMITS.MSG_PER_MIN_GLOBAL;
    this.cooldownMs  = parseInt(process.env.COOLDOWN_MS) || WA_LIMITS.MIN_DELAY_MS;
    this.maxRetries  = 3;
  }

  // ── Initialisation (appelé dès que sock est disponible) ───────────────────
  init(sock) {
    this._sock = sock;
    this._startPresenceLoop();
    this._startStatusRotation();
    console.log(chalk.green('[ANTIBAN] ✅ Protection active — présence + rotation statut démarrées'));
  }

  // ── Mise à jour sock après reconnexion ────────────────────────────────────
  updateSock(sock) {
    this._sock = sock;
    // Redémarrer les boucles avec le nouveau sock
    this._stopLoops();
    this._startPresenceLoop();
    this._startStatusRotation();
    console.log(chalk.cyan('[ANTIBAN] Sock mis à jour après reconnexion'));
  }

  _stopLoops() {
    if (this._presenceInterval) clearInterval(this._presenceInterval);
    if (this._statusInterval)   clearInterval(this._statusInterval);
  }

  // ── PRÉSENCE AUTOMATIQUE ──────────────────────────────────────────────────
  // Envoie "available" périodiquement pour éviter que WA considère le compte inactif
  _startPresenceLoop() {
    this._presenceInterval = setInterval(async () => {
      if (!this._sock) return;
      try {
        await this._sock.sendPresenceUpdate('available');
      } catch (e) { /* silence — peut échouer si déconnecté */ }
    }, WA_LIMITS.PRESENCE_INTERVAL);
  }

  // ── ROTATION DU STATUT ────────────────────────────────────────────────────
  // Change le statut "À propos" régulièrement (signe d'un compte actif)
  _startStatusRotation() {
    this._statusInterval = setInterval(async () => {
      if (!this._sock) return;
      try {
        const status = STATUSES[this._statusIndex % STATUSES.length];
        await this._sock.updateProfileStatus(status);
        this._statusIndex++;
      } catch (e) { /* silence */ }
    }, WA_LIMITS.STATUS_INTERVAL);
  }

  // ── MODE STRESS ───────────────────────────────────────────────────────────
  _checkStress() {
    return this.stressMode && Date.now() < this.stressUntil;
  }

  _recordError() {
    this.errorCount++;
    if (this.errorCount >= WA_LIMITS.STRESS_THRESHOLD && !this.stressMode) {
      this.stressMode  = true;
      this.stressUntil = Date.now() + WA_LIMITS.STRESS_DURATION;
      console.log(chalk.red.bold('[ANTIBAN] ⚠️  MODE STRESS ACTIVÉ — délais augmentés pendant 5 min'));
      setTimeout(() => {
        this.stressMode  = false;
        this.errorCount  = 0;
        console.log(chalk.green('[ANTIBAN] Mode stress terminé — retour à la normale'));
      }, WA_LIMITS.STRESS_DURATION);
    }
  }

  _recordSuccess() {
    if (this.errorCount > 0) this.errorCount = Math.max(0, this.errorCount - 1);
  }

  // ── DÉLAIS HUMAINS ────────────────────────────────────────────────────────
  getRandomDelay() {
    const multiplier = this._checkStress() ? WA_LIMITS.STRESS_MULTIPLIER : 1;
    const min = WA_LIMITS.MIN_DELAY_MS * multiplier;
    const max = WA_LIMITS.MAX_DELAY_MS * multiplier;
    return Math.floor(Math.random() * (max - min)) + min;
  }

  async randomDelay() {
    return new Promise(r => setTimeout(r, this.getRandomDelay()));
  }

  // ── SIMULATION FRAPPE ─────────────────────────────────────────────────────
  async simulateTyping(sock, jid, duration = null) {
    try {
      await sock.presenceSubscribe(jid);
      await sock.sendPresenceUpdate('composing', jid);
      const base = duration || (Math.random() * (WA_LIMITS.TYPING_MAX_MS - WA_LIMITS.TYPING_MIN_MS) + WA_LIMITS.TYPING_MIN_MS);
      const d = this._checkStress() ? base * 1.5 : base;
      await new Promise(r => setTimeout(r, d));
      await sock.sendPresenceUpdate('paused', jid);
    } catch (e) { /* silence */ }
  }

  // ── RATE LIMIT ────────────────────────────────────────────────────────────
  isOnCooldown(jid) { return this.cooldownCache.has(jid); }
  setCooldown(jid)  {
    const ms = this._checkStress() ? this.cooldownMs * 2 : this.cooldownMs;
    this.cooldownCache.set(jid, true, Math.ceil(ms / 1000));
  }

  _getCount(key) { return this.msgCounterChat.get(key) || 0; }
  _incCount(key) {
    const c = this._getCount(key) + 1;
    this.msgCounterChat.set(key, c);
    return c;
  }

  _getGlobal() { return this.msgCounterGlobal.get('global') || 0; }
  _incGlobal()  {
    const c = this._getGlobal() + 1;
    this.msgCounterGlobal.set('global', c);
    return c;
  }

  // shouldProcess retourne false si le sender spam trop
  shouldProcess(jid, sender, isOwner = false) {
    if (isOwner) return true; // L'owner n'est JAMAIS bloqué

    // Anti-spam par sender
    const spamKey   = `spam_${sender}`;
    const spamCount = this.spamCache.get(spamKey) || 0;
    if (spamCount > 12) return false;
    this.spamCache.set(spamKey, spamCount + 1);

    // Rate limit par chat
    const isGroup = jid.endsWith('@g.us');
    const limit   = isGroup ? WA_LIMITS.MSG_PER_MIN_GROUP : WA_LIMITS.MSG_PER_MIN_DM;
    const chatCnt = this._incCount(`chat_${jid}`);
    if (chatCnt > limit) return false;

    // Rate limit global
    const globalCnt = this._incGlobal();
    if (globalCnt > this.maxPerMin) return false;

    return true;
  }

  // ── ENVOI SÉCURISÉ (cœur de l'antiban) ───────────────────────────────────
  /**
   * Remplace sock.sendMessage — ajoute délai humain, typing, retry, rate-limit
   * @param {object} sock
   * @param {string} jid
   * @param {object} content
   * @param {object} options  { typing, msgOptions, skipDelay, isOwner }
   */
  async safeSend(sock, jid, content, options = {}) {
    const { typing = false, msgOptions = {}, skipDelay = false, isOwner = false } = options;

    // Délai humain uniquement pour les non-owners et si pas skipDelay
    if (!skipDelay && !isOwner) await this.randomDelay();

    // Simulation de frappe — désactivée par défaut pour réactivité
    if (typing) await this.simulateTyping(sock, jid);

    // Retry avec backoff exponentiel
    let lastErr;
    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        const result = await sock.sendMessage(jid, content, msgOptions);
        this.setCooldown(jid);
        this._recordSuccess();
        return result;
      } catch (err) {
        lastErr = err;
        const msg = err?.message || '';

        // Erreur 429 (rate-limit WA) ou stream error → mode stress immédiat
        if (msg.includes('429') || msg.includes('rate') || msg.includes('stream') || msg.includes('Connection Closed')) {
          this._recordError();
          console.log(chalk.yellow(`[ANTIBAN] ⚠️  Erreur WA détectée (${msg.slice(0,40)}) — pause de sécurité`));
          await new Promise(r => setTimeout(r, 5000 * (attempt + 1)));
        } else if (attempt < this.maxRetries - 1) {
          await new Promise(r => setTimeout(r, 2000 * (attempt + 1)));
        }
      }
    }
    // Après tous les retries : enregistrer l'erreur
    this._recordError();
    throw lastErr;
  }
  /**
   * Envoyer un message audio (vocal PTT ou fichier audio)
   * Usage : await antiBan.sendAudio(sock, jid, buffer, { ptt: true, quoted: msg })
   * @param {object} sock
   * @param {string} jid
   * @param {Buffer|object} buffer  — Buffer audio ou { url: '...' }
   * @param {object} options        — { ptt, mimetype, fileName, quoted, skipDelay }
   */
  async sendAudio(sock, jid, buffer, options = {}) {
    const {
      ptt       = true,
      mimetype  = ptt ? 'audio/ogg; codecs=opus' : 'audio/mpeg',
      fileName  = null,
      quoted    = null,
      skipDelay = false,
    } = options;

    if (!skipDelay) await this.randomDelay();

    // Indiquer "enregistrement en cours" si PTT
    if (ptt) {
      try { await sock.sendPresenceUpdate('recording', jid); } catch {}
      await new Promise(r => setTimeout(r, 800));
      try { await sock.sendPresenceUpdate('paused', jid); } catch {}
    }

    const content = { audio: buffer, mimetype, ptt };
    if (fileName) content.fileName = fileName;

    const msgOpts = quoted ? { quoted } : {};

    let lastErr;
    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        const result = await sock.sendMessage(jid, content, msgOpts);
        this.setCooldown(jid);
        this._recordSuccess();
        return result;
      } catch (err) {
        lastErr = err;
        const msg = err?.message || '';
        if (msg.includes('429') || msg.includes('rate') || msg.includes('stream')) {
          this._recordError();
          await new Promise(r => setTimeout(r, 5000 * (attempt + 1)));
        } else if (attempt < this.maxRetries - 1) {
          await new Promise(r => setTimeout(r, 2000 * (attempt + 1)));
        }
      }
    }
    this._recordError();
    throw lastErr;
  }
}

module.exports = new AntiBan();
