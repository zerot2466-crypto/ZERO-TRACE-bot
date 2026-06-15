/**
 * ZERO TRACE BOT v5.0 — Créateur de commandes à chaud
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * .createcmd <nom> | <catégorie> | <code JS>
 *   → crée commands/<nom>.js ET l'injecte dans COMMANDS sans redémarrage
 *
 * .createcmd install   (répondre à un fichier .js)
 *   → installe un fichier .js envoyé et l'injecte à chaud
 *
 * .createcmd list      → liste les commandes créées dynamiquement
 * .createcmd remove <nom> → retire une commande injectée (sans supprimer le fichier)
 *
 * RÉSERVÉ OWNER UNIQUEMENT
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const vm   = require('vm');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

const COMMANDS_DIR = path.join(__dirname, '.');
const DYNAMIC_LOG  = path.join(__dirname, '../data/dynamic_commands.json');

// ── Registre des commandes injectées dynamiquement ────────────────────────────
function loadLog() {
  try { return JSON.parse(fs.readFileSync(DYNAMIC_LOG, 'utf8')); } catch { return {}; }
}
function saveLog(log) {
  fs.writeFileSync(DYNAMIC_LOG, JSON.stringify(log, null, 2));
}

// ── Validation syntaxe JS via vm.Script ───────────────────────────────────────
function validateSyntax(code) {
  try {
    new vm.Script(code);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

// ── Vérifications de sécurité minimales ───────────────────────────────────────
const DANGEROUS = [
  /require\s*\(\s*['"]child_process['"]\s*\)/,
  /process\.exit/,
  /fs\.rmdir|fs\.unlink|fs\.rm\b/,
  /eval\s*\(/,
  /Function\s*\(/,
];
function securityCheck(code) {
  for (const pattern of DANGEROUS) {
    if (pattern.test(code)) {
      return { ok: false, reason: `Pattern dangereux détecté : \`${pattern.source}\`` };
    }
  }
  if (!code.includes('module.exports')) {
    return { ok: false, reason: 'Le fichier doit contenir `module.exports`' };
  }
  return { ok: true };
}

// ── Template pour une nouvelle commande ──────────────────────────────────────
function buildTemplate(name, category, description, code) {
  return `/**
 * ZERO TRACE BOT — Commande : .${name}
 * Catégorie : ${category}
 * Créée dynamiquement le ${new Date().toLocaleDateString('fr-FR')}
 */

'use strict';

