/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║        ZERO TRACE BOT v5.0 — Toutes les clés              ║
 * ║  Un seul fichier à modifier — plus besoin de .env          ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * ✅ = obligatoire   🔶 = optionnel (le bot tourne sans)
 */

module.exports = {

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 1. CONFIGURATION PRINCIPALE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  OWNER_NUMBER:       '22656354706',   // ✅ Ton numéro (VERROUILLÉ)
  PAIRING_NUMBER:     '22656354706',   // ✅ Numéro du compte bot WhatsApp
  PREFIX:             '.',              // ✅ Préfixe par défaut
  CONNECTION_MODE:    'pairing',        // ✅ Mode connexion: pairing ou qr

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 2. SERVEUR PAIRING
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  PAIR_PORT:            '3000',
  PAIR_HOST:            '',             // 🔶 URL publique Render/Railway — vide si local
  PAIR_ALLOWED_ORIGIN:  '',             // 🔶 Domaine Netlify de ta page pair.html

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 3. IA — 3 PROVIDERS ACTIFS ✅
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  OPENROUTER_API_KEY: 'VOTRE_CLE_OPENROUTER',
  GROQ_API_KEY:       'VOTRE_CLE_GROQ',
  CEREBRAS_API_KEY:   'VOTRE_CLE_CEREBRAS',

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 4. VOCAL / TTS 🔶
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ELEVENLABS_API_KEY: 'VOTRE_CLE_ELEVENLABS',
  VOICERSS_API_KEY:   'VOTRE_CLE_VOICERSS',

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 5. RECHERCHE & MÉDIAS 🔶
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  GOOGLE_CSE_KEY:     'VOTRE_CLE_GOOGLE_CSE',
  GOOGLE_CSE_CX:      'VOTRE_ID_GOOGLE_CX',
  GOOGLE_SAFEBROWSING_KEY: 'VOTRE_CLE_SAFEBROWSING',
  GNEWS_API_KEY:      'VOTRE_CLE_GNEWS',
  NASA_API_KEY:       'DEMO_KEY',
  GIPHY_API_KEY:      'dc6zaTOxFJmzC',

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 6. SÉCURITÉ / OSINT 🔶
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  VIRUSTOTAL_API_KEY: 'VOTRE_CLE_VIRUSTOTAL',
  URLSCAN_API_KEY:    'VOTRE_CLE_URLSCAN',
  HIBP_API_KEY:       'VOTRE_CLE_HIBP',
  APIFOOTBALL_KEY:    'VOTRE_CLE_APIFOOTBALL',

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 7. IMAGE & VIDÉO 🔶
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  REMOVEBG_API_KEY:   'VOTRE_CLE_REMOVEBG',
  IMAGE_API_URL:      'https://image.pollinations.ai/prompt/',
  VIDEO_API_URL:      '',
  VIDEO_API_KEY:      '',

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 8. LIENS & CONFIG 🔶
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  CHANNEL_LINK:       'https://whatsapp.com/channel/0029VbCEDif84OmANqy2xI0X',
  GITHUB_LINK:        '',
  MENU_GIF_URL:       '',

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 9. ANTI-SPAM
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  RATELIMIT_ENABLED:   'true',
  RATELIMIT_MAX:       '2',
  RATELIMIT_WINDOW_MS: '30000',
  MAX_MESSAGES_PER_MINUTE: '20',
  COOLDOWN_MS:         '5000',
};
