/**
 * ZERO TRACE BOT v5.0 — Menu Principal (Style Simple)
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * NIVEAU 1 — .menu
 *   → Texte numéroté simple (compatible 100% Android/iOS/PC)
 *   → Image envoyée UNIQUEMENT avec les catégories (niveau 2)
 *
 * NIVEAU 2 — tape un chiffre (1-7) seul OU .menu 1-7
 *   → Affiche les commandes de la catégorie avec une image
 *
 * Navigation :
 *   Taper 1 → 🎵 MÉDIA
 *   Taper 2 → 🤖 IA & AGENT
 *   Taper 3 → ⚔️ RPG & JEUX
 *   Taper 4 → 🎧 AUDIO & VOCAL
 *   Taper 5 → 🛠️ TOOLS & RECHERCHE
 *   Taper 6 → ⚙️ SYSTEM & BOT
 *   Taper 7 → 👥 GROUPE & ADMIN
 */
'use strict';

const config = require('../config');
const fs     = require('fs-extra');
const path   = require('path');

const ASSETS_DIR = path.join(__dirname, '../assets');

// ─────────────────────────────────────────────────────────────────────────────
// CATÉGORIES ET COMMANDES (regroupées par usage)
// ─────────────────────────────────────────────────────────────────────────────
const CATEGORIES = {

  cat_media: {
    emoji: '🎵',
    title: 'MÉDIA & TÉLÉCHARGEMENT',
    desc:  'Images, stickers, MP3, vidéos, téléchargements',
    cmds: [
      { cmd: '.sticker | .s',        desc: 'Créer un sticker (image/vidéo/GIF)' },
      { cmd: '.toimg',               desc: 'Sticker → Image' },
      { cmd: '.removebg',            desc: 'Supprimer le fond d\'une image' },
      { cmd: '.blur',                desc: 'Flouter une image' },
      { cmd: '.enhance',             desc: 'Améliorer qualité image' },
      { cmd: '.wasted',              desc: 'Effet GTA Wasted' },
      { cmd: '.resize 800x600',      desc: 'Redimensionner une image' },
      { cmd: '.stealpp @user',       desc: 'Copier photo de profil' },
      { cmd: '.song [titre]',        desc: 'Télécharger MP3 YouTube' },
      { cmd: '.video [titre/lien]',  desc: 'Télécharger une vidéo YouTube MP4' },
      { cmd: '.ytmp4 [titre/lien]',  desc: 'Alias de .video' },
      { cmd: '.song2 [titre]',       desc: 'MP3 via apis-keith (alternatif fiable)' },
      { cmd: '.mp3 [titre]',         desc: 'Alias de .song2' },
      { cmd: '.yt [lien]',           desc: 'Télécharger vidéo YouTube' },
      { cmd: '.tiktok [lien]',       desc: 'TikTok sans filigrane' },
      { cmd: '.instagram [lien]',    desc: 'Reel Instagram' },
      { cmd: '.soundcloud [lien]',   desc: 'Télécharger SoundCloud MP3' },
      { cmd: '.capcut [lien]',       desc: 'Télécharger CapCut sans filigrane' },
      { cmd: '.play [titre]',        desc: 'Jouer un son dans WhatsApp' },
      { cmd: '.vv',                  desc: 'Voir une photo/vidéo "une vue" dans le chat' },
      { cmd: '.save',                desc: 'Recevoir une photo/vidéo "une vue" en DM' },
    ],
  },

  cat_ia: {
    emoji: '🤖',
    title: 'IA & AGENT',
    desc:  'Intelligence artificielle, chatbot, agent vocal',
    cmds: [
      { cmd: '.zt on/off',              desc: '💀 Cerveau IA unifié ZERO TRACE (owner/sudo/admin)' },
      { cmd: '.zt silent on/off',       desc: 'Mode silencieux du cerveau' },
      { cmd: '.zt group on/off',        desc: 'Ouvrir le cerveau aux membres du groupe' },
      { cmd: '.zt private on/off',      desc: 'Chatbot DM pour tous' },
      { cmd: '.zt clear',               desc: 'Vider la mémoire du cerveau' },
      { cmd: '.zt status',              desc: 'État complet du cerveau' },
      { cmd: '.zt providers',           desc: '🔒 État des providers IA (owner/sudo)' },
      { cmd: '.zt resetproviders',      desc: '🔒 Réinitialiser les providers IA' },
      { cmd: '.zt resetmem stats',      desc: 'Stats de la mémoire IA' },
      { cmd: '.zt resetmem all',        desc: '🔒 Effacer toute la mémoire IA (owner)' },
      { cmd: '.zt resetmem user [JID]', desc: "🔒 Effacer la mémoire d'un user (owner)" },
      { cmd: '.chatbot on/off',         desc: 'Chatbot auto dans le groupe' },
      { cmd: '.chatbot private on/off', desc: 'Chatbot en DM' },
      { cmd: '.imagine [desc]',         desc: 'Générer une image IA' },
      { cmd: '.imagine2 [style]',       desc: 'Image avec style artistique' },
      { cmd: '.sora [desc]',            desc: 'Générer une vidéo IA' },
      { cmd: '.vision [question]',      desc: 'Analyser une image par IA (OCR, code, mème...)' },
      { cmd: '.transcribe',             desc: 'Transcrire un vocal en texte (Groq Whisper)' },
    ],
  },

  cat_jeux: {
    emoji: '⚔️',
    title: 'RPG & JEUX',
    desc:  'Divertissement, RPG, énigmes, bien-être',
    cmds: [
      { cmd: '.joke',              desc: 'Blague aléatoire' },
      { cmd: '.riddle',            desc: 'Devinette' },
      { cmd: '.8ball [question]',  desc: 'Boule magique' },
      { cmd: '.rps',               desc: 'Pierre-papier-ciseaux' },
      { cmd: '.ship @u1 @u2',      desc: 'Compatibilité amoureuse' },
      { cmd: '.tictactoe @user',   desc: 'Morpion' },
      { cmd: '.roast @user',       desc: 'Vannes à un membre' },
      { cmd: '.compliment @user',  desc: 'Compliment' },
      { cmd: '.hack @user',        desc: 'Hack fictif amusant' },
      { cmd: '.giveaway [lot]',    desc: 'Lancer un giveaway' },
      { cmd: '.truth / .dare',     desc: 'Action ou vérité' },
      { cmd: '.horoscope [signe]', desc: 'Horoscope du jour' },
      { cmd: '.quote',             desc: 'Citation inspirante' },
      { cmd: '.enigme',            desc: 'Énigme logique' },
      { cmd: '.quiz',              desc: 'Quiz culture générale' },
    ],
  },

  cat_audio: {
    emoji: '🎧',
    title: 'AUDIO & VOCAL',
    desc:  'TTS, voix, clonage vocal, paroles',
    cmds: [
      { cmd: '.tts [texte]',   desc: 'Texte → message vocal (fr/en/ar/es...)' },
      { cmd: '.clonevoix',     desc: 'Cloner une voix (réponds à un vocal)' },
      { cmd: '.lyrics [titre]',desc: 'Paroles d\'une chanson' },
      { cmd: '.spotify [lien]',desc: 'Infos piste Spotify' },
    ],
  },

  cat_outils: {
    emoji: '🛠️',
    title: 'TOOLS & RECHERCHE',
    desc:  'Utilitaires, web, météo, traduction, OSINT',
    cmds: [
      { cmd: '.weather [ville]',     desc: 'Météo en temps réel' },
      { cmd: '.news',                desc: 'Actualités du jour' },
      { cmd: '.translate [l] [t]',   desc: 'Traduction automatique' },
      { cmd: '.wiki [sujet]',        desc: 'Wikipedia' },
      { cmd: '.calc [expr]',         desc: 'Calculatrice' },
      { cmd: '.qrcode [lien]',       desc: 'Générer un QR Code' },
      { cmd: '.password [n]',        desc: 'Mot de passe sécurisé' },
      { cmd: '.define [mot]',        desc: 'Définition d\'un mot' },
      { cmd: '.font [texte]',        desc: 'Changer la police du texte' },
      { cmd: '.crypto [BTC]',        desc: 'Prix des cryptomonnaies' },
      { cmd: '.monnaie [EUR→USD]',   desc: 'Conversion de devises' },
      { cmd: '.speedtest',           desc: 'Test vitesse internet' },
      { cmd: '.remindme [10m]',      desc: 'Créer un rappel' },
      { cmd: '.poll Q|Op1|Op2',      desc: 'Sondage dans le groupe' },
      { cmd: '.imgsearch [requête]', desc: 'Recherche Google Images' },
      { cmd: '.ss [url]',            desc: 'Capture d\'écran d\'un site web' },
      { cmd: '.scanlink [url]',      desc: 'Analyser un lien (VirusTotal)' },
      { cmd: '.ip [adresse]',        desc: 'Infos sur une IP' },
      { cmd: '.genpass [longueur]',  desc: 'Générer un mot de passe sécurisé' },
      { cmd: '.genpass phrase',      desc: 'Passphrase mémorable' },
      { cmd: '.mail gen',            desc: 'Créer un email temporaire (1h)' },
      { cmd: '.mail inbox',          desc: 'Voir les messages reçus' },
      { cmd: '.mail read [n]',       desc: 'Lire un message (OTP détecté auto)' },
      { cmd: '.genpass pin [n]',     desc: 'Générer un PIN numérique' },
      { cmd: '.history',             desc: 'Voir tes dernières commandes' },
    ],
  },

  cat_osint: {
    emoji: '🔍',
    title: 'OSINT & RECONNAISSANCE',
    desc:  '🔒 Réservé owner/sudo — Reconnaissance éthique',
    cmds: [
      { cmd: '.whois [domaine]',      desc: 'Infos registrar d\'un domaine' },
      { cmd: '.dns [domaine] [type]', desc: 'Enregistrements DNS (A/MX/TXT...)' },
      { cmd: '.ssl [domaine]',        desc: 'Vérifier le certificat SSL' },
      { cmd: '.subdomains [domaine]', desc: 'Énumérer les sous-domaines' },
      { cmd: '.iplookup [ip]',        desc: 'Géoloc + ASN + proxy detection' },
      { cmd: '.wayback [url]',        desc: 'Archive Wayback Machine' },
      { cmd: '.pwned [email/pass]',   desc: 'Vérifier fuites de données' },
    ],
  },

  cat_pentest: {
    emoji: '⚡',
    title: 'PENTEST ÉTHIQUE',
    desc:  '🔒 Réservé owner/sudo — Outils sécurité offensifs',
    cmds: [
      { cmd: '.portscan [ip]',         desc: 'Scanner les ports ouverts' },
      { cmd: '.pingrezo [host]',        desc: 'Ping réseau (latence TCP)' },
      { cmd: '.traceroute [host]',      desc: 'Chemin réseau vers la cible' },
      { cmd: '.headerscan [url]',       desc: 'Analyser les headers HTTP sécu' },
      { cmd: '.hashid [hash]',          desc: 'Identifier le type de hash' },
      { cmd: '.hashcrack [hash]',       desc: 'Tenter de cracker un hash' },
      { cmd: '.cvesearch [logiciel]',   desc: 'Chercher des CVE connus (NIST)' },
      { cmd: '.jwt [token]',            desc: 'Décoder et analyser un JWT' },
      { cmd: '.jwt crack [token]',      desc: 'Brute force secrets JWT communs' },
      { cmd: '.encode [type] [texte]',  desc: 'Encoder (base64/hex/url/morse)' },
      { cmd: '.decode [type] [texte]',  desc: 'Décoder (base64/hex/url/morse)' },
    ],
  },

  cat_netsec: {
    emoji: '🛰️',
    title: 'NETSEC & ANALYSE',
    desc:  '🔒 Réservé owner/sudo — Analyse réseau & apps',
    cmds: [
      { cmd: '.techstack [url]',       desc: 'Détecter les technos d\'un site' },
      { cmd: '.dirbust [url]',         desc: 'Scanner les répertoires cachés' },
      { cmd: '.dnsenum [domaine]',     desc: 'Énumération DNS complète' },
      { cmd: '.apkinfo [app]',         desc: 'Infos & permissions d\'une app Android' },
    ],
  },

  cat_devtools: {
    emoji: '💻',
    title: 'DEV TOOLS',
    desc:  '🔒 Réservé owner/sudo — Outils développeur',
    cmds: [
      { cmd: '.coderun [lang] [code]',   desc: 'Exécuter du code via IA sandbox' },
      { cmd: '.regex [pattern] | [txt]', desc: 'Tester une expression régulière' },
      { cmd: '.json [texte]',            desc: 'Formater / valider du JSON' },
      { cmd: '.json min [texte]',        desc: 'Minifier du JSON' },
      { cmd: '.diff [txt1] || [txt2]',   desc: 'Comparer deux textes' },
      { cmd: '.uuid [n]',                desc: 'Générer des UUIDs v4' },
      { cmd: '.timestamp [date/unix]',   desc: 'Convertir timestamp ↔ date' },
      { cmd: '.ipcidr [ip/cidr]',        desc: 'Analyser un bloc réseau CIDR' },
      { cmd: '.colorcode [hex/rgb]',     desc: 'Convertir des couleurs HEX/RGB/HSL' },
      { cmd: '.lorem [n]',               desc: 'Générer du texte Lorem Ipsum' },
    ],
  },

  cat_feedback: {
    emoji: '💬',
    title: 'FEEDBACK & NOTES',
    desc:  'Retours utilisateurs — Notes perso (owner)',
    cmds: [
      { cmd: '.feedback [message]',    desc: 'Envoyer un feedback à l\'owner' },
      { cmd: '.feedback list',         desc: 'Voir ses feedbacks envoyés' },
      { cmd: '.feedbacks',             desc: '🔒 Voir tous les feedbacks reçus' },
      { cmd: '.feedbacks del [ID]',    desc: '🔒 Supprimer un feedback' },
      { cmd: '.myfeedback [texte]',    desc: '🔒 Ajouter une note personnelle' },
      { cmd: '.myfeedback list',       desc: '🔒 Lister ses notes perso' },
    ],
  },

  cat_flex: {
    emoji: '🔧',
    title: 'FLEXIBILITÉ & CONTRÔLE',
    desc:  '🔒 Réservé owner/sudo — Personnalisation avancée',
    cmds: [
      { cmd: '.addcmd [nom] [réponse]',      desc: 'Créer une commande personnalisée' },
      { cmd: '.delcmd [nom]',                desc: 'Supprimer une commande custom' },
      { cmd: '.editcmd [nom] [réponse]',     desc: 'Modifier une commande custom' },
      { cmd: '.listcmd',                     desc: 'Voir toutes les commandes custom' },
      { cmd: '.autoreply add [mot] | [rép]', desc: 'Ajouter une réponse automatique' },
      { cmd: '.autoreply list',              desc: 'Voir les autoreplies' },
      { cmd: '.autoreply on/off',            desc: 'Activer/désactiver autoreply' },
      { cmd: '.theme [nom]',                 desc: 'Changer le thème visuel (hacker/matrix/cyber...)' },
      { cmd: '.lang [fr/en/ar/es]',          desc: 'Changer la langue du bot' },
      { cmd: '.activehours set HH:MM-HH:MM', desc: 'Définir les horaires actifs' },
      { cmd: '.activehours off',             desc: 'Désactiver les horaires' },
      { cmd: '.webhook set discord [url]',   desc: 'Configurer notifications Discord' },
      { cmd: '.webhook set telegram [t] [id]',desc: 'Configurer notifications Telegram' },
      { cmd: '.webhook test',                desc: 'Tester le webhook' },
      { cmd: '.plugin load [fichier]',       desc: 'Charger un plugin à chaud' },
      { cmd: '.plugin list',                 desc: 'Voir les plugins chargés' },
      { cmd: '.dashboard on',                desc: 'Démarrer le dashboard web' },
      { cmd: '.zero',                        desc: 'Activer le bot (citation de supériorité)' },
      { cmd: '.zero off',                    desc: 'Mettre le bot en veille' },
    ],
  },

  cat_bot: {
    emoji: '⚙️',
    title: 'SYSTEM & BOT',
    desc:  'Infos bot, config, owner, navigation',
    cmds: [
      { cmd: '.zero',           desc: 'Activer le bot (citation de supériorité)' },
      { cmd: '.zero off',       desc: 'Mettre le bot en veille' },
      { cmd: '.zero status',    desc: 'Voir l\'état du bot' },
      { cmd: '.ping',           desc: 'Latence du bot' },
      { cmd: '.alive',          desc: 'Statut du bot' },
      { cmd: '.info',           desc: 'Infos système' },
      { cmd: '.stats',          desc: '🔒 Dashboard bot (uptime, RAM, top cmds)' },
      { cmd: '.backup',         desc: '🔒 Sauvegarder la config en ZIP' },
      { cmd: '.myid',           desc: 'Ton numéro WhatsApp' },
      { cmd: '.pair',           desc: 'Code de connexion au bot' },
      { cmd: '.setprefix [.]',  desc: 'Changer le préfixe (owner)' },
      { cmd: '.private on/off', desc: 'Mode privé (owner)' },
      { cmd: '.sudo add @user', desc: 'Ajouter un sudo (owner)' },
      { cmd: '.restart',        desc: 'Redémarrer le bot' },
      { cmd: '.cleartmp',       desc: 'Vider le cache temporaire' },
      { cmd: '.update',         desc: 'Vérifier les mises à jour' },
      { cmd: '.owner',          desc: 'Contacter le propriétaire' },
      { cmd: '.menu',           desc: 'Afficher ce menu' },
      { cmd: '.auditbot',       desc: 'Audit complet du bot' },
    ],
  },

  cat_admin: {
    emoji: '👥',
    title: 'GROUPE & ADMIN',
    desc:  'Modération, protection, gestion du groupe',
    cmds: [
      { cmd: '.tagall [msg]',       desc: 'Mentionner tous les membres' },
      { cmd: '.warn @user',         desc: 'Avertir un membre' },
      { cmd: '.kick @user',         desc: 'Expulser du groupe' },
      { cmd: '.promote @user',      desc: 'Promouvoir en admin' },
      { cmd: '.demote @user',       desc: 'Rétrograder un admin' },
      { cmd: '.mute on/off',        desc: 'Sourdine du groupe' },
      { cmd: '.antilink on/off',    desc: 'Bloquer les liens auto' },
      { cmd: '.antibadword on/off', desc: 'Filtre gros mots' },
      { cmd: '.antiraid on/off',    desc: 'Protection anti-raid' },
      { cmd: '.antidelete on/off',  desc: 'Voir messages supprimés' },
      { cmd: '.welcome on/off',     desc: 'Message de bienvenue' },
      { cmd: '.groupinfo',          desc: 'Infos du groupe' },
      { cmd: '.topmembers',         desc: 'Top membres actifs' },
      { cmd: '.broadcast [msg]',    desc: 'Diffuser à tous les groupes' },
      { cmd: '.link',               desc: 'Lien d\'invitation groupe' },
      { cmd: '.slowmode on/off',    desc: 'Mode lent du groupe' },
      { cmd: '.lockgroup on/off',   desc: 'Verrouiller le groupe' },
      { cmd: '.badname',            desc: 'Renommer les mauvais noms' },
    ],
  },
};

