/**
 * ZERO TRACE BOT v5.0 — pair.js (système complet)
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Système de pairing complet avec sessions persistantes
 *
 * Commandes :
 *   .pair [numéro]     — générer un code de connexion
 *   .unpair [numéro]   — déconnecter un bot parrainé
 *   .pairlist          — voir tous les bots parrainés
 */
'use strict';

const fs      = require('fs-extra');
const path    = require('path');
const axios   = require('axios');
const { makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, DisconnectReason, Browsers } = require('@whiskeysockets/baileys');
const pino    = require('pino');

const OWNER_NUMBER   = process.env.OWNER_NUMBER  || '260956849240';
const CHANNEL_LINK   = process.env.CHANNEL_LINK  || 'https://whatsapp.com/channel/0029VbCEDif84OmANqy2xI0X';
const PAIR_SESSIONS  = path.join(__dirname, '../data/pair_sessions.json');
const SESSIONS_DIR   = path.join(__dirname, '../sessions');
const COOLDOWN_MS    = 3 * 60 * 1000;

const activePairSockets = new Map();
const cooldowns         = new Map();

// ── Persistance sessions ──────────────────────────────────────────────────────
function savePairSession(number, pairedBy) {
  try {
    fs.ensureDirSync(path.dirname(PAIR_SESSIONS));
    let list = fs.existsSync(PAIR_SESSIONS) ? fs.readJsonSync(PAIR_SESSIONS) : [];
    const idx = list.findIndex(e => (typeof e === 'object' ? e.number : e) === number);
    if (idx === -1) {
      list.push({ number, pairedBy: pairedBy || null, status: 'alive' });
    } else {
      list[idx] = { ...list[idx], number, status: 'alive' };
    }
    fs.writeJsonSync(PAIR_SESSIONS, list, { spaces: 2 });
  } catch (e) {}
}

function markSessionDead(number) {
  try {
    if (!fs.existsSync(PAIR_SESSIONS)) return;
    let list = fs.readJsonSync(PAIR_SESSIONS);
    const idx = list.findIndex(e => (typeof e === 'object' ? e.number : e) === number);
    if (idx !== -1) { list[idx].status = 'dead'; fs.writeJsonSync(PAIR_SESSIONS, list, { spaces: 2 }); }
  } catch (e) {}
}

function removePairSession(number) {
  try {
    if (!fs.existsSync(PAIR_SESSIONS)) return;
    let list = fs.readJsonSync(PAIR_SESSIONS);
    list = list.filter(e => (typeof e === 'object' ? e.number : e) !== number);
    fs.writeJsonSync(PAIR_SESSIONS, list, { spaces: 2 });
  } catch (e) {}
}

function getPairedBy(number) {
  try {
    if (!fs.existsSync(PAIR_SESSIONS)) return null;
    const list  = fs.readJsonSync(PAIR_SESSIONS);
    const entry = list.find(e => (typeof e === 'object' ? e.number : e) === number);
    return entry?.pairedBy || null;
  } catch { return null; }
}

/**
 * Vérifie si un numéro a déjà pairé son propre bot via .pair
 * (présent dans pair_sessions.json, peu importe le status alive/dead).
 * @param {string} numberOrJid - numéro brut ou JID
 * @returns {boolean}
 */
function isPairedNumber(numberOrJid) {
  try {
    if (!fs.existsSync(PAIR_SESSIONS)) return false;
    const number = String(numberOrJid).replace(/@.*$/, '').replace(/:[0-9]+$/, '').replace(/[^0-9]/g, '');
    const list   = fs.readJsonSync(PAIR_SESSIONS);
    return list.some(e => (typeof e === 'object' ? e.number : e) === number);
  } catch { return false; }
}

function getPairStats() {
  try {
    if (!fs.existsSync(PAIR_SESSIONS)) return { total: 0, alive: 0, dead: 0 };
    const list  = fs.readJsonSync(PAIR_SESSIONS);
    const total = list.length;
    const alive = list.filter(e => {
      const num = typeof e === 'object' ? e.number : e;
      return activePairSockets.has(num) && e?.status !== 'dead';
    }).length;
    return { total, alive, dead: total - alive };
  } catch { return { total: 0, alive: 0, dead: 0 }; }
}

