/**
 * ZERO TRACE BOT v5.0 — .quiz
 * Quiz questions/réponses avec score
 */
'use strict';
const fs   = require('fs-extra');
const path = require('path');

const DATA_FILE = path.join(__dirname, '..', 'data', 'quiz.json');

const QUESTIONS = [
  { q: "Quel est le résultat de 2^10 ?", r: ["1024"], hint: "Un nombre proche de 1000" },
  { q: "Quel langage de programmation utilise WhatsApp Bot Baileys ?", r: ["javascript","js","node","nodejs","node.js"], hint: "Le langage du web côté serveur" },
  { q: "Combien de bits dans un octet ?", r: ["8"], hint: "Moins de 10" },
  { q: "Quelle est la capitale du Sénégal ?", r: ["dakar"], hint: "Ville côtière" },
  { q: "Quelle est la capitale de la Côte d'Ivoire ?", r: ["yamoussoukro","abidjan"], hint: "2 réponses possibles" },
  { q: "Quel est le protocole sécurisé du web ?", r: ["https"], hint: "HTTP mais avec un S" },
  { q: "Combien font 0xFF en décimal ?", r: ["255"], hint: "Valeur max d'un octet" },
  { q: "Quel symbole représente un commentaire en JavaScript ?", r: ["//","/*"], hint: "Double slash" },
  { q: "Quel opérateur logique signifie ET en JS ?", r: ["&&"], hint: "Double esperluette" },
  { q: "Quel est le plus grand océan du monde ?", r: ["pacifique"], hint: "Calme en latin" },
  { q: "Combien de continents sur Terre ?", r: ["7"], hint: "Plus de 5" },
  { q: "Quel pays a le plus grand réseau 5G au monde ?", r: ["chine"], hint: "Asie de l'Est" },
  { q: "En quelle année WhatsApp a été racheté par Facebook ?", r: ["2014"], hint: "Entre 2013 et 2015" },
  { q: "Combien de zéros dans un milliard ?", r: ["9"], hint: "1 000 000 000" },
  { q: "Quel est le résultat de typeof null en JS ?", r: ["object"], hint: "Un bug historique de JS" },
  { q: "Quelle commande Git initialise un dépôt ?", r: ["git init"], hint: "Commence par git" },
  { q: "Quel port utilise HTTPS par défaut ?", r: ["443"], hint: "Entre 400 et 500" },
  { q: "Combien de Mbps dans 1 Gbps ?", r: ["1000"], hint: "Kilo = 1000" },
  { q: "Quel est le symbole chimique de l'or ?", r: ["au"], hint: "Aurum en latin" },
  { q: "En quelle année a été fondé Google ?", r: ["1998"], hint: "Fin des années 90" },
];

function load() { try { return fs.readJsonSync(DATA_FILE); } catch { return {}; } }
function save(d) { fs.ensureDirSync(path.dirname(DATA_FILE)); fs.writeJsonSync(DATA_FILE, d, { spaces: 2 }); }

module.exports = {
  name: 'quiz',
  description: 'Quiz questions/réponses avec score',
  usage: '.quiz | .quiz [réponse] | .quiz score | .quiz hint',
  category: 'fun',

  async execute(ctx) {
    const { sock, jid, msg, args, antiBan, pushName, sender } = ctx;
    const data = load();
    const sub  = args[0]?.toLowerCase();

    // Scores
    if (sub === 'score' || sub === 'scores') {
      const scores = data.scores || {};
      if (!Object.keys(scores).length) {
        await antiBan.safeSend(sock, jid, { text: '📊 Aucun score encore enregistré.' }, { msgOptions: { quoted: msg } });
        return;
      }
      const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]).slice(0, 10);
      const txt = sorted.map(([n, s], i) => `${i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`} *${n}* — ${s} pt${s > 1 ? 's' : ''}`).join('\n');
      await antiBan.safeSend(sock, jid, { text: `🏆 *CLASSEMENT QUIZ*\n\n${txt}\n\n> _ZERO TRACE 😈_` }, { msgOptions: { quoted: msg } });
      return;
    }

    // Hint
    if (sub === 'hint' || sub === 'indice') {
      const q = data[jid];
      if (!q) { await antiBan.safeSend(sock, jid, { text: '❌ Aucune question en cours. Tape *.quiz*' }, { msgOptions: { quoted: msg } }); return; }
      await antiBan.safeSend(sock, jid, { text: `💡 *Indice :* ${QUESTIONS[q.idx].hint}` }, { msgOptions: { quoted: msg } });
      return;
    }

    // Réponse proposée
    if (data[jid] && sub && sub !== 'stop') {
      const q = data[jid];
      const reponse = args.join(' ').toLowerCase().trim();
      const correct = QUESTIONS[q.idx].r.map(r => r.toLowerCase());
      if (correct.includes(reponse)) {
        data.scores = data.scores || {};
        data.scores[pushName] = (data.scores[pushName] || 0) + 1;
        delete data[jid]; save(data);
        await antiBan.safeSend(sock, jid, {
          text: `✅ *BONNE RÉPONSE ${pushName} !* +1 point 🎉\n\nRéponse : *${correct[0].toUpperCase()}*\n\n🏅 Score : *${data.scores?.[pushName] || 1} pt(s)*\n\nTape *.quiz* pour la prochaine question !`,
        }, { msgOptions: { quoted: msg } });
      } else {
        await antiBan.safeSend(sock, jid, { text: `❌ Mauvaise réponse *${pushName}* ! Réessaie ou tape *.quiz hint* pour un indice.` }, { msgOptions: { quoted: msg } });
      }
      return;
    }

    // Stop
    if (sub === 'stop') {
      if (!data[jid]) { await antiBan.safeSend(sock, jid, { text: '❌ Aucune question en cours.' }, { msgOptions: { quoted: msg } }); return; }
      const rep = QUESTIONS[data[jid].idx].r[0];
      delete data[jid]; save(data);
      await antiBan.safeSend(sock, jid, { text: `🛑 Quiz stoppé. La réponse était : *${rep.toUpperCase()}*` }, { msgOptions: { quoted: msg } });
      return;
    }

    // Nouvelle question
    const idx = Math.floor(Math.random() * QUESTIONS.length);
    data[jid] = { idx, askedBy: pushName, at: Date.now() };
    save(data);
    await antiBan.safeSend(sock, jid, {
      text: `🧠 *QUIZ — Question de ${pushName}*\n\n❓ ${QUESTIONS[idx].q}\n\n💬 Réponds avec *.quiz [ta réponse]*\n💡 Indice : *.quiz hint*\n📊 Scores : *.quiz score*`,
    }, { msgOptions: { quoted: msg } });
  },
};
