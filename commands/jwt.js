/**
 * ZERO TRACE BOT v5.0 — jwt.js
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Décoder et analyser un token JWT (header, payload, expiration, algo)
 * Owner/sudo uniquement
 *
 * Commandes :
 *   .jwt [token]        — décoder et analyser un JWT
 *   .jwt crack [token]  — tester des secrets communs (brute force léger)
 */
'use strict';

const crypto  = require('crypto');
const BOT_TAG = '> ⚡ _ZERO TRACE BOT v5.0 — JWT_';

function guard(ctx) { return ctx.isOwner || ctx.isSudo || ctx.msg?.key?.fromMe; }

// ── Décoder base64url sans librairie externe ──────────────────────────────────
function b64urlDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  return Buffer.from(str, 'base64').toString('utf8');
}

// ── Parser un JWT ─────────────────────────────────────────────────────────────
function parseJWT(token) {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Format invalide — un JWT a exactement 3 parties séparées par des points');

  let header, payload;
  try { header  = JSON.parse(b64urlDecode(parts[0])); } catch { throw new Error('Header JWT invalide (base64url corrompu)'); }
  try { payload = JSON.parse(b64urlDecode(parts[1])); } catch { throw new Error('Payload JWT invalide (base64url corrompu)'); }

  return { header, payload, signature: parts[2], raw: parts };
}

// ── Vérifier signature HMAC ───────────────────────────────────────────────────
function verifyHMAC(parts, secret, algo) {
  const algMap = { HS256: 'sha256', HS384: 'sha384', HS512: 'sha512' };
  const hashAlgo = algMap[algo];
  if (!hashAlgo) return null;

  const data = `${parts[0]}.${parts[1]}`;
  const sig  = crypto.createHmac(hashAlgo, secret).update(data).digest('base64url');
  return sig === parts[2];
}

// ── Formater une date timestamp ───────────────────────────────────────────────
function fmtTs(ts) {
  if (!ts) return 'N/A';
  try {
    return new Date(ts * 1000).toLocaleString('fr-FR');
  } catch { return String(ts); }
}

// ── Secrets courants à tester ─────────────────────────────────────────────────
const COMMON_SECRETS = [
  'secret', 'password', '123456', 'qwerty', 'admin', 'test',
  'jwt_secret', 'mysecret', 'changeme', 'supersecret', 'your_secret_key',
  'dev', 'prod', 'staging', 'app_secret', 'jwt', 'key', 'private_key',
  'secretkey', 'jwttoken', 'token_secret', 'myapp', 'hello', 'world',
  '1234567890', 'abcdefgh', 'secret123', 'password123', 'admin123',
];

