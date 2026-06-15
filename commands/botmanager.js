/**
 * ╔══════════════════════════════════════════╗
 * ║        ZERO TRACE - BOT MANAGER          ║
 * ║   Contrôle le bot en langage naturel     ║
 * ╚══════════════════════════════════════════╝
 *
 * FONCTIONNALITÉS :
 * 1. Commandes naturelles : "active anti-delete", "change prefix to !"
 * 2. Réception de fichiers .js et intégration automatique
 * 3. Redémarrage du bot via commande
 *
 * UTILISATION (en MP ou groupe avec bot):
 * - "zero trace active anti delete"
 * - "zero trace désactive autotyping"
 * - "zero trace change le prefix en !"
 * - "zero trace redémarre"
 * - Envoyer un fichier .js avec caption "ajoute cette commande"
 *
 * INSTALLATION :
 * 1. Copie ce fichier dans ton dossier commands/
 * 2. Dans main.js, ajoute en haut :
 *    const { handleBotManager, handleFileInstall } = require('./commands/botmanager');
 * 3. Dans le handler de messages entrants, ajoute :
 *    await handleBotManager(sock, chatId, message, senderId, isOwner);
 *    await handleFileInstall(sock, chatId, message, senderId, isOwner);
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

// ─── Chemins ────────────────────────────────────────────────────────────────
const ROOT          = path.join(__dirname, '..');
const SETTINGS_PATH = path.join(ROOT, 'settings.js');
const DATA_DIR      = path.join(ROOT, 'data');
const COMMANDS_DIR  = path.join(ROOT, 'commands');

// Fichiers de config connus
const DATA_FILES = {
    antidelete  : path.join(DATA_DIR, 'antidelete.json'),
    autotyping  : path.join(DATA_DIR, 'autotyping.json'),
    autoread    : path.join(DATA_DIR, 'autoread.json'),
    autostatus  : path.join(DATA_DIR, 'autoStatus.json'),
};

// ─── Helpers ────────────────────────────────────────────────────────────────
function readJSON(filePath) {
    try { return JSON.parse(fs.readFileSync(filePath, 'utf8')); }
    catch { return {}; }
}

function writeJSON(filePath, data) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function readSettings() {
    // On lit le fichier settings.js comme texte pour le modifier
    return fs.readFileSync(SETTINGS_PATH, 'utf8');
}

function writeSettings(content) {
    fs.writeFileSync(SETTINGS_PATH, content, 'utf8');
}

// ─── Détection de l'intention ───────────────────────────────────────────────
function detectIntent(text) {
    const t = text.toLowerCase().trim();

    // Mots-clés d'activation
    const ON_WORDS  = ['active', 'activer', 'enable', 'allumer', 'mets', 'mettre', 'démarre', 'lance', 'on'];
    const OFF_WORDS = ['désactive', 'desactive', 'disable', 'éteins', 'eteins', 'coupe', 'arrête', 'stop', 'off'];

    // Features reconnaissables
    const FEATURES = {
        antidelete : ['anti.?delete', 'antidelete', 'anti delete', 'anti suppression'],
        autotyping : ['auto.?typing', 'autotyping', 'auto typing', 'frappe auto'],
        autoread   : ['auto.?read', 'autoread', 'auto read', 'lecture auto', 'lire auto'],
        autostatus : ['auto.?status', 'autostatus', 'status auto'],
    };

    // Redémarrage
    if (/red[eé]marre|restart|reboot|relance/.test(t)) {
        return { type: 'restart' };
    }

    // Changement de prefix
    const prefixMatch = t.match(/(?:change|modifier|mets?|set)\s+(?:le\s+)?prefix\s+(?:en|to|a|à|:)?\s*["']?([^\s"']+)["']?/i);
    if (prefixMatch) {
        return { type: 'prefix', value: prefixMatch[1] };
    }

    // Changement de nom du bot
    const nameMatch = t.match(/(?:change|modifier|renomme|appelle)\s+(?:le\s+)?(?:nom|name)\s+(?:du\s+bot\s+)?(?:en|to|a|à|:)?\s*["']?(.+?)["']?$/i);
    if (nameMatch) {
        return { type: 'botname', value: nameMatch[1].trim() };
    }

    // Mode public/privé
    if (/mode\s+(public|privé|prive|private)/.test(t)) {
        const modeMatch = t.match(/mode\s+(public|privé|prive|private)/i);
        return { type: 'mode', value: modeMatch[1].replace('privé','private').replace('prive','private') };
    }

    // ON/OFF features
    for (const [feature, patterns] of Object.entries(FEATURES)) {
        for (const pat of patterns) {
            if (new RegExp(pat, 'i').test(t)) {
                // Check ON
                for (const w of ON_WORDS) {
                    if (t.includes(w)) return { type: 'toggle', feature, enabled: true };
                }
                // Check OFF
                for (const w of OFF_WORDS) {
                    if (t.includes(w)) return { type: 'toggle', feature, enabled: false };
                }
                // Pas clair → demande confirmation
                return { type: 'unknown_toggle', feature };
            }
        }
    }

    return null;
}

// ─── Exécution de l'intention ───────────────────────────────────────────────
async function executeIntent(sock, chatId, message, intent) {
    const reply = (text) => sock.sendMessage(chatId, { text }, { quoted: message });

    switch (intent.type) {

        // ── Toggle feature (antidelete, autotyping, etc.) ──
        case 'toggle': {
            const filePath = DATA_FILES[intent.feature];
            if (!filePath || !fs.existsSync(filePath)) {
                return reply(`❌ Fichier de config introuvable pour *${intent.feature}*`);
            }
            const data = readJSON(filePath);
            data.enabled = intent.enabled;
            writeJSON(filePath, data);
            const état = intent.enabled ? '✅ *ACTIVÉ*' : '🔴 *DÉSACTIVÉ*';
            return reply(`${état} — *${intent.feature}* a été ${intent.enabled ? 'activé' : 'désactivé'} avec succès 😈`);
        }

        // ── Prefix ──
        case 'prefix': {
            let content = readSettings();
            content = content.replace(
                /prefix:\s*["'][^"']*["']/,
                `prefix: "${intent.value}"`
            );
            writeSettings(content);
            return reply(`✅ Prefix changé en *${intent.value}* 😈\n_(Redémarre le bot pour appliquer)_`);
        }

        // ── Bot name ──
        case 'botname': {
            let content = readSettings();
            content = content.replace(
                /botName:\s*["'][^"']*["']/,
                `botName: "${intent.value}"`
            );
            writeSettings(content);
            return reply(`✅ Nom du bot changé en *${intent.value}* 😈\n_(Redémarre pour appliquer)_`);
        }

        // ── Mode public/privé ──
        case 'mode': {
            let content = readSettings();
            content = content.replace(
                /commandMode:\s*["'][^"']*["']/,
                `commandMode: "${intent.value}"`
            );
            writeSettings(content);
            return reply(`✅ Mode changé en *${intent.value}* 😈\n_(Redémarre pour appliquer)_`);
        }

        // ── Redémarrage ──
        case 'restart': {
            await reply('🔄 Redémarrage du bot en cours... *ZERO TRACE* reviendra dans quelques secondes 😈');
            setTimeout(() => {
                console.log('🔄 Bot restart requested via BotManager');
                process.exit(0); // PM2 / forever relancera automatiquement
            }, 2000);
            break;
        }

        // ── Intention floue ──
        case 'unknown_toggle': {
            return reply(`🤔 Tu veux activer ou désactiver *${intent.feature}* ?\nDis-moi : *active ${intent.feature}* ou *désactive ${intent.feature}*`);
        }

        default:
            return null;
    }
}

// ─── Handler principal : commandes texte ────────────────────────────────────
async function handleBotManager(sock, chatId, message, senderId, isOwner) {
    if (!isOwner) return; // Réservé au propriétaire uniquement

    const body = (
        message.message?.conversation ||
        message.message?.extendedTextMessage?.text ||
        message.message?.imageMessage?.caption ||
        message.message?.documentMessage?.caption ||
        ''
    ).trim();

    if (!body) return;

    // Le message doit commencer par "zero trace" (insensible à la casse/accents)
    const TRIGGER = /^zero\s+trace\b/i;
    if (!TRIGGER.test(body)) return;

    // Extraire la commande après "zero trace"
    const cmd = body.replace(TRIGGER, '').trim();
    if (!cmd) {
        // Message d'aide
        return sock.sendMessage(chatId, {
            text: `🤖 *ZERO TRACE - BOT MANAGER*\n\n` +
                  `Voici ce que tu peux me dire :\n\n` +
                  `▸ *zero trace active anti delete*\n` +
                  `▸ *zero trace désactive autotyping*\n` +
                  `▸ *zero trace active autoread*\n` +
                  `▸ *zero trace active autostatus*\n` +
                  `▸ *zero trace change le prefix en !*\n` +
                  `▸ *zero trace change le nom en MonBot*\n` +
                  `▸ *zero trace mode public*\n` +
                  `▸ *zero trace mode privé*\n` +
                  `▸ *zero trace redémarre*\n\n` +
                  `📎 Envoie un fichier *.js* avec la caption\n` +
                  `*"ajoute cette commande"* pour l'installer.`
        }, { quoted: message });
    }

    const intent = detectIntent(cmd);

    if (!intent) {
        return sock.sendMessage(chatId, {
            text: `❓ Je n'ai pas compris *"${cmd}"*\n\nDis *zero trace* sans rien pour voir les commandes disponibles.`
        }, { quoted: message });
    }

    await executeIntent(sock, chatId, message, intent);
}

// ─── Handler : installation de fichiers .js ─────────────────────────────────
async function handleFileInstall(sock, chatId, message, senderId, isOwner) {
    if (!isOwner) return;

    const doc = message.message?.documentMessage;
    if (!doc) return;

    const caption = (doc.caption || '').toLowerCase().trim();
    const fileName = doc.fileName || '';

    // Déclencheur : caption contient "ajoute" ou "installe" + fichier .js
    const isInstallRequest = /ajoute|installe|install|add|intègre|integre/.test(caption);
    const isJsFile = fileName.endsWith('.js');

    if (!isInstallRequest || !isJsFile) return;

    try {
        await sock.sendMessage(chatId, {
            text: `📥 Téléchargement de *${fileName}*...`
        }, { quoted: message });

        // Télécharger le fichier
        const stream = await downloadContentFromMessage(doc, 'document');
        const chunks = [];
        for await (const chunk of stream) chunks.push(chunk);
        const buffer = Buffer.concat(chunks);
        const fileContent = buffer.toString('utf8');

        // Vérification basique de sécurité : le fichier doit exporter quelque chose
        if (!fileContent.includes('module.exports')) {
            return sock.sendMessage(chatId, {
                text: `⚠️ Fichier invalide : *${fileName}* ne contient pas de \`module.exports\`.\nVérifie que c'est bien un module Node.js valide.`
            }, { quoted: message });
        }

        // Chemin de destination
        const destPath = path.join(COMMANDS_DIR, fileName);
        const alreadyExists = fs.existsSync(destPath);

        // Backup si le fichier existe déjà
        if (alreadyExists) {
            const backupPath = destPath.replace('.js', `_backup_${Date.now()}.js`);
            fs.copyFileSync(destPath, backupPath);
        }

        // Écriture du fichier
        fs.writeFileSync(destPath, buffer);

        const statusMsg = alreadyExists
            ? `✅ *${fileName}* mis à jour avec succès ! (ancien fichier sauvegardé)`
            : `✅ *${fileName}* installé dans \`commands/\` avec succès !`;

        await sock.sendMessage(chatId, {
            text: `${statusMsg}\n\n` +
                  `📁 Chemin : \`commands/${fileName}\`\n\n` +
                  `⚠️ *N'oublie pas de l'importer dans main.js !*\n\n` +
                  `💡 Dis *zero trace redémarre* pour redémarrer le bot.`
        }, { quoted: message });

    } catch (err) {
        console.error('❌ BotManager - Erreur installation fichier:', err);
        await sock.sendMessage(chatId, {
            text: `❌ Erreur lors de l'installation : ${err.message}`
        }, { quoted: message });
    }
}

// ─── Statut du bot ──────────────────────────────────────────────────────────
async function handleBotStatus(sock, chatId, message) {
    const statuses = {};
    for (const [name, filePath] of Object.entries(DATA_FILES)) {
        if (fs.existsSync(filePath)) {
            const data = readJSON(filePath);
            statuses[name] = data.enabled ? '✅' : '🔴';
        }
    }

    // Lire le prefix depuis settings
    let prefix = '?';
    try {
        const settingsContent = readSettings();
        const prefixMatch = settingsContent.match(/prefix:\s*["']([^"']+)["']/);
        if (prefixMatch) prefix = prefixMatch[1];
    } catch {}

    const lines = Object.entries(statuses)
        .map(([k, v]) => `  ${v} ${k}`)
        .join('\n');

    return sock.sendMessage(chatId, {
        text: `📊 *ZERO TRACE - STATUT*\n\n` +
              `🔧 Prefix actuel : *${prefix}*\n\n` +
              `*Features :*\n${lines}`
    }, { quoted: message });
}

module.exports = {
    handleBotManager,
    handleFileInstall,
    handleBotStatus,
    detectIntent,      // exporté pour les tests
};
