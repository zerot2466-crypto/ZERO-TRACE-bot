/**
 * ZERO TRACE BOT v5.0 — .monnaie
 * Convertisseur de devises
 */
'use strict';
const fetch = require('node-fetch');

const DEVISES = {
  EUR:'€ Euro', USD:'$ Dollar US', XOF:'FCFA Afrique Ouest', XAF:'FCFA Afrique Centrale',
  GBP:'£ Livre Sterling', MAD:'Dirham Marocain', DZD:'Dinar Algérien', TND:'Dinar Tunisien',
  NGN:'₦ Naira Nigérian', GHS:'₵ Cedi Ghanéen', KES:'Shilling Kenyan', ZAR:'Rand Sud-Africain',
  CAD:'$ Dollar Canadien', CHF:'Fr Franc Suisse', JPY:'¥ Yen', CNY:'¥ Yuan', BTC:'₿ Bitcoin',
};

module.exports = {
  name: 'monnaie',
  description: 'Convertisseur de devises en temps réel',
  usage: '.monnaie [montant] [DE] [VERS] — ex: .monnaie 100 EUR XOF',
  category: 'util',
  async execute(ctx) {
    const { sock, jid, msg, args, antiBan } = ctx;
    if (args.length < 3) {
      const liste = Object.entries(DEVISES).map(([k, v]) => `*${k}* — ${v}`).join('\n');
      await antiBan.safeSend(sock, jid, {
        text: `💱 *CONVERTISSEUR DE DEVISES*\n\nUsage : *.monnaie [montant] [DE] [VERS]*\nEx : *.monnaie 100 EUR XOF*\n\n📋 *Devises disponibles :*\n${liste}`,
      }, { msgOptions: { quoted: msg } });
      return;
    }
    const montant = parseFloat(args[0]);
    const de      = args[1].toUpperCase();
    const vers    = args[2].toUpperCase();
    if (isNaN(montant) || montant <= 0) { await antiBan.safeSend(sock, jid, { text: `\`\`\`[ZT-FX] ERREUR Montant invalide.\`\`\`` }, { msgOptions: { quoted: msg } }); return; }
    await antiBan.safeSend(sock, jid, { text: `💱 _Conversion ${de} → ${vers}..._` }, { msgOptions: { quoted: msg } });
    try {
      const res  = await fetch(`https://api.frankfurter.app/latest?amount=${montant}&from=${de}&to=${vers}`);
      const data = await res.json();
      if (data.error) throw new Error(data.message || 'Devise inconnue');
      const result = data.rates[vers];
      const taux   = result / montant;
      await antiBan.safeSend(sock, jid, {
        text: `💱 *CONVERSION*\n\n` +
          `💰 *${montant.toLocaleString('fr-FR')} ${de}*\n` +
          `➡️ *${result.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} ${vers}*\n\n` +
          `📈 Taux : 1 ${de} = ${taux.toFixed(4)} ${vers}\n` +
          `📅 Mis à jour : ${data.date}\n\n` +
          `> _ZERO TRACE 😈_`,
      }, { msgOptions: { quoted: msg } });
    } catch (e) {
      await antiBan.safeSend(sock, jid, { text: `❌ Erreur : _${e.message}_\nVérifie les codes de devises (ex: EUR, USD, XOF)` }, { msgOptions: { quoted: msg } });
    }
  },
};
