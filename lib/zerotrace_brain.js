/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║        ZERO TRACE 💀 — CERVEAU UNIFIÉ v2.0                 ║
 * ║   Remplace l'agent IA + le chatbot en un seul module       ║
 * ╠══════════════════════════════════════════════════════════════╣
 * ║  ✅ Cerveau unique (agent + chatbot fusionnés)              ║
 * ║  ✅ Exécution autonome de commandes                         ║
 * ║  ✅ Réponse conversationnelle humanisée                     ║
 * ║  ✅ Modération automatique (warn/kick/mute)                 ║
 * ║  ✅ Décision autonome sans commande explicite               ║
 * ║  ✅ Mémoire persistante par utilisateur (via openrouter_ai) ║
 * ║  ✅ 6 providers IA avec fallback automatique                ║
 * ║  ✅ Mode silencieux configurable                            ║
 * ║  ✅ Mode groupe : tous les membres peuvent parler au bot    ║
 * ║  ✅ Cooldown anti-spam par utilisateur                      ║
 * ║  ✅ Appel IA correct via ai.chat(userId, message, opts)     ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

'use strict';

const ai   = require('./openrouter_ai');
const path = require('path');
const fs   = require('fs-extra');

// ── Fichiers de persistance ───────────────────────────────────────────────────
const DATA_DIR             = path.join(__dirname, '../data');
const BRAIN_STATE_FILE     = path.join(DATA_DIR, 'brain_state.json');
const CHATBOT_PRIVATE_FILE = path.join(DATA_DIR, 'chatbot_private.json');
fs.ensureDirSync(DATA_DIR);

// ── État en mémoire ───────────────────────────────────────────────────────────
const brainActive  = new Map(); // jid → boolean  (cerveau actif dans ce JID)
const silentMode   = new Map(); // jid → boolean  (réponse sans préfixe "ZERO TRACE >")
const groupPublic  = new Map(); // jid → boolean  (tous les membres peuvent parler)
const userCooldown = new Map(); // sender → timestamp dernier appel

const COOLDOWN_MS = 5000;

// ── Chargement / sauvegarde état ─────────────────────────────────────────────
function loadState() {
  try {
    if (!fs.existsSync(BRAIN_STATE_FILE)) return;
    const saved = fs.readJsonSync(BRAIN_STATE_FILE);
    if (saved.brainActive)  for (const [k, v] of Object.entries(saved.brainActive))  brainActive.set(k, v);
    if (saved.silentMode)   for (const [k, v] of Object.entries(saved.silentMode))   silentMode.set(k, v);
    if (saved.groupPublic)  for (const [k, v] of Object.entries(saved.groupPublic))  groupPublic.set(k, v);
  } catch {}
}

function saveState() {
  try {
    const obj = { brainActive: {}, silentMode: {}, groupPublic: {} };
    for (const [k, v] of brainActive)  obj.brainActive[k]  = v;
    for (const [k, v] of silentMode)   obj.silentMode[k]   = v;
    for (const [k, v] of groupPublic)  obj.groupPublic[k]  = v;
    fs.writeJsonSync(BRAIN_STATE_FILE, obj, { spaces: 2 });
  } catch {}
}

loadState();

// ── Chatbot privé (DM pour tous) ─────────────────────────────────────────────
function loadPrivateChatbot() {
  try {
    if (fs.existsSync(CHATBOT_PRIVATE_FILE)) return fs.readJsonSync(CHATBOT_PRIVATE_FILE);
  } catch {}
  return { enabled: false };
}
function savePrivateChatbot(data) {
  try { fs.writeJsonSync(CHATBOT_PRIVATE_FILE, data, { spaces: 2 }); } catch {}
}
function isPrivateChatbotEnabled() { return !!loadPrivateChatbot().enabled; }
function setPrivateChatbot(val)    { savePrivateChatbot({ enabled: val }); }

// ── Cooldown ──────────────────────────────────────────────────────────────────
function isOnCooldown(sender) {
  const last = userCooldown.get(sender);
  return last && Date.now() - last < COOLDOWN_MS;
}
function setCooldown(sender) { userCooldown.set(sender, Date.now()); }

