/**
 * ZERO TRACE BOT v5.0 — botlang.js
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Changer la langue de l'interface du bot
 *
 * Commandes :
 *   .lang           — langue actuelle
 *   .lang fr        — français
 *   .lang en        — anglais
 *   .lang ar        — arabe
 *   .lang es        — espagnol
 */
'use strict';

const fs   = require('fs-extra');
const path = require('path');

const LANG_FILE = path.join(__dirname, '../data/lang.json');

const LANGS = {
  fr: {
    name:     'Français',
    flag:     '🇫🇷',
    welcome:  'Bienvenue',
    bye:      'Au revoir',
    error:    'Erreur',
    success:  'Succès',
    denied:   '🔒 Accès refusé.',
    unknown:  'Commande inconnue. Tape `.menu`',
    activate: 'Bot activé',
    sleep:    'Bot en veille',
  },
  en: {
    name:     'English',
    flag:     '🇬🇧',
    welcome:  'Welcome',
    bye:      'Goodbye',
    error:    'Error',
    success:  'Success',
    denied:   '🔒 Access denied.',
    unknown:  'Unknown command. Type `.menu`',
    activate: 'Bot activated',
    sleep:    'Bot sleeping',
  },
  ar: {
    name:     'العربية',
    flag:     '🇸🇦',
    welcome:  'مرحباً',
    bye:      'وداعاً',
    error:    'خطأ',
    success:  'نجاح',
    denied:   '🔒 الوصول مرفوض.',
    unknown:  'أمر غير معروف. اكتب `.menu`',
    activate: 'البوت نشط',
    sleep:    'البوت في وضع السكون',
  },
  es: {
    name:     'Español',
    flag:     '🇪🇸',
    welcome:  'Bienvenido',
    bye:      'Adiós',
    error:    'Error',
    success:  'Éxito',
    denied:   '🔒 Acceso denegado.',
    unknown:  'Comando desconocido. Escribe `.menu`',
    activate: 'Bot activado',
    sleep:    'Bot en espera',
  },
};

function getLang() {
  try {
    const d = fs.readJsonSync(LANG_FILE);
    return LANGS[d.current] ? d.current : 'fr';
  } catch { return 'fr'; }
}

function getLangData(code) {
  return LANGS[code] || LANGS.fr;
}

function setLang(code) {
  fs.ensureDirSync(path.dirname(LANG_FILE));
  fs.writeJsonSync(LANG_FILE, { current: code }, { spaces: 2 });
}

module.exports = {
  name:    'lang',
  aliases: ['language', 'langue', 'setlang'],
  getLang,
  getLangData,
  LANGS,

  execute: async (ctx) => {
    const { sock, jid, msg, args, antiBan, isOwner, isSudo } = ctx;
    const BOT_TAG = '> ⚡ _ZERO TRACE BOT v5.0_';

    if (!isOwner && !isSudo) {
      await antiBan.safeSend(sock, jid, {
        text: '🔒 Réservé owner/sudo.\n\n' + BOT_TAG,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    const sub     = (args[0] || '').toLowerCase();
    const current = getLang();

    if (!sub) {
      const list = Object.entries(LANGS).map(([code, l]) =>
        `${code === current ? '✅' : '◾'} ${l.flag} *${l.name}* (\`${code}\`)`
      ).join('\n');
      await antiBan.safeSend(sock, jid, {
        text:
          `🌍 *LANGUE DU BOT*\n━━━━━━━━━━━━━━━━━━━━━━\n\n` +
          `${list}\n\n` +
          `Actuelle : *${LANGS[current]?.flag} ${LANGS[current]?.name}*\n\n` +
          `Changer : \`.lang [code]\`\n\n` + BOT_TAG,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    if (!LANGS[sub]) {
      await antiBan.safeSend(sock, jid, {
        text: `❌ Langue *${sub}* non supportée.\nDisponibles : ${Object.keys(LANGS).join(', ')}\n\n` + BOT_TAG,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    setLang(sub);
    const l = LANGS[sub];
    await antiBan.safeSend(sock, jid, {
      text:
        `${l.flag} *Langue changée : ${l.name}*\n\n` +
        `${l.welcome} ! Le bot parle maintenant en ${l.name}.\n\n` + BOT_TAG,
    }, { msgOptions: { quoted: msg } });
  },
};
