/**
 * ZERO TRACE BOT v5.0 - Handler FINAL COMPLET
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * ✅ Vocaux → transcription STT → réponse texte ET audio
 * ✅ Agent IA → exécute les commandes + répond aux vocaux
 * ✅ Chatbot → répond aux vocaux transcrit
 * ✅ Mode privé corrigé
 * ✅ Bug duplication mémoire agent corrigé
 * ✅ Clonage voix intégré
 */

const chalk        = require('chalk');
const fs           = require('fs');
const path         = require('path');
const config       = require('./config');
const settings     = require('./settings');
const antiBan      = require('./lib/antiBan');
const supremacy    = require('./lib/supremacy');
const logger       = require('./lib/logger');
const gs           = require('./lib/groupSettings');
const voiceLib     = require('./lib/voice');
const {
  sendInteractiveMessage,
  sendButtons,
  sendList,
  sendQuickReply,
  sendNativeFlow,
} = require('./lib/interactive');
const openRouterAI = require('./lib/openrouter_ai'); // ← chargement unique (optimisation)

// cerveau unifié ZERO TRACE (remplace agent + chatbot)
const { incrementStat }         = require('./commands/topmembers');
const afkCmd                    = require('./commands/afk');
const tttCmd                    = require('./commands/tictactoe');
const antibadwordCmd            = require('./commands/antibadword');
const brainCmd = require('./lib/zerotrace_brain');
const clonevoixCmd              = require('./commands/clonevoix');
const { handleBotManager, handleFileInstall } = require('./commands/botmanager');
const createcmdModule = require('./commands/createcmd');
const auditbotModule  = require('./commands/auditbot');
const rateLimiter  = require('./lib/ratelimit');
const zts = require('./lib/ztStyle');
const userPfx      = require('./lib/userPrefix');
const welcomeUser  = require('./lib/welcomeUser');
const usageStats   = require('./lib/usageStats');

// ── Nouveaux modules ──────────────────────────────────────────────────────────
const fun2          = require('./commands/fun2');
const rpg           = require('./commands/rpg');
const wellness      = require('./commands/wellness');
const supernatural  = require('./commands/supernatural');
const celebrations  = require('./commands/celebrations');
const myidCmds      = require('./commands/myid');
const enigmes       = require('./commands/enigmes');
const linguistique  = require('./commands/linguistique');
const webapi2       = require('./commands/webapi2');
const webtools      = require('./commands/webtools');
const search        = require('./commands/search');
const osint         = require('./commands/osint');
const pentest       = require('./commands/pentest');
const netsec        = require('./commands/netsec');
const devtools      = require('./commands/devtools');
const feedbackCmd   = require('./commands/feedback');
const adminplus     = require('./commands/adminplus');

