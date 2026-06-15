/**
 * ZERO TRACE BOT v5.0 — plugin.js
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Charger / décharger des commandes à chaud sans redémarrer
 *
 * Commandes :
 *   .plugin list              — voir les plugins chargés
 *   .plugin load [fichier]    — charger un plugin depuis data/plugins/
 *   .plugin unload [nom]      — décharger un plugin
 *   .plugin reload [nom]      — recharger un plugin
 *   .plugin info [nom]        — infos sur un plugin
 */
'use strict';

const fs   = require('fs-extra');
const path = require('path');

const PLUGINS_DIR  = path.join(__dirname, '../data/plugins');
const PLUGINS_FILE = path.join(__dirname, '../data/plugins_registry.json');
const BOT_TAG      = '> ⚡ _ZERO TRACE BOT v5.0_';

fs.ensureDirSync(PLUGINS_DIR);

// Registre des plugins chargés en mémoire
const loadedPlugins = new Map();

function loadRegistry() {
  try { return fs.readJsonSync(PLUGINS_FILE); } catch { return {}; }
}
function saveRegistry(d) {
  fs.ensureDirSync(path.dirname(PLUGINS_FILE));
  fs.writeJsonSync(PLUGINS_FILE, d, { spaces: 2 });
}

// Charger un plugin depuis le dossier plugins/
function loadPlugin(filename) {
  const filePath = path.join(PLUGINS_DIR, filename);
  if (!fs.existsSync(filePath)) throw new Error(`Fichier ${filename} introuvable dans data/plugins/`);

  // Vider le cache require pour forcer le rechargement
  delete require.cache[require.resolve(filePath)];

  const plugin = require(filePath);
  if (!plugin.name) throw new Error('Le plugin doit exporter un champ `name`');
  if (!plugin.execute) throw new Error('Le plugin doit exporter une fonction `execute`');

  loadedPlugins.set(plugin.name, { ...plugin, _file: filename, _loadedAt: Date.now() });
  return plugin;
}

// Décharger un plugin
function unloadPlugin(name) {
  const plugin = loadedPlugins.get(name);
  if (!plugin) return false;
  const filePath = path.join(PLUGINS_DIR, plugin._file);
  delete require.cache[require.resolve(filePath)];
  loadedPlugins.delete(name);
  return true;
}

// Récupérer toutes les commandes des plugins chargés (pour handler.js)
function getPluginCommands() {
  const cmds = {};
  for (const [name, plugin] of loadedPlugins) {
    cmds[name] = { fn: plugin, cat: plugin.category || 'plugin' };
    for (const alias of (plugin.aliases || [])) {
      cmds[alias] = { fn: plugin, cat: plugin.category || 'plugin' };
    }
  }
  return cmds;
}

// Auto-charger les plugins marqués comme actifs au démarrage
function autoLoad() {
  const registry = loadRegistry();
  let loaded = 0;
  for (const [name, info] of Object.entries(registry)) {
    if (info.autoload && info.file) {
      try {
        loadPlugin(info.file);
        loaded++;
      } catch (e) {
        console.error(`[PLUGIN] Auto-load échoué pour ${name}: ${e.message}`);
      }
    }
  }
  if (loaded) console.log(`[PLUGIN] ${loaded} plugin(s) auto-chargé(s)`);
}