// Ordre d'affichage (chiffres 1-7)
const CAT_KEYS = [
  'cat_media',
  'cat_ia',
  'cat_jeux',
  'cat_audio',
  'cat_outils',
  'cat_flex',
  'cat_bot',
  'cat_admin',
  'cat_osint',
  'cat_pentest',
  'cat_netsec',
  'cat_devtools',
  'cat_feedback',
];

// ─────────────────────────────────────────────────────────────────────────────
// POOL D'IMAGES — utilisées UNIQUEMENT pour les sous-menus de catégorie
// ─────────────────────────────────────────────────────────────────────────────
const CAT_IMAGE_POOLS = {
  cat_media: [
    'pin_1779493837485.jpg','pin_1779493839429.jpg','pin_1779493842511.jpg',
    'pin_1779493842825.jpg','pin_1779493844897.jpg','pin_1779493846190.jpg',
  ],
  cat_ia: [
    'pin_1779493815719.jpg','pin_1779493816477.jpg','pin_1779493819811.jpg',
    'pin_1779493822422.jpg','pin_1779493826923.jpg',
  ],
  cat_jeux: [
    'pin_1779493849085.jpg','pin_1779493935641.jpg','pin_1779493939197.jpg',
    'pin_1779493941390.jpg','pin_1779493947677.jpg',
  ],
  cat_audio: [
    'pin_1779493948452.jpg','pin_1779493953882.jpg','pin_1779493957962.jpg',
    'pin_1779493961808.jpg','pin_1779493964402.jpg','pin_1779493966113.jpg',
  ],
  cat_outils: [
    'pin_1779493701628.jpg','pin_1779493709181.jpg','pin_1779493712432.jpg',
    'pin_1779493715404.jpg','pin_1779493720789.jpg',
  ],
  cat_bot: [
    'pin_1779494019547.jpg','pin_1779494020933.jpg','pin_1779494025259.jpg',
    'pin_1779494026571.jpg','pin_1779494027172.jpg','pin_1779494028724.jpg',
  ],
  cat_admin: [
    'pin_1779494007912.jpg','pin_1779494010014.jpg','pin_1779494014783.jpg',
    'pin_1779494016624.jpg',
  ],
  // ── Nouvelles catégories → fallback sur le pool global (images aléatoires) ──
  // Ces catégories utilisent des images du pool menu général
  // Tu peux ajouter des images spécifiques ici avec leurs noms de fichiers
  cat_osint:    [], // → fallback pool global automatiquement
  cat_pentest:  [], // → fallback pool global automatiquement
  cat_netsec:   [], // → fallback pool global automatiquement
  cat_devtools: [], // → fallback pool global automatiquement
  cat_feedback: [], // → fallback pool global automatiquement
};

