/**
 * .clonevoix — Cloner la voix de l'owner (Owner uniquement)
 *
 * USAGE :
 *   .clonevoix start   → Instructions pour envoyer un vocal de 30s+
 *   .clonevoix done    → Traiter le vocal en réponse
 *   .clonevoix test    → Tester la voix clonée
 *   .clonevoix status  → Voir si une voix est déjà clonée
 *   .clonevoix reset   → Revenir à la voix masculine par défaut
 *
 * PROCESSUS :
 *   1. Tu lances .clonevoix start
 *   2. Tu envoies un vocal de 30 secondes minimum (parle normalement)
 *   3. Tu réponds à ce vocal avec .clonevoix done
 *   4. Le bot clone ta voix via ElevenLabs
 *   5. Le bot répondra désormais avec ta voix clonée
 */

const voice = require('../lib/voice');
const axios = require('axios');

// État : attend-on un vocal pour le clonage ?
const waitingForVoice = new Set();

module.exports = {
  name: 'clonevoix',
  description: 'Cloner ta voix pour les réponses vocales du bot',
  usage: '.clonevoix start | done | test | status | reset',
  category: 'owner',

  async execute(ctx) {
    const { sock, jid, msg, args, antiBan, isOwner, pushName } = ctx;

    if (!isOwner) {
      await antiBan.safeSend(sock, jid, {
        text: '❌ Seul le propriétaire peut cloner une voix.',
      }, { msgOptions: { quoted: msg } });
      return;
    }

    const sub = (args[0] || '').toLowerCase();

    // ── STATUS ─────────────────────────────────────────────────────────────
    if (!sub || sub === 'status') {
      const clonedId = voice.getClonedVoiceId();
      const hasKey   = !!process.env.ELEVENLABS_API_KEY;
      await antiBan.safeSend(sock, jid, {
        text:
          `🎙️ CLONE DE VOIX — ZERO TRACE\n\n` +
          `ElevenLabs API : ${hasKey ? '✅ Configurée' : '❌ Manquante (.env)'}\n` +
          `Voix clonée : ${clonedId ? `✅ Active (ID: ${clonedId.slice(0, 8)}...)` : '❌ Aucune (voix masculine par défaut)'}\n\n` +
          `Commandes :\n` +
          `- .clonevoix start  → Commencer le clonage\n` +
          `- .clonevoix test   → Tester la voix actuelle\n` +
          `- .clonevoix reset  → Voix masculine par défaut\n\n` +
          `${!hasKey ? '⚠️ Configure ELEVENLABS_API_KEY dans .env\nhttps://elevenlabs.io (gratuit 10k chars/mois)\n\n' : ''}` +
          `> ZERO TRACE BOT v5.0`,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    // ── START : Préparer le clonage ────────────────────────────────────────
    if (sub === 'start') {
      if (!process.env.ELEVENLABS_API_KEY) {
        await antiBan.safeSend(sock, jid, {
          text:
            `❌ ELEVENLABS_API_KEY manquante !\n\n` +
            `Pour cloner ta voix :\n` +
            `1. Va sur https://elevenlabs.io\n` +
            `2. Crée un compte gratuit\n` +
            `3. Va dans Profile → API Key\n` +
            `4. Ajoute ELEVENLABS_API_KEY=ta_cle dans ton .env\n` +
            `5. Redémarre le bot (.restart)\n\n` +
            `Gratuit : 10 000 caractères/mois\n\n` +
            `> ZERO TRACE BOT v5.0`,
        }, { msgOptions: { quoted: msg } });
        return;
      }

      waitingForVoice.add(jid);

      await antiBan.safeSend(sock, jid, {
        text:
          `🎙️ MODE CLONAGE ACTIVÉ !\n\n` +
          `Envoie-moi maintenant un message vocal de\n` +
          `minimum 30 secondes (1 minute c'est mieux).\n\n` +
          `📌 Conseils pour un bon clone :\n` +
          `- Parle normalement, comme d'habitude\n` +
          `- Varie le rythme (lent, rapide, émotions)\n` +
          `- Endroit calme, pas de bruit de fond\n` +
          `- Lis un texte ou parle librement\n\n` +
          `Après avoir envoyé le vocal, réponds à ce message\n` +
          `en tapant : .clonevoix done\n\n` +
          `> ZERO TRACE BOT v5.0`,
      }, { msgOptions: { quoted: msg } });

      // Auto-annuler après 10 minutes
      setTimeout(() => waitingForVoice.delete(jid), 10 * 60 * 1000);
      return;
    }

    // ── DONE : Traiter le vocal en citation ────────────────────────────────
    if (sub === 'done') {
      if (!process.env.ELEVENLABS_API_KEY) {
        await antiBan.safeSend(sock, jid, { text: '❌ ELEVENLABS_API_KEY manquante.' }, { msgOptions: { quoted: msg } });
        return;
      }

      // Chercher le message vocal dans la citation
      const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
      const audioMsg = quoted?.audioMessage || quoted?.ptpMessage;

      if (!audioMsg) {
        await antiBan.safeSend(sock, jid, {
          text:
            `❌ Aucun vocal trouvé !\n\n` +
            `Procédure :\n` +
            `1. Envoie un message vocal (30s min)\n` +
            `2. Puis RÉPONDS à ce vocal avec : .clonevoix done\n\n` +
            `(Appui long sur le vocal → Répondre → tape la commande)`,
        }, { msgOptions: { quoted: msg } });
        return;
      }

      await antiBan.safeSend(sock, jid, {
        text: '⏳ Téléchargement et traitement de ton vocal...\nClonage en cours sur ElevenLabs...',
      }, { msgOptions: { quoted: msg } });

      try {
        // Télécharger le vocal
        const { downloadMediaMessage } = require('@whiskeysockets/baileys');
        const quotedMsg = {
          key: msg.message.extendedTextMessage.contextInfo.stanzaId
            ? { id: msg.message.extendedTextMessage.contextInfo.stanzaId, remoteJid: jid }
            : msg.key,
          message: quoted,
        };

        let audioBuffer;
        try {
          audioBuffer = await downloadMediaMessage(
            { message: quoted, key: quotedMsg.key },
            'buffer',
            {},
            {}  // compat Baileys 6.x
          );
        } catch (dlErr) {
          // Fallback : télécharger depuis l'URL directe
          if (audioMsg.url) {
            const res = await axios.get(audioMsg.url, { responseType: 'arraybuffer', timeout: 30000 });
            audioBuffer = Buffer.from(res.data);
          } else {
            throw new Error('Impossible de télécharger le vocal');
          }
        }

        if (!audioBuffer || audioBuffer.length < 1000) {
          await antiBan.safeSend(sock, jid, { text: '❌ Vocal trop court ou vide.' }, { msgOptions: { quoted: msg } });
          return;
        }

        // Cloner la voix
        const result = await voice.cloneVoice(audioBuffer, pushName);

        if (result.success) {
          waitingForVoice.delete(jid);
          await antiBan.safeSend(sock, jid, {
            text:
              `✅ VOIX CLONÉE AVEC SUCCÈS !\n\n` +
              `Nom : ${result.name}\n` +
              `ID ElevenLabs : ${result.voiceId.slice(0, 12)}...\n\n` +
              `Le bot utilisera maintenant ta voix pour :\n` +
              `- Répondre aux vocaux (chatbot + agent)\n` +
              `- La commande .tts [texte]\n\n` +
              `Teste avec : .clonevoix test\n\n` +
              `> ZERO TRACE BOT v5.0`,
          }, { msgOptions: { quoted: msg } });
        } else {
          await antiBan.safeSend(sock, jid, {
            text: `❌ Échec du clonage :\n${result.error}\n\nVérifie que ton plan ElevenLabs supporte le clonage de voix.`,
          }, { msgOptions: { quoted: msg } });
        }

      } catch (err) {
        await antiBan.safeSend(sock, jid, {
          text: `❌ Erreur : ${err.message}`,
        }, { msgOptions: { quoted: msg } });
      }
      return;
    }

    // ── TEST : Envoyer un vocal de test ────────────────────────────────────
    if (sub === 'test') {
      await antiBan.safeSend(sock, jid, {
        text: '🔊 Génération du vocal de test...',
      }, { msgOptions: { quoted: msg } });

      const clonedId = voice.getClonedVoiceId();
      const testText = clonedId
        ? 'Ceci est un test de ta voix clonée. Zero Trace Bot est opérationnel.'
        : 'Ceci est un test avec la voix masculine par défaut. Zero Trace Bot est opérationnel.';

      const ttsResult = await voice.synthesizeSpeech(testText, !!clonedId);
      if (ttsResult?.buffer) {
        await sock.sendMessage(jid, {
          audio: ttsResult.buffer,
          mimetype: ttsResult.mimeType,
          ptt: true,
        }, { quoted: msg });
        await antiBan.safeSend(sock, jid, {
          text: `✅ Test OK — ${ttsResult.provider}\n${clonedId ? '(Voix clonée)' : '(Voix masculine par défaut)'}`,
        }, { msgOptions: { quoted: msg } });
      } else {
        await antiBan.safeSend(sock, jid, {
          text: '❌ Impossible de générer le vocal de test.\nVérifie ELEVENLABS_API_KEY dans keys.js',
        }, { msgOptions: { quoted: msg } });
      }
      return;
    }

    // ── RESET : Revenir à la voix par défaut ───────────────────────────────
    if (sub === 'reset') {
      const fs   = require('fs-extra');
      const path = require('path');
      try {
        fs.removeSync(path.join(__dirname, '../data/cloned_voice_id.json'));
      } catch {}
      await antiBan.safeSend(sock, jid, {
        text: '✅ Voix réinitialisée.\nLe bot utilisera la voix masculine par défaut (Antoni).',
      }, { msgOptions: { quoted: msg } });
      return;
    }

    await antiBan.safeSend(sock, jid, {
      text: '❌ Commande inconnue.\nUtilise : .clonevoix start | done | test | status | reset',
    }, { msgOptions: { quoted: msg } });
  },

  // Exposé pour le handler (vérifie si on attend un vocal de clonage)
  isWaitingForClone: (jid) => waitingForVoice.has(jid),
};
