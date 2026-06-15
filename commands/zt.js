/**
 * ZERO TRACE 💀 — Commande .zt (contrôle du cerveau unifié v2)
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 *  .zt on              → activer le cerveau dans ce chat
 *  .zt off             → désactiver
 *  .zt silent on/off   → mode sans préfixe "💀"
 *  .zt group on/off    → ouvrir/fermer aux membres (groupe)
 *  .zt private on/off  → chatbot DM pour tous
 *  .zt clear           → vider la mémoire
 *  .zt status          → état complet
 *  .zt providers       → état des providers IA [owner/sudo]
 *  .zt resetproviders [nom] → réinitialiser providers [owner/sudo]
 *  .zt resetmem [all|user JID|stats] → gérer la mémoire IA
 *  .zt help            → aide
 *
 *  Aliases : .brain | .zerotrace
 *
 *  Anciennes commandes fusionnées (ai, agent, agentreset, aistatus, gpt,
 *  darkgpt, aireset, providers, memreset, ...) sont mappées vers les
 *  sous-commandes ci-dessus pour compatibilité.
 */

'use strict';

const brain = require('../lib/zerotrace_brain');
const zts   = require('../lib/ztStyle');

// Mapping ancienne commande → sous-commande .zt équivalente
const LEGACY_MAP = {
  aireset:    ['resetmem'],
  agentreset: ['resetmem'],
  resetagent: ['resetmem'],
  clearagent: ['resetmem'],
  memreset:   ['resetmem'],
  aistatus:   ['providers'],
  iastatut:   ['providers'],
  providers:  ['providers'],
  agent:      [], // pas de mapping direct → afficher l'aide
  ai:         [],
  gpt:        [],
  darkgpt:    [],
};

module.exports = {
  name:        'zt',
  aliases:     ['brain', 'zerotrace'],
  description: 'Contrôler le cerveau IA unifié ZERO TRACE 💀',
  usage:       '.zt on | off | silent on/off | group on/off | private on/off | clear | status | providers | resetmem | help',
  category:    'ia',

  async execute(ctx) {
    const { sock, jid, msg, args, antiBan, command } = ctx;

    // ── Anciennes commandes (ai, agent, gpt, darkgpt, ...) ───────────────
    if (command && LEGACY_MAP.hasOwnProperty(command)) {
      const mapped = LEGACY_MAP[command];

      if (mapped.length === 0) {
        // .ai / .agent / .gpt / .darkgpt n'ont plus d'équivalent direct :
        // ce sont désormais des modes "cerveau" actifs en continu (.zt on)
        await antiBan.safeSend(sock, jid, {
          text:
            `💀 *ZERO TRACE — SYSTÈME IA MIS À JOUR*\n\n` +
            `La commande *.${command}* a fusionné dans *.zt* (cerveau IA unifié).\n\n` +
            `📌 *Pour discuter avec l'IA :*\n` +
            `• \`.zt on\` → active le cerveau dans ce chat\n` +
            `• Parle ensuite normalement, plus besoin de préfixe à chaque message\n` +
            `• \`.zt silent on\` → réponses sans préfixe "ZERO TRACE >"\n\n` +
            `📌 *Autres commandes utiles :*\n` +
            `• \`.zt clear\` → vider la mémoire\n` +
            `• \`.zt status\` → voir l'état du cerveau\n` +
            `• \`.zt providers\` → état des providers IA [owner/sudo]\n\n` +
            `> ${zts.sig()}`,
        }, { msgOptions: { quoted: msg } });
        return;
      }

      // Réécrire args pour rediriger vers la sous-commande mappée
      ctx.args = [...mapped, ...args];
    }

    return brain.handleBrainCommand(ctx);
  },
};