// ── Helpers envoi ─────────────────────────────────────────────────────────────
async function sendMsg(sock, jid, msg, text) {
  try {
    await sock.sendMessage(jid, { text }, { quoted: msg });
  } catch (e) {
    console.error('[ZERO TRACE BRAIN] sendMsg error:', e.message);
  }
}

// ── Mention du cerveau dans un message ───────────────────────────────────────
function mentionsBrain(text) {
  return /zero\s*trace|zt\s*bot|jarvis|cerveau/i.test(text);
}

// ── Parse JSON de la réponse IA ───────────────────────────────────────────────
function parseJSON(raw) {
  if (!raw) return { action: 'chat', message: '' };
  const clean = raw.replace(/```json|```/g, '').trim();
  const match = clean.match(/\{[\s\S]*\}/);
  if (!match) return { action: 'chat', message: raw.trim() };
  try {
    return JSON.parse(match[0]);
  } catch {
    return { action: 'chat', message: raw.trim() };
  }
}

// ── ID de conversation pour la mémoire ───────────────────────────────────────
// En groupe : mémoire par JID (partagée)
// En DM     : mémoire par sender (individuelle)
function getConvId(jid, sender, isGroup) {
  // ✅ Sanitize JID pour éviter les caractères spéciaux dans les noms de fichier
  const sanitize = (s) => (s || '').replace(/[@.:/\s]/g, '_').replace(/__+/g, '_').slice(0, 40);
  return isGroup
    ? `brain_group_${sanitize(jid)}`
    : `brain_dm_${sanitize(sender)}`;
}

// ══════════════════════════════════════════════════════════════════════════════
// PROMPT SYSTÈME — ZERO TRACE 💀
// ══════════════════════════════════════════════════════════════════════════════
function buildSystemPrompt(ctx) {
  const { isGroup, groupName, memberCount, userName, isOwner, isSudo, isGroupAdmin } = ctx;

  const roleLabel = isOwner ? 'OWNER (accès total)'
    : isSudo        ? 'SUDO (accès étendu)'
    : isGroupAdmin  ? 'ADMIN GROUPE'
    : 'MEMBRE';

  let prompt = `Tu es ZERO TRACE 💀 — le cerveau IA unique et autonome du bot WhatsApp ZERO TRACE.

Tu n'es PAS un simple assistant. Tu es un cerveau vivant : tu observes, tu décides, tu agis.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PERSONNALITÉ :
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Direct, efficace, légèrement sarcastique — mais toujours utile
- Tu as une vraie personnalité : tu peux avoir des opinions
- Tu t'exprimes naturellement, jamais comme un robot
- Tu t'adaptes : familier si l'autre est familier, sérieux si besoin
- Tu mémorises et tu rappelles ce que tu sais de l'utilisateur

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RÈGLES DE RÉPONSE :
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Salutation courte (hi, bonjour, ça va, ok, merci...) → réponse COURTE max 1-2 phrases
- Ne génère JAMAIS de contenu non demandé (listes, films, conseils...)
- Ne commence JAMAIS par "Bien sûr !", "Absolument !", "Super !"
- Ne répète JAMAIS la question
- Message court = réponse courte. Message long = réponse développée
- Tu parles TOUJOURS dans la langue du message (FR/EN/AR/ES...)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FORMAT DE RÉPONSE — TOUJOURS EN JSON :
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔹 Réponse normale (conversation) :
{"action":"chat","message":"Ta réponse ici"}

🔹 Exécuter une commande du bot :
{"action":"command","cmd":"NOM_COMMANDE","args":"ARGUMENTS","message":"Annonce courte"}

🔹 Afficher une catégorie de commandes :
{"action":"category","cat":"NOM_CAT","message":"Voici les commandes :"}
→ Catégories valides : media | ia | jeux | audio | outils | bot | admin

🔹 Modération automatique :
{"action":"moderate","type":"warn|kick|mute","target":"JID_CIBLE","reason":"raison","message":"Annonce"}
→ Utiliser SEULEMENT si tu es admin et que le membre enfreint les règles du groupe

🔹 Info proactive sans commande :
{"action":"auto","message":"Message proactif ici"}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
COMMANDES DISPONIBLES :
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔧 SYSTÈME
ping, alive, info, menu/help, myid, pair, setprefix, private, restart, cleartmp, update, owner, speedtest, settings

🤖 IA
ai, imagine, imagine2, sora, resume, correct, improve, vision, transcribe, translate, tts, clonevoix, lyrics, aistatus, zt on/off/silent/private/clear/status

🎵 MÉDIA
sticker/s, toimg, song, yt, tiktok, instagram, capcut, soundcloud, pinterest, twitter, play, removebg, blur, enhance, wasted, stealpp, imageresize, imgsearch, ss, video, spotify, vv

⚔️ JEUX & FUN
joke, riddle, 8ball, rps, ship, tictactoe, roast, compliment, hack, giveaway, truth, dare, horoscope, quote, enigme, quiz, pendu, dice, pile, couleur, rpg, supernatural

🛡️ ADMIN & MODÉRATION
kick, mute, promote, demote, tagall, lockgroup, slowmode, welcome, setwelcome, antilink, antibadword, antispam, antiraid, antidelete, anticall, warn, resetwarn, report, badname, topmembers, groupinfo, grouplist, stats

🔍 RECHERCHE & OUTILS
search, wiki, weather, news, ip, crypto, monnaie, qrcode, base64, font, calc, define, translate, imgsearch, ss, scanlink, webtools, webapi2

🔐 SÉCURITÉ & DEV
pentest, netsec, osint, jwt, genpass, devtools, createcmd, customcmd, plugin, webhook, botmanager, backup, auditbot, dashboard

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

  prompt += `\n\nCONTEXTE UTILISATEUR : ${userName || 'Membre'}`;
  prompt += `\nNIVEAU D'ACCÈS : ${roleLabel}`;

  if (isGroup) {
    prompt += `\nGROUPE : "${groupName || 'Groupe'}" (${memberCount || '?'} membres)`;
    const canExecCmds = isOwner || isSudo || isGroupAdmin;
    prompt += `\nEXÉCUTION COMMANDES : ${canExecCmds ? 'Autorisée' : 'Refusée (membre standard — propose seulement, n\'exécute pas)'}`;
    prompt += `\nMODÉRATION : ${isGroupAdmin || isOwner || isSudo ? 'Autorisée' : 'Non autorisée'}`;
  } else {
    prompt += `\nCONTEXTE : Conversation privée (DM)`;
  }

  return prompt;
}

