/**
 * ZERO TRACE BOT v5.0 — .pendu
 * Jeu du Pendu en groupe
 */
'use strict';
const fs   = require('fs-extra');
const path = require('path');

const DATA_FILE = path.join(__dirname, '..', 'data', 'pendu.json');
const MOTS = [
  'javascript','algorithme','intelligence','ordinateur','telephone',
  'whatsapp','cryptographie','programmation','botmaster','securite',
  'numerique','developpeur','communaute','administrateur','technologie',
  'surveillance','authentification','interface','bibliotheque','framework',
  'reseau','protocole','serveur','database','commande','variable','fonction',
  'boucle','condition','tableau','objet','classe','module','package','erreur',
];

const PENDU_ART = [
  '  +---+\n  |   |\n      |\n      |\n      |\n      |\n=========',
  '  +---+\n  |   |\n  O   |\n      |\n      |\n      |\n=========',
  '  +---+\n  |   |\n  O   |\n  |   |\n      |\n      |\n=========',
  '  +---+\n  |   |\n  O   |\n /|   |\n      |\n      |\n=========',
  '  +---+\n  |   |\n  O   |\n /|\\  |\n      |\n      |\n=========',
  '  +---+\n  |   |\n  O   |\n /|\\  |\n /    |\n      |\n=========',
  '  +---+\n  |   |\n  O   |\n /|\\  |\n / \\  |\n      |\n=========',
];

function load() { try { return fs.readJsonSync(DATA_FILE); } catch { return {}; } }
function save(d) { fs.ensureDirSync(path.dirname(DATA_FILE)); fs.writeJsonSync(DATA_FILE, d, { spaces: 2 }); }

function affiche(partie) {
  const mot = partie.mot.split('').map(l => partie.trouvees.includes(l) ? l : '_').join(' ');
  const ratees = partie.ratees.length ? partie.ratees.join(' ') : 'aucune';
  return `\`\`\`\n${PENDU_ART[partie.erreurs]}\`\`\`\n\n` +
    `🔤 Mot : *${mot}*\n` +
    `❌ Lettres ratées (${partie.erreurs}/6) : ${ratees}\n` +
    `💡 Tape *.pendu [lettre]* pour deviner`;
}

module.exports = {
  name: 'pendu',
  description: 'Jeu du Pendu dans le groupe',
  usage: '.pendu | .pendu [lettre] | .pendu stop',
  category: 'fun',

  async execute(ctx) {
    const { sock, jid, msg, args, antiBan, pushName } = ctx;
    const parties = load();
    const lettre  = args[0]?.toLowerCase();

    // Stop
    if (lettre === 'stop') {
      if (!parties[jid]) {
        await antiBan.safeSend(sock, jid, { text: '❌ Aucune partie en cours.' }, { msgOptions: { quoted: msg } });
        return;
      }
      const mot = parties[jid].mot;
      delete parties[jid]; save(parties);
      await antiBan.safeSend(sock, jid, { text: `🛑 Partie arrêtée.\nLe mot était : *${mot}*` }, { msgOptions: { quoted: msg } });
      return;
    }

    // Nouvelle partie
    if (!lettre) {
      if (parties[jid]) {
        await antiBan.safeSend(sock, jid, { text: `⚠️ Une partie est déjà en cours !\n\n${affiche(parties[jid])}` }, { msgOptions: { quoted: msg } });
        return;
      }
      const mot = MOTS[Math.floor(Math.random() * MOTS.length)];
      parties[jid] = { mot, trouvees: [], ratees: [], erreurs: 0, starter: pushName };
      save(parties);
      await antiBan.safeSend(sock, jid, {
        text: `🎮 *PENDU — Partie lancée par ${pushName}*\nMot de *${mot.length}* lettres\n\n${affiche(parties[jid])}`,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    // Deviner
    if (!parties[jid]) {
      await antiBan.safeSend(sock, jid, { text: '❌ Aucune partie en cours. Tape *.pendu* pour commencer !' }, { msgOptions: { quoted: msg } });
      return;
    }
    if (!/^[a-z]$/.test(lettre)) {
      await antiBan.safeSend(sock, jid, { text: '❌ Une seule lettre à la fois (a-z).' }, { msgOptions: { quoted: msg } });
      return;
    }

    const p = parties[jid];
    if (p.trouvees.includes(lettre) || p.ratees.includes(lettre)) {
      await antiBan.safeSend(sock, jid, { text: `⚠️ *${lettre.toUpperCase()}* a déjà été proposée !` }, { msgOptions: { quoted: msg } });
      return;
    }

    if (p.mot.includes(lettre)) {
      p.trouvees.push(lettre);
      const gagne = p.mot.split('').every(l => p.trouvees.includes(l));
      save(parties);
      if (gagne) {
        delete parties[jid]; save(parties);
        await antiBan.safeSend(sock, jid, {
          text: `🏆 *BRAVO ${pushName} !*\nLe mot était bien *${p.mot.toUpperCase()}* !\n\n> _ZERO TRACE 😈_`,
        }, { msgOptions: { quoted: msg } });
      } else {
        await antiBan.safeSend(sock, jid, {
          text: `✅ Bonne lettre *${lettre.toUpperCase()}* !\n\n${affiche(p)}`,
        }, { msgOptions: { quoted: msg } });
      }
    } else {
      p.ratees.push(lettre); p.erreurs++;
      save(parties);
      if (p.erreurs >= 6) {
        const mot = p.mot;
        delete parties[jid]; save(parties);
        await antiBan.safeSend(sock, jid, {
          text: `💀 *PENDU !* Le mot était *${mot.toUpperCase()}*\n\n\`\`\`\n${PENDU_ART[6]}\`\`\`\n\n> _ZERO TRACE 😈_`,
        }, { msgOptions: { quoted: msg } });
      } else {
        await antiBan.safeSend(sock, jid, {
          text: `❌ *${lettre.toUpperCase()}* n'est pas dans le mot !\n\n${affiche(p)}`,
        }, { msgOptions: { quoted: msg } });
      }
    }
  },
};
