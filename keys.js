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
  OWNER_NUMBER:       '260956849240',   // ✅ Ton numéro (sans + ni espaces)
  PAIRING_NUMBER:     '260956849240',   // ✅ Numéro du compte bot WhatsApp
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
  OPENROUTER_API_KEY: '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',
  GROQ_API_KEY:       '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',
  CEREBRAS_API_KEY:   'csk-mnmctheptv8xvwk2jv5cvfch955wh25n542r326fh8p4cey3',

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 4. VOCAL / TTS 🔶
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ELEVENLABS_API_KEY: 'sk_bc9e5c75c62c3a6eb6cc52f62337a809f3bf425939414579',
  VOICERSS_API_KEY:   '34f775b0536546abbf0939caee6efa6a',

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 5. RECHERCHE & MÉDIAS 🔶
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  GOOGLE_CSE_KEY:     'AIzaSyBc2xng1ev_NIO5FGw2LQKQFbpplVnyXoM',  // Google Custom Search
  GOOGLE_CSE_CX:      '65608aa60082a4b84',
  GOOGLE_SAFEBROWSING_KEY: 'AIzaSyBc2xng1ev_NIO5FGw2LQKQFbpplVnyXoM',
  GNEWS_API_KEY:      'f7796251f82ab91d06f93eb051fd7d6f',           // Actualités
  NASA_API_KEY:       'DEMO_KEY',                                    // NASA (gratuit sans clé)
  GIPHY_API_KEY:      'dc6zaTOxFJmzC',                              // GIFs

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 6. SÉCURITÉ / OSINT 🔶
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  VIRUSTOTAL_API_KEY: '',              // https://virustotal.com → Profil → API Key
  URLSCAN_API_KEY:    '019e7d2c-d858-77af-9fd4-8f2edf923377',
  HIBP_API_KEY:       '',             // https://haveibeenpwned.com/API/Key
  APIFOOTBALL_KEY:    '',             // https://apifootball.com → Dashboard → API Key

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 7. IMAGE & VIDÉO 🔶
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  REMOVEBG_API_KEY:   'ezYf7qXQRN5VREAzH8WRTv43',
  IMAGE_API_URL:      'https://image.pollinations.ai/prompt/',      // Gratuit par défaut
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