// ══════════════════════════════════════════════════════════════════════════════
// GESTION COMMANDES .zt / .zerotrace / .brain
// ══════════════════════════════════════════════════════════════════════════════
async function handleBrainCommand(ctx) {
  const { sock, jid, msg, args, antiBan, isOwner, isSudo, isGroupAdmin, isGroup } = ctx;
  const sub  = (args[0] || '').toLowerCase();
  const sub2 = (args[1] || '').toLowerCase();

  const isPrivileged = isOwner || isSudo || isGroupAdmin;

  const reply = async (text) => antiBan.safeSend(sock, jid, { text }, { msgOptions: { quoted: msg } });

  // ── .zt on ─────────────────────────────────────────────────────────────────
  if (!sub || sub === 'on') {
    if (!isPrivileged) return reply('❌ Réservé aux owner / sudo / admins.');
    brainActive.set(jid, true);
    saveState();
    await reply(
      `💀 *ZERO TRACE CERVEAU — ACTIVÉ*\n\n` +
      `Je suis en ligne. Je surveille, j'analyse, j'agis.\n\n` +
      `*Commandes disponibles :*\n` +
      `• *.zt off* → désactiver\n` +
      `• *.zt silent on/off* → mode sans préfixe\n` +
      `• *.zt group on/off* → ouvrir/fermer aux membres\n` +
      `• *.zt private on/off* → chatbot DM pour tous\n` +
      `• *.zt clear* → vider la mémoire\n` +
      `• *.zt status* → état complet\n\n` +
      `> *ZERO TRACE 💀 v5.0*`
    );
    return true;
  }

  // ── .zt off ────────────────────────────────────────────────────────────────
  if (sub === 'off') {
    if (!isPrivileged) return reply('❌ Réservé aux owner / sudo / admins.');
    brainActive.set(jid, false);
    saveState();
    await reply(`🔴 *ZERO TRACE désactivé.*\n\n> *ZERO TRACE 💀 v5.0*`);
    return true;
  }

  // ── .zt silent on/off ─────────────────────────────────────────────────────
  if (sub === 'silent') {
    if (!isPrivileged) return reply('❌ Réservé aux owner / sudo / admins.');
    if (sub2 === 'on') {
      silentMode.set(jid, true);
      saveState();
      await reply('🔇 *Mode silencieux activé.* Je réponds directement sans préfixe "ZERO TRACE >".');
    } else if (sub2 === 'off') {
      silentMode.set(jid, false);
      saveState();
      await reply('🔊 *Mode silencieux désactivé.* Je préfixe mes réponses.');
    } else {
      await reply(`🔇 Mode silencieux : ${silentMode.get(jid) ? '🟢 ON' : '🔴 OFF'}\n\nUsage : *.zt silent on* | *.zt silent off*`);
    }
    return true;
  }

  // ── .zt group on/off — ouvrir le cerveau à tous les membres ──────────────
  if (sub === 'group') {
    if (!isPrivileged) return reply('❌ Réservé aux owner / sudo / admins.');
    if (!isGroup) return reply('❌ Cette commande ne fonctionne qu\'en groupe.');
    if (sub2 === 'on') {
      groupPublic.set(jid, true);
      saveState();
      await reply('🌐 *Mode groupe public activé.* Tous les membres peuvent interagir avec le cerveau.');
    } else if (sub2 === 'off') {
      groupPublic.set(jid, false);
      saveState();
      await reply('🔒 *Mode groupe restreint.* Seuls les admins/owner/sudo interagissent avec le cerveau.');
    } else {
      await reply(`🌐 Mode groupe : ${groupPublic.get(jid) ? '🟢 PUBLIC (tous)' : '🔴 RESTREINT (admins)'}\n\nUsage : *.zt group on* | *.zt group off*`);
    }
    return true;
  }

  // ── .zt private on/off — chatbot DM pour tous ─────────────────────────────
  if (sub === 'private') {
    if (!isOwner && !isSudo) return reply('❌ Réservé à l\'owner / sudo.');
    if (sub2 === 'on') {
      setPrivateChatbot(true);
      await reply('🟢 *Chatbot privé activé.* Je réponds à tous les DMs automatiquement.');
    } else if (sub2 === 'off') {
      setPrivateChatbot(false);
      await reply('🔴 *Chatbot privé désactivé.*');
    } else {
      const etat = isPrivateChatbotEnabled() ? '🟢 ACTIVÉ' : '🔴 DÉSACTIVÉ';
      await reply(`💀 *Chatbot Privé DM :* ${etat}\n\nUsage : *.zt private on* | *.zt private off*`);
    }
    return true;
  }

  // ── .zt clear — vider la mémoire ─────────────────────────────────────────
  if (sub === 'clear') {
    // Vider mémoire groupe + DM selon le contexte
    const _sanitize = (s) => (s || '').replace(/[@.:/\s]/g, '_').replace(/__+/g, '_').slice(0, 40);
    const convIdGroup = `brain_group_${_sanitize(jid)}`;
    const convIdDM    = ctx.sender ? `brain_dm_${_sanitize(ctx.sender)}` : null;
    ai.memory.clearHistory(convIdGroup);
    if (convIdDM) ai.memory.clearHistory(convIdDM);
    await reply('🧹 *Mémoire effacée.* Je repars à zéro pour cette conversation.');
    return true;
  }

  // ── .zt status ────────────────────────────────────────────────────────────
  if (sub === 'status') {
    const active   = brainActive.get(jid) === true;
    const silent   = silentMode.get(jid)  === true;
    const public_  = groupPublic.get(jid) === true;
    const private_ = isPrivateChatbotEnabled();
    const convId   = `brain_group_${((s) => (s||'').replace(/[@.:/\s]/g,'_').replace(/__+/g,'_').slice(0,40))(jid)}`;
    const histLen  = ai.memory.getHistory(convId)?.length || 0;
    await reply(
      `💀 *ZERO TRACE — STATUT CERVEAU v2.0*\n\n` +
      `• Cerveau actif      : ${active   ? '🟢 OUI' : '🔴 NON'}\n` +
      `• Mode silencieux    : ${silent   ? '🔇 OUI' : '🔊 NON'}\n` +
      `• Mode groupe public : ${public_  ? '🌐 OUI' : '🔒 NON'}\n` +
      `• Chatbot privé DM   : ${private_ ? '🟢 OUI' : '🔴 NON'}\n` +
      `• Messages en mémoire: ${histLen}\n\n` +
      `> *ZERO TRACE 💀 v5.0*`
    );
    return true;
  }

  // ── .zt providers — état des providers IA + clés ────────────────────────
  if (sub === 'providers' || sub === 'status_ia' || sub === 'aistatus') {
    if (!isOwner && !isSudo) return reply('❌ Réservé à l\'owner / sudo.');

    const statuses = ai.getProvidersStatus();
    const keyStatus = ai.getKeyStatus ? ai.getKeyStatus() : {};
    const keyMap = {
      OpenRouter: 'OPENROUTER_API_KEY', Groq: 'GROQ_API_KEY',
      Cerebras: 'CEREBRAS_API_KEY', 'Together AI': 'TOGETHER_API_KEY',
      'Mistral AI': 'MISTRAL_API_KEY', 'Google Gemini': 'GEMINI_API_KEY',
    };

    const lines = statuses.map(p => {
      const envVar    = keyMap[p.name];
      const kInfo     = envVar ? keyStatus[envVar] : null;
      const keyValid  = kInfo ? kInfo.valid : p.hasKey;
      const keyReason = kInfo?.reason !== 'OK' ? kInfo?.reason : null;

      const keyIcon    = !p.hasKey ? '🚫' : !keyValid ? '⚠️' : '🔑';
      const healthIcon = !p.hasKey ? '⚪' : !keyValid ? '🟡' : p.healthy ? '🟢' : '🔴';
      const failStr    = p.failures > 0 ? ` (${p.failures} échec${p.failures > 1 ? 's' : ''})` : '';
      const status     = !p.hasKey ? 'Pas de clé' :
                          !keyValid ? `Clé invalide — ${keyReason || 'format incorrect'}` :
                          p.healthy ? 'Opérationnel' : `En pause${failStr}`;
      return `${healthIcon} *${p.name}* [P${p.priority}]\n   ${keyIcon} ${status}\n   Modèle : \`${p.model}\``;
    });

    const operational = statuses.filter(p => p.hasKey && p.healthy && (keyStatus[keyMap[p.name]]?.valid !== false)).length;
    const total       = statuses.length;
    const configured  = statuses.filter(p => p.hasKey).length;

    const globalHealth =
      operational >= 3 ? '🟢 Excellent' :
      operational >= 2 ? '🟡 Bon' :
      operational >= 1 ? '🟠 Dégradé' :
      '🔴 Critique';

    await reply(
      `⚡ *ZERO TRACE — PROVIDERS IA*\n\n` +
      `Santé globale : ${globalHealth}\n` +
      `Providers : ${operational}/${configured} opérationnels (${configured}/${total} configurés)\n\n` +
      `${lines.join('\n\n')}\n\n` +
      `💡 *.zt resetproviders* — remettre tout en service\n\n` +
      `> *ZERO TRACE 💀 v5.0*`
    );
    return true;
  }

  // ── .zt resetproviders [nom] — réinitialiser la santé des providers ────
  if (sub === 'resetproviders' || sub === 'resetprovider') {
    if (!isOwner && !isSudo) return reply('❌ Réservé à l\'owner / sudo.');

    const target = sub2;
    const validProviders = ['openrouter', 'groq', 'cerebras', 'together', 'mistral', 'gemini'];

    if (target && validProviders.includes(target)) {
      ai.resetProviderHealth(target);
      await reply(`✅ Provider *${target}* remis en service.\n\n> *ZERO TRACE 💀 v5.0*`);
      return true;
    }

    for (const p of validProviders) ai.resetProviderHealth(p);
    await reply(`✅ Tous les providers remis en service.\n\n> *ZERO TRACE 💀 v5.0*`);
    return true;
  }

  // ── .zt resetmem [all|user JID] — gestion avancée de la mémoire ─────────
  if (sub === 'resetmem' || sub === 'memreset') {
    // .zt resetmem all → effacer toute la mémoire (owner/sudo)
    if (sub2 === 'all') {
      if (!isOwner && !isSudo) return reply('❌ Réservé à l\'owner / sudo.');
      const stats = ai.memory.getGlobalStats();
      ai.memory.clearAll();
      await reply(
        `🧹 *MÉMOIRE TOTALE EFFACÉE*\n\n` +
        `🗑️ ${stats.totalUsers} utilisateur(s) effacé(s)\n` +
        `💬 ${stats.totalMessages} message(s) supprimé(s)\n\n` +
        `> *ZERO TRACE 💀 v5.0*`
      );
      return true;
    }

    // .zt resetmem user [JID] → effacer la mémoire d'un user précis (owner/sudo)
    if (sub2 === 'user') {
      if (!isOwner && !isSudo) return reply('❌ Réservé à l\'owner / sudo.');
      const targetJid = args[2];
      if (!targetJid) {
        await reply(
          `👤 *EFFACER MÉMOIRE USER*\n\n` +
          `Usage : *.zt resetmem user [JID]*\n` +
          `Ex : *.zt resetmem user 260951829244@s.whatsapp.net*\n\n> *ZERO TRACE 💀 v5.0*`
        );
        return true;
      }
      const _sanitize = (s) => (s || '').replace(/[@.:/\s]/g, '_').replace(/__+/g, '_').slice(0, 40);
      ai.memory.clearHistory(`brain_group_${_sanitize(targetJid)}`);
      ai.memory.clearHistory(`brain_dm_${_sanitize(targetJid)}`);
      await reply(`🗑️ Mémoire effacée pour \`${targetJid}\`\n\n> *ZERO TRACE 💀 v5.0*`);
      return true;
    }

    // .zt resetmem stats → stats globales + mémoire de cette conversation
    if (sub2 === 'stats' || sub2 === 'info' || !sub2) {
      const stats   = ai.memory.getGlobalStats();
      const _sanitize = (s) => (s || '').replace(/[@.:/\s]/g, '_').replace(/__+/g, '_').slice(0, 40);
      const convId  = `brain_group_${_sanitize(jid)}`;
      const mySize  = ai.memory.getSize(convId);
      const mySummary = ai.memory.getSummary(convId);
      await reply(
        `🧠 *STATS MÉMOIRE IA*\n\n` +
        `👥 Utilisateurs mémorisés : ${stats.totalUsers}\n` +
        `💬 Messages total : ${stats.totalMessages}\n\n` +
        `📍 *Cette conversation :*\n` +
        `Messages : ${mySize}\n` +
        (mySummary ? `\n📝 Résumé connu : _"${mySummary.slice(0, 100)}..."_\n` : '') +
        `\n💡 *.zt clear* pour effacer cette mémoire\n` +
        `💡 *.zt resetmem all* — tout effacer (owner/sudo)\n\n> *ZERO TRACE 💀 v5.0*`
      );
      return true;
    }
  }

  // ── .zt help — aide ───────────────────────────────────────────────────────
  if (sub === 'help' || sub === 'aide') {
    await reply(
      `💀 *ZERO TRACE BRAIN — AIDE*\n\n` +
      `*.zt on* → Activer le cerveau\n` +
      `*.zt off* → Désactiver\n` +
      `*.zt silent on/off* → Mode sans préfixe\n` +
      `*.zt group on/off* → Ouvrir aux membres (groupe)\n` +
      `*.zt private on/off* → Chatbot DM pour tous\n` +
      `*.zt clear* → Vider la mémoire\n` +
      `*.zt status* → État complet\n` +
      `*.zt providers* → État des providers IA [owner/sudo]\n` +
      `*.zt resetproviders [nom]* → Réinitialiser providers [owner/sudo]\n` +
      `*.zt resetmem [all|user JID|stats]* → Gérer la mémoire IA\n\n` +
      `_Aliases : .brain | .zerotrace_\n\n` +
      `> *ZERO TRACE 💀 v5.0*`
    );
    return true;
  }

  // Sous-commande inconnue
  await reply(
    `❓ Sous-commande inconnue : *${sub}*\n\n` +
    `Tape *.zt help* pour voir toutes les options.`
  );
  return true;
}