// ── Méthodes pour obtenir le code ─────────────────────────────────────────────
async function getCodeFromPairServer(number) {
  const host = process.env.PAIR_HOST || `http://localhost:${process.env.PAIR_PORT || 3000}`;
  const res  = await axios.get(`${host}/pair?number=${number}`, { timeout: 20000 });
  if (!res.data?.success || !res.data?.code) throw new Error(res.data?.error || 'Code non reçu');
  return res.data.code;
}

// ✅ Génération directe via Baileys (sans service externe) ─────────────────────
async function getCodeViaBaileys(number) {
  return new Promise(async (resolve, reject) => {
    const sessionDir = path.join(__dirname, '../sessions', `tmp_pair_${number}`);
    fs.ensureDirSync(sessionDir);

    let done = false;
    const timeout = setTimeout(() => {
      if (!done) { done = true; reject(new Error('Timeout génération code Baileys')); }
      try { tmpSock?.ws?.close(); } catch {}
      try { fs.removeSync(sessionDir); } catch {}
    }, 45000);

    let tmpSock;
    try {
      const { version }          = await fetchLatestBaileysVersion();
      const { state, saveCreds } = await useMultiFileAuthState(sessionDir);

      tmpSock = makeWASocket({
        version,
        auth:              state,
        printQRInTerminal: false,
        logger:            pino({ level: 'silent' }),
        browser:           Browsers.ubuntu('Chrome'),
        connectTimeoutMs:  30000,
        syncFullHistory:   false,
      });

      tmpSock.ev.on('creds.update', saveCreds);

      tmpSock.ev.on('connection.update', async (update) => {
        const { connection } = update;
        if (connection === 'connecting' && !done) {
          await new Promise(r => setTimeout(r, 2500));
          try {
            const code = await tmpSock.requestPairingCode(number);
            if (!done) {
              done = true;
              clearTimeout(timeout);
              resolve(code);
            }
          } catch (err) {
            if (!done) {
              done = true;
              clearTimeout(timeout);
              reject(err);
            }
          } finally {
            setTimeout(() => {
              try { tmpSock?.ws?.close(); } catch {}
              try { fs.removeSync(sessionDir); } catch {}
            }, 3000);
          }
        }
        if (connection === 'open' && !done) {
          done = true; clearTimeout(timeout);
          try { tmpSock?.ws?.close(); } catch {}
          try { fs.removeSync(sessionDir); } catch {}
          reject(new Error('Numéro déjà lié'));
        }
      });
    } catch (err) {
      if (!done) { done = true; clearTimeout(timeout); reject(err); }
    }
  });
}

