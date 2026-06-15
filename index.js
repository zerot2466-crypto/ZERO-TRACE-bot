/**
 * ╔══════════════════════════════════════════════╗
 * ║          ZERO TRACE BOT v5.0                 ║
 * ║     WhatsApp Bot — Baileys                   ║
 * ║     Mode Préfixe + Mode Naturel              ║
 * ║         Powered by ZERO TRACE Team           ║
 * ╚══════════════════════════════════════════════╝
 */

require('./_loadKeys'); // Charge keys.js → injecte dans process.env (remplace dotenv)

// ── Timeout global axios (évite les blocages sur appels API lents) ────────────
const axios = require('axios');
axios.defaults.timeout = 30000; // 30s par défaut pour tous les appels axios

const chalk = require('chalk');
const figlet = require('figlet');
const fs = require('fs-extra');
const path = require('path');

const { connectToWhatsApp } = require('./connect');
const { messageHandler }    = require('./handler');
const config                = require('./config');
const settings              = require('./settings');

function showBanner() {
  console.clear();
  try {
    console.log(chalk.red(figlet.textSync('ZERO TRACE', { font: 'ANSI Shadow' })));
  } catch (e) {
    console.log(chalk.red.bold('=== ZERO TRACE BOT ==='));
  }
  console.log(chalk.gray('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
  console.log(chalk.white.bold(`  🤖 ${settings.botName} v${settings.version}`));
  console.log(chalk.white(`  📝 ${settings.description}`));
  console.log(chalk.white(`  👤 Owner: ${settings.ownerNumber}`));
  console.log(chalk.white(`  🔧 Préfixe: ${config.getPrefix()}`));
  console.log(chalk.cyan(`  💬 Mode naturel: "zero trace [action]"`));
  console.log(chalk.gray('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
  console.log('');
}

async function init() {
  showBanner();

  config.loadConfig();
  console.log(chalk.green('[INIT] Configuration chargée'));

  // Créer les dossiers nécessaires
  const dirs = ['session', 'tmp', 'data', 'assets/supremacy', 'assets/mes_images', 'assets/menu'];
  for (const dir of dirs) {
    fs.ensureDirSync(path.join(__dirname, dir));
  }
  console.log(chalk.green('[INIT] Dossiers vérifiés'));

  // Initialiser data/chatbot_private.json si absent
  const chatbotPrivatePath = path.join(__dirname, 'data', 'chatbot_private.json');
  if (!fs.existsSync(chatbotPrivatePath)) {
    fs.writeJsonSync(chatbotPrivatePath, { enabled: false, users: {} });
    console.log(chalk.green('[INIT] chatbot_private.json créé'));
  }

  console.log(chalk.yellow('[INIT] Connexion à WhatsApp en cours...'));
  console.log(chalk.yellow(`[INIT] Mode: ${process.env.CONNECTION_MODE || 'pairing'}`));
  console.log('');

  try {
    await connectToWhatsApp(messageHandler);
    } catch (err) {
    console.error(chalk.red('[FATAL] Erreur de connexion:'), err);
    process.exit(1);
  }
}

process.on('uncaughtException',  (err) => console.error(chalk.red('[UNCAUGHT]'), err.stack || err.message || err));
process.on('unhandledRejection', (err) => console.error(chalk.red('[UNHANDLED]'), err?.stack || err));

// ── WATCHDOG MÉMOIRE ──────────────────────────────────────────────────────
// Logge l'usage RAM toutes les 60s. Permet de diagnostiquer les coupures
// silencieuses (OOM kill) sur les hébergeurs à mémoire limitée (ex: Hostinger).
const MEMORY_WARN_MB = parseInt(process.env.MEMORY_WARN_MB || '400', 10);
setInterval(() => {
  const mem = process.memoryUsage();
  const rssMB   = (mem.rss / 1024 / 1024).toFixed(1);
  const heapMB  = (mem.heapUsed / 1024 / 1024).toFixed(1);
  const uptime  = Math.floor(process.uptime());

  const line = `[WATCHDOG] RAM: ${rssMB}MB (heap: ${heapMB}MB) | Uptime: ${uptime}s`;

  if (Number(rssMB) >= MEMORY_WARN_MB) {
    console.log(chalk.red.bold(`${line} ⚠️ SEUIL DÉPASSÉ (${MEMORY_WARN_MB}MB)`));
  } else {
    console.log(chalk.gray(line));
  }
}, 60 * 1000);

init();