// ── TOUTES LES COMMANDES ─────────────────────────────────────────────────────
const COMMANDS = {
  // Utilitaires
  ping:         { fn: require('./commands/ping'),         cat: 'util' },
  help:         { fn: require('./commands/help'),         cat: 'util' },
  menu:         { fn: require('./commands/help'),         cat: 'util' },
  alive:        { fn: require('./commands/alive'),        cat: 'util' },
  info:         { fn: require('./commands/info'),         cat: 'util' },
  uptime:       { fn: require('./commands/alive'),        cat: 'util' },
  settings:     { fn: require('./commands/settings'),     cat: 'util' },
  config:       { fn: require('./commands/settings'),     cat: 'util' },
  setprefix:    { fn: require('./commands/setprefix'),    cat: 'util' },
  myprefix:     { fn: require('./commands/myprefix'),     cat: 'util' },
  botstats:     { fn: require('./commands/botstats'),     cat: 'owner' },
  usage:        { fn: require('./commands/botstats'),     cat: 'owner' },
  botusage:     { fn: require('./commands/botstats'),     cat: 'owner' },
  statbot:      { fn: require('./commands/botstats'),     cat: 'owner' },
  monprefix:    { fn: require('./commands/myprefix'),     cat: 'util' },
  setmyprefix:  { fn: require('./commands/myprefix'),     cat: 'util' },
  mypfx:        { fn: require('./commands/myprefix'),     cat: 'util' },
  cleartmp:     { fn: require('./commands/cleartmp'),     cat: 'util' },
  clearsession: { fn: require('./commands/clearsession'), cat: 'util' },
  update:       { fn: require('./commands/update'),       cat: 'util' },
  afk:          { fn: afkCmd,                            cat: 'util' },
  calc:         { fn: require('./commands/calc'),         cat: 'util' },
  translate:    { fn: require('./commands/translate'),    cat: 'util' },
  traduit:      { fn: require('./commands/translate'),    cat: 'util' },
  poll:         { fn: require('./commands/poll'),         cat: 'util' },
  qrcode:       { fn: require('./commands/qrcode'),       cat: 'util' },
  qr:           { fn: require('./commands/qrcode'),       cat: 'util' },
  password:     { fn: require('./commands/password'),     cat: 'util' },
  mdp:          { fn: require('./commands/password'),     cat: 'util' },
  base64:       { fn: require('./commands/base64'),       cat: 'util' },
  remindme:     { fn: require('./commands/remindme'),     cat: 'util' },
  rappel:       { fn: require('./commands/remindme'),     cat: 'util' },
  speedtest:    { fn: require('./commands/speedtest'),    cat: 'util' },
  reponse:      { fn: require('./commands/reponse'),      cat: 'util' },
  // IA & Chatbot
  vision:       { fn: require('./commands/vision'),       cat: 'ai' },
  analyseimg:   { fn: require('./commands/vision'),       cat: 'ai' },
  voir:         { fn: require('./commands/vision'),       cat: 'ai' },
  describe:     { fn: require('./commands/vision'),       cat: 'ai' },
  // Anciennes commandes ai/agent/agentreset/aistatus → fusionnées dans .zt
  ai:           { fn: require('./commands/zt'),          cat: 'ai' },
  aireset:      { fn: require('./commands/zt'),          cat: 'ai' },
  gpt:          { fn: require('./commands/zt'),          cat: 'ai' },
  darkgpt:      { fn: require('./commands/zt'),          cat: 'ai' },
  agent:        { fn: require('./commands/zt'),          cat: 'ai' },
  aistatus:     { fn: require('./commands/zt'),          cat: 'owner' },
  iastatut:     { fn: require('./commands/zt'),          cat: 'owner' },
  providers:    { fn: require('./commands/zt'),          cat: 'owner' },
  agentreset:   { fn: require('./commands/zt'),          cat: 'ai' },
  resetagent:   { fn: require('./commands/zt'),          cat: 'ai' },
  clearagent:   { fn: require('./commands/zt'),          cat: 'ai' },
  memreset:     { fn: require('./commands/zt'),          cat: 'ai' },
  chatbot:      { fn: require('./commands/chatbot'),     cat: 'ai' },


  vv:           { fn: require('./commands/vv'),           cat: 'media' },
  save:         { fn: require('./commands/vv'),           cat: 'media' },
  video:        { fn: require('./commands/video'),        cat: 'media' },
  yt:           { fn: require('./commands/video'),        cat: 'media' },
  ytmp4:        { fn: require('./commands/video'),        cat: 'media' },
  song2:        { fn: require('./commands/song2'),        cat: 'media' },
  mp3:          { fn: require('./commands/song2'),        cat: 'media' },
  mail:         { fn: require('./commands/mail'),         cat: 'util' },
  tempmail:     { fn: require('./commands/mail'),         cat: 'util' },
  zero:         { fn: require('./commands/zero'),         cat: 'util' },
  wake:         { fn: require('./commands/zero'),         cat: 'util' },
  wakeup:       { fn: require('./commands/zero'),         cat: 'util' },
  zerotrace:    { fn: require('./commands/zero'),         cat: 'util' },

  // ── FLEXIBILITÉ ────────────────────────────────────────────────────────────
  addcmd:       { fn: require('./commands/customcmd'),    cat: 'owner' },
  delcmd:       { fn: require('./commands/customcmd'),    cat: 'owner' },
  editcmd:      { fn: require('./commands/customcmd'),    cat: 'owner' },
  listcmd:      { fn: require('./commands/customcmd'),    cat: 'owner' },
  mycmds:       { fn: require('./commands/customcmd'),    cat: 'owner' },
  cmdinfo:      { fn: require('./commands/customcmd'),    cat: 'owner' },


  // ── Commandes supplémentaires (alias uniques) ────────────────────────────
  ssweb:        { fn: require('./commands/ss'),           cat: 'util' },
  capture:      { fn: require('./commands/ss'),           cat: 'util' },
  lyric:        { fn: require('./commands/lyrics'),       cat: 'media' },
  stats:        { fn: require('./commands/stats'),        cat: 'bot' },
  eightball:    { fn: fun2.eightball,                     cat: 'fun' },
  ttt:          { fn: tttCmd,                             cat: 'fun' },
  classCmd:     { fn: rpg.classCmd,                       cat: 'rpg' },
  linguistique: { fn: require('./commands/linguistique'),  cat: 'fun' },
  botmanager:   { fn: require('./commands/botmanager'),    cat: 'owner' },

  autoreply:    { fn: require('./commands/autoreply'),    cat: 'owner' },
  ar:           { fn: require('./commands/autoreply'),    cat: 'owner' },
  theme:        { fn: require('./commands/theme'),        cat: 'owner' },
  settheme:     { fn: require('./commands/theme'),        cat: 'owner' },
  lang:         { fn: require('./commands/botlang'),      cat: 'owner' },
  langue:       { fn: require('./commands/botlang'),      cat: 'owner' },
  setlang:      { fn: require('./commands/botlang'),      cat: 'owner' },
  activehours:  { fn: require('./commands/activehours'),  cat: 'owner' },
  horaires:     { fn: require('./commands/activehours'),  cat: 'owner' },
  webhook:      { fn: require('./commands/webhook'),      cat: 'owner' },
  notif:        { fn: require('./commands/webhook'),      cat: 'owner' },
  plugin:       { fn: require('./commands/plugin'),       cat: 'owner' },
  plugins:      { fn: require('./commands/plugin'),       cat: 'owner' },
  dashboard:    { fn: require('./commands/dashboard'),    cat: 'owner' },
  dash:         { fn: require('./commands/dashboard'),    cat: 'owner' },
  monitor:      { fn: require('./commands/dashboard'),    cat: 'owner' },
  // botstats remplacé par ./commands/botstats (voir ligne 78)
  transcribe:   { fn: require('./commands/transcribe'),   cat: 'ai' },
  stt:          { fn: require('./commands/transcribe'),   cat: 'ai' },
  vtt:          { fn: require('./commands/transcribe'),   cat: 'ai' },
  jwt:          { fn: require('./commands/jwt'),          cat: 'owner' },
  jwtdecode:    { fn: require('./commands/jwt'),          cat: 'owner' },
  genpass:      { fn: require('./commands/genpass'),      cat: 'util' },
  passgen:      { fn: require('./commands/genpass'),      cat: 'util' },
  genpwd:       { fn: require('./commands/genpass'),      cat: 'util' },
  backup:       { fn: require('./commands/backup'),       cat: 'owner' },
  sauvegarde:   { fn: require('./commands/backup'),       cat: 'owner' },
  history:      { fn: require('./commands/history'),      cat: 'util' },
  historique:   { fn: require('./commands/history'),      cat: 'util' },
  zt:           { fn: require('./commands/zt'),           cat: 'ai' },
  brain:        { fn: require('./commands/zt'),           cat: 'ai' },

  // Médias
  imagine:      { fn: require('./commands/imagine'),      cat: 'media' },
  img:          { fn: require('./commands/imagine'),      cat: 'media' },
  draw:         { fn: require('./commands/imagine'),      cat: 'media' },
  imagine2:     { fn: require('./commands/imagine2'),     cat: 'media' },
  sora:         { fn: require('./commands/sora'),         cat: 'media' },

  tts:          { fn: require('./commands/tts'),          cat: 'media' },
  sticker:      { fn: require('./commands/sticker'),      cat: 'media' },
  s:            { fn: require('./commands/sticker'),      cat: 'media' },
  toimg:        { fn: require('./commands/toimg'),        cat: 'media' },
  removebg:     { fn: require('./commands/removebg'),     cat: 'media' },
  blur:         { fn: require('./commands/blur'),         cat: 'media' },
  enhance:      { fn: require('./commands/enhance'),      cat: 'media' },
  wasted:       { fn: require('./commands/wasted'),       cat: 'media' },
  stealpp:      { fn: require('./commands/stealpp'),      cat: 'media' },
  pp:           { fn: require('./commands/stealpp'),      cat: 'media' },
  song:         { fn: require('./commands/song'),         cat: 'media' },
  musique:      { fn: require('./commands/song'),         cat: 'media' },

  ytdl:         { fn: require('./commands/yt'),           cat: 'media' },
  tiktok:       { fn: require('./commands/tiktok'),       cat: 'media' },
  tt:           { fn: require('./commands/tiktok'),       cat: 'media' },
  instagram:    { fn: require('./commands/instagram'),    cat: 'media' },
  ig:           { fn: require('./commands/instagram'),    cat: 'media' },
  // Fun
  ship:         { fn: require('./commands/ship'),         cat: 'fun' },
  love:         { fn: require('./commands/ship'),         cat: 'fun' },
  joke:         { fn: require('./commands/joke'),         cat: 'fun' },
  blague:       { fn: require('./commands/joke'),         cat: 'fun' },
  quote:        { fn: require('./commands/quote'),        cat: 'fun' },
  citation:     { fn: require('./commands/quote'),        cat: 'fun' },
  truth:        { fn: require('./commands/truth'),        cat: 'fun' },
  verite:       { fn: require('./commands/truth'),        cat: 'fun' },
  dare:         { fn: require('./commands/dare'),         cat: 'fun' },
  defi:         { fn: require('./commands/dare'),         cat: 'fun' },
  horoscope:    { fn: require('./commands/horoscope'),    cat: 'fun' },
  riddle:       { fn: require('./commands/riddle'),       cat: 'fun' },
  devinette:    { fn: require('./commands/riddle'),       cat: 'fun' },
  roast:        { fn: require('./commands/roast'),        cat: 'fun' },
  compliment:   { fn: require('./commands/compliment'),   cat: 'fun' },
  tictactoe:    { fn: tttCmd,                            cat: 'fun' },
  morpion:      { fn: tttCmd,                            cat: 'fun' },
  '8ball':      { fn: require('./commands/ball8'),        cat: 'fun' },
  rps:          { fn: require('./commands/rps'),          cat: 'fun' },
  hack:         { fn: require('./commands/hack'),         cat: 'fun' },
  font:         { fn: require('./commands/font'),         cat: 'fun' },
  giveaway:     { fn: require('./commands/giveaway'),     cat: 'fun' },
  tirage:       { fn: require('./commands/giveaway'),     cat: 'fun' },
  // Infos
  weather:      { fn: require('./commands/weather'),      cat: 'info' },

  // ── SPORT ──────────────────────────────────────────────────────────────────
  footlive:     { fn: require('./commands/footlive'),     cat: 'sport' },
  foot:         { fn: require('./commands/footlive'),     cat: 'sport' },
  football:     { fn: require('./commands/footlive'),     cat: 'sport' },
  flive:        { fn: require('./commands/footlive'),     cat: 'sport' },
  meteo:        { fn: require('./commands/weather'),      cat: 'info' },
  news:         { fn: require('./commands/news'),         cat: 'info' },
  actualites:   { fn: require('./commands/news'),         cat: 'info' },
  topmembers:   { fn: require('./commands/topmembers'),   cat: 'info' },
  top:          { fn: require('./commands/topmembers'),   cat: 'info' },
  crypto:       { fn: require('./commands/crypto'),       cat: 'info' },
  wiki:         { fn: require('./commands/wiki'),         cat: 'info' },
  define:       { fn: require('./commands/define'),       cat: 'info' },
  definition:   { fn: require('./commands/define'),       cat: 'info' },
  profile:      { fn: require('./commands/profile'),      cat: 'info' },
  profil:       { fn: require('./commands/profile'),      cat: 'info' },
  groupinfo:    { fn: require('./commands/groupinfo'),    cat: 'info' },
  // Admin
  tagall:       { fn: require('./commands/tagall'),       cat: 'admin' },
  tag:          { fn: require('./commands/tagall'),       cat: 'admin' },
  warn:         { fn: require('./commands/warn'),         cat: 'admin' },
  resetwarn:    { fn: require('./commands/resetwarn'),    cat: 'admin' },
  kick:         { fn: require('./commands/kick'),         cat: 'admin' },
  mute:         { fn: require('./commands/mute'),         cat: 'admin' },
  promote:      { fn: require('./commands/promote'),      cat: 'admin' },
  demote:       { fn: require('./commands/promote'),      cat: 'admin' },
  welcome:      { fn: require('./commands/welcome'),      cat: 'admin' },
  setwelcome:   { fn: require('./commands/setwelcome'),   cat: 'admin' },
  setgoodbye:   { fn: require('./commands/setwelcome'),   cat: 'admin' },
  antilink:     { fn: require('./commands/antilink'),     cat: 'admin' },
  antidelete:   { fn: require('./commands/antidelete'),   cat: 'admin' },
  antibadword:  { fn: antibadwordCmd,                    cat: 'admin' },
  antiraid:     { fn: require('./commands/antiraid'),     cat: 'admin' },
  anticall:     { fn: require('./commands/anticall'),     cat: 'admin' },
  link:         { fn: require('./commands/link'),         cat: 'admin' },
  revoke:       { fn: require('./commands/link'),         cat: 'admin' },
  // Owner
  sudo:         { fn: require('./commands/sudo'),         cat: 'owner' },
  private:      { fn: require('./commands/private'),      cat: 'owner' },
  channel:      { fn: require('./commands/channel'),      cat: 'owner' },
  // ── Pairing ─────────────────────────────────────────────────────────────

  // ── Nouveaux downloaders drexapp ────────────────────────────────────────
  soundcloud:   { fn: require('./commands/soundcloud'),   cat: 'media' },
  sc:           { fn: require('./commands/soundcloud'),   cat: 'media' },
  scloud:       { fn: require('./commands/soundcloud'),   cat: 'media' },
  capcut:       { fn: require('./commands/capcut'),       cat: 'media' },
  cc:           { fn: require('./commands/capcut'),       cat: 'media' },
  capcutdl:     { fn: require('./commands/capcut'),       cat: 'media' },
  reel:         { fn: require('./commands/instagram'),    cat: 'media' },

  // ── Nouveaux outils drexapp ─────────────────────────────────────────────
  imgsearch:    { fn: require('./commands/imgsearch'),    cat: 'info' },
  imgs:         { fn: require('./commands/imgsearch'),    cat: 'info' },
  gimage:       { fn: require('./commands/imgsearch'),    cat: 'info' },
  gimages:      { fn: require('./commands/imgsearch'),    cat: 'info' },
  resize:       { fn: require('./commands/imageresize'),  cat: 'util' },
  imageresize:  { fn: require('./commands/imageresize'),  cat: 'util' },
  redim:        { fn: require('./commands/imageresize'),  cat: 'util' },
  setimage:     { fn: require('./commands/setimage'),     cat: 'media' },
  pair:         { fn: require('./commands/pair'),         cat: 'util' },
  paire:        { fn: require('./commands/pair'),         cat: 'util' },
  connexion:    { fn: require('./commands/pair'),         cat: 'util' },
  connect:      { fn: require('./commands/pair'),         cat: 'util' },
  imgset:       { fn: require('./commands/setimage'),     cat: 'media' },
  botimage:     { fn: require('./commands/setimage'),     cat: 'media' },
  setimg:       { fn: require('./commands/setimage'),     cat: 'media' },

  // ── Nouvelles commandes ─────────────────────────────────────────────────
  // 🎮 Jeux / Fun
  pendu:        { fn: require('./commands/pendu'),        cat: 'fun' },
  face:         { fn: require('./commands/pile'),         cat: 'fun' },
  // dice/dé/de → défini plus bas dans Fun Pack 2 (fun2.dice)
  'dé':         { fn: require('./commands/dice'),         cat: 'fun' },
  de:           { fn: require('./commands/dice'),         cat: 'fun' },
  couleur:      { fn: require('./commands/couleur'),      cat: 'fun' },
  color:        { fn: require('./commands/couleur'),      cat: 'fun' },
  // 🛡️ Modération
  slowmode:     { fn: require('./commands/slowmode'),     cat: 'admin' },
  slowmodo:     { fn: require('./commands/slowmode'),     cat: 'admin' },
  report:       { fn: require('./commands/report'),       cat: 'admin' },
  signaler:     { fn: require('./commands/report'),       cat: 'admin' },
  lockgroup:    { fn: require('./commands/lockgroup'),    cat: 'admin' },
  lock:         { fn: require('./commands/lockgroup'),    cat: 'admin' },
  unlockgroup:  { fn: require('./commands/lockgroup'),    cat: 'admin' },
  unlock:       { fn: require('./commands/lockgroup'),    cat: 'admin' },
  badname:      { fn: require('./commands/badname'),      cat: 'admin' },
  // 🤖 IA
  resume:       { fn: require('./commands/resume'),       cat: 'ai' },
  resumer:      { fn: require('./commands/resume'),       cat: 'ai' },
  correct:      { fn: require('./commands/correct'),      cat: 'ai' },
  corriger:     { fn: require('./commands/correct'),      cat: 'ai' },
  improve:      { fn: require('./commands/improve'),      cat: 'ai' },
  ameliorer:    { fn: require('./commands/improve'),      cat: 'ai' },
  // 👥 Groupe / Admin
  note:         { fn: require('./commands/note'),         cat: 'admin' },
  notes:        { fn: require('./commands/note'),         cat: 'admin' },
  rename:       { fn: require('./commands/rename'),       cat: 'admin' },
  renommer:     { fn: require('./commands/rename'),       cat: 'admin' },
  // 📥 Téléchargement
  pinterest:    { fn: require('./commands/pinterest'),    cat: 'media' },
  pin:          { fn: require('./commands/pinterest'),    cat: 'media' },
  twitter:      { fn: require('./commands/twitter'),      cat: 'media' },
  'x':          { fn: require('./commands/twitter'),      cat: 'media' },
  twit:         { fn: require('./commands/twitter'),      cat: 'media' },
  spotify:      { fn: require('./commands/spotify'),      cat: 'media' },
  spoti:        { fn: require('./commands/spotify'),      cat: 'media' },
  // 🎵 Musique — lyrics/paroles définis plus bas dans Web & API (webapi2.lyrics)
  // 🔧 Utilitaires
  timer:        { fn: require('./commands/timer'),        cat: 'util' },
  countdown:    { fn: require('./commands/timer'),        cat: 'util' },
  ip:           { fn: require('./commands/ip'),           cat: 'util' },
  // ipinfo défini plus bas dans Web Navigation (webtools.ipinfo)
  scanlink:     { fn: require('./commands/scanlink'),     cat: 'secu' },
  scan:         { fn: require('./commands/scanlink'),     cat: 'secu' },
  checklink:    { fn: require('./commands/scanlink'),     cat: 'secu' },
  scanurl:      { fn: require('./commands/scanlink'),     cat: 'secu' },
  urlcheck:     { fn: require('./commands/scanlink'),     cat: 'secu' },
  scanfile:     { fn: require('./commands/scanlink'),     cat: 'secu' },
  scanauto:     { fn: require('./commands/scanlink'),     cat: 'secu' },
  monnaie:      { fn: require('./commands/monnaie'),      cat: 'util' },
  convert:      { fn: require('./commands/monnaie'),      cat: 'util' },
  devises:      { fn: require('./commands/monnaie'),      cat: 'util' },

  // ── Rate limit management (owner) ──────────────────────────────────────
  rlstatus:     { fn: require('./commands/ratelimit_cmd'), cat: 'owner' },
  rlreset:      { fn: require('./commands/ratelimit_cmd'), cat: 'owner' },
  rlstats:      { fn: require('./commands/ratelimit_cmd'), cat: 'owner' },
  // antispam → défini plus bas dans Admin Plus (adminplus.antispam)
  broadcast:    { fn: require('./commands/broadcast'),    cat: 'owner' },
  block:        { fn: require('./commands/block'),        cat: 'owner' },
  unblock:      { fn: require('./commands/block'),        cat: 'owner' },
  grouplist:    { fn: require('./commands/grouplist'),    cat: 'owner' },
  restart:      { fn: require('./commands/restart'),      cat: 'owner' },
  clonevoix:    { fn: clonevoixCmd,                      cat: 'owner' },
  owner:        { fn: require('./commands/owner'),        cat: 'owner' },
  proprio:      { fn: require('./commands/owner'),        cat: 'owner' },
  createcmd:    { fn: createcmdModule,                   cat: 'owner' }, // création à chaud
  auditbot:     { fn: auditbotModule,                    cat: 'owner' }, // auto-diagnostic

  // ── Utilitaires supplémentaires ────────────────────────────────────────────
  myid:         { fn: myidCmds.myid,                     cat: 'util' },
  about:        { fn: myidCmds.about,                    cat: 'util' },
  start:        { fn: myidCmds.start,                    cat: 'util' },

  // ── Fun Pack 2 ─────────────────────────────────────────────────────────────
  dice:         { fn: fun2.dice,                         cat: 'fun' },
  flip:         { fn: fun2.flip,                         cat: 'fun' },
  pile:         { fn: fun2.flip,                         cat: 'fun' },
  trivia:       { fn: fun2.trivia,                       cat: 'fun' },
  advice:       { fn: fun2.advice,                       cat: 'fun' },
  conseil:      { fn: fun2.advice,                       cat: 'fun' },
  dilem:        { fn: fun2.dilem,                        cat: 'fun' },
  dilemme:      { fn: fun2.dilem,                        cat: 'fun' },
  waifu:        { fn: fun2.waifu,                        cat: 'fun' },
  senpai:       { fn: fun2.senpai,                       cat: 'fun' },
  quiz:         { fn: require('./commands/quiz'),        cat: 'fun' },
  anime:        { fn: fun2.anime,                        cat: 'fun' },
  manga:        { fn: fun2.manga,                        cat: 'fun' },
  battle:       { fn: fun2.battle,                       cat: 'fun' },
  random:       { fn: fun2.random,                       cat: 'fun' },
  alea:         { fn: fun2.random,                       cat: 'fun' },

  // ── RPG & Jeu de Rôle ─────────────────────────────────────────────────────
  class:        { fn: rpg.classCmd,                      cat: 'rpg' },
  classe:       { fn: rpg.classCmd,                      cat: 'rpg' },
  spellbook:    { fn: rpg.spellbook,                     cat: 'rpg' },
  grimoire:     { fn: rpg.spellbook,                     cat: 'rpg' },
  cast:         { fn: rpg.cast,                          cat: 'rpg' },
  sorts:        { fn: rpg.cast,                          cat: 'rpg' },
  guild:        { fn: rpg.guild,                         cat: 'rpg' },
  guilde:       { fn: rpg.guild,                         cat: 'rpg' },
  tavern:       { fn: rpg.tavern,                        cat: 'rpg' },
  taverne:      { fn: rpg.tavern,                        cat: 'rpg' },
  drink:        { fn: rpg.drink,                         cat: 'rpg' },
  boisson:      { fn: rpg.drink,                         cat: 'rpg' },
  spy:          { fn: rpg.spy,                           cat: 'rpg' },
  mafia:        { fn: rpg.mafia,                         cat: 'rpg' },
  detective:    { fn: rpg.detectiveCmd,                  cat: 'rpg' },
  enquete:      { fn: rpg.detectiveCmd,                  cat: 'rpg' },
  clue:         { fn: rpg.clue,                          cat: 'rpg' },
  indice:       { fn: rpg.clue,                          cat: 'rpg' },
  accuse:       { fn: rpg.accuse,                        cat: 'rpg' },
  accuser:      { fn: rpg.accuse,                        cat: 'rpg' },
  escapegame:   { fn: rpg.escapegame,                    cat: 'rpg' },
  codebreaker:  { fn: rpg.codebreaker,                   cat: 'rpg' },
  coldcase:     { fn: rpg.coldcase,                      cat: 'rpg' },
  whodunnit:    { fn: rpg.whodunnit,                     cat: 'rpg' },
  origami:      { fn: rpg.origami,                       cat: 'rpg' },

  // ── Bien-être ──────────────────────────────────────────────────────────────
  meditation:   { fn: wellness.meditation,               cat: 'wellness' },
  breathing:    { fn: wellness.breathing,                cat: 'wellness' },
  respiration:  { fn: wellness.breathing,                cat: 'wellness' },
  affirmation:  { fn: wellness.affirmation,              cat: 'wellness' },
  gratitude:    { fn: wellness.gratitude,                cat: 'wellness' },
  journal:      { fn: wellness.journal,                  cat: 'wellness' },
  mood:         { fn: wellness.mood,                     cat: 'wellness' },
  humeur:       { fn: wellness.mood,                     cat: 'wellness' },
  sleep:        { fn: wellness.sleep,                    cat: 'wellness' },
  sommeil:      { fn: wellness.sleep,                    cat: 'wellness' },
  stretch:      { fn: wellness.stretch,                  cat: 'wellness' },
  yoga:         { fn: wellness.yoga,                     cat: 'wellness' },
  habit:        { fn: wellness.habit,                    cat: 'wellness' },
  tarot:        { fn: wellness.tarot,                    cat: 'wellness' },
  astrology:    { fn: wellness.astrology,                cat: 'wellness' },
  astrologie:   { fn: wellness.astrology,                cat: 'wellness' },
  numerology:   { fn: wellness.numerology,               cat: 'wellness' },
  numerologie:  { fn: wellness.numerology,               cat: 'wellness' },
  dream:        { fn: wellness.dream,                    cat: 'wellness' },
  reve:         { fn: wellness.dream,                    cat: 'wellness' },
  oracle:       { fn: wellness.oracle,                   cat: 'wellness' },

  // ── Surnaturel ─────────────────────────────────────────────────────────────
  ghost:        { fn: supernatural.ghost,                cat: 'fun' },
  fantome:      { fn: supernatural.ghost,                cat: 'fun' },
  ouija:        { fn: supernatural.ouija,                cat: 'fun' },
  crystalball:  { fn: supernatural.crystalball,          cat: 'fun' },
  boule:        { fn: supernatural.crystalball,          cat: 'fun' },
  aura:         { fn: supernatural.aura,                 cat: 'fun' },
  pastlife:     { fn: supernatural.pastlife,             cat: 'fun' },
  viepassee:    { fn: supernatural.pastlife,             cat: 'fun' },
  parallel:     { fn: supernatural.parallel,             cat: 'fun' },
  curse:        { fn: supernatural.curse,                cat: 'fun' },
  malediction:  { fn: supernatural.curse,                cat: 'fun' },
  bless:        { fn: supernatural.bless,                cat: 'fun' },
  benediction:  { fn: supernatural.bless,                cat: 'fun' },
  zodiacsign:   { fn: supernatural.zodiacsign,           cat: 'fun' },

  // ── Célébrations ───────────────────────────────────────────────────────────
  naissance:    { fn: celebrations.naissance,            cat: 'celebrate' },
  cremaillere:  { fn: celebrations.cremaillere,          cat: 'celebrate' },
  potdepart:    { fn: celebrations.potdepart,            cat: 'celebrate' },
  soutenance:   { fn: celebrations.soutenance,           cat: 'celebrate' },
  permis:       { fn: celebrations.permis,               cat: 'celebrate' },
  bac:          { fn: celebrations.bac,                  cat: 'celebrate' },
  mariage:      { fn: celebrations.mariage,              cat: 'celebrate' },
  divorce:      { fn: celebrations.divorce,              cat: 'celebrate' },
  retraite:     { fn: celebrations.retraite,             cat: 'celebrate' },
  comingout:    { fn: celebrations.comingout,            cat: 'celebrate' },
  diplome:      { fn: celebrations.diplome,              cat: 'celebrate' },
  prenatal:     { fn: celebrations.prenatal,             cat: 'celebrate' },

  // ── Énigmes ────────────────────────────────────────────────────────────────
  enigme:        { fn: enigmes.rebus,                    cat: 'enigme' }, // commande générique → rebus
  morse:         { fn: enigmes.morse,                    cat: 'enigme' },
  cipher:        { fn: enigmes.cipher,                   cat: 'enigme' },
  chiffre:       { fn: enigmes.cipher,                   cat: 'enigme' },
  sudoku:        { fn: enigmes.sudoku,                   cat: 'enigme' },
  maze:          { fn: enigmes.maze,                     cat: 'enigme' },
  labyrinthe:    { fn: enigmes.maze,                     cat: 'enigme' },
  rebus:         { fn: enigmes.rebus,                    cat: 'enigme' },
  crossword:     { fn: enigmes.crossword,                cat: 'enigme' },
  motscroises:   { fn: enigmes.crossword,                cat: 'enigme' },
  kenken:        { fn: enigmes.kenken,                   cat: 'enigme' },
  puzzle:        { fn: enigmes.puzzle,                   cat: 'enigme' },

  // ── Linguistique ───────────────────────────────────────────────────────────
  palindrome:    { fn: linguistique.palindrome,          cat: 'langue' },
  tonguetwister: { fn: linguistique.tonguetwister,       cat: 'langue' },
  virelangue:    { fn: linguistique.tonguetwister,       cat: 'langue' },
  idiom:         { fn: linguistique.idiom,               cat: 'langue' },
  expression:    { fn: linguistique.idiom,               cat: 'langue' },
  braille:       { fn: linguistique.braille,             cat: 'langue' },
  slang:         { fn: linguistique.slang,               cat: 'langue' },
  argot:         { fn: linguistique.slang,               cat: 'langue' },
  fauxami:       { fn: linguistique.fauxami,             cat: 'langue' },
  pangram:       { fn: linguistique.pangram,             cat: 'langue' },
  proverb:       { fn: linguistique.proverb,             cat: 'langue' },
  proverbe:      { fn: linguistique.proverb,             cat: 'langue' },
  deadlanguage:  { fn: linguistique.deadlanguage,        cat: 'langue' },
  languemorte:   { fn: linguistique.deadlanguage,        cat: 'langue' },
  accent:        { fn: linguistique.accent,              cat: 'langue' },
  portmanteau:   { fn: linguistique.portmanteau,         cat: 'langue' },
  signlanguage:  { fn: linguistique.signlanguage,        cat: 'langue' },
  dialect:       { fn: linguistique.dialect,             cat: 'langue' },

  // ── Web & API ──────────────────────────────────────────────────────────────
  myip:          { fn: webapi2.myip,                     cat: 'web' },
  catfact:       { fn: webapi2.catfact,                  cat: 'web' },
  dogpic:        { fn: webapi2.dogpic,                   cat: 'web' },
  animals:       { fn: webapi2.animals,                  cat: 'web' },
  animaux:       { fn: webapi2.animals,                  cat: 'web' },
  gif:           { fn: webapi2.gif,                      cat: 'web' },
  lyrics:        { fn: webapi2.lyrics,                   cat: 'web' },
  paroles:       { fn: webapi2.lyrics,                   cat: 'web' },
  nasa:          { fn: webapi2.nasa,                     cat: 'web' },
  // ── Web Navigation ───────────────────────────────────────────────────────
  screenshot:    { fn: webtools.screenshot,               cat: 'web' },
  screen:        { fn: webtools.screenshot,               cat: 'web' },
  ss:            { fn: webtools.screenshot,               cat: 'web' },
  scrape:        { fn: webtools.scrape,                   cat: 'web' },
  extract:       { fn: webtools.scrape,                   cat: 'web' },
  readsite:      { fn: webtools.scrape,                   cat: 'web' },
  shorturl:      { fn: webtools.shorturl,                 cat: 'web' },
  short:         { fn: webtools.shorturl,                 cat: 'web' },
  raccourcir:    { fn: webtools.shorturl,                 cat: 'web' },
  ipinfo:        { fn: webtools.ipinfo,                   cat: 'web' },
  geoip:         { fn: webtools.ipinfo,                   cat: 'web' },
  headers:       { fn: webtools.headers,                  cat: 'web' },
  sitestatus:    { fn: webtools.sitestatus,               cat: 'web' },
  isup:          { fn: webtools.sitestatus,               cat: 'web' },
  isdown:        { fn: webtools.sitestatus,               cat: 'web' },
  pastebin:      { fn: webtools.pastebin,                 cat: 'web' },
  paste:         { fn: webtools.pastebin,                 cat: 'web' },
  searchimg:     { fn: webtools.searchimg,                cat: 'web' },
  image:         { fn: webtools.searchimg,                cat: 'web' },
  // ── Moteurs de recherche ─────────────────────────────────────────────────
  google:        { fn: search.google,                     cat: 'web' },
  g:             { fn: search.google,                     cat: 'web' },
  recherche:     { fn: search.google,                     cat: 'web' },
  bing:          { fn: search.bing,                       cat: 'web' },
  ddg:           { fn: search.ddg,                        cat: 'web' },
  duckduckgo:    { fn: search.ddg,                        cat: 'web' },
  duck:          { fn: search.ddg,                        cat: 'web' },
  youtube:       { fn: search.youtube,                    cat: 'web' },
  yts:           { fn: search.youtube,                    cat: 'web' },
  ytsearch:      { fn: search.youtube,                    cat: 'web' },
  web:           { fn: search.web,                        cat: 'web' },
  websearch:     { fn: search.web,                        cat: 'web' },
  maps:          { fn: search.maps,                       cat: 'web' },
  map:           { fn: search.maps,                       cat: 'web' },
  gmaps:         { fn: search.maps,                       cat: 'web' },
  scholar:       { fn: search.scholar,                    cat: 'web' },
  academic:      { fn: search.scholar,                    cat: 'web' },
  reddit:        { fn: search.reddit,                     cat: 'web' },
  // ── Play ─────────────────────────────────────────────────────────────────
  play:          { fn: require('./commands/play'),        cat: 'media' },
  jouer:         { fn: require('./commands/play'),        cat: 'media' },
  ecouter:       { fn: require('./commands/play'),        cat: 'media' },
  listen:        { fn: require('./commands/play'),        cat: 'media' },

  // ── OSINT ──────────────────────────────────────────────────────────────────
  // ── OSINT — owner/sudo uniquement ─────────────────────────────────────────
  whois:         { fn: osint.whois,                      cat: 'owner' },
  iplookup:      { fn: osint.iplookup,                   cat: 'owner' },
  ipgeo:         { fn: osint.ipgeo,                      cat: 'owner' },
  dnslookup:     { fn: osint.dnslookup,                  cat: 'owner' },
  dns:           { fn: osint.dnslookup,                  cat: 'owner' },
  ssl:           { fn: osint.ssl,                        cat: 'owner' },
  pwned:         { fn: osint.pwned,                      cat: 'owner' },
  subdomains:    { fn: osint.subdomains,                 cat: 'owner' },
  wayback:       { fn: osint.wayback,                    cat: 'owner' },

  // ── PENTEST ÉTHIQUE — owner/sudo uniquement ────────────────────────────────
  portscan:      { fn: pentest.portscan,                 cat: 'owner' },
  pingrezo:      { fn: pentest.pingrezo,                 cat: 'owner' },
  traceroute:    { fn: pentest.traceroute,               cat: 'owner' },
  hashid:        { fn: pentest.hashid,                   cat: 'owner' },
  hashcrack:     { fn: pentest.hashcrack,                cat: 'owner' },
  encode:        { fn: pentest.encode,                   cat: 'owner' },
  decode:        { fn: pentest.decode,                   cat: 'owner' },
  cvesearch:     { fn: pentest.cvesearch,                cat: 'owner' },
  cve:           { fn: pentest.cvesearch,                cat: 'owner' },
  headerscan:    { fn: pentest.headerscan,               cat: 'owner' },

  // ── NETSEC — owner/sudo uniquement ────────────────────────────────────────
  techstack:     { fn: netsec.techstack,                 cat: 'owner' },
  dirbust:       { fn: netsec.dirbust,                   cat: 'owner' },
  dirb:          { fn: netsec.dirbust,                   cat: 'owner' },
  dnsenum:       { fn: netsec.dnsenum,                   cat: 'owner' },
  apkinfo:       { fn: netsec.apkinfo,                   cat: 'owner' },
  apk:           { fn: netsec.apkinfo,                   cat: 'owner' },

  // ── DEVTOOLS — owner/sudo uniquement ──────────────────────────────────────
  regex:         { fn: devtools.regex,                   cat: 'owner' },
  json:          { fn: devtools.jsonformat,              cat: 'owner' },
  jsonformat:    { fn: devtools.jsonformat,              cat: 'owner' },
  diff:          { fn: devtools.diff,                    cat: 'owner' },
  uuid:          { fn: devtools.uuid,                    cat: 'owner' },
  timestamp:     { fn: devtools.timestamp,               cat: 'owner' },
  ts:            { fn: devtools.timestamp,               cat: 'owner' },
  ipcidr:        { fn: devtools.ipcidr,                  cat: 'owner' },
  cidr:          { fn: devtools.ipcidr,                  cat: 'owner' },
  coderun:       { fn: devtools.coderun,                 cat: 'owner' },
  run:           { fn: devtools.coderun,                 cat: 'owner' },
  colorcode:     { fn: devtools.colorcode,               cat: 'owner' },
  hex:           { fn: devtools.colorcode,               cat: 'owner' },
  lorem:         { fn: devtools.lorem,                   cat: 'owner' },

  // ── FEEDBACK — tous users + owner ─────────────────────────────────────────
  feedback:      { fn: feedbackCmd.feedback,             cat: 'util' },
  feedbacks:     { fn: feedbackCmd.feedbacks,            cat: 'owner' },
  myfeedback:    { fn: feedbackCmd.myfeedback,           cat: 'owner' },
  mynotes:       { fn: feedbackCmd.myfeedback,           cat: 'owner' },

  // ── Admin Plus ─────────────────────────────────────────────────────────────
  warnlist:      { fn: adminplus.warnlist,               cat: 'admin' },
  listwarn:      { fn: adminplus.warnlist,               cat: 'admin' },
  unmute:        { fn: adminplus.unmute,                 cat: 'admin' },
  modstatus:     { fn: adminplus.modstatus,              cat: 'admin' },
  heatmap:       { fn: adminplus.heatmap,                cat: 'admin' },
  unban:         { fn: adminplus.unban,                  cat: 'admin' },
  ban:           { fn: adminplus.ban,                    cat: 'admin' },
  antispam:      { fn: adminplus.antispam,               cat: 'admin' },
  // ── Sous-menus directs — Architecture 2 niveaux ─────────────────────────
  listmedia:   { fn: require('./commands/help').listmedia,  cat: 'util' },
  mediamenu:   { fn: require('./commands/help').listmedia,  cat: 'util' },
  listai:      { fn: require('./commands/help').listai,     cat: 'util' },
  aimenu:      { fn: require('./commands/help').listai,     cat: 'util' },
  iamenu:      { fn: require('./commands/help').listai,     cat: 'util' },
  listrpg:     { fn: require('./commands/help').listrpg,    cat: 'util' },
  rpgmenu:     { fn: require('./commands/help').listrpg,    cat: 'util' },
  listaudio:   { fn: require('./commands/help').listaudio,  cat: 'util' },
  audiomenu:   { fn: require('./commands/help').listaudio,  cat: 'util' },
  listtools:    { fn: require('./commands/help').listtools,    cat: 'util' },
  toolsmenu:    { fn: require('./commands/help').listtools,    cat: 'util' },
  listsystem:   { fn: require('./commands/help').listsystem,   cat: 'util' },
  systemmenu:   { fn: require('./commands/help').listsystem,   cat: 'util' },
  listadmin:    { fn: require('./commands/help').listadmin,    cat: 'util' },
  adminmenu:    { fn: require('./commands/help').listadmin,    cat: 'util' },
  listflex:     { fn: require('./commands/help').listflex,     cat: 'owner' },
  flexmenu:     { fn: require('./commands/help').listflex,     cat: 'owner' },
  listosint:    { fn: require('./commands/help').listosint,    cat: 'owner' },
  osintmenu:    { fn: require('./commands/help').listosint,    cat: 'owner' },
  recon:        { fn: require('./commands/help').listosint,    cat: 'owner' },
  listpentest:  { fn: require('./commands/help').listpentest,  cat: 'owner' },
  pentestmenu:  { fn: require('./commands/help').listpentest,  cat: 'owner' },
  hacking:      { fn: require('./commands/help').listpentest,  cat: 'owner' },
  listnetsec:   { fn: require('./commands/help').listnetsec,   cat: 'owner' },
  netsecmenu:   { fn: require('./commands/help').listnetsec,   cat: 'owner' },
  listdevtools: { fn: require('./commands/help').listdevtools, cat: 'owner' },
  devmenu:      { fn: require('./commands/help').listdevtools, cat: 'owner' },
  listfeedback: { fn: require('./commands/help').listfeedback, cat: 'util' },
  feedbackmenu: { fn: require('./commands/help').listfeedback, cat: 'util' },

};

