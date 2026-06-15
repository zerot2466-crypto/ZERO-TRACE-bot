'use strict';
const zts = require('../lib/ztStyle');

module.exports = {
  name: 'ping',
  aliases: ['p', 'latence', 'speed'],
  description: 'Tester la latence du bot',
  usage: '.ping',
  category: 'util',

  async execute({ sock, jid, msg, antiBan }) {
    const start = Date.now();
    await antiBan.safeSend(sock, jid, { text: '📡 _Scan du réseau en cours..._' }, { msgOptions: { quoted: msg } });
    const ms = Date.now() - start;

    const bar  = ms < 200 ? '🟢🟢🟢🟢🟢' : ms < 500 ? '🟡🟡🟡⚪⚪' : '🔴🔴⚪⚪⚪';
    const qual = ms < 200 ? 'EXCELLENT — Fiber detected'
               : ms < 500 ? 'BON — Signal stable'
               : 'LENT — Réseau dégradé';

    await antiBan.safeSend(sock, jid, {
      text:
        `📡 *PING — ZERO TRACE OS*\n` +
        `▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰\n` +
        `\`\`\`[ZT-NET] Diagnostic réseau\n` +
        `Latence    : ${ms}ms\n` +
        `Signal     : ${bar}\n` +
        `Qualité    : ${qual}\n` +
        `Status     : ONLINE ██████████ 100%\`\`\`\n\n` +
        `> ${zts.sig()}`,
    }, { msgOptions: { quoted: msg } });
  },
};