module.exports = {
  name:             'plugin',
  aliases:          ['plugins', 'plug'],
  loadPlugin,
  unloadPlugin,
  getPluginCommands,
  autoLoad,
  loadedPlugins,

  execute: async (ctx) => {
    const { sock, jid, msg, args, antiBan, isOwner, isSudo } = ctx;

    if (!isOwner && !isSudo) {
      await antiBan.safeSend(sock, jid, {
        text: '🔒 Réservé owner/sudo.\n\n' + BOT_TAG,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    const sub = (args[0] || '').toLowerCase();

    // ── .plugin list ──────────────────────────────────────────────────────────
    if (!sub || sub === 'list') {
      // Plugins chargés en mémoire
      const loaded = [...loadedPlugins.entries()];

      // Fichiers disponibles mais pas chargés
      const available = fs.readdirSync(PLUGINS_DIR).filter(f => f.endsWith('.js'));
      const loadedFiles = loaded.map(([, p]) => p._file);
      const notLoaded  = available.filter(f => !loadedFiles.includes(f));

      let text = `🔌 *PLUGINS*\n━━━━━━━━━━━━━━━━━━━━━━\n\n`;

      if (loaded.length) {
        text += `*Chargés (${loaded.length}) :*\n`;
        text += loaded.map(([name, p]) => {
          const age = Math.round((Date.now() - p._loadedAt) / 1000 / 60);
          return `  ✅ \`${name}\` — ${p.description || 'Pas de description'} _(chargé il y a ${age}min)_`;
        }).join('\n');
        text += '\n\n';
      }

      if (notLoaded.length) {
        text += `*Disponibles non chargés (${notLoaded.length}) :*\n`;
        text += notLoaded.map(f => `  ◾ \`${f}\``).join('\n');
        text += '\n\n';
      }

      if (!loaded.length && !notLoaded.length) {
        text += `_Aucun plugin. Place des fichiers .js dans \`data/plugins/\`_\n\n`;
      }

      text +=
        `💡 \`.plugin load [fichier.js]\`\n` +
        `💡 \`.plugin unload [nom]\`\n\n` + BOT_TAG;

      await antiBan.safeSend(sock, jid, { text }, { msgOptions: { quoted: msg } });
      return;
    }

    // ── .plugin load [fichier] ────────────────────────────────────────────────
    if (sub === 'load') {
      const filename = args[1]?.endsWith('.js') ? args[1] : `${args[1]}.js`;
      if (!filename || filename === '.js') {
        await antiBan.safeSend(sock, jid, {
          text: '📂 Usage : `.plugin load [fichier.js]`\n\nPlace le fichier dans `data/plugins/`\n\n' + BOT_TAG,
        }, { msgOptions: { quoted: msg } });
        return;
      }
      try {
        const plugin = loadPlugin(filename);
        // Enregistrer pour l'autoload
        const registry   = loadRegistry();
        registry[plugin.name] = { file: filename, autoload: true, loadedAt: new Date().toISOString() };
        saveRegistry(registry);

        await antiBan.safeSend(sock, jid, {
          text:
            `✅ Plugin *${plugin.name}* chargé !\n\n` +
            `Commandes : ${[plugin.name, ...(plugin.aliases || [])].map(c => `.${c}`).join(', ')}\n\n` + BOT_TAG,
        }, { msgOptions: { quoted: msg } });
      } catch (e) {
        await antiBan.safeSend(sock, jid, {
          text: `❌ Chargement échoué : \`${e.message}\`\n\n` + BOT_TAG,
        }, { msgOptions: { quoted: msg } });
      }
      return;
    }

    // ── .plugin unload [nom] ──────────────────────────────────────────────────
    if (sub === 'unload') {
      const name = (args[1] || '').toLowerCase();
      if (unloadPlugin(name)) {
        const registry = loadRegistry();
        if (registry[name]) { registry[name].autoload = false; saveRegistry(registry); }
        await antiBan.safeSend(sock, jid, {
          text: `✅ Plugin *${name}* déchargé.\n\n` + BOT_TAG,
        }, { msgOptions: { quoted: msg } });
      } else {
        await antiBan.safeSend(sock, jid, {
          text: `❌ Plugin *${name}* non trouvé.\n\n` + BOT_TAG,
        }, { msgOptions: { quoted: msg } });
      }
      return;
    }

    // ── .plugin reload [nom] ──────────────────────────────────────────────────
    if (sub === 'reload') {
      const name   = (args[1] || '').toLowerCase();
      const plugin = loadedPlugins.get(name);
      if (!plugin) {
        await antiBan.safeSend(sock, jid, {
          text: `❌ Plugin *${name}* non chargé.\n\n` + BOT_TAG,
        }, { msgOptions: { quoted: msg } });
        return;
      }
      try {
        unloadPlugin(name);
        loadPlugin(plugin._file);
        await antiBan.safeSend(sock, jid, {
          text: `🔄 Plugin *${name}* rechargé.\n\n` + BOT_TAG,
        }, { msgOptions: { quoted: msg } });
      } catch (e) {
        await antiBan.safeSend(sock, jid, {
          text: `❌ Rechargement échoué : \`${e.message}\`\n\n` + BOT_TAG,
        }, { msgOptions: { quoted: msg } });
      }
      return;
    }

    // ── .plugin info [nom] ────────────────────────────────────────────────────
    if (sub === 'info') {
      const name   = (args[1] || '').toLowerCase();
      const plugin = loadedPlugins.get(name);
      if (!plugin) {
        await antiBan.safeSend(sock, jid, {
          text: `❌ Plugin *${name}* non chargé.\n\n` + BOT_TAG,
        }, { msgOptions: { quoted: msg } });
        return;
      }
      const age = Math.round((Date.now() - plugin._loadedAt) / 1000 / 60);
      await antiBan.safeSend(sock, jid, {
        text:
          `🔌 *Plugin : ${plugin.name}*\n━━━━━━━━━━━━━━━━━━━━━━\n\n` +
          `Description : ${plugin.description || 'N/A'}\n` +
          `Fichier     : ${plugin._file}\n` +
          `Catégorie   : ${plugin.category || 'plugin'}\n` +
          `Commandes   : ${[plugin.name, ...(plugin.aliases || [])].map(c => `.${c}`).join(', ')}\n` +
          `Chargé      : il y a ${age} min\n\n` + BOT_TAG,
      }, { msgOptions: { quoted: msg } });
      return;
    }
  },
};
