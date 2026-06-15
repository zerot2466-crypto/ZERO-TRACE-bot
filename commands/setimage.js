/**
 * ZERO TRACE BOT v5.0 — Gestionnaire d'images des commandes
 * ──────────────────────────────────────────────────────────
 * Permet à l'owner de gérer les images utilisées par le bot
 * (images supremacy, menu, bannières des commandes)
 *
 * COMMANDES :
 *   .setimage add          → Ajouter l'image citée au pool supremacy
 *   .setimage list         → Voir combien d'images sont dans chaque dossier
 *   .setimage clear        → Vider le pool supremacy (remet les images par défaut)
 *   .setimage setbanner    → Définir l'image de bannière du bot (alive/info)
 *   .setimage setbot       → Définir l'image principale du bot (assets/bot_image.jpg)
 */
'use strict';

const { downloadMediaMessage } = require('@whiskeysockets/baileys');

const fs   = require('fs-extra');
const path = require('path');

const ASSETS_DIR    = path.join(__dirname, '../assets');
const SUPREMACY_DIR = path.join(ASSETS_DIR, 'supremacy');
const MENU_DIR      = path.join(ASSETS_DIR, 'menu');
const MES_IMG_DIR   = path.join(ASSETS_DIR, 'mes_images');
const BOT_IMG_PATH  = path.join(ASSETS_DIR, 'bot_image.jpg');

