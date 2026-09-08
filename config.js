// ═══════════════════════════════════════
// ZERO TRACE — Configuration
// ═══════════════════════════════════════
require("dotenv").config();
const fs = require("fs-extra");
const chalk = require("chalk");

module.exports = {
  botName: process.env.BOT_NAME || "✵✿✵ Zéro-trace-V1🤖 ✵✿✵",
  ownerName: process.env.OWNER_NAME || "◯ꧢshadow Senku ▲◯",
  version: "2.0.0",
  hosting: process.env.HOSTING_NAME || "Tele Pair",
  owner: process.env.OWNER_NUMBER || "",
  ownerNumbers: (process.env.OWNER_NUMBERS || "").split(",").map(n => n.trim()).filter(Boolean),
  AUTO_JOIN_GROUP: true,
  auto: {
    react: false,
    online: false,
  },

  prefix: [process.env.PREFIX || ""],
  menuImages: [
    "./media/zero_menu.jpg",
    "./media/einstein.jpg"
  ],

  packname: "✵✿✵ Zéro-trace-V1🤖 ✵✿✵",
  author: "◯ꧢshadow Senku ▲◯",

  // -------- ANTI-LINK --------
  antilink: false,
  antilinkMode: "warn", // warn | kick | delete
  maxWarnings: 3,

  // -------- ANTI-BOT --------
  antibot: true,
   antibotMode: "delete", // kick | delete
   botWhitelist: [
  "234xxxxxxxxxx@s.whatsapp.net"
],

  // -------- ANTI-PROMOTE --------
  antipromote: false, // blocks unauthorized promotions

  // -------- ANTI-DEMODE --------
  antidemote: false, // blocks unauthorized demotions

  // -------- ANTI-FOREIGN --------
  antiforeign: false,
  allowedCountryCode: "234", // Nigeria

  // -------- ANTI-BADWORD --------
  antibadword: false,
  badwords: [
    "fuck",
    "bitch",
    "shit",
    "asshole"
  ],

  // -------- ANTI-TAG --------
  antitag: false,
  antitagMode: "warn", // warn | kick | delete

  // -------- ANTI-TAG ADMIN --------
  antitagadmin: false,
  antitagadminMode: "delete", // delete | kick | warn

  // -------- ANTI-GROUP MENTION --------
  antigroupmention: false,
  antigroupmentionMode: "warn", // warn | kick | delete

  // ==================================================
  // 💬 MESSAGES PAR DÉFAUT DU BOT
  // ==================================================
  mess: {
    wait: "⏳ Un instant, je m'en occupe...",
    success: "✅ C'est fait !",
    error: {
      api: "❌ Une erreur est survenue avec le service externe. Réessaie un peu plus tard.",
      owner: "👑 Cette commande est réservée au propriétaire du bot.",
      group: "👥 Cette commande fonctionne uniquement dans les groupes.",
      admin: "🛡️ Cette commande est réservée aux administrateurs. Veuillez respecter les permissions.",
      botAdmin: "🤖 J'ai besoin des droits administrateur pour effectuer cette action."
    }
  },
  
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || "",
  OWNER_TELEGRAM_ID: process.env.OWNER_TELEGRAM_ID || "",

  // Pour forcer l'abonnement à tes propres canaux/groupes Telegram avant
  // utilisation, ajoute des entrées ici, par ex. :
  // { type: "channel", id: "@tonCanal", link: "https://t.me/tonCanal" }
  REQUIRED_CHANNELS: [],

  MAX_PAIRED_USERS: parseInt(process.env.MAX_PAIRED_USERS || "20", 10),
  AUTO_JOIN_GROUP_INVITE: process.env.AUTO_JOIN_GROUP_INVITE || "",
  telegramHandle: process.env.TELEGRAM_HANDLE || "",
};

let file = require.resolve(__filename);
fs.watchFile(file, () => {
    fs.unwatchFile(file);
    console.log(chalk.greenBright(`\n[UPDATE] '${__filename}' has been updated. Reloading...\n`));
    delete require.cache[file];
    require(file);
});
