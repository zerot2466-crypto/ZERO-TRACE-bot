const zts = require('../lib/ztStyle');
/**
 * .speedtest / .ping2 — Test de latence et statut du bot
 */
module.exports = {
  name: 'speedtest',
  description: 'Tester la vitesse de réponse du bot',
  usage: '.speedtest',
  category: 'util',
  async execute(ctx) {
    const { sock, jid, msg, antiBan } = ctx;
    const start = Date.now();
    const sent  = await antiBan.safeSend(sock, jid, { text: '⏱️ Test en cours...' }, { msgOptions: { quoted: msg } });
    const latency = Date.now() - start;
    const memMb  = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1);
    const uptime = process.uptime();
    const h = Math.floor(uptime / 3600);
    const m = Math.floor((uptime % 3600) / 60);
    const s = Math.floor(uptime % 60);
    const speed = latency < 300 ? '🟢 Excellent' : latency < 800 ? '🟡 Bon' : '🔴 Lent';
    await antiBan.safeSend(sock, jid, {
      text:
        `\`\`\`[ZT-NET] Rapport de performance
Latence  : ${latency}ms — ${speed}
RAM      : ${memMb} MB
Uptime   : ${h}h ${m}m ${s}s
Réseau   : ONLINE ████████ 100%\`\`\`

> ${zts.sig()}`,
    }, { msgOptions: { quoted: msg } });
  },
};
