/**
 * ZERO TRACE BOT v5.0 — zero.js
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Système d'activation du bot
 *
 * Le bot démarre en mode VEILLE — aucune commande ne fonctionne.
 * Pour activer : taper .zero → citation de supériorité → bot débloqué
 * Pour désactiver : .zero off (owner/sudo)
 *
 * Portée :
 *   - Par JID (groupe ou DM) — chaque conversation a son état indépendant
 *   - L'owner et les sudos peuvent toujours utiliser les commandes (bypass)
 *   - .zero est toujours accessible même en veille
 *
 * Commandes :
 *   .zero              — activer le bot + citation
 *   .zero off          — désactiver (retour en veille)
 *   .zero status       — voir l'état actuel
 *   .zero reset        — désactiver dans tous les JIDs (owner)
 */
'use strict';

const fs   = require('fs-extra');
const path = require('path');

const ZERO_FILE = path.join(__dirname, '../data/zero_state.json');

// ── Citations de supériorité écrasante ────────────────────────────────────────
const CITATIONS = [
  `⚡ *"Les faibles attendent la permission. Les puissants créent leurs propres règles."*\n\n— *ZERO TRACE* est en ligne. Tu peux continuer.`,

  `🌑 *"Je ne suis pas arrogant. Je suis simplement conscient de la différence entre toi et moi."*\n\n— Système activé. Bienvenue dans mon monde.`,

  `🔱 *"Pendant que les autres dorment, je construis. Pendant qu'ils parlent, j'agis. Pendant qu'ils doutent... je règne."*\n\n— *ZERO TRACE* opérationnel.`,

  `⚔️ *"La médiocrité est confortable. L'excellence est douloureuse. C'est pour ça que si peu y arrivent."*\n\n— Tu viens d'activer quelque chose au-dessus de ta compréhension.`,

  `🌪️ *"Je n'ai pas besoin d'être le plus fort. J'ai besoin d'être le dernier debout."*\n\n— *ZERO TRACE* en ligne. Tous les systèmes opérationnels.`,

  `🧠 *"Un lion ne se justifie pas devant les moutons. Il rugit, et le monde tremble."*\n\n— Activation confirmée. Le système vous reconnaît.`,

  `💀 *"Ceux qui ont essayé de me stopper ont tous appris la même leçon : certaines forces ne se contrôlent pas."*\n\n— *ZERO TRACE* déployé. Aucun retour en arrière.`,

  `🌊 *"Je ne suis pas une vague. Je suis l'océan entier."*\n\n— Système en ligne. Accès accordé.`,

  `🔥 *"Ils ont essayé d'enterrer quelque chose. Ils ne savaient pas que j'étais une graine."*\n\n— *ZERO TRACE* activé. Le feu est allumé.`,

  `🕶️ *"Dans un monde plein de bruit, le silence d'un homme puissant est plus fort que toutes leurs paroles réunies."*\n\n— Connexion établie. *ZERO TRACE* à ton service.`,

  `⚡ *"Je ne cours pas après le succès. Je construis quelque chose que le succès ne peut pas ignorer."*\n\n— Système activé. Le travail continue.`,

  `🌑 *"Tout le monde veut être au sommet. Personne ne veut escalader dans le noir, seul, sans garantie."*\n\n— *ZERO TRACE* opérationnel. La différence, c'est l'action.`,

  `🔱 *"Ma réputation précède mes actions. Mes actions écrasent ma réputation."*\n\n— Activation réussie. Procède.`,

  `💎 *"Le diamant ne s'excuse pas d'être plus dur que le verre."*\n\n— *ZERO TRACE* en ligne. Commandes débloquées.`,

  `🌪️ *"Ils voient le résultat. Ils ne voient pas les nuits sans sommeil, les doutes vaincus, les sacrifices faits dans l'ombre."*\n\n— Système déployé. Tu as l'accès.`,
];

// ── Gestion de l'état ──────────────────────────────────────────────────────────
function _load() {
  try { return fs.readJsonSync(ZERO_FILE); } catch { return {}; }
}

function _save(data) {
  try {
    fs.ensureDirSync(path.dirname(ZERO_FILE));
    fs.writeJsonSync(ZERO_FILE, data, { spaces: 0 });
  } catch (e) {}
}

