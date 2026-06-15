const zts = require('../lib/ztStyle');
const fs  = require('fs');
const path = require('path');
/**
 * ZERO TRACE BOT v5.0 - Gestion de la chaîne WhatsApp (newsletter)
 * .channel set                → définir la chaîne liée (envoyer depuis le chat de la chaîne)
 * .channel post [texte]       → publier un message texte
 * .channel image [texte]      → publier l'image citée/jointe + légende
 * .channel video [texte]      → publier la vidéo citée/jointe + légende
 * .channel schedule [HH:mm ou ISO] [texte]  → programmer une publication texte
 * .channel scheduled          → lister les publications programmées
 * .channel unschedule [id]    → annuler une publication programmée
 * .channel stats               → afficher abonnés / vues de la chaîne
 *
 * Réservé : Owner + Sudo
 */

const channelManager = require('../lib/channelManager');
const mediaHelper     = require('../lib/mediaHelper');

const TMP_DIR = path.join(__dirname, '..', 'data', 'tmp_channel');

function ensureTmpDir() {
  if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });
}

/**
 * Parse une date/heure simple :
 *  - "HH:mm" → aujourd'hui à cette heure (ou demain si déjà passé)
 *  - ISO complet → tel quel
 */
function parseWhen(input) {
  if (/^\d{1,2}:\d{2}$/.test(input)) {
    const [h, m] = input.split(':').map(Number);
    const now = new Date();
    const target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0, 0);
    if (target.getTime() <= now.getTime()) target.setDate(target.getDate() + 1);
    return target.getTime();
  }
  const ts = new Date(input).getTime();
  return isNaN(ts) ? null : ts;
}

