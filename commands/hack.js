/**
 * .hack — Simulation de hacking (fun/fake)
 */
const axios = require('axios');
const LINES = [
  'Initialisation du scan réseau...','Détection des ports ouverts...','Port 22 (SSH) ouvert !',
  'Port 443 (HTTPS) ouvert !','Analyse des vulnérabilités CVE-2024...','Injection SQL en cours...',
  'Bypass firewall...','Accès root obtenu !','Extraction des données...','Chiffrement AES-256...',
  'Nettoyage des logs...','Connexion VPN établie...','Tunneling DNS actif...','Mission accomplie.',
];
module.exports = {
  name: 'hack',
  description: 'Simulation de hacking (pour rire 😏)',
  usage: '.hack [@user ou texte]',
  category: 'fun',
  async execute(ctx) {
    const { sock, jid, msg, args, antiBan, pushName } = ctx;
    const target = args.join(' ').trim() || pushName;
    const progress = ['▒▒▒▒▒▒▒▒▒▒ 0%','██▒▒▒▒▒▒▒▒ 20%','████▒▒▒▒▒▒ 40%','██████▒▒▒▒ 60%','████████▒▒ 80%','██████████ 100%'];
    const steps = LINES.sort(() => Math.random() - 0.5).slice(0, 8);
    let output = `💻 *ZERO TRACE HACK SIMULATOR*\n\n🎯 Cible : ${target}\n\n`;
    for (const step of steps) { output += `⚡ ${step}\n`; }
    output += `\n${progress[Math.floor(Math.random() * progress.length)]}\n\n`;
    output += `✅ *Hack terminé !*\n_(C'est juste pour rire, bien sûr 😄)_`;
    await antiBan.safeSend(sock, jid, { text: output }, { msgOptions: { quoted: msg } });
  },
};