// ── Antiraid ──────────────────────────────────────────────────────────────────
// ── Utilitaire permissions ─────────────────────────────────────────────────
function isPrivileged(sender) {
  return config.isOwner(sender) || config.isSudo(sender);
}

const raidTracker = new Map();
// Purge les entrées inactives toutes les 10 minutes pour éviter les fuites mémoire
setInterval(() => {
  const now = Date.now();
  for (const [jid, info] of raidTracker.entries()) {
    if (now - info.lastTime > 5 * 60 * 1000) raidTracker.delete(jid);
  }
}, 10 * 60 * 1000);

async function checkAntiRaid(sock, jid) {
  if (!gs.isEnabled('antiraid', jid)) return;
  const now  = Date.now();
  const info = raidTracker.get(jid) || { count: 0, lastTime: now };
  if (now - info.lastTime > 30000) { raidTracker.set(jid, { count: 1, lastTime: now }); return; }
  info.count++;
  raidTracker.set(jid, info);
  if (info.count >= 5) {
    raidTracker.set(jid, { count: 0, lastTime: now });
    try {
      await sock.groupSettingUpdate(jid, 'announcement');
      await antiBan.safeSend(sock, jid, { text: '🚨 *ANTIRAID !* Groupe verrouillé.\n\n> ZERO TRACE BOT v5.0' });
    } catch (e) {}
  }
}

