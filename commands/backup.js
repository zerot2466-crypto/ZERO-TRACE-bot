/**
 * ZERO TRACE BOT v5.0 — backup.js
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Sauvegarder toute la config du bot en un ZIP envoyé en DM
 * Owner/sudo uniquement
 *
 * Commandes :
 *   .backup         — créer et recevoir un backup complet en DM
 *   .backup list    — voir les fichiers inclus dans le backup
 */
'use strict';

const fs     = require('fs-extra');
const path   = require('path');
const os     = require('os');
const crypto = require('crypto');

const BOT_TAG = '> ⚡ _ZERO TRACE BOT v5.0_';
const ROOT    = path.join(__dirname, '..');

// Fichiers et dossiers à inclure dans le backup
const BACKUP_TARGETS = [
  // Config principale
  { src: 'data',                  desc: 'Données bot (groupSettings, welcome, notes...)' },
  { src: '.env',                  desc: 'Variables d\'environnement' },
  { src: 'settings.js',           desc: 'Paramètres par défaut' },
  // Session Baileys (optionnel — lourd)
  // { src: 'auth_info_baileys', desc: 'Session WhatsApp' },
];

module.exports = {
  name:    'backup',
  aliases: ['sauvegarde', 'export'],

  execute: async (ctx) => {
    const { sock, jid, msg, antiBan, isOwner, isSudo, sender, args, isGroup, isOwnerContext} = ctx;

    if (!ctx.isOwnerContext) {
      await antiBan.safeSend(sock, jid, {
        text: '🔒 Commande réservée au *propriétaire* et aux *sudos*.\n\n' + BOT_TAG,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    const sub = (args[0] || '').toLowerCase();

    // ── .backup list ──────────────────────────────────────────────────────────
    if (sub === 'list') {
      const lines = BACKUP_TARGETS.map(t => {
        const fullPath = path.join(ROOT, t.src);
        const exists   = fs.existsSync(fullPath);
        const size     = exists
          ? (fs.statSync(fullPath).isDirectory()
              ? `${fs.readdirSync(fullPath).length} fichiers`
              : `${Math.round(fs.statSync(fullPath).size / 1024)}KB`)
          : 'absent';
        return `  ${exists ? '✅' : '❌'} \`${t.src}\` — ${t.desc} (${size})`;
      });

      await antiBan.safeSend(sock, jid, {
        text:
          `📦 *BACKUP — CONTENU*\n` +
          `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
          `${lines.join('\n')}\n\n` +
          `💡 \`.backup\` pour recevoir le ZIP en DM\n\n` + BOT_TAG,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    // ── .backup — créer le ZIP ─────────────────────────────────────────────────
    await antiBan.safeSend(sock, jid, {
      text: '📦 _Création du backup en cours..._',
    }, { msgOptions: { quoted: msg } });

    const timestamp = new Date().toISOString().slice(0, 16).replace('T', '_').replace(':', 'h');
    const zipName   = `ZERO_TRACE_backup_${timestamp}.zip`;
    const zipPath   = path.join(os.tmpdir(), zipName);

    try {
      // Utiliser archiver si disponible, sinon fallback manuel
      let zipBuffer = null;

      try {
        const archiver = require('archiver');
        zipBuffer = await new Promise((resolve, reject) => {
          const bufs   = [];
          const output = require('stream').PassThrough();
          output.on('data', d => bufs.push(d));
          output.on('end', () => resolve(Buffer.concat(bufs)));
          output.on('error', reject);

          const archive = archiver('zip', { zlib: { level: 6 } });
          archive.pipe(output);

          for (const target of BACKUP_TARGETS) {
            const fullPath = path.join(ROOT, target.src);
            if (!fs.existsSync(fullPath)) continue;
            const stat = fs.statSync(fullPath);
            if (stat.isDirectory()) {
              archive.directory(fullPath, target.src);
            } else {
              archive.file(fullPath, { name: target.src });
            }
          }

          archive.finalize();
        });
      } catch {
        // Fallback : créer un fichier texte avec les données importantes
        const lines = ['# ZERO TRACE BOT v5.0 — BACKUP\n', `Date: ${new Date().toISOString()}\n\n`];

        for (const target of BACKUP_TARGETS) {
          const fullPath = path.join(ROOT, target.src);
          if (!fs.existsSync(fullPath)) continue;
          const stat = fs.statSync(fullPath);

          if (!stat.isDirectory() && stat.size < 100 * 1024) {
            try {
              const content = fs.readFileSync(fullPath, 'utf8');
              lines.push(`\n${'='.repeat(60)}\n`);
              lines.push(`FILE: ${target.src}\n`);
              lines.push(`${'='.repeat(60)}\n`);
              lines.push(content + '\n');
            } catch {}
          } else if (stat.isDirectory()) {
            const files = fs.readdirSync(fullPath);
            lines.push(`\n# DOSSIER: ${target.src}/ (${files.length} fichiers)\n`);
            for (const f of files.slice(0, 20)) {
              try {
                const fp = path.join(fullPath, f);
                const fc = fs.readFileSync(fp, 'utf8');
                if (fc.length < 50000) {
                  lines.push(`\n## ${f}\n${fc}\n`);
                }
              } catch {}
            }
          }
        }

        zipBuffer = Buffer.from(lines.join(''), 'utf8');
      }

      if (!zipBuffer || zipBuffer.length === 0) {
        throw new Error('Backup vide — aucun fichier trouvé');
      }

      // ── Envoyer en DM à l'owner ───────────────────────────────────────────
      // Si fromMe (owner tape dans le DM d'un contact) → envoyer au proprio en DM perso
      // Si groupe → envoyer en DM
      // Si DM entrant → envoyer dans ce DM
      const ownerNum    = (process.env.OWNER_NUMBER || '').replace(/[^0-9]/g, '');
      const ownerJidFmt = ownerNum + '@s.whatsapp.net';
      const targetJid   = isGroup ? ownerJidFmt : jid;

      const checksum = crypto.createHash('md5').update(zipBuffer).digest('hex').slice(0, 8);
      const sizeKB   = Math.round(zipBuffer.length / 1024);

      await sock.sendMessage(targetJid, {
        document: zipBuffer,
        fileName: zipName,
        mimetype: 'application/zip',
        caption:
          `📦 *BACKUP ZERO TRACE v5.0*\n` +
          `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
          `📅 Date   : ${new Date().toLocaleString('fr-FR')}\n` +
          `📏 Taille : ${sizeKB}KB\n` +
          `🔑 MD5    : \`${checksum}\`\n\n` +
          `Contenu :\n` +
          BACKUP_TARGETS.map(t => `  • \`${t.src}/\` — ${t.desc}`).join('\n') +
          `\n\n⚠️ _Garde ce fichier en sécurité_\n\n` + BOT_TAG,
      });

      if (isGroup) {
        await antiBan.safeSend(sock, jid, {
          text: `✅ Backup envoyé en DM ! (${sizeKB}KB)\n\n` + BOT_TAG,
        }, { msgOptions: { quoted: msg } });
      }

    } catch (e) {
      await antiBan.safeSend(sock, jid, {
        text: `❌ Backup échoué : \`${e.message}\`\n\n` + BOT_TAG,
      }, { msgOptions: { quoted: msg } });
    }
  },
};
