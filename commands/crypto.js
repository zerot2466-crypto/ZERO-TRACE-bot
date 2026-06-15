const zts = require('../lib/ztStyle');
/**
 * .crypto — Prix des cryptomonnaies en temps réel
 */
const axios = require('axios');
const COINS = {
  btc: 'bitcoin', eth: 'ethereum', bnb: 'binancecoin',
  sol: 'solana', xrp: 'ripple', ada: 'cardano', doge: 'dogecoin',
  usdt: 'tether', trx: 'tron', avax: 'avalanche-2', matic: 'matic-network',
  dot: 'polkadot', link: 'chainlink', ltc: 'litecoin',
};
module.exports = {
  name: 'crypto',
  description: 'Prix des cryptomonnaies en temps réel',
  usage: '.crypto [BTC|ETH|BNB|SOL...]',
  category: 'info',
  async execute(ctx) {
    const { sock, jid, msg, args, antiBan } = ctx;
    const sym  = (args[0] || 'btc').toLowerCase();
    const coin = COINS[sym] || sym;
    try {
      const res = await axios.get(`https://api.coingecko.com/api/v3/simple/price`, {
        params: { ids: coin, vs_currencies: 'usd,eur', include_24hr_change: true, include_market_cap: true },
        timeout: 10000,
      });
      const data = res.data?.[coin];
      if (!data) {
        const list = Object.keys(COINS).join(', ').toUpperCase();
        await antiBan.safeSend(sock, jid, {
          text: `\`\`\`[ZT-CRYPTO] ERREUR: "${sym.toUpperCase()}" introuvable
Disponibles : ${list}\`\`\`

> ${zts.sig()}`,
        }, { msgOptions: { quoted: msg } });
        return;
      }
      const change = data.usd_24h_change?.toFixed(2) || '0';
      const arrow  = parseFloat(change) >= 0 ? '📈' : '📉';
      const cap    = data.usd_market_cap ? `$${(data.usd_market_cap / 1e9).toFixed(2)}B` : 'N/A';
      await antiBan.safeSend(sock, jid, {
        text:
          `\`\`\`[ZT-CRYPTO] Données marché — ${sym.toUpperCase()}
Prix USD : $${data.usd?.toLocaleString()}
Prix EUR : €${data.eur?.toLocaleString()}
Δ 24h    : ${arrow} ${change}%
Mkt Cap  : ${cap}
Source   : CoinGecko\`\`\`

> ${zts.sig()}`,
      }, { msgOptions: { quoted: msg } });
    } catch (e) {
      await antiBan.safeSend(sock, jid, { text: `\`\`\`[ZT-CRYPTO] ERREUR: ${e.message}\`\`\`

> ${zts.sig()}` }, { msgOptions: { quoted: msg } });
    }
  },
};
