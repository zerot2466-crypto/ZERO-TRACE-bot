const zts = require('../lib/ztStyle');
/**
 * ZERO TRACE BOT v5.0 - Météo
 * .weather [ville]
 */
const fetch = require('node-fetch');

module.exports = {
  name: 'weather',
  description: 'Météo en temps réel d\'une ville',
  usage: '.weather [ville]',
  category: 'info',

  async execute(ctx) {
    const { sock, jid, msg, args, antiBan } = ctx;

    const ville = args.join(' ');
    if (!ville) {
      await antiBan.safeSend(sock, jid, { text: `\`\`\`[ZT-METEO] Usage: .weather [ville]\nEx : .weather Abidjan | .weather Paris\`\`\`\n\n> ${zts.sig()}` }, { msgOptions: { quoted: msg } });
      return;
    }

    try {
      await antiBan.safeSend(sock, jid, { text: `📡 _Scan météorologique en cours pour *${ville}*..._` }, { msgOptions: { quoted: msg } });

      const url = `https://wttr.in/${encodeURIComponent(ville)}?format=j1`;
      const res  = await fetch(url);
      const data = await res.json();

      const current = data.current_condition[0];
      const area    = data.nearest_area[0];
      const cityName = area.areaName[0].value;
      const country  = area.country[0].value;

      const temp      = current.temp_C;
      const feels     = current.FeelsLikeC;
      const humidity  = current.humidity;
      const wind      = current.windspeedKmph;
      const desc      = current.weatherDesc[0].value;
      const visibility = current.visibility;

      const emoji = temp >= 30 ? '🌞' : temp >= 20 ? '⛅' : temp >= 10 ? '🌥️' : '❄️';

      await antiBan.safeSend(sock, jid, {
        text:
          `${emoji} *MÉTÉO — ${cityName}, ${country}*\n\n` +
          `🌡️ Température : *${temp}°C* (ressenti ${feels}°C)\n` +
          `📝 Condition : *${desc}*\n` +
          `💧 Humidité : *${humidity}%*\n` +
          `💨 Vent : *${wind} km/h*\n` +
          `👁️ Visibilité : *${visibility} km*\n\n` +
          `> *ZERO TRACE BOT v5.0*`,
      }, { msgOptions: { quoted: msg } });
    } catch (e) {
      await antiBan.safeSend(sock, jid, {
        text: `❌ Impossible de récupérer la météo pour *${ville}*.\nVérifie l'orthographe de la ville.`,
      }, { msgOptions: { quoted: msg } });
    }
  },
};