// ── Démarrer un socket bot parrainé ──────────────────────────────────────────
async function startBotSocket(number, sessionDir, notifyClient, notifySender, isRestore, pairedBy) {
  if (activePairSockets.has(number)) {
    try { activePairSockets.get(number).ws.close(); } catch {}
    activePairSockets.delete(number);
    await new Promise(r => setTimeout(r, 1500));
  }

  const { version }          = await fetchLatestBaileysVersion();
  const { state, saveCreds } = await useMultiFileAuthState(sessionDir);

  const sock = makeWASocket({
    version,
    auth:                         state,
    printQRInTerminal:            false,
    logger:                       pino({ level: 'silent' }),
    browser:                      Browsers.ubuntu('Chrome'),
    keepAliveIntervalMs:          5000,
    connectTimeoutMs:             60000,
    retryRequestDelayMs:          1000,
    syncFullHistory:              false,
    markOnlineOnConnect:          true,
    generateHighQualityLinkPreview: true,
  });

  activePairSockets.set(number, sock);
  sock.ev.on('creds.update', saveCreds);

  let codeSent           = isRestore;
  let msgHandlerAttached = false;
  let confirmationSent   = false;
  let reconnectAttempts  = 0;
  let pingInterval       = null;

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update;

    // ── Envoyer le code ──────────────────────────────────────────────────────
    if (!codeSent && connection === 'connecting') {
      codeSent = true;
      await new Promise(r => setTimeout(r, 3000));
      try {
        const code = await sock.requestPairingCode(number);
        const fmt  = code.match(/.{1,4}/g)?.join('-') || code;
        if (notifyClient && notifySender) {
          // Message d'instructions
          await notifyClient.sendMessage(notifySender, {
            text:
              `╔══ ⚡ *ZERO TRACE BOT v5.0* ══╗\n\n` +
              `🔑 *NUMÉRO :* +${number}\n\n` +
              `📋 *COMMENT L'UTILISER :*\n` +
              `1️⃣ Ouvre WhatsApp sur +${number}\n` +
              `2️⃣ Paramètres → Appareils liés\n` +
              `3️⃣ Lier un appareil → Lier avec un numéro\n` +
              `4️⃣ Copie et entre le code suivant ↓\n\n` +
              `⚠️ _Code expire dans 60 secondes !_\n\n` +
              `╚══════════════════════════╝\n` +
              `> ⚡ _ZERO TRACE BOT v5.0_`,
          });
          // ✅ Code seul — copiable d'un tap
          await notifyClient.sendMessage(notifySender, {
            text: fmt,
          }).catch(() => {});
        }
      } catch (err) {
        if (notifyClient && notifySender) {
          await notifyClient.sendMessage(notifySender, {
            text: `❌ *Erreur génération du code*\n\n\`${err.message}\`\n\n> ⚡ _ZERO TRACE BOT v5.0_`,
          }).catch(() => {});
        }
      }
    }

    // ── Connexion établie ────────────────────────────────────────────────────
    if (connection === 'open') {
      reconnectAttempts = 0;
      console.log(`✅ Bot parrainé +${number} connecté`);

      if (pingInterval) clearInterval(pingInterval);
      pingInterval = setInterval(async () => {
        try {
          if (activePairSockets.get(number) === sock) await sock.sendPresenceUpdate('available');
          else clearInterval(pingInterval);
        } catch { clearInterval(pingInterval); }
      }, 20000);

      savePairSession(number, pairedBy);

      if (!msgHandlerAttached) {
        msgHandlerAttached = true;
        sock.ev.on('messages.upsert', async (upsert) => {
          try {
            // Vérification d'accès : seuls les numéros parrainés peuvent utiliser le bot
            const m = upsert.messages?.[0];
            if (!m) return;
            const fromJid = m.key?.remoteJid || '';
            const fromNum = fromJid.replace('@s.whatsapp.net', '').replace('@g.us', '');
            // Bloquer l'owner — jamais accès via bot parrainé
            if (fromNum === OWNER_NUMBER) return;
            // Le numéro parrainé lui-même a accès + ses groupes
            const { messageHandler } = require('../handler');
            await messageHandler(sock, m);
          } catch (e) {}
        });
      }

      if (!confirmationSent) {
        confirmationSent = true;
        const stats = getPairStats();

        // Message au bot lui-même
        try {
          await sock.sendMessage(`${number}@s.whatsapp.net`, {
            text:
              `╔══ ⚡ *ZERO TRACE BOT v5.0* ══╗\n\n` +
              `✅ *CONNEXION RÉUSSIE !*\n\n` +
              `📱 *Numéro :* +${number}\n` +
              `🔑 *Préfixe :* ${process.env.PREFIX || '.'}\n\n` +
              `📊 *Stats bots parrainés :*\n` +
              `🔢 Total : ${stats.total}\n` +
              `🟢 En vie : ${stats.alive}\n` +
              `🔴 Déconnectés : ${stats.dead}\n\n` +
              `💡 Tape \`${process.env.PREFIX || '.'}menu\` pour voir les commandes\n\n` +
              `🔗 Canal : ${CHANNEL_LINK}\n` +
              `📞 Owner : wa.me/${OWNER_NUMBER}\n\n` +
              `╚══════════════════════════╝\n` +
              `> ⚡ _ZERO TRACE BOT v5.0_`,
          });
        } catch (e) {}

        // Notification à celui qui a fait le pair
        if (notifyClient && notifySender) {
          try {
            await notifyClient.sendMessage(notifySender, {
              text:
                `╔══ ⚡ *ZERO TRACE BOT v5.0* ══╗\n\n` +
                `✅ *BOT CONNECTÉ AVEC SUCCÈS !*\n\n` +
                `📱 *Numéro :* +${number}\n` +
                `🔑 *Préfixe :* ${process.env.PREFIX || '.'}\n\n` +
                `📊 *Stats bots :*\n` +
                `🔢 Total parrainés : ${stats.total}\n` +
                `🟢 En vie : ${stats.alive}\n` +
                `🔴 Déconnectés : ${stats.dead}\n\n` +
                `╚══════════════════════════╝\n` +
                `> ⚡ _ZERO TRACE BOT v5.0_`,
            });
          } catch (e) {}
        }
      }
    }

    // ── Déconnexion ──────────────────────────────────────────────────────────
    if (connection === 'close') {
      if (pingInterval) { clearInterval(pingInterval); pingInterval = null; }

      const code   = lastDisconnect?.error?.output?.statusCode;
      const reason = lastDisconnect?.error?.message || '';
      console.log(`❌ Bot parrainé +${number} déconnecté (code: ${code})`);

      msgHandlerAttached = false;
      confirmationSent   = false;

      const isLoggedOut =
        code === DisconnectReason.loggedOut || code === 401 || code === 440 ||
        reason.toLowerCase().includes('logged out') ||
        reason.toLowerCase().includes('conflict');

      if (isLoggedOut) {
        markSessionDead(number);
        activePairSockets.delete(number);
        const sessDir = path.join(SESSIONS_DIR, `pair_${number}`);
        try { if (fs.existsSync(sessDir)) fs.rmSync(sessDir, { recursive: true }); } catch {}

        const stats          = getPairStats();
        const savedPairedBy  = getPairedBy(number);
        const notifTargets   = [];
        if (notifySender) notifTargets.push(notifySender);
        if (savedPairedBy) {
          const jid = `${savedPairedBy}@s.whatsapp.net`;
          if (!notifTargets.includes(jid)) notifTargets.push(jid);
        }

        for (const target of notifTargets) {
          try {
            if (notifyClient) {
              await notifyClient.sendMessage(target, {
                text:
                  `╔══ ⚡ *ZERO TRACE BOT v5.0* ══╗\n\n` +
                  `🔴 *BOT DÉCONNECTÉ !*\n\n` +
                  `📱 *Numéro :* +${number}\n` +
                  `⚠️ *Raison :* Appareil supprimé / Logout\n\n` +
                  `📊 Stats : ${stats.total} total | 🟢 ${stats.alive} | 🔴 ${stats.dead}\n\n` +
                  `🔄 Tape \`.pair ${number}\` pour reconnecter\n\n` +
                  `╚══════════════════════════╝\n` +
                  `> ⚡ _ZERO TRACE BOT v5.0_`,
              });
            }
          } catch (e) {}
        }

      } else {
        reconnectAttempts++;
        const delay       = Math.min(3000 * reconnectAttempts, 15000);
        const currentSock = sock;
        const sessDir     = path.join(SESSIONS_DIR, `pair_${number}`);

        console.log(`🔄 Reconnexion +${number} dans ${delay / 1000}s... (tentative ${reconnectAttempts})`);

        setTimeout(async () => {
          if (activePairSockets.get(number) === currentSock) {
            activePairSockets.delete(number);
            try {
              await startBotSocket(number, sessDir, notifyClient, notifySender, true, getPairedBy(number));
            } catch (e) { console.error(`❌ Reconnexion +${number}:`, e.message); }
          }
        }, delay);
      }
    }
  });

  return sock;
}

