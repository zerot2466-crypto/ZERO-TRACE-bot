/**
 * ZERO TRACE BOT v5.0 — .ip
 * Infos sur une adresse IP
 */
'use strict';
const zts = require('../lib/ztStyle');
const fetch = require('node-fetch');

module.exports = {
  name: 'ip',
  description: 'Informations sur une adresse IP',
  usage: '.ip [adresse IP]',
  category: 'util',
  async execute(ctx) {
    const { sock, jid, msg, args, antiBan } = ctx;
    const ip = args[0];
    if (!ip) { await antiBan.safeSend(sock, jid, { text: `\`\`\`[ZT-LOOKUP] Usage: .ip [IP ou domaine]\nEx : .ip 8.8.8.8\`\`\`\n\n> ${zts.sig()}` }, { msgOptions: { quoted: msg } }); return; }
    // Validation basique
    if (!/^(\d{1,3}\.){3}\d{1,3}$/.test(ip) && !/^[0-9a-fA-F:]+$/.test(ip)) {
      await antiBan.safeSend(sock, jid, { text: `\`\`\`[ZT-LOOKUP] ERREUR: IP/domaine invalide\`\`\`\n\n> ${zts.sig()}` }, { msgOptions: { quoted: msg } }); return;
    }
    await antiBan.safeSend(sock, jid, { text: `🔍 _Analyse de ${ip}..._` }, { msgOptions: { quoted: msg } });
    try {
      const res  = await fetch(`http://ip-api.com/json/${ip}?fields=status,message,country,regionName,city,zip,lat,lon,timezone,isp,org,as,hosting,proxy,mobile`);
      const data = await res.json();
      if (data.status === 'fail') throw new Error(data.message || 'IP invalide');
      await antiBan.safeSend(sock, jid, {
        text: `🌐 *INFOS IP — ${ip}*\n\n` +
          `🌍 Pays : *${data.country}*\n` +
          `🏙️ Région : *${data.regionName}*\n` +
          `🏘️ Ville : *${data.city}*\n` +
          `📮 Code postal : *${data.zip || 'N/A'}*\n` +
          `🌐 Fuseau : *${data.timezone}*\n` +
          `📡 FAI : *${data.isp}*\n` +
          `🏢 Org : *${data.org || 'N/A'}*\n` +
          `📍 Coordonnées : *${data.lat}, ${data.lon}*\n` +
          `🔒 Proxy/VPN : *${data.proxy ? '⚠️ Oui' : '✅ Non'}*\n` +
          `📱 Mobile : *${data.mobile ? 'Oui' : 'Non'}*\n` +
          `🖥️ Hébergeur : *${data.hosting ? 'Oui (serveur)' : 'Non'}*\n\n` +
          `> _ZERO TRACE 😈_`,
      }, { msgOptions: { quoted: msg } });
    } catch (e) {
      await antiBan.safeSend(sock, jid, { text: `❌ Erreur : _${e.message}_` }, { msgOptions: { quoted: msg } });
    }
  },
};
