/**
 * ZERO TRACE BOT v5.0 - Connection Manager
 */

const {
  default: makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason,
} = require('@whiskeysockets/baileys');

const pino  = require('pino');
const chalk = require('chalk');
const path  = require('path');
const fs    = require('fs-extra');

const { startPairServer, updateSock } = require('./lib/pairServer');

const SESSION_DIR = path.join(__dirname, 'session');

let reconnectAttempts = 0;

async function connectToWhatsApp(messageHandler) {

  const { version, isLatest } = await fetchLatestBaileysVersion();
  console.log(chalk.cyan(`[ZERO TRACE] Baileys v${version.join('.')} (latest: ${isLatest})`));

  const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);

  const sock = makeWASocket({
    version,
    auth:                           state,
    printQRInTerminal:              false,
    syncFullHistory:                false,   // ← false = connexion plus rapide
    markOnlineOnConnect:            true,
    logger:                         pino({ level: 'silent' }),
    keepAliveIntervalMs:            25000,   // ← 25s = plus stable
    connectTimeoutMs:               60000,
    defaultQueryTimeoutMs:          30000,
    generateHighQualityLinkPreview: false,
    retryRequestDelayMs:            2000,
    maxMsgRetryCount:               5,
    fireInitQueries:                true,
    shouldIgnoreJid: jid => jid === 'status@broadcast', // ignorer statuts WA
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === 'connecting') {
      console.log(chalk.yellow('[ZERO TRACE] Connexion en cours...'));
    }

    if (connection === 'close') {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const reason     = lastDisconnect?.error?.toString() || 'unknown';
      console.log(chalk.red(`[DISCONNECT] Code: ${statusCode} | Raison: ${reason}`));

      const isLoggedOut    = statusCode === DisconnectReason.loggedOut;
      const isBadSession   = statusCode === DisconnectReason.badSession;
      const isConflict     = statusCode === 440; // Multi-device conflict
      const isRestarted    = statusCode === DisconnectReason.restartRequired;

      if (isLoggedOut || isBadSession) {
        console.log(chalk.red.bold('[ZERO TRACE] Session invalide. Suppression et arrêt.'));
        console.log(chalk.yellow('[ZERO TRACE] Supprime le dossier /session et redémarre.'));
        await fs.remove(SESSION_DIR);
        process.exit(1);
      } else if (isConflict) {
        // WhatsApp ouvert sur un autre appareil → attendre plus longtemps
        reconnectAttempts = 0; // Reset : conflit n'est pas une erreur réseau
        console.log(chalk.yellow('[ZERO TRACE] Conflit multi-appareil. Reconnexion dans 15s...'));
        setTimeout(() => connectToWhatsApp(messageHandler), 15000);
      } else if (isRestarted) {
        reconnectAttempts = 0; // Reset : restart requis par WA, pas une erreur réseau
        console.log(chalk.yellow('[ZERO TRACE] Redémarrage requis. Reconnexion dans 3s...'));
        setTimeout(() => connectToWhatsApp(messageHandler), 3000);
      } else {
        // Déconnexion réseau ou temporaire
        reconnectAttempts = (reconnectAttempts || 0) + 1;
        const delay = Math.min(5000 * reconnectAttempts, 30000); // backoff max 30s
        console.log(chalk.yellow(`[ZERO TRACE] Reconnexion dans ${delay/1000}s... (tentative ${reconnectAttempts})`));
        setTimeout(() => connectToWhatsApp(messageHandler), delay);
      }
    }

    if (connection === 'open') {
      reconnectAttempts = 0; // Reset le compteur de reconnexion
      console.log(chalk.green.bold('\n╔══════════════════════════════════════╗'));
      console.log(chalk.green.bold('║     ZERO TRACE BOT v5.0 ONLINE      ║'));
      console.log(chalk.green.bold('║         Connection Established        ║'));
      console.log(chalk.green.bold('╚══════════════════════════════════════╝\n'));
      console.log(chalk.cyan(`[INFO] Bot JID: ${sock.user?.id}`));
      console.log(chalk.cyan(`[INFO] Nom: ${sock.user?.name || 'N/A'}`));

      try {
        const port   = parseInt(process.env.PAIR_PORT  || '3000', 10);
        const origin = process.env.PAIR_ALLOWED_ORIGIN || process.env.PAIR_HOST || '*';
        // Démarrer le serveur une seule fois (première connexion)
        if (!global._pairServerStarted) {
          startPairServer(sock, port, origin);
          global._pairServerStarted = true;
        } else {
          // Reconnexion : mettre à jour le sock sans relancer le serveur
          updateSock(sock);
          console.log(chalk.cyan('[PAIR SERVER] Sock mis à jour après reconnexion'));
        }
      } catch (e) {
        console.error(chalk.yellow('[PAIR SERVER] Impossible de démarrer:', e.message));
      }

      // Imports après connexion pour éviter circular deps
      const { cacheMessage, handleDelete, checkAntiRaid } = require('./handler');
      const antiBan = require('./lib/antiBan');
      const gs      = require('./lib/groupSettings');
      const channelManager = require('./lib/channelManager');

      // ── CHANNEL : démarrer le scheduler de publications ─────────────────
      try {
        channelManager.startScheduler(sock);
      } catch (e) {
        console.error(chalk.yellow('[CHANNEL] Erreur démarrage scheduler:', e.message));
      }

      // ── ANTIBAN : initialiser/mettre à jour le sock ─────────────────────
      try {
        if (!global._antiBanInitialized) {
          antiBan.init(sock);
          global._antiBanInitialized = true;
        } else {
          antiBan.updateSock(sock);
        }
      } catch (e) {
        console.error(chalk.yellow('[ANTIBAN] Erreur init:', e.message));
      }

      // ── Messages entrants ───────────────────────────────────────────────
      sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;
        for (const m of messages) {
          // Mise en cache pour antidelete
          const body =
            m.message?.conversation ||
            m.message?.extendedTextMessage?.text ||
            m.message?.imageMessage?.caption ||
            m.message?.videoMessage?.caption ||
            m.message?.listResponseMessage?.singleSelectReply?.selectedRowId || '';
          if (body && m.key?.remoteJid) {
            cacheMessage(m.key.remoteJid, m.key.id, body);
          }
          if (messageHandler) await messageHandler(sock, m);
        }
      });

      // ── Antidelete : messages supprimés ────────────────────────────────
      sock.ev.on('messages.update', async (updates) => {
        for (const update of updates) {
          // messageStubType 1 = message supprimé
          if (update.update?.messageStubType === 1) {
            const jid = update.key?.remoteJid;
            const id  = update.key?.id;
            if (jid && id) await handleDelete(sock, jid, id, antiBan);
          }
        }
      });

      // ── Antiraid + Welcome : nouveaux membres ──────────────────────────
      sock.ev.on('group-participants.update', async ({ id, participants, action }) => {
        if (action === 'add') {
          await checkAntiRaid(sock, id, antiBan);
          // Welcome : envoyer un message de bienvenue à chaque nouveau membre
          try {
            const welcomeCmd = require('./commands/welcome');
            for (const member of (participants || [])) {
              await welcomeCmd.onJoin(sock, id, member, antiBan);
            }
          } catch (e) {
            console.error(chalk.yellow('[WELCOME] Erreur:', e.message));
          }
        }
        // Farewell : géré par setwelcome.js si implémenté
        if (action === 'remove' || action === 'leave') {
          try {
            const setwelcome = require('./commands/setwelcome');
            if (typeof setwelcome.onLeave === 'function') {
              for (const member of (participants || [])) {
                await setwelcome.onLeave(sock, id, member, antiBan);
              }
            }
          } catch (e) { /* setwelcome.onLeave optionnel */ }
        }
      });

      // ── Anticall : appels entrants ─────────────────────────────────────
      sock.ev.on('call', async (calls) => {
        for (const call of calls) {
          if (call.status === 'offer' && gs.isEnabled('anticall', 'global')) {
            try {
              await sock.rejectCall(call.id, call.from);
              console.log(chalk.yellow(`[ANTICALL] Appel rejeté de ${call.from}`));
            } catch (e) {}
          }
        }
      });
    }
  });

  // ── Pairing code ──────────────────────────────────────────────────────────
  setTimeout(async () => {
    if (!state.creds.registered) {
      const phoneNumber = process.env.PAIRING_NUMBER || '';
      const cleanNumber = phoneNumber.replace(/[^0-9]/g, '');

      if (!cleanNumber || cleanNumber.length < 10) {
        console.error(chalk.red('[PAIRING] PAIRING_NUMBER manquant ou invalide dans .env !'));
        console.error(chalk.yellow('[PAIRING] Exemple: PAIRING_NUMBER=22656354706'));
        process.exit(1);
      }

      console.log(chalk.yellow(`[PAIRING] Demande du code pour: ${cleanNumber}`));

      try {
        const code = await sock.requestPairingCode(cleanNumber, 'ZTRACE01');
        console.log(chalk.green.bold('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
        console.log(chalk.green.bold(`   📱 CODE DE CONNEXION: ${code}`));
        console.log(chalk.green.bold('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));
        console.log(chalk.cyan('👉 Ouvrez WhatsApp > Appareils liés > Lier un appareil'));
        console.log(chalk.cyan('👉 Choisissez "Connecter avec un numéro de téléphone"'));
        console.log(chalk.cyan(`👉 Entrez le code: ${code}`));
        console.log(chalk.red('\n⚠️  Le code expire dans 60 secondes!\n'));
      } catch (e) {
        console.error(chalk.red('[PAIRING] Erreur:', e.message));
      }
    }
  }, 5000);

  return sock;
}

module.exports = { connectToWhatsApp };
