const zts = require('../lib/ztStyle');
/**
 * ZERO TRACE BOT v5.0 - Commande Joke / Blague
 */

const JOKES = [
  "Pourquoi les plongeurs plongent-ils toujours en arrière et jamais en avant ?\n👉 Parce que sinon ils tomberaient dans le bateau !",
  "Qu'est-ce qu'un canif ?\n👉 Un petit fien !",
  "Pourquoi les informaticiens confondent-ils Halloween et Noël ?\n👉 Parce que OCT 31 = DEC 25 !",
  "Un développeur va au supermarché. Sa femme lui dit : \"Ramène une bouteille de lait, et si y'a des œufs, ramène-en 6.\"\nIl revient avec 6 bouteilles de lait.\n👉 Y'avait des œufs.",
  "Comment appelle-t-on un canif qui parle ?\n👉 Un canif-est !",
  "Pourquoi les hackers aiment la plage ?\n👉 À cause des Shell-fish (coquillages) !",
  "Un homme entre dans une librairie et demande : \"Vous avez des livres sur la paranoïa ?\"\nLe libraire chuchote : \"Ils sont juste derrière toi...\"",
  "Qu'est-ce qu'un algorithme ?\n👉 Ce que les gens de l'Arkansas mettent sur leurs toasts. (Al Gore + rhythm 😂)",
  "Pourquoi est-ce que l'épouvantail a reçu un prix ?\n👉 Parce qu'il était exceptionnel dans son domaine.",
  "Comment appelle-t-on un chat tombé dans un pot de peinture le jour de Noël ?\n👉 Un chat-peint de Noël !",
  "Un zéro et un un se bagarrent. Qui gagne ?\n👉 Le binaire n'a pas de perdants, seulement des bits.",
  "Qu'est-ce qu'un vampire végétarien ?\n👉 Le Compte Dracula-ifleur !",
  "Pourquoi les développeurs portent-ils des lunettes ?\n👉 Parce qu'ils ne peuvent pas C# !",
  "Comment appelle-t-on un chien sans pattes ?\n👉 Peu importe, il viendra pas de toute façon.",
  "Un informaticien se noie. Il crie : \"Au secours !\" mais pas de réponse.\n👉 Il avait oublié d'envoyer la requête POST.",
];

module.exports = {
  name: 'joke',
  description: 'Une blague aléatoire',
  usage: '.joke | .blague',
  category: 'fun',

  async execute(ctx) {
    const { sock, jid, msg, antiBan, pushName, modeType } = ctx;

    const joke  = JOKES[Math.floor(Math.random() * JOKES.length)];
    const intro = modeType === 'natural'
      ? `😂 Ok *${pushName}*, écoute bien celle-là :\n\n`
      : '😂 *Blague du moment :*\n\n';

    await antiBan.safeSend(sock, jid, {
      text: `😈 *ZERO TRACE — HUMOUR SYSTÈME*\n▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰\n${joke}\n\n> ${zts.sig()}`,
    }, { msgOptions: { quoted: msg } });
  },
};