// ── Extraction texte ──────────────────────────────────────────────────────────
function extractText(msg) {
  const m = msg.message;
  if (!m) return '';

  // Extraire l'id depuis nativeFlowResponseMessage (carousel quick_reply)
  const paramsRaw =
    m.interactiveResponseMessage?.nativeFlowResponseMessage?.paramsJson ||
    m.interactiveResponseMessage?.body?.text || '';
  if (paramsRaw) {
    try {
      const parsed = JSON.parse(paramsRaw);
      const id = parsed?.id || parsed?.selectedId || '';
      if (id) return id;
    } catch (e) {
      if (paramsRaw.trim()) return paramsRaw.trim();
    }
  }

  return (
    m.conversation ||
    m.extendedTextMessage?.text ||
    m.imageMessage?.caption ||
    m.videoMessage?.caption ||
    m.documentMessage?.caption ||
    m.buttonsResponseMessage?.selectedButtonId ||
    m.listResponseMessage?.singleSelectReply?.selectedRowId || ''
  );
}

// ── Détection message vocal (ptt = push-to-talk = vocal WhatsApp) ────────────
// CORRIGÉ v2 : gère les enveloppes viewOnce, ephemeral, documentWithCaption
function _unwrapAudio(msg) {
  const m = msg?.message || {};
  // Direct
  if (m.audioMessage) return m.audioMessage;
  // viewOnceMessage
  if (m.viewOnceMessage?.message?.audioMessage) return m.viewOnceMessage.message.audioMessage;
  if (m.viewOnceMessageV2?.message?.audioMessage) return m.viewOnceMessageV2.message.audioMessage;
  // ephemeralMessage
  if (m.ephemeralMessage?.message?.audioMessage) return m.ephemeralMessage.message.audioMessage;
  // documentWithCaptionMessage
  if (m.documentWithCaptionMessage?.message?.audioMessage) return m.documentWithCaptionMessage.message.audioMessage;
  // ptpMessage (ancienne version Baileys)
  if (m.ptpMessage) return { ptt: true, ...m.ptpMessage };
  return null;
}