module.exports = {
  name: 'channel',
  description: 'Gérer la chaîne WhatsApp (publications, programmation, stats)',
  usage:
    '.channel set\n' +
    '.channel post [texte]\n' +
    '.channel image [texte] (en réponse à une image)\n' +
    '.channel video [texte] (en réponse à une vidéo)\n' +
    '.channel schedule [HH:mm|ISO] [texte]\n' +
    '.channel scheduled\n' +
    '.channel unschedule [id]\n' +
    '.channel stats',
  category: 'owner',

  async execute(ctx) {
    const { sock, jid, msg, args, antiBan, isOwner, isSudo } = ctx;

    if (!isOwner && !isSudo) {
      await antiBan.safeSend(sock, jid, {
        text: zts.randErr(zts.OWNER_ERRORS),
      }, { msgOptions: { quoted: msg } });
      return;
    }

    const sub = (args[0] || '').toLowerCase();
    const rest = args.slice(1).join(' ');

    // ── .channel set ─────────────────────────────────────────────────────
    if (sub === 'set') {
      // Si la commande est lancée DANS le chat de la chaîne, jid = newsletter jid
      if (!jid.endsWith('@newsletter')) {
        await antiBan.safeSend(sock, jid, {
          text: `❌ Cette commande doit être lancée *dans le chat de ta chaîne WhatsApp*.\n\n` +
                `> 💡 Ouvre ta chaîne, envoie \`.channel set\` directement là-bas.\n\n` +
                `> ${zts.sig()}`,
        }, { msgOptions: { quoted: msg } });
        return;
      }

      channelManager.setChannelJid(jid);
      await antiBan.safeSend(sock, jid, {
        text: `✅ Chaîne liée avec succès à *ZERO TRACE BOT* 💀\n\nJID: \`${jid}\`\n\n> ${zts.sig()}`,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    const channelJid = channelManager.getChannelJid();
    if (!channelJid && sub !== 'set') {
      await antiBan.safeSend(sock, jid, {
        text: `❌ Aucune chaîne n'est encore liée.\n\n` +
              `> 💡 Va dans ta chaîne WhatsApp et envoie \`.channel set\`.\n\n` +
              `> ${zts.sig()}`,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    // ── .channel post [texte] ────────────────────────────────────────────
    if (sub === 'post') {
      if (!rest) {
        await antiBan.safeSend(sock, jid, {
          text: `\`\`\`[ZT-CHANNEL] Usage: .channel post [texte]\`\`\`\n\n> ${zts.sig()}`,
        }, { msgOptions: { quoted: msg } });
        return;
      }

      try {
        await sock.sendMessage(channelJid, { text: rest });
        await antiBan.safeSend(sock, jid, {
          text: `✅ Message publié sur la chaîne 📡\n\n> ${zts.sig()}`,
        }, { msgOptions: { quoted: msg } });
      } catch (e) {
        await antiBan.safeSend(sock, jid, {
          text: `❌ Erreur lors de la publication: ${e.message}`,
        }, { msgOptions: { quoted: msg } });
      }
      return;
    }

    // ── .channel image / .channel video [texte] ─────────────────────────
    if (sub === 'image' || sub === 'video') {
      const type = sub; // 'image' | 'video'
      const buffer = await mediaHelper.downloadMedia(sock, msg, type);

      if (!buffer) {
        await antiBan.safeSend(sock, jid, {
          text: `❌ Aucun(e) ${type === 'image' ? 'image' : 'vidéo'} trouvé(e).\n\n` +
                `> 💡 Envoie ou cite un(e) ${type === 'image' ? 'image' : 'vidéo'} avec \`.channel ${type} [légende]\`.\n\n` +
                `> ${zts.sig()}`,
        }, { msgOptions: { quoted: msg } });
        return;
      }

      try {
        const content = type === 'image'
          ? { image: buffer, caption: rest || '' }
          : { video: buffer, caption: rest || '' };

        await sock.sendMessage(channelJid, content);
        await antiBan.safeSend(sock, jid, {
          text: `✅ ${type === 'image' ? 'Image' : 'Vidéo'} publiée sur la chaîne 📡\n\n> ${zts.sig()}`,
        }, { msgOptions: { quoted: msg } });
      } catch (e) {
        await antiBan.safeSend(sock, jid, {
          text: `❌ Erreur lors de la publication: ${e.message}`,
        }, { msgOptions: { quoted: msg } });
      }
      return;
    }

    // ── .channel schedule [HH:mm|ISO] [texte] ────────────────────────────
    if (sub === 'schedule') {
      const whenRaw = args[1];
      const text = args.slice(2).join(' ');

      if (!whenRaw || !text) {
        await antiBan.safeSend(sock, jid, {
          text: `\`\`\`[ZT-CHANNEL] Usage: .channel schedule [HH:mm|ISO] [texte]\`\`\`\n\n` +
                `Exemples:\n` +
                `• .channel schedule 18:30 Match ce soir à ne pas manquer !\n` +
                `• .channel schedule 2026-06-15T09:00:00 Nouvelle prédiction disponible\n\n` +
                `> ${zts.sig()}`,
        }, { msgOptions: { quoted: msg } });
        return;
      }

      const when = parseWhen(whenRaw);
      if (!when) {
        await antiBan.safeSend(sock, jid, {
          text: `❌ Format d'heure/date invalide: \`${whenRaw}\`\n\nUtilise \`HH:mm\` ou une date ISO complète.\n\n> ${zts.sig()}`,
        }, { msgOptions: { quoted: msg } });
        return;
      }

      // Média éventuel (image/vidéo citée) pour la publication programmée
      let type = 'text';
      let mediaPath = null;
      const imgBuf = await mediaHelper.downloadMedia(sock, msg, 'image');
      const vidBuf = !imgBuf ? await mediaHelper.downloadMedia(sock, msg, 'video') : null;

      if (imgBuf || vidBuf) {
        ensureTmpDir();
        type = imgBuf ? 'image' : 'video';
        const ext = imgBuf ? 'jpg' : 'mp4';
        mediaPath = path.join(TMP_DIR, `sched_${Date.now()}.${ext}`);
        fs.writeFileSync(mediaPath, imgBuf || vidBuf);
      }

      const entry = channelManager.addScheduledPost({ type, text, mediaPath, when });

      const dateStr = new Date(when).toLocaleString('fr-FR', { timeZone: 'Africa/Abidjan' });
      await antiBan.safeSend(sock, jid, {
        text: `✅ Publication programmée !\n\n` +
              `🆔 ID: \`${entry.id}\`\n` +
              `📅 Date: ${dateStr}\n` +
              `📝 Contenu: ${type !== 'text' ? `[${type}] ` : ''}${text}\n\n` +
              `> 💡 Utilise \`.channel unschedule ${entry.id}\` pour annuler.\n\n` +
              `> ${zts.sig()}`,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    // ── .channel scheduled ────────────────────────────────────────────────
    if (sub === 'scheduled') {
      const posts = channelManager.listScheduledPosts();
      if (posts.length === 0) {
        await antiBan.safeSend(sock, jid, {
          text: `📭 Aucune publication programmée.\n\n> ${zts.sig()}`,
        }, { msgOptions: { quoted: msg } });
        return;
      }

      const lines = posts
        .sort((a, b) => a.when - b.when)
        .map((p, i) => {
          const dateStr = new Date(p.when).toLocaleString('fr-FR', { timeZone: 'Africa/Abidjan' });
          const preview = p.text.length > 40 ? p.text.slice(0, 40) + '…' : p.text;
          return `${i + 1}. 🆔 \`${p.id}\`\n   📅 ${dateStr}\n   📝 ${p.type !== 'text' ? `[${p.type}] ` : ''}${preview}`;
        });

      await antiBan.safeSend(sock, jid, {
        text: `📋 *Publications programmées (${posts.length})*\n\n${lines.join('\n\n')}\n\n> ${zts.sig()}`,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    // ── .channel unschedule [id] ────────────────────────────────────────
    if (sub === 'unschedule') {
      const id = args[1];
      if (!id) {
        await antiBan.safeSend(sock, jid, {
          text: `\`\`\`[ZT-CHANNEL] Usage: .channel unschedule [id]\`\`\`\n\n> ${zts.sig()}`,
        }, { msgOptions: { quoted: msg } });
        return;
      }

      const removed = channelManager.removeScheduledPost(id);
      await antiBan.safeSend(sock, jid, {
        text: removed
          ? `✅ Publication \`${id}\` annulée.\n\n> ${zts.sig()}`
          : `❌ Aucune publication trouvée avec l'ID \`${id}\`.\n\n> ${zts.sig()}`,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    // ── .channel stats ──────────────────────────────────────────────────
    if (sub === 'stats') {
      try {
        const meta = await channelManager.getChannelStats(sock);
        if (!meta) {
          await antiBan.safeSend(sock, jid, {
            text: `❌ Impossible de récupérer les stats (chaîne non liée ou fonctionnalité indisponible).\n\n> ${zts.sig()}`,
          }, { msgOptions: { quoted: msg } });
          return;
        }

        const subs  = meta.subscribers ?? meta.subscriberCount ?? 'N/A';
        const views = meta.viewCount ?? meta.preview?.views ?? 'N/A';
        const name  = meta.name ?? meta.nameText ?? 'Ma chaîne';

        await antiBan.safeSend(sock, jid, {
          text: `📊 *Stats de la chaîne — ${name}*\n\n` +
                `👥 Abonnés: ${subs}\n` +
                `👀 Vues: ${views}\n\n` +
                `> ${zts.sig()}`,
        }, { msgOptions: { quoted: msg } });
      } catch (e) {
        await antiBan.safeSend(sock, jid, {
          text: `❌ Erreur récupération des stats: ${e.message}\n\n> ${zts.sig()}`,
        }, { msgOptions: { quoted: msg } });
      }
      return;
    }

    // ── Aide par défaut ─────────────────────────────────────────────────
    await antiBan.safeSend(sock, jid, {
      text: `📡 *Gestion de la chaîne — ZERO TRACE BOT*\n\n` +
            `• \`.channel set\` — Lier la chaîne (à exécuter dans le chat de la chaîne)\n` +
            `• \`.channel post [texte]\` — Publier un message\n` +
            `• \`.channel image [texte]\` — Publier une image (réponse/citation)\n` +
            `• \`.channel video [texte]\` — Publier une vidéo (réponse/citation)\n` +
            `• \`.channel schedule [HH:mm|ISO] [texte]\` — Programmer une publication\n` +
            `• \`.channel scheduled\` — Lister les publications programmées\n` +
            `• \`.channel unschedule [id]\` — Annuler une publication\n` +
            `• \`.channel stats\` — Stats (abonnés, vues)\n\n` +
            `> 🔐 Réservé Owner + Sudo\n> ${zts.sig()}`,
    }, { msgOptions: { quoted: msg } });
  },
};