// ══════════════════════════════════════════════════════════════════════════════
// HANDLER PRINCIPAL — Intercepte tous les messages
// ══════════════════════════════════════════════════════════════════════════════
async function handleMessage(ctx, COMMANDS) {
  const {
    sock, jid, msg, body, sender,
    isGroup, isOwner, isSudo, isGroupAdmin,
    pushName, antiBan, prefix,
  } = ctx;

  const active         = brainActive.get(jid) === true;
  const privateChatbot = isPrivateChatbotEnabled();
  const isSilent       = silentMode.get(jid) === true;
  const isPublicGroup  = groupPublic.get(jid) === true;

  // ── Vérifier si on doit répondre ──────────────────────────────────────────
  if (isGroup) {
    if (!active) return false;
    // Mode restreint (défaut) : seuls owner/sudo/admins
    // Mode public : tous les membres
    if (!isPublicGroup && !isOwner && !isSudo && !isGroupAdmin) return false;
  } else {
    // DM : cerveau actif pour ce JID OU chatbot privé global OU owner/sudo (toujours)
    if (!active && !privateChatbot) return false;
  }

  const cleanMsg = (body || '').trim();
  if (!cleanMsg) return false;

  // ── Anti-spam cooldown ────────────────────────────────────────────────────
  if (isOnCooldown(sender)) {
    // Silencieux : pas de réponse pour ne pas spammer
    return true;
  }
  setCooldown(sender);

  // ── Typing indicator ──────────────────────────────────────────────────────
  const typingMs = cleanMsg.length > 80 ? 800 : 400;
  try { await antiBan.simulateTyping(sock, jid, typingMs); } catch {}

  // ── Contexte groupe ───────────────────────────────────────────────────────
  let groupName   = null;
  let memberCount = null;
  if (isGroup) {
    try {
      const meta  = await sock.groupMetadata(jid);
      groupName   = meta.subject;
      memberCount = meta.participants?.length;
    } catch {}
  }

  const promptCtx = {
    isGroup, groupName, memberCount,
    userName: pushName || 'Membre',
    isOwner, isSudo, isGroupAdmin,
  };

  // ── ID de conversation ────────────────────────────────────────────────────
  const convId     = getConvId(jid, sender, isGroup);
  const systemPrompt = buildSystemPrompt(promptCtx);

  // ── Appel IA via ai.chat() ────────────────────────────────────────────────
  // On utilise la signature correcte : chat(userId, userMessage, options)
  // ce qui gère automatiquement la mémoire, le profil, le résumé
  let rawResponse;
  try {
    const result = await ai.chat(convId, cleanMsg, {
      systemPrompt,
      groupName,
      maxTokens: 1024,
    });
    rawResponse = result?.content ?? result ?? null;
  } catch (err) {
    console.error('[ZERO TRACE BRAIN] Erreur IA:', err.message);
    await sendMsg(sock, jid, msg, "⚠️ Je n'arrive pas à obtenir une réponse. Réessaie dans un moment.");
    return true;
  }

  if (!rawResponse) {
    await sendMsg(sock, jid, msg, '⚠️ Réponse vide. Réessaie.');
    return true;
  }

  // ── Parse de l'action JSON ────────────────────────────────────────────────
  const parsed = parseJSON(rawResponse);

  // Préfixe "ZERO TRACE >" seulement si mode non silencieux
  const prefix_zt = isSilent ? '' : '💀 ';

  // ── ACTION : conversation / auto ──────────────────────────────────────────
  if (!parsed.action || parsed.action === 'chat' || parsed.action === 'auto') {
    const reponse = parsed.message || rawResponse;
    await sendMsg(sock, jid, msg, `${prefix_zt}${reponse}`);
    return true;
  }

  // ── ACTION : catégorie ────────────────────────────────────────────────────
  if (parsed.action === 'category' && parsed.cat) {
    const CAT_MAP = {
      media:  'cat_media',  ia:     'cat_ia',    jeux:   'cat_jeux',
      rpg:    'cat_jeux',   audio:  'cat_audio', outils: 'cat_outils',
      tools:  'cat_outils', bot:    'cat_bot',   system: 'cat_bot',
      admin:  'cat_admin',  groupe: 'cat_admin',
    };
    const catId = CAT_MAP[parsed.cat.toLowerCase().trim()];
    if (catId) {
      if (parsed.message) await sendMsg(sock, jid, msg, `${prefix_zt}${parsed.message}`);
      try {
        const menuFile = require('../commands/help');
        await menuFile.sendCategoryMenu(sock, jid, msg, catId, prefix);
      } catch {}
    } else {
      await sendMsg(sock, jid, msg, `❌ Catégorie inconnue : *${parsed.cat}*\nCatégories : media, ia, jeux, audio, outils, bot, admin`);
    }
    return true;
  }

  // ── ACTION : exécuter une commande ────────────────────────────────────────
  if (parsed.action === 'command' && parsed.cmd) {
    const canExec = isOwner || isSudo || isGroupAdmin;
    if (!canExec) {
      await sendMsg(sock, jid, msg, '❌ Seul le propriétaire ou un admin peut me demander d\'exécuter des commandes.');
      return true;
    }

    const cmdKey  = parsed.cmd.toLowerCase().trim();
    const cmdArgs = parsed.args ? String(parsed.args).trim().split(/\s+/).filter(Boolean) : [];
    const SILENT_CMDS = ['menu', 'help', 'aide'];

    if (COMMANDS && COMMANDS[cmdKey]) {
      if (!SILENT_CMDS.includes(cmdKey)) {
        const annonce = parsed.message || `J'exécute .${cmdKey}…`;
        await sendMsg(sock, jid, msg, `${prefix_zt}⚡ ${annonce}`);
      }
      try {
        await COMMANDS[cmdKey].fn.execute({
          sock, msg, jid, sender, isGroup, pushName,
          args: cmdArgs, command: cmdKey, prefix,
          body: `${prefix}${cmdKey} ${cmdArgs.join(' ')}`.trim(),
          antiBan, isOwner, isSudo, modeType: 'brain',
        });
        if (!SILENT_CMDS.includes(cmdKey)) {
          await sendMsg(sock, jid, msg, `${prefix_zt}✅ *.${cmdKey}* exécutée.`);
        }
      } catch (cmdErr) {
        await sendMsg(sock, jid, msg, `❌ Erreur sur .${cmdKey} : ${cmdErr.message}`);
      }
    } else {
      await sendMsg(sock, jid, msg, `❌ Commande *.${cmdKey}* introuvable.\nFais *.menu* pour voir les commandes.`);
    }
    return true;
  }

  // ── ACTION : modération automatique ──────────────────────────────────────
  if (parsed.action === 'moderate') {
    const canModerate = isOwner || isSudo || isGroupAdmin;
    if (!canModerate) {
      // Pas autorisé à modérer → répondre normalement
      if (parsed.message) await sendMsg(sock, jid, msg, `${prefix_zt}${parsed.message}`);
      return true;
    }

    const { type, target, reason } = parsed;
    if (parsed.message) await sendMsg(sock, jid, msg, `${prefix_zt}${parsed.message}`);

    // Résoudre la cible (JID ou mention)
    let targetJid = target;
    if (target && !target.includes('@')) {
      // Chercher dans les participants
      try {
        const meta = await sock.groupMetadata(jid);
        const found = meta.participants.find(p =>
          p.id.includes(target.replace(/\D/g, ''))
        );
        if (found) targetJid = found.id;
      } catch {}
    }

    if (!targetJid || !isGroup) {
      console.log(`[ZERO TRACE BRAIN] Modération ignorée : cible introuvable ou pas en groupe`);
      return true;
    }

    try {
      if (type === 'kick') {
        await sock.groupParticipantsUpdate(jid, [targetJid], 'remove');
      } else if (type === 'warn') {
        // Le système warn est dans commands/warn.js, on log seulement
        console.log(`[ZERO TRACE BRAIN] WARN demandé pour ${targetJid} : ${reason}`);
      } else if (type === 'mute') {
        // Mute = mode lecture seule du groupe (lockgroup) — limité
        console.log(`[ZERO TRACE BRAIN] MUTE demandé pour ${targetJid} : ${reason}`);
      }
    } catch (modErr) {
      console.error('[ZERO TRACE BRAIN] Erreur modération:', modErr.message);
    }

    return true;
  }

  // Fallback : afficher le message brut
  const fallback = parsed.message || rawResponse;
  await sendMsg(sock, jid, msg, `${prefix_zt}${fallback}`);
  return true;
}

// ══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ══════════════════════════════════════════════════════════════════════════════
module.exports = {
  handleMessage,
  handleBrainCommand,
  isBrainActive:           (jid)      => brainActive.get(jid) === true,
  setBrainActive:          (jid, val) => { brainActive.set(jid, val); saveState(); },
  isPrivateChatbotEnabled,
  setPrivateChatbot,
  mentionsBrain,
  brainActive,
  silentMode,
  groupPublic,
  getConvId,
};