function isVoiceMessage(msg) {
  const audio = _unwrapAudio(msg);
  // ptt:true = note vocale WhatsApp (enregistrement direct)
  // ptt non défini dans certains vocaux → on check le mimetype
  if (!audio) return false;
  return audio.ptt === true || audio.mimetype?.includes('ogg');
}

function isAudioFile(msg) {
  const audio = _unwrapAudio(msg);
  if (!audio) return false;
  // ptt:false OU mimetype mp3/mpeg = fichier audio partagé
  return !audio.ptt && !!(audio.mimetype?.includes('audio') || audio.mimetype?.includes('mpeg'));
}

// ── Télécharger un message audio depuis Baileys ──────────────────────────────
// CORRIGÉ v2 : gère les enveloppes viewOnce, ephemeral, documentWithCaptionMessage
async function downloadAudio(sock, msg) {
  try {
    const { downloadMediaMessage } = require('@whiskeysockets/baileys');

    // ── Désencapsuler le message si nécessaire ────────────────────────────
    // Baileys emballe parfois le message dans des couches supplémentaires
    let realMsg = { ...msg };
    const m = realMsg.message || {};

    // viewOnceMessage → déballer
    if (m.viewOnceMessage?.message) {
      realMsg = { ...realMsg, message: m.viewOnceMessage.message };
    }
    // viewOnceMessageV2 → déballer
    if (m.viewOnceMessageV2?.message?.audioMessage) {
      realMsg = { ...realMsg, message: m.viewOnceMessageV2.message };
    }
    // ephemeralMessage → déballer
    if (m.ephemeralMessage?.message) {
      realMsg = { ...realMsg, message: m.ephemeralMessage.message };
    }
    // documentWithCaptionMessage → déballer
    if (m.documentWithCaptionMessage?.message) {
      realMsg = { ...realMsg, message: m.documentWithCaptionMessage.message };
    }

    // Vérifier que c'est bien un audioMessage après déballage
    const finalMsg = realMsg.message || {};
    if (!finalMsg.audioMessage && !finalMsg.ptpMessage) {
      console.warn("[AUDIO DL] Pas d'audioMessage trouvé après déballage");
      return null;
    }

    // ── Télécharger avec reupload automatique si lien expiré ─────────────
    let buffer = null;
    try {
      buffer = await downloadMediaMessage(
        realMsg,
        'buffer',
        {},
        { reuploadRequest: sock.updateMediaMessage }
      );
    } catch (firstErr) {
      console.log('[AUDIO DL] Première tentative échouée:', firstErr.message);
      // Deuxième tentative : sans reuploadRequest (certaines versions Baileys)
      try {
        buffer = await downloadMediaMessage(realMsg, 'buffer', {});
      } catch (secondErr) {
        console.error('[AUDIO DL] Deuxième tentative échouée:', secondErr.message);
        return null;
      }
    }

    if (!buffer || buffer.length === 0) {
      console.warn('[AUDIO DL] Buffer vide reçu');
      return null;
    }

    return buffer;

  } catch (err) {
    console.error('[AUDIO DL] Erreur globale:', err.message);
    return null;
  }
}

// ── Envoyer une réponse vocale ───────────────────────────────────────────────
// CORRIGÉ v2 : validation du buffer + mime forcé + retry + log provider
async function sendVoiceReply(sock, jid, msg, text, useClonedVoice = false) {
  try {
    const ttsResult = await voiceLib.synthesizeSpeech(text, useClonedVoice);

    if (!ttsResult?.buffer) {
      console.warn("[TTS REPLY] Aucun provider TTS n'a retourné de buffer");
      return false;
    }

    // Validation stricte du buffer avant envoi
    if (!voiceLib.isValidAudioBuffer(ttsResult.buffer)) {
      console.warn('[TTS REPLY] Buffer invalide (taille:', ttsResult.buffer.length, ') — annulé');
      return false;
    }

    console.log(`[TTS REPLY] Envoi vocal via ${ttsResult.provider} (${ttsResult.buffer.length} bytes)`);

    // Forcer audio/mpeg pour compatibilité maximale WhatsApp
    await sock.sendMessage(jid, {
      audio:    ttsResult.buffer,
      mimetype: 'audio/mpeg',   // toujours audio/mpeg, même si OGG
      ptt:      true,            // true = note vocale (bulle ronde)
    }, { quoted: msg });

    return true;

  } catch (err) {
    console.error('[TTS REPLY] Erreur:', err.message);
    return false;
  }
}