module.exports = {
  name:     '${name}',
  usage:    '.${name}',
  category: '${category}',
  description: '${description}',

  async execute(ctx) {
    const { sock, jid, msg, args, antiBan, isOwner, isSudo, pushName } = ctx;

${code.split('\n').map(l => '    ' + l).join('\n')}
  },
};
`;
}

// ── Injection à chaud dans COMMANDS ──────────────────────────────────────────
// COMMANDS est passé via ctx.COMMANDS (référence directe à l'objet handler)
function injectCommand(COMMANDS, name, filePath) {
  // Purger le cache require pour recharger le module
  delete require.cache[require.resolve(filePath)];
  const mod = require(filePath);
  COMMANDS[name] = { fn: mod, cat: mod.category || 'util' };
  return mod;
}

// ── COMMANDE PRINCIPALE ───────────────────────────────────────────────────────
module.exports = {
  name:     'createcmd',
  usage:    '.createcmd <nom> | <cat> | <code>  |  .createcmd install  |  .createcmd list  |  .createcmd remove <nom>',
  category: 'owner',

  async execute(ctx) {
    const { sock, jid, msg, args, antiBan, isOwner, isSudo, COMMANDS } = ctx;

    // Accès owner uniquement
    if (!isOwner && !isSudo) {
      await antiBan.safeSend(sock, jid, {
        text: '❌ Commande réservée au propriétaire.',
      }, { msgOptions: { quoted: msg } });
      return;
    }

    const sub = (args[0] || '').toLowerCase();

    // ── .createcmd list ───────────────────────────────────────────────────
    if (sub === 'list') {
      const log = loadLog();
      const entries = Object.entries(log);
      if (!entries.length) {
        await antiBan.safeSend(sock, jid, {
          text: '📋 Aucune commande créée dynamiquement pour l\'instant.',
        }, { msgOptions: { quoted: msg } });
        return;
      }
      const lines = entries.map(([name, info]) =>
        `• .${name}  [${info.category}]  — ${new Date(info.createdAt).toLocaleDateString('fr-FR')}`
      ).join('\n');
      await antiBan.safeSend(sock, jid, {
        text: `📋 *Commandes créées dynamiquement (${entries.length})* :\n\n${lines}\n\n> ZERO TRACE BOT v5.0`,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    // ── .createcmd remove <nom> ───────────────────────────────────────────
    if (sub === 'remove') {
      const name = (args[1] || '').toLowerCase().trim();
      if (!name) {
        await antiBan.safeSend(sock, jid, {
          text: '❌ Usage : *.createcmd remove <nom>*',
        }, { msgOptions: { quoted: msg } });
        return;
      }
      const log = loadLog();
      if (!log[name]) {
        await antiBan.safeSend(sock, jid, {
          text: `❌ Commande *.${name}* non trouvée dans les commandes dynamiques.`,
        }, { msgOptions: { quoted: msg } });
        return;
      }
      delete COMMANDS[name];
      delete log[name];
      saveLog(log);
      await antiBan.safeSend(sock, jid, {
        text: `✅ Commande *.${name}* retirée à chaud.\n_(Le fichier est conservé dans commands/)_\n\n> ZERO TRACE BOT v5.0`,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    // ── .createcmd install (répondre à un fichier .js) ────────────────────
    if (sub === 'install') {
      const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
      const doc = msg.message?.documentMessage || quoted?.documentMessage;

      if (!doc) {
        await antiBan.safeSend(sock, jid, {
          text:
            '📎 *Installation d\'un fichier .js*\n\n' +
            'Envoie un fichier *.js* avec comme caption :\n' +
            '*.createcmd install*\n\n' +
            'Ou réponds à un fichier .js déjà envoyé avec cette commande.\n\n' +
            '> ZERO TRACE BOT v5.0',
        }, { msgOptions: { quoted: msg } });
        return;
      }

      const fileName = doc.fileName || 'unknown.js';
      if (!fileName.endsWith('.js')) {
        await antiBan.safeSend(sock, jid, {
          text: '❌ Seuls les fichiers *.js* sont acceptés.',
        }, { msgOptions: { quoted: msg } });
        return;
      }

      try {
        await antiBan.safeSend(sock, jid, {
          text: `📥 Téléchargement de *${fileName}*...`,
        }, { msgOptions: { quoted: msg } });

        const stream = await downloadContentFromMessage(doc, 'document');
        const chunks = [];
        for await (const chunk of stream) chunks.push(chunk);
        const code = Buffer.concat(chunks).toString('utf8');

        // Sécurité
        const sec = securityCheck(code);
        if (!sec.ok) {
          await antiBan.safeSend(sock, jid, {
            text: `🛑 *Fichier refusé — sécurité*\n\n${sec.reason}`,
          }, { msgOptions: { quoted: msg } });
          return;
        }

        // Syntaxe
        const syn = validateSyntax(code);
        if (!syn.ok) {
          await antiBan.safeSend(sock, jid, {
            text: `❌ *Erreur de syntaxe JS*\n\n${syn.error}`,
          }, { msgOptions: { quoted: msg } });
          return;
        }

        const destPath = path.join(COMMANDS_DIR, fileName);
        const existed  = fs.existsSync(destPath);

        // Backup si existant
        if (existed) {
          fs.copyFileSync(destPath, destPath.replace('.js', `_backup_${Date.now()}.js`));
        }

        fs.writeFileSync(destPath, code);

        // Injection à chaud
        const cmdName = fileName.replace('.js', '').toLowerCase();
        const mod     = injectCommand(COMMANDS, cmdName, destPath);

        // Log
        const log = loadLog();
        log[cmdName] = { file: fileName, category: mod.category || 'util', createdAt: Date.now(), source: 'upload' };
        saveLog(log);

        await antiBan.safeSend(sock, jid, {
          text:
            `✅ *${fileName}* ${existed ? 'mis à jour' : 'installé'} et injecté à chaud !\n\n` +
            `📁 commands/${fileName}\n` +
            `🔑 Commande disponible : *.${cmdName}*\n` +
            `📂 Catégorie : ${mod.category || 'util'}\n\n` +
            `_Aucun redémarrage nécessaire._\n\n> ZERO TRACE BOT v5.0`,
        }, { msgOptions: { quoted: msg } });

      } catch (err) {
        await antiBan.safeSend(sock, jid, {
          text: `❌ Erreur installation : ${err.message}`,
        }, { msgOptions: { quoted: msg } });
      }
      return;
    }

    // ── .createcmd <nom> | <catégorie> | <code> ───────────────────────────
    // Reconstituer le message complet (args peut être découpé)
    const fullText = ctx.body.slice(ctx.prefix.length + 'createcmd'.length).trim();
    const parts    = fullText.split('|').map(s => s.trim());

    if (parts.length < 3) {
      await antiBan.safeSend(sock, jid, {
        text:
          '📝 *Créer une commande*\n\n' +
          '*Usage :*\n' +
          '`.createcmd nom | catégorie | code JS`\n\n' +
          '*Exemple :*\n' +
          '`.createcmd bonjour | fun | await antiBan.safeSend(sock, jid, { text: \'👋 Bonjour \' + pushName }, { msgOptions: { quoted: msg } });`\n\n' +
          '*Catégories :* util, fun, media, admin, owner, ai, rpg, audio\n\n' +
          '*Autres sous-commandes :*\n' +
          '• `.createcmd install` → installer un fichier .js\n' +
          '• `.createcmd list` → lister les commandes créées\n' +
          '• `.createcmd remove <nom>` → retirer une commande\n\n' +
          '> ZERO TRACE BOT v5.0',
      }, { msgOptions: { quoted: msg } });
      return;
    }

    const [cmdName, category, ...codeParts] = parts;
    const code        = codeParts.join('|').trim();
    const safeName    = cmdName.toLowerCase().replace(/[^a-z0-9_-]/g, '');
    const safeCat     = ['util','fun','media','admin','owner','ai','rpg','audio'].includes(category.toLowerCase())
                        ? category.toLowerCase() : 'util';

    if (!safeName) {
      await antiBan.safeSend(sock, jid, {
        text: '❌ Nom de commande invalide (lettres, chiffres, tirets uniquement).',
      }, { msgOptions: { quoted: msg } });
      return;
    }

    if (!code) {
      await antiBan.safeSend(sock, jid, {
        text: '❌ Le code de la commande est vide.',
      }, { msgOptions: { quoted: msg } });
      return;
    }

    // Vérification si la commande existe déjà dans COMMANDS statiques
    if (COMMANDS[safeName] && !loadLog()[safeName]) {
      await antiBan.safeSend(sock, jid, {
        text: `⚠️ La commande *.${safeName}* existe déjà dans le bot.\n` +
              `Pour la remplacer, utilise *.createcmd install* avec un fichier.`,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    // Syntaxe check sur le code utilisateur
    const synCheck = validateSyntax(`async function __test__(ctx) { ${code} }`);
    if (!synCheck.ok) {
      await antiBan.safeSend(sock, jid, {
        text: `❌ *Erreur de syntaxe dans ton code :*\n\n${synCheck.error}\n\nCorrige et réessaie.`,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    // Sécurité
    const secCheck = securityCheck(code + '\nmodule.exports = {}');
    if (!secCheck.ok) {
      await antiBan.safeSend(sock, jid, {
        text: `🛑 *Code refusé — sécurité*\n\n${secCheck.reason}`,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    // Génération du fichier
    const fileContent = buildTemplate(safeName, safeCat, `Commande .${safeName}`, code);
    const destPath    = path.join(COMMANDS_DIR, `${safeName}.js`);
    const existed     = fs.existsSync(destPath);

    if (existed) {
      fs.copyFileSync(destPath, destPath.replace('.js', `_backup_${Date.now()}.js`));
    }

    try {
      fs.writeFileSync(destPath, fileContent);

      // Injection à chaud
      const mod = injectCommand(COMMANDS, safeName, destPath);

      // Log
      const log = loadLog();
      log[safeName] = { file: `${safeName}.js`, category: safeCat, createdAt: Date.now(), source: 'inline' };
      saveLog(log);

      await antiBan.safeSend(sock, jid, {
        text:
          `✅ *Commande .${safeName} créée et active !*\n\n` +
          `📁 commands/${safeName}.js\n` +
          `📂 Catégorie : ${safeCat}\n` +
          `⚡ Disponible immédiatement — aucun redémarrage.\n\n` +
          `Teste avec : *.${safeName}*\n\n> ZERO TRACE BOT v5.0`,
      }, { msgOptions: { quoted: msg } });

    } catch (err) {
      await antiBan.safeSend(sock, jid, {
        text: `❌ Erreur lors de la création : ${err.message}`,
      }, { msgOptions: { quoted: msg } });
    }
  },
};