module.exports = {
  name:        'setimage',
  aliases:     ['imgset', 'botimage', 'setimg'],
  description: 'Gérer les images du bot (supremacy, bannière, bot_image)',
  usage:       '.setimage [add|list|clear|setbanner|setbot]',
  category:    'bot',
  ownerOnly:   true,

  async execute(ctx) {
    const { sock, jid, msg, args, antiBan, isOwner } = ctx;

    if (!isOwner) {
      await antiBan.safeSend(sock, jid, {
        text: '❌ Commande réservée au propriétaire du bot.',
      }, { msgOptions: { quoted: msg } });
      return;
    }

    const sub = (args[0] || 'list').toLowerCase();

    // ── .setimage list ────────────────────────────────────────────────────────
    if (sub === 'list') {
      const countDir = (dir) => {
        if (!fs.existsSync(dir)) return 0;
        return fs.readdirSync(dir).filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f)).length;
      };

      const supCount  = countDir(SUPREMACY_DIR);
      const menuCount = countDir(MENU_DIR);
      const imgCount  = countDir(MES_IMG_DIR);
      const hasBotImg = fs.existsSync(BOT_IMG_PATH);

      await antiBan.safeSend(sock, jid, {
        text:
          `🖼️ *ZERO TRACE — Images du bot*\n` +
          `━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
          `📁 *assets/supremacy/* : ${supCount} image(s)\n` +
          `   └ Images après commandes (rotation)\n\n` +
          `📁 *assets/menu/* : ${menuCount} image(s)\n` +
          `   └ Images du carousel menu\n\n` +
          `📁 *assets/mes_images/* : ${imgCount} image(s)\n` +
          `   └ Pool général d'images\n\n` +
          `🤖 *bot_image.jpg* : ${hasBotImg ? '✅ présente' : '❌ absente'}\n` +
          `   └ Image de .alive / .info / .owner\n\n` +
          `*Total pool supremacy :* ${supCount + menuCount + imgCount} images\n\n` +
          `💡 *Commandes :*\n` +
          `• *.setimage add* — Envoie une image en citant cette commande\n` +
          `• *.setimage setbot* — Définir l'image principale du bot\n` +
          `• *.setimage setbanner* — Définir une image bannière supremacy\n` +
          `• *.setimage clear* — Vider le dossier supremacy\n\n` +
          `> *ZERO TRACE BOT v5.0*`,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    // ── .setimage add ─────────────────────────────────────────────────────────
    if (sub === 'add') {
      const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
      const imgMsg = quoted?.imageMessage;

      if (!imgMsg) {
        await antiBan.safeSend(sock, jid, {
          text:
            `📸 *Comment ajouter une image au pool supremacy :*\n\n` +
            `1️⃣ Envoie une image dans le chat\n` +
            `2️⃣ Réponds à cette image avec *.setimage add*\n\n` +
            `L'image sera ajoutée dans *assets/supremacy/*\n` +
            `et utilisée après les commandes du bot.\n\n` +
            `> *ZERO TRACE BOT v5.0*`,
        }, { msgOptions: { quoted: msg } });
        return;
      }

      try {
        await sock.sendMessage(jid, { react: { text: '⏳', key: msg.key } }).catch(() => {});

        // Télécharger l'image
        const buffer = await downloadMediaMessage(
          { message: { imageMessage: imgMsg } },
          'buffer',
          {},
          {}  // compat Baileys 6.x
        );

        // Sauvegarder dans supremacy/
        fs.ensureDirSync(SUPREMACY_DIR);
        const filename = `supremacy_${Date.now()}.jpg`;
        const savePath = path.join(SUPREMACY_DIR, filename);
        fs.writeFileSync(savePath, buffer);

        await sock.sendMessage(jid, { react: { text: '✅', key: msg.key } }).catch(() => {});
        await antiBan.safeSend(sock, jid, {
          text:
            `✅ *Image ajoutée au pool supremacy !*\n\n` +
            `📁 Sauvegardée : *${filename}*\n` +
            `📂 Dossier : *assets/supremacy/*\n\n` +
            `Elle apparaîtra après les commandes du bot.\n\n` +
            `> *ZERO TRACE BOT v5.0*`,
        }, { msgOptions: { quoted: msg } });

      } catch (e) {
        await sock.sendMessage(jid, { react: { text: '❌', key: msg.key } }).catch(() => {});
        await antiBan.safeSend(sock, jid, {
          text: `❌ Erreur lors de l'ajout de l'image : ${e.message}`,
        }, { msgOptions: { quoted: msg } });
      }
      return;
    }

    // ── .setimage setbot ──────────────────────────────────────────────────────
    if (sub === 'setbot') {
      const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
      const imgMsg = quoted?.imageMessage;

      if (!imgMsg) {
        await antiBan.safeSend(sock, jid, {
          text:
            `🤖 *Définir l'image principale du bot :*\n\n` +
            `Réponds à une image avec *.setimage setbot*\n\n` +
            `Cette image sera utilisée par :\n` +
            `• *.alive* — Statut du bot\n` +
            `• *.info* — Informations\n` +
            `• *.owner* — Carte propriétaire\n\n` +
            `> *ZERO TRACE BOT v5.0*`,
        }, { msgOptions: { quoted: msg } });
        return;
      }

      try {
        await sock.sendMessage(jid, { react: { text: '⏳', key: msg.key } }).catch(() => {});

        const buffer = await downloadMediaMessage(
          { message: { imageMessage: imgMsg } },
          'buffer',
          {},
          {}  // compat Baileys 6.x
        );

        fs.ensureDirSync(ASSETS_DIR);
        // Backup de l'ancienne image
        if (fs.existsSync(BOT_IMG_PATH)) {
          fs.copySync(BOT_IMG_PATH, path.join(ASSETS_DIR, `bot_image_backup_${Date.now()}.jpg`));
        }
        fs.writeFileSync(BOT_IMG_PATH, buffer);

        await sock.sendMessage(jid, { react: { text: '✅', key: msg.key } }).catch(() => {});
        await antiBan.safeSend(sock, jid, {
          text:
            `✅ *Image principale du bot mise à jour !*\n\n` +
            `📁 Sauvegardée : *assets/bot_image.jpg*\n` +
            `Elle sera utilisée par .alive, .info et .owner.\n\n` +
            `> *ZERO TRACE BOT v5.0*`,
        }, { msgOptions: { quoted: msg } });

      } catch (e) {
        await sock.sendMessage(jid, { react: { text: '❌', key: msg.key } }).catch(() => {});
        await antiBan.safeSend(sock, jid, {
          text: `❌ Erreur : ${e.message}`,
        }, { msgOptions: { quoted: msg } });
      }
      return;
    }

    // ── .setimage setbanner ───────────────────────────────────────────────────
    if (sub === 'setbanner') {
      const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
      const imgMsg = quoted?.imageMessage;

      if (!imgMsg) {
        await antiBan.safeSend(sock, jid, {
          text:
            `🖼️ *Ajouter une image bannière supremacy :*\n\n` +
            `Réponds à une image avec *.setimage setbanner*\n\n` +
            `Cette image sera prioritaire dans la rotation supremacy.\n\n` +
            `> *ZERO TRACE BOT v5.0*`,
        }, { msgOptions: { quoted: msg } });
        return;
      }

      try {
        await sock.sendMessage(jid, { react: { text: '⏳', key: msg.key } }).catch(() => {});

        const buffer = await downloadMediaMessage(
          { message: { imageMessage: imgMsg } },
          'buffer',
          {},
          {}  // compat Baileys 6.x
        );

        fs.ensureDirSync(SUPREMACY_DIR);
        const filename = `banner_${Date.now()}.jpg`;
        fs.writeFileSync(path.join(SUPREMACY_DIR, filename), buffer);

        await sock.sendMessage(jid, { react: { text: '✅', key: msg.key } }).catch(() => {});
        await antiBan.safeSend(sock, jid, {
          text:
            `✅ *Bannière ajoutée !*\n\n` +
            `📁 Sauvegardée : *${filename}*\n` +
            `📂 Dossier : *assets/supremacy/*\n\n` +
            `> *ZERO TRACE BOT v5.0*`,
        }, { msgOptions: { quoted: msg } });

      } catch (e) {
        await sock.sendMessage(jid, { react: { text: '❌', key: msg.key } }).catch(() => {});
        await antiBan.safeSend(sock, jid, { text: `❌ Erreur : ${e.message}` }, { msgOptions: { quoted: msg } });
      }
      return;
    }

    // ── .setimage clear ───────────────────────────────────────────────────────
    if (sub === 'clear') {
      try {
        if (!fs.existsSync(SUPREMACY_DIR)) {
          await antiBan.safeSend(sock, jid, {
            text: `📁 Le dossier *assets/supremacy/* est déjà vide.`,
          }, { msgOptions: { quoted: msg } });
          return;
        }

        const files = fs.readdirSync(SUPREMACY_DIR).filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f));
        for (const f of files) fs.removeSync(path.join(SUPREMACY_DIR, f));

        await antiBan.safeSend(sock, jid, {
          text:
            `🗑️ *${files.length} image(s) supprimée(s)* du dossier supremacy.\n\n` +
            `Le bot utilisera les images de *mes_images/* et *menu/* à la place.\n\n` +
            `> *ZERO TRACE BOT v5.0*`,
        }, { msgOptions: { quoted: msg } });

      } catch (e) {
        await antiBan.safeSend(sock, jid, { text: `❌ Erreur : ${e.message}` }, { msgOptions: { quoted: msg } });
      }
      return;
    }

    // ── Aide générale ─────────────────────────────────────────────────────────
    await antiBan.safeSend(sock, jid, {
      text:
        `🖼️ *Gestionnaire d'images — ZERO TRACE*\n\n` +
        `• *.setimage list* — Voir les images disponibles\n` +
        `• *.setimage add* — Ajouter une image au pool\n` +
        `• *.setimage setbot* — Image principale du bot\n` +
        `• *.setimage setbanner* — Ajouter une bannière\n` +
        `• *.setimage clear* — Vider le dossier supremacy\n\n` +
        `> *ZERO TRACE BOT v5.0*`,
    }, { msgOptions: { quoted: msg } });
  },
};