// ─────────────────────────────────────────────────────────────────────────────
// UTILITAIRES
// ─────────────────────────────────────────────────────────────────────────────
function getPrefix(ctx) {
  try { return config.getPrefix ? config.getPrefix(ctx?.jid) : '.'; } catch (e) { return '.'; }
}

function pickImage(catId) {
  // ── Menu principal (catId = null) → bot_image.jpg en priorité ─────────────
  if (!catId) {
    const botImg = path.join(ASSETS_DIR, 'bot_image.jpg');
    if (fs.existsSync(botImg)) return botImg;
    // Fallback : image aléatoire du pool global
    try {
      const menuDir = path.join(ASSETS_DIR, 'menu');
      if (fs.existsSync(menuDir)) {
        const files = fs.readdirSync(menuDir).filter(f => /\.(jpg|jpeg|png)$/i.test(f));
        if (files.length) return path.join(menuDir, files[Math.floor(Math.random() * files.length)]);
      }
    } catch (e) {}
    return null;
  }

  // ── Catégorie avec pool défini ─────────────────────────────────────────────
  const pool = CAT_IMAGE_POOLS[catId] || [];
  if (pool.length) {
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    for (const name of shuffled.slice(0, 3)) {
      const p = path.join(ASSETS_DIR, 'menu', name);
      if (fs.existsSync(p)) return p;
    }
  }

  // ── Fallback universel : image aléatoire dans assets/menu ─────────────────
  try {
    const menuDir = path.join(ASSETS_DIR, 'menu');
    if (fs.existsSync(menuDir)) {
      const files = fs.readdirSync(menuDir).filter(f => /\.(jpg|jpeg|png)$/i.test(f));
      if (files.length) return path.join(menuDir, files[Math.floor(Math.random() * files.length)]);
    }
  } catch (e) {}
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// NIVEAU 1 — MENU PRINCIPAL (avec image aléatoire du pool)
// ─────────────────────────────────────────────────────────────────────────────
async function sendMainMenu(sock, jid, msg, prefix, pushName) {
  const h     = new Date().getHours();
  const greet = h < 5  ? '🌙 Bonne nuit'
              : h < 12 ? '☀️ Bonjour'
              : h < 18 ? '🌤 Bonne après-midi'
              : '🌆 Bonsoir';

  const total = Object.values(CATEGORIES).reduce((s, c) => s + c.cmds.length, 0);

  const catLines = CAT_KEYS.map((key, i) => {
    const cat = CATEGORIES[key];
    return `  *[${i + 1}]* ${cat.emoji} ${cat.title}  _(${cat.cmds.length} cmds)_`;
  }).join('\n');

  const menuText =
    `╔══════════════════════════════╗\n` +
    `║  ⚡ *ZERO TRACE BOT v5.0*  ║\n` +
    `╚══════════════════════════════╝\n\n` +
    `${greet}, *${pushName || 'Membre'}* 👋\n` +
    `🔑 Préfixe : \`${prefix}\`  •  📦 *${total} commandes*\n\n` +
    `━━━━━━ 📂 *CATÉGORIES* ━━━━━━\n\n` +
    catLines + '\n\n' +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `💡 Tape un chiffre *1* à *${CAT_KEYS.length}* pour voir les commandes\n` +
    `> _© ZERO TRACE BOT v5.0_`;

  // Envoyer avec image aléatoire du pool global
  const imgPath = pickImage(null); // null → fallback pool global
  if (imgPath) {
    try {
      const buf  = fs.readFileSync(imgPath);
      const mime = imgPath.endsWith('.png') ? 'image/png' : 'image/jpeg';
      await sock.sendMessage(jid, { image: buf, caption: menuText, mimetype: mime }, { quoted: msg });
      return;
    } catch (e) { /* fallback texte seul */ }
  }
  // Fallback texte seul
  await sock.sendMessage(jid, { text: menuText }, { quoted: msg });
}

// ─────────────────────────────────────────────────────────────────────────────
// NIVEAU 2 — SOUS-MENU D'UNE CATÉGORIE (style unique par catégorie)
// ─────────────────────────────────────────────────────────────────────────────

const CAT_STYLES = {
  cat_media: {
    header: (cat) => `🎬 *─── MÉDIATHÈQUE ───*\n┃ ${cat.emoji} *${cat.title}*\n*─────────────────────*`,
    bullet: (cmd, desc) => `🎵 \`${cmd}\`\n   ↳ _${desc}_`,
    footer: (p) => `\n*─────────────────────*\n🏠 \`${p}menu\` — accueil\n> 🎬 _Zero Trace · Média_`,
  },
  cat_ia: {
    header: (cat) => `╭━━━━━━━━━━━━━━━━━━━╮\n┃ 🤖 *IA & INTELLIGENCE*\n┃ _Powered by Zero Trace_\n╰━━━━━━━━━━━━━━━━━━━╯`,
    bullet: (cmd, desc) => `⚡ \`${cmd}\`\n   ╰▸ _${desc}_`,
    footer: (p) => `\n╰━━━━━━━━━━━━━━━━━━━╯\n🏠 \`${p}menu\`\n> 🤖 _Zero Trace · IA_`,
  },
  cat_jeux: {
    header: (cat) => `🎮 ══ *JEUX & DIVERTISSEMENT* ══\n${cat.emoji} *${cat.title}*`,
    bullet: (cmd, desc) => `🕹️ \`${cmd}\`  →  _${desc}_`,
    footer: (p) => `\n▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n🏠 \`${p}menu\`\n> 🎮 _Zero Trace · Jeux_`,
  },
  cat_audio: {
    header: (cat) => `🎙️ *〔 AUDIO & VOCAL 〕*\n▓▒░ _${cat.desc}_ ░▒▓`,
    bullet: (cmd, desc) => `🔊 \`${cmd}\`\n    ∟ _${desc}_`,
    footer: (p) => `\n〰〰〰〰〰〰〰〰〰〰\n🏠 \`${p}menu\`\n> 🎙️ _Zero Trace · Audio_`,
  },
  cat_outils: {
    header: (cat) => `🔧 *OUTILS & UTILITAIRES*\n──────────────────────\n_${cat.desc}_`,
    bullet: (cmd, desc) => `› \`${cmd}\`\n  _${desc}_`,
    footer: (p) => `\n──────────────────────\n🏠 \`${p}menu\`\n> 🔧 _Zero Trace · Outils_`,
  },
  cat_flex: {
    header: (cat) => `⚙️ *[ CONFIGURATION & CONTRÔLE ]*\n${'━'.repeat(30)}\n${cat.emoji} _${cat.desc}_`,
    bullet: (cmd, desc) => `◈ \`${cmd}\`\n  ⌐ _${desc}_`,
    footer: (p) => `\n${'━'.repeat(30)}\n🏠 \`${p}menu\`\n> ⚙️ _Zero Trace · Config_`,
  },
  cat_bot: {
    header: (cat) => `╔══ *SYSTÈME BOT* ══╗\n║ ⚡ *ZERO TRACE v5.0*\n╚══════════════════╝`,
    bullet: (cmd, desc) => `▷ \`${cmd}\`\n  _${desc}_`,
    footer: (p) => `\n╔══════════════════╗\n║ 🏠 \`${p}menu\` — accueil\n╚══════════════════╝\n> ⚡ _Zero Trace · Système_`,
  },
  cat_admin: {
    header: (cat) => `👑 *━━ ADMINISTRATION ━━*\n${cat.emoji} *${cat.title}*\n_Réservé aux administrateurs_`,
    bullet: (cmd, desc) => `⚜️ \`${cmd}\`\n    » _${desc}_`,
    footer: (p) => `\n✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦\n🏠 \`${p}menu\`\n> 👑 _Zero Trace · Admin_`,
  },
  cat_osint: {
    header: (cat) => `🔍 *[[ OSINT & RECONNAISSANCE ]]*\n\`> ZERO TRACE RECON MODULE\`\n_${cat.desc}_`,
    bullet: (cmd, desc) => `📡 \`${cmd}\`\n   ↳ _${desc}_`,
    footer: (p) => `\n- - - - - - - - - - - - -\n🏠 \`${p}menu\`\n> 🔍 _Zero Trace · OSINT_`,
  },
  cat_pentest: {
    header: (cat) => `💀 *▓▓▓ PENTEST ÉTHIQUE ▓▓▓*\n⚠️ _Réservé owner/sudo_\n▓▒░░░░░░░░░░░░░░░░░░░▒▓`,
    bullet: (cmd, desc) => `☠️ \`${cmd}\`\n   ∟ _${desc}_`,
    footer: (p) => `\n▓▒░░░░░░░░░░░░░░░░░░░▒▓\n🏠 \`${p}menu\`\n> 💀 _Zero Trace · Pentest_`,
  },
  cat_netsec: {
    header: (cat) => `🛰️ *⟨⟨ NETSEC & ANALYSE ⟩⟩*\n⟨⟨━━━━━━━━━━━━━━━━━━━━⟩⟩\n_${cat.desc}_`,
    bullet: (cmd, desc) => `📶 \`${cmd}\`\n    ⟩ _${desc}_`,
    footer: (p) => `\n⟨⟨━━━━━━━━━━━━━━━━━━━━⟩⟩\n🏠 \`${p}menu\`\n> 🛰️ _Zero Trace · NetSec_`,
  },
  cat_devtools: {
    header: (cat) => `💻 *$ DEVTOOLS --help*\n\`> ZERO TRACE DEV MODULE v5\`\n_${cat.desc}_`,
    bullet: (cmd, desc) => `$ \`${cmd}\`\n  // _${desc}_`,
    footer: (p) => `\n# # # # # # # # # # # #\n🏠 \`${p}menu\`\n> 💻 _Zero Trace · Dev_`,
  },
  cat_feedback: {
    header: (cat) => `💬 *〔 FEEDBACK & NOTES 〕*\n✨ _Ta voix compte !_\n${'·'.repeat(24)}`,
    bullet: (cmd, desc) => `📝 \`${cmd}\`\n   ↳ _${desc}_`,
    footer: (p) => `\n${'·'.repeat(24)}\n🏠 \`${p}menu\`\n> 💬 _Zero Trace · Feedback_`,
  },
};

const DEFAULT_STYLE = {
  header: (cat) => `${cat.emoji} *${cat.title}*\n━━━━━━━━━━━━━━━━━━━━━━`,
  bullet: (cmd, desc) => `▸ \`${cmd}\`\n  _${desc}_`,
  footer: (p) => `\n━━━━━━━━━━━━━━━━━━━━━━\n🏠 \`${p}menu\`\n> ⚡ _Zero Trace Bot_`,
};

async function sendCategoryMenu(sock, jid, msg, catId, prefix) {
  const cat = CATEGORIES[catId];
  if (!cat) return false;

  const style = CAT_STYLES[catId] || DEFAULT_STYLE;
  const lines = cat.cmds.map(c => style.bullet(c.cmd, c.desc)).join('\n\n');
  const fullText = `${style.header(cat)}\n\n${lines}\n${style.footer(prefix)}`;

  const imgPath = pickImage(catId);
  if (imgPath) {
    try {
      const buf  = fs.readFileSync(imgPath);
      const mime = imgPath.endsWith('.png') ? 'image/png' : 'image/jpeg';
      await sock.sendMessage(jid, { image: buf, caption: fullText, mimetype: mime }, { quoted: msg });
      return true;
    } catch (e) { /* fallback texte */ }
  }

  await sock.sendMessage(jid, { text: fullText }, { quoted: msg });
  return true;
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORT + ENREGISTREMENT DES COMMANDES
// ─────────────────────────────────────────────────────────────────────────────
module.exports = {
  name:        'help',
  aliases:     ['menu', 'aide'],
  description: 'Menu simple ZERO TRACE — navigation par chiffres',
  usage:       '.menu | .menu 1-7 | .menu cat_media',
  category:    'util',

  async execute(ctx) {
    const { sock, jid, msg, args, pushName } = ctx;
    const prefix = getPrefix(ctx);

    // .menu cat_xxx → sous-menu direct
    if (args[0] && CATEGORIES[args[0]]) {
      await sendCategoryMenu(sock, jid, msg, args[0], prefix);
      return;
    }

    // .menu 1..7 → navigation par numéro
    const num = parseInt(args[0]);
    if (!isNaN(num) && num >= 1 && num <= CAT_KEYS.length) {
      await sendCategoryMenu(sock, jid, msg, CAT_KEYS[num - 1], prefix);
      return;
    }

    await sendMainMenu(sock, jid, msg, prefix, pushName);
  },

  // Exposé pour handler.js
  sendCategoryMenu,
  sendMainMenu,
  CATEGORIES,
  CAT_KEYS,
};

// ─────────────────────────────────────────────────────────────────────────────
// COMMANDES .list* — Sous-menus directs (raccourcis manuels)
// ─────────────────────────────────────────────────────────────────────────────
function makeListCmd(catId, name, aliases) {
  return {
    name,
    aliases,
    description: `Sous-menu ${CATEGORIES[catId]?.title || catId}`,
    usage:       `.${name}`,
    category:    'util',
    async execute(ctx) {
      const { sock, jid, msg } = ctx;
      const prefix = getPrefix(ctx);
      await sendCategoryMenu(sock, jid, msg, catId, prefix);
    },
  };
}

module.exports.listmedia    = makeListCmd('cat_media',    'listmedia',    ['mediamenu']);
module.exports.listai       = makeListCmd('cat_ia',       'listai',       ['aimenu', 'iamenu']);
module.exports.listrpg      = makeListCmd('cat_jeux',     'listrpg',      ['rpgmenu', 'jeux']);
module.exports.listaudio    = makeListCmd('cat_audio',    'listaudio',    ['audiomenu', 'vocal']);
module.exports.listtools    = makeListCmd('cat_outils',   'listtools',    ['toolsmenu', 'outils']);
module.exports.listsystem   = makeListCmd('cat_bot',      'listsystem',   ['systemmenu', 'systeme']);
module.exports.listadmin    = makeListCmd('cat_admin',    'listadmin',    ['adminmenu']);
module.exports.listflex    = makeListCmd('cat_flex',     'listflex',    ['flexmenu', 'config']);
module.exports.listosint   = makeListCmd('cat_osint',    'listosint',   ['osintmenu', 'recon']);
module.exports.listpentest  = makeListCmd('cat_pentest',  'listpentest',  ['pentestmenu', 'hacking']);
module.exports.listnetsec   = makeListCmd('cat_netsec',   'listnetsec',   ['netsecmenu', 'reseau']);
module.exports.listdevtools = makeListCmd('cat_devtools', 'listdevtools', ['devmenu', 'devtools']);
module.exports.listfeedback = makeListCmd('cat_feedback', 'listfeedback', ['feedbackmenu', 'notes']);
