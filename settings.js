/**
 * ZERO TRACE BOT v5.0 - Settings
 * Configuration centrale du bot
 */

module.exports = {
  packname:    'ZERO TRACE',
  author:      'ZT Team',
  botName:     'ZERO TRACE BOT',
  version:     '5.0.0',
  ownerNumber: process.env.OWNER_NUMBER || '22656354706',
  prefix:      process.env.PREFIX       || '.',
  reaction:    '⚡',
  channelLink: process.env.CHANNEL_LINK || 'https://whatsapp.com/channel/0029VbCEDif84OmANqy2xI0X',
  githubLink:  '',
  description: 'ZERO TRACE BOT v5.0 — Bot WhatsApp avancé avec IA, médias, admin et plus.',

  storeWriteInterval: 10000,

  // Commandes exclues du branding Supremacy
  excludedFromSupremacy: ['ping', 'settings', 'setprefix', 'alive', 'info'],

  // URL du GIF/video pour le carousel du menu
  menuCarouselGifUrl: process.env.MENU_GIF_URL ||
    'https://7cfmjruljx39o3gt.public.blob.vercel-storage.com/uploads/guest_gmNwLXGnuWd1/1778707712970_VID-20260421-WA0013.mp4',

  // Mots-clés pour le mode naturel (sans préfixe)
  naturalKeywords: {
    menu:    ['menu', 'aide', 'help', 'commande', 'commandes', 'que sais-tu faire', 'que peux-tu faire'],
    ping:    ['ping', 'latence', 'en ligne', 'actif', 'tu es là'],
    alive:   ['alive', 'tu vis', 'es-tu actif', 'tu fonctionnes', 'tu es actif'],
    ai:      ['pose une question', 'explique', 'dis-moi', 'parle-moi', "c'est quoi", "qu'est-ce que"],
    joke:    ['blague', 'fais-moi rire', 'une blague', 'raconte une blague'],
    quote:   ['proverbe', 'citation', 'une citation', 'un proverbe', 'inspire-moi'],
    ship:    ['compatibilité', 'amour entre', 'ship'],
    calc:    ['calcule', 'combien fait', 'résultat de'],
    weather: ['météo', 'temps qu\'il fait', 'il fait quel temps'],
    owner:   ['qui est ton créateur', 'ton propriétaire', 'contact owner', 'qui t\'a créé'],
  },
};
