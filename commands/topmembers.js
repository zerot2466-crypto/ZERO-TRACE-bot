/**
 * ZERO TRACE BOT v5.0 - Top Members (classement activité)
 * Compte les messages par membre dans le groupe
 */
const fs   = require('fs-extra');
const path = require('path');

const STATS_PATH = path.join(__dirname, '..', 'data', 'stats.json');

function loadStats() {
  try {
    if (fs.existsSync(STATS_PATH)) return fs.readJsonSync(STATS_PATH);
    return {};
  } catch { return {}; }
}

function saveStats(data) {
  try { fs.writeJsonSync(STATS_PATH, data, { spaces: 2 }); } catch (e) {}
}

function incrementStat(jid, sender) {
  const data = loadStats();
  if (!data[jid]) data[jid] = {};
  data[jid][sender] = (data[jid][sender] || 0) + 1;
  saveStats(data);
}

module.exports = {
  name: 'topmembers',
  description: 'Classement des membres les plus actifs',
  usage: '.topmembers',
  category: 'info',

  async execute(ctx) {
    const { sock, jid, msg, antiBan } = ctx;

    if (!jid.endsWith('@g.us')) {
      await antiBan.safeSend(sock, jid, { text: '❌ Commande réservée aux groupes.' }, { msgOptions: { quoted: msg } });
      return;
    }

    const data = loadStats();
    const groupStats = data[jid] || {};

    if (Object.keys(groupStats).length === 0) {
      await antiBan.safeSend(sock, jid, {
        text: '📊 Pas encore assez de données pour ce groupe.\nLe classement se remplit au fil des messages !',
      }, { msgOptions: { quoted: msg } });
      return;
    }

    const sorted = Object.entries(groupStats)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10);

    const medals = ['🥇','🥈','🥉','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣','🔟'];
    const list = sorted.map(([sender, count], i) =>
      `${medals[i]} @${sender.split('@')[0]} — *${count} messages*`
    ).join('\n');

    const mentions = sorted.map(([s]) => s);

    await antiBan.safeSend(sock, jid, {
      text:
        `📊 *TOP MEMBRES ACTIFS*\n\n` +
        `${list}\n\n` +
        `> *ZERO TRACE BOT v5.0*`,
      mentions,
    }, { msgOptions: { quoted: msg } });
  },

  // Exporté pour le handler (incrémenter à chaque message)
  incrementStat,
};