// ── COMMANDE PRINCIPALE ───────────────────────────────────────────────────────
module.exports = {
  name:    'pair',
  aliases: ['paire', 'connexion', 'connect'],

  // Exporter les fonctions utilitaires pour d'autres modules
  startBotSocket,
  activePairSockets,
  getPairStats,
  isPairedNumber,

  async execute(ctx) {
    const { sock, jid, msg, args, antiBan, isGroup, sender } = ctx;

    // ── .pairlist ─────────────────────────────────────────────────────────────
    if (args[0]?.toLowerCase() === 'list') {
      let list = [];
      try { if (fs.existsSync(PAIR_SESSIONS)) list = fs.readJsonSync(PAIR_SESSIONS); } catch {}

      if (!list.length) {
        await antiBan.safeSend(sock, jid, {
          text:
            `╔══ ⚡ *ZERO TRACE BOT v5.0* ══╗\n\n` +
            `📋 *LISTE DES BOTS PARRAINÉS*\n\n` +
            `_Aucun bot parrainé pour l'instant._\n\n` +
            `💡 Tape \`.pair [numéro]\` pour en ajouter un\n\n` +
            `╚══════════════════════════╝\n` +
            `> ⚡ _ZERO TRACE BOT v5.0_`,
        }, { msgOptions: { quoted: msg } });
        return;
      }

      const stats = getPairStats();
      let text =
        `╔══ ⚡ *ZERO TRACE BOT v5.0* ══╗\n\n` +
        `📋 *LISTE DES BOTS PARRAINÉS*\n` +
        `━━━━━━━━━━━━━━━━━━━━━━\n\n`;

      list.forEach((entry, i) => {
        const num      = typeof entry === 'object' ? entry.number : entry;
        const pairedBy = typeof entry === 'object' ? entry.pairedBy : null;
        const isActive = activePairSockets.has(num) && entry?.status !== 'dead';
        text += `*${i + 1}.* +${num} — ${isActive ? '🟢 En vie' : '🔴 Déconnecté'}\n`;
        if (pairedBy) text += `   Parrainé par : +${pairedBy}\n`;
      });

      text +=
        `\n📊 Total : ${stats.total} | 🟢 ${stats.alive} | 🔴 ${stats.dead}\n\n` +
        `💡 \`.pair unpair [numéro]\` pour déconnecter\n\n` +
        `╚══════════════════════════╝\n` +
        `> ⚡ _ZERO TRACE BOT v5.0_`;

      await antiBan.safeSend(sock, jid, { text }, { msgOptions: { quoted: msg } });
      return;
    }

    // ── .pair unpair [numéro] ─────────────────────────────────────────────────
    if (args[0]?.toLowerCase() === 'unpair') {
      const targetNum = (args[1] || '').replace(/[^0-9]/g, '');
      if (!targetNum || targetNum.length < 7) {
        await antiBan.safeSend(sock, jid, {
          text:
            `╔══ ⚡ *ZERO TRACE BOT v5.0* ══╗\n\n` +
            `🔌 *DÉCONNECTER UN BOT*\n\n` +
            `Usage : \`.pair unpair [numéro]\`\n` +
            `Ex : \`.pair unpair 260951829244\`\n\n` +
            `╚══════════════════════════╝\n` +
            `> ⚡ _ZERO TRACE BOT v5.0_`,
        }, { msgOptions: { quoted: msg } });
        return;
      }

      if (activePairSockets.has(targetNum)) {
        try { activePairSockets.get(targetNum).ws.close(); } catch {}
        activePairSockets.delete(targetNum);
      }

      const sessDir = path.join(SESSIONS_DIR, `pair_${targetNum}`);
      try { if (fs.existsSync(sessDir)) fs.rmSync(sessDir, { recursive: true }); } catch {}
      markSessionDead(targetNum);

      const stats = getPairStats();
      await antiBan.safeSend(sock, jid, {
        text:
          `╔══ ⚡ *ZERO TRACE BOT v5.0* ══╗\n\n` +
          `✅ *BOT DÉCONNECTÉ !*\n\n` +
          `📱 Numéro : +${targetNum}\n` +
          `🗑️ Session supprimée\n\n` +
          `📊 Total : ${stats.total} | 🟢 ${stats.alive} | 🔴 ${stats.dead}\n\n` +
          `🔄 \`.pair ${targetNum}\` pour reconnecter\n\n` +
          `╚══════════════════════════╝\n` +
          `> ⚡ _ZERO TRACE BOT v5.0_`,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    // ── .pair [numéro] — générer un code ─────────────────────────────────────
    // ❌ Bloquer l'owner
    const senderNum = sender?.replace('@s.whatsapp.net', '') || '';
    if (senderNum === OWNER_NUMBER) {
      await antiBan.safeSend(sock, jid, {
        text:
          `❌ *Tu es l'owner — tu n'as pas besoin de te pairer.*\n\n` +
          `Le bot t'appartient déjà. 💀\n\n` +
          `> ⚡ _ZERO TRACE BOT v5.0_`,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    const query = args.join(' ').trim();
    if (!query) {
      const stats = getPairStats();
      await antiBan.safeSend(sock, jid, {
        text:
          `╔══ ⚡ *ZERO TRACE BOT v5.0* ══╗\n\n` +
          `🔑 *CONNEXION BOT*\n\n` +
          `Usage : \`.pair [numéro]\`\n` +
          `Ex : \`.pair 260951829244\`\n\n` +
          `⚠️ Indicatif pays + numéro, sans + ni espaces\n\n` +
          `📊 *Stats bots parrainés :*\n` +
          `🔢 Total : ${stats.total}\n` +
          `🟢 En vie : ${stats.alive}\n` +
          `🔴 Déconnectés : ${stats.dead}\n\n` +
          `📋 \`.pair list\` — voir la liste\n\n` +
          `🔗 Canal : ${CHANNEL_LINK}\n` +
          `📞 Owner : wa.me/${OWNER_NUMBER}\n\n` +
          `╚══════════════════════════╝\n` +
          `> ⚡ _ZERO TRACE BOT v5.0_`,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    const numbers = query
      .split(',')
      .map(v => v.replace(/[^0-9]/g, '').trim())
      .filter(v => v.length >= 7 && v.length <= 15);

    if (!numbers.length) {
      await antiBan.safeSend(sock, jid, {
        text:
          `❌ *Numéro invalide*\n\n` +
          `Format : indicatif pays + numéro (sans + ni espaces)\n\n` +
          `Exemples :\n` +
          `• \`26095XXXXXXX\` (Zambie)\n` +
          `• \`22656XXXXXX\` (Côte d'Ivoire)\n` +
          `• \`212XXXXXXXXX\` (Maroc)\n` +
          `• \`33XXXXXXXXX\` (France)\n\n` +
          `> ⚡ _ZERO TRACE BOT v5.0_`,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    await sock.sendMessage(jid, { react: { text: '🔑', key: msg.key } }).catch(() => {});

    for (const number of numbers) {
      const now  = Date.now();
      const last = cooldowns.get(number);
      if (last && (now - last) < COOLDOWN_MS) {
        const remaining = Math.ceil((last + COOLDOWN_MS - now) / 1000);
        await antiBan.safeSend(sock, jid, {
          text: `⏳ Code déjà demandé pour *+${number}*.\nRéessaie dans *${remaining}s*.\n\n> ⚡ _ZERO TRACE BOT v5.0_`,
        }, { msgOptions: { quoted: msg } });
        continue;
      }

      cooldowns.set(number, now);
      await antiBan.safeSend(sock, jid, {
        text: `⚙️ _Génération du code pour *+${number}*..._`,
      }, { msgOptions: { quoted: msg } });

      let code = null;
      let errMsg = '';

      // ✅ Cascade : serveur local → Baileys direct (sans service externe down)
      try {
        code = await getCodeFromPairServer(number);
      } catch (e1) {
        try {
          code = await getCodeViaBaileys(number);
        } catch (e2) {
          cooldowns.delete(number);
          const combined = `${e1.message} ${e2.message}`.toLowerCase();

          if (combined.includes('already') || combined.includes('déjà lié')) errMsg = '⚠️ Ce numéro est *déjà lié* au bot.\nDélie-le dans WhatsApp > Appareils liés.';
          else if (combined.includes('not on whatsapp')) errMsg = '⚠️ Ce numéro *n\'est pas sur WhatsApp*.';
          else if (combined.includes('429') || combined.includes('rate')) errMsg = '⏳ *Trop de demandes.* Attends 2-3 minutes.';
          else if (combined.includes('timeout')) errMsg = '⏱️ *Délai dépassé.* Réessaie dans 30s.';
          else if (combined.includes('401')) errMsg = '🔒 *Session expirée.* Redémarre avec `.restart`.';
          else errMsg = `🔧 *Erreur :* \`${e2.message || e1.message}\`\n\nRéessaie dans 1 minute.`;

          await sock.sendMessage(jid, { react: { text: '❌', key: msg.key } }).catch(() => {});
          await antiBan.safeSend(sock, jid, {
            text:
              `❌ *Code impossible pour +${number}*\n\n` +
              `${errMsg}\n\n` +
              `📞 Contacte l'owner : wa.me/${OWNER_NUMBER}\n\n` +
              `> ⚡ _ZERO TRACE BOT v5.0_`,
          }, { msgOptions: { quoted: msg } });
          continue;
        }
      }

      if (!code) {
        cooldowns.delete(number);
        await antiBan.safeSend(sock, jid, {
          text: `❌ Code non reçu pour *+${number}*. Réessaie.\n\n> ⚡ _ZERO TRACE BOT v5.0_`,
        }, { msgOptions: { quoted: msg } });
        continue;
      }

      const formatted = String(code)
        .replace(/[^A-Z0-9]/gi, '')
        .match(/.{1,4}/g)?.join('-') || String(code);

      await sock.sendMessage(jid, { react: { text: '✅', key: msg.key } }).catch(() => {});
      await antiBan.safeSend(sock, jid, {
        text:
          `╔══ ⚡ *ZERO TRACE BOT v5.0* ══╗\n\n` +
          `🔑 *CODE DE CONNEXION*\n` +
          `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
          `📱 *Numéro :* +${number}\n\n` +
          `🗝️ *Ton code :*\n` +
          `┌──────────────────┐\n` +
          `│  *${formatted}*\n` +
          `└──────────────────┘\n\n` +
          `📋 *Comment se connecter :*\n` +
          `1️⃣ Ouvre WhatsApp sur +${number}\n` +
          `2️⃣ Paramètres → Appareils liés\n` +
          `3️⃣ Lier un appareil → Connecter avec un numéro\n` +
          `4️⃣ Entre le code : *${formatted}*\n\n` +
          `⚠️ _Code expire dans 60 secondes !_\n\n` +
          `🔗 Canal : ${CHANNEL_LINK}\n` +
          `📞 Owner : wa.me/${OWNER_NUMBER}\n\n` +
          `╚══════════════════════════╝\n` +
          `> ⚡ _ZERO TRACE BOT v5.0_`,
      }, { msgOptions: { quoted: msg } });

      // Démarrer le socket du bot parrainé
      const senderNumber = sender?.replace('@s.whatsapp.net', '') || OWNER_NUMBER;
      const sessDir      = path.join(SESSIONS_DIR, `pair_${number}`);
      fs.ensureDirSync(sessDir);

      startBotSocket(number, sessDir, sock, jid, false, senderNumber)
        .then(() => console.log(`[PAIR] Socket démarré pour +${number}`))
        .catch(e => console.error(`[PAIR] Erreur socket +${number}:`, e.message));
    }
  },
};