// ── HANDLER PRINCIPAL ─────────────────────────────────────────────────────────
async function messageHandler(sock, msg) {
  try {
    if (msg.key.remoteJid === 'status@broadcast') return;
    if (!msg.message) return;

    const globalPrefix = config.getPrefix();
    const jid     = msg.key.remoteJid;
    const isGroup = jid.endsWith('@g.us');

    // ── Sender ───────────────────────────────────────────────────────────────
    // Résolution robuste :
    // - Groupe       : participant (vrai JID de l'expéditeur)
    // - DM fromMe    : c'est forcément l'owner qui tape depuis son WhatsApp
    // - DM entrant   : remoteJid = JID de l'expéditeur
    // ── Résolution du sender (robuste multi-device) ─────────────────────────
    let sender;
    if (isGroup) {
      // En groupe : participant = vrai expéditeur
      sender = msg.key.participant || msg.key.remoteJid;
    } else if (msg.key.fromMe) {
      // fromMe = true dans 2 cas :
      //   1. L'owner tape depuis son propre WA (participant = vide ou ownerNumber)
      //   2. Un appareil apparié (multi-device) envoie — participant contient son JID réel
      // ✅ FIX PAIRED DEVICE : si participant existe et diffère de l'ownerNumber → c'est l'appareil lié
      const pairedParticipant = msg.key.participant;
      const rawOwner = settings.ownerNumber.replace(/[^0-9]/g, '');
      if (pairedParticipant && !pairedParticipant.includes(rawOwner)) {
        // Appareil apparié → utiliser son JID réel
        sender = pairedParticipant;
      } else {
        // Owner lui-même → utiliser ownerNumber
        sender = rawOwner + '@s.whatsapp.net';
      }
    } else {
      // DM entrant : l'expéditeur = remoteJid
      sender = msg.key.remoteJid;
    }
    // Normaliser le format @s.whatsapp.net
    if (!sender.includes('@')) sender = sender + '@s.whatsapp.net';

    const isOwner  = config.isOwner(sender);
    const isSudo   = config.isSudo(sender);
    const isPriv   = isPrivileged(sender); // centralisé
    const pushName = msg.pushName || 'Membre';

    // ── Prefix — résolution centralisée ─────────────────────────────────────
    // Règle unique :
    //   owner / sudo    → prefix global toujours (pas de perso possible)
    //   user pairé      → son prefix perso OU le global (les deux acceptés)
    //   utilisateur anon→ prefix global uniquement
    const personalPrefix = (!isOwner && !isSudo)
      ? userPfx.getPrefix(sender, globalPrefix)  // peut être identique au global
      : globalPrefix;
    const prefix = personalPrefix; // alias court utilisé partout après

    // startsWithAnyPrefix(text) → true si le texte commence par le prefix
    // personnel OU le global (double compatibilité pour les pairés)
    const startsWithAnyPrefix = (text) => {
      if (!text) return false;
      if (text.startsWith(globalPrefix)) return true;
      if (personalPrefix !== globalPrefix && text.startsWith(personalPrefix)) return true;
      return false;
    };

    // resolveUsedPrefix(text) → retourne le prefix effectivement utilisé
    const resolveUsedPrefix = (text) => {
      if (!text) return prefix;
      if (text.startsWith(personalPrefix)) return personalPrefix;
      if (text.startsWith(globalPrefix))   return globalPrefix;
      return prefix;
    };

    // ── GATE ZERO — bot en veille si non activé ───────────────────────────────
    // L'owner et les sudos passent toujours.
    // .zero est toujours accessible même en veille.
    // Tout le reste est bloqué jusqu'à ce que .zero soit tapé.
    {
      const zeroCmd = require('./commands/zero');
      const body_   = extractText(msg) || '';
      // GATE ZERO : accepte le prefix global ET le prefix personnel
      const _bodyLow = body_.toLowerCase();
      const isZeroCmd = [globalPrefix, personalPrefix].some(p =>
        _bodyLow.startsWith(`${p}zero`) ||
        _bodyLow.startsWith(`${p}wake`) ||
        _bodyLow.startsWith(`${p}wakeup`) ||
        _bodyLow.startsWith(`${p}zerotrace`)
      );

      if (!isOwner && !isSudo && !msg.key.fromMe) {
        if (!zeroCmd.isActivated(jid) && !isZeroCmd) {
          // Bot en veille — ignorer silencieusement
          // (on ne répond pas pour ne pas spam)
          return;
        }
      }
      // ✅ FIX AUTO-ACTIVATE EN GROUPE : si l'owner tape une commande dans un groupe
      // non encore activé → l'activer automatiquement (évite de taper .zero dans chaque groupe)
      if ((isOwner || isSudo || msg.key.fromMe) && isGroup) {
        const body_ = extractText(msg) || '';
        if (startsWithAnyPrefix(body_) && !zeroCmd.isActivated(jid)) {
          zeroCmd.activate(jid, sender);
        }
      }
    }

    // ── Admin groupe : vérifier si le sender est admin/superadmin ────────────
    let isGroupAdmin = false;
    if (isGroup) {
      try {
        const _groupMeta = await sock.groupMetadata(jid);
        // ✅ FIX JID NORMALIZATION : strip device suffix (:N) avant comparaison
        // Ex: "226123456:5@s.whatsapp.net" → "226123456" pour comparer à sender "226123456@s.whatsapp.net"
        const normJid = (j) => (j || '').replace(/@.*$/, '').replace(/:[0-9]+$/, '');
        const senderNum = normJid(sender);
        const _part = _groupMeta.participants.find(p => normJid(p.id) === senderNum);
        isGroupAdmin = _part?.admin === 'admin' || _part?.admin === 'superadmin';
        if (isGroupAdmin) console.log('[GROUP] Admin confirmé: ' + sender);
      } catch (e) {
        console.error('[GROUP] Erreur groupMetadata:', e.message);
      }
    }

    // ── Détecter le type de message ───────────────────────────────────────────
    const isVoice        = isVoiceMessage(msg);
    const isAudio        = isAudioFile(msg);
    const isListResponse = !!msg.message?.listResponseMessage
                        || !!msg.message?.interactiveResponseMessage
                        || !!msg.message?.interactiveResponseMessage?.nativeFlowResponseMessage
                        || !!msg.message?.buttonsResponseMessage;
    let body             = extractText(msg);

    // ── HORAIRES ACTIFS ───────────────────────────────────────────────────────
    // Si des horaires sont définis et qu'on est hors créneau → ignorer (sauf owner/sudo)
    if (!isOwner && !isSudo && !msg.key.fromMe) {
      try {
        const activeHours = require('./commands/activehours');
        if (!activeHours.isActiveNow()) {
          // Envoyer le message hors-horaires une seule fois (pas de spam)
          const bodyLow = (body || '').toLowerCase();
          if (bodyLow.startsWith(prefix)) {
            await antiBan.safeSend(sock, jid, {
              text: activeHours.getOffMessage() + '\n\n> ⚡ _ZERO TRACE BOT v5.0_',
            }, { msgOptions: { quoted: msg } });
          }
          return;
        }
      } catch (e) {}
    }

    // ── AUTOREPLY ─────────────────────────────────────────────────────────────
    // Vérifier si un autoreply correspond au message reçu (hors commandes)
    if (!isOwner && !isSudo && body && !startsWithAnyPrefix(body)) {
      try {
        const autoReplyCmd = require('./commands/autoreply');
        const reply = autoReplyCmd.findReply(body, jid);
        if (reply) {
          await antiBan.safeSend(sock, jid, { text: reply }, { msgOptions: { quoted: msg } });
          return;
        }
      } catch (e) {}
    }
    // Pour changer le préfixe : .setprefix [nouveau]
    // Les préfixes alternatifs ! / # sont désactivés

    // ── Filtre fromMe ─────────────────────────────────────────────────────────
    // fromMe=true = c'est l'owner qui envoie (vers un contact OU vers lui-même)
    // ✅ FIX : quand l'owner tape une commande dans le DM d'un contact (fromMe=true),
    //    on laisse TOUJOURS passer les commandes préfixées — peu importe le JID cible
    if (msg.key.fromMe) {
      const isCmd = body && startsWithAnyPrefix(body);
      const agentActiveHere = brainCmd.isBrainActive(jid);
      const privateChatbotFromMe = !isGroup && brainCmd.isPrivateChatbotEnabled();
      const isCatClick = (body && body.startsWith('cat_'));
      const _paramsRawFM = msg.message?.interactiveResponseMessage?.nativeFlowResponseMessage?.paramsJson || '';
      let _carouselIdFM = '';
      try { _carouselIdFM = JSON.parse(_paramsRawFM)?.id || ''; } catch(e) { _carouselIdFM = _paramsRawFM.trim(); }
      const isCarouselCatClick = _carouselIdFM.startsWith('cat_');
      const isInteractiveClick = !!(_paramsRawFM || msg.message?.interactiveResponseMessage?.body?.text || msg.message?.listResponseMessage?.singleSelectReply?.selectedRowId || msg.message?.buttonsResponseMessage?.selectedButtonId);
      // ✅ TOUJOURS laisser passer les commandes préfixées de l'owner (fromMe)
      // Cela couvre : DM vers soi-même, DM vers un contact, groupes
      // ✅ Chiffre seul (navigation menu) ou "menu" keyword → laisser passer pour appareil apparié
      const isSoloDigit = body && /^\d+$/.test(body.trim());
      const isMenuKeyword = body && body.toLowerCase().trim() === 'menu';
      if (!isVoice && !isListResponse && !isCmd && !agentActiveHere && !privateChatbotFromMe && !isCatClick && !isCarouselCatClick && !isInteractiveClick && !isSoloDigit && !isMenuKeyword) return;
    }

    // ── Filtre groupe : laisser passer commandes + cerveau ZERO TRACE ─────────
    if (isGroup && !msg.key.fromMe) {
      const agentActiveHere  = brainCmd.isBrainActive(jid);
      const agentPublicHere  = true; // le brain répond à tous en groupe si actif
      const isCmd = body && startsWithAnyPrefix(body);
      // ⚠️ Laisser passer les clics carousel/liste (cat_xxx) de tous les membres
      const isCatClickGroup = body && body.startsWith('cat_');
      const _paramsRawGR = msg.message?.interactiveResponseMessage?.nativeFlowResponseMessage?.paramsJson || '';
      let _carouselIdGR = '';
      try { _carouselIdGR = JSON.parse(_paramsRawGR)?.id || ''; } catch(e) { _carouselIdGR = _paramsRawGR.trim(); }
      const isCarouselCatClickGroup = _carouselIdGR.startsWith('cat_');
      const isInteractiveClickGroup = !!(
        _paramsRawGR ||
        msg.message?.interactiveResponseMessage?.body?.text ||
        msg.message?.listResponseMessage?.singleSelectReply?.selectedRowId ||
        msg.message?.buttonsResponseMessage?.selectedButtonId
      );
      if (!isCmd && !isVoice && !isListResponse && !isCatClickGroup && !isCarouselCatClickGroup && !isInteractiveClickGroup) {
        if (agentActiveHere) { /* brain actif → passer */ }
        else return; // aucun service actif → ignorer
      }
    }

    // ── MODE PRIVÉ ────────────────────────────────────────────────────────────
    // OFF (défaut) → tout le monde peut utiliser le bot en DM et en groupe
    // ON           → seuls l'owner et les sudos sont acceptés
    //
    // ⚠️  Le mode privé ne bloque PAS les DM vers l'owner lui-même (fromMe)
    //     ni les messages de l'owner dans ses groupes
    if (config.isPrivateMode()) {
      // ⚠️ EXCEPTIONS au mode privé :
      // 1. .pair et alias → toujours accessibles (sinon personne ne peut se connecter)
      // 2. Brain privé activé + DM entrant → laisser passer pour que le cerveau réponde
      const isPairCmd = body.toLowerCase().startsWith(`${prefix}pair`) ||
                        body.toLowerCase().startsWith(`${prefix}paire`) ||
                        body.toLowerCase().startsWith(`${prefix}connecter`) ||
                        body.toLowerCase().startsWith(`${prefix}lier`) ||
                        body.toLowerCase().startsWith(`${prefix}connect`);

      // Vérifier si le brain privé est actif (répond aux DM de tout le monde)
      const isDM = !isGroup;
      const privateChatbotActive = isDM && brainCmd.isPrivateChatbotEnabled();

      // ✅ FIX : fromMe = l'owner tape depuis son WA → toujours autorisé
      const allowed = isOwner || isSudo || msg.key.fromMe || isPairCmd || privateChatbotActive;
      if (!allowed) {
        await antiBan.safeSend(sock, jid, {
          text: '🔒 Ce bot est en *mode privé*.\nAccès réservé au propriétaire.\n\n💡 Tu peux te connecter avec *.pair*',
        }, { msgOptions: { quoted: msg } });
        return;
      }
    }

    // ── Anticall ──────────────────────────────────────────────────────────────
    if (msg.message?.call && gs.isEnabled('anticall', 'global')) {
      try { await sock.rejectCall(msg.key.id, jid); } catch (e) {}
      return;
    }

    // ── Antilink ──────────────────────────────────────────────────────────────
    if (isGroup && gs.isEnabled('antilink', jid) && body) {
      const linkRegex = /(https?:\/\/|wa\.me|t\.me|bit\.ly|youtube\.com|youtu\.be|tiktok\.com|instagram\.com)/i;
      if (linkRegex.test(body) && !isOwner && !isSudo) {
        try {
          await sock.sendMessage(jid, { delete: msg.key });
          await antiBan.safeSend(sock, jid, {
            text: `⛔ @${sender.split('@')[0]}, les liens sont interdits !`,
            mentions: [sender],
          });
        } catch (e) {}
        return;
      }
    }

    // ── Antibadword ───────────────────────────────────────────────────────────
    if (isGroup && gs.isEnabled('antibadword', jid) && body) {
      const hasBad = antibadwordCmd.BAD_WORDS?.some(w => body.toLowerCase().includes(w));
      if (hasBad && !isOwner && !isSudo) {
        try {
          await sock.sendMessage(jid, { delete: msg.key });
          await antiBan.safeSend(sock, jid, {
            text: `🚫 @${sender.split('@')[0]}, les gros mots sont interdits !`,
            mentions: [sender],
          });
        } catch (e) {}
        return;
      }
    }

    // ── Anti-spam ─────────────────────────────────────────────────────────────
    if (!antiBan.shouldProcess(jid, sender)) return;

    // ── Stats ─────────────────────────────────────────────────────────────────
    if (isGroup && !msg.key.fromMe) {
      incrementStat(jid, sender);
    }

    // ── AFK ───────────────────────────────────────────────────────────────────
    if (body) await afkCmd.checkAFK(sock, jid, msg, body, sender, antiBan);

    // ── TicTacToe ─────────────────────────────────────────────────────────────
    if (isGroup && body && /^[1-9]$/.test(body.trim())) {
      const handled = await tttCmd.handleMove(sock, jid, msg, sender, body, antiBan);
      if (handled) return;
    }

    // ══════════════════════════════════════════════════════════════════════════
    // ── TRAITEMENT DES MESSAGES VOCAUX ────────────────────────────────────────
    // ══════════════════════════════════════════════════════════════════════════
    if (isVoice || isAudio) {
      // Seulement si le cerveau ZERO TRACE est actif, ou si c'est l'owner/sudo
      const agentActive = brainCmd.isBrainActive(jid);
      const chatbotActive = brainCmd.isPrivateChatbotEnabled() && !isGroup;

      if (!chatbotActive && !agentActive && !isOwner && !isSudo) return;

      console.log(chalk.magenta(`[VOCAL] Message vocal de ${pushName} — transcription en cours...`));

      // Télécharger le vocal
      const audioBuffer = await downloadAudio(sock, msg);
      if (!audioBuffer) return;

      // Envoyer indicateur "enregistrement en cours"
      try {
        await sock.sendPresenceUpdate('recording', jid);
        await new Promise(r => setTimeout(r, 1500));
        await sock.sendPresenceUpdate('paused', jid);
      } catch (e) {}

      // Transcrire le vocal → texte
      const transcription = await voiceLib.transcribeAudio(audioBuffer);

      if (!transcription?.text) {
        // Si transcription échoue, ignorer silencieusement
        console.log('[VOCAL] Transcription échouée — vocal ignoré');
        return;
      }

      const transcribedText = transcription.text.trim();
      console.log(chalk.magenta(`[VOCAL] Transcrit: "${transcribedText}" (${transcription.provider})`));

      // Utiliser le texte transcrit comme body pour la suite
      body = transcribedText;

      // Indiquer au destinataire que le vocal a été compris (optionnel)
      // On ne notifie que l'owner/sudo pour ne pas spam le groupe
      if ((isOwner || isSudo) && agentActive) {
        await sock.sendMessage(jid, {
          text: `🎙️ _"${transcribedText}"_`,
        }, { quoted: msg });
      }

      // ── ZERO TRACE BRAIN → répond en vocal ET en texte ───────────────────
      if (agentActive || chatbotActive) {
        const ctx = { sock, jid, msg, body: transcribedText, sender, isOwner, isSudo, antiBan, COMMANDS, prefix, pushName, isGroupAdmin, isGroup };
        const handled = await brainCmd.handleMessage(ctx, COMMANDS);
        if (handled) {
          setTimeout(async () => {
            try {
              const history = openRouterAI.memory.getHistory(`brain_${jid}`);
              const lastAssistant = [...history].reverse().find(m => m.role === 'assistant');
              if (lastAssistant?.content) {
                const cleanText = lastAssistant.content
                  .replace(/zero trace > ?/gi, '')
                  .replace(/⚡|❌|✅|⚠️/g, '')
                  .trim()
                  .slice(0, 400);
                if (cleanText.length > 5) {
                  const hasClone = !!voiceLib.getClonedVoiceId();
                  await sendVoiceReply(sock, jid, msg, cleanText, hasClone);
                }
              }
            } catch (e) {}
          }, 1500);
          return;
        }
      }

      return; // Fin du traitement vocal
    }

    // ══════════════════════════════════════════════════════════════════════════
    // ── TRAITEMENT DES MESSAGES TEXTE ─────────────────────────────────────────
    // ══════════════════════════════════════════════════════════════════════════

    // ── Réponse interactiveMessage — couvre TOUS les formats WA/Baileys ──────
    {
      // Format 1 : nativeFlowResponseMessage (carousel quick_reply)
      // Format 2 : interactiveResponseMessage classique  
      // Format 3 : le body du message contient directement l'id (cat_xxx)
      // Format 4 : buttonsResponseMessage (anciens boutons)
      const im = msg.message?.interactiveResponseMessage;
      const paramsRaw =
        im?.nativeFlowResponseMessage?.paramsJson ||
        im?.body?.text || '';
      const buttonId =
        msg.message?.buttonsResponseMessage?.selectedButtonId || '';

      // Extraire l'id depuis tous les formats possibles
      let carouselId = '';
      if (paramsRaw) {
        try {
          const parsed = JSON.parse(paramsRaw);
          carouselId = parsed?.id || parsed?.selectedId || parsed?.display_text || '';
        } catch (e) {
          // paramsRaw peut être directement l'id (pas du JSON)
          carouselId = paramsRaw.trim();
        }
      }
      if (!carouselId && buttonId) carouselId = buttonId;
      if (!carouselId && body && body.startsWith('cat_')) carouselId = body;

      if (carouselId && carouselId.startsWith('cat_')) {
        console.log(chalk.cyan('[CAROUSEL] Clic catégorie intercepté:', carouselId));
        try { await sock.sendMessage(jid, { react: { text: '⚡', key: msg.key } }); } catch (e) {}

        const SPECIAL_CATS = { cat_ping: 'ping', cat_uptime: 'alive', cat_owner: 'owner', cat_pair: 'pair' };
        if (SPECIAL_CATS[carouselId]) {
          const sc = SPECIAL_CATS[carouselId];
          const se = COMMANDS[sc];
          if (se) {
            await se.fn.execute({ sock, msg, jid, sender, isGroup, pushName, args: [], command: sc, prefix, body: `${prefix}${sc}`, antiBan, isOwner, isSudo, isOwnerContext: isOwner || isSudo || msg.key.fromMe, modeType: 'carousel',
              sendInteractiveMessage: (p, q=msg) => sendInteractiveMessage(sock, jid, p, q),
              sendButtons:  (t, b, f='') => sendButtons(sock, jid, t, b, f, msg),
              sendList:     (t, bt, s, ti='', f='') => sendList(sock, jid, t, bt, s, ti, f, msg),
              sendQuickReply: (t, r, i=null) => sendQuickReply(sock, jid, t, r, i, msg),
            });
            return;
          }
        }

        const menuFile = require('./commands/help');
        await menuFile.sendCategoryMenu(sock, jid, msg, carouselId, prefix);
        return;
      }
    }

    // ── Réponse liste interactive (listResponseMessage legacy) ────────────────
    // DOIT être AVANT le guard !body car selon la version de Baileys/WA,
    // listResponseMessage peut avoir body = "" tout en ayant un selectedRowId.
    {
      const rawRowId =
        msg.message?.listResponseMessage?.singleSelectReply?.selectedRowId || '';

      // Clic sur une catégorie → ouvrir le sous-menu
      if (rawRowId.startsWith('cat_')) {
        console.log(chalk.cyan('[LIST] Clic catégorie:', rawRowId));
        try { await sock.sendMessage(jid, { react: { text: '⚡', key: msg.key } }); } catch (e) {}

        // Cartes spéciales (ping, uptime, owner)
        const SPECIAL_CATS_LIST = { cat_ping: 'ping', cat_uptime: 'alive', cat_owner: 'owner', cat_pair: 'pair' };
        if (SPECIAL_CATS_LIST[rawRowId]) {
          const sc = SPECIAL_CATS_LIST[rawRowId];
          const se = COMMANDS[sc];
          if (se) {
            const scCtx = { sock, msg, jid, sender, isGroup, pushName, args: [], command: sc, prefix, body: `${prefix}${sc}`, antiBan, isOwner, isSudo, isOwnerContext: isOwner || isSudo || msg.key.fromMe, modeType: 'carousel',
              sendInteractiveMessage: (payload, quoted = msg) => sendInteractiveMessage(sock, jid, payload, quoted),
              sendButtons: (text, buttons, footer = '') => sendButtons(sock, jid, text, buttons, footer, msg),
              sendList: (text, btnText, sections, title = '', footer = '') => sendList(sock, jid, text, btnText, sections, title, footer, msg),
              sendQuickReply: (text, replies, imageUrl = null) => sendQuickReply(sock, jid, text, replies, imageUrl, msg),
            };
            await se.fn.execute(scCtx);
            return;
          }
        }

        const menuFile = require('./commands/help');
        await menuFile.sendCategoryMenu(sock, jid, msg, rawRowId, prefix);
        return;
      }

      // Clic sur une commande du sous-menu → exécuter directement
      if (rawRowId && startsWithAnyPrefix(rawRowId)) {
        const directCmd = rawRowId.slice(resolveUsedPrefix(rawRowId).length).trim().toLowerCase();
        const directEntry = COMMANDS[directCmd];
        if (directEntry) {
          // Vérification mode privé : bloquer les non-owner/sudo sauf si owner
          if (config.isPrivateMode() && !isOwner && !isSudo) {
            await antiBan.safeSend(sock, jid, {
              text: '🔒 Ce bot est en *mode privé*. Accès réservé au propriétaire.',
            }, { msgOptions: { quoted: msg } });
            return;
          }
          // Vérification commande owner : seul owner/sudo peut l'exécuter
          if (directEntry.cat === 'owner' && !isOwner && !isSudo) {
            await antiBan.safeSend(sock, jid, {
              text: `🔒 La commande *${prefix}${directCmd}* est réservée au propriétaire du bot.`,
            }, { msgOptions: { quoted: msg } });
            return;
          }
          console.log(chalk.cyan('[SUBMENU] Exécution commande:', rawRowId));
          try { await sock.sendMessage(jid, { react: { text: '⚡', key: msg.key } }); } catch (e) {}
          const directCtx = {
            sock, msg, jid, sender, isGroup, pushName,
            args: [], command: directCmd, prefix, body: rawRowId,
            antiBan, isOwner, isSudo, isOwnerContext: isOwner || isSudo || msg.key.fromMe, modeType: 'submenu',
            sendInteractiveMessage: (payload, quoted = msg) => sendInteractiveMessage(sock, jid, payload, quoted),
            sendButtons:  (text, buttons, footer = '') => sendButtons(sock, jid, text, buttons, footer, msg),
            sendList:     (text, btnText, sections, title = '', footer = '') => sendList(sock, jid, text, btnText, sections, title, footer, msg),
            sendQuickReply: (text, replies, imageUrl = null) => sendQuickReply(sock, jid, text, replies, imageUrl, msg),
          };
          await directEntry.fn.execute(directCtx);
          return;
        }
        // Commande avec args → indiquer comment l'utiliser
        const cmdName = directCmd.split(' ')[0];
        const entry = COMMANDS[cmdName];
        if (entry) {
          try { await sock.sendMessage(jid, { react: { text: 'ℹ️', key: msg.key } }); } catch (e) {}
          await antiBan.safeSend(sock, jid, {
            text:
              `ℹ️ *Commande :* \`${rawRowId}\`\n\n` +
              `Pour l'utiliser, tape-la dans le chat avec tes paramètres.\n` +
              `Exemple : \`${rawRowId.replace('[', '').replace(']', '...')}\`\n\n` +
              `> *ZERO TRACE BOT v5.0*`,
          }, { msgOptions: { quoted: msg } });
          return;
        }
      }

      // Clic "Retour au menu"
      if (rawRowId === `${prefix}menu` || rawRowId === '.menu' || rawRowId === 'menu') {
        const menuFile = require('./commands/help');
        await menuFile.sendMainMenu(sock, jid, msg, prefix, pushName);
        return;
      }
    }

    // ── Interception quick_reply du carousel ─────────────────────────────────
    // Les boutons du carousel envoient un message texte avec l'id comme body
    // Ex: "cat_ia" → sous-menu IA   |   ".ping" → commande ping
    if (body && !body.startsWith(prefix)) {
      if (body.startsWith('cat_') && COMMANDS['help']) {
        try { await sock.sendMessage(jid, { react: { text: '⚡', key: msg.key } }); } catch (e) {}
        const menuFile = require('./commands/help');
        await menuFile.sendCategoryMenu(sock, jid, msg, body, prefix);
        return;
      }
      // Boutons direct-commande du carousel (ex: ".ping", ".alive", ".owner")
      // Support du préfixe dynamique ET du "." par défaut (envoyé par les boutons)
      const startsWithDot = body.startsWith('.') && body.length > 1 && !body.includes(' ');
      const startsWithPrefix = body.startsWith(prefix) && body.length > prefix.length && !body.includes(' ');
      if (startsWithDot || startsWithPrefix) {
        const directCmd = (startsWithDot ? body.slice(1) : body.slice(prefix.length)).toLowerCase();
        const directEntry = COMMANDS[directCmd];
        if (directEntry) {
          logger.cmd(`[CAROUSEL] ${pushName} → ${body}`);
          try { await sock.sendMessage(jid, { react: { text: '⚡', key: msg.key } }); } catch (e) {}
          const directCtx = {
            sock, msg, jid, sender, isGroup, pushName,
            args: [], command: directCmd, prefix, body,
            antiBan, isOwner, isSudo, isOwnerContext: isOwner || isSudo || msg.key.fromMe, modeType: 'carousel',
            sendInteractiveMessage: (payload, quoted = msg) => sendInteractiveMessage(sock, jid, payload, quoted),
            sendButtons:  (text, buttons, footer = '') => sendButtons(sock, jid, text, buttons, footer, msg),
            sendList:     (text, btnText, sections, title = '', footer = '') => sendList(sock, jid, text, btnText, sections, title, footer, msg),
            sendQuickReply: (text, replies, imageUrl = null) => sendQuickReply(sock, jid, text, replies, imageUrl, msg),
          };
          await directEntry.fn.execute(directCtx);
          return;
        }
      }
    }

    if (!body) return;

    // ── Chiffre seul (1-7) → ouvrir la catégorie correspondante ──────────────
    // Seulement si le message est UNIQUEMENT un chiffre, sans préfixe ni autre texte
    if (/^\d+$/.test(body.trim())) {
      const soloNum = parseInt(body.trim(), 10);
      try {
        const menuFile = require('./commands/help');
        const catKeys  = menuFile.CAT_KEYS || ['cat_media','cat_ia','cat_jeux','cat_audio','cat_outils','cat_bot','cat_admin'];
        if (soloNum >= 1 && soloNum <= catKeys.length) {
          console.log(chalk.cyan(`[MENU-NUM] ${pushName} → catégorie #${soloNum} (${catKeys[soloNum - 1]})`));
          try { await sock.sendMessage(jid, { react: { text: '⚡', key: msg.key } }); } catch (e) {}
          await menuFile.sendCategoryMenu(sock, jid, msg, catKeys[soloNum - 1], prefix);
          return;
        }
      } catch (e) {
        console.log('[MENU-NUM] Erreur:', e.message);
      }
    }

    // ── Réponse liste (fallback via extractText si body = cat_xxx) ───────────
    if (body.startsWith('cat_')) {
      console.log(chalk.cyan('[LIST] Fallback catégorie:', body));
      try { await sock.sendMessage(jid, { react: { text: '⚡', key: msg.key } }); } catch (e) {}

      // Cartes spéciales (ping, uptime, owner)
      const SPECIAL_FB = { cat_ping: 'ping', cat_uptime: 'alive', cat_owner: 'owner', cat_pair: 'pair' };
      if (SPECIAL_FB[body]) {
        const sc = SPECIAL_FB[body];
        const se = COMMANDS[sc];
        if (se) {
          const scCtx = { sock, msg, jid, sender, isGroup, pushName, args: [], command: sc, prefix, body: `${prefix}${sc}`, antiBan, isOwner, isSudo, isOwnerContext: isOwner || isSudo || msg.key.fromMe, modeType: 'carousel',
            sendInteractiveMessage: (payload, quoted = msg) => sendInteractiveMessage(sock, jid, payload, quoted),
            sendButtons: (text, buttons, footer = '') => sendButtons(sock, jid, text, buttons, footer, msg),
            sendList: (text, btnText, sections, title = '', footer = '') => sendList(sock, jid, text, btnText, sections, title, footer, msg),
            sendQuickReply: (text, replies, imageUrl = null) => sendQuickReply(sock, jid, text, replies, imageUrl, msg),
          };
          await se.fn.execute(scCtx);
          return;
        }
      }

      const menuFile = require('./commands/help');
      await menuFile.sendCategoryMenu(sock, jid, msg, body, prefix);
      return;
    }

    // ── Messages SANS préfixe → Agent ou Chatbot ──────────────────────────────
    if (!startsWithAnyPrefix(body)) {
      // Installation de fichier .js par document (bug fix — handleFileInstall était importé mais jamais appelé)
      if (isOwner || isSudo) {
        await handleFileInstall(sock, jid, msg, sender, true);
      }

      // ZERO TRACE BRAIN — cerveau unifié (remplace agent + chatbot)
      const ctx = { sock, jid, msg, body, sender, isOwner, isSudo, antiBan, COMMANDS, prefix, pushName, isGroupAdmin, isGroup };
      const brainHandled = await brainCmd.handleMessage(ctx, COMMANDS);
      if (brainHandled) return;

      return;
    }

    // ── COMMANDE AVEC PRÉFIXE ─────────────────────────────────────────────────
    // Détecter quel prefix a été utilisé (perso ou global)
    const usedPrefix = resolveUsedPrefix(body);

    if (!startsWithAnyPrefix(body)) return;

    const parts  = body.slice(usedPrefix.length).trim().split(/\s+/);
    const cmdKey = parts.shift()?.toLowerCase();
    const args   = parts;
    if (!cmdKey) return;

    const cmdEntry = COMMANDS[cmdKey];
    if (!cmdEntry) {
      // ── Fallback : vérifier les commandes custom ───────────────────────────
      try {
        const customCmdLib = require('./commands/customcmd');
        const executed = await customCmdLib.execCustomCmd(sock, jid, msg, cmdKey, antiBan);
        if (executed) return;
      } catch (e) {}

      // Message humanisé avec suggestions
      const suggestions = Object.keys(COMMANDS)
        .filter(k => k.startsWith(cmdKey[0]) && k !== cmdKey)
        .slice(0, 3)
        .map(k => `\`${prefix}${k}\``).join(' · ');

      await antiBan.safeSend(sock, jid, {
        text:
          `❓ *Commande inconnue :* \`${prefix}${cmdKey}\`

` +
          (suggestions ? `💡 Tu voulais dire : ${suggestions} ?

` : '') +
          `📋 Tape \`${prefix}menu\` pour voir toutes les commandes.
` +
          `🔍 Ou \`${prefix}help [catégorie]\` pour une aide précise.

` +
          `> ⚡ _ZERO TRACE BOT v5.0_`,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    // ── Message de bienvenue — seulement à la 1ère vraie commande ──────────
    if (!isGroup && !msg.key.fromMe) {
      welcomeUser.sendWelcomeIfNew(sock, jid, sender, pushName, prefix, antiBan, zts).catch(() => {});
    }

    // ── Tracking stats d'usage ────────────────────────────────────────────
    usageStats.trackCommand(sender, cmdKey);

    // ── RATE LIMIT (anti-spam commandes) ─────────────────────────────────────
    const rl = rateLimiter.checkRateLimit(sender, cmdKey, isOwner, isSudo);
    if (!rl.allowed) {
      if (rl.firstOffense) {
        // Envoyer le message de blocage UNE SEULE FOIS par fenêtre
        await antiBan.safeSend(sock, jid, {
          text: rateLimiter.buildBlockMessage(rl.resetIn, cmdKey, prefix),
        }, { msgOptions: { quoted: msg } });
      }
      // Ignorer silencieusement les commandes suivantes de cette fenêtre
      return;
    }

    // ── VÉRIFICATION PERMISSIONS ─────────────────────────────────────────────
    // Commandes 'owner' : réservées à l'owner et aux sudos
    if (cmdEntry.cat === 'owner' && !isOwner && !isSudo) {
      await antiBan.safeSend(sock, jid, {
        text: zts.randErr(zts.OWNER_ERRORS) + `\n\nCommande : \`${prefix}${cmdKey}\``,
      }, { msgOptions: { quoted: msg } });
      return;
    }
    // Commandes 'admin' en groupe : réservées aux admins du groupe, owner et sudos
    if (cmdEntry.cat === 'admin' && isGroup && !isOwner && !isSudo && !isGroupAdmin) {
      await antiBan.safeSend(sock, jid, {
        text: `🔒 La commande *${prefix}${cmdKey}* est réservée aux administrateurs du groupe.\n\n> ⚡ _ZERO TRACE BOT v5.0_`,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    logger.cmd(`${pushName} → .${cmdKey} [${rl.remaining} restantes]`);
    console.log(chalk.cyan(`[CMD] ${pushName} → .${cmdKey}`) + chalk.gray(` [RL: ${rl.remaining}/${rateLimiter.MAX_CMDS - 1} restantes]`));
    try { await sock.sendMessage(jid, { react: { text: settings.reaction || '⚡', key: msg.key } }); } catch (e) {}

    const ctx = {
      sock, msg, jid, sender, isGroup, pushName,
      args, command: cmdKey, prefix, body,
      antiBan, isOwner, isSudo, isGroupAdmin,
      isOwnerContext: isOwner || isSudo || msg.key.fromMe,
      modeType: 'prefix',
      COMMANDS,
      sendInteractiveMessage: (payload, quoted = msg) => sendInteractiveMessage(sock, jid, payload, quoted),
      sendButtons: (text, buttons, footer = '') => sendButtons(sock, jid, text, buttons, footer, msg),
      sendList: (text, btnText, sections, title = '', footer = '') => sendList(sock, jid, text, btnText, sections, title, footer, msg),
      sendQuickReply: (text, replies, imageUrl = null) => sendQuickReply(sock, jid, text, replies, imageUrl, msg),
    };

    await cmdEntry.fn.execute(ctx);
    await supremacy.sendSupremacy(sock, jid, cmdKey, antiBan, cmdEntry.cat);

    // 🔊 Son owner : joué UNIQUEMENT sur .owner / .proprio
    if ((cmdKey === 'owner' || cmdKey === 'proprio')) {
      try {
        const ownerSoundPath = path.join(__dirname, 'assets', 'owner_sound.mp3');
        if (fs.existsSync(ownerSoundPath)) {
          const audioBuffer = fs.readFileSync(ownerSoundPath);
          await sock.sendMessage(jid, {
            audio: audioBuffer,
            mimetype: 'audio/mpeg',
            ptt: false,
          });
        }
      } catch (e) {
        console.error('[OWNER SOUND] Erreur envoi son:', e.message);
      }
    }

  } catch (err) {
    logger.error(err.message);
    console.error(chalk.red('[HANDLER] Erreur:'), err.message);
    try {
      await sock.sendMessage(msg.key.remoteJid, {
        text: `⚠️ Erreur : ${err.message}`,
      }, { quoted: msg });
    } catch (e) {}
  }
}

// ── Antidelete cache ──────────────────────────────────────────────────────────
const deletedMsgCache = new Map();
function cacheMessage(jid, id, content) {
  if (!deletedMsgCache.has(jid)) deletedMsgCache.set(jid, new Map());
  deletedMsgCache.get(jid).set(id, { content, time: Date.now() });
  setTimeout(() => { deletedMsgCache.get(jid)?.delete(id); }, 30 * 60 * 1000);
}
async function handleDelete(sock, jid, deletedId, antiBanLib) {
  if (!gs.isEnabled('antidelete', jid)) return;
  const cache = deletedMsgCache.get(jid);
  if (!cache?.has(deletedId)) return;
  const { content } = cache.get(deletedId);
  await antiBanLib.safeSend(sock, jid, {
    text: `🗑️ *MESSAGE SUPPRIMÉ*\n\n${content}\n\n> ZERO TRACE BOT v5.0`,
  });
}

module.exports = { messageHandler, cacheMessage, handleDelete, checkAntiRaid };