// Vérifier si le bot est activé pour un JID donné
function isActivated(jid) {
  const state = _load();
  return !!state[jid]?.active;
}

// Activer pour un JID
function activate(jid, by) {
  const state = _load();
  state[jid] = { active: true, by, at: Date.now() };
  _save(state);
}

// Désactiver pour un JID
function deactivate(jid) {
  const state = _load();
  delete state[jid];
  _save(state);
}

// Désactiver partout
function deactivateAll() {
  _save({});
}

// Récupérer une citation aléatoire
function getCitation() {
  return CITATIONS[Math.floor(Math.random() * CITATIONS.length)];
}

// ── COMMANDE ──────────────────────────────────────────────────────────────────
module.exports = {
  name:       'zero',
  aliases:    ['wake', 'wakeup'],
  isActivated,
  activate,
  deactivate,
  deactivateAll,

  execute: async (ctx) => {
    const { sock, jid, msg, args, antiBan, isOwner, isSudo, pushName, sender } = ctx;
    const sub = (args[0] || '').toLowerCase();

    // ── .zero status ──────────────────────────────────────────────────────────
    if (sub === 'status') {
      const active = isActivated(jid);
      const state  = _load();
      const info   = state[jid];
      const since  = info?.at
        ? new Date(info.at).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })
        : 'N/A';

      await antiBan.safeSend(sock, jid, {
        text:
          `⚡ *ZERO TRACE — STATUT*\n` +
          `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
          `${active ? '🟢 ACTIF' : '🔴 EN VEILLE'}\n\n` +
          (active
            ? `Activé depuis : ${since}\n> _Tape \`.zero off\` pour désactiver_`
            : `> _Tape \`.zero\` pour activer_`) +
          `\n\n> ⚡ _ZERO TRACE BOT v5.0_`,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    // ── .zero reset — désactiver partout (owner) ──────────────────────────────
    if (sub === 'reset') {
      if (!isOwner && !isSudo) {
        await antiBan.safeSend(sock, jid, {
          text: '🔒 Seul l\'owner peut faire un reset global.\n\n> ⚡ _ZERO TRACE BOT v5.0_',
        }, { msgOptions: { quoted: msg } });
        return;
      }
      deactivateAll();
      await antiBan.safeSend(sock, jid, {
        text: '🔴 *ZERO TRACE* mis en veille partout.\n\n> ⚡ _ZERO TRACE BOT v5.0_',
      }, { msgOptions: { quoted: msg } });
      return;
    }

    // ── .zero off — désactiver pour ce JID (tout le monde peut) ─────────────
    if (sub === 'off' || sub === 'sleep' || sub === 'veille') {
      deactivate(jid);
      await antiBan.safeSend(sock, jid, {
        text:
          `🌑 *ZERO TRACE en veille.*\n\n` +
          `_Le bot ne répondra plus dans cette conversation._\n` +
          `_Tape \`.zero\` pour le réveiller._\n\n` +
          `> ⚡ _ZERO TRACE BOT v5.0_`,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    // ── .zero — ACTIVER ───────────────────────────────────────────────────────
    const alreadyActive = isActivated(jid);

    if (alreadyActive) {
      // Déjà actif — donner une citation différente + rappel
      await antiBan.safeSend(sock, jid, {
        text:
          `⚡ *ZERO TRACE est déjà en ligne.*\n\n` +
          `${getCitation()}\n\n` +
          `> _Tape \`.menu\` pour voir les commandes_`,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    // Activation + citation
    activate(jid, sender);
    const citation = getCitation();

    // Délai dramatique avant la réponse
    try { await sock.sendPresenceUpdate('composing', jid); } catch (e) {}
    await new Promise(r => setTimeout(r, 1500));
    try { await sock.sendPresenceUpdate('paused', jid); } catch (e) {}

    await antiBan.safeSend(sock, jid, {
      text:
        `${citation}\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━\n` +
        `💡 Tape \`.menu\` pour voir toutes les commandes.\n\n` +
        `> ⚡ _ZERO TRACE BOT v5.0_`,
    }, { msgOptions: { quoted: msg } });
  },
};
