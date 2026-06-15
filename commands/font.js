/**
 * .font — Convertir du texte en polices stylisées Unicode
 */
const FONTS = {
  bold:      s => s.split('').map(c => 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'.includes(c) ? String.fromCodePoint(c.charCodeAt(0) + (/[A-Z]/.test(c) ? 120211 : /[a-z]/.test(c) ? 120205 : 120764)) : c).join(''),
  italic:    s => s.split('').map(c => { const i = 'abcdefghijklmnopqrstuvwxyz'.indexOf(c); return i>=0 ? ['𝑎','𝑏','𝑐','𝑑','𝑒','𝑓','𝑔','ℎ','𝑖','𝑗','𝑘','𝑙','𝑚','𝑛','𝑜','𝑝','𝑞','𝑟','𝑠','𝑡','𝑢','𝑣','𝑤','𝑥','𝑦','𝑧'][i] : c; }).join(''),
  bubble:    s => s.split('').map(c => { const i = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'.indexOf(c); return i >= 0 ? ['Ⓐ','Ⓑ','Ⓒ','Ⓓ','Ⓔ','Ⓕ','Ⓖ','Ⓗ','Ⓘ','Ⓙ','Ⓚ','Ⓛ','Ⓜ','Ⓝ','Ⓞ','Ⓟ','Ⓠ','Ⓡ','Ⓢ','Ⓣ','Ⓤ','Ⓥ','Ⓦ','Ⓧ','Ⓨ','Ⓩ','ⓐ','ⓑ','ⓒ','ⓓ','ⓔ','ⓕ','ⓖ','ⓗ','ⓘ','ⓙ','ⓚ','ⓛ','ⓜ','ⓝ','ⓞ','ⓟ','ⓠ','ⓡ','ⓢ','ⓣ','ⓤ','ⓥ','ⓦ','ⓧ','ⓨ','ⓩ','①','②','③','④','⑤','⑥','⑦','⑧','⑨','⑩'][i] : c; }).join(''),
  flip:      s => s.split('').reverse().map(c => ({a:'ɐ',b:'q',c:'ɔ',d:'p',e:'ǝ',f:'ɟ',g:'ɓ',h:'ɥ',i:'ᴉ',j:'ɾ',k:'ʞ',l:'l',m:'ɯ',n:'u',o:'o',p:'d',q:'b',r:'ɹ',s:'s',t:'ʇ',u:'n',v:'ʌ',w:'ʍ',x:'x',y:'ʎ',z:'z'}[c.toLowerCase()] || c)).join(''),
  small:     s => s.toLowerCase().split('').map(c => 'abcdefghijklmnopqrstuvwxyz'.includes(c) ? 'ᵃᵇᶜᵈᵉᶠᵍʰⁱʲᵏˡᵐⁿᵒᵖᵠʳˢᵗᵘᵛʷˣʸᶻ'['abcdefghijklmnopqrstuvwxyz'.indexOf(c)] : c).join(''),
};
module.exports = {
  name: 'font',
  description: 'Convertir du texte en polices stylisées',
  usage: '.font [bold|italic|bubble|flip|small] [texte]',
  category: 'fun',
  async execute(ctx) {
    const { sock, jid, msg, args, antiBan } = ctx;
    const type = args[0]?.toLowerCase();
    const text = args.slice(1).join(' ').trim();
    if (!type || !text || !FONTS[type]) {
      const list = Object.keys(FONTS).join(' | ');
      await antiBan.safeSend(sock, jid, {
        text: `✍️ *POLICES STYLISÉES*\n\nUsage : .font [style] [texte]\nStyles : ${list}\n\nEx : .font bold Bonjour tout le monde`,
      }, { msgOptions: { quoted: msg } });
      return;
    }
    const converted = FONTS[type](text);
    await antiBan.safeSend(sock, jid, {
      text: `✍️ *Style : ${type}*\n\n${converted}`,
    }, { msgOptions: { quoted: msg } });
  },
};
