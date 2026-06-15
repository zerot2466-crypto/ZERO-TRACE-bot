/**
 * .password — Générateur de mot de passe sécurisé
 */
const crypto = require('crypto');
module.exports = {
  name: 'password',
  description: 'Générer un mot de passe sécurisé',
  usage: '.password [longueur] [type: simple|fort|ultra]',
  category: 'util',
  async execute(ctx) {
    const { sock, jid, msg, args, antiBan } = ctx;
    const longueur = parseInt(args[0]) || 16;
    const type = (args[1] || 'fort').toLowerCase();
    if (longueur < 4 || longueur > 64) {
      await antiBan.safeSend(sock, jid, { text: '❌ Longueur entre 4 et 64.' }, { msgOptions: { quoted: msg } });
      return;
    }
    let charset;
    if (type === 'simple')    charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    else if (type === 'ultra') charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
    else charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';

    let password = '';
    const bytes = crypto.randomBytes(longueur * 2);
    for (let i = 0; i < longueur; i++) {
      password += charset[bytes[i] % charset.length];
    }
    // Score de force
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNum   = /[0-9]/.test(password);
    const hasSpec  = /[^a-zA-Z0-9]/.test(password);
    const score    = [hasUpper, hasLower, hasNum, hasSpec].filter(Boolean).length;
    const force    = ['', '⚠️ Faible', '🟡 Moyen', '🟢 Fort', '🔒 Ultra-fort'][score];

    await antiBan.safeSend(sock, jid, {
      text: `🔐 *MOT DE PASSE GÉNÉRÉ*\n\n\`${password}\`\n\nLongueur : ${longueur} caractères\nForce : ${force}\nType : ${type}\n\n⚠️ Ne partage jamais ce message !`,
    }, { msgOptions: { quoted: msg } });
  },
};