module.exports = {
  name:    'jwt',
  aliases: ['jwtdecode', 'jwtanalyse', 'tokendecode'],

  execute: async (ctx) => {
    if (!guard(ctx)) {
      await ctx.antiBan.safeSend(ctx.sock, ctx.jid, {
        text: '🔒 Commande réservée au *propriétaire* et aux *sudos*.\n\n' + BOT_TAG,
      }, { msgOptions: { quoted: ctx.msg } });
      return;
    }

    const { sock, jid, msg, args, antiBan } = ctx;

    // Récupérer le token (args ou message cité)
    const quoted    = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const quotedTxt = quoted?.conversation || quoted?.extendedTextMessage?.text || '';
    const sub       = (args[0] || '').toLowerCase();

    // ── .jwt crack [token] ────────────────────────────────────────────────────
    if (sub === 'crack') {
      const token = (args[1] || quotedTxt).trim();
      if (!token) {
        await antiBan.safeSend(sock, jid, {
          text: '🔓 Usage : `.jwt crack [token]`\nOu réponds à un message contenant le token.\n\n' + BOT_TAG,
        }, { msgOptions: { quoted: msg } });
        return;
      }

      try {
        const { header, raw } = parseJWT(token);
        const algo = header.alg || 'HS256';

        if (!algo.startsWith('HS')) {
          await antiBan.safeSend(sock, jid, {
            text: `⚠️ Algo *${algo}* — le brute force HMAC ne s'applique qu'aux algos HS256/HS384/HS512.\n\n` + BOT_TAG,
          }, { msgOptions: { quoted: msg } });
          return;
        }

        await antiBan.safeSend(sock, jid, {
          text: `🔓 _Test de ${COMMON_SECRETS.length} secrets courants..._`,
        }, { msgOptions: { quoted: msg } });

        let found = null;
        for (const secret of COMMON_SECRETS) {
          if (verifyHMAC(raw, secret, algo)) { found = secret; break; }
        }

        if (found) {
          await antiBan.safeSend(sock, jid, {
            text:
              `🚨 *JWT CRACK — Secret trouvé !*\n` +
              `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
              `🔑 Secret : *${found}*\n` +
              `📡 Algo   : ${algo}\n\n` +
              `⚠️ Ce JWT utilise un secret faible — vulnérable !\n\n` + BOT_TAG,
          }, { msgOptions: { quoted: msg } });
        } else {
          await antiBan.safeSend(sock, jid, {
            text:
              `✅ *JWT CRACK — Non trouvé*\n\n` +
              `Secret absent des ${COMMON_SECRETS.length} plus communs.\n` +
              `_Utilise hashcat ou jwt_tool pour un brute force plus poussé._\n\n` + BOT_TAG,
          }, { msgOptions: { quoted: msg } });
        }
      } catch (e) {
        await antiBan.safeSend(sock, jid, { text: `❌ ${e.message}\n\n` + BOT_TAG }, { msgOptions: { quoted: msg } });
      }
      return;
    }

    // ── .jwt [token] — décoder ────────────────────────────────────────────────
    const token = args.join(' ').trim() || quotedTxt.trim();

    if (!token) {
      await antiBan.safeSend(sock, jid, {
        text:
          '🔐 *JWT DECODER*\n\n' +
          'Usage :\n' +
          '• `.jwt [token]` — décoder\n' +
          '• `.jwt crack [token]` — tester les secrets communs\n\n' +
          'Ou réponds à un message contenant le token.\n\n' + BOT_TAG,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    try {
      const { header, payload } = parseJWT(token);

      const now     = Math.floor(Date.now() / 1000);
      const exp     = payload.exp;
      const iat     = payload.iat;
      const nbf     = payload.nbf;
      const expired = exp ? now > exp : null;
      const age     = iat ? Math.floor((now - iat) / 60) : null;

      // Champs importants du payload
      const knownFields = ['sub', 'iss', 'aud', 'email', 'name', 'role', 'roles',
                           'scope', 'permissions', 'userId', 'user_id', 'id'];
      const important = knownFields
        .filter(k => payload[k] !== undefined)
        .map(k => `  ${k} : \`${JSON.stringify(payload[k]).slice(0, 60)}\``)
        .join('\n');

      // Tous les autres champs custom
      const customFields = Object.keys(payload)
        .filter(k => !['exp','iat','nbf',...knownFields].includes(k))
        .map(k => `  ${k} : \`${JSON.stringify(payload[k]).slice(0, 40)}\``)
        .join('\n');

      // Risques détectés
      const risks = [];
      if (header.alg === 'none')                     risks.push('🚨 Algo "none" — signature ignorée !');
      if (header.alg?.startsWith('HS') && !expired)  risks.push('⚠️ HMAC symétrique — secret potentiellement brutable');
      if (expired)                                    risks.push('🔴 Token EXPIRÉ');
      if (!exp)                                       risks.push('⚠️ Pas d\'expiration définie');
      if (payload.role === 'admin' || payload.roles?.includes('admin')) risks.push('🎯 Rôle admin détecté');

      await antiBan.safeSend(sock, jid, {
        text:
          `🔐 *JWT DECODER*\n` +
          `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
          `📋 *Header :*\n` +
          `  Algo : \`${header.alg || 'N/A'}\`\n` +
          `  Type : \`${header.typ || 'N/A'}\`\n` +
          (header.kid ? `  Kid  : \`${header.kid}\`\n` : '') +
          `\n📦 *Payload :*\n` +
          (important ? `${important}\n` : '') +
          (customFields ? `${customFields}\n` : '') +
          `\n⏱️ *Dates :*\n` +
          `  Émis    : ${fmtTs(iat)}${age !== null ? ` (il y a ${age} min)` : ''}\n` +
          `  Expire  : ${fmtTs(exp)} ${expired === true ? '🔴 EXPIRÉ' : expired === false ? '✅ Valide' : ''}\n` +
          (nbf ? `  Valide dès : ${fmtTs(nbf)}\n` : '') +
          (risks.length ? `\n⚡ *Risques :*\n${risks.map(r => `  ${r}`).join('\n')}\n` : '\n✅ Aucun risque évident\n') +
          `\n💡 \`.jwt crack [token]\` pour tester les secrets\n\n` + BOT_TAG,
      }, { msgOptions: { quoted: msg } });

    } catch (e) {
      await antiBan.safeSend(sock, jid, {
        text: `❌ JWT invalide : \`${e.message}\`\n\n` + BOT_TAG,
      }, { msgOptions: { quoted: msg } });
    }
  },
};
