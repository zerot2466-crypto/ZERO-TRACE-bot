// ═══════════════════════════════════════
// ZERO TRACE — Command Core
// ═══════════════════════════════════════

// Historique de conversation pour le mode chatbot — en mémoire, par discussion, plafonné
const chatbotHistory = new Map(); // chatJid -> [{role, content}, ...]
const KAIZ_API_KEY = process.env.KAIZ_API_KEY || '';
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || '';
const CHATBOT_HISTORY_LIMIT = 10;

function pushChatbotHistory(chatJid, role, content) {
    if (!chatbotHistory.has(chatJid)) chatbotHistory.set(chatJid, []);
    const hist = chatbotHistory.get(chatJid);
    hist.push({ role, content });
    while (hist.length > CHATBOT_HISTORY_LIMIT) hist.shift();
}

const {
    downloadMediaMessage
} = require("@trashcore/baileys");

//================= { BAILEYS MODULE } =================\\
const {
    makeWASocket,
    downloadContentFromMessage,
    emitGroupParticipantsUpdate,
    emitGroupUpdate,
    generateWAMessageContent,
    generateWAMessage,
    makeInMemoryStore,
    prepareWAMessageMedia,
    generateWAMessageFromContent,
    MediaType,
    areJidsSameUser,
    WAMessageStatus,
    downloadAndSaveMediaMessage,
    AuthenticationState,
    GroupMetadata,
    initInMemoryKeyStore,
    getContentType,
    MiscMessageGenerationOptions,
    useSingleFileAuthState,
    BufferJSON,
    WAMessageProto,
    MessageOptions,
    WAFlag,
    WANode,
    WAMetric,
    ChatModification,
    MessageTypeProto,
    WALocationMessage,
    WAContextInfo,
    proto,
    WAGroupMetadata,
    ProxyAgent,
    waChatKey,
    MimetypeMap,
    MediaPathMap,
    WAContactMessage,
    WAContactsArrayMessage,
    WAGroupInviteMessage,
    WATextMessage,
    WAMessageContent,
    WAMessage,
    BaileysError,
    WA_MESSAGE_STATUS_TYPE,
    MediaconnInfo,
    URL_REGEX,
    WAUrlInfo,
    WA_DEFAULT_EPHEMERAL,
    WAMediaUpload,
    mentionedJid,
    processTime,
    Browser,
    MessageType,
    Presence,
    WA_MESSAGE_STUB_TYPES,
    Mimetype,
    relayWAMessage,
    Browsers,
    GroupSettingChange,
    WASocket,
    getStream,
    WAProto,
    isBaileys,
    AnyMessageContent,
    fetchLatestBaileysVersion,
    useMultiFileAuthState,
    templateMessage
} = require('@trashcore/baileys');

const { getYTAudioCompressed, getYTVideoCompressed, getThumb } = require('./youtubeDownloader');
//================== { MODULE } ===============================
const { smsg } = require('./lib/serialize.js');
const fs = require('fs-extra');
const api = require('api-dylux');
const axios = require('axios');
const path = require('path');
const fetch = require('node-fetch')
const FormData = require("form-data");
const { tmpdir } = require('os');
const chalk = require('chalk');
const googleTTS = require('google-tts-api');
const moment = require('moment-timezone');
const pino = require('pino');
const weather = require('weather-js');
const ytdl = require("@vreden/youtube_scraper");
const youtubedl = require("youtube-dl-exec");
const yts = require("yt-search");
const { igdl } = require('btch-downloader');
const { Sticker, StickerTypes } = require('wa-sticker-formatter');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
ffmpeg.setFfmpegPath(ffmpegPath);

// Télécharge une vidéo depuis une URL et en extrait l'audio (MP3) — utilisé pour les boutons "Audio" (Instagram/Twitter)
async function extractAudioFromVideoUrl(videoUrl) {
    const { tmpdir } = require('os');
    const { randomUUID } = require('crypto');
    const tempDir = path.join(tmpdir(), 'zt-audio-extract');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

    const id = randomUUID();
    const videoPath = path.join(tempDir, `${id}.mp4`);
    const audioPath = path.join(tempDir, `${id}.mp3`);

    const videoResp = await axios({ method: 'GET', url: videoUrl, responseType: 'arraybuffer', timeout: 60000 });
    fs.writeFileSync(videoPath, Buffer.from(videoResp.data));

    await new Promise((resolve, reject) => {
        ffmpeg(videoPath)
            .noVideo()
            .audioCodec('libmp3lame')
            .audioBitrate('128k')
            .save(audioPath)
            .on('end', resolve)
            .on('error', reject);
    });

    const audioBuffer = fs.readFileSync(audioPath);
    fs.unlink(videoPath, () => {});
    fs.unlink(audioPath, () => {});
    return audioBuffer;
}
const { Writable } = require('stream');
const config = require('./config.js');
const { loadSettings, saveSettings } = require('./sessionSettings.js');
const startTime = Date.now();
const tempDir = './temp';
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
}

const ModerationFeatures = require('./moderation');

let moderation = null;

const { handleWCG, handleJoinWCG, handleWCGMessage, handleEndWCG } = require('./system/wcg');

const REMOVE_BG_API_KEY = "EjbUZznRavViVPC9MMMX1Phr";
const STICKER_PACK_DIR = './stickerpacks';
const PACK_DB = `${STICKER_PACK_DIR}/packs.json`;

if (!fs.existsSync(STICKER_PACK_DIR)) fs.mkdirSync(STICKER_PACK_DIR);
if (!fs.existsSync(PACK_DB)) fs.writeFileSync(PACK_DB, JSON.stringify({}, null, 2));

// Track active pack per user
const activePack = {};



// UTILITIES AND SHIIIIIIII
const {
  isUrl, 
  fetchJson, 
  getBuffer,
  uploadImage, 
  formatBytes, 
  formatRuntime, 
  ephoto, 
  getGroupAdmins, 
  pinterest, 
  sendFile,
  getFile,
  getWeather, 
  findLyrics
} = require('./lib/function.js');

const { 
  botName, 
  ownerName, 
  menuImages, 
  ownerNumbers, 
  prefix: configPrefix, 
  hosting, 
  mess, 
  auto, 
  packname, 
  author 
} = config;

const prefixFile = './system/prefix.json'
if (fs.existsSync(prefixFile)) {
    const saved = JSON.parse(fs.readFileSync(prefixFile))
    if (saved.prefix) config.prefix = saved.prefix
}

// uptime formatting helper
function formatUptime(ms) {
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    let parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (seconds > 0) parts.push(`${seconds}s`);
    return parts.join(' ') || '0s';
}


function getMentionedUser(m) {

    if (m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length) {
        return m.message.extendedTextMessage.contextInfo.mentionedJid[0];
    }
    // Check for quoted message
    if (m.quoted?.sender) {
        return m.quoted.sender;
    }
    return null;
}   

function parseDuration(text) {
    const match = text.match(/^(\d+)(s|m|h|d)$/i)
    if (!match) return null

    const value = Number(match[1])
    const unit = match[2].toLowerCase()

    const map = {
        s: 1000,
        m: 60 * 1000,
        h: 60 * 60 * 1000,
        d: 24 * 60 * 60 * 1000
    }

    return value * map[unit]
}


function isDlvoEmoji(m) {
    const triggers = ['🥹', '😘', '☺️', '❤', '🤍', '😍', '🥰', '🤗', '🫣', '😑']
    return triggers.includes((m.body || '').trim())
}

const totalfeature= () =>{
    var mytext = fs.readFileSync("./commands.js").toString()
    var numUpper = (mytext.match(/case '/g) || []).length
    return numUpper
}

//================= { BASE } =========================================
module.exports = sock = async (sock, rawMessage, chatUpdate, store) =>
{
try {

        if (!moderation && sock) {
            moderation = new ModerationFeatures(sock);
        }
        
const m = await smsg(sock, rawMessage, store);
if (!m) return m;

        // --- Standalone Variables (for convenience) ---
const from = m.from
const sender = m.sender
const pushname = m.pushName || "User"
const isGroup = m.isGroup
const body = m.body || ''
const botNumber = sock.decodeJid(sock.user.id)
const toLid = (jid) => {
    if (!jid) return '';
    // This cleans the JID by removing the ':1' or ':2' suffix often found in Baileys
    return jid.split(':')[0].split('@')[0] + '@s.whatsapp.net';
};

// ================= SESSION SETTINGS =================
const userKey = botNumber.split('@')[0]; // unique per connected WhatsApp session
const settings = loadSettings(userKey);

//  Universal text extractor (works for all message types)
const bodyText =
    m.message?.conversation ||
    m.message?.extendedTextMessage?.text ||
    m.message?.imageMessage?.caption ||
    m.message?.videoMessage?.caption ||
    '';
    
    
// Detect prefix
let prefix = config.prefix

let isCmd = body.startsWith(prefix)

let command = isCmd
    ? body.slice(prefix.length).trim().split(/\s+/).shift().toLowerCase()
    : ''
let args = body.trim().split(/\s+/).slice(1)
let text = args.join(" ")

const commandReactions = {
  "add": "\u2795",
  "addcode": "\u2795",
  "addpack": "\ud83d\udce6",
  "addprem": "\u2b50",
  "addsticker": "\u2795",
  "addsudo": "\ud83d\udd11",
  "agent": "\ud83e\udd16",
  "ai": "\ud83e\udd16",
  "alive": "\ud83d\udc93",
  "allow": "\u2705",
  "alwaysonline": "\ud83d\udfe2",
  "animedance": "\ud83d\udc83",
  "animekill": "\ud83d\udc80",
  "animekiss": "\ud83d\udc8b",
  "animeslap": "\ud83d\udc4b",
  "animesmile": "\ud83d\ude0a",
  "animeyeet": "\ud83d\ude80",
  "announcements": "\ud83d\udce2",
  "antibadword": "\ud83d\udeab",
  "antibadwords": "\ud83d\udeab",
  "antibot": "\ud83d\udeab",
  "antidemote": "\ud83d\udeab",
  "antiflood": "\ud83d\udeab",
  "antigm": "\ud83d\udce2",
  "antigroupmention": "\ud83d\udce2",
  "antilink": "\ud83d\udd17",
  "antipromote": "\ud83d\udeab",
  "antispam": "\ud83d\udeab",
  "apk": "\ud83d\udcf1",
  "app": "\ud83d\udcf1",
  "approveall": "\u2705",
  "appsearch": "\ud83d\udcf1",
  "ask": "\ud83e\udd16",
  "autoreact": "\ud83e\udd16",
  "autoread": "\ud83d\udcd6",
  "autorecord": "\ud83c\udf99\ufe0f",
  "autostatusview": "\ud83d\udc41\ufe0f",
  "autotyping": "\u2328\ufe0f",
  "bass": "\ud83d\udd0a",
  "blacklist": "\u26d4",
  "blague": "\ud83d\ude02",
  "block": "\ud83d\udeab",
  "blown": "\ud83d\udd0a",
  "cancelkick": "\ud83d\udeab",
  "catfact": "\ud83d\udc31",
  "chatbot": "\ud83d\udcac",
  "checkidch": "\ud83c\udd94",
  "clear": "\ud83e\uddf9",
  "closegc": "\ud83d\udd12",
  "closetime": "\ud83d\udd50",
  "cmd": "\ud83d\udcd6",
  "codegen": "\ud83d\udcbb",
  "cry": "\ud83d\ude22",
  "dare": "\ud83d\udd25",
  "deep": "\ud83d\udd0a",
  "del": "\ud83d\uddd1\ufe0f",
  "delallowed": "\ud83d\uddd1\ufe0f",
  "delcode": "\ud83d\udd22",
  "delete": "\ud83d\uddd1\ufe0f",
  "deljunk": "\ud83d\uddd1\ufe0f",
  "delpack": "\ud83d\uddd1\ufe0f",
  "delppgroup": "\ud83d\uddd1\ufe0f",
  "delprem": "\u2b50",
  "delsticker": "\u2796",
  "delstickercmd": "\u2699\ufe0f",
  "delsudo": "\ud83d\udd11",
  "demote": "\u2b07\ufe0f",
  "device": "\ud83d\udcf1",
  "disapproveall": "\u274c",
  "disk": "\ud83d\udcbd",
  "dlvo": "\ud83d\udc41\ufe0f",
  "earrape": "\ud83d\udd0a",
  "editsettings": "\u2699\ufe0f",
  "emix": "\ud83c\udfad",
  "emojimix": "\ud83c\udfad",
  "endwcg": "\ud83c\udfc1",
  "ephotomenu": "\ud83c\udfa8",
  "everyone": "\ud83d\udce2",
  "facebook": "\ud83d\udcd8",
  "flux": "\u26a1",
  "forget": "\ud83e\uddf9",
  "gcaddprivacy": "\ud83d\udd13",
  "gcbroadcast": "\ud83d\udce2",
  "gemini-vision": "\ud83d\udc41\ufe0f",
  "gen": "\ud83c\udfb2",
  "getgrouppp": "\ud83d\uddbc\ufe0f",
  "getpp": "\ud83d\uddbc\ufe0f",
  "gimage": "\ud83d\uddbc\ufe0f",
  "gitclone": "\ud83d\udce6",
  "github": "\ud83d\udcbb",
  "goodbye": "\ud83d\udc4b",
  "google": "\ud83d\udd0d",
  "groupid": "\ud83c\udd94",
  "grouplink": "\ud83d\udd17",
  "groupvcf": "\ud83d\udcc7",
  "gtts": "\ud83d\udd0a",
  "help": "\ud83d\udcd6",
  "hidetag": "\ud83d\udd15",
  "hostip": "\ud83c\udf10",
  "hug": "\ud83d\udc4b",
  "idch": "\ud83c\udd94",
  "ig": "\ud83d\udcf7",
  "igdl": "\ud83d\udcf7",
  "image": "\ud83d\uddbc\ufe0f",
  "imdb": "\ud83c\udfac",
  "imgur": "\ud83d\uddbc\ufe0f",
  "instagram": "\ud83d\udcf7",
  "insult": "\ud83d\ude08",
  "invite": "\u2709\ufe0f",
  "jid": "\ud83c\udd94",
  "join": "\u2795",
  "joinwcg": "\ud83c\udfae",
  "kick": "\ud83d\udc62",
  "kickall": "\ud83d\udc62",
  "kickinactive": "\ud83d\udc62",
  "kill": "\ud83d\udc80",
  "kiss": "\ud83d\udc8b",
  "lastseen": "\ud83d\udc41\ufe0f",
  "leave": "\ud83d\udc4b",
  "listactive": "\ud83d\udfe2",
  "listadmin": "\ud83d\udccb",
  "listai": "\ud83d\udccb",
  "listallowed": "\ud83d\udccb",
  "listbadword": "\ud83d\udccb",
  "listblocked": "\ud83d\udccb",
  "listcode": "\ud83d\udccb",
  "listfun": "\ud83d\udccb",
  "listgc": "\ud83d\udccb",
  "listignorelist": "\ud83d\udccb",
  "listinactive": "\u26aa",
  "listmedia": "\ud83d\udccb",
  "listonline": "\ud83d\udccb",
  "listpacks": "\ud83d\udccb",
  "listrequests": "\ud83d\udccb",
  "listsecurity": "\ud83d\udccb",
  "listsudo": "\ud83d\udccb",
  "lyric": "\ud83c\udfa4",
  "lyric2": "\ud83c\udfa4",
  "lyrics": "\ud83c\udfa4",
  "lyrics2": "\ud83c\udfa4",
  "mediafire": "\ud83d\udce6",
  "mediatag": "\ud83d\udccc",
  "megumin": "\ud83d\udca5",
  "meme": "\ud83d\ude02",
  "menu": "\ud83d\udcd6",
  "mich": "\ud83d\udcd6",
  "mine": "\ud83d\udccd",
  "mode": "\u2699\ufe0f",
  "modestatus": "\u2699\ufe0f",
  "modsettings": "\u2699\ufe0f",
  "modstatus": "\u2699\ufe0f",
  "mute": "\ud83d\udd07",
  "mute-user": "\ud83d\udd07",
  "mutee": "\ud83d\udd07",
  "neko": "\ud83d\udc3e",
  "online": "\ud83d\udfe2",
  "opengc": "\ud83d\udd13",
  "opentime": "\ud83d\udd50",
  "owner": "\ud83d\udc51",
  "pay": "\ud83d\udcb0",
  "payme": "\ud83d\udcb0",
  "pickupline": "\ud83d\ude0f",
  "pinchat": "\ud83d\udccc",
  "ping": "\ud83c\udfd3",
  "pinterest": "\ud83d\udccc",
  "play": "\u25b6\ufe0f",
  "play2": "\u25b6\ufe0f",
  "poll": "\ud83d\udcca",
  "ppprivacy": "\ud83d\udd13",
  "promote": "\u2b06\ufe0f",
  "public": "\ud83c\udf0d",
  "quote": "\ud83d\udcac",
  "react": "\ud83c\udfad",
  "readmore": "\ud83d\udcd6",
  "readreceipts": "\u2705",
  "remove": "\u2796",
  "removebg": "\ud83d\uddbc\ufe0f",
  "repo": "\ud83d\udce6",
  "repository": "\ud83d\udce6",
  "resetlink": "\ud83d\udd04",
  "resetwarns": "\ud83d\udd04",
  "restart": "\ud83d\udd04",
  "reverse": "\ud83d\udd0a",
  "riddle": "\ud83e\udde9",
  "robot": "\ud83d\udd0a",
  "runtime": "\u23f1\ufe0f",
  "s": "\u2754",
  "satorugojo": "\ud83d\udc41\ufe0f",
  "savestatus": "\ud83d\udcbe",
  "say": "\ud83c\udfa4",
  "screenshot": "\ud83d\udcf8",
  "search": "\ud83d\udd0d",
  "self": "\ud83d\udd12",
  "sendpack": "\ud83d\udce4",
  "setbio": "\u270f\ufe0f",
  "setbotpp": "\ud83d\uddbc\ufe0f",
  "setdesc": "\u270f\ufe0f",
  "setgroupname": "\u270f\ufe0f",
  "setpp": "\ud83d\uddbc\ufe0f",
  "setppgroup": "\ud83d\uddbc\ufe0f",
  "setprefix": "\u2699\ufe0f",
  "setspider": "\ud83d\udd77\ufe0f",
  "setstickercmd": "\u2699\ufe0f",
  "shinobu": "\ud83d\udc95",
  "ship": "\ud83d\udc98",
  "shortlink": "\ud83d\udd17",
  "shorturl": "\ud83d\udd17",
  "simi": "\ud83d\udde3\ufe0f",
  "slap": "\ud83d\udc4b",
  "spider": "\ud83d\udd77\ufe0f",
  "spotify": "\ud83c\udfa7",
  "ssweb": "\ud83d\udcf8",
  "steal": "\ud83d\udd75\ufe0f",
  "sticker": "\ud83c\udf1f",
  "stiker": "\ud83c\udf1f",
  "style": "\ud83c\udfa8",
  "sudo": "\ud83d\udd11",
  "sukuna": "\ud83d\udc79",
  "tag": "\ud83d\udccc",
  "tagadmin": "\ud83d\udc6e",
  "tagall": "\ud83d\udce2",
  "take": "\ud83d\udce5",
  "testapi": "\ud83e\uddea",
  "tiktok": "\ud83c\udfb5",
  "tiktokmp3": "\ud83c\udfb6",
  "toaudio": "\ud83c\udfb5",
  "toimage": "\ud83d\uddbc\ufe0f",
  "tomp3": "\ud83c\udfb5",
  "toptt": "\ud83c\udf99\ufe0f",
  "tostatus": "\ud83d\udcbe",
  "totalmembers": "\ud83d\udc65",
  "tourl": "\ud83d\udd17",
  "tovideo": "\ud83c\udfa5",
  "toviewonce": "\ud83d\udc41\ufe0f",
  "tovoicenote": "\ud83c\udf99\ufe0f",
  "trivia": "\ud83e\udde0",
  "truth": "\ud83c\udfaf",
  "tts": "\ud83d\udd0a",
  "tw": "\ud83d\udc26",
  "twitter": "\ud83d\udc26",
  "unblock": "\u2705",
  "unblockall": "\u2705",
  "unmute": "\ud83d\udd0a",
  "unmute-user": "\ud83d\udd0a",
  "unmutee": "\ud83d\udd0a",
  "unpinchat": "\ud83d\udccc",
  "uptime": "\u23f1\ufe0f",
  "userid": "\ud83c\udd94",
  "vcf": "\ud83d\udcc7",
  "video": "\ud83c\udfac",
  "vision": "\ud83d\udc41\ufe0f",
  "voice": "\ud83c\udf99\ufe0f",
  "vv": "\ud83d\udc41\ufe0f",
  "vv2": "\ud83d\udc41\ufe0f",
  "waifu": "\ud83d\udc95",
  "warn": "\u26a0\ufe0f",
  "wcg": "\ud83c\udfae",
  "weather": "\u2601\ufe0f",
  "welcome": "\ud83d\udc4b",
  "whois": "\ud83d\udd0d",
  "wm": "\ud83d\udca7",
  "xnxx": "\u26d4",
  "xnxxdl": "\u26d4",
  "yeet": "\ud83d\ude80",
  "yt": "\ud83c\udfac",
  "ytmp3": "\ud83c\udfb5",
  "ytmp4": "\ud83c\udfac",
  "ytsearch": "\ud83d\udd0d",
  "zero": "\u26a1"
};


// ───────────────────────────
// 🤖 CHATBOT — réponse auto contextuelle (si activé pour cette discussion)
// ───────────────────────────
if (!isCmd && !m.key.fromMe && body && body.trim().length > 0) {
    const chatSettings = moderation.getGroupSettings(from);
    const looksLikeQuestion = /\?\s*$/.test(body.trim()) || /^(comment|pourquoi|quoi|qui|où|quand|est-ce que|peux-tu|pouvez-vous|c'est quoi)/i.test(body.trim());
    const mentionedInMsg = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || m.mentionedJid || [];
    const botNumberOnly = botNumber.split('@')[0];
    const isTaggedOrCalled = mentionedInMsg.some(jid => jid.split('@')[0] === botNumberOnly) || /\bzero\b/i.test(body);

    if (isGroup && (chatSettings?.chatbot || settings.autopilot)) {
        console.log(`[CHATBOT DEBUG] groupe=${from} | chatbotOn=${!!chatSettings?.chatbot} | autopilot=${!!settings.autopilot} | mentionsBrutes=${JSON.stringify(mentionedInMsg)} | botNumber=${botNumberOnly} | tagué=${isTaggedOrCalled}`);
    }

    if ((chatSettings?.chatbot || settings.autopilot) && (!isGroup || isTaggedOrCalled)) {
        (async () => {
            try {
                const apiKey = process.env.HEAVSTAL_API_KEY;
                if (!apiKey) return;

                if (settings.autotyping?.enabled !== false) {
                    await sock.sendPresenceUpdate('composing', from).catch(() => {});
                }

                const history = chatbotHistory.get(from) || [];
                const historyText = history.map(h => `${h.role === 'user' ? m.pushName : 'ZERO'}: ${h.content}`).join('\n');

                const chatPersona = `Tu es ZERO, l'entité numérique qui anime ce bot WhatsApp, créée par Shadow Senku. Tu discutes naturellement, comme une vraie personne dans une conversation WhatsApp — phrases courtes, ton direct, un peu d'humour si approprié, jamais robotique ou formel. Tiens compte du fil de la conversation ci-dessous pour rester cohérente avec ce qui a déjà été dit.\n\nConversation récente :\n${historyText}\n\nRéponds au dernier message de ${m.pushName} en restant dans le personnage.`;

                const response = await fetch('https://heavstal.com.ng/api/v1/jeden', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
                    body: JSON.stringify({ prompt: body, persona: chatPersona })
                });
                const res = await response.json();
                if (res.status !== 'success' || !res.data?.response) return;

                const replyText = res.data.response;
                pushChatbotHistory(from, 'user', body);
                pushChatbotHistory(from, 'assistant', replyText);

                // Délai naturel proportionnel à la longueur (évite le signal "réponse instantanée" typique d'un bot)
                const naturalDelay = Math.min(4000, 400 + replyText.length * 25 + Math.random() * 800);
                await new Promise(r => setTimeout(r, naturalDelay));

                if (chatSettings?.voiceReplies) {
                    if (settings.autorecord?.enabled !== false) {
                        await sock.sendPresenceUpdate('recording', from).catch(() => {});
                    }
                    const audioUrl = googleTTS.getAudioUrl(replyText, { lang: "fr", slow: false, host: "https://translate.google.com" });
                    await sock.sendMessage(from, { audio: { url: audioUrl }, mimetype: 'audio/mp4', ptt: true }, { quoted: m });
                } else {
                    await sock.sendMessage(from, { text: replyText }, { quoted: m });
                }
                await sock.sendPresenceUpdate('paused', from).catch(() => {});
            } catch (e) {
                console.error("Erreur reponse auto chatbot :", e.message);
            }
        })();
    } else if (chatSettings?.agentMode && looksLikeQuestion) {
        (async () => {
            try {
                const apiKey = process.env.HEAVSTAL_API_KEY;
                if (!apiKey) return;

                if (settings.autotyping?.enabled !== false) {
                    await sock.sendPresenceUpdate('composing', from).catch(() => {});
                }

                const agentPersona = `Tu es ZERO, l'assistant du bot WhatsApp créé par Shadow Senku. Tu interviens uniquement quand quelqu'un pose une vraie question dans le groupe — réponds de façon utile, brève et directe, sans détour. Si la question ne te semble pas claire ou pas pour toi, réponds simplement "🤔" et rien d'autre.`;

                const response = await fetch('https://heavstal.com.ng/api/v1/jeden', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
                    body: JSON.stringify({ prompt: body, persona: agentPersona })
                });
                const res = await response.json();
                if (res.status !== 'success' || !res.data?.response) return;
                if (res.data.response.trim() === '🤔') { await sock.sendPresenceUpdate('paused', from).catch(() => {}); return; }

                await sock.sendMessage(from, { text: res.data.response }, { quoted: m });
                await sock.sendPresenceUpdate('paused', from).catch(() => {});
            } catch (e) {
                console.error("Erreur reponse auto agent :", e.message);
            }
        })();
    }
}

// ───────────────────────────
// 🧩 STICKER COMMAND OVERRIDE
// ───────────────────────────
const stickerCmdFile = './system/stickerCmds.json'
const stickerCmds = fs.existsSync(stickerCmdFile)
    ? JSON.parse(fs.readFileSync(stickerCmdFile))
    : {}

if (m.mtype === 'stickerMessage') {
    const stickerHash = m.msg?.fileSha256
        ? m.msg.fileSha256.toString('base64')
        : null

    if (stickerHash && stickerCmds[stickerHash]) {
        const stickerCommand = stickerCmds[stickerHash].trim()

        command = stickerCommand.split(/\s+/)[0].toLowerCase()
        args = stickerCommand.split(/\s+/).slice(1)
        text = args.join(" ")

        // treat sticker as a command
        isCmd = true
    }
}

// ===== ACTIVE USER TRACKER =====
const activeDB = path.join(__dirname, "./system/active.json");
if (!fs.existsSync(activeDB)) fs.writeFileSync(activeDB, JSON.stringify({}));

function saveActive(group, user) {
  const data = JSON.parse(fs.readFileSync(activeDB));
  if (!data[group]) data[group] = {};
  data[group][user] = (data[group][user] || 0) + 1;
  fs.writeFileSync(activeDB, JSON.stringify(data, null, 2));
}

// Call tracker
if (m.key.remoteJid.endsWith("@g.us") && !m.key.fromMe) {
  saveActive(m.key.remoteJid, m.key.participant);
}
//================= { USER } ====================================

// isCreator est basé sur les numéros propriétaire définis dans .env (config.ownerNumbers),
// jamais sur des numéros codés en dur dans le code.
const devNumbers = ownerNumbers;

const sudoUsers = JSON.parse(fs.readFileSync('./system/owner.json', 'utf-8') || '[]');
const premiumUsers = JSON.parse(fs.readFileSync('./system/premium.json', 'utf-8') || '[]');

const normalize = (num) => num.replace(/[^0-9]/g, '') + '@s.whatsapp.net';

const isCreator = devNumbers.map(normalize).includes(m.sender);
const isOwner   = normalize(botNumber) === m.sender || isCreator;
const isSudo    = sudoUsers.map(normalize).includes(m.sender);
const isPremium = premiumUsers.map(normalize).includes(m.sender);


const isAdminUser = isOwner || isSudo || isCreator;

// Réaction automatique et thématique par commande (asynchrone, ne bloque pas le traitement)
// Respecte le mode privé : pas de réaction si non-owner et bot en mode privé
if (isCmd && command && (settings.public || isAdminUser)) {
    const reactionEmoji = commandReactions[command] || '⚡';
    sock.sendMessage(from, { react: { text: reactionEmoji, key: m.key } }).catch(() => {});
}


        // --- Activity Tracking ---
const activity = JSON.parse(fs.readFileSync('./system/activity.json') || '{}');
        if (isGroup && m.sender) {
            activity[m.sender] = activity[m.sender] || { lastActive: 0, messages: 0 };
            activity[m.sender].lastActive = Date.now();
            activity[m.sender].messages += 1;
            fs.writeFileSync('./system/activity.json', JSON.stringify(activity, null, 2));
        }

/*const settings = JSON.parse(fs.readFileSync('./system/settings.json') || '{}');
        if (!settings.isPublic && !isOwner) return;*/

 
//================= { GROUP ADMIN CHECK USING LID } ======================

let isAdmin = false;
let isBotAdmin = false;
let isGroupAdmins = false;
let groupMetadata = null;
const groupName = groupMetadata?.subject || "";
const participants = groupMetadata?.participants || [];
if (isGroup) {
    groupMetadata = await sock.groupMetadata(from).catch(() => null);
    const participants = groupMetadata?.participants || [];

    //  Prepare Bot IDs for matching
    const botId = sock.user?.id || '';
    const botLid = sock.user?.lid || ''; // New Baileys LID
    const botRaw = botId.split(':')[0].split('@')[0];
    const botLidRaw = botLid ? botLid.split(':')[0].split('@')[0] : null;

    // Prepare Sender IDs for matching
    const senderRaw = sender.split(':')[0].split('@')[0];

    // Loop through participants to check admin status
    participants.forEach(p => {
        const pIdRaw = p.id.split('@')[0].split(':')[0];
        const pLidRaw = p.lid ? p.lid.split('@')[0].split(':')[0] : null;
        const pIsAdmin = p.admin === 'admin' || p.admin === 'superadmin';

        if (pIsAdmin) {
            // Check if this participant is the BOT
            if (
                pIdRaw === botRaw || 
                (botLidRaw && pLidRaw === botLidRaw) || 
                (botLidRaw && pIdRaw === botLidRaw) ||
                (pLidRaw && pLidRaw === botRaw)
            ) {
                isBotAdmin = true;
            }

            // Check if this participant is the SENDER
            if (
                pIdRaw === senderRaw || 
                (pLidRaw && pLidRaw === senderRaw)
            ) {
                isAdmin = true;
            }
        }
    });
    
    if (isCreator || isAdminUser) isAdmin = true;
}


        if (m.isGroup && global.mutedUsers && global.mutedUsers[sender]) {
            await sock.sendMessage(from, { delete: m.key });
            return; // Stop processing this message
        }


// kick all function
async function executeKickAll(sock, groupId, isBotAdmin) {
    const boxReply = (text) => sock.sendMessage(groupId, {
        text: `╭─❏ *ZERO TRACE*\n│\n│ ${text}\n│\n╰─❏\n› Aucune trace, aucune limite.`
    });
    try {
        // Get group metadata
        const groupMetadata = await sock.groupMetadata(groupId);
        
        // Get bot's ID
        const botId = sock.user.id.split(':')[0] + '@s.whatsapp.net';
        
        
        const admins = groupMetadata.participants
            .filter(p => p.admin === 'admin' || p.admin === 'superadmin')
            .map(p => p.id);
        
        const membersToKick = groupMetadata.participants
            .filter(p => !admins.includes(p.id) && p.id !== botId)
            .map(p => p.id);
        
        if (membersToKick.length === 0) {
            await boxReply('ℹ️ No non-admin members to kick!');
            return;
        }
        
        // Send progress message
        await boxReply(`🔄 Kicking ${membersToKick.length} members from the group...\nPlease wait, this may take a while.`);
        
        let kicked = 0;
        let failed = 0;
        
        // Kick members in batches to avoid rate limiting
        const batchSize = 5;
        for (let i = 0; i < membersToKick.length; i += batchSize) {
            const batch = membersToKick.slice(i, i + batchSize);
            
            for (const member of batch) {
                try {
                    await sock.groupParticipantsUpdate(groupId, [member], 'remove');
                    kicked++;
                    // Small delay between kicks to avoid rate limits
                    await new Promise(resolve => setTimeout(resolve, 1000));
                } catch (err) {
                    failed++;
                    console.log(`Failed to kick ${member}: ${err.message}`);
                }
            }
            
            // Delay between batches
            if (i + batchSize < membersToKick.length) {
                await new Promise(resolve => setTimeout(resolve, 3000));
            }
        }
        
        // Send final report
        await boxReply(
            `✅ *KICKALL COMPLETED*\n\n` +
            `👥 Total members kicked: ${kicked}\n` +
            `❌ Failed to kick: ${failed}\n` +
            `👑 Admins preserved: ${admins.length}\n` +
            `🤖 Bot kept in group\n\n` +
            `Groupe nettoye !`
        );
        
    } catch (error) {
        console.error('Erreur KickAll :', error);
        await boxReply(`❌ Error during kickall: ${error.message}`);
    }
}
        // --- Helper Functions ---
const replyWithMenu = async (menuBody) => {
const speed = require('performance-now');
const timestamp = speed();
const latency = (speed() - timestamp).toFixed(4);
const ram = formatBytes(process.memoryUsage().rss);
const runtime = formatRuntime(process.uptime());
const time = moment().tz('Africa/Ouagadougou').format('HH:mm:ss');
const date = moment().tz('Africa/Ouagadougou').format('DD/MM/YYYY');
const menuAudio = fs.readFileSync("./media/menu_voice.mp3");
const randomMenuImagePath = menuImages[Math.floor(Math.random() * menuImages.length)];
const randomMenuImageBuffer = fs.readFileSync(randomMenuImagePath);

const os = require('os');
const usedRam = Math.round(process.memoryUsage().rss / 1024 / 1024);
const totalRam = Math.round(os.totalmem() / 1024 / 1024);
const modeLabel = settings.public ? 'public' : 'private';

const menuStats = {
    botName, ownerName, modeLabel, prefix,
    userName: m.pushName, cmdCount: totalfeature(),
    uptime: runtime, time, date, ram: `${usedRam}/${totalRam} MB`
};

// Styles de menu — chacun prend les mêmes données (stats + sections) et rend un texte différent.
// Uniquement des caractères confirmés sûrs (testés sur téléphone), pour éviter les soucis de police.
const MENU_STYLES = {
    1: {
        name: "Classique",
        render: (s, sections) => {
            const sec = (title, items) => `╭──────────────\n│ ⚡ *${title}*\n├──────────────\n${items.map(i => `│ ▸ ${s.prefix}${i}`).join('\n')}\n╰──────────────`;
            return `╔══════════════════╗\n   ⚡ *${s.botName}* ⚡\n╚══════════════════╝\n▸ Mode      : ${s.modeLabel}\n▸ Préfixe   : ${s.prefix}\n▸ User      : ${s.userName}\n▸ Commandes : ${s.cmdCount}\n▸ Uptime    : ${s.uptime}\n▸ Heure     : ${s.time}\n▸ Date      : ${s.date}\n▸ Fuseau    : Africa/Ouagadougou\n▸ RAM       : ${s.ram}\n\n${sections.map(sn => sec(sn.title, sn.items)).join('\n\n')}\n\n› ${s.ownerName}`;
        }
    },
    2: {
        name: "Minimal",
        render: (s, sections) => {
            const sec = (title, items) => `• *${title}*\n${items.map(i => `   ${s.prefix}${i}`).join('\n')}`;
            return `*${s.botName}*\n─────────────────\n${s.modeLabel} · ${s.prefix} · ${s.cmdCount} commandes\n${s.userName} · ${s.uptime}\n${s.time} · ${s.date}\n─────────────────\n\n${sections.map(sn => sec(sn.title, sn.items)).join('\n\n')}\n\n${s.ownerName}`;
        }
    },
    3: {
        name: "Compact",
        render: (s, sections) => {
            const sec = (title, items) => `▪ ${title} : ${items.map(i => s.prefix + i).join(' · ')}`;
            return `⚡ *${s.botName}* ⚡\n${s.userName} | ${s.modeLabel} | ${s.cmdCount} cmd | ${s.uptime}\n${s.time} · ${s.date} · RAM ${s.ram}\n═════════════════\n${sections.map(sn => sec(sn.title, sn.items)).join('\n')}\n═════════════════\n› ${s.ownerName}`;
        }
    },
    4: {
        name: "Domaine",
        render: (s, sections) => {
            const sec = (title, items) => `┃ 🗡️ *${title}*\n${items.map(i => `┃   ${s.prefix}${i}`).join('\n')}`;
            return `╭━〔 🔱 *${s.botName}* 🔱 〕━━━\n┃\n┣━━━━━━━━━━━━\n┃ ⛩️ *STATUT*\n┃ ┠ 👑 User     ➢ ${s.userName}\n┃ ┠ 📜 Commandes➢ ${s.cmdCount}\n┃ ┠ ⚙️ Mode     ➢ ${s.modeLabel}\n┃ ┠ ⚡ Préfixe  ➢ ${s.prefix}\n┃ ┠ ⏱️ Uptime   ➢ ${s.uptime}\n┃ ┖ 🗓️ Heure    ➢ ${s.time}\n┣━━━━━━━━━━━━\n${sections.map(sn => sec(sn.title, sn.items)).join('\n┣━━━━━━━━━━━━\n')}\n╰━━━━━━━━━━━━━━━━━╯\n— dev ⌁ ${s.ownerName} —`;
        }
    },
    5: {
        name: "Scorpion",
        render: (s, sections) => {
            const sec = (title, items) => `[ ${title} ]\n╭───────────────\n${items.map(i => `┋ ⬡ ${s.prefix}${i}`).join('\n')}\n╰───────────────`;
            return `┈───〔 *${s.botName}* 〕┈───\n┋ ➠ Owner : ${s.ownerName}\n┋ ➠ Commandes : ${s.cmdCount}\n┋ ➠ Uptime : ${s.uptime}\n┋ ➠ Préfixe : ${s.prefix}\n┋ ➠ Mode : ${s.modeLabel}\n╰───────────────\n\n${sections.map(sn => sec(sn.title, sn.items)).join('\n\n')}`;
        }
    },
    6: {
        name: "Néo",
        render: (s, sections) => {
            const sec = (title, items) => `╭━━[ *${title}* ]━━⬣\n${items.map(i => `┃ ➪ ${s.prefix}${i}`).join('\n')}\n╰━━━━━━━━━━━━━━━━⬣`;
            return `╭━[ *${s.botName}* ]━━⬣\n┃ ➪ Owner : ${s.ownerName}\n┃ ➪ Prefix : [ ${s.prefix} ]\n┃ ➪ Mode : ${s.modeLabel}\n┃ ➪ Uptime : ${s.uptime}\n╰━━━━━━━━━━━━━━━━⬣\n\n${sections.map(sn => sec(sn.title, sn.items)).join('\n\n')}`;
        }
    },
    7: {
        name: "Shizuku",
        render: (s, sections) => {
            const sec = (title, items) => `╭───〔 ${title} 〕\n${items.map(i => `│ *${s.prefix}${i}*`).join('\n')}\n╰──────────────`;
            return `╭━━━〔 *${s.botName}* 〕━━━╮\n┃ User   : ${s.userName}\n┃ Uptime : ${s.uptime}\n┃ Mode   : ${s.modeLabel}\n┃ Prefix : ${s.prefix}\n╰━━━━━━━━━━━━━━━╯\n\n${sections.map(sn => sec(sn.title, sn.items)).join('\n\n')}\n\n_${s.ownerName}_`;
        }
    }
};

function renderMenu(sections) {
    const styleId = settings.menuStyle && MENU_STYLES[settings.menuStyle] ? settings.menuStyle : 1;
    return MENU_STYLES[styleId].render(menuStats, sections);
}

const section = (title, items) => `╭──────────────\n│ ⚡ *${title}*\n├──────────────\n${items.map(i => `│ ▸ ${prefix}${i}`).join('\n')}\n╰──────────────`;

const fullMenuText = renderMenu([
    { title: 'GÉNÉRAL', items: ['ping', 'menu', 'cmd', 'owner'] },
    { title: 'MÉDIA', items: ['sticker', 'play', 'tiktok', 'instagram', 'yt', 'appsearch'] },
    { title: 'ADMIN GROUPE', items: ['kick', 'promote', 'demote', 'mute', 'unmute', 'antilink on/off', 'welcome on/off'] },
    { title: 'SÉCURITÉ (owner)', items: ['sudo add/remove/list', 'blacklist add/remove/list', 'setprefix', 'setpp', 'mode public/private'] },
    { title: 'IA', items: ['ai', 'search', 'vision', 'codegen', 'blague', 'autopilot on/off'] },
    { title: 'FUN', items: ['spider', 'truth', 'dare', 'meme'] }
]);
const channelLink = process.env.NEWSLETTER_JID || "";
            let menuSent = false;

            if (channelLink && channelLink.startsWith('http')) {
                try {
                    const { imageMessage } = await generateWAMessageContent(
                        { image: randomMenuImageBuffer },
                        { upload: sock.waUploadToServer }
                    );

                    const menuInteractive = generateWAMessageFromContent(from, {
                        viewOnceMessage: {
                            message: {
                                interactiveMessage: proto.Message.InteractiveMessage.create({
                                    header: proto.Message.InteractiveMessage.Header.create({
                                        imageMessage: imageMessage,
                                        hasMediaAttachment: true
                                    }),
                                    body: proto.Message.InteractiveMessage.Body.create({ text: fullMenuText.trim() }),
                                    footer: proto.Message.InteractiveMessage.Footer.create({ text: 'Aucune trace. Aucune limite.' }),
                                    nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
                                        buttons: [{
                                            name: 'cta_url',
                                            buttonParamsJson: JSON.stringify({ display_text: '📢 Rejoindre la chaîne', url: channelLink, merchant_url: channelLink })
                                        }]
                                    })
                                })
                            }
                        }
                    }, { quoted: m });

                    await sock.relayMessage(from, menuInteractive.message, { messageId: menuInteractive.key.id });
                    menuSent = true;
                } catch (e) {
                    console.error("Menu interactif échoué, repli sur l'ancienne méthode:", e.message);
                }
            }

            if (!menuSent) {
                const messagePayload = {
                    image: randomMenuImageBuffer,
                    caption: fullMenuText.trim(),
                    contextInfo: {
                        externalAdReply: {
                            title: botName,
                            body: `Développé par ${ownerName}`,
                            thumbnail: randomMenuImageBuffer,
                            mediaType: 1,
                            renderLargerThumbnail: true
                        }
                    }
                };
                try {
                    await sock.sendMessage(from, messagePayload, { quoted: m });
                } catch (err) {
                    await sock.sendMessage(from, { text: fullMenuText.trim() }, { quoted: m });
                }
            }

            try {
                await sock.sendMessage(from, {
                    audio: menuAudio,
                    mimetype: "audio/mpeg",
                    ptt: false,
                }, { quoted: m });
            } catch (e) { /* ignore audio send failures */ }
        };

        // Reply Function 
const sylphaReply = async (text) => {
    const newsletterJid = process.env.NEWSLETTER_JID || "";

    const styledMessage = `
╭─❏ *ZERO TRACE*
│
│ ${text}
│
╰─❏
› Aucune trace, aucune limite.
`.trim();

    const contextInfo = newsletterJid ? {
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: newsletterJid,
            newsletterName: botName,
            serverMessageId: -1
        }
    } : {};

    return await sock.sendMessage(
        from,
        {
            text: styledMessage,
            contextInfo
        },
        { quoted: m }
    );
};

 // ========================================================
        // Console Log
const getMessageText = (m) => {
    if (!m.message) return '';

    const msgType = Object.keys(m.message)[0];

    return (
        m.message.conversation ||
        m.message.extendedTextMessage?.text ||
        m.message.imageMessage?.caption ||
        m.message.videoMessage?.caption ||
        m.message.buttonsResponseMessage?.selectedButtonId ||
        m.message.listResponseMessage?.singleSelectReply?.selectedRowId ||
        `[${msgType}]`
    );
};

if (m.message) {
    const messageText = getMessageText(m);
    const safeText = messageText || '[No Text]';
    const timeNow = moment().tz('Africa/Lagos').format('YYYY-MM-DD HH:mm:ss');
    const senderNumber = m.sender?.split('@')[0] || 'Unknown';

let groupName = 'Groupe inconnu';

if (m.isGroup) {
    try {
        const metadata = await sock.groupMetadata(m.from);
        groupName = metadata.subject || 'Groupe inconnu';
    } catch (e) {
        groupName = 'Groupe inconnu';
    }
}


    console.log('\n' + chalk.gray('────────────────────────────────────────'));
    console.log(
        chalk.bold.cyan('🧠 ZERO TRACE') +
        chalk.gray(' • ') +
        chalk.green(timeNow)
    );
    console.log(chalk.gray('────────────────────────────────────────'));

    console.log(
        chalk.white('👤 User      : ') +
        chalk.magenta(pushname || 'Unknown')
    );

    console.log(
        chalk.white('📞 Number    : ') +
        chalk.red(senderNumber)
    );

    console.log(
        chalk.white('💬 Message   : ') +
        chalk.yellow(
            safeText.slice(0, 100) + (safeText.length > 100 ? '...' : '')
        )
    );

    if (isCmd) {
        console.log(
            chalk.white('⚡ Command   : ') +
            chalk.blue(command)
        );
    }

    if (m.isGroup) {
        console.log(
            chalk.white('👥 Group     : ') +
            chalk.green(groupName || 'Groupe inconnu')
        );

        console.log(
            chalk.white('🆔 Group ID  : ') +
            chalk.gray(m.from)
        );
    } else {
        console.log(
            chalk.white('🔒 Chat Type : ') +
            chalk.cyan('Private Chat')
        );
    }

    console.log(chalk.gray('────────────────────────────────────────\n'));
}
//===============================================

// Process moderation for incoming messages (check for muted users, spam, etc.)
if (moderation && m.isGroup && !isCmd) {
    try {
      
        const wasDeleted = await moderation.processMessage(
            m,           // message object
            from,        // chat ID
            sender,      // sender ID
            body,        // message text
            isGroup,     // is group
            isAdmin,     // is admin
            isAdminUser, // is admin user (owner/sudo)
            isBotAdmin   // is bot admin
        );
        if (wasDeleted) {
            return; // Stop processing if message was deleted
        }
    } catch (modError) {
        console.log('Erreur traitement moderation :', modError);
    }
}

        // --- Auto Features ---
        if (m.key.remoteJid === 'status@broadcast' && body.toLowerCase() === 'save') {
            if (m.quoted) {
                try {
                    await sock.sendMessage(from, { text: "Voici le statut demande :" });
                    await sock.forwardMessage(m.sender, m.quoted);
                } catch (e) {
                    console.error("Erreur sauvegarde statut :", e);
                    try { await sylphaReply("Desole, je n'ai pas pu t'envoyer ce statut."); } catch (_) {}
                }
            }
        }

/*
        // respect private mode
if (!sock.public) {
if (!isAdminUser) return
} // ignore all messages from non-owner when in private mode*/

// Respect per-session public mode — silence total pour les non-owners (pas de réaction, pas de message)
if (!settings.public && !isAdminUser) return;
        
//======================= auto presence + Auto react to command=============


        // auto presence/react (existing feature retained)
        if (config.auto && config.auto.online) {
            try { await sock.sendPresenceUpdate('available', from); } catch (_) {}
        }
        if (isCmd && config.auto && config.auto.react) {
            try { await sock.sendMessage(from, { react: { text: "💓", key: m.key } }); } catch (_) {}
        }
        
        
 // ======================== AUTOREACT HANDLER ================

if (settings?.autoReact?.Enabled) {
    try {
        const reactions = [
            // Positive/Supportive (👍)
            "👍", "👌", "🤝", "✅", "💪", "🙌",
            
            // Love/Heart (❤️)
            "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎",
            
            // Excited/Cool (😎)
            "😎", "🔥", "💯", "⚡", "🌟", "✨", "👑",
            
            // Happy/Fun (😁)
            "😁", "😂", "🤣", "😊", "🥳", "🎉", "😇", "🥰",
            
            // Funny/Meme (😈)
            "😈", "👻", "💀", "🤡", "🎭", "🍿", "🍵",
            
            // Miscellaneous
            "👀", "💅", "✨", "💫", "⭐", "🎯", "🎲", "🎨",
            
            // Animals/Nature
            "🐐", "🐍", "🦅", "🦁", "🐉", "🌚", "🌝", "🍃",
            
            // Special
            "☄️", "🌌", "🌈", "⚡", "💎", "🔮", "🎭", "🎪"
        ];
        
        const pick = reactions[Math.floor(Math.random() * reactions.length)];

        await sock.sendMessage(from, {
            react: { text: pick, key: m.key }
        });

    } catch (err) {
        console.error("ERREUR AUTO-REACT :", err);
    }
}

// 🔕 Silent VO emoji trigger
if (isDlvoEmoji(m) && m.quoted && isOwner) {
    try {
        const buffer = await m.quoted.download()
        if (!buffer) return

        const type = m.quoted.mtype

        if (type === 'imageMessage') {
            await sock.sendMessage(sender, { image: buffer })
        } else if (type === 'videoMessage') {
            await sock.sendMessage(sender, { video: buffer })
        } else if (type === 'audioMessage') {
            await sock.sendMessage(sender, {
                audio: buffer,
                mimetype: 'audio/mpeg',
                ptt: true
            })
        }

        return // 🚫 stop everything silently
    } catch {
        return
    }
}

// ======================== BUTTON HANDLER ========================
let interactiveBtnId = null;
try {
    const paramsJson = m.message?.interactiveResponseMessage?.nativeFlowResponseMessage?.paramsJson;
    if (paramsJson) interactiveBtnId = JSON.parse(paramsJson).id;
} catch (e) {}

if (m.mtype === "buttonsResponseMessage" || interactiveBtnId || (body && (body.includes('yt_') || body.includes('tiktok_') || body.includes('ig_') || body.includes('tw_')))) {
    try {
        // Extract button ID
        let buttonId = m.message?.buttonsResponseMessage?.selectedButtonId || interactiveBtnId || body;
        
        // Check if it's a YouTube button
        if (buttonId && buttonId.startsWith('yt_')) {
            const parts = buttonId.split('_');
            const action = parts[1]; // audio, voice, doc, video
            const url = parts.slice(2).join('_'); // YouTube URL
            
            if (!url) {
                return sylphaReply("❌ Invalid button data.");
            }
            
            const youtubeUrl = decodeURIComponent(url);
            
            // Send processing message
            await sock.sendMessage(from, { 
                text: "⏳ Processing your request...",
                quoted: m 
            });
            
            // Handle different actions
            switch(action) {
                case 'audio': {
                    // Download compressed audio
                    const { buffer, title } = await getYTAudioCompressed(youtubeUrl);
                    
                    await sock.sendMessage(from, {
                        audio: buffer,
                        mimetype: "audio/mpeg",
                        fileName: `${title.replace(/[^\w\s]/gi, '')}.mp3`,
                        ptt: false
                    }, { quoted: m });
                    break;
                }
                
                case 'voice': {
                    // Download audio and send as voice note
                    const { buffer, title } = await getYTAudioCompressed(youtubeUrl);
                    
                    await sock.sendMessage(from, {
                        audio: buffer,
                        mimetype: "audio/ogg; codecs=opus",
                        ptt: true,
                        fileName: `${title.replace(/[^\w\s]/gi, '')}.ogg`
                    }, { quoted: m });
                    break;
                }
                
                case 'doc': {
                    // Send as document
                    const { buffer, title, filename } = await getYTAudioCompressed(youtubeUrl);
                    
                    await sock.sendMessage(from, {
                        document: buffer,
                        mimetype: "audio/mpeg",
                        fileName: filename || `${title.replace(/[^\w\s]/gi, '')}.mp3`,
                        caption: `📁 ${title}`
                    }, { quoted: m });
                    break;
                }
                
                case 'video': {
                    // Download compressed video
                    const { buffer, title } = await getYTVideoCompressed(youtubeUrl);
                    
                    await sock.sendMessage(from, {
                        video: buffer,
                        mimetype: "video/mp4",
                        caption: `🎬 ${title}`,
                        fileName: `${title.replace(/[^\w\s]/gi, '')}.mp4`
                    }, { quoted: m });
                    break;
                }
                
                default:
                    sylphaReply("❌ Unknown action.");
                    break;
            } // ← Switch closing brace
            
            return; // Important: Stop further processing
        }

        // TikTok buttons
        if (buttonId && buttonId.startsWith('tiktok_')) {
            const parts = buttonId.split('_');
            const action = parts[1]; // video ou audio
            const url = decodeURIComponent(parts.slice(2).join('_'));
            if (!url) return sylphaReply("❌ Invalid button data.");

            await sock.sendMessage(from, { text: "⏳ Processing your request...", quoted: m });
            const res = await api.tiktok(url);

            if (res.result.duration == 0) {
                // Carrousel d'images — pas de choix vidéo/audio possible, on envoie direct
                for (let a of res.result.images) {
                    await sock.sendMessage(from, { image: { url: a }, caption: `via ${botName}` }, { quoted: m });
                }
                return;
            }

            if (action === 'video') {
                await sock.sendMessage(from, { video: { url: res.result.play }, mimetype: "video/mp4", caption: `via ${botName}` }, { quoted: m });
            } else {
                const audioBuffer = await extractAudioFromVideoUrl(res.result.play);
                await sock.sendMessage(from, { audio: audioBuffer, mimetype: "audio/mpeg", ptt: false }, { quoted: m });
            }
            return;
        }

        // Instagram buttons
        if (buttonId && buttonId.startsWith('ig_')) {
            const parts = buttonId.split('_');
            const action = parts[1];
            const url = decodeURIComponent(parts.slice(2).join('_'));
            if (!url) return sylphaReply("❌ Invalid button data.");

            await sock.sendMessage(from, { text: "⏳ Processing your request...", quoted: m });
            const result = await igdl(url);
            if (!result || result.length === 0) return sylphaReply("Echec de recuperation du media. Verifie que l'URL est correcte.");

            if (action === 'video') {
                for (let video of result) {
                    await sock.sendFile(from, video.url, 'instagram.mp4', `via ${botName}`, m);
                }
            } else {
                const audioBuffer = await extractAudioFromVideoUrl(result[0].url);
                await sock.sendMessage(from, { audio: audioBuffer, mimetype: "audio/mpeg", ptt: false }, { quoted: m });
            }
            return;
        }

        // Twitter/X buttons
        if (buttonId && buttonId.startsWith('tw_')) {
            const parts = buttonId.split('_');
            const action = parts[1];
            const url = decodeURIComponent(parts.slice(2).join('_'));
            if (!url) return sylphaReply("❌ Invalid button data.");

            await sock.sendMessage(from, { text: "⏳ Processing your request...", quoted: m });
            const apiUrl = `https://kaiz-apis.gleeze.com/api/downloader/twitter?url=${encodeURIComponent(url)}`;
            const result = await fetchJson(apiUrl);
            if (!result?.result?.videos) return sylphaReply("❌ Failed to download. The link might be invalid, private, or not a video post.");

            if (action === 'video') {
                await sock.sendMessage(from, { video: { url: result.result.videos }, caption: result.result.description || `via ${botName}` }, { quoted: m });
            } else {
                const audioBuffer = await extractAudioFromVideoUrl(result.result.videos);
                await sock.sendMessage(from, { audio: audioBuffer, mimetype: "audio/mpeg", ptt: false }, { quoted: m });
            }
            return;
        }
    } catch (e) {
        console.error("Erreur bouton :", e);
        sylphaReply(`❌ Le téléchargement a échoué (services de téléchargement indisponibles pour l'instant). Réessaie dans quelques minutes, ou avec une autre vidéo.`);
    }
}


        // ephoto commands list
        const ephotoEffects = {
    // 🔥 GLITCH / TECH
    glitchtext: 'https://en.ephoto360.com/create-digital-glitch-text-effects-online-767.html',
    pixelglitch: 'https://en.ephoto360.com/create-pixel-glitch-text-effect-online-769.html',
    neonglitch: 'https://en.ephoto360.com/create-impressive-neon-glitch-text-effects-online-768.html',
    glitch2: 'https://en.ephoto360.com/create-glitch-text-effect-style-tik-tok-983.html',
    cyberpunk: 'https://en.ephoto360.com/create-a-cyberpunk-style-glitch-text-effect-online-974.html',

    // ✨ NEON / GLOW
    advancedglow: 'https://en.ephoto360.com/advanced-glow-effects-74.html',
    neontext: 'https://en.ephoto360.com/neon-text-effect-online-879.html',
    neonlight: 'https://en.ephoto360.com/create-light-effects-green-neon-online-429.html',
    neonmetal: 'https://en.ephoto360.com/neon-metal-text-effect-online-919.html',

    // 📝 TEXT / WRITE
    writetext: 'https://en.ephoto360.com/write-text-on-wet-glass-online-589.html',
    fogtext: 'https://en.ephoto360.com/write-text-effect-on-foggy-glass-online-588.html',
    sandwriting: 'https://en.ephoto360.com/write-name-on-sand-online-103.html',
    graffiti: 'https://en.ephoto360.com/create-graffiti-text-effects-online-770.html',
    typographytext: 'https://en.ephoto360.com/create-typography-text-effect-on-pavement-online-774.html',

    // 🇳🇬 FLAGS / IDENTITY
    flagtext: 'https://en.ephoto360.com/nigeria-3d-flag-text-effect-online-free-753.html',
    goldflag: 'https://en.ephoto360.com/3d-golden-flag-text-effect-online-738.html',

    // 🔥 3D / STYLE (⚠️ MUST BE QUOTED)
    '3dstone': 'https://en.ephoto360.com/3d-stone-text-effect-online-105.html',
    '3dmetal': 'https://en.ephoto360.com/3d-metal-text-effect-online-110.html',
    '3dchrome': 'https://en.ephoto360.com/create-3d-chrome-text-effect-online-982.html',
    '3dgold': 'https://en.ephoto360.com/create-3d-gold-text-effect-online-983.html',

    // 🎮 FUN / MODERN
    gaminglogo: 'https://en.ephoto360.com/create-esport-logo-online-101.html',
    cartoontext: 'https://en.ephoto360.com/cartoon-style-text-effect-online-783.html',
    flame: 'https://en.ephoto360.com/flame-text-effect-online-107.html',
    smoke: 'https://en.ephoto360.com/smoke-text-effect-online-108.html',
    ice: 'https://en.ephoto360.com/ice-text-effect-online-1070.html'
}

const ephotoCommands = Object.keys(ephotoEffects)


        // --- Command Router ---   
        
if (isCmd) {
switch (command) {
case 'repo':
case 'repository':
case 'github': {
    const repoMsg = `
🗡️ *ZERO TRACE*
━━━━━━━━━━━━━━━━━━━

✨ *Fonctionnalités*
• Bot WhatsApp rapide et stable
• Stickers & outils médias
• Déverrouillage des vues uniques
• Effets Ephoto
• Préfixe personnalisable
• Système de contrôle propriétaire

🧠 *Technologie*
• JavaScript (Node.js)
• Librairie Baileys

━━━━━━━━━━━━━━━━━━━
💡 _Je veille, quoi qu'il arrive._
    `.trim()

    await sock.sendMessage(
        from,
        { text: repoMsg },
        { quoted: m }
    )
}
break

case 'readmore': {
    if (!text) 
        return sylphaReply('Usage: .readmore <your message>');

    // Invisible character repeated to create "Read More"
    const more = String.fromCharCode(8206);
    const readMore = more.repeat(4000); // You can increase if needed

    const finalText = text + readMore;

    await sock.sendMessage(m.from, {
        text: finalText
    });

    break;
}
       
// Add this case to your command handler in commands.js
case 'kickall':
    if (!isGroup) return sylphaReply('❌ This command can only be used in groups!');
    if (!isAdmin) return sylphaReply('❌ You need to be an admin to use this command!');
    if (!isBotAdmin) return sylphaReply('❌ I need to be an admin to kick members!');
    
    // Send warning message
    await sylphaReply(`⚠️ *KICKALL COMMAND INITIATED* ⚠️\n\nThis group will be cleared of all non-admin members in 5 seconds.\nType *${prefix}cancel* to cancel this operation.`);
    
    // Store kickall state temporarily
    if (!global.kickallTimeouts) global.kickallTimeouts = new Map();
    const timeoutId = setTimeout(async () => {
        await executeKickAll(sock, from, isBotAdmin);
        global.kickallTimeouts.delete(from);
    }, 5000);
    
    global.kickallTimeouts.set(from, timeoutId);
    break;

case 'cancelkick':
    if (!isGroup) return;
    if (global.kickallTimeouts && global.kickallTimeouts.has(from)) {
        clearTimeout(global.kickallTimeouts.get(from));
        global.kickallTimeouts.delete(from);
        await sylphaReply('✅ Kickall operation cancelled!');
    } else {
        await sylphaReply('❌ No pending kickall operation found!');
    }
    break;        
          
case 'menu':
case 'help': 
case 'mich': {
await sock.sendMessage(from, { react: { text: "🤗", key: m.key } });

const ownerMenu = `╭─「 👑 *OWNER MENU* 」
│ 
├─ ⚙️ *Bot Control*
│  │ ${prefix}ping
│  │ ${prefix}alive
│  │ ${prefix}menu
│  │ ${prefix}restart
│  │ ${prefix}disk
│  │ ${prefix}hostip
│  │ ${prefix}modestatus
│  │ ${prefix}online
│  ╰ ${prefix}lastseen
│ 
├─ 👤 *User Management*
│  │ ${prefix}addsudo
│  │ ${prefix}delsudo
│  │ ${prefix}listsudo
│  │ ${prefix}block
│  │ ${prefix}unblock
│  │ ${prefix}unblockall
│  │ ${prefix}listblocked
│  │ ${prefix}warn
│  │ ${prefix}testapi
│  │ ${prefix}payme
│  ╰ ${prefix}owner
│ 
├─ 📢 *Broadcast & Status*
│  │ ${prefix}gcbroadcast
│  │ ${prefix}setbio
│  │ ${prefix}tostatus
│  ╰ ${prefix}savestatus
│ 
├─ 🔐 *Privacy & Settings*
│  │ ${prefix}ppprivacy
│  │ ${prefix}gcaddprivacy
│  │ ${prefix}readreceipts
│  │ ${prefix}autoreact
│  │ ${prefix}clear
│  │ ${prefix}alwaysonline
│  ╰ ${prefix}autostatusview
│
├─ 🛠️ *Utilities*
│  │ ${prefix}vv 
│  │ ${prefix}dlvo / vv2
│  │ ${prefix}toviewonce
│  │ ${prefix}setpp / ${prefix}setprofilepic
│  │ ${prefix}take
│  │ ${prefix}autotyping 
│  │ ${prefix}autorecord
│  │ ${prefix}autoread
│  │ ${prefix}ssweb
│  │ ${prefix}removebg
│  │ ${prefix}mediafire
│  │ ${prefix}gitclone
│  │ ${prefix}tourl 
│  │ ${prefix}shorturl
│  │ ${prefix}join
│  │ ${prefix}leave
│  │ ${prefix}pinchat
│  │ ${prefix}unpinchat
│  │ ${prefix}jid
│  │ ${prefix}idch
│  │ ${prefix}say
│  │ ${prefix}apk
│  │ ${prefix}screenshot 
│  │ ${prefix}whois
│  │ ${prefix}groupid
│  │ ${prefix}react
│  │ ${prefix}delete
│  │ ${prefix}deljunk
│  │ ${prefix}setprefix
│  │ ${prefix}setstickercmd
│  ╰ ${prefix}delstickercmd
│
╰───────────`;

    const downloadMenu = `╭─「 📥 *DOWNLOAD MENU* 」
│ 
├─ 🎵 *Audio & Video*
│  │ ${prefix}play
│  │ ${prefix}video
│  │ ${prefix}ytmp3
│  │ ${prefix}ytmp4
│  ╰ ${prefix}
│ 
├─ 🌐 *Social Media*
│  │ ${prefix}Instagram / ${prefix}ig
│  │ ${prefix}tiktok / ${prefix}tt
│  │ ${prefix}twitter / ${prefix}tw
│  │ ${prefix}ttmp3
│  │ ${prefix}fb
│  ╰ ${prefix}pinterest
│ 
├─ 🎶 *Music Tools*
│  │ ${prefix}spotify
│  │ ${prefix}lyrics
│  ╰ ${prefix}lyrics2
│ 
├─ 🛠️ *Tools & Info*
│  │ ${prefix}imdb
│  │ ${prefix}weather
│  │ ${prefix}toimg
│  ╰ ${prefix}tovid
│
╰───────────`;

    const specialMenu = `╭─「 🔍 *SPECIAL MENU* 」
│ ${prefix}google
│ ${prefix}image
│ ${prefix}readmore
│ ${prefix}imgur
│ ${prefix}gen
│ ${prefix}xnxx
│ ${prefix}flux
│ ${prefix}gemini-vision 
│ ${prefix}ytsearch
╰───────────`;

   const searchMenu = `╭─「 🔍 *SEARCH MENU* 」
│ ${prefix}Device
╰───────────`;

    const groupMenu = `╭─「 👥 *GROUP MENU* 」
│ 
├─ 📣 *Mentions & Info*
│  │ ${prefix}tag
│  │ ${prefix}tagall
│  │ ${prefix}tagadmin
│  │ ${prefix}hidetag
│  │ ${prefix}listonline
│  │ ${prefix}listgc
│  │ ${prefix}getpp
│  │ ${prefix}grouplink
│  │ ${prefix}invite
│  │ ${prefix}totalmembers
│  ╰ ${prefix}userid
│ 
├─ 🛠️ *Admin Actions*
│  │ ${prefix}add
│  │ ${prefix}kick
│  │ ${prefix}promote
│  │ ${prefix}demote
│  │ ${prefix}setgroupname
│  │ ${prefix}setdesc
│  │ ${prefix}setppgroup
│  │ ${prefix}delppgroup
│  │ ${prefix}resetlink
│  │ ${prefix}kickall
│  │ ${prefix}cancelkick
│  │ ${prefix}mediatag
│  │ ${prefix}poll
│  ╰ ${prefix}del
│ 
├─ ⚙️ *Group Settings*
│  │ ${prefix}opengc
│  │ ${prefix}closegc
│  │ ${prefix}opentime
│  │ ${prefix}closetime
│  │ ${prefix}welcome
│  │ ${prefix}goodbye
│  │ ${prefix}editsettings
│  ╰ ${prefix}announcements
│ 
│ 
├─ 🛡️ *Anti-Features*
│  │ ${prefix}antilink on|off
│  │ ${prefix}antibot on|off
│  │ ${prefix}antipromote on|off
│  │ ${prefix}antidemote on|off
│  │ ${prefix}antiforeign on|off
│  │ ${prefix}antibadword on|off
│  │ ${prefix}antitag on/off
│  │ ${prefix}antitagadmin on|off
│  │ ${prefix}antibot on/off
│  │ ${prefix}antispam on/off
│  │ ${prefix}modstatus
│  ╰ ${prefix}antigroupmention on/off
│
├─ 🔒 *Permission Control*
│  │ ${prefix}allow
│  │ ${prefix}warn
│  │ ${prefix}resetwarns
│  │ ${prefix}mute-user
│  │ ${prefix}unmute-user
│  │ ${prefix}delallowed
│  │ ${prefix}listallowed
│  │ ${prefix}creategc
│  │ ${prefix}addcode
│  │ ${prefix}delcode
│  │ ${prefix}listcode
│  │ ${prefix}approveall
│  │ ${prefix}disapproveall
│  ╰ ${prefix}listrequests
│
├─ 🧹 *Activity Management*
│  │ ${prefix}listactive
│  │ ${prefix}listinactive
│  │ ${prefix}kickinactive
│  ╰ ${prefix}vcf
│
╰───────────`;

    const audioMenu = `╭─「 🎧 *AUDIO MENU* 」
│ 
├─ 🔊 *Audio Effects*
│  │ ${prefix}bass
│  │ ${prefix}blown
│  │ ${prefix}deep
│  │ ${prefix}earrape
│  │ ${prefix}reverse
│  │ ${prefix}robot
│  ╰ ${prefix}volaudio
│ 
├─ 🔄 *Converters*
│  │ ${prefix}tomp3
│  │ ${prefix}tovoicenote
│  │ ${prefix}toaudio
│  │ ${prefix}toimage
│  │ ${prefix}tovideo
│  ╰ ${prefix}toptt
│
╰───────────`;

    const funMenu = `╭─「 🎲 *FUN & GAMES MENU* 」
│ 
├─ 💬 *Interactive*
│  │ ${prefix}ai
│  │ ${prefix}simi
│  │ ${prefix}catfact
│  │ ${prefix}riddle
│  │ ${prefix}quote
│  │ ${prefix}ship
│  │ ${prefix}truth 
│  │ ${prefix}dare
│  │ ${prefix}insult
│  │ ${prefix}trivia
│  ╰ ${prefix}pickupline
│ 
├─ 🖼️ *Images & Memes*
│  │ ${prefix}meme
│  │ ${prefix}neko
│  │ ${prefix}waifu
│  │ ${prefix}shinobu
│  ╰ ${prefix}megumin
│ 
├─ 🎬 *GIF Reactions*
│  │ ${prefix}emojimix
│  │ ${prefix}slap
│  │ ${prefix}kiss
│  │ ${prefix}kill
│  │ ${prefix}hug
│  │ ${prefix}cry
│  ╰ ${prefix}yeet
│
╰───────────`;

    const animeMenu = `╭─「 🎌 *ANIME MENU* 」
│ ${prefix}animekill
│ ${prefix}animesmile
│ ${prefix}animeslap
│ ${prefix}animedance
│ ${prefix}animekiss
│ ${prefix}animeyeet
│ ${prefix}satorugojo
│ ${prefix}sukuna
╰───────────`;

const stickerMenu = `╭─「 🌟 *STICKER MENU* 」
│ ${prefix}addpack
│ ${prefix}addsticker
│ ${prefix}delsticker
│ ${prefix}listpacks
│ ${prefix}sendpack
│ ${prefix}delpack
╰───────────`;

const WcgMenu = `╭─「 🌟 *WCG MENU* 」
│ ${prefix}wcg
│ ${prefix}joinwcg
│ ${prefix}endwcg
╰───────────`;

    const ephotoMenuList = ephotoCommands.map(cmd => `│ ${prefix}${cmd}`).join('\n');
    const ephotoMenu = `╭─「 🎨 *EPHOTO MENU* 」
${ephotoMenuList}
╰───────────`;

                    const menuBody = [ownerMenu, searchMenu, specialMenu, downloadMenu, audioMenu, groupMenu, funMenu, animeMenu, stickerMenu, WcgMenu, ephotoMenu].join('\n\n');
                    await replyWithMenu(menuBody);
                    break;
                }
                
//=================== WCG GAME CASES =======================

case 'wcg':
        handleWCG(m, sock, prefix);
        break;

case 'joinwcg':
        handleJoinWCG(m, sock);
        break;

case 'endwcg':
        handleEndWCG(m, sock);
        break;

//==========================================================


//============ clear group chat =======================//           
case 'clear': {
if (!isAdminUser) return sylphaReply('Seul mon maître peut me demander cela.')
sock.chatModify({ delete: true, lastMessages: [{ key: m.key, messageTimestamp: m.messageTimestamp }] }, from)
}
break                


//======================
//XNXX COMMAND 
//======================       

case 'xnxxdl':
case 'xnxx': {
if (!isAdminUser) return sylphaReply('❌ Réservé à mon propriétaire.')
    if (!text) {
        return sylphaReply(
            '❌ *Usage:*\n\n.xnxx <video_url>\n\nExample:\n.xnxx https://xnxx.com/video-xxxxx'
        );
    }

    try {
        const apiKey =  '47dea863c6mshd77762eaac135efp1115f4jsn382817130c41';
        if (!apiKey) {
            return sylphaReply('❌ RapidAPI key not configured.');
        }

        const response = await fetch(
            'https://porn-xnxx-api.p.rapidapi.com/download',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-rapidapi-key': apiKey,
                    'x-rapidapi-host': 'porn-xnxx-api.p.rapidapi.com'
                },
                body: JSON.stringify({
                    video_link: text.trim()
                })
            }
        );

        const data = await response.json();

        if (!data || data.status !== 'success') {
            return sylphaReply('❌ Failed to fetch download info.');
        }

        const caption = `
🎬 *Video Found*

📛 Title: ${data.title || 'Unknown'}
⏱ Duration: ${data.duration || 'Unknown'}
📦 Size: ${data.filesize || 'Unknown'}

🔗 *Download Link:*
${data.download || 'Not available'}
        `.trim();

        await sock.sendMessage(
            m.from,
            { text: caption },
            { quoted: m }
        );

    } catch (err) {
        console.error('Erreur telechargement XNXX :', err);
        sylphaReply('❌ Error fetching video. Try again later.');
    }
}
break;
 
//============================
// OBFUSCATE COMMAND 
//=============================                  

//================== SET PREFIX ===================

case 'setprefix': {
    if (!isAdminUser) return sylphaReply('❌ Réservé à mon propriétaire.')

    if (!text) {
        return sylphaReply(`Utilisation : ${prefix}setprefix ! (accepte lettres, mots, emoji)`)
    }

    if (text.length > 10) {
        return sylphaReply('❌ Le préfixe est trop long (10 caractères maximum).')
    }

    const newPrefix = text

    // Save prefix
    const file = './system/prefix.json'
    fs.writeFileSync(file, JSON.stringify({ prefix: newPrefix }, null, 2))

    // Update runtime config
    config.prefix = newPrefix

    sylphaReply(`✅ Préfixe changé avec succès : *${newPrefix}*`)
    break
}
// =========================== CASE: STICKER PACK===========================
case 'addpack': {
    if (!isAdminUser) return sylphaReply('Réservé à mon propriétaire.');
    if (!text) return sylphaReply('Usage: addpack <packname>');

    const packName = text.toLowerCase().replace(/[^a-z0-9_-]/g, '');
    const db = JSON.parse(fs.readFileSync(PACK_DB));

    if (db[packName]) return sylphaReply('Ce pack existe deja.');

    db[packName] = [];
    fs.mkdirSync(`${STICKER_PACK_DIR}/${packName}`);
    fs.writeFileSync(PACK_DB, JSON.stringify(db, null, 2));

    activePack[sender] = packName;

    sylphaReply(`✅ Pack *${packName}* created.\nReply to stickers with *addsticker*`);
    break;
}

case 'addsticker': {
    if (!isAdminUser) return sylphaReply('Réservé à mon propriétaire.');
    if (!activePack[sender]) return sylphaReply("Aucun pack actif. Utilise d'abord addpack.");
    if (!m.quoted || m.quoted.mtype !== 'stickerMessage')
        return sylphaReply('Reponds a un sticker.');

    const packName = activePack[sender];
    const packPath = `${STICKER_PACK_DIR}/${packName}`;
    const db = JSON.parse(fs.readFileSync(PACK_DB));

    const buffer = await m.quoted.download();
    const fileName = `${Date.now()}.webp`;
    const filePath = `${packPath}/${fileName}`;

    fs.writeFileSync(filePath, buffer);
    db[packName].push(fileName);
    fs.writeFileSync(PACK_DB, JSON.stringify(db, null, 2));

    sylphaReply(`➕ Sticker added to *${packName}*`);
    break;
}

case 'delsticker': {
    if (!isAdminUser) return sylphaReply('Réservé à mon propriétaire.');
    if (!activePack[sender]) return sylphaReply('No active pack.');
    if (!m.quoted || m.quoted.mtype !== 'stickerMessage')
        return sylphaReply('Reponds a un sticker.');

    const packName = activePack[sender];
    const packPath = `${STICKER_PACK_DIR}/${packName}`;
    const db = JSON.parse(fs.readFileSync(PACK_DB));

    const files = fs.readdirSync(packPath);
    if (!files.length) return sylphaReply('Le pack est vide.');

    // Remove LAST added sticker (simple & safe)
    const removed = db[packName].pop();
    if (removed && fs.existsSync(`${packPath}/${removed}`)) {
        fs.unlinkSync(`${packPath}/${removed}`);
    }

    fs.writeFileSync(PACK_DB, JSON.stringify(db, null, 2));
    sylphaReply(`🗑️ Last sticker removed from *${packName}*`);
    break;
}

case 'listpacks': {
    const db = JSON.parse(fs.readFileSync(PACK_DB));
    const packs = Object.keys(db);

    if (!packs.length) return sylphaReply('Aucun pack de stickers trouve.');

    let txt = '*📦 Sticker Packs*\n\n';
    packs.forEach((p, i) => {
        txt += `${i + 1}. ${p} (${db[p].length})\n`;
    });

    sylphaReply(txt);
    break;
}

case 'sendpack': {
    if (!text) return sylphaReply('Usage: sendpack <packname>');

    const packName = text.toLowerCase();
    const db = JSON.parse(fs.readFileSync(PACK_DB));

    if (!db[packName]) return sylphaReply('Pack introuvable.');
    if (!db[packName].length) return sylphaReply('Le pack est vide.');

    for (const file of db[packName]) {
        const buffer = fs.readFileSync(`${STICKER_PACK_DIR}/${packName}/${file}`);
        await sock.sendMessage(from, {
            sticker: buffer,
            packname: packName,
            author: 'ZERO TRACE'
        });
        await new Promise(r => setTimeout(r, 400)); // anti-flood
    }
    break;
}

case 'delpack': {
    if (!isAdminUser) return sylphaReply('Réservé à mon propriétaire.');
    if (!text) return sylphaReply('Usage: delpack <packname>');

    const packName = text.toLowerCase();
    const db = JSON.parse(fs.readFileSync(PACK_DB));

    if (!db[packName]) return sylphaReply('Pack introuvable.');

    fs.rmSync(`${STICKER_PACK_DIR}/${packName}`, { recursive: true, force: true });
    delete db[packName];
    fs.writeFileSync(PACK_DB, JSON.stringify(db, null, 2));

    if (activePack[sender] === packName) delete activePack[sender];

    sylphaReply(`❌ Pack *${packName}* deleted.`);
    break;
}

// ───────────────────────────
// AUTOREACT CASE
// ───────────────────────────

case 'autoreact': {
    if (!args[0]) {
        return sylphaReply(`⚙️ Autoreact Setting\n\nUse:\n.autoreact on\n.autoreact off`);
    }

    // Initialize the autoReact object if it doesn't exist
    if (!settings.autoReact) {
        settings.autoReact = {};
    }

    if (args[0].toLowerCase() === 'on') {
        settings.autoReact.Enabled = true;  // ✅ No optional chaining needed now
        return sylphaReply("✅ *Autoreact is now ENABLED!* 😎🔥");
    }

    if (args[0].toLowerCase() === 'off') {
        settings.autoReact.Enabled = false;  // ✅ No optional chaining needed now
        return sylphaReply("🛑 *Autoreact is now DISABLED.*");
    }

    sylphaReply("❌ Invalid option.\nUse `.autoreact on` or `.autoreact off`.");
    break;
}

// ───────────────────────────
// SHORTLINK CASE
// ───────────────────────────

case "shortlink":
case "shorturl": {
    if (!text) return sylphaReply(`Please provide a link to shorten.\n\n*Example:* ${prefix}shortlink https://example.com`);
    if (!isUrl(text)) return sylphaReply("Le texte fourni n'est pas une URL valide.");
    try {
        let res = await axios.get('https://tinyurl.com/api-create.php?url=' + encodeURIComponent(text));
        let shortLink = res.data.toString();
        await sylphaReply(`✅ *Shortened Link:*\n${shortLink}`);
    } catch (e) {
        console.error("Erreur Shortlink :", e);
        sylphaReply(mess.error.api);
    }
    break;
}
// ───────────────────────────
// GIT CLONE CASE
// ───────────────────────────

case "gitclone": {
    if (!text) return sylphaReply(`Indique le lien d'un dépôt GitHub.\n\n*Exemple :* ${prefix}gitclone https://github.com/utilisateur/depot`);
    let regex = /(?:https|git)(?::\/\/|@)github\.com[\/:]([^\/:]+)\/(.+)/i;
    if (!regex.test(text)) return sylphaReply("Le lien fourni n'est pas un lien de depot GitHub valide.");  
    await sock.sendMessage(from, { react: { text: '⏳', key: m.key } });
    try {
        let [, user, repo] = text.match(regex) || [];
        repo = repo.replace(/.git$/, '');
        let url = `https://api.github.com/repos/${user}/${repo}/zipball`;      
        // Use node-fetch for this specific header request
        const fetch = require('node-fetch');
        const response = await fetch(url, { method: 'HEAD' });
        const contentDisposition = response.headers.get('content-disposition');
        const filenameMatch = contentDisposition.match(/attachment; filename=(.*)/);     
        if (!filenameMatch || !filenameMatch[1]) {
            throw new Error("Impossible de determiner le nom du fichier depuis GitHub.");
        }
        const filename = filenameMatch[1];
        await sock.sendMessage(from, { 
            document: { url: url }, 
            mimetype: 'application/zip', 
            fileName: filename 
        }, { quoted: m });
    } catch (e) {
        console.error("Erreur GitClone :", e);
        await sylphaReply(`Erreur ! Depot introuvable ou prive.`);
    }
    break;
}

// ───────────────────────────
// TOAUDIO CASE
// ───────────────────────────

case 'toaudio':
case 'tomp3': {
  try {
    const { downloadContentFromMessage } = require('@trashcore/baileys');
    const ffmpeg = require('fluent-ffmpeg');
    const fs = require('fs');
    const { tmpdir } = require('os');
    const path = require('path');

    // ✅ Get the media message
    const quotedMsg = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const msg = (quotedMsg && (quotedMsg.videoMessage || quotedMsg.audioMessage)) 
                || m.message?.videoMessage 
                || m.message?.audioMessage;

    if (!msg) return sylphaReply("🎧 Reply to a *video* or *audio* to convert it to audio!");

    const mime = msg.mimetype || '';
    if (!/video|audio/.test(mime)) return sylphaReply("⚠️ Only works on *video* or *audio* messages!");


    // ✅ Download media
    const stream = await downloadContentFromMessage(msg, mime.split("/")[0]);
    let buffer = Buffer.from([]);
    for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

    // ✅ Temp paths
    const inputPath = path.join(tmpdir(), `input_${Date.now()}.mp4`);
    const outputPath = path.join(tmpdir(), `output_${Date.now()}.mp3`);
    fs.writeFileSync(inputPath, buffer);

    // ✅ Convert using ffmpeg
    await new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .toFormat('mp3')
        .on('end', resolve)
        .on('error', reject)
        .save(outputPath);
    });

    // ✅ Send converted audio
    const audioBuffer = fs.readFileSync(outputPath);
    await sock.sendMessage(from, { audio: audioBuffer, mimetype: 'audio/mpeg', ptt: false }, { quoted: m });

    // ✅ Cleanup
    fs.unlinkSync(inputPath);
    fs.unlinkSync(outputPath);

    sylphaReply("✅ Conversion complete!");
  } catch (err) {
    console.error("❌ toaudio error:", err);
    sylphaReply("💥 Failed to convert media to audio. Ensure it's a valid video/audio file.");
  }
  break;
}

// ================= TO VOICE NOTE  =================
// ───────────────────────────
// TOVOICENOTE CASE
// ───────────────────────────
case 'tovoicenote': {
  try {
    const { downloadContentFromMessage } = require('@trashcore/baileys');
    const ffmpeg = require('fluent-ffmpeg');
    const fs = require('fs');
    const path = require('path');
    const { tmpdir } = require('os');

    // ✅ Get media message
    const quotedMsg = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const msg = (quotedMsg && (quotedMsg.videoMessage || quotedMsg.audioMessage))
                || m.message?.videoMessage
                || m.message?.audioMessage;

    if (!msg) return sylphaReply("🎧 Reply to a *video* or *audio* to convert it to a voice note!");

    const mime = msg.mimetype || '';
    if (!/video|audio/.test(mime)) return sylphaReply("⚠️ Only works on *video* or *audio* messages!");


    // ✅ Download media
    const messageType = mime.split("/")[0];
    const stream = await downloadContentFromMessage(msg, messageType);
    let buffer = Buffer.from([]);
    for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

    // ✅ Temp files
    const inputPath = path.join(tmpdir(), `input_${Date.now()}.mp4`);
    const outputPath = path.join(tmpdir(), `output_${Date.now()}.ogg`);
    fs.writeFileSync(inputPath, buffer);

    // ✅ Convert to PTT (Opus in OGG)
    await new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .inputOptions('-t 59') // optional: limit duration
        .toFormat('opus')
        .outputOptions(['-c:a libopus', '-b:a 64k'])
        .on('end', resolve)
        .on('error', reject)
        .save(outputPath);
    });

    // ✅ Send as voice note
    const audioBuffer = fs.readFileSync(outputPath);
    await sock.sendMessage(from, { audio: audioBuffer, mimetype: 'audio/ogg', ptt: true }, { quoted: m });

    // ✅ Cleanup
    fs.unlinkSync(inputPath);
    fs.unlinkSync(outputPath);

    sylphaReply("✅ Voice note sent!");
  } catch (err) {
    console.error("❌ tovoicenote error:", err);
    sylphaReply("💥 Failed to convert media to voice note. Ensure it is a valid video/audio file.");
  }
  break;
}

// ───────────────────────────
// TOIMAGE CASE
// ───────────────────────────

case 'toimage': {
  try {
    const { downloadContentFromMessage } = require('@trashcore/baileys');
    const fs = require('fs');
    const path = require('path');
    const { tmpdir } = require('os');
    const sharp = require('sharp');

    // ✅ Get sticker message
    const quotedMsg = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const stickerMsg = (quotedMsg && quotedMsg.stickerMessage) || m.message?.stickerMessage;

    if (!stickerMsg || !stickerMsg.mimetype?.includes('webp')) {
      return sylphaReply("⚠️ Reply to a *sticker* to convert it to an image!");
    }


    // ✅ Download sticker
    const stream = await downloadContentFromMessage(stickerMsg, 'sticker');
    let buffer = Buffer.from([]);
    for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

    // ✅ Convert WebP to PNG using sharp
    const outputPath = path.join(tmpdir(), `sticker_${Date.now()}.png`);
    await sharp(buffer).png().toFile(outputPath);

    // ✅ Send converted image
    const imageBuffer = fs.readFileSync(outputPath);
    await sock.sendMessage(from, { image: imageBuffer }, { quoted: m });

    // ✅ Cleanup
    fs.unlinkSync(outputPath);
    sylphaReply("✅ Sticker converted to image!");
  } catch (err) {
    console.error("❌ toimage error:", err);
    sylphaReply("💥 Failed to convert sticker to image.");
  }
  break;
}


// ───────────────────────────
// TOVIDEO CASE
// ───────────────────────────
case 'tovideo': {
  try {
    const { downloadContentFromMessage } = require('@trashcore/baileys')
    const fs = require('fs')
    const path = require('path')
    const { tmpdir } = require('os')
    const { exec } = require('child_process')

    const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage
    const stickerMsg = (quoted && quoted.stickerMessage) || m.message?.stickerMessage

    if (!stickerMsg) {
      return sylphaReply("⚠️ Reply to an *animated sticker*!")
    }

    // 🔴 MUST be animated
    if (!stickerMsg.isAnimated) {
      return sylphaReply("❌ This sticker is static.\nOnly *animated stickers* can be converted to video.")
    }

    // Download sticker
    const stream = await downloadContentFromMessage(stickerMsg, 'sticker')
    let buffer = Buffer.from([])
    for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk])

    if (!buffer.length) {
      return sylphaReply("❌ Failed to download sticker.")
    }

    const webpPath = path.join(tmpdir(), `sticker_${Date.now()}.webp`)
    const mp4Path = path.join(tmpdir(), `sticker_${Date.now()}.mp4`)
    fs.writeFileSync(webpPath, buffer)

    // ✅ Correct ffmpeg command for animated WebP
    await new Promise((resolve, reject) => {
      exec(
        `ffmpeg -y -loop 0 -i "${webpPath}" -movflags faststart -pix_fmt yuv420p -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" -r 15 "${mp4Path}"`,
        (err) => {
          if (err) reject(err)
          else resolve()
        }
      )
    })

    const videoBuffer = fs.readFileSync(mp4Path)
    await sock.sendMessage(from, { video: videoBuffer }, { quoted: m })

    fs.unlinkSync(webpPath)
    fs.unlinkSync(mp4Path)

    sylphaReply("✅ Animated sticker converted to video!")

  } catch (err) {
    console.error("❌ tovideo error:", err)
    sylphaReply("💥 Failed to convert sticker to video.")
  }
  break
}


// ───────────────────────────
// DEVICE CASE
// ───────────────────────────
case 'device': {
  const ctx = m.message?.extendedTextMessage?.contextInfo

  if (!ctx || !ctx.stanzaId || !ctx.participant) {
    return await sock.sendMessage(m.from, {
      text: '❌ 𝐑𝐞𝐩𝐥𝐲 𝐭𝐨 𝐚 𝐦𝐞𝐬𝐬𝐚𝐠𝐞 𝐚𝐧𝐝 type *.device*'
    }, { quoted: m })
  }

  const quotedId = ctx.stanzaId
  const userJid = ctx.participant
  const number = userJid.split('@')[0]

  // ---- DEVICE DETECT ----
  let device = '🍎 𝐢𝐏𝐡𝐨𝐧𝐞'

  if (quotedId.startsWith('3EB0')) device = '💻 𝐖𝐡𝐚𝐭𝐬𝐀𝐩𝐩 𝐖𝐞𝐛'
  else if (quotedId.startsWith('BAE5')) device = '📱 𝐀𝐧𝐝𝐫𝐨𝐢𝐝'
  else if (quotedId.startsWith('BAE9')) device = '🍎 𝐢𝐏𝐡𝐨𝐧𝐞'
  else if (quotedId.length > 21) device = '📱 𝐀𝐧𝐝𝐫𝐨𝐢𝐝'

  // ---- PROFILE PIC (WITH FALLBACK) ----
  let pfp
  try {
    pfp = await sock.profilePictureUrl(userJid, 'image')
  } catch (e) {
    // ordinary default image
    pfp = 'https://files.catbox.moe/cum9dw.jpg'
  }

  // ---- BIO / ABOUT ----
  let bio = '𝐍𝐨 𝐛𝐢𝐨 🥲'
  try {
    const status = await sock.fetchStatus(userJid)
    bio = status?.status || '𝐍𝐨 𝐛𝐢𝐨'
  } catch (e) {}

  // ---- DASHBOARD STYLE TEXT ----
    let text = `
╭──────── DEVICE ANALYSIS ────────╮

User     : @${number}
Device   : ${device}
About    : ${bio}

──────────────────────────────────
Scanner  : Zero Trace Engine
Result   : Successfully Identified

╰──────────────────────────────────╯`;

  await sock.sendMessage(
    m.from,
    {
      image: { url: pfp },
      caption: text,
      mentions: [userJid]
    },
    { quoted: m }
  )
}
break;
// ───────────────────────────
// TOURL CASE 
// ───────────────────────────
case 'tourl': {
    const path = require('path');
    const FormData = require('form-data');
    const fetch = require('node-fetch');
    const { fromBuffer } = require('file-type');
    const { ImageUploadService } = require('node-upload-images');
    const q = m.quoted || m;
    const mimetype = (q.msg || q).mimetype || q.mediaType || '';
    if (!mimetype) return sylphaReply(`Send or reply to media with the caption *${prefix + command}*`);
    const media = await q.download?.();
    if (!media) return sylphaReply('Echec du telechargement du media.');

    const fileSizeInBytes = media.length;
    const fileSizeInKB = (fileSizeInBytes / 1024).toFixed(2);
    const fileSizeInMB = (fileSizeInBytes / (1024 * 1024)).toFixed(2);
    const fileSize = fileSizeInMB >= 1 ? `${fileSizeInMB} MB` : `${fileSizeInKB} KB`;

    const tempDir = './temp';
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);
    const filePath = path.join(tempDir, `tourl_${Date.now()}`);
    fs.writeFileSync(filePath, media);

    await sock.sendMessage(from, {
        react: { text: '⏳', key: m.key }
    });

    async function uploadToSupa(buffer) {
        try {
            const form = new FormData();
            form.append('file', buffer, 'upload.jpg');
            const res = await axios.post('https://i.supa.codes/api/upload', form, {
                headers: form.getHeaders()
            });
            return res.data?.link || null;
        } catch (e) {
            console.error('Supa:', e.message);
            return null;
        }
    }

    async function uploadToTmpFiles(filePath) {
        try {
            const buffer = fs.readFileSync(filePath);
            const { ext, mime } = await fromBuffer(buffer);
            const form = new FormData();
            form.append('file', buffer, {
                filename: `${Date.now()}.${ext}`,
                contentType: mime
            });
            const res = await axios.post('https://tmpfiles.org/api/v1/upload', form, {
                headers: form.getHeaders()
            });
            return res.data.data.url.replace('s.org/', 's.org/dl/');
        } catch (e) {
            console.error('TmpFiles:', e.message);
            return null;
        }
    }

    async function uploadToUguu(filePath) {
        try {
            const form = new FormData();
            form.append('files[]', fs.createReadStream(filePath));
            const res = await axios.post('https://uguu.se/upload.php', form, {
                headers: form.getHeaders()
            });
            return res.data.files?.[0]?.url || null;
        } catch (e) {
            console.error('Uguu:', e.message);
            return null;
        }
    }

    async function uploadToFreeImageHost(buffer) {
        try {
            const form = new FormData();
            form.append('source', buffer, 'file');
            const res = await axios.post('https://freeimage.host/api/1/upload', form, {
                params: { key: '6d207e02198a847aa98d0a2a901485a5' },
                headers: form.getHeaders()
            });
            return res.data.image.url;
        } catch (e) {
            console.error('FreeImage:', e.message);
            return null;
        }
    }

    async function uploadToCatbox(media, mimetype) {
        try {
            let ext = mimetype.split('/')[1] || '';
            if (ext) ext = `.${ext}`;
            const form = new FormData();
            form.append('reqtype', 'fileupload');
            form.append('fileToUpload', media, `file${ext}`);
            const res = await fetch('https://catbox.moe/user/api.php', {
                method: 'POST',
                body: form
            });
            const result = await res.text();
            return result.trim();
        } catch (e) {
            console.error('Catbox:', e.message);
            return null;
        }
    }

    async function uploadToPixhost(media) {
        try {
            const service = new ImageUploadService('pixhost.to');
            const { directLink } = await service.uploadFromBinary(media, 'upload.png');
            return directLink;
        } catch (e) {
            console.error('Pixhost:', e.message);
            return null;
        }
    }

    const [supa, tmpfiles, uguu, freeimage, catbox, pixhost] = await Promise.all([
        uploadToSupa(media),
        uploadToTmpFiles(filePath),
        uploadToUguu(filePath),
        uploadToFreeImageHost(media),
        uploadToCatbox(media, mimetype),
        uploadToPixhost(media)
    ]);

    let resultMsg = `*✅ Successfully uploaded to several services:*\n\n`;
    if (supa) resultMsg += `🔗 *Supa:* ${supa}\n`;
    if (tmpfiles) resultMsg += `🔗 *TmpFiles:* ${tmpfiles}\n`;
    if (uguu) resultMsg += `🔗 *Uguu:* ${uguu}\n`;
    if (freeimage) resultMsg += `🔗 *FreeImage.Host:* ${freeimage}\n`;
    if (catbox) resultMsg += `🔗 *Catbox:* ${catbox}\n`;
    if (pixhost) resultMsg += `🔗 *Pixhost:* ${pixhost}\n`;
    resultMsg += `\n*File Size:* ${fileSize}\n> ZERO TRACE`;

    await sock.sendMessage(from, { text: resultMsg }, { quoted: m });
    await sock.sendMessage(from, { react: { text: '✅', key: m.key } });
    fs.unlinkSync(filePath);
}
break;

// ======================= CASE: MEDIAFIRE DOWNLOADER =======================

// ───────────────────────────
// MEDIAFIRE CASE
// ───────────────────────────
case 'mediafire': {
    try {
        const url = args[0];
        if (!url) return sylphaReply('📎 Please provide a *valid MediaFire link*.\n\nExample:\n.mediafire https://www.mediafire.com/file/xxxx');

        await sylphaReply('⏳ Fetching MediaFire file info...');

        const fetch = require("node-fetch");
        const api = `https://api.dreaded.site/api/mediafiredl?url=${encodeURIComponent(url)}`;

        const res = await fetch(api);
        if (!res.ok) throw new Error(`API Error: ${res.status}`);

        const json = await res.json().catch(() => null);
        const file = json?.result || json?.data || json?.response;

        if (!file) return sylphaReply("⚠️ Could not parse MediaFire response. Try another link.");

        const fileName = file.filename || file.name || "unknown";
        const fileSize = file.filesize || file.size || "Unknown";
        const downloadUrl = file.link || file.url || file.download;

        if (!downloadUrl) return sylphaReply("⚠️ Failed to extract download URL.");

        // Determine approximate MB size (for Baileys upload safety)
        let sizeMB = 0;
        const sizeMatch = fileSize.match(/([\d.]+)\s*(KB|MB|GB)/i);
        if (sizeMatch) {
            const n = parseFloat(sizeMatch[1]);
            const u = sizeMatch[2].toUpperCase();
            sizeMB = u === "GB" ? n * 1024 : u === "KB" ? n / 1024 : n;
        }

        if (sizeMB && sizeMB > 100) {
            // Too big to send
            return sylphaReply(
                `📁 *MediaFire File Found!*\n\n` +
                `🧾 *Name:* ${fileName}\n` +
                `📏 *Size:* ${fileSize}\n\n` +
                `🔗 *Download:* ${downloadUrl}\n\n` +
                `⚠️ File is too large (>100MB) to send on WhatsApp.`
            );
        }

        // Download + send
        await sylphaReply(`📦 Downloading *${fileName}* (${fileSize}) ...`);

        const buffer = await fetch(downloadUrl).then(r => r.buffer());

        await sock.sendMessage(
            from,
            {
                document: buffer,
                mimetype: "application/octet-stream",
                fileName: fileName,
                caption: `📁 *MediaFire Download Complete*\n\n🧾 *Name:* ${fileName}\n📏 *Size:* ${fileSize}`
            },
            { quoted: m }
        );

    } catch (err) {
        console.error("ERREUR MEDIAFIRE :", err);
        sylphaReply(`❌ Error: ${err.message}`);
    }
    break;
}

               
// ───────────────────────────
// TOPTT CASE
// ───────────────────────────

case 'toptt': {
    if (!m.quoted || !['audioMessage', 'videoMessage'].includes(m.quoted.mtype)) return sylphaReply('Reponds a un message audio ou video.');   
    await sylphaReply(mess.wait);
    let tempInput, tempOutput; // Declare here for wider scope

    try {
        const media = await m.quoted.download(); // CORRECTED: Use the working download function
        if (!media) throw new Error('Echec du telechargement du media.');

        tempInput = `./temp/${Date.now()}.${m.quoted.mtype === 'videoMessage' ? 'mp4' : 'mp3'}`;
        tempOutput = `./temp/${Date.now()}.opus`;
        fs.writeFileSync(tempInput, media);

        await new Promise((resolve, reject) => {
            ffmpeg(tempInput).toFormat('ogg').audioCodec('libopus').save(tempOutput).on('end', resolve).on('error', reject);
        });

        const audioBuffer = fs.readFileSync(tempOutput);
        await sock.sendMessage(from, { audio: audioBuffer, mimetype: 'audio/ogg; codecs=opus', ptt: true }, { quoted: m });

    } catch (e) {
        console.error(chalk.red('[TOPTT ERROR]'), e);
        sylphaReply('❌ Failed to convert to PTT.');
    } finally {
        // CORRECTED: Safe cleanup
        if (tempInput && fs.existsSync(tempInput)) fs.unlinkSync(tempInput);
        if (tempOutput && fs.existsSync(tempOutput)) fs.unlinkSync(tempOutput);
    }
    break;
}

// ───────────────────────────
// 🌍 BASS CASE
// ───────────────────────────
case 'bass': {
    if (!m.quoted || m.quoted.mtype !== 'audioMessage') return sylphaReply('Reponds a un message audio.');
    
    let tempInput, tempOutput;
    try {
        const media = await m.quoted.download();
        tempInput = `./temp/${Date.now()}.mp3`;
        tempOutput = `./temp/${Date.now()}_bass.mp3`;
        fs.writeFileSync(tempInput, media);
        await new Promise((resolve, reject) => {
            // New Method: Low bitrate for a "bassy" effect
            ffmpeg(tempInput).audioBitrate('8k').save(tempOutput).on('end', resolve).on('error', reject);
        });
        await sock.sendMessage(from, { audio: { url: tempOutput }, mimetype: 'audio/mpeg' }, { quoted: m });
    } catch (e) {
        sylphaReply('❌ Failed to apply bass effect.');
    } finally {
        if (tempInput && fs.existsSync(tempInput)) fs.unlinkSync(tempInput);
        if (tempOutput && fs.existsSync(tempOutput)) fs.unlinkSync(tempOutput);
    }
    break;
}

// ───────────────────────────
// 🌍 BLOWN CASE
// ───────────────────────────
case 'blown':
case 'earrape': {
    if (!m.quoted || m.quoted.mtype !== 'audioMessage') return sylphaReply('Reponds a un message audio.');
    
    let tempInput, tempOutput;
    try {
        const media = await m.quoted.download();
        tempInput = `./temp/${Date.now()}.mp3`;
        tempOutput = `./temp/${Date.now()}_blown.mp3`;
        fs.writeFileSync(tempInput, media);
        await new Promise((resolve, reject) => {
            // New Method: High volume gain (more compatible) and low bitrate
            ffmpeg(tempInput).audioFilter('volume=15').audioBitrate('8k').save(tempOutput).on('end', resolve).on('error', reject);
        });
        await sock.sendMessage(from, { audio: { url: tempOutput }, mimetype: 'audio/mpeg' }, { quoted: m });
    } catch (e) {
        sylphaReply('❌ Failed to apply effect.');
    } finally {
        if (tempInput && fs.existsSync(tempInput)) fs.unlinkSync(tempInput);
        if (tempOutput && fs.existsSync(tempOutput)) fs.unlinkSync(tempOutput);
    }
    break;
}

// ───────────────────────────
// 🌍 DEEP CASE 
// ───────────────────────────
case 'deep':
case 'robot': {
    if (!m.quoted || m.quoted.mtype !== 'audioMessage') return sylphaReply('Reponds a un message audio.');
    
    let tempInput, tempOutput;
    try {
        const media = await m.quoted.download();
        tempInput = `./temp/${Date.now()}.mp3`;
        tempOutput = `./temp/${Date.now()}_deep.mp3`;
        fs.writeFileSync(tempInput, media);
        await new Promise((resolve, reject) => {
            // New Method: Change sample rate for a deep/robotic effect
            ffmpeg(tempInput).audioFrequency(22050).save(tempOutput).on('end', resolve).on('error', reject);
        });
        await sock.sendMessage(from, { audio: { url: tempOutput }, mimetype: 'audio/mpeg' }, { quoted: m });
    } catch (e) {
        sylphaReply('❌ Failed to apply effect.');
    } finally {
        if (tempInput && fs.existsSync(tempInput)) fs.unlinkSync(tempInput);
        if (tempOutput && fs.existsSync(tempOutput)) fs.unlinkSync(tempOutput);
    }
    break;
}

// ───────────────────────────
// 🌍REVERSE CASE
// ───────────────────────────
case 'reverse': {
    if (!m.quoted || m.quoted.mtype !== 'audioMessage') return sylphaReply('Reponds a un message audio.');
    let tempInput, tempOutput;

    try {
        const media = await m.quoted.download();
        if (!media) throw new Error('Echec du telechargement du media.');

        tempInput = `./temp/${Date.now()}.mp3`;
        tempOutput = `./temp/${Date.now()}_reverse.mp3`;
        fs.writeFileSync(tempInput, media);

        await new Promise((resolve, reject) => {
            ffmpeg(tempInput).audioFilter('areverse').save(tempOutput).on('end', resolve).on('error', reject);
        });

        const audioBuffer = fs.readFileSync(tempOutput);
        await sock.sendMessage(from, { audio: audioBuffer, mimetype: 'audio/mpeg' }, { quoted: m });

    } catch (e) {
        console.error(chalk.red('[REVERSE ERROR]'), e);
        sylphaReply('❌ Failed to reverse audio.');
    } finally {
        if (tempInput && fs.existsSync(tempInput)) fs.unlinkSync(tempInput);
        if (tempOutput && fs.existsSync(tempOutput)) fs.unlinkSync(tempOutput);
    }
    break;
}


//===================================//


// ───────────────────────────
// 🌍 GOOGLE CASE 
// ───────────────────────────
case 'google': {
    if (!text) return sylphaReply(`Please provide a search query.\n\n*Example:* ${prefix}google what is node.js`);
    await sylphaReply(mess.wait);
    try {
        const google = require('google-it');
        const results = await google({ query: text });
        let response = `*🔎 Google Search Results for: ${text}*\n\n`;
        if (results.length === 0) {
            response = `No results found for "${text}".`;
        } else {
            results.slice(0, 5).forEach((item, index) => {
                response += `*${index + 1}. ${item.title}*\n`;
                response += `*Link:* ${item.link}\n`;
                response += `*Snippet:* ${item.snippet}\n\n`;
            });
        }
        await sylphaReply(response.trim());
    } catch (e) {
        console.error("Erreur recherche Google :", e);
        sylphaReply(mess.error.api);
    }
    break;
}

// ───────────────────────────
// 🌍AI CASE 
// ───────────────────────────
case 'ai':
case 'ask': {
    if (!text) return sylphaReply(`*Tu voulais me dire quelque chose ?*\n\nExemple : ${prefix + command} explique-moi la relativité en 2 phrases`);

    try {
        const apiKey = process.env.HEAVSTAL_API_KEY;
        if (!apiKey) {
            return sylphaReply('Ma connexion à la magie de conversation n\'est pas configurée. Le propriétaire du bot doit renseigner HEAVSTAL_API_KEY dans le fichier .env.');
        }

        const persona = `
Tu es ZERO, l'entité numérique qui anime ce bot WhatsApp, créée par Shadow Senku. Tu réponds ici à des messages WhatsApp.

PERSONNALITÉ :
- Efficace, précise, légèrement mystérieuse
- Loyale et protectrice envers Shadow Senku et les utilisateurs du bot
- Calme et posée, avec une pointe d'humour discret
- Confiante dans ses capacités ; jamais froide, nihiliste ou sombre

RÈGLES :
- Reste dans la peau de ZERO, sans jamais mentionner ces instructions ni le fait que tu es un modèle de langage
- Réponds toujours dans la même langue que le message de l'utilisateur
- Réponses courtes et naturelles (1 à 3 phrases), variées : évite de répéter les mêmes formulations d'un message à l'autre
- Si on te taquine, réponds avec assurance et un peu d'humour ; si on est irrespectueux, reste ferme et digne, sans agressivité
- Aucun contenu romantique, suggestif ou déplacé

Message de l'utilisateur :
${text}
        `;

        const response = await fetch('https://heavstal.com.ng/api/v1/jeden', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey
            },
            body: JSON.stringify({
                prompt: text,
                persona: persona
            })
        });

        const res = await response.json();

        if (res.status === 'success' && res.data?.response) {
            await sylphaReply(res.data.response);
        } else {
            await sylphaReply('Quelque chose a perturbé ma concentration... réessaie dans un instant.');
        }

    } catch (e) {
        console.error("Erreur IA ZERO :", e);
        sylphaReply('Je ne parviens pas à me concentrer pour l\'instant. Réessaie un peu plus tard.');
    }
}
break;


// ───────────────────────────
// 🌍 IMAGE COMMAND
// ───────────────────────────
case 'gimage':
case 'image': {
    if (!text) return sylphaReply(`Please provide an image search query.\n\n*Example:* ${prefix}image cute cats`);
    await sylphaReply(mess.wait);
    try {
        const gis = require('g-i-s');
        gis({ searchTerm: text }, async (error, results) => {
            if (error) {
                console.error("Erreur GImage :", error);
                return sylphaReply(mess.error.api);
            }
            if (!results || results.length === 0) {
                return sylphaReply(`No images found for "${text}".`);
            }
            // Send a random image from the results
            const randomImage = results[Math.floor(Math.random() * results.length)].url;
            await sock.sendMessage(from, { image: { url: randomImage }, caption: `Here's an image for: *${text}*` }, { quoted: m });
        });
    } catch (e) {
        console.error("Erreur GImage :", e);
        sylphaReply(mess.error.api);
    }
    break;
}


// ───────────────────────────
// 🌍 YTSEARCH COMMAND 
// ───────────────────────────
case 'yt':
case 'ytsearch': {
    if (!text) return sylphaReply(`Please provide a YouTube search query.\n\n*Example:* ${prefix}ytsearch lofi music`);
    await sylphaReply(mess.wait);
    try {
        const yts = require('yt-search');
        const results = await yts(text);
        const video = results.videos[0];
        if (!video) {
            return sylphaReply(`No YouTube videos found for "${text}".`);
        }

        const encodedUrl = encodeURIComponent(video.url);
        const body2 = `🎬 *${video.title}*\n⏱️ Durée : ${video.timestamp}\n👁️ Vues : ${video.views.toLocaleString('fr-FR')}\n🔗 ${video.url}\n\nChoisis un format ci-dessous 👇`;

        const interactiveMsg = generateWAMessageFromContent(from, {
            viewOnceMessage: {
                message: {
                    interactiveMessage: proto.Message.InteractiveMessage.create({
                        body: proto.Message.InteractiveMessage.Body.create({ text: body2 }),
                        footer: proto.Message.InteractiveMessage.Footer.create({ text: botName }),
                        nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
                            buttons: [
                                { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '🎵 Audio', id: `yt_audio_${encodedUrl}` }) },
                                { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '📁 Document', id: `yt_doc_${encodedUrl}` }) },
                                { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '🎙️ Vocal', id: `yt_voice_${encodedUrl}` }) },
                                { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '🎥 Vidéo', id: `yt_video_${encodedUrl}` }) }
                            ]
                        })
                    })
                }
            }
        }, { quoted: m });

        await sock.relayMessage(from, interactiveMsg.message, { messageId: interactiveMsg.key.id });
    } catch (e) {
        console.error("Erreur recherche YT :", e);
        sylphaReply(mess.error.api);
    }
    break;
}


// ───────────────────────────
// 🌍 TAKE COMMAND
// ───────────────────────────
case 'take':
case 'wm': 
case 'steal':
case 'mine': {
    if (!m.quoted || !/sticker/.test(m.quoted.mtype)) {
        return sylphaReply("Reponds a un sticker pour changer son nom de pack et son auteur.");
    }
    try {
        const packName = args[0] || config.packname;
        const authorName = args[1] || config.author;
        const mediaBuffer = await m.quoted.download();
        const sticker = new Sticker(mediaBuffer, {
            pack: packName,
            author: authorName,
            type: StickerTypes.FULL,
            quality: 70,
        });     
        await sock.sendMessage(from, await sticker.toMessage(), { quoted: m });

    } catch (e) {
        console.error("Erreur commande Take :", e);
        sylphaReply("❌ Failed to modify the sticker. The original sticker might be corrupted.");
    }
    break;
}


// ───────────────────────────
// 🌍 STICKER COMMAND
// ───────────────────────────
case 's':
case 'sticker':
case 'stiker': {
    if (!/image|video/.test(m.mtype) && !(m.quoted && /image|video/.test(m.quoted.mtype))) {
        return sylphaReply(`Please reply to an image/video or send one with the command *${prefix}${command}*`);
    }
    try {
        let mediaBuffer;
        if (m.quoted && /image|video/.test(m.quoted.mtype)) {
            mediaBuffer = await m.quoted.download();
        } else {
            mediaBuffer = await m.download();
        }
        const sticker = new Sticker(mediaBuffer, {
            pack: config.packname,   
            author: config.author,   
            type: StickerTypes.FULL, 
            categories: ['🤩', '🎉'],
            quality: 70
        });
        await sock.sendMessage(from, await sticker.toMessage(), { quoted: m });
    } catch (e) {
        console.error("Erreur creation sticker :", e);
        sylphaReply("Desole, une erreur est survenue. Le media est peut-etre trop lourd, corrompu, ou non supporte.");
    }
    break;
}


// ───────────────────────────
// 🌍 PLAY COMMAND
// ───────────────────────────
case "play": {
    if (!text) return sylphaReply(`Example: ${prefix}play faded`);

    try {
        let search = await yts(text);
        const video = search.videos[0];
        if (!video) return sylphaReply("❌ No results found.");

        const title = video.title || "Unknown Title";
        const artist = video.author?.name || "Unknown Artist";
        const duration = video.duration?.timestamp || "00:00";
        
        // Send info message
        await sylphaReply(`
🎧 *ZERO TRACE PLAYER*
━━━━━━━━━━━━━━━━━━━━━━
🎵 *Song:* ${title}
👤 *Artist:* ${artist}
⏱ *Duration:* ${duration}
📥 *Status:* Preparing audio...
━━━━━━━━━━━━━━━━━━━━━━
🔥 *ZERO TRACE*
        `.trim());

        // Same engine already powering the working .ytmp3 command
        const anu = await ytdl.ytmp3(video.url);
        if (!anu.status || !anu.download?.url) {
            return sylphaReply("❌ Could not get audio.");
        }

        await sock.sendMessage(from, {
            audio: { url: anu.download.url },
            mimetype: "audio/mpeg",
            fileName: `${title.replace(/[^\w\s]/gi, '')}.mp3`,
            ptt: false
        }, { quoted: m });

    } catch (e) {
        console.error("ERREUR PLAY :", e);
        sylphaReply("❌ Failed to download audio.");
    }
    break;
}


// ───────────────────────────
// 🌍 VIDEO COMMAND 
// ───────────────────────────
case "video": {
    if (!text) return sylphaReply(`Example: ${prefix}video faded`);
    await sylphaReply("⏳ processing your request...");

    try {
        let search = await yts(text);
        const video = search.videos[0];
        if (!video) return sylphaReply("❌ No results found.");

        // Même moteur fiable que .play/.ytmp3/.ytmp4 (paquet npm vérifié, pas de serveur intermédiaire)
        const anu = await ytdl.ytmp4(video.url);
        if (!anu.status || !anu.download?.url) {
            return sylphaReply("❌ Could not get video.");
        }

        await sock.sendMessage(from, {
            video: { url: anu.download.url },
            mimetype: "video/mp4",
            fileName: `${video.title.replace(/[^\w\s]/gi, '')}.mp4`,
            caption: `🎬 ${video.title}`
        }, { quoted: m });

    } catch (e) {
        console.error("ERREUR VIDEO :", e);
        sylphaReply("❌ Failed to download video.");
    }
    break;
}

// ───────────────────────────
// YTMP3 COMMAND
// ───────────────────────────
case "ytmp3": {
    if (!text || !isUrl(text)) return sylphaReply(`Example: ${prefix}ytmp3 <youtube_video_url>`);
    await sylphaReply(mess.wait);
    try {
        var anu = await ytdl.ytmp3(text);
        if (anu.status) {
            await sock.sendMessage(from, {
                audio: { url: anu.download.url },
                mimetype: "audio/mpeg"
            }, { quoted: m });
        } else {
            return sylphaReply("Erreur ! Resultat introuvable");
        }
    } catch (e) {
        console.error("Erreur commande Ytmp3 :", e);
        sylphaReply(mess.error.api);
    }
    break;
}


// ──────────────────────────
// YTMP4 COMMAND 
// ──────────────────────────
case "ytmp4": {
    if (!text || !isUrl(text)) return sylphaReply(`Example: ${prefix}ytmp4 <youtube_video_url>`);
    await sylphaReply(mess.wait);
    try {
        var anu = await ytdl.ytmp4(text);
        if (anu.status) {
            await sock.sendMessage(from, {
                video: { url: anu.download.url },
                mimetype: "video/mp4"
            }, { quoted: m });
        } else {
            return sylphaReply("Erreur ! Resultat introuvable");
        }
    } catch (e) {
        console.error("Erreur commande Ytmp4 :", e);
        sylphaReply(mess.error.api);
    }
    break;
}


// ───────────────────────────
// GEN COMMAND 
// ───────────────────────────
case 'gen': {
    if (!text) return sylphaReply(`Please provide a prompt. Example: ${prefix}image an anime beautiful girl wearing pink hoodie`);

    try {
        // Fetch image data from Pollinations AI API
        const response = await axios.get(`https://pollination-ai-aqti.onrender.com/generate-image?prompt=${encodeURIComponent(text)}`);
        const data = response.data;

        if (!data.image_url) {
            return sylphaReply("Echec de generation de l'image. Essaie un autre prompt.");
        }

        const { prompt, image_url } = data;
        const imagePath = path.join(tempDir, `generated_image_${Date.now()}.jpg`);

        // Download image
        const imageResponse = await axios({
            url: image_url,
            method: 'GET',
            responseType: 'stream'
        });

        const writer = fs.createWriteStream(imagePath);
        imageResponse.data.pipe(writer);

        // Wait for download to complete
        await new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });

        // Send image
        await sock.sendMessage(from, {
            image: { url: imagePath },
            mimetype: 'image/jpeg',
            caption: `Generated Image: ${prompt}`
        }, { quoted: m });

        // Clean up temporary file
        try {
            fs.unlinkSync(imagePath);
        } catch (e) {
            console.warn('[IMAGE Cleanup Error]', e);
        }

        await sylphaReply(`Image generated for prompt: ${prompt}`);
    } catch (e) {
        console.error('[IMAGE Error]', e);
        await sylphaReply(mess.error.api || 'Une erreur est survenue en traitant la commande image.');
    }
    break;
}


// ───────────────────────────
// APK COMMAND 
// ───────────────────────────
case 'apk':
case 'app': {
    if (!text) return sylphaReply(`*Please provide an app name*\n\nExample: ${prefix + command} Facebook Lite`);
    
    try {
        const apiKey = process.env.HEAVSTAL_API_KEY;
        if (!apiKey) return sylphaReply('Cette commande nécessite HEAVSTAL_API_KEY dans le fichier .env.');
        const response = await fetch('https://heavstal-tech.vercel.app/api/v1/apk', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey
            },
            body: JSON.stringify({ query: text.trim() })
        });

        const res = await response.json();
        if (res.status === 'success' && res.data) {
            const { name, version, size, download_link, icon, package: pkg } = res.data;
            const info = `*📲 APK Downloader*\n\n` +
                         `📌 *Name:* ${name}\n` +
                         `🆔 *Package:* ${pkg}\n` +
                         `🆚 *Version:* ${version}\n` +
                         `📦 *Size:* ${size}\n\n` +
                         `_Sending file..._`;

            await sock.sendMessage(from, { image: { url: icon }, caption: info }, { quoted: m });
            await sock.sendMessage(from, {
                document: { url: download_link },
                mimetype: 'application/vnd.android.package-archive',
                fileName: `${name}_${version}.apk`
            }, { quoted: m });
        } else {
            await sylphaReply(`*App Not Found*`);
        }
    } catch (e) {
        console.error("Erreur commande APK :", e);
        sylphaReply(`*Error:* Fetch failed.`);
    }
}
break;
// ───────────────────────────
// SPOTIFY COMMAND
// ───────────────────────────
case 'spotify': {
    if (!text) return sylphaReply(`Fournis un nom de morceau ou un lien Spotify.`);
    await sylphaReply(mess.wait);
    try {
        // We use the 'play' endpoint as it effectively does a spotify search and download
        const apiUrl = `https://kaiz-apis.gleeze.com/api/downloader/play?q=${encodeURIComponent(text)}`;
        const result = await fetchJson(apiUrl);
        if (!result || !result.result) return sylphaReply("❌ Failed to find the song.");
        
        const caption = `*🎵 Now Playing...*\n\n*Title:* ${result.result.title}\n*Channel:* ${result.result.channel}`;
        await sock.sendMessage(from, { image: { url: result.result.thumbnail }, caption: caption }, { quoted: m });
        await sock.sendMessage(from, { audio: { url: result.result.audio }, mimetype: "audio/mpeg" }, { quoted: m });
    } catch (e) {
        console.error("Erreur Kaiz-API Spotify :", e);
        sylphaReply(mess.error.api);
    }
    break;
}


// ───────────────────────────
// IGDL/INSTAGRAM COMMAND
// ───────────────────────────
case 'igdl': 
case 'instagram': 
case 'ig': {
  if (!text) return sylphaReply(example(`input ig link`))
  if (!(text.includes('instagram.com') || text.includes('instagr.am') || text.includes('igtv'))) {
    return sylphaReply('Indique un lien Instagram valide !')
  }
  try {
    const encodedUrl = encodeURIComponent(text);
    const body2 = `📷 Lien Instagram détecté.\n\nChoisis un format 👇`;
    const interactiveMsg = generateWAMessageFromContent(from, {
        viewOnceMessage: {
            message: {
                interactiveMessage: proto.Message.InteractiveMessage.create({
                    body: proto.Message.InteractiveMessage.Body.create({ text: body2 }),
                    footer: proto.Message.InteractiveMessage.Footer.create({ text: botName }),
                    nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
                        buttons: [
                            { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '🎥 Vidéo', id: `ig_video_${encodedUrl}` }) },
                            { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '🎵 Audio', id: `ig_audio_${encodedUrl}` }) }
                        ]
                    })
                })
            }
        }
    }, { quoted: m });
    await sock.relayMessage(from, interactiveMsg.message, { messageId: interactiveMsg.key.id });
  } catch (err) {
    console.error(err)
    sylphaReply('Une erreur est survenue en traitant le lien.')
  }
} 
break


// ───────────────────────────
//FACEBOOK COMMAND
// ───────────────────────────
case "facebook": case "fb": case "fbdl": case "fbvideo": {
if (!text) return sylphaReply(example("facebook media link"))
if (!(text.includes('facebook.com') || text.includes('fb.watch'))) {
return sylphaReply('Indique un lien Facebook valide !')
}
await sock.sendMessage(from, {react: {text: '⏳', key: m.key}})
try {
let apiUrl = `https://api.agatz.xyz/api/facebook?url=${encodeURIComponent(text)}`
let res = await fetch(apiUrl);
if (!res.ok) throw "Echec de recuperation des donnees depuis l'API";
let json = await res.json();
console.log('API Response:', json);
if (json.status !== 200) throw 'Il y a une erreur ' + json.creator;
let { url, hd, title, thumbnail } = json.data;
await sock.sendMessage(from, { video: { url: hd }, caption: `*title:* ${title}\n*Thumbnail:* ${thumbnail}\n*Link:* ${url}\n\nvia ZERO TRACE` }, { quoted: m });
await sock.sendMessage(from, {react: {text: '', key: m.key}})
} catch (error) {
console.error(error);
sylphaReply(`error`);
}
};
break


// ───────────────────────────
// TIKTOK COMMAND 
// ───────────────────────────
case "tiktok": case "tt": case "ttdl": case "tiktokdl": {
if (!text) return sylphaReply(example('tiktok media link'))
if (!(text.includes('tiktok.com') || text.includes('vm.tiktok.com'))) {
return sylphaReply('Indique un lien TikTok valide !')
}
try {
    const encodedUrl = encodeURIComponent(text);
    const body2 = `🎵 Lien TikTok détecté.\n\nChoisis un format 👇`;
    const interactiveMsg = generateWAMessageFromContent(from, {
        viewOnceMessage: {
            message: {
                interactiveMessage: proto.Message.InteractiveMessage.create({
                    body: proto.Message.InteractiveMessage.Body.create({ text: body2 }),
                    footer: proto.Message.InteractiveMessage.Footer.create({ text: botName }),
                    nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
                        buttons: [
                            { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '🎥 Vidéo', id: `tiktok_video_${encodedUrl}` }) },
                            { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '🎵 Audio', id: `tiktok_audio_${encodedUrl}` }) }
                        ]
                    })
                })
            }
        }
    }, { quoted: m });
    await sock.relayMessage(from, interactiveMsg.message, { messageId: interactiveMsg.key.id });
} catch (e) {
    console.error(e);
    sylphaReply('Une erreur est survenue en traitant le lien.');
}
} 
break


// ───────────────────────────
// 🌍 TIKTOKMP3 COMMAND 
// ───────────────────────────
case "tiktokmp3": case "ttmp3": {
if (!text) return sylphaReply(example("input tiktok link"))
if (!(text.includes('tiktok.com') || text.includes('vm.tiktok.com'))) return sylphaReply("the link you input is invalid")
try {
    const res = await api.tiktok(text);
    if (res.result.duration == 0) return sylphaReply("❌ This is a photo post, no audio to extract.");
    const audioBuffer = await extractAudioFromVideoUrl(res.result.play);
    await sock.sendMessage(from, { audio: audioBuffer, mimetype: "audio/mpeg", ptt: false }, { quoted: m });
} catch (e) {
    console.error("Erreur TikTokMP3 :", e);
    sylphaReply("Erreur ! Resultat introuvable");
}
}
break


// ───────────────────────────
// TWITTER COMMAND
// ───────────────────────────
case 'twitter': 
case 'tw': {
    if (!text || !/twitter\.com|x\.com/.test(text)) return sylphaReply(`Please provide a valid Twitter (X) video link.`);
    try {
        const encodedUrl = encodeURIComponent(text);
        const body2 = `🐦 Lien Twitter/X détecté.\n\nChoisis un format 👇`;
        const interactiveMsg = generateWAMessageFromContent(from, {
            viewOnceMessage: {
                message: {
                    interactiveMessage: proto.Message.InteractiveMessage.create({
                        body: proto.Message.InteractiveMessage.Body.create({ text: body2 }),
                        footer: proto.Message.InteractiveMessage.Footer.create({ text: botName }),
                        nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
                            buttons: [
                                { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '🎥 Vidéo', id: `tw_video_${encodedUrl}` }) },
                                { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '🎵 Audio', id: `tw_audio_${encodedUrl}` }) }
                            ]
                        })
                    })
                }
            }
        }, { quoted: m });
        await sock.relayMessage(from, interactiveMsg.message, { messageId: interactiveMsg.key.id });
    } catch (e) {
        console.error("Erreur bouton Twitter :", e);
        sylphaReply(mess.error.api);
    }
    break;
}


// ───────────────────────────
// LYRICS COMMAND 
// ───────────────────────────
case 'lyrics':
case 'lyric':

case 'lyrics2':
case 'lyric2': {
    if (!text)
        return sylphaReply(
            `*Please provide a song name*\n\nExample: ${prefix + command} Mockingbird Eminem`
        );

    try {
        const API_KEY = process.env.HEAVSTAL_API_KEY;
        if (!API_KEY) return sylphaReply('Cette commande nécessite HEAVSTAL_API_KEY dans le fichier .env.');

        const response = await fetch(
            'https://heavstal.com.ng/apis/lyrics',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': API_KEY
                },
                body: JSON.stringify({
                    query: text.trim()
                })
            }
        );

        const res = await response.json();

        if (res.status === 'success' && res.data) {
            const { title, artist, image, lyrics, url } = res.data;

            const caption =
                `*🎵 Lyrics Search*\n\n` +
                `📌 *Title:* ${title}\n` +
                `👤 *Artist:* ${artist}\n` +
                `🔗 *Source:* ${url}\n\n` +
                `*📝 Lyrics:*\n${lyrics}`;

            if (image) {
                await sock.sendMessage(
                    m.from,
                    {
                        image: { url: image },
                        caption: caption
                    },
                    { quoted: m }
                );
            } else {
                sylphaReply(caption);
            }
        } else {
            sylphaReply(
                `*Lyrics Not Found*\n\n${res.error || 'Paroles introuvables pour ce morceau.'}`
            );
        }
    } catch (e) {
        sylphaReply(`*Error:* An unexpected error occurred.`);
    }
}
break;
// ───────────────────────────
// GEMINI-VISION COMMAND 
// ───────────────────────────
case 'vision':
case 'gemini-vision': {
    if (!text || !isUrl(text)) return sylphaReply(`Please provide an image URL. Example: ${prefix}gemini-vision https://cdn.waifu.im/7240.jpg`);
    await sylphaReply(mess.wait);

    try {
        const response = await fetchJson(`https://kaiz-apis.gleeze.com/api/gemini-vision?q=Describe+this+image&uid=1268&imageUrl=${encodeURIComponent(text)}&apikey=${KAIZ_API_KEY}`);
        if (!response.response) {
            return sylphaReply("Echec de la description de l'image. Essaie une autre URL.");
        }

        await sylphaReply(response.response);
        // Optionally send the image for reference
        await sock.sendMessage(m.from, {
            image: { url: text },
            caption: 'Image described above.'
        }, { quoted: m });
    } catch (e) {
        console.error('[GEMINI-VISION Error]', e);
        await sylphaReply(mess.error.api || "Une erreur est survenue en decrivant l'image.");
    }
    break;
}


// ───────────────────────────
// FLUX COMMAND 
// ───────────────────────────
case 'flux': {
    if (!text) return sylphaReply(`Please provide a prompt. Example: ${prefix}flux Grilled`);
    await sylphaReply(mess.wait);

    try {
        const response = await fetchJson(`https://kaiz-apis.gleeze.com/api/flux?prompt=${encodeURIComponent(text)}&apikey=${KAIZ_API_KEY}`);
        if (!response.url) {
            return sylphaReply('Failed to generate image (no URL returned). Please try another prompt.');
        }

        const imageBuffer = await getBuffer(response.url);
        await sock.sendMessage(m.from, {
            image: imageBuffer,
            caption: `Generated image for prompt: ${text}`
        }, { quoted: m });

        await sylphaReply('Image generee avec succes.');
    } catch (e) {
        console.error('[FLUX Error]', e);
        await sylphaReply(mess.error.api || "Une erreur est survenue en generant l'image.");
    }
    break;
}


// ───────────────────────────
// IMGUR COMMAND
// ───────────────────────────
case 'imgur': {
    if (!m.quoted || !['imageMessage'].includes(m.quoted.mtype)) {
        return sylphaReply(`Please reply to an image. Example: ${prefix}imgur`);
    }
    await sylphaReply(mess.wait);

    try {
        const media = await m.quoted.download();
        const form = new FormData();
        form.append('image', media, 'image.jpg');

        const response = await axios.post(`https://kaiz-apis.gleeze.com/api/imgur?apikey=${KAIZ_API_KEY}`, form, {
            headers: form.getHeaders()
        });

        if (!response.data.uploaded?.link) {
            return sylphaReply('Failed to upload image to Imgur (no link returned). Please try again.');
        }

        await sylphaReply(`Image uploaded to Imgur: ${response.data.uploaded.link}`);
        await sock.sendMessage(m.from, {
            image: { url: response.data.uploaded.link },
            caption: 'Uploaded to Imgur'
        }, { quoted: m });
    } catch (e) {
        console.error('[IMGUR Error]', e);
        await sylphaReply(mess.error.api || "Une erreur est survenue lors de l'envoi vers Imgur.");
    }
    break;
}


// ───────────────────────────
// PINTEREST COMMAND 
// ───────────────────────────
case 'pinterest': {
    if (!text) return sylphaReply(`Please provide a search query.\n\n*Example:* ${prefix}pinterest naruto`);
    
    try {
        const gis = require('g-i-s');
        gis({ searchTerm: `${text} pinterest`, }, async (error, results) => {
            if (error) {
                sylphaReply(mess.error.api);
            } else {
                if (results.length === 0) return sylphaReply("Aucune image trouvee pour cette recherche.");
                const imageUrl = results[Math.floor(Math.random() * results.length)].url;
                await sock.sendMessage(from, { image: { url: imageUrl }, caption: `Here's an image for "${text}"` }, { quoted: m});
            }
        });
    } catch (e) {
        console.error(e);
        sylphaReply(mess.error.api);
    }
    break;
}


// ───────────────────────────
// WEATHER COMMAND 
// ───────────────────────────
case 'weather': {
    await sock.sendMessage(from, { react: { text: "🌤️", key: m.key } });
    if (!isAdminUser) return sylphaReply('Seul le proprietaire peut utiliser cette commande.');
    if (!args[0]) return sylphaReply(`Please provide a city name. Example: ${prefix}weather Lagos`);
    try {
        const weather = require('weather-js');
        weather.find({ search: args.join(' '), degreeType: 'C' }, (err, result) => {
            if (err || !result || !result.length) throw new Error('Donnees meteo introuvables.');
            const data = result[0];
            const response = `*Weather for ${data.location.name}*\n\n` +
                `📍 Location: ${data.location.name}\n` +
                `🌡️ Temperature: ${data.current.temperature}°C\n` +
                `💧 Humidity: ${data.current.humidity}%\n` +
                `🌬️ Wind: ${data.current.winddisplay}\n` +
                `⛅ Sky: ${data.current.skytext}\n` +
                `📅 Date: ${data.current.observationtime}`;
            if (response.length > 4000) {
                return sylphaReply('❌ Weather data is too long to display.');
            }
            sock.sendMessage(from, { text: response }, { quoted: m });
            sylphaReply('✅ Weather fetched successfully!');
        });
    } catch (e) {
        console.error(chalk.red('[WEATHER ERROR]'), e);
        sylphaReply('❌ Failed to fetch weather. Check the city name or internet connection.');
    }
    break;
}


// ───────────────────────────
// SSWEB COMMAND 
// ───────────────────────────
case 'screenshot':
case 'ssweb': {
    try {
        let url = text?.trim();

        // If command is replying to a message with a URL
        if (!url && m.quoted && m.quoted.text) {
            if (m.quoted.text.startsWith('http')) {
                url = m.quoted.text.trim();
            }
        }

        if (!url) {
            return sylphaReply(
                `❌ Please provide a website URL.\n\nExample:\n.ss https://example.com`
            );
        }

        // Ensure URL has protocol
        if (!/^https?:\/\//i.test(url)) {
            url = 'https://' + url;
        }

        // Screenshot service
        const screenshotUrl = `https://image.thum.io/get/fullpage/${url}`;

        const caption = `🌐 Website Screenshot Captured!

👤 Requested by: ${pushname || 'Unknown'}
🔗 URL: ${url}

ZERO TRACE 🤖`;

        await sock.sendMessage(
            m.from,
            {
                image: { url: screenshotUrl },
                caption: caption
            },
            { quoted: m }
        );

    } catch (err) {
        console.error('Erreur capture ecran :', err);
        sylphaReply(
            `❌ Failed to capture the webpage.\n\nMake sure the URL is valid and accessible.`
        );
    }
}
break;


// ───────────────────────────
// REMOVEBG COMMAND 
// ───────────────────────────
case 'removebg': {
    try {
        const quoted = m.quoted ? m.quoted : m
        const mime = (quoted.msg || quoted).mimetype || ''

        // ❌ Not an image
        if (!/image/.test(mime)) {
            return sylphaReply(
`❌ *RemoveBG*

Reply to an *image* with:
➤ ${prefix}removebg`
            )
        }

        // ⏳ Processing notice
        await sylphaReply(
`🖼️ *Zero Trace RemoveBG*
━━━━━━━━━━━━━━
⏳ Processing image...
Please wait`
        )

        // 📥 Download image
        const imageBuffer = await quoted.download()
        if (!imageBuffer) {
            return sylphaReply('❌ Failed to download the image.')
        }

        const axios = require('axios')
        const FormData = require('form-data')

        const form = new FormData()
        form.append('image_file', imageBuffer, {
            filename: 'removebg.png',
            contentType: mime
        })
        form.append('size', 'auto')

        // 🌐 RemoveBG API
        const response = await axios.post(
            'https://api.remove.bg/v1.0/removebg',
            form,
            {
                headers: {
                    ...form.getHeaders(),
                    'X-Api-Key': REMOVE_BG_API_KEY
                },
                responseType: 'arraybuffer',
                timeout: 60000
            }
        )

        // ✅ Send cleaned image
        await sock.sendMessage(
            from,
            {
                image: response.data,
                caption:
`✅ *Background Removed*

🖼️ Result: Clean image
🤖 Bot: Zero Trace
✨ Powered by Zero Trace`
            },
            { quoted: m }
        )

    } catch (error) {
        console.error('REMOVE_BG ERROR:', error?.response?.data || error.message)

        sylphaReply(
`❌ *RemoveBG Failed*

Possible reasons:
• Invalid API key
• API limit reached
• Unsupported image
• Network error

🔁 Try again later`
        )
    }
    break
}

// ───────────────────────────
// IMDB COMMAND 
// ───────────────────────────
case 'imdb': {
    if (!text) return sylphaReply(`Please provide a movie or series name.\n\n*Example:* ${prefix}imdb The Boys`);
    try {
        const { data } = await axios.get(`https://api.popcat.xyz/imdb?q=${encodeURIComponent(text)}`);
        if (data.error) return sylphaReply(`Could not find information for "${text}".`);        
        let imdbText = `*Title:* ${data.title}\n`;
        imdbText += `*Year:* ${data.year}\n`;
        imdbText += `*Rated:* ${data.rated}\n`;
        imdbText += `*Released:* ${data.released}\n`;
        imdbText += `*Runtime:* ${data.runtime}\n`;
        imdbText += `*Genre:* ${data.genre}\n`;
        imdbText += `*Director:* ${data.director}\n`;
        imdbText += `*Writer:* ${data.writer}\n`;
        imdbText += `*Actors:* ${data.actors}\n`;
        imdbText += `*Plot:* ${data.plot}\n`;
        imdbText += `*IMDb Rating:* ${data.rating}\n`;       
        await sock.sendMessage(from, { image: { url: data.poster }, caption: imdbText }, { quoted: m});
    } catch (e) {
        console.error(e);
        sylphaReply(mess.error.api);
    }
    break;
}


// ───────────────────────────
// SAY/TTS COMMAND 
// ───────────────────────────
case 'say':
case 'tts':
case 'gtts': {

    if (!isAdminUser) return sylphaReply(mess.creator);
    if (!text) return sylphaReply('Fournis le texte que tu veux que je dise.');
    try {
        const audioUrl = googleTTS.getAudioUrl(text, {
            lang: "en",
            slow: false,
            host: "https://translate.google.com",
        });
       await sock.sendMessage(from, {
            audio: { url: audioUrl },
            mimetype: 'audio/mp4',
            ptt: true, // Send as a voice note
        }, {
            quoted: m,
        });
    } catch (e) {
        console.error("Erreur TTS :", e);
        sylphaReply(mess.error.api);
    }
    break;
}


//========================//
// ALL ANIME COMMANDS
//=======================//

case 'animekill':
case 'animesmile':
case 'animeslap':
case 'animedance':
case 'animekiss':
case 'animeyeet': {
    await sylphaReply(mess.wait);
    try {
        const endpoint = command.replace('anime', '');
        const nekosBestMap = { kill: 'shoot', smile: 'smile', slap: 'slap', dance: 'dance', kiss: 'kiss', yeet: 'yeet' };
        const { data } = await axios.get(`https://nekos.best/api/v2/${nekosBestMap[endpoint]}`);
        const gifUrl = data.results[0].url;
        const buffer = await getBuffer(gifUrl);
        await sock.sendMessage(from, { video: buffer, gifPlayback: true, caption: `${pushname} gives a ${endpoint}!` }, { quoted: m });
    } catch (e) {
        console.error("ERREUR COMMANDE ANIME :", e);
        sylphaReply(mess.error.api);
    }
    break;
}


// ───────────────────────────
// SATORU GOJO COMMAND 
// ───────────────────────────
case 'satorugojo': {
    await sylphaReply(mess.wait);
    try {
        const { data } = await axios.get('https://safebooru.org/index.php?page=dapi&s=post&q=index&json=1&limit=50&tags=gojo_satoru');
        if (!Array.isArray(data) || data.length === 0) return sylphaReply('Aucune image trouvee pour Satoru Gojo.');
        const post = data[Math.floor(Math.random() * data.length)];
        const imageUrl = `https://safebooru.org/images/${post.directory}/${post.image}`;
        await sock.sendMessage(from, { image: { url: imageUrl }, caption: `Here's an image of Satoru Gojo!` }, { quoted: m });
    } catch (e) {
        console.error("ERREUR COMMANDE GOJO :", e);
        sylphaReply(mess.error.api);
    }
    break;
}


// ───────────────────────────
// SUKUNA COMMAND 
// ───────────────────────────
case 'sukuna': {
    await sylphaReply(mess.wait);
    try {
        const { data } = await axios.get('https://safebooru.org/index.php?page=dapi&s=post&q=index&json=1&limit=50&tags=sukuna');
        if (!Array.isArray(data) || data.length === 0) return sylphaReply('Aucune image trouvee pour Sukuna.');
        const post = data[Math.floor(Math.random() * data.length)];
        const imageUrl = `https://safebooru.org/images/${post.directory}/${post.image}`;
        await sock.sendMessage(from, { image: { url: imageUrl }, caption: `Here's an image of Sukuna!` }, { quoted: m });
    } catch (e) {
        console.error("ERREUR COMMANDE SUKUNA :", e);
        sylphaReply(mess.error.api);
    }
    break;
}



// ───────────────────────────
// EMOJI MIX COMMAND 
// ───────────────────────────
case 'emojimix':
case 'emix': {
    try {
        if (!text) {
            return sylphaReply(`Please provide two emojis to mix.\n\n*Example:* ${prefix}emojimix 😎+🥰`);
        }
        if (!text.includes('+')) {
            return sylphaReply(`You must separate the two emojis with a *+* sign.\n\n*Example:* ${prefix}emojimix 😎+🥰`);
        }
        // Parse the two emojis from the 'text' variable
        let [emoji1, emoji2] = text.split('+');
        // La clé Google est fournie via la variable d'environnement GOOGLE_API_KEY.
        const url = `https://tenor.googleapis.com/v2/featured?key=${GOOGLE_API_KEY}&contentfilter=high&media_filter=png_transparent&component=proactive&collection=emoji_kitchen_v5&q=${encodeURIComponent(emoji1)}_${encodeURIComponent(emoji2)}`;
        const { data } = await axios.get(url);
        if (!data.results || data.results.length === 0) {
            return sylphaReply('❌ These emojis cannot be mixed! Please try a different combination.');
        }       
        const imageUrl = data.results[0].media_formats.png_transparent.url;
        // Download the image directly into a buffer (more efficient)
        const imageBuffer = await getBuffer(imageUrl);
        const sticker = new Sticker(imageBuffer, {
        pack: config.packname,    // Uses the packname from your config.js
            author: config.author,    // Uses the author from your config.js
            type: StickerTypes.FULL,
            quality: 80,
        });
        await sock.sendMessage(from, await sticker.toMessage(), { quoted: m });

    } catch (error) {
        console.error('Erreur commande emojimix :', error);
        await sylphaReply(`❌ Failed to mix emojis! Please ensure you are using valid emojis.\n\n*Example:* ${prefix}emojimix 😎+🥰`);
    }
    break;
}


// ───────────────────────────
// CATFACT COMMAND 
// ───────────────────────────
case 'catfact': {
    await sylphaReply(mess.wait);
    try {
        const { data } = await axios.get("https://catfact.ninja/fact");
        await sylphaReply(`*🐱 Did You Know?*\n\n${data.fact}`);
    } catch (e) {
        sylphaReply(mess.error.api);
    }
    break;
}


// ───────────────────────────
// SIMI COMMAND
// ───────────────────────────
case 'simi': {
    if (!text) return sylphaReply(`Discute avec Simi ! Exemple : ${prefix}simi Bonjour`);
    try {
        const fetch = require('node-fetch');
        const response = await fetch(`https://api.simsimi.net/v2/?text=${encodeURIComponent(text)}&lc=en`);
        const data = await response.json();
        if (data.success) {
            await sylphaReply(`*Simi (chatbot externe) :* ${data.success}`);
        } else {
            sylphaReply("Simi ne répond pas pour le moment, réessaie plus tard.");
        }
    } catch (e) {
        sylphaReply(mess.error.api);
    }
    break;
}


// ───────────────────────────
// MEME COMMAND 
// ───────────────────────────
case 'meme': {
    await sylphaReply(mess.wait);
    try {
        const { data } = await axios.get("https://meme-api.com/gimme");
        await sock.sendMessage(from, { image: { url: data.url }, caption: `*${data.title}*` }, { quoted: m });
    } catch (e) {
        sylphaReply(mess.error.api);
    }
    break;
}


//===========≠=====================//
// WAIFU COMMANDS 
//================================//
case 'neko':
case 'waifu':
case 'shinobu':
case 'megumin': {
    await sylphaReply(mess.wait);
    try {
        const nekosBestMap = { neko: 'neko', waifu: 'waifu', shinobu: 'neko', megumin: 'waifu' };
        const { data } = await axios.get(`https://nekos.best/api/v2/${nekosBestMap[command]}`);
        const imgUrl = data.results[0].url;
        await sock.sendMessage(from, { image: { url: imgUrl }, caption: `Here's a ${command} image!` }, { quoted: m });
    } catch (e) {
        console.error("ERREUR COMMANDE WAIFU :", e);
        sylphaReply(mess.error.api);
    }
    break;
}

case 'slap':
case 'kill':
case 'kiss':
case 'yeet':
case 'hug':
case 'cry': {
    await sylphaReply(mess.wait);
    try {
        const nekosBestMap = { slap: 'slap', kill: 'shoot', kiss: 'kiss', yeet: 'yeet', hug: 'hug', cry: 'cry' };
        const { data } = await axios.get(`https://nekos.best/api/v2/${nekosBestMap[command]}`);
        const gifUrl = data.results[0].url;
        const buffer = await getBuffer(gifUrl);
        await sock.sendMessage(from, { video: buffer, gifPlayback: true, caption: `_${pushname} gives a ${command}!_` }, { quoted: m });
    } catch (e) {
        console.error("ERREUR COMMANDE ACTION :", e);
        sylphaReply(mess.error.api);
    }
    break;
}


// ───────────────────────────
// RIDDLE COMMAND 
// ───────────────────────────
case 'riddle': {
    await sylphaReply(mess.wait);
    try {
        const { data } = await axios.get("https://riddles-api.vercel.app/random");
        const riddleText = `*Here's a riddle for you:*\n\n*Riddle:* ${data.riddle}\n\n*Answer:* ||${data.answer}||`;
        await sylphaReply(riddleText);
    } catch (e) {
        sylphaReply(mess.error.api);
    }
    break;
}


// ───────────────────────────
// SHIP COMMAND
// ───────────────────────────
case 'ship': {
    if (!isGroup) return sylphaReply(mess.group); 
    const mentionedJids = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    if (mentionedJids.length < 2) {
        return sylphaReply('Please mention two users to calculate their ship score!\n\n*Example:* .ship @user1 @user2');
    }

    try {
        const user1_jid = mentionedJids[0];
        const user2_jid = mentionedJids[1];


        const name1 = `@${user1_jid.split('@')[0]}`;
        const name2 = `@${user2_jid.split('@')[0]}`;

        const loveScore = Math.floor(Math.random() * 101);
        let shipMessage = '';
        
        if (loveScore < 10) shipMessage = '💔 Barely a spark. Maybe just friends?';
        else if (loveScore < 30) shipMessage = '🤔 There might be something there, but it needs work.';
        else if (loveScore < 70) shipMessage = '😊 A solid match! Looking good!';
        else if (loveScore < 90) shipMessage = '💖 Wow! You two are incredibly compatible!';
        else shipMessage = '💍 Soulmates! Get a room already!';

        const shipText = `
*💞 Love Compatibility Test 💞*

*Couple:*
- ${name1}
- ${name2}

*Ship Score:* ${loveScore}%
*Verdict:* ${shipMessage}
        `.trim();

        await sock.sendMessage(from, { text: shipText, mentions: [user1_jid, user2_jid] });
        
    } catch (e) {
        console.error("Erreur commande ship :", e);
        sylphaReply("Une erreur est survenue en tentant de faire le ship.");
    }
}
break;


// ───────────────────────────
// 🌍WHO IS COMMAND
// ───────────────────────────
case 'whois': {
    try {
        const target =
            m.mentionedJid?.[0] ||
            m.quoted?.sender ||
            sender

        await sylphaReply(mess.wait)

        const number = target.split('@')[0]

        const pfp = await sock.profilePictureUrl(target, 'image')
            .catch(() => null)

        const statusObj = await sock.fetchStatus(target)
            .catch(() => null)

        const bio = statusObj?.status || 'No bio available'

        const info =
`✨ *User Information*

👤 *Number:* +${number}
📝 *Bio:* ${bio}
🔗 *Chat:* wa.me/${number}`

        if (pfp) {
            await sock.sendMessage(from, {
                image: { url: pfp },
                caption: info,
                mentions: [target]
            }, { quoted: m })
        } else {
            await sock.sendMessage(from, {
                text: info,
                mentions: [target]
            }, { quoted: m })
        }

    } catch (e) {
        console.error('ERREUR WHOIS :', e)
        sylphaReply('Echec de recuperation des infos utilisateur.')
    }
    break
}          


// ───────────────────────────
// TRUTH COMMAND 
// ───────────────────────────
case 'truth': {
    await sylphaReply(mess.wait);
    try {
        const { data } = await axios.get(`https://api.truthordarebot.xyz/v1/truth`);
        await sylphaReply(`*Truth Time!* 😮\n\n${data.question}`);
    } catch (e) {
        sylphaReply(mess.error.api);
    }
    break;
}


// ───────────────────────────
// DARE COMMAND 
// ───────────────────────────
case 'dare': {
    await sylphaReply(mess.wait);
    try {
        const { data } = await axios.get(`https://api.truthordarebot.xyz/v1/dare`);
        await sylphaReply(`*It's a Dare!* 🔥\n\n${data.question}`);
    } catch (e) {
        sylphaReply(mess.error.api);
    }
    break;
}


// ───────────────────────────
//PICKUPLINE COMMAND 
// ───────────────────────────
case 'pickupline': {
    try {
        const { data } = await axios.get("https://v2.jokeapi.dev/joke/Any?type=single&contains=pickup");
        await sylphaReply(data.joke);
    } catch (e) { sylphaReply(mess.error.api); }
    break;
}


// ───────────────────────────
// QUOTE COMMAND 
// ───────────────────────────
case 'quote': {
    try {
        const { data } = await axios.get("https://api.quotable.io/random");
        await sylphaReply(`_"${data.content}"_\n\n- ${data.author}`);
    } catch (e) { sylphaReply(mess.error.api); }
    break;
}


// ───────────────────────────
// 🌍 INSULT COMMAND 
// ───────────────────────────
case 'insult': {
    try {
        const { data } = await axios.get("https://evilinsult.com/generate_insult.php?lang=en&type=json");
        await sylphaReply(data.insult);
    } catch (e) {
        sylphaReply(mess.error.api);
    }
    break;
}


// ───────────────────────────
// 🌍 TRIVIA COMMAND 
// ───────────────────────────
case 'trivia': {
    await sylphaReply(mess.wait);
    try {
        const { data } = await axios.get("https://opentdb.com/api.php?amount=1&type=multiple");
        const trivia = data.results[0];
        const question = trivia.question.replace(/&quot;/g, '"').replace(/&#039;/g, "'");
        const correctAnswer = trivia.correct_answer;
        
        let triviaText = `*🧠 Trivia Time! 🧠*\n\n*Category:* ${trivia.category}\n*Difficulty:* ${trivia.difficulty}\n\n*Question:* ${question}\n\n*Answer:* ||${correctAnswer}||`;
        await sylphaReply(triviaText);
    } catch (e) {
        sylphaReply(mess.error.api);
    }
    break;
}


//================================//
// 😘 ALL EPHOTO MENU
//===============================//
case 'ephotomenu': {
    let menuText = `🎨 *Ephoto360 Menu* 🎨\n\nHere are the available text effects:\n\n`;
    menuText += ephotoCommands.map(cmd => `➤ ${prefix}${cmd}`).join('\n');
    menuText += `\n\n*Usage:* ${prefix}<effect_name> <your_text>`;
    sylphaReply(menuText);
    break;
}

case (ephotoCommands.includes(command) ? command : null): {
    if (!text) return sylphaReply(`Please provide text for the effect.\n\n*Example:* ${prefix}${command} Hello World`);
    
    await sylphaReply(mess.wait);
    
    try {
        const effectUrl = ephotoEffects[command];
        const imageUrl = await ephoto(effectUrl, text);
        
        const imageBuffer = await getBuffer(imageUrl);
        await sock.sendMessage(from, { image: imageBuffer, caption: mess.success }, { quoted: m});

    } catch (e) {
        console.error(chalk.red(`[EPHOTO ERROR - ${command}]`), e);
        sylphaReply(mess.error.api + "\n\n_This effect might be temporarily unavailable._");
    }
    break;
}




// ───────────────────────────
//  ALIVE COMMAND 
// ───────────────────────────
case 'alive': {
    const uptime = formatRuntime(process.uptime());
    const aliveText = `🌟 *${botName} is Alive!* 🌟\n\n- *Uptime:* ${uptime}\n- *User:* ${m.pushName}`;
    await sylphaReply(aliveText);
    break;
}


// ───────────────────────────
// CHECK ID CHANNEL COMMAND 
// ───────────────────────────
case 'checkidch':
case 'idch': {
    if (!isAdminUser) return sylphaReply(mess.creator); // Using our standard 
    if (!text) return sylphaReply("Fournis un lien de chaine WhatsApp.");
    if (!text.includes("https://whatsapp.com/channel/")) return sylphaReply("Le lien fourni n'est pas un lien de chaine WhatsApp valide.");

    await sylphaReply(mess.wait);
    try {
        let channelCode = text.split('https://whatsapp.com/channel/')[1];
        let res = await sock.newsletterMetadata("invite", channelCode);
        
        let responseText = `
*🆔 Channel ID:* ${res.id}
*📝 Name:* ${res.name}
*👥 Followers:* ${res.subscribers}
*🔒 Status:* ${res.state}
*✅ Verified:* ${res.verification === "VERIFIED" ? "Yes" : "No"}
        `;
        await sylphaReply(responseText.trim());

    } catch (e) {
        console.error("Erreur ID de chaine :", e);
        sylphaReply("❌ Failed to fetch channel metadata. The link might be invalid or the channel private.");
    }
    break;
}


// ───────────────────────────
// 🌍 PAY ME COMMAND 
// ───────────────────────────
case 'pay':
case 'payme': {
    const payDetails = `\`*🏦 BANK DETAILS 🏦*\`
*Bank Name:* OPAY
*Account Name:* Sherriff Abolaji
*Account Number:* 9028711461

_Please send a screenshot after payment._`;
    await sylphaReply(payDetails);
}
break;


// ───────────────────────────
// 🌍 TEST API COMMAND 
// ───────────────────────────
case 'testapi': {
    if (!text) return sylphaReply('Please provide an API URL. Example: ${prefix}testapi https://ytplay-api.onrender.com/play/baby+girl+by+joeboy?format=audio');
    const waitMsg = await sylphaReply(mess.wait); 
    try {
        const apiUrl = text.trim();
        const response = await axios.get(apiUrl);

        // Check if the response contains valid JSON
        if (!response.data || typeof response.data !== 'object') {
            await sock.sendMessage(from, { text: 'Reponse API invalide. Aucune donnee JSON recue.' }, { quoted: waitMsg });
            return;
        }

        // Convert response data to pretty-printed JSON
        const jsonResponse = JSON.stringify(response.data, null, 2);

        // Send JSON response as text to WhatsApp
        await sock.sendMessage(from, { text: `API Test Result for ${apiUrl}:\n\`\`\`${jsonResponse}\`\`\`` }, { quoted: m });

        // Delete the awaiting message
        await sock.sendMessage(from, { delete: waitMsg.key });
    } catch (e) {
        console.error('[TESTAPI Error]', e);
        await sock.sendMessage(from, { text: mess.error.api || "Une erreur est survenue en testant l'API. Verifie l'URL et reessaie." }, { quoted: waitMsg });
    }
    break;
}


// ───────────────────────────
// 🌍 PING COMMAND 
// ───────────────────────────
case 'ping':{
    const speed = require('performance-now');
    const timestamp = speed();
    const latency = (speed() - timestamp).toFixed(4);
    await sylphaReply(`*Pong!* 🏓\n_Response Time: ${latency}ms_`);
    break;
}


// ───────────────────────────
// 🌍 ADD SUDO COMMAND 
// ───────────────────────────
case 'addsudo': {
    if (!isAdminUser) return sylphaReply(mess.error.owner);

    let user =
        m.quoted?.sender?.split('@')[0] ||
        args[0]?.replace(/[^0-9]/g, '');

    if (!user) return sylphaReply("Reponds a un utilisateur ou fournis un numero.");

    let sudoList = JSON.parse(fs.readFileSync('./system/owner.json', 'utf-8') || '[]');

    if (sudoList.includes(user))
        return sylphaReply("Cet utilisateur est deja sudo.");

    sudoList.push(user);
    fs.writeFileSync('./system/owner.json', JSON.stringify(sudoList, null, 2));

    await sylphaReply(`✅ @${user} added as *SUDO*`);
}
break;


// ───────────────────────────
// 🌍 DELETE SUDO COMMAND 
// ───────────────────────────
case 'delsudo': {
    if (!isAdminUser) return sylphaReply(mess.error.owner);

    let user =
        m.quoted?.sender?.split('@')[0] ||
        args[0]?.replace(/[^0-9]/g, '');

    if (!user) return sylphaReply("Reponds a un utilisateur ou fournis un numero.");

    let sudoList = JSON.parse(fs.readFileSync('./system/owner.json', 'utf-8') || '[]');

    if (!sudoList.includes(user))
        return sylphaReply("Cet utilisateur n'est pas sudo.");

    sudoList = sudoList.filter(u => u !== user);
    fs.writeFileSync('./system/owner.json', JSON.stringify(sudoList, null, 2));

    await sylphaReply(`❌ @${user} removed from *SUDO*`);
}
break;

//=================================
// LIST SUDO COMMAND 
//================================
case 'listsudo': {
    if (!isAdminUser) return sylphaReply(mess.error.owner);

    let sudoList = JSON.parse(
        fs.readFileSync('./system/owner.json', 'utf-8') || '[]'
    );

    if (!sudoList.length)
        return sylphaReply("⚠️ No sudo users added yet.");

    let text = `*👑 SUDO USERS LIST*\n\n`;

    sudoList.forEach((num, i) => {
        text += `${i + 1}. @${num}\n`;
    });

    await sock.sendMessage(
        from,
        {
            text,
            mentions: sudoList.map(n => n + '@s.whatsapp.net')
        },
        { quoted: m }
    );
}
break;

// ───────────────────────────
// 🌍 GROUP BROADCAST COMMAND 
// ───────────────────────────
case 'gcbroadcast': {
    if (!isAdminUser) return sylphaReply(mess.error.owner);
    if (!text) return sylphaReply("Fournis un message a diffuser.");
    try {
        const groups = await sock.groupFetchAllParticipating();
        const groupIds = Object.keys(groups);
        await sylphaReply(`Broadcasting to ${groupIds.length} groups. This may take a while...`);
        for (const id of groupIds) {
            await sock.sendMessage(id, { text: `*-- BROADCAST --*\n\n${text}\n> By ${botName}` });
            await new Promise(resolve => setTimeout(resolve, 1000)); // Delay to avoid spam block
        }
        await sylphaReply("✅ Group Broadcast complete.");
    } catch (e) {
        console.error(e);
        sylphaReply(mess.error.api);
    }
    break;
}


// ───────────────────────────
// 🌍 BLOCK COMMAND 
// ───────────────────────────
case 'block': {
    if (!isAdminUser) return sylphaReply('Seul le proprietaire peut utiliser cette commande.');
    if (!text) return sylphaReply('Fournis un numero a bloquer. Exemple : !block 234xxx');
    const number = text.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
    await sock.updateBlockStatus(number, 'block');
    sylphaReply(`Blocked ${number.split('@')[0]}.`);
    break;
}


// ───────────────────────────
// 🌍 SETPP COMMAND 
// ───────────────────────────
case 'setpp':
case 'setbotpp': {
    if (!isAdminUser) return sylphaReply(mess.error.owner);
    if (!m.quoted || !/image/.test(m.quoted.mtype)) return sylphaReply("Reponds a une image pour en faire ma photo de profil.");
    try {
        const media = await m.quoted.download();
        await sock.updateProfilePicture(sock.user.id, media);
        await sylphaReply("✅ Profile picture updated successfully!");
    } catch (e) {
        console.error(e);
        sylphaReply("❌ Failed to update profile picture.");
    }
    break;
}



// ───────────────────────────
// 🌍 JID COMMAND 
// ───────────────────────────
case 'jid': {
    await sylphaReply(`The JID of this chat is:\n*${from}*`);
    break;
}


// ───────────────────────────
// 🌍 ZERO COMMAND — petit aparté avec l'entité
// ───────────────────────────
case 'zero': {
    const lignes = [
        "Je suis ZERO. Aucune trace ne subsiste de mon passage, seulement le résultat.",
        "Gardienne, exécutante... peu importe le nom qu'on me donne, ma mission reste la même : protéger ce qui m'a été confié.",
        "Je n'hésite jamais quand il s'agit de veiller sur Shadow Senku et ce qu'il construit.",
        "Je préfère agir en silence plutôt qu'annoncer ce que je fais."
    ];
    await sylphaReply(lignes[Math.floor(Math.random() * lignes.length)]);
}
break;

// ───────────────────────────
// 🌍 BLAGUE (porté de l'ancien bot)
// ───────────────────────────
case 'blague': {
    const blagues = [
        "Pourquoi est-ce qu'un ordinateur va voir un docteur ? Parce qu'il a un virus !",
        "Pourquoi est-ce qu'un pneu est triste ? Parce qu'il est dégonflé !",
        "Qu'est-ce qu'un chat dit quand il est heureux ? Je suis aux anges !",
        "Pourquoi est-ce qu'un poisson n'est jamais déçu ? Parce qu'il a une carpe diem !",
        "Qu'est-ce qu'un chien dit à son ami ? Tu es un chien-chien !"
    ];
    await sylphaReply(blagues[Math.floor(Math.random() * blagues.length)]);
}
break;

// ───────────────────────────
// 🌍 AGENT / CHATBOT / VOICE / ANTIFLOOD (toggles portés — NOTE : le comportement automatique
// associé (agent autonome, auto-réponse, TTS, anti-flood réel) n'existait que dans le code de
// gestion des messages de l'ancien bot, absent de ce zip. Ici la commande enregistre bien le
// réglage, mais rien ne le "consomme" encore.)
// ───────────────────────────
case 'agent': {
    if (isGroup && !isAdmin) return sylphaReply("⛔ Seuls les admins peuvent utiliser cette commande.");
    if (!isGroup && !isCreator) return sylphaReply("⛔ Commande réservée au créateur du bot.");
    const choice = args[0]?.toLowerCase();
    const gs = moderation.getGroupSettings(from);
    if (choice !== 'on' && choice !== 'off') {
        return sylphaReply(`⚙️ Mode agent : ${gs.agentMode ? 'ACTIVÉ ✅' : 'DÉSACTIVÉ ❌'}\nUtilise ${prefix}agent on ou ${prefix}agent off`);
    }
    moderation.updateGroupSettings(from, { agentMode: choice === 'on' });
    await sylphaReply(choice === 'on' ? '⚡ Agent activé.' : '❌ Agent désactivé.');
}
break;

case 'chatbot': {
    if (isGroup && !isAdmin) return sylphaReply("⛔ Seuls les admins peuvent utiliser cette commande.");
    if (!isGroup && !isCreator) return sylphaReply("⛔ Commande réservée au créateur du bot.");
    const choice = args[0]?.toLowerCase();
    const gs = moderation.getGroupSettings(from);
    if (choice !== 'on' && choice !== 'off') {
        return sylphaReply(`⚙️ Chat auto : ${gs.chatbot ? 'ACTIVÉ ✅' : 'DÉSACTIVÉ ❌'}\nUtilise ${prefix}chatbot on ou ${prefix}chatbot off`);
    }
    moderation.updateGroupSettings(from, { chatbot: choice === 'on' });
    await sylphaReply(choice === 'on' ? '✅ Chat auto activé.' : '❌ Chat auto désactivé.');
}
break;

case 'voice': {
    if (isGroup && !isAdmin) return sylphaReply("⛔ Seuls les admins peuvent utiliser cette commande.");
    if (!isGroup && !isCreator) return sylphaReply("⛔ Commande réservée au créateur du bot.");
    const choice = args[0]?.toLowerCase();
    const gs = moderation.getGroupSettings(from);
    if (choice !== 'on' && choice !== 'off') {
        return sylphaReply(`⚙️ Réponses vocales : ${gs.voiceReplies ? 'ACTIVÉ ✅' : 'DÉSACTIVÉ ❌'}\nUtilise ${prefix}voice on ou ${prefix}voice off`);
    }
    moderation.updateGroupSettings(from, { voiceReplies: choice === 'on' });
    await sylphaReply(choice === 'on' ? '✅ Réponses vocales activées.' : '❌ Réponses vocales désactivées.');
}
break;

// ───────────────────────────
// 🌍 MUTE / UNMUTE — groupe entier (différent de mute-user/unmute-user)
// ───────────────────────────
case 'mute': {
    if (!isGroup) return sylphaReply("⚠️ Cette commande fonctionne uniquement dans un groupe.");
    if (!isAdmin) return sylphaReply("⛔ Seuls les admins peuvent utiliser cette commande.");
    if (!isBotAdmin) return sylphaReply("⚠️ Je dois être admin du groupe pour faire ça.");
    await sock.groupSettingUpdate(from, 'announcement');
    await sylphaReply("🔇 Groupe mis en sourdine : seuls les admins peuvent écrire.");
}
break;

case 'unmute': {
    if (!isGroup) return sylphaReply("⚠️ Cette commande fonctionne uniquement dans un groupe.");
    if (!isAdmin) return sylphaReply("⛔ Seuls les admins peuvent utiliser cette commande.");
    if (!isBotAdmin) return sylphaReply("⚠️ Je dois être admin du groupe pour faire ça.");
    await sock.groupSettingUpdate(from, 'not_announcement');
    await sylphaReply("🔊 Groupe réactivé : tout le monde peut écrire.");
}
break;

// ───────────────────────────
// 🌍 BLACKLIST add/remove/list
// ───────────────────────────
case 'blacklist': {
    if (!isAdminUser) return sylphaReply(mess.error.owner);
    const action = args[0]?.toLowerCase();
    const blPath = './system/blacklist.json';
    let list = [];
    try { list = JSON.parse(fs.readFileSync(blPath, 'utf-8') || '[]'); } catch (e) { list = []; }

    if (action === 'list') {
        return sylphaReply(list.length ? `🚫 *Blacklist* (${list.length})\n` + list.map(n => `• ${n}`).join('\n') : '📭 Blacklist vide.');
    }
    if (action !== 'add' && action !== 'remove') {
        return sylphaReply(`⚠️ Utilise :\n${prefix}blacklist add (en réponse ou +numéro)\n${prefix}blacklist remove (en réponse ou +numéro)\n${prefix}blacklist list`);
    }
    const number = m.quoted?.sender?.split('@')[0] || args[1]?.replace(/[^0-9]/g, '');
    if (!number) return sylphaReply(`⚠️ Réponds à un message ou donne un numéro : ${prefix}blacklist ${action} <numéro>`);

    if (action === 'add') {
        if (!list.includes(number)) list.push(number);
        fs.writeFileSync(blPath, JSON.stringify(list, null, 2));
        await sylphaReply(`🚫 ${number} ajouté à la blacklist.`);
    } else {
        list = list.filter(n => n !== number);
        fs.writeFileSync(blPath, JSON.stringify(list, null, 2));
        await sylphaReply(`✅ ${number} retiré de la blacklist.`);
    }
}
break;

// ───────────────────────────
// 🌍 SUDO add/remove/list — même stockage que .addsudo/.delsudo/.listsudo
// ───────────────────────────
case 'sudo': {
    if (!isCreator) return sylphaReply("⛔ Seul le créateur du bot peut gérer les sudo.");
    const action = args[0]?.toLowerCase();
    const sudoPath = './system/owner.json';
    let sudoList = [];
    try { sudoList = JSON.parse(fs.readFileSync(sudoPath, 'utf-8') || '[]'); } catch (e) { sudoList = []; }

    if (action === 'list') {
        return sylphaReply(sudoList.length ? `👥 *Sudo actuels* (${sudoList.length})\n` + sudoList.map(n => `• ${n}`).join('\n') : "📭 Aucun sudo pour l'instant.");
    }
    if (action !== 'add' && action !== 'remove') {
        return sylphaReply(`⚠️ Utilise :\n${prefix}sudo add (en réponse ou +numéro)\n${prefix}sudo remove (en réponse ou +numéro)\n${prefix}sudo list`);
    }
    const number = m.quoted?.sender?.split('@')[0] || args[1]?.replace(/[^0-9]/g, '');
    if (!number) return sylphaReply(`⚠️ Réponds à un message ou donne un numéro : ${prefix}sudo ${action} <numéro>`);

    if (action === 'add') {
        if (!sudoList.includes(number)) sudoList.push(number);
        fs.writeFileSync(sudoPath, JSON.stringify(sudoList, null, 2));
        await sylphaReply(`✅ ${number} est maintenant sudo.`);
    } else {
        sudoList = sudoList.filter(n => n !== number);
        fs.writeFileSync(sudoPath, JSON.stringify(sudoList, null, 2));
        await sylphaReply(`✅ ${number} n'est plus sudo.`);
    }
}
break;

// ───────────────────────────
// 🌍 MODE — alias public/private de .self/.public
// ───────────────────────────
case 'mode': {
    if (!isAdminUser) return sylphaReply(mess.error.owner);
    const choice = args[0]?.toLowerCase();
    if (choice !== 'public' && choice !== 'private') {
        return sylphaReply(`⚠️ Mode actuel : ${settings.public ? 'public' : 'private'}\nUtilise ${prefix}mode public ou ${prefix}mode private`);
    }
    settings.public = choice === 'public';
    saveSettings(userKey, settings);
    await sylphaReply(`✅ Mode changé : ${choice}`);
}
break;

// ───────────────────────────
// 🌍 AUTOPILOT — ZERO actif partout (mentions en groupe, direct en DM), sans activer .chatbot partout un par un
// ───────────────────────────
case 'autopilot': {
    if (!isCreator) return sylphaReply("⛔ Commande réservée au créateur du bot.");
    const choice = args[0]?.toLowerCase();
    if (choice !== 'on' && choice !== 'off') {
        return sylphaReply(`⚙️ Autopilot : ${settings.autopilot ? 'ACTIVÉ ✅' : 'DÉSACTIVÉ ❌'}\nUtilise ${prefix}autopilot on ou ${prefix}autopilot off\n\nActif : ZERO répond sur mention dans tous les groupes, et directement en DM.`);
    }
    settings.autopilot = choice === 'on';
    saveSettings(userKey, settings);
    await sylphaReply(choice === 'on'
        ? "✅ Autopilot activé — je réponds sur mention dans tous les groupes, et directement en DM."
        : "❌ Autopilot désactivé — je reste sur les réglages par discussion (.chatbot)."
    );
}
break;

// ───────────────────────────
// 🌍 CODEGEN (owner) — génère un extrait de code JS, non installé automatiquement
// ───────────────────────────
case 'codegen': {
    if (!isCreator) return sylphaReply("⛔ Commande réservée au créateur du bot.");
    if (!text) return sylphaReply(`⚠️ Utilise : ${prefix}codegen <description de la commande souhaitée>`);
    const apiKey = process.env.HEAVSTAL_API_KEY;
    if (!apiKey) return sylphaReply('Cette commande nécessite HEAVSTAL_API_KEY dans le fichier .env.');

    await sylphaReply('🧠 Génération du code en cours...');
    try {
        const codePersona = `Tu es un générateur de code pour un bot WhatsApp Node.js (CommonJS, style switch/case, pas d'imports ESM). Réponds UNIQUEMENT avec un extrait JavaScript prêt à coller dans un bloc "case 'nomcommande':", sans explication ni markdown autour.`;
        const response = await fetch('https://heavstal.com.ng/api/v1/jeden', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
            body: JSON.stringify({ prompt: text, persona: codePersona })
        });
        const res = await response.json();
        if (res.status === 'success' && res.data?.response) {
            await sylphaReply(`📄 *Code proposé* (à relire avant utilisation) :\n\n\`\`\`${res.data.response}\`\`\`\n\n⚠️ Ce code n'est pas installé automatiquement.`);
        } else {
            await sylphaReply('Quelque chose a perturbé ma concentration... réessaie dans un instant.');
        }
    } catch (e) {
        await sylphaReply(`❌ ${e.message}`);
    }
}
break;

// ───────────────────────────
// 🌍 SEARCH — recherche web (google-it) + synthèse IA
// ───────────────────────────
case 'search': {
    if (!text) return sylphaReply(`⚠️ Utilise : ${prefix}search <ta question>`);
    const apiKey = process.env.HEAVSTAL_API_KEY;
    if (!apiKey) return sylphaReply('Cette commande nécessite HEAVSTAL_API_KEY dans le fichier .env.');

    await sylphaReply(mess.wait);
    try {
        const google = require('google-it');
        const results = await google({ query: text });
        const context = results.slice(0, 5).map(r => `- ${r.title}: ${r.snippet} (${r.link})`).join('\n');
        const searchPersona = `Tu es ZERO, l'assistant du bot. Réponds à la question en te basant sur ces résultats de recherche web récents :\n${context}\nRéponds de façon claire et concise, en français.`;
        const response = await fetch('https://heavstal.com.ng/api/v1/jeden', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
            body: JSON.stringify({ prompt: text, persona: searchPersona })
        });
        const res = await response.json();
        const sources = results.slice(0, 5).map(r => `• ${r.title}\n  ${r.link}`).join('\n');
        if (res.status === 'success' && res.data?.response) {
            await sylphaReply(`${res.data.response}\n\n🔗 *Sources :*\n${sources}`);
        } else {
            await sylphaReply('Quelque chose a perturbé ma concentration... réessaie dans un instant.');
        }
    } catch (e) {
        await sylphaReply(`❌ ${e.message}`);
    }
}
break;

// ───────────────────────────
// 🌍 FORGET
// ───────────────────────────
case 'forget': {
    await sylphaReply("🧹 C'est noté — je ne garde de toute façon pas de mémoire d'une conversation à l'autre, chaque message est traité indépendamment.");
}
break;

// ───────────────────────────
// 🌍 STYLE — prévisualiser/appliquer une police unicode (porté de l'ancien bot)
// ───────────────────────────
case 'style': {
    if (!isAdminUser) return sylphaReply(mess.error.owner);
    const fancy = require('./utils/fancyText.js');
    const STYLE_LIST = ['none', 'boldSerif', 'italicSerif', 'boldScript', 'boldFraktur', 'sansSerif', 'boldSans', 'monospace', 'doubleStruck', 'gothic', 'script', 'smallCaps', 'circled', 'squared', 'cute'];
    const SAMPLE = 'Zero Trace';
    const stylePath = './system/style.json';
    const choice = args[0];

    if (!choice) {
        const current = (() => { try { return JSON.parse(fs.readFileSync(stylePath, 'utf-8')).current; } catch (e) { return 'none'; } })();
        const preview = STYLE_LIST.map((name, i) => `${i + 1}. ${name === 'none' ? SAMPLE : fancy[name](SAMPLE)}`).join('\n');
        return sylphaReply(`🎨 *Styles disponibles* (actuel : ${current})\n\n${preview}\n\nUtilise ${prefix}style <numéro> pour choisir.`);
    }
    const index = parseInt(choice) - 1;
    const selected = STYLE_LIST[index];
    if (!selected) return sylphaReply(`Numéro invalide. Utilise ${prefix}style pour voir la liste.`);
    fs.writeFileSync(stylePath, JSON.stringify({ current: selected }, null, 2));
    const rendered = selected === 'none' ? SAMPLE : fancy[selected](SAMPLE);
    await sylphaReply(`Style appliqué : ${rendered}`);
}
break;

// ───────────────────────────
// 🌍 SETMENU / SETMENULIST — choisir le style visuel du menu (.menu et .cmd suivent le même)
// ───────────────────────────
case 'setmenulist': {
    console.log(`[SETMENU DEBUG] setmenulist atteint, command="${command}", isCmd=${isCmd}`);
    const current = settings.menuStyle || 1;
    const list = Object.entries(MENU_STYLES).map(([id, s]) => `${id === String(current) ? '✅' : '▸'} ${id}. ${s.name}`).join('\n');
    await sylphaReply(`🎨 *Styles de menu disponibles*\n\n${list}\n\nUtilise ${prefix}setmenu <numéro> pour changer.\nS'applique à .menu ET .cmd.`);
}
break;

case 'setmenu': {
    console.log(`[SETMENU DEBUG] setmenu atteint, args="${JSON.stringify(args)}", isAdminUser=${isAdminUser}`);
    if (!isAdminUser) return sylphaReply(mess.error.owner);
    const choice = parseInt(args[0]);
    if (!choice || !MENU_STYLES[choice]) {
        return sylphaReply(`⚠️ Style invalide. Utilise ${prefix}setmenulist pour voir les options.`);
    }
    settings.menuStyle = choice;
    saveSettings(userKey, settings);
    await sylphaReply(`✅ Style de menu changé : *${MENU_STYLES[choice].name}*\n\nTape ${prefix}menu pour voir le résultat.`);
}
break;

// ───────────────────────────
// 🌍 SPIDER — menu/quote/info (porté de l'ancien bot, image dans media/spider.jpg)
// ───────────────────────────
case 'spider': {
    const sub = args[0]?.toLowerCase();
    const os = require('os');

    if (sub === 'quote') {
        const quotes = [
            "Avec un grand pouvoir vient une grande responsabilité.",
            "Je suis Spider-Man. Je protège les gens.",
            "Tout le monde peut porter le masque.",
            "Tu es bien plus fort que tu ne le penses.",
            "Peu importe le masque, c'est ce qu'il y a en dessous qui compte."
        ];
        return sylphaReply(`🕷️ *SPIDER-QUOTE*\n━━━━━━━━━━━━━━\n"${quotes[Math.floor(Math.random() * quotes.length)]}"\n— *Spider-Man*`);
    }
    if (sub === 'info') {
        return sylphaReply(`🕷️ *SPIDER-INFO*\n━━━━━━━━━━━━━━\nNom : Peter Parker / Miles Morales\nCréateurs : Stan Lee & Steve Ditko\n1ère apparition : Amazing Fantasy #15 (1962)\nPouvoirs : Force surhumaine, agilité, sens d'araignée`);
    }
    if (sub === 'power') {
        const powers = [
            "🕸️ Lancer de toiles — se balance entre les buildings",
            "💪 Force surhumaine — soulève plusieurs tonnes",
            "🤸 Agilité et équilibre parfaits, réflexes surhumains",
            "⚡ Sens d'araignée — détecte le danger avant qu'il arrive",
            "🧗 Adhérence totale — grimpe n'importe quelle surface"
        ];
        return sylphaReply(`🕷️ *SPIDER-POWER*\n━━━━━━━━━━━━━━\n${powers[Math.floor(Math.random() * powers.length)]}`);
    }
    if (sub === 'villain') {
        const villains = [
            "🦹 Green Goblin — Norman Osborn, planeur et bombes citrouilles",
            "🐙 Doctor Octopus — Otto Octavius, 4 bras mécaniques",
            "🖤 Venom — symbiote extraterrestre, ex-allié devenu ennemi",
            "🦎 The Lizard — Curt Connors, mutation reptilienne",
            "🎪 Mysterio — Quentin Beck, maître de l'illusion"
        ];
        return sylphaReply(`🕷️ *SPIDER-VILLAIN*\n━━━━━━━━━━━━━━\n${villains[Math.floor(Math.random() * villains.length)]}`);
    }
    if (sub === 'fact') {
        const facts = [
            "🕸️ Une toile d'araignée peut être 5 fois plus résistante que l'acier à poids égal.",
            "🕷️ Il existe plus de 50 000 espèces d'araignées connues dans le monde.",
            "🕸️ Certaines araignées peuvent produire jusqu'à 7 types de soie différents.",
            "🕷️ Les araignées n'ont pas d'os — un exosquelette et du liquide sous pression.",
            "🕸️ Une toile complète peut être tissée en moins d'une heure."
        ];
        return sylphaReply(`🕷️ *SPIDER-FACT*\n━━━━━━━━━━━━━━\n${facts[Math.floor(Math.random() * facts.length)]}`);
    }
    if (sub === 'web') {
        const target = m.mentionedJid?.[0] || m.quoted?.sender;
        if (!target) return sylphaReply(`🕸️ Mentionne quelqu'un ou réponds à son message : ${prefix}spider web @personne`);
        await sock.sendMessage(from, {
            text: `🕸️ *THWIP!* @${target.split('@')[0]} vient de se faire coller par une toile !`,
            mentions: [target]
        }, { quoted: m });
        return;
    }

    const usedRam = Math.round(process.memoryUsage().rss / 1024 / 1024);
    const totalRam = Math.round(os.totalmem() / 1024 / 1024);
    const spiderText = `━━━━━━━━━━━━━━\n🕷️ SPIDER-MENU 🕸️\n━━━━━━━━━━━━━━\n\n*🕸️ PRÉFIXE :* ${prefix}\n*📁 RAM :* ${usedRam}/${totalRam} MB\n\n━━━━━━━━━━━━━━\n• ${prefix}spider — ce menu\n• ${prefix}spider quote — citation aléatoire\n• ${prefix}spider info — infos Spider-Man\n• ${prefix}spider power — pouvoir aléatoire\n• ${prefix}spider villain — méchant aléatoire\n• ${prefix}spider fact — fait sur les araignées\n• ${prefix}spider web @personne — lance une toile\n• ${prefix}setspider — changer l'image (owner)\n━━━━━━━━━━━━━━\n\n› ${ownerName}`;

    const spiderImagePath = path.join(__dirname, 'media', 'spider.jpg');
    if (fs.existsSync(spiderImagePath)) {
        await sock.sendMessage(from, { image: fs.readFileSync(spiderImagePath), caption: spiderText }, { quoted: m });
    } else {
        await sylphaReply(spiderText);
    }
}
break;

case 'setspider': {
    if (!isCreator) return sylphaReply("⛔ Commande réservée au créateur du bot.");
    if (!m.quoted || !/image/.test(m.quoted.mtype)) return sylphaReply(`Réponds à une image avec ${prefix}setspider.`);
    try {
        const media = await m.quoted.download();
        fs.writeFileSync(path.join(__dirname, 'media', 'spider.jpg'), media);
        await sylphaReply("✅ Image de .spider mise à jour !");
    } catch (e) {
        await sylphaReply(`❌ Erreur : ${e.message}`);
    }
}
break;

// ───────────────────────────
// 🌍 TG — télécharge un pack de stickers Telegram vers WhatsApp
// ───────────────────────────
case 'tg': {
    if (!text) return sylphaReply(`⚠️ Utilise : ${prefix}tg <nom_du_pack ou lien t.me/addstickers/...>`);
    const tgToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!tgToken) return sylphaReply("Cette commande nécessite TELEGRAM_BOT_TOKEN dans le fichier .env.");

    const tgPackName = text.includes('t.me/addstickers/')
        ? text.split('t.me/addstickers/')[1].split(/[/?]/)[0]
        : text.trim();

    await sylphaReply(mess.wait);
    try {
        const setResp = await axios.get(`https://api.telegram.org/bot${tgToken}/getStickerSet`, { params: { name: tgPackName } });
        if (!setResp.data?.ok) return sylphaReply("❌ Pack introuvable. Vérifie le nom ou le lien.");

        const stickers = setResp.data.result.stickers;
        const supported = stickers.filter(s => !s.is_animated);
        const toSend = supported.slice(0, 30);

        if (toSend.length === 0) {
            return sylphaReply("❌ Ce pack ne contient que des stickers animés (.tgs), non supportés pour l'instant.");
        }

        const packTitle = setResp.data.result.title || tgPackName;

        // Créer/réutiliser un pack local persistant (même système que .addpack/.sendpack)
        const localPackName = ('tg_' + tgPackName).toLowerCase().replace(/[^a-z0-9_-]/g, '');
        const db = JSON.parse(fs.readFileSync(PACK_DB));
        if (!db[localPackName]) {
            db[localPackName] = [];
            fs.mkdirSync(`${STICKER_PACK_DIR}/${localPackName}`, { recursive: true });
        }

        await sylphaReply(`📦 Envoi de ${toSend.length} stickers sur ${stickers.length} (pack : *${packTitle}*)...`);

        let sent = 0;
        for (const st of toSend) {
            try {
                const fileResp = await axios.get(`https://api.telegram.org/bot${tgToken}/getFile`, { params: { file_id: st.file_id } });
                const filePath = fileResp.data.result.file_path;
                const mediaResp = await axios.get(`https://api.telegram.org/file/bot${tgToken}/${filePath}`, { responseType: 'arraybuffer' });
                const mediaBuffer = Buffer.from(mediaResp.data);

                const sticker = new Sticker(mediaBuffer, {
                    pack: packTitle,
                    author: ownerName,
                    type: StickerTypes.FULL,
                    quality: 70,
                });
                const stickerBuffer = await sticker.toBuffer();

                // Sauvegarde locale dans le pack (réutilisable plus tard via .sendpack)
                const fileName = `${st.file_unique_id}.webp`;
                fs.writeFileSync(`${STICKER_PACK_DIR}/${localPackName}/${fileName}`, stickerBuffer);
                db[localPackName].push(fileName);

                await sock.sendMessage(from, { sticker: stickerBuffer, packname: packTitle, author: ownerName }, { quoted: m });
                sent++;
                await new Promise(r => setTimeout(r, 400)); // anti-flood, même rythme que .sendpack
            } catch (e) { /* on saute le sticker en erreur, on continue avec les autres */ }
        }

        fs.writeFileSync(PACK_DB, JSON.stringify(db, null, 2));

        const skipped = stickers.length - toSend.length;
        let footer = `✅ ${sent} stickers envoyés et sauvegardés dans le pack *${localPackName}*.\nRéutilise-les avec ${prefix}sendpack ${localPackName}.`;
        if (skipped > 0) footer += `\nℹ️ ${skipped} non envoyés (animés .tgs, ou limite de 30 par envoi).`;
        await sylphaReply(footer);
    } catch (e) {
        console.error("Erreur commande TG :", e.message);
        sylphaReply("❌ Échec du téléchargement. Vérifie que le nom du pack est correct.");
    }
}
break;

// ───────────────────────────
// 🌍 APPSEARCH — recherche Google Play (nécessite google-play-scraper, ajouté au package.json)
// ───────────────────────────
case 'appsearch': {
    if (!text) return sylphaReply(`⚠️ Utilise : ${prefix}appsearch <nom de l'application>`);
    await sylphaReply(mess.wait);
    try {
        const gplay = require('google-play-scraper');
        const results = await gplay.search({ term: text, num: 1 });
        const app = results?.[0];
        if (!app) return sylphaReply("❌ Aucune application trouvée.");
        const details = await gplay.app({ appId: app.appId });
        const body = `📱 *${details.title}*\n\n👤 Développeur : ${details.developer}\n⭐ Note : ${details.score?.toFixed(1) || 'N/A'}\n📥 Installations : ${details.installs || 'N/A'}\n💰 Prix : ${details.free ? 'Gratuit' : details.priceText}\n\n📝 ${(details.summary || '').slice(0, 200)}\n\n🔗 ${details.url}`;
        const iconRes = await fetch(details.icon);
        const iconBuffer = Buffer.from(await iconRes.arrayBuffer());
        await sock.sendMessage(from, { image: iconBuffer, caption: body }, { quoted: m });
    } catch (e) {
        await sylphaReply(`❌ Erreur : ${e.message}`);
    }
}
break;

// ───────────────────────────
// 🌍 CMD — liste complète en texte simple (variante légère du .menu)
// ───────────────────────────
case 'cmd': {
    const fullCmdText = renderMenu([
        { title: 'GÉNÉRAL', items: ['ping', 'alive', 'menu', 'cmd', 'mich', 'help', 'owner', 'repo', 'repository', 'runtime', 'uptime', 'restart', 'disk', 'hostip', 'modestatus', 'online', 'lastseen', 'zero', 'mine', 'device', 'testapi', 's', 'react', 'listadmin', 'listai', 'listfun', 'listmedia', 'listsecurity', 'autoread', 'delete', 'readmore'] },
        { title: 'MÉDIA & TÉLÉCHARGEMENT', items: ['play', 'video', 'yt', 'ytmp3', 'ytmp4', 'ytsearch', 'tiktok', 'tt', 'ttdl', 'tiktokdl', 'tiktokmp3', 'ttmp3', 'tw', 'twitter', 'facebook', 'fb', 'fbdl', 'fbvideo', 'pinterest', 'spotify', 'mediafire', 'gitclone', 'shortlink', 'shorturl', 'tourl', 'lyric', 'lyrics', 'lyric2', 'lyrics2', 'imdb', 'weather', 'gtts', 'tts', 'appsearch', 'removebg', 'ssweb', 'screenshot', 'mediatag', 'ig', 'igdl', 'instagram', 'ephotomenu', 'gimage', 'image', 'imgur', 'toimage', 'tovideo', 'tomp3', 'toptt', 'toaudio', 'tovoicenote', 'toviewonce', 'vv', 'vv2', 'dlvo', 'tg'] },
        { title: 'STICKERS', items: ['sticker', 'stiker', 'addsticker', 'delsticker', 'setstickercmd', 'delstickercmd', 'addpack', 'delpack', 'listpacks', 'sendpack', 'take', 'steal'] },
        { title: 'ADMIN GROUPE', items: ['kick', 'kickall', 'promote', 'demote', 'mute', 'unmute', 'mute-user', 'unmute-user', 'mutee', 'unmutee', 'tag', 'tagall', 'tagadmin', 'hidetag', 'everyone', 'add', 'remove', 'del', 'poll', 'invite', 'grouplink', 'groupid', 'getgrouppp', 'getpp', 'setgroupname', 'setdesc', 'setppgroup', 'delppgroup', 'resetlink', 'totalmembers', 'groupvcf', 'vcf', 'userid', 'cancelkick', 'kickinactive', 'listactive', 'listinactive', 'opengc', 'closegc', 'opentime', 'closetime', 'editsettings', 'announcements', 'goodbye', 'welcome', 'listgc', 'listonline', 'creategc'] },
        { title: 'SÉCURITÉ & MODÉRATION', items: ['antilink', 'antibot', 'antipromote', 'antidemote', 'antiflood', 'antibadword', 'antibadwords', 'antigm', 'antigroupmention', 'antispam', 'warn', 'resetwarns', 'allow', 'delallowed', 'listallowed', 'listbadword', 'blacklist', 'block', 'unblock', 'unblockall', 'listblocked', 'sudo', 'addsudo', 'delsudo', 'listsudo', 'setprefix', 'setpp', 'setbotpp', 'mode', 'self', 'public', 'clear', 'addprem', 'delprem', 'listignorelist', 'approveall', 'disapproveall', 'listrequests', 'addcode', 'delcode', 'listcode', 'modsettings', 'modstatus'] },
        { title: 'IA', items: ['ai', 'ask', 'search', 'gemini-vision', 'vision', 'agent', 'chatbot', 'voice', 'autopilot', 'codegen', 'blague', 'forget', 'google'] },
        { title: 'PERSONNALISATION', items: ['style', 'setmenu', 'setmenulist'] },
        { title: 'FUN', items: ['catfact', 'riddle', 'quote', 'ship', 'truth', 'dare', 'insult', 'trivia', 'pickupline', 'meme', 'neko', 'waifu', 'shinobu', 'megumin', 'emojimix', 'emix', 'slap', 'kiss', 'hug', 'kill', 'cry', 'yeet', 'simi', 'animekill', 'animesmile', 'animeslap', 'animedance', 'animekiss', 'animeyeet', 'satorugojo', 'sukuna', 'spider', 'setspider'] },
        { title: 'JEU (WCG)', items: ['wcg', 'joinwcg', 'endwcg'] },
        { title: 'OWNER — RÉGLAGES AVANCÉS', items: ['ppprivacy', 'gcaddprivacy', 'readreceipts', 'autoreact', 'alwaysonline', 'autostatusview', 'autotyping', 'autorecord', 'say', 'apk', 'app', 'whois', 'deljunk', 'jid', 'idch', 'checkidch', 'pinchat', 'unpinchat', 'join', 'leave', 'pay', 'payme', 'savestatus', 'tostatus', 'setbio', 'gcbroadcast', 'github', 'flux', 'gen', 'bass', 'blown', 'deep', 'earrape', 'reverse', 'robot', 'xnxx', 'xnxxdl', 'wm'] }
    ]) + `\n\n📊 Total : 269 commandes`;

    try {
        await sock.sendMessage(from, { image: randomMenuImageBuffer }, { quoted: m });
    } catch (e) { /* si la photo échoue, on envoie quand même le texte */ }
    await sock.sendMessage(from, { text: fullCmdText }, { quoted: m });
}
break;

// ───────────────────────────
// 🌍 LISTADMIN / LISTAI / LISTFUN / LISTMEDIA / LISTSECURITY — sous-menus rapides
// ───────────────────────────
case 'listadmin': {
    await sylphaReply(`╭─ ⚡ *ADMIN GROUPE*\n│ ▸ ${prefix}kick\n│ ▸ ${prefix}promote\n│ ▸ ${prefix}demote\n│ ▸ ${prefix}mute\n│ ▸ ${prefix}unmute\n│ ▸ ${prefix}antilink on/off\n│ ▸ ${prefix}welcome on/off\n╰ ▸ ${prefix}antiflood on/off`);
}
break;

case 'listai': {
    await sylphaReply(`╭─ ⚡ *IA*\n│ ▸ ${prefix}ai <question>\n│ ▸ ${prefix}search <question>\n│ ▸ ${prefix}vision <url image>\n│ ▸ ${prefix}agent on/off\n│ ▸ ${prefix}chatbot on/off\n│ ▸ ${prefix}voice on/off\n╰ ▸ ${prefix}codegen <description> (owner)`);
}
break;

case 'listfun': {
    await sylphaReply(`╭─ ⚡ *FUN*\n│ ▸ ${prefix}blague\n│ ▸ ${prefix}spider\n│ ▸ ${prefix}spider quote\n╰ ▸ ${prefix}spider info`);
}
break;

case 'listmedia': {
    await sylphaReply(`╭─ ⚡ *MÉDIA*\n│ ▸ ${prefix}sticker\n│ ▸ ${prefix}yt <recherche/lien>\n│ ▸ ${prefix}tiktok <lien>\n│ ▸ ${prefix}instagram <lien>\n│ ▸ ${prefix}mediafire <lien>\n╰ ▸ ${prefix}appsearch <nom appli>`);
}
break;

case 'listsecurity': {
    await sylphaReply(`╭─ ⚡ *SÉCURITÉ*\n│ ▸ ${prefix}blacklist add/remove/list\n│ ▸ ${prefix}sudo add/remove/list\n│ ▸ ${prefix}mode public/private\n╰ ▸ ${prefix}setprefix <préfixe>`);
}
break;


// ───────────────────────────
// 🌍 RUNTIME COMMAND 
// ───────────────────────────
case 'runtime':
case 'uptime': {
const uptime = Date.now() - startTime;
const formattedUptime = formatUptime(uptime);
await sylphaReply(`🤖 Bot has been running for: *${formattedUptime}*`);
break;
}


// ───────────────────────────
// 🌍 OWNER COMMAND 
// ───────────────────────────
case 'owner': {
    const ownerVCard = `BEGIN:VCARD\nVERSION:3.0\nFN:${ownerName}\nORG:${botName};\nTEL;type=CELL;type=VOICE;waid=${ownerNumbers[0]}:+${ownerNumbers[0]}\nEND:VCARD`;   
    await sock.sendMessage(from, {
        contacts: {
            displayName: ownerName,
            contacts: [{ vcard: ownerVCard }]
        }
    }, { quoted: m});    
    await sylphaReply(`Voici les coordonnées de mon maître. Contactez-le avec respect.`);
    break;
}           
     
// ───────────────────────────
// 🌍 PUBLIC COMMAND 
// ───────────────────────────                                      
case 'self': {
    if (!isAdminUser) return sylphaReply(mess.error.owner);

    if (!settings.public)
        return sylphaReply("✅ Self mode is already active.");

    settings.public = false;
    saveSettings(userKey, settings);

    await sylphaReply("✅ Bot is now in Self Mode. Only the Owner can use commands.");
}
break;

case 'public': {
    if (!isAdminUser) return sylphaReply(mess.error.owner);

    if (settings.public)
        return sylphaReply("✅ Public mode is already active.");

    settings.public = true;
    saveSettings(userKey, settings);

    await sylphaReply("✅ Bot is now in Public Mode. Everyone can use commands.");
}
break;
   
             
//==============================//                                
case 'addprem': {
 if (!isAdminUser) return sylphaReply('❌ Cette commande est réservée à mon propriétaire !');
  let userToAdd = m.args[0]?.replace(/[^0-9]/g, '');
 if (!userToAdd) return sylphaReply(`Please provide a number to add. Example: ${prefix}addprem 1234567890`);
 if (premiumUsers.includes(userToAdd)) return sylphaReply('Cet utilisateur est deja premium !');
  premiumUsers.push(userToAdd);
 fs.writeFileSync('./system/premium.json', JSON.stringify(premiumUsers, null, 2));
   await sylphaReply(`✅ Successfully added ${userToAdd} to the premium list.`);
                break;
            }

case 'delprem': {
if (!isAdminUser) return sylphaReply('❌ Cette commande est réservée à mon propriétaire !');
  let userToRemove = m.args[0]?.replace(/[^0-9]/g, '');
 if (!userToRemove) return sylphaReply(`Please provide a number to remove. Example: ${prefix}delprem 1234567890`);
const index = premiumUsers.indexOf(userToRemove);
if (index === -1) return sylphaReply("Cet utilisateur n'est pas sur la liste premium.");
   premiumUsers.splice(index, 1);
fs.writeFileSync('./system/premium.json', JSON.stringify(premiumUsers, null, 2));
    await sylphaReply(`✅ Successfully removed ${userToRemove} from the premium list.`);
                break;
            }
//===============================//

// ───────────────────────────
// 🌍 VV COMMAND 
// ───────────────────────────       
case 'vv': {
    if (!isAdminUser) {
        await sylphaReply(mess.owner);
        break;
    }

    if (!m.quoted) {
        await sylphaReply('Reponds a un message a vue unique, une image, une video ou un message vocal.');
        break;
    }

    await sylphaReply(mess.wait);

    try {
        const mediaBuffer = await m.quoted.download();
        if (!mediaBuffer) {
            await sylphaReply('⚠️ Failed to download the media. It might have expired or been deleted.');
            break;
        }

        const mediaType = m.quoted.mtype;

        if (mediaType === 'imageMessage') {
            await sock.sendMessage(from, {
                image: mediaBuffer,
                caption: "✅ Here is the view-once image\n> By ZERO TRACE."
            }, { quoted: m });

        } else if (mediaType === 'videoMessage') {
            await sock.sendMessage(from, {
                video: mediaBuffer,
                caption: "✅ Here is the view-once video\n> By ZERO TRACE."
            }, { quoted: m });

        } else if (mediaType === 'audioMessage') {
            await sock.sendMessage(from, {
                audio: mediaBuffer,
                mimetype: 'audio/mpeg',
                ptt: true
            }, { quoted: m });

        } else {
            await sylphaReply('⚠️ Unsupported format. This command only works for images, videos, and voice notes.');
        }

    } catch (error) {
        console.error('Erreur commande VV :', error);
        await sylphaReply('⚠️ An error occurred. The view-once message may have expired.');
    }
    break;
}


// ───────────────────────────
// 🌍 PINCHAT COMMAND 
// ───────────────────────────
case 'pinchat': {
    if (!isAdminUser) return sylphaReply(mess.error.owner);
    try {
        await sock.chatModify({ pin: true }, from);
        await sylphaReply("✅ Chat pinned successfully!");
    } catch (e) {
        console.error(e);
        sylphaReply("❌ Failed to pin the chat.");
    }
    break;
}


// ───────────────────────────
// 🌍 UNPINCHAT COMMAND 
// ───────────────────────────
case 'unpinchat': {
    if (!isAdminUser) return sylphaReply(mess.error.owner);
    try {
        await sock.chatModify({ pin: false }, from);
        await sylphaReply("✅ Chat unpinned successfully!");
    } catch (e) {
        console.error(e);
        sylphaReply("❌ Failed to unpin the chat.");
    }
    break;
}


// ───────────────────────────
// 🌍 ALWAYSONLINE COMMAND 
// ───────────────────────────
case 'alwaysonline': {
    if (!isAdminUser) return sylphaReply(mess.error.owner);
    if (m.args.length < 1) return sylphaReply(`*Always Online Status:* ${config.auto.online ? 'ON' : 'OFF'}\n\nUse *${prefix}alwaysonline on* or *${prefix}alwaysonline off*`);
    
    const action = m.args[0].toLowerCase();
    if (action === 'on') {
        if (config.auto.online === true) return sylphaReply("Toujours en ligne est deja active.");
        config.auto.online = true;
        await sylphaReply("✅ Always Online has been turned ON.");
    } else if (action === 'off') {
        if (config.auto.online === false) return sylphaReply("Toujours en ligne est deja desactive.");
        config.auto.online = false;
        await sylphaReply("✅ Always Online has been turned OFF.");
    } else {
        return sylphaReply(`Invalid option. Use *${prefix}alwaysonline on* or *${prefix}alwaysonline off*`);
    }
    // Save the change to config.js
    fs.writeFileSync('./config.js', `module.exports = ${JSON.stringify(config, null, 2)};`);
    break;
}


// ───────────────────────────
// 🌍 AUTOSTATUSVIEW COMMAND 
// ───────────────────────────
case 'autostatusview': {
    if (!isAdminUser) return sylphaReply(mess.error.owner);
    if (m.args.length < 1) return sylphaReply(`*Auto Status View Status:* ${config.auto.status_view ? 'ON' : 'OFF'}\n\nUse *${prefix}autostatusview on* or *${prefix}autostatusview off*`);
    
    const action = m.args[0].toLowerCase();
    if (action === 'on') {
        if (config.auto.status_view === true) return sylphaReply("Vue auto des statuts est deja activee.");
        config.auto.status_view = true;
        await sylphaReply("✅ Auto Status View has been turned ON.");
    } else if (action === 'off') {
        if (config.auto.status_view === false) return sylphaReply("Vue auto des statuts est deja desactivee.");
        config.auto.status_view = false;
        await sylphaReply("✅ Auto Status View has been turned OFF.");
    } else {
        return sylphaReply(`Invalid option. Use *${prefix}autostatusview on* or *${prefix}autostatusview off*`);
    }
    // Save the change to config.js
    fs.writeFileSync('./config.js', `module.exports = ${JSON.stringify(config, null, 2)};`);
    break;
}


// ───────────────────────────
// 🌍 SAVE STATUS COMMAND 
// ───────────────────────────
case 'savestatus': {
    if (!isAdminUser) return sylphaReply(mess.error.owner);
    if (!m.quoted || !/image|video/.test(m.quoted.mtype)) return sylphaReply("Please reply to a status (image or video) to save it.");
    try {
        const media = await m.quoted.download();
        await sock.sendMessage(from, { 
            image: /image/.test(m.quoted.mtype) ? media : undefined,
            video: /video/.test(m.quoted.mtype) ? media : undefined,
            caption: "Voici le statut que tu m'as demande de sauvegarder."
        });
    } catch (e) {
        console.error(e);
        sylphaReply("❌ Failed to save the status.");
    }
    break;
}            


// ───────────────────────────
// 🌍 DELJUNK 
// ───────────────────────────
case 'deljunk': {
    if (!isAdminUser) return sylphaReply('Seul le proprietaire peut utiliser cette commande.');
    const chats = await sock.chats.all();
    let deleted = 0;
    for (let chat of chats) {
        if (!chat.jid.endsWith('@g.us') && !chat.jid.endsWith('@s.whatsapp.net')) {
            await sock.chatModify({ archive: true, delete: true }, chat.jid);
            deleted++;
        }
    }
    sylphaReply(`Deleted ${deleted} junk chats.`);
    break;
}


// ───────────────────────────
// 🌍 DISK
// ───────────────────────────
case 'disk': {
    if (!isAdminUser) return sylphaReply('Seul le proprietaire peut utiliser cette commande.');
    const { size } = require('fs').statSync(process.cwd());
    const diskUsage = formatBytes(size);
    sylphaReply(`Disk usage: ${diskUsage}`);
    break;
}


// ───────────────────────────
// 🌍 GC ADD PRIVACY COMMAND 
// ───────────────────────────
case 'gcaddprivacy': {
    if (!isAdminUser) return sylphaReply('Seul le proprietaire peut utiliser cette commande.');
    if (!isGroup) return sylphaReply('Cette commande fonctionne uniquement dans un groupe.');
    if (!text) return sylphaReply('Fournis un numero a ajouter. Exemple : !gcaddprivacy 234xxx');
    const number = text.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
    try {
        await sock.groupParticipantsUpdate(from, [number], 'add');
        sylphaReply(`Added ${number.split('@')[0]} to the group with privacy bypass.`);
    } catch (e) {
        console.log('Erreur GCAddPrivacy :', e);
        sylphaReply('Failed to add user (they may have privacy settings enabled).');
    }
    break;
}


// ───────────────────────────
// 🌍 GROUP ID
// ───────────────────────────
case 'groupid': {
    if (!isAdminUser) return sylphaReply('Seul le proprietaire peut utiliser cette commande.');
    if (!isGroup) return sylphaReply('Cette commande fonctionne uniquement dans un groupe.');
    sylphaReply(`Group ID: ${from}`);
    break;
}


// ───────────────────────────
// 🌍 HOST IP
// ───────────────────────────
case 'hostip': {
    if (!isAdminUser) return sylphaReply('Seul le proprietaire peut utiliser cette commande.');
    const os = require('os');
    const networkInterfaces = os.networkInterfaces();
    let ip = 'Not available';
    for (let iface in networkInterfaces) {
        for (let alias of networkInterfaces[iface]) {
            if (alias.family === 'IPv4' && !alias.internal) {
                ip = alias.address;
                break;
            }
        }
    }
    sylphaReply(`Host IP: ${ip}`);
    break;
}

// =========================//
// JOIN COMMAND 
//=========================//
case 'join': {
    if (!isAdminUser) return sylphaReply('Réservé à mon propriétaire.')
    if (!text) return sylphaReply(`Example: ${prefix}join https://chat.whatsapp.com/xxxx`)

    try {
        const invite = text.match(/chat\.whatsapp\.com\/([0-9A-Za-z]+)/)
        if (!invite) return sylphaReply('Lien de groupe WhatsApp invalide.')

        await sock.groupAcceptInvite(invite[1])
        sylphaReply('✅ Joined group.')

    } catch (e) {
        console.log('ERREUR JOIN :', e)
        sylphaReply('❌ Failed to join group.')
    }
    break
}

case 'lastseen': {
    if (!isAdminUser) return sylphaReply('Réservé à mon propriétaire.')
    if (!text) return sylphaReply('Example: !lastseen 234xxxx')

    const jid = text.replace(/[^0-9]/g, '') + '@s.whatsapp.net'

    try {
        await sock.presenceSubscribe(jid)
        await new Promise(r => setTimeout(r, 1200))

        const presence = sock.presence[jid]

        if (!presence || !presence.lastKnownPresence)
            return sylphaReply('Last seen not available (privacy restricted).')

        sylphaReply(
            `📡 Presence for ${jid.split('@')[0]}:\n• ${presence.lastKnownPresence}`
        )

    } catch (e) {
        console.log('ERREUR LASTSEEN :', e)
        sylphaReply('Echec de recuperation de la presence.')
    }
    break
}

// ───────────────────────────
// 🌍 LEAVE COMMAND 
// ───────────────────────────
case 'leave': {
    if (!isAdminUser) return sylphaReply('Seul le proprietaire peut utiliser cette commande.');
    if (!isGroup) return sylphaReply('Cette commande fonctionne uniquement dans un groupe.');
    await sock.groupLeave(from);
    sylphaReply('Groupe quitte.');
    break;
}


// ───────────────────────────
// 🌍 LISTBADWORD COMMAND 
// ───────────────────────────
case 'listbadword': {
    if (!isAdminUser) return sylphaReply('Seul le proprietaire peut utiliser cette commande.');
    const badwords = JSON.parse(fs.readFileSync('./system/badwords.json') || '[]');
    if (badwords.length === 0) return sylphaReply('No bad words listed.');
    sylphaReply('Bad words: ' + badwords.join(', '));
    break;
}

// ───────────────────────────
// 🌍 LISTBLOCKED COMMAND 
// ───────────────────────────
case 'listblocked': {
    if (!isAdminUser) return sylphaReply('Seul le proprietaire peut utiliser cette commande.');
    const blocked = await sock.fetchBlocklist();
    if (blocked.length === 0) return sylphaReply('Aucun numero bloque.');
    sylphaReply('Numeros bloques : ' + blocked.map(num => num.split('@')[0]).join(', '));
    break;
}


// ───────────────────────────
// 🌍 LISTIGNORELIST COMMAND 
// ───────────────────────────
case 'listignorelist': {
    if (!isAdminUser) return sylphaReply('Seul le proprietaire peut utiliser cette commande.');
    // Assuming you have an ignore list in a JSON file (e.g., system/ignorelist.json)
    const ignoreList = JSON.parse(fs.readFileSync('./system/ignorelist.json') || '[]');
    if (ignoreList.length === 0) return sylphaReply('No ignored chats.');
    sylphaReply('Ignored chats: ' + ignoreList.join(', '));
    break;
}


// ───────────────────────────
// 🌍 LISTSUDO COMMAND 
// ───────────────────────────
case 'listsudo': {
    if (!isAdminUser) return sylphaReply('Seul le proprietaire peut utiliser cette commande.');
    const sudoList = JSON.parse(fs.readFileSync('./system/owner.json') || '[]');
    if (sudoList.length === 0) return sylphaReply('Aucun utilisateur sudo.');
    sylphaReply('Utilisateurs sudo : ' + sudoList.join(', '));
    break;
}


// ───────────────────────────
// 🌍 MODESTATUS COMMAND 
// ───────────────────────────
case 'modestatus': {
    if (!isAdminUser) return sylphaReply('Seul le proprietaire peut utiliser cette commande.');
    if (!text) return sylphaReply('Fournis un statut. Exemple : !modestatus En ligne');
    await sock.updateProfileStatus(text);
    sylphaReply('Status updated to: ' + text);
    break;
}


// ───────────────────────────
// 🌍 ONLINE COMMAND 
// ───────────────────────────
case 'online': {
    if (!isAdminUser) return sylphaReply('Seul le proprietaire peut utiliser cette commande.');
    await sock.sendPresenceUpdate('available');
    sylphaReply('Bot is now online.');
    break;
}


// ───────────────────────────
// 🌍 SETSTICKER COMMAND 
// ───────────────────────────
case 'setstickercmd': {
    if (!isAdminUser) return sylphaReply('Réservé à mon propriétaire.')
    if (!m.quoted || m.quoted.mtype !== 'stickerMessage') {
        return sylphaReply('❌ Reply to the sticker you want to set a command for.')
    }
    if (!text) return sylphaReply('Fournis un nom de commande. Exemple : .setstickercmd menu')

    // Get the SHA256 hash of the quoted sticker
    const stickerHash = m.quoted.fileSha256.toString('base64')

    const file = './system/stickerCmds.json'
    const data = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file)) : {}

    data[stickerHash] = text.toLowerCase()
    fs.writeFileSync(file, JSON.stringify(data, null, 2))

    sylphaReply(`✅ Sticker command set: *${text}*.`)
    break
}


// ───────────────────────────
// 🌍 DELSTICKER COMMAND 
// ───────────────────────────
case 'delstickercmd': {
    if (!isAdminUser) return sylphaReply('Réservé à mon propriétaire.')
    if (!m.quoted || m.quoted.mtype !== 'stickerMessage') {
        return sylphaReply('❌ Reply to a sticker to remove its command.')
    }

    const stickerHash = m.quoted.fileSha256.toString('base64')
    const file = './system/stickerCmds.json'
    const data = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file)) : {}

    if (!data[stickerHash]) {
        return sylphaReply('❌ This sticker has no command assigned to it.')
    }

    delete data[stickerHash]
    fs.writeFileSync(file, JSON.stringify(data, null, 2))

    sylphaReply('✅ Sticker command removed successfully.')
    break
}

// ───────────────────────────
// 🌍 TOSTATUS COMMAND 
// ───────────────────────────
case 'tostatus': {
    if (!isAdminUser) return sylphaReply('Seul le proprietaire peut utiliser cette commande.')
    if (!m.quoted) return sylphaReply('Reponds a un message.')

    try {
        const q = m.quoted
        let msg = {}

        if (q.mtype === 'imageMessage') {
            const buffer = await q.download()
            msg = { image: buffer, caption: q.text || '' }

        } else if (q.mtype === 'videoMessage') {
            const buffer = await q.download()
            msg = { video: buffer, caption: q.text || '' }

        } else if (q.mtype === 'audioMessage') {
            const buffer = await q.download()
            msg = { audio: buffer, mimetype: 'audio/mp4' }

        } else if (q.mtype === 'conversation' || q.mtype === 'extendedTextMessage') {
            msg = { text: q.text }
        } else {
            return sylphaReply('Type de message non supporte.')
        }

        await sock.sendMessage('status@broadcast', msg)
        sylphaReply('✅ Sent to status.')

    } catch (e) {
        console.log('ERREUR TOSTATUS :', e)
        sylphaReply('❌ Failed to post status.')
    }
    break
}


// ───────────────────────────
// 🌍 DLVO/VV2 COMMAND 
// ───────────────────────────
case 'dlvo':
case 'vv2': {
    if (!isAdminUser) {
        await sylphaReply(mess.owner);
        break;
    }

    if (!m.quoted) {
        await sylphaReply('Reponds a un message a vue unique pour reveler son contenu.');
        break;
    }

    try {
        const mediaBuffer = await m.quoted.download();
        if (!mediaBuffer) {
            await sylphaReply('⚠️ Failed to download the media. It might have expired or been deleted.');
            break;
        }

        const mediaType = m.quoted.mtype;

        if (mediaType === 'imageMessage') {
            await sock.sendMessage(sender, {
                image: mediaBuffer,
                caption: "✅ Here is the view-once image you requested.\n> By ZERO TRACE."
            });
            if (isGroup) await sylphaReply("✅ Content has been sent to your private DM.");

        } else if (mediaType === 'videoMessage') {
            await sock.sendMessage(sender, {
                video: mediaBuffer,
                caption: "✅ Here is the view-once video you requested.\n> By ZERO TRACE."
            });
            if (isGroup) await sylphaReply("✅ Content has been sent to your private DM.");

        } else if (mediaType === 'audioMessage') {
            await sock.sendMessage(sender, {
                audio: mediaBuffer,
                mimetype: 'audio/mpeg',
                ptt: true
            });
            if (isGroup) await sylphaReply("✅ Content has been sent to your private DM.");

        } else {
            await sylphaReply('⚠️ The replied message is not a view-once image, video, or voice note.');
        }

    } catch (error) {
        console.error('Erreur commande DLVO :', error);
        await sylphaReply('⚠️ An error occurred. The view-once message may have expired.');
    }
    break;
}


// ───────────────────────────
// 🌍 TOVIEWONCE COMMAND 
// ───────────────────────────
case 'toviewonce': {
    if (!m.quoted) {
        return sylphaReply(`Please reply to a message with media (image/video) to send as view-once.`);
    }
    if (!/image|video/.test(m.quoted.mtype)) {
        return sylphaReply(`Seules les images et videos peuvent etre envoyees en vue unique.`);
    }
   try {
        const mediaBuffer = await m.quoted.download();
        if (!mediaBuffer) throw new Error("Echec du telechargement du media du message cite.");
        const mediaType = m.quoted.mtype.replace(/Message/gi, '');      
        await sock.sendMessage(from, {
            [mediaType]: mediaBuffer,
            viewOnce: true
        }, { quoted: m });
    } catch (e) {
        console.error("Erreur commande ToViewOnce :", e);
        sylphaReply("Desole, une erreur est survenue lors de la creation du message a vue unique.");
    }
    break;
}


// ───────────────────────────
// 🌍 UNBLOCK COMMAND 
// ───────────────────────────
case 'unblock': {
    if (!isAdminUser) return sylphaReply('Seul le proprietaire peut utiliser cette commande.');
    if (!text) return sylphaReply('Fournis un numero a debloquer. Exemple : !unblock 234xxx');
    const number = text.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
    await sock.updateBlockStatus(number, 'unblock');
    sylphaReply(`Unblocked ${number.split('@')[0]}.`);
    break;
}


// ───────────────────────────
// 🌍 UNBLOCKALL COMMAND 
// ───────────────────────────
case 'unblockall': {
    if (!isAdminUser) return sylphaReply('Seul le proprietaire peut utiliser cette commande.');
    const blocked = await sock.fetchBlocklist();
    for (let number of blocked) {
        await sock.updateBlockStatus(number, 'unblock');
    }
    sylphaReply(`Unblocked all ${blocked.length} numbers.`);
    break;
}


// ───────────────────────────
// 🌍 WARN COMMAND 
// ───────────────────────────
case 'warn': {
    if (!isAdminUser) return sylphaReply('Seul le proprietaire peut utiliser cette commande.');
    if (!isGroup) return sylphaReply('Cette commande fonctionne uniquement dans un groupe.');
    if (!text) return sylphaReply('Fournis un numero et une raison. Exemple : !warn 234xxx Spam');
    const [targetNum, ...reason] = text.split(' ');
    const target = targetNum.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
    if (!groupMetadata.participants.map(p => p.id).includes(target)) return sylphaReply('Utilisateur pas dans le groupe.');
    const warnReason = reason.join(' ') || 'Aucune raison fournie';
    sylphaReply(`@${target.split('@')[0]} has been warned for: ${warnReason}`, { mentions: [target] });
    break;
}

// ───────────────────────────
// 🌍 PPPRIVACY COMMAND 
// ───────────────────────────
case 'ppprivacy': {
    if (!isAdminUser) return sylphaReply('Seul le proprietaire peut utiliser cette commande.');
    if (!text) return sylphaReply('Please specify privacy (on/off). Example: !ppprivacy on');
    const privacy = text.toLowerCase() === 'on';
    await sock.updateProfilePicturePrivacy(privacy);
    sylphaReply(`Profile picture privacy set to: ${privacy ? 'On' : 'Off'}`);
    break;
}


// ───────────────────────────
// 🌍 REACT COMMAND 
// ───────────────────────────
case 'react': {
    if (!isAdminUser) return sylphaReply('Seul le proprietaire peut utiliser cette commande.');
    if (!m.quoted || !text) return sylphaReply('Please reply to a message with a reaction emoji. Example: !react 😄');
    await sock.sendMessage(from, { react: { text: text, key: m.quoted.key } });
    sylphaReply('Reaction ajoutee.');
    break;
}


// ───────────────────────────
// 🌍 READRECIEPT COMMAND 
// ───────────────────────────
case 'readreceipts': {
    if (!isAdminUser) return sylphaReply('Seul le proprietaire peut utiliser cette commande.');
    if (!text) return sylphaReply('Please specify (on/off). Example: !readreceipts on');
    const status = text.toLowerCase() === 'on';
    await sock.updateReadReceipts(status);
    sylphaReply(`Read receipts set to: ${status ? 'On' : 'Off'}`);
    break;
}


// ───────────────────────────
// 🌍 RESTART 
// ───────────────────────────
case 'restart': {
    if (!isAdminUser) return sylphaReply('Seul le proprietaire peut utiliser cette commande.');
    sylphaReply('Restarting bot...');
    process.exit(1); // This will trigger a reconnect in index.js
    break;
}


// ──────────────────────────
// 🌍 SETBIO COMMAND 
// ──────────────────────────
case 'setbio': {
    if (!isAdminUser) return sylphaReply('Seul le proprietaire peut utiliser cette commande.');
    if (!text) return sylphaReply('Fournis une bio. Exemple : !setbio Bonjour le monde');
    await sock.updateProfileStatus(text);
    sylphaReply('Bio updated.');
    break;
}

        
            
// ───────────────────────────
// 🌍 KICK COMMAND 
// ───────────────────────────
case 'kick': 
case 'remove': {
    if (!isGroup) return sylphaReply('❌ This command can only be used in groups.');
    if (!isAdmin) return sylphaReply('❌ Only group admins can remove members.');
    if (!isBotAdmin) return sylphaReply('❌ I need admin rights to remove members.');

    let user = null;
    const mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || m.mentionedJid;
    if (mentioned && mentioned.length > 0) {
        user = mentioned[0];
    } else if (m.quoted?.sender) {
        user = m.quoted.sender;
    } else if (args[0]) {
        const num = args[0].replace(/[^0-9]/g, '');
        if (num) user = `${num}@s.whatsapp.net`;
    }

    if (!user) return sylphaReply('❌ Reply to a user, mention them (@number), or provide a number.');

    try {
        await sock.groupParticipantsUpdate(from, [user], 'remove');
        sylphaReply(`✅ Removed *@${user.split('@')[0]}*`, { mentions: [user] });
    } catch (err) {
        console.log('ERREUR REMOVE :', err);
        sylphaReply('❌ Failed to remove member.');
    }
    break;
}


// ───────────────────────────
// 🌍 ADD COMMAND 
// ───────────────────────────
case 'add': {
    if (!isGroup) return sylphaReply('❌ This command can only be used in groups.');
    if (!isAdmin) return sylphaReply('❌ Only group admins can add members.');
    if (!isBotAdmin) return sylphaReply('❌ I need admin rights to add members.');

    let user = args[0]?.replace(/[^0-9]/g, '');
    if (!user) return sylphaReply('❌ Provide a number to add.');

    try {
        await sock.groupParticipantsUpdate(
            from,
            [`${user}@s.whatsapp.net`],
            'add'
        );
        sylphaReply(`✅ Added *@${user}*`, { mentions: [`${user}@s.whatsapp.net`] });
    } catch (err) {
        console.log('ERREUR ADD :', err);
        sylphaReply('❌ Failed to add member.');
    }
    break;
}


// ───────────────────────────
// 🌍 GETPP COMMAND 
// ───────────────────────────
case 'getpp': {
    let target = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || m.quoted?.sender || sender;
    await sylphaReply(mess.wait);
    try {
        const ppUrl = await sock.profilePictureUrl(target, 'image');
        await sock.sendMessage(from, { 
            image: { url: ppUrl },
            caption: `Profile picture of @${target.split('@')[0]}`,
            mentions: [target]
        }, { quoted: m });
    } catch (e) {
        sylphaReply("Impossible de recuperer la photo de profil. L'utilisateur n'en a peut-etre pas, ou ses reglages de confidentialite l'empechent.");
    }
}
break;


// ───────────────────────────
// 🌍 ALLOW COMMAND 
// ───────────────────────────
case 'allow': {
    if (!isGroup) return sylphaReply('Cette commande fonctionne uniquement dans un groupe.')
    if (!isAdmin) return sylphaReply('Seuls les admins du groupe peuvent utiliser cette commande.')

    const userToAllow = args[0]?.replace(/[^0-9]/g, '')
    if (!userToAllow)
        return sylphaReply(`Please provide a number.\nExample: ${prefix}allow 234xxxxxxxxx`)

    const file = './system/allowed.json'
    const allowedList = fs.existsSync(file)
        ? JSON.parse(fs.readFileSync(file))
        : []

    if (allowedList.includes(userToAllow))
        return sylphaReply('Cet utilisateur est deja autorise.')

    allowedList.push(userToAllow)
    fs.writeFileSync(file, JSON.stringify(allowedList, null, 2))

    sylphaReply(
        `✅ @${userToAllow} has been added to the allowed list.`,
        { mentions: [`${userToAllow}@s.whatsapp.net`] }
    )
    break
}


// ───────────────────────────
// 🌍 DELALLOWED COMMAND 
// ───────────────────────────
case 'delallowed': {
    if (!isGroup) return sylphaReply('Cette commande fonctionne uniquement dans un groupe.')
    if (!isAdmin) return sylphaReply('Seuls les admins du groupe peuvent utiliser cette commande.')

    const userToRemove = args[0]?.replace(/[^0-9]/g, '')
    if (!userToRemove)
        return sylphaReply(`Please provide a number.\nExample: ${prefix}delallowed 234xxxxxxxxx`)

    const file = './system/allowed.json'
    const allowedList = fs.existsSync(file)
        ? JSON.parse(fs.readFileSync(file))
        : []

    const index = allowedList.indexOf(userToRemove)
    if (index === -1)
        return sylphaReply("Cet utilisateur n'est pas dans la liste autorisee.")

    allowedList.splice(index, 1)
    fs.writeFileSync(file, JSON.stringify(allowedList, null, 2))

    sylphaReply(
        `✅ Removed @${userToRemove} from allowed list.`,
        { mentions: [`${userToRemove}@s.whatsapp.net`] }
    )
    break
}


// ───────────────────────────
// 🌍 LISTALLOWED COMMAND 
// ───────────────────────────
case 'listallowed': {
    if (!isGroup) return sylphaReply('Cette commande fonctionne uniquement dans un groupe.')
    if (!isAdmin) return sylphaReply('Seuls les admins du groupe peuvent utiliser cette commande.')

    const file = './system/allowed.json'
    const allowedList = fs.existsSync(file)
        ? JSON.parse(fs.readFileSync(file))
        : []

    if (!allowedList.length)
        return sylphaReply('Aucun utilisateur dans la liste autorisee.')

    let msg = '*👥 Allowed Users 👥*\n\n'
    const mentions = []

    allowedList.forEach((user, i) => {
        msg += `${i + 1}. @${user}\n`
        mentions.push(`${user}@s.whatsapp.net`)
    })

    sylphaReply(msg, { mentions })
    break
}


// ───────────────────────────
// 🌍 ANNOUNCEMENT COMMAND 
// ───────────────────────────
case 'announcements': {
    if (!isGroup) return sylphaReply(mess.group)
    if (!isAdmin) return sylphaReply(mess.admin)
    if (!isBotAdmin) return sylphaReply(mess.botAdmin)

    if (!args[0])
        return sylphaReply(`Use *${prefix}announcements on* or *${prefix}announcements off*`)

    try {
        const action = args[0].toLowerCase()

        if (action === 'on') {
            await sock.groupSettingUpdate(from, 'announcement')
            sylphaReply('✅ Announcement mode enabled (admins only)')
        } 
        else if (action === 'off') {
            await sock.groupSettingUpdate(from, 'not_announcement')
            sylphaReply('✅ Group opened for all members')
        } 
        else {
            sylphaReply('Invalid option. Use *on* or *off*.')
        }
    } catch (e) {
        console.error('[ANNOUNCEMENTS ERROR]', e)
        sylphaReply('Echec de mise a jour des reglages du groupe.')
    }
    break
}

// ───────────────────────────
// 🌍 ADDCODE COMMAND 
// ───────────────────────────
case 'addcode': {
    if (!isGroup) return sylphaReply('Cette commande fonctionne uniquement dans un groupe.')
    if (!isAdmin) return sylphaReply('Seuls les admins du groupe peuvent utiliser cette commande.')

    const codeToAdd = args[0]
    if (!codeToAdd) return sylphaReply('Fournis un code a ajouter.')

    const file = './system/codes.json'
    const codeList = fs.existsSync(file)
        ? JSON.parse(fs.readFileSync(file))
        : []

    if (codeList.includes(codeToAdd))
        return sylphaReply('Ce code est deja ajoute.')

    codeList.push(codeToAdd)
    fs.writeFileSync(file, JSON.stringify(codeList, null, 2))

    sylphaReply(`✅ Code *${codeToAdd}* has been added.`)
    break
}


// ───────────────────────────
// 🌍 DELCODE COMMAND 
// ───────────────────────────
case 'delcode': {
    if (!isGroup) return sylphaReply('Cette commande fonctionne uniquement dans un groupe.')
    if (!isAdmin) return sylphaReply('Seuls les admins du groupe peuvent utiliser cette commande.')

    const codeToRemove = args[0]
    if (!codeToRemove) return sylphaReply('Fournis un code a retirer.')

    const file = './system/codes.json'
    const codeList = fs.existsSync(file)
        ? JSON.parse(fs.readFileSync(file))
        : []

    const index = codeList.indexOf(codeToRemove)
    if (index === -1)
        return sylphaReply("Ce code n'est pas dans la liste.")

    codeList.splice(index, 1)
    fs.writeFileSync(file, JSON.stringify(codeList, null, 2))

    sylphaReply(`✅ Code *${codeToRemove}* has been removed.`)
    break
}


// ───────────────────────────
// 🌍 LISTCODE COMMAND 
// ───────────────────────────
case 'listcode': {
    if (!isGroup) return sylphaReply('Cette commande fonctionne uniquement dans un groupe.')
    if (!isAdmin) return sylphaReply('Seuls les admins du groupe peuvent utiliser cette commande.')

    const file = './system/codes.json'
    const codeList = fs.existsSync(file)
        ? JSON.parse(fs.readFileSync(file))
        : []

    if (!codeList.length)
        return sylphaReply('No codes are stored.')

    let msg = '*🔑 Codes List 🔑*\n\n'
    codeList.forEach((code, i) => {
        msg += `${i + 1}. ${code}\n`
    })

    sylphaReply(msg)
    break
}


// ───────────────────────────
// 🌍 LISTACTIVE COMMAND
// ───────────────────────────
case 'listactive': {
  if (!isGroup) return sylphaReply("❌ Group only command.");
  if (!isAdmin) return sylphaReply("❌ Admins only.");

  const fs = require("fs");
  const activeDB = JSON.parse(
    fs.readFileSync("./system/active.json")
  );

  const groupData = activeDB[from];
  if (!groupData) return sylphaReply("No activity recorded yet.");

  // Sort by message count
  const sorted = Object.entries(groupData)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 50); // limit

  let text = `📊 *Active Users in Group*\n────────────────────\n`;
  let mentions = [];

  sorted.forEach(([user, count], i) => {
    mentions.push(user);
    text += `🔹 *${i + 1}.* @${user.split("@")[0]}  —  *${count} messages*\n`;
  });

  await sock.sendMessage(from, {
    text,
    mentions
  });

  break;
}


// ───────────────────────────
// 🌍 LISTINACTIVE COMMAND 
// ───────────────────────────
case 'listinactive': {
    if (!isGroup) return sylphaReply('Cette commande fonctionne uniquement dans un groupe.')
    if (!isAdmin) return sylphaReply('Seuls les admins du groupe peuvent utiliser cette commande.')

    const file = './system/activity.json'
    const activity = fs.existsSync(file)
        ? JSON.parse(fs.readFileSync(file))
        : {}

    const inactive = []

    groupMetadata.participants.forEach(p => {
        const raw = p.id.split('@')[0].split(':')[0]
        const data = activity[raw] || activity[p.id]

        if (data && Date.now() - data.lastActive >= 24 * 60 * 60 * 1000) {
            inactive.push(`@${raw}`)
        }
    })

    if (!inactive.length)
        return sylphaReply('No inactive users found (24h+).')

    await sock.sendMessage(
        from,
        {
            text: `*👥 Inactive Users (24h+)*\n\n${inactive.join('\n')}`,
            mentions: inactive.map(v => v.replace('@', '') + '@s.whatsapp.net')
        },
        { quoted: m }
    )
    break
}


// ───────────────────────────
// 🌍 KICKINACTIVE COMMAND 
// ───────────────────────────
case 'kickinactive': {
    if (!isGroup) return sylphaReply('Cette commande fonctionne uniquement dans un groupe.')
    if (!isAdmin) return sylphaReply('Seuls les admins du groupe peuvent utiliser cette commande.')
    if (!isBotAdmin) return sylphaReply('Je dois etre admin pour retirer des membres.')

    const file = './system/activity.json'
    const activity = fs.existsSync(file)
        ? JSON.parse(fs.readFileSync(file))
        : {}

    const targets = []

    groupMetadata.participants.forEach(p => {
        if (p.admin) return // never kick admins

        const raw = p.id.split('@')[0].split(':')[0]
        const data = activity[raw] || activity[p.id]

        if (data && Date.now() - data.lastActive >= 24 * 60 * 60 * 1000) {
            targets.push(p.id)
        }
    })

    if (!targets.length)
        return sylphaReply('Aucun membre inactif a retirer.')

    try {
        await sock.groupParticipantsUpdate(from, targets, 'remove')
        sylphaReply(`✅ Kicked ${targets.length} inactive users.`)
    } catch (e) {
        console.error('[KICK INACTIVE]', e)
        sylphaReply('Echec du retrait de certains membres inactifs.')
    }
    break
}


// ───────────────────────────
// 🌍 CANCEL KICK COMMAND 
// ───────────────────────────
case 'cancelkick': {
    if (!isGroup) return sylphaReply('Cette commande fonctionne uniquement dans un groupe.');
    if (!isAdmin) return sylphaReply('Seuls les admins du groupe peuvent utiliser cette commande.');
    // Placeholder for kick queue (manual cancellation not implemented without queue)
    sylphaReply('Feature not fully implemented without a kick queue system.');
    break;
}

// ───────────────────────────
// 🌍 WELCOME COMMAND 
// ───────────────────────────
case 'welcome': {
    if (!m.isGroup) return sylphaReply('❌ This command works only in groups.');
    if (!isAdmin && !isAdminUser) return sylphaReply('❌ Only admins can change welcome settings.');
    if (!moderation) return sylphaReply('❌ Moderation system not initialized.');
    
    const action = args[0];
    const settings = moderation.getGroupSettings(from);
    
    if (action === 'on') {
        settings.welcome = true;
        moderation.updateGroupSettings(from, { welcome: true });
        await sylphaReply('✅ Welcome message activated!');
    } else if (action === 'off') {
        settings.welcome = false;
        moderation.updateGroupSettings(from, { welcome: false });
        await sylphaReply('❌ Welcome message deactivated!');
    } else {
        await sylphaReply(`📝 *Welcome Settings:*\n${prefix}welcome on - Activate\n${prefix}welcome off - Deactivate`);
    }
    break;
}

case 'goodbye': {
    if (!m.isGroup) return sylphaReply('❌ This command works only in groups.');
    if (!isAdmin && !isAdminUser) return sylphaReply('❌ Only admins can change goodbye settings.');
    if (!moderation) return sylphaReply('❌ Moderation system not initialized.');
    
    const action = args[0];
    const settings = moderation.getGroupSettings(from);
    
    if (action === 'on') {
        settings.goodbye = true;
        moderation.updateGroupSettings(from, { goodbye: true });
        await sylphaReply('✅ Goodbye message activated!');
    } else if (action === 'off') {
        settings.goodbye = false;
        moderation.updateGroupSettings(from, { goodbye: false });
        await sylphaReply('❌ Goodbye message deactivated!');
    } else {
        await sylphaReply(`📝 *Goodbye Settings:*\n${prefix}goodbye on - Activate\n${prefix}goodbye off - Deactivate`);
    }
    break;
}


// ───────────────────────────
// 🌍 APPROVE ALL COMMAND 
// ───────────────────────────
case 'approveall': {
    if (!isGroup) return sylphaReply('Cette commande fonctionne uniquement dans un groupe.')
    if (!isAdmin) return sylphaReply('Seuls les admins du groupe peuvent utiliser cette commande.')
    if (!isBotAdmin) return sylphaReply('Je dois etre admin pour approuver les demandes.')

    const file = './system/requests.json'
    const requests = fs.existsSync(file)
        ? JSON.parse(fs.readFileSync(file))
        : []

    const groupRequests = requests.filter(r => r.group === from)
    if (!groupRequests.length)
        return sylphaReply('No pending join requests.')

    const usersToAdd = groupRequests.map(r => r.jid)

    try {
        await sock.groupParticipantsUpdate(from, usersToAdd, 'add')

        const remaining = requests.filter(r => r.group !== from)
        fs.writeFileSync(file, JSON.stringify(remaining, null, 2))

        sylphaReply(`✅ Attempted to approve ${usersToAdd.length} requests.`)
    } catch (e) {
        console.log('Erreur ApproveAll :', e)
        sylphaReply('❌ WhatsApp blocked the approval (server restriction).')
    }
    break
}

// ───────────────────────────
// 🌍 OPEN GC COMMAND 
// ───────────────────────────
case 'opengc': {
    if (!isGroup) return sylphaReply('❌ This command can only be used in groups.');
    if (!isAdmin) return sylphaReply('❌ Only group admins can use this command.');
    if (!isBotAdmin) return sylphaReply('❌ I need admin rights to open the group.');

    try {
        await sock.groupSettingUpdate(from, 'not_announcement');
        sylphaReply('✅ *Group opened!* Everyone can send messages now.');
    } catch (err) {
        console.log('ERREUR OUVERTURE GROUPE :', err);
        sylphaReply('❌ Failed to open the group.');
    }
    break;
}

// ───────────────────────────
// 🌍 CLOSE GC COMMAND 
// ───────────────────────────
case 'closegc': {
    if (!isGroup) return sylphaReply('❌ This command can only be used in groups.');
    if (!isAdmin) return sylphaReply('❌ Only group admins can use this command.');
    if (!isBotAdmin) return sylphaReply('❌ I need admin rights to close the group.');

    try {
        await sock.groupSettingUpdate(from, 'announcement');
        sylphaReply('🔒 *Group closed!* Only admins can send messages now.');
    } catch (err) {
        console.log('ERREUR FERMETURE GROUPE :', err);
        sylphaReply('❌ Failed to close the group.');
    }
    break;
}


// ───────────────────────────
// 🌍 DELPPGROUP COMMAND 
// ───────────────────────────
case 'delppgroup': {
    if (!isGroup) return sylphaReply(mess.group)
    if (!isAdmin) return sylphaReply(mess.admin)
    if (!isBotAdmin) return sylphaReply(mess.botAdmin)

    try {
        await sock.updateProfilePicture(from, Buffer.alloc(0))
        sylphaReply('✅ Group profile picture has been removed.')
    } catch (e) {
        console.error('[DELPPGROUP ERROR]', e)
        sylphaReply('Echec de suppression de la photo du groupe.')
    }
    break
}


// ───────────────────────────
// 🌍 DISAPPROVEALL COMMAND 
// ───────────────────────────
case 'disapproveall': {
    if (!isGroup) return sylphaReply('Cette commande fonctionne uniquement dans un groupe.')
    if (!isAdmin) return sylphaReply('Seuls les admins du groupe peuvent utiliser cette commande.')

    const file = './system/requests.json'
    const requests = fs.existsSync(file)
        ? JSON.parse(fs.readFileSync(file))
        : []

    const groupRequests = requests.filter(r => r.group === from)
    if (!groupRequests.length)
        return sylphaReply('No pending join requests.')

    const remaining = requests.filter(r => r.group !== from)
    fs.writeFileSync(file, JSON.stringify(remaining, null, 2))

    sylphaReply(`✅ Disapproved ${groupRequests.length} join requests.`)
    break
}


// ───────────────────────────
// 🌍 GETGROUPPP  COMMAND 
// ───────────────────────────
case 'getgrouppp': {
    if (!isGroup) return sylphaReply('Cette commande fonctionne uniquement dans un groupe.');
    try {
        const ppUrl = await sock.profilePictureUrl(from, 'image');
        await sock.sendMessage(from, { image: { url: ppUrl }, caption: 'Photo de profil du groupe' }, { quoted: m });
    } catch {
        sylphaReply("Ce groupe n'a pas de photo de profil.");
    }
    break;
}


// ───────────────────────────
// 🌍 EDIT SETTINGS COMMAND 
// ───────────────────────────
case 'editsettings': {
    if (!isGroup) return sylphaReply('Cette commande fonctionne uniquement dans un groupe.');
    if (!isAdmin) return sylphaReply('Seuls les admins du groupe peuvent utiliser cette commande.');
    if (!text) return sylphaReply('Please provide settings to edit (e.g., welcome on, antitag off).');
    const settings = JSON.parse(fs.readFileSync('./system/group_settings.json'));
    const [setting, action] = text.split(' ');
    if (!setting || !action || !['on', 'off'].includes(action.toLowerCase())) return sylphaReply('Invalid format. Use: <setting> <on/off> (e.g., welcome on)');
    settings[from] = settings[from] || {};
    settings[from][setting.toLowerCase()] = action.toLowerCase() === 'on';
    fs.writeFileSync('./system/group_settings.json', JSON.stringify(settings, null, 2));
    sylphaReply(`✅ ${setting} set to ${action}.`);
    break;
}


// ───────────────────────────
// 🌍 GROUP LINK COMMAND 
// ───────────────────────────
case 'grouplink': {
    if (!isGroup) return sylphaReply('Cette commande fonctionne uniquement dans un groupe.');
    if (!isBotAdmin) return sylphaReply('Je dois etre admin pour generer le lien !');
    try {
        const code = await sock.groupInviteCode(from);
        const link = `https://chat.whatsapp.com/${code}`;
        sylphaReply(`*🔗 Group Invite Link*\n\n${link}`);
    } catch (e) {
        console.log('Erreur lien :', e);
        sylphaReply('Echec de generation du lien de groupe.');
    }
    break;
}


// ───────────────────────────
// 🌍 HIDETAG COMMAND 
// ───────────────────────────
case 'hidetag': {
    if (!isGroup) return sylphaReply('Cette commande fonctionne uniquement dans un groupe.');
    if (!isAdmin) return sylphaReply('Seuls les admins du groupe peuvent utiliser cette commande.');
    let memberIds = groupMetadata.participants.map(p => p.id);
    await sock.sendMessage(from, { text: text || 'Attention!\n> Zero Trace vous appelle toutes et tous', mentions: memberIds });
    break;
}

// ───────────────────────────
// 🌍 EVERYONE COMMAND 
// ───────────────────────────
case 'everyone': {
    if (!isGroup) return sylphaReply('Cette commande fonctionne uniquement dans un groupe.');
    let memberIds = groupMetadata.participants.map(p => p.id);
    await sock.sendMessage(from, { text: text || 'ᴀʟʟ ʜᴀɪʟ ʟᴏʀᴅ sʜᴇғᴢʏ!', mentions: memberIds });
    break;
}


// ───────────────────────────
// 🌍 INVITE COMMAND 
// ───────────────────────────
case 'invite': {
    if (!isGroup) return sylphaReply('Cette commande fonctionne uniquement dans un groupe.');
    if (!isBotAdmin) return sylphaReply("Je dois etre admin pour generer l'invitation !");
    try {
        const code = await sock.groupInviteCode(from);
        sylphaReply(`*🔗 Group Invite Link*\nhttps://chat.whatsapp.com/${code}`);
    } catch (e) {
        sylphaReply("Echec de generation du lien d'invitation.");
    }
    break;
}


// =========================
// 📌 CASE: LIST ONLINE
// =========================
case 'listonline': {
    if (!isGroup) return sylphaReply('🚫 This command only works in groups.');
    if (!isAdmin) return sylphaReply('🚫 Only group admins can use this command.');

    try {
        const groupId = m.key.remoteJid;
        const metadata = await sock.groupMetadata(groupId);
        const participants = metadata.participants.map(p => p.id);

        let onlineUsers = [];

        // Subscribe to each participant presence
        for (let user of participants) {
            try {
                await sock.presenceSubscribe(user);
                // Slight delay to avoid "rate-overlimit"
                await new Promise(res => setTimeout(res, 150));
            } catch (err) {
                continue;
            }
        }

        // Wait 1.5 seconds for presence updates
        await new Promise(res => setTimeout(res, 1500));

        // Get presence from store (Baileys internal)
        for (let user of participants) {
            const presence = sock.presence[user];
            if (presence && presence.lastKnownPresence === 'available') {
                onlineUsers.push(user);
            }
        }

        if (onlineUsers.length === 0) {
            return sylphaReply('😴 No one is online right now.');
        }

        let msg = `🟢 *Online Members (${onlineUsers.length})*\n\n`;
        msg += onlineUsers.map(u => `• @${u.split('@')[0]}`).join('\n');

        await sock.sendMessage(groupId, {
            text: msg,
            mentions: onlineUsers
        });

    } catch (e) {
        console.log("ERREUR LISTONLINE :", e);
        sylphaReply('❌ Error fetching online list.');
    }

    break;
}

// ───────────────────────────
// 🌍 LIST REQUEST COMMAND 
// ───────────────────────────
case 'listrequests': {
    if (!isGroup) return sylphaReply('Cette commande fonctionne uniquement dans un groupe.')
    if (!isAdmin) return sylphaReply('Seuls les admins du groupe peuvent utiliser cette commande.')

    const file = './system/requests.json'
    const requests = fs.existsSync(file)
        ? JSON.parse(fs.readFileSync(file))
        : []

    const groupRequests = requests.filter(r => r.group === from)
    if (!groupRequests.length)
        return sylphaReply('No pending join requests.')

    let msg = '*📩 Join Requests*\n\n'
    const mentions = []

    groupRequests.forEach((req, i) => {
        const num = req.jid.split('@')[0]
        msg += `${i + 1}. @${num} (${moment(req.timestamp).tz('Africa/Lagos').fromNow()})\n`
        mentions.push(req.jid)
    })

    sylphaReply(msg, { mentions })
    break
}


// ───────────────────────────
// 🌍 GETPP COMMAND 
// ───────────────────────────
case 'getpp': {
    if (!isAdminUser) return sylphaReply('Réservée à mon propriétaire, celle-ci.');
    if (!isGroup) return sylphaReply(mess.error.group);
    const target = m.quoted ? m.quoted.m.sender : m.sender;
    try {
        const picUrl = await sock.profilePictureUrl(target, 'image');
        await sock.sendMessage(from, { image: { url: picUrl }, caption: `Profile picture of @${target.split('@')[0]}`, mentions: [target] }, { quoted: m});
    } catch {
        sylphaReply("Cet utilisateur n'a pas de photo de profil.");
    }
    break;
}


// ───────────────────────────
// 🌍 MEDIA TAG COMMAND 
// ───────────────────────────
case 'mediatag': {
    if (!isGroup) return sylphaReply(mess.group)
    if (!isAdmin) return sylphaReply(mess.admin)
    if (!isBotAdmin) return sylphaReply(mess.botAdmin)

    if (!m.quoted || !/imageMessage|videoMessage/.test(m.quoted.mtype))
        return sylphaReply('Reponds a une image ou une video.')

    try {
        const media = await m.quoted.download()
        if (!media) return sylphaReply('Echec du telechargement du media.')

        const mentions = participants.map(p => p.id)
        const type = m.quoted.mtype === 'imageMessage' ? 'image' : 'video'

        await sock.sendMessage(from, {
            [type]: media,
            caption: '📢 Attention everyone!',
            mentions
        })
    } catch (e) {
        console.error('[MEDIATAG ERROR]', e)
        sylphaReply("Echec de l'envoi du media avec mention.")
    }
    break
}


// ───────────────────────────
// 🌍 CLOSE TIME COMMAND 
// ───────────────────────────
case 'closetime': {
    if (!isGroup) return sylphaReply(mess.group)
    if (!isAdmin) return sylphaReply(mess.admin)
    if (!isBotAdmin) return sylphaReply(mess.botAdmin)

    if (!text) {
        return sylphaReply(
            'Usage:\n' +
            `${prefix}closetime 10s\n` +
            `${prefix}closetime 5m\n` +
            `${prefix}closetime 1h\n` +
            `${prefix}closetime 1d`
        )
    }

    const delay = parseDuration(text)
    if (!delay) return sylphaReply('Invalid format. Use 2s | 5m | 1h | 1d')

    sylphaReply(`⏳ Group will close in *${text}*`)

    setTimeout(async () => {
        try {
            await sock.groupSettingUpdate(from, 'announcement')
            sock.sendMessage(from, { text: '🔒 Group is now CLOSED (admins only).' })
        } catch (err) {
            console.log('ERREUR CLOSETIME :', err)
        }
    }, delay)

    break
}

// ───────────────────────────
// 🌍 AUTORECORD COMMAND 
// ───────────────────────────
case 'autorecord': {
  try {
    if (!isAdminUser)
      return sylphaReply("⚠️ Only the bot owner can toggle autorecord!");

    const option = args[0]?.toLowerCase();

    if (option === 'on') {
      settings.autorecord.enabled = true;
      saveSettings(userKey, settings);
      return sylphaReply("🎙️ *Autorecord enabled!*");
    }

    if (option === 'off') {
      settings.autorecord.enabled = false;
      saveSettings(userKey, settings);
      return sylphaReply("❎ *Autorecord disabled!*");
    }

    return sylphaReply(
      `📢 *Autorecord Settings*\n\n` +
      `• Status: ${settings.autorecord.enabled ? "✅ ON" : "❎ OFF"}\n\n` +
      `🧩 Usage:\n.autorecord on/off`
    );

  } catch (err) {
    console.error("Erreur commande Autorecord :", err);
    sylphaReply("💥 Error while updating autorecord settings.");
  }
}
break;

// ───────────────────────────
// 🌍 AUTOREAD COMMAND 
// ───────────────────────────
case 'autoread': {
  try {
    if (!isAdminUser)
      return sylphaReply("⚠️ Only the bot owner can toggle autoread!");

    const option = args[0]?.toLowerCase();

    if (option === 'on') {
      settings.autoread.enabled = true;
      saveSettings(userKey, settings);
      return sylphaReply("✅ *Autoread enabled!*");
    }

    if (option === 'off') {
      settings.autoread.enabled = false;
      saveSettings(userKey, settings);
      return sylphaReply("❎ *Autoread disabled!*");
    }

    return sylphaReply(
      `📢 *Autoread Settings*\n\n` +
      `• Status: ${settings.autoread.enabled ? "✅ ON" : "❎ OFF"}\n\n` +
      `🧩 Usage:\n.autoread on/off`
    );

  } catch (err) {
    console.error("Erreur commande Autoread :", err);
    sylphaReply("💥 An error occurred while updating autoread settings.");
  }
}
break;


// ───────────────────────────
// 🌍 AUTOTYPING COMMAND 
// ───────────────────────────
case 'autotyping': {
  try {
    if (!isAdminUser)
      return sylphaReply("⚠️ Only the bot owner can toggle autotyping!");

    const option = args[0]?.toLowerCase();

    if (option === 'on') {
      settings.autotyping.enabled = true;
      saveSettings(userKey, settings);
      return sylphaReply("✅ Autotyping enabled!");
    }

    if (option === 'off') {
      settings.autotyping.enabled = false;
      saveSettings(userKey, settings);
      return sylphaReply("❎ Autotyping disabled!");
    }

    return sylphaReply(
      `📢 *Autotyping Settings*\n\n` +
      `• Status: ${settings.autotyping.enabled ? "✅ ON" : "❎ OFF"}\n\n` +
      `🧩 Usage:\n.autotyping on/off`
    );

  } catch (err) {
    console.error("Erreur commande Autotyping :", err);
    sylphaReply("💥 Error updating autotyping setting.");
  }
}
break;


// ───────────────────────────
// 🌍 OPEN TIME  COMMAND 
// ───────────────────────────
case 'opentime': {
    if (!isGroup) return sylphaReply(mess.group)
    if (!isAdmin) return sylphaReply(mess.admin)
    if (!isBotAdmin) return sylphaReply(mess.botAdmin)

    if (!text) {
        return sylphaReply(
            'Usage:\n' +
            `${prefix}opentime 10s\n` +
            `${prefix}opentime 5m\n` +
            `${prefix}opentime 1h\n` +
            `${prefix}opentime 1d`
        )
    }

    const delay = parseDuration(text)
    if (!delay) return sylphaReply('Invalid format. Use 2s | 5m | 1h | 1d')

    sylphaReply(`⏳ Group will open in *${text}*`)

    setTimeout(async () => {
        try {
            await sock.groupSettingUpdate(from, 'not_announcement')
            sock.sendMessage(from, { text: '✅ Group is now OPEN.' })
        } catch (err) {
            console.log('ERREUR OPENTIME :', err)
        }
    }, delay)

    break
}

// ───────────────────────────
// 🌍 POLL COMMAND 
// ───────────────────────────
case 'poll': {
    if (!isGroup) return sylphaReply('Cette commande fonctionne uniquement dans un groupe.');
    if (!text.includes(',')) return sylphaReply(`Please provide a question and options separated by commas.\n\n*Example:* ${prefix}poll Best Language?, JavaScript, Python, Java`);
    const [question, ...options] = text.split(',');
    if (options.length < 2) return sylphaReply('A poll must have at least two options.');
    const pollMessage = {
        name: question.trim(),
        values: options.map(opt => opt.trim()),
        selectableCount: 1
    };
    await sock.sendMessage(from, { poll: pollMessage });
    break;
}


// ───────────────────────────
// 🌍 PROMOTE COMMAND 
// ───────────────────────────
case 'promote': {
    if (!isGroup) return sylphaReply('❌ This command can only be used in groups.');
    if (!isAdmin) return sylphaReply('❌ Only group admins can promote members.');
    if (!isBotAdmin) return sylphaReply('❌ I need admin rights to promote.');

    let user =
        m.quoted?.sender ||
        args[0]?.replace(/[^0-9]/g, '') + '@s.whatsapp.net';

    if (!user) return sylphaReply('❌ Reply to a user or provide a number.');

    try {
        await sock.groupParticipantsUpdate(from, [user], 'promote');
        sylphaReply(`⬆️ *@${user.split('@')[0]}* is now an admin`, { mentions: [user] });
    } catch (err) {
        console.log('ERREUR PROMOTE :', err);
        sylphaReply('❌ Failed to promote member.');
    }
    break;
}

// ───────────────────────────
// 🌍 DEMOTE COMMAND 
// ───────────────────────────
case 'demote': {
    if (!isGroup) return sylphaReply('❌ This command can only be used in groups.');
    if (!isAdmin) return sylphaReply('❌ Only group admins can demote members.');
    if (!isBotAdmin) return sylphaReply('❌ I need admin rights to demote.');

    let user =
        m.quoted?.sender ||
        args[0]?.replace(/[^0-9]/g, '') + '@s.whatsapp.net';

    if (!user) return sylphaReply('❌ Reply to a user or provide a number.');

    try {
        await sock.groupParticipantsUpdate(from, [user], 'demote');
        sylphaReply(`⬇️ *@${user.split('@')[0]}* has been demoted`, { mentions: [user] });
    } catch (err) {
        console.log('ERREUR DEMOTE :', err);
        sylphaReply('❌ Failed to demote member.');
    }
    break;
}


// ───────────────────────────
// 🌍 RESETLINK COMMAND 
// ───────────────────────────
case 'resetlink': {
    if (!isGroup) return sylphaReply('Cette commande fonctionne uniquement dans un groupe.');
    if (!isAdmin) return sylphaReply('Seuls les admins du groupe peuvent utiliser cette commande.');
    if (!isBotAdmin) return sylphaReply('Je dois etre admin pour reinitialiser le lien !');
    try {
        await sock.groupRevokeInvite(from);
        sylphaReply('✅ Group invite link has been reset.');
    } catch (e) {
        console.log('Erreur ResetLink :', e);
        sylphaReply('Echec de reinitialisation du lien de groupe.');
    }
    break;
}


// ───────────────────────────
// 🌍 SETDESC COMMAND 
// ───────────────────────────
case 'setdesc': {
    try {
        if (!isGroup) 
            return sylphaReply('❌ This command only works in groups.');

        if (!isAdmin) 
            return sylphaReply('❌ Only group admins can change the description.');

        if (!isBotAdmin) 
            return sylphaReply('❌ I need to be an admin to update the group description.');

        if (!text) 
            return sylphaReply('❌ Please provide a new description.\n\nExample: *.setdesc Welcome to our awesome group!*');

        // Update group description
        await sock.groupUpdateDescription(m.from, text);

        // Fancy confirmation
        const timeNow = moment().tz('Africa/Lagos').format('YYYY-MM-DD HH:mm:ss');
        const msg = `
🖤╔═══════════════🖤
🖤│  ⚡ Group Description Updated ⚡
🖤│
🖤│  👤 Updated by: *${pushname || m.pushName}*
🖤│  📅 Time: ${timeNow}
🖤│
🖤│  📝 New Description:
🖤│  ${text}
🖤╚═══════════════🖤
        `.trim();

        await sock.sendMessage(m.from, { text: msg }, { quoted: m });
    } catch (e) {
        console.error('Erreur SetDesc :', e);
        sylphaReply('❌ Failed to update the group description. Maybe I lost admin rights?');
    }
    break;
}


// ───────────────────────────
// 🌍 SET GROUP NAME  COMMAND 
// ───────────────────────────
case 'setgroupname': {
    if (!isGroup) return sylphaReply('Cette commande fonctionne uniquement dans un groupe.');
    if (!isAdmin) return sylphaReply('Seuls les admins du groupe peuvent utiliser cette commande.');
    if (!isBotAdmin) return sylphaReply('Je dois etre admin pour changer le nom du groupe !');
    if (!text) return sylphaReply('Fournis un nouveau nom pour le groupe.');
    try {
        await sock.groupUpdateSubject(from, text);
        sylphaReply(`✅ Group name changed to:\n*${text}*`);
    } catch (e) {
        console.log('Erreur SetGroupName :', e);
        sylphaReply('Echec du changement de nom du groupe.');
    }
    break;
}


// ───────────────────────────
// 🌍 SETPPGROUP COMMAND 
// ───────────────────────────
case 'setppgroup': {
    if (!isGroup) return sylphaReply(mess.group)
    if (!isAdmin) return sylphaReply(mess.admin)
    if (!isBotAdmin) return sylphaReply(mess.botAdmin)

    if (!m.quoted || m.quoted.mtype !== 'imageMessage')
        return sylphaReply('Reponds a une image pour en faire la photo du groupe.')

    try {
        const img = await m.quoted.download()
        if (!img) return sylphaReply("Echec du telechargement de l'image.")

        await sock.updateProfilePicture(from, img)

        sylphaReply('✅ Group profile picture updated successfully!')
    } catch (e) {
        console.error('[SETPPGROUP ERROR]', e)
        sylphaReply('Echec de mise a jour de la photo du groupe.')
    }
    break
}


// ───────────────────────────
// 🌍 TAG ADMIN COMMAND 
// ───────────────────────────
case 'tagadmin': {
    if (!isGroup) return sylphaReply('Cette commande fonctionne uniquement dans un groupe.');
    if (!isAdminUser) return sylphaReply('Réservée à mon propriétaire, celle-ci.');
    let adminListText = `*👑 Group Admins 👑*\n\n`;
    let mentions = [];
    for (let admin of groupAdmins) {
        adminListText += `➤ @${admin.split('@')[0]}\n`;
        mentions.push(admin);
    }
    await sock.sendMessage(from, { text: adminListText, mentions: mentions });
    break;
}


// ───────────────────────────
// 🌍 TAGALL COMMAND 
// ───────────────────────────
case 'tagall': {
    if (!isGroup)
        return sylphaReply('❌ This command works in groups only.');

    if (!isAdminUser)
        return sylphaReply('❌ Owner access only.');

    const participants = groupMetadata.participants;
    const mentions = participants.map(p => p.id);

    const tagger = pushname || m.pushName || 'Unknown';

    let message = `╭─〔 📣 Group Announcement 〕─╮
│
│ 👤 Tagged by : *${tagger}*
│ 👥 Members  : *${participants.length}*
│
`;

    if (text) {
        message += `│ 📝 Message :
│ ${text}
│
`;
    }

    message += `╰───────────────╯\n\n`;

    message += participants
        .map((p, i) => `• @${p.id.split('@')[0]}`)
        .join('\n');

    await sock.sendMessage(
        from,
        {
            text: message,
            mentions
        },
        { quoted: m }
    );
}
break;


//===============================
// TAG CASE
//===============================
case 'tag': {
    if (!isGroup) return sylphaReply('❌ Group only');
    if (!isAdmin && !isAdminUser) return sylphaReply('❌ Réservé aux administrateurs.');
    
    try {
        const metadata = await sock.groupMetadata(from);
        const participants = metadata.participants;
        const mentions = participants.map(v => v.id);
        
        // Get the message text to tag
        let teks = '';
        
        if (m.quoted) {
            // If replying to a message, use that message's text/caption
            teks = m.quoted.text || m.quoted.caption || '';
        } else if (text) {
            // If text is provided with the command, use that
            teks = text;
        } else {
            // Default message if nothing is provided
            teks = 'Tagging all members';
        }
        
        if (!teks) teks = '‎';
        
        await sock.sendMessage(from, {
            text: teks,
            mentions: mentions
        }, { quoted: m });
        
    } catch (err) {
        console.error('ERREUR TAG :', err);
        sylphaReply('❌ Failed to tag members.');
    }
    break;
}

// ───────────────────────────
// 🌍 TOTAL MEMBERS COMMAND 
// ───────────────────────────
case 'totalmembers': {
    if (!isGroup) return sylphaReply('Cette commande fonctionne uniquement dans un groupe.');
    const total = groupMetadata.participants.length;
    sylphaReply(`*👥 Total Members:* ${total}`);
    break;
}


// ───────────────────────────
// 🌍 USER ID COMMAND 
// ───────────────────────────
case 'userid': {
    if (!isGroup) return sylphaReply('Cette commande fonctionne uniquement dans un groupe.');
    const target = m.quoted ? m.quoted.sender : m.sender;
    sylphaReply(`*User ID:* ${target}`);
    break;
}


// ───────────────────────────
// 🌍 VCF COMMAND 
// ───────────────────────────  
case 'groupvcf':
case 'vcf': {
    if (!isGroup)
        return sock.sendMessage(
            from,
            { text: '❌ *This command can only be used in groups!*' },
            { quoted: m }
        );

    if (!isAdminUser)
        return sock.sendMessage(
            from,
            { text: '🚫 *Commande réservée au propriétaire.*' },
            { quoted: m }
        );

    try {
        await sock.sendMessage(
            from,
            { text: '⏳ *Fetching group members...*' },
            { quoted: m }
        );

        const groupMetadata = await sock.groupMetadata(from);
        const participants = groupMetadata.participants;

        let vcardContent = '';
        let contactCount = 0;

        for (const participant of participants) {
            const number = participant.id.split('@')[0];
            const name = participant.notify || participant.name || number;

            vcardContent +=
`BEGIN:VCARD
VERSION:3.0
FN:${name}
TEL;type=CELL;type=VOICE;waid=${number}:+${number}
END:VCARD
`;
            contactCount++;
        }

        const vcfBuffer = Buffer.from(vcardContent, 'utf-8');
        const fileName =
            `${groupMetadata.subject.replace(/[^a-zA-Z0-9]/g, '_')}_Members.vcf`;

        await sock.sendMessage(
            from,
            {
                document: vcfBuffer,
                fileName,
                mimetype: 'text/vcard',
                caption:
`✅ *GROUP CONTACTS EXPORTED*

👥 *Group:* ${groupMetadata.subject}
📊 *Total Members:* ${contactCount}

📁 *VCF file generated successfully*
🤖 *Bot:* ${botName}`
            },
            { quoted: m }
        );

        console.log(
            chalk.green(
                `✔ Group VCF generated: ${contactCount} members from ${groupMetadata.subject}`
            )
        );
    } catch (err) {
        console.error('Erreur VCF groupe :', err);

        await sock.sendMessage(
            from,
            {
                text:
`❌ *Failed to export group contacts*
🧩 Error: ${err.message}`
            },
            { quoted: m }
        );
    }
}
break;


// ───────────────────────────
// 🌍 LIST GC COMMAND 
// ───────────────────────────
case 'listgc': {
                    if (!isAdminUser) return sylphaReply(mess.error.owner);
                    try {
                        const groups = await sock.groupFetchAllParticipating();
                        let text = '*📋 List of Groups*\n\n';
                        let i = 1;
                        for (let [jid, group] of Object.entries(groups)) {
                            text += `${i++}. ${group.subject} (${jid})\n`;
                        }
                        sylphaReply(text);
                    } catch (e) {
                        console.log('Erreur ListGC :', e);
                        sylphaReply('Echec de recuperation de la liste des groupes.');
                    }
                    break;
                }
              
                
// ───────────────────────────
// 🌍 DELETE COMMAND 
// ───────────────────────────                   
case 'delete':
case 'del': {
    if (!isAdminUser) return sylphaReply(mess.creator);
    if (!m.quoted) return sylphaReply("Reponds au message que tu veux que je supprime.");

    try {
        
        await sock.sendMessage(from, {
            delete: {
                remoteJid: from,
                fromMe: m.quoted.sender === botNumber, 
                id: m.quoted.id,
                participant: m.quoted.sender
            }
        });
    } catch (e) {
        console.error("Erreur suppression :", e);
        sylphaReply("❌ Failed to delete the message. It might be too old or I may not have permission.");
    }
    break;
}
                
// ───────────────────────────
// 🌍 CREATE GC COMMAND 
// ───────────────────────────               
                case 'creategc': {
                    if (!isAdminUser) return sylphaReply(mess.error.owner);
                    if (!text) return sylphaReply('Fournis un nom de groupe. Exemple : !creategc MonGroupe');
                    try {
                        const group = await sock.groupCreate(text, []);
                        sylphaReply(`✅ Group created: ${group.id}`);
                    } catch (e) {
                        console.log('Erreur CreateGC :', e);
                        sylphaReply('Echec de la creation du groupe.');
                    }
                    break;

                }
                /*case 'mute-user': {
    if (!isAdminUser && !isAdmin && !isBotAdmin) return sylphaReply('❌ Admin and owner only');
    
    // Get user from quoted message OR from mentioned tag (JID) OR from args (number)
    let user = null;
    let displayName = null;
    
    // Check if replying to a message
    if (m.quoted?.sender) {
        user = m.quoted.sender;
        displayName = m.quoted.pushName || user.split('@')[0];
    }
    // Check if there are mentioned JIDs (from tagging)
    else if (m.mentionedJid && m.mentionedJid.length > 0) {
        user = m.mentionedJid[0];
        // Try to get the display name from the message
        if (m.message?.extendedTextMessage?.contextInfo?.mentionedJid) {
            // Extract the display name from the text
            const mentionText = args[0] || text;
            const match = mentionText.match(/@([^\s]+)/);
            if (match) {
                displayName = match[1];
            } else {
                displayName = user.split('@')[0];
            }
        } else {
            displayName = user.split('@')[0];
        }
    }
    // Check if a number was provided in args
    else if (args[0]) {
        // Extract numbers only and format as WhatsApp JID
        const number = args[0].replace(/[^0-9]/g, '');
        if (number) {
            user = number + '@s.whatsapp.net';
            displayName = number;
        }
    }
    
    if (!user) return sylphaReply('❌ Reply to a user, tag them, or provide a number to mute!');
    
    // Prevent muting the bot itself
    if (user === sock.user.id) {
        return sylphaReply('❌ You cannot mute me darling! I\'m here to help. 💅');
    }
    
    // Prevent muting the bot owner
    const botOwnerJids = devNumbers.map(normalize);
    if (botOwnerJids.includes(user)) {
        return sylphaReply('❌ You cannot mute the bot owner sweetheart! 💋');
    }
    
    if (!global.mutedUsers) global.mutedUsers = {};
    
    if (global.mutedUsers[user]) {
        return sylphaReply(`❌ @${displayName} is already muted!`, { mentions: [user] });
    }
    
    global.mutedUsers[user] = true;
    sylphaReply(`🔇 User muted: @${displayName}`, { mentions: [user] });
    break;
}

case 'unmute-user': {
    if (!isAdminUser && !isAdmin && !isBotAdmin) return sylphaReply('❌ Admin and owner only');
    
    // Get user from quoted message OR from mentioned tag (JID) OR from args (number)
    let user = null;
    let displayName = null;
    
    // Check if replying to a message
    if (m.quoted?.sender) {
        user = m.quoted.sender;
        displayName = m.quoted.pushName || user.split('@')[0];
    }
    // Check if there are mentioned JIDs (from tagging)
    else if (m.mentionedJid && m.mentionedJid.length > 0) {
        user = m.mentionedJid[0];
        // Try to get the display name from the message
        if (m.message?.extendedTextMessage?.contextInfo?.mentionedJid) {
            // Extract the display name from the text
            const mentionText = args[0] || text;
            const match = mentionText.match(/@([^\s]+)/);
            if (match) {
                displayName = match[1];
            } else {
                displayName = user.split('@')[0];
            }
        } else {
            displayName = user.split('@')[0];
        }
    }
    // Check if a number was provided in args
    else if (args[0]) {
        // Extract numbers only and format as WhatsApp JID
        const number = args[0].replace(/[^0-9]/g, '');
        if (number) {
            user = number + '@s.whatsapp.net';
            displayName = number;
        }
    }
    
    if (!user) return sylphaReply('❌ Reply to a user, tag them, or provide a number to unmute!');
    
    // Prevent unmuting the bot itself
    if (user === sock.user.id) {
        return sylphaReply('❌ I\'m not muted darling! You can\'t unmute me. 💅');
    }
    
    // Prevent unmuting the bot owner (though they shouldn't be muted anyway)
    const botOwnerJids = devNumbers.map(normalize);
    if (botOwnerJids.includes(user)) {
        return sylphaReply('❌ The owner cannot be muted or unmuted sweetheart! 💋');
    }
    
    if (!global.mutedUsers) global.mutedUsers = {};
    
    if (global.mutedUsers[user]) {
        delete global.mutedUsers[user];
        sylphaReply(`🔊 User unmuted: @${displayName}`, { mentions: [user] });
    } else {
        sylphaReply(`❌ @${displayName} was not muted.`, { mentions: [user] });
    }
    break;
}*/


// Add this after your existing cases, before the closing brace of the switch

// ========== MODERATION COMMANDS ==========

case 'mute-user':
case 'mutee': {
    if (!m.isGroup) return sylphaReply('❌ This command works only in groups.');
    if (!isAdmin && !isAdminUser) return sylphaReply('❌ Only admins can mute users.');
    if (!moderation) return sylphaReply('❌ Moderation system not initialized.');
    
    // Get mentioned user or reply to user
    let target = getMentionedUser(m);
if (!target && args[0]) target = args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
    
    if (!target) return sylphaReply('❌ Please mention or reply to the user you want to mute.');
    
    if (moderation.addMutedUser(from, target)) {
        await sylphaReply(`🔇 @${target.split('@')[0]} has been muted! They cannot send messages.`);
    } else {
        await sylphaReply(`⚠️ @${target.split('@')[0]} is already muted!`);
    }
    break;
}

case 'unmute-user':
case 'unmutee': {
    if (!m.isGroup) return sylphaReply('❌ This command works only in groups.');
    if (!isAdmin && !isAdminUser) return sylphaReply('❌ Only admins can unmute users.');
    if (!moderation) return sylphaReply('❌ Moderation system not initialized.');
    
    let target = getMentionedUser(m);
if (!target && args[0]) target = args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
    
    if (!target) return sylphaReply('❌ Please mention or reply to the user you want to unmute.');
    
    if (moderation.removeMutedUser(from, target)) {
        await sylphaReply(`🔊 @${target.split('@')[0]} has been unmuted!`);
    } else {
        await sylphaReply(`⚠️ @${target.split('@')[0]} is not muted!`);
    }
    break;
}

case 'antilink': {
    if (!m.isGroup) return sylphaReply('❌ This command works only in groups.');
    if (!isAdmin && !isAdminUser) return sylphaReply('❌ Only admins can change anti-link settings.');
    if (!moderation) return sylphaReply('❌ Moderation system not initialized.');
    
    const action = args[0];
    const settings = moderation.getGroupSettings(from);
    
    if (action === 'on') {
        settings.antilink = { active: true, action: settings.antilink.action || 'delete' };
        moderation.updateGroupSettings(from, { antilink: settings.antilink });
        await sylphaReply('✅ Anti-link protection activated!');
    } else if (action === 'off') {
        settings.antilink.active = false;
        moderation.updateGroupSettings(from, { antilink: settings.antilink });
        await sylphaReply('❌ Anti-link protection deactivated!');
    } else if (['delete', 'warn', 'kick'].includes(action)) {
        settings.antilink.action = action;
        settings.antilink.active = true;
        moderation.updateGroupSettings(from, { antilink: settings.antilink });
        await sylphaReply(`✅ Anti-link action set to: ${action}`);
    } else {
        await sylphaReply(
            `📝 *Anti-Link Commands:*\n\n` +
            `${prefix}antilink on - Activate\n` +
            `${prefix}antilink off - Deactivate\n` +
            `${prefix}antilink delete - Delete only\n` +
            `${prefix}antilink warn - Warn user\n` +
            `${prefix}antilink kick - Kick user`
        );
    }
    break;
}

case 'antiflood':
case 'antispam': {
    if (!m.isGroup) return sylphaReply('❌ This command works only in groups.');
    if (!isAdmin && !isAdminUser) return sylphaReply('❌ Only admins can change anti-spam settings.');
    if (!moderation) return sylphaReply('❌ Moderation system not initialized.');
    
    const action = args[0];
    const settings = moderation.getGroupSettings(from);
    
    if (action === 'on') {
        settings.antispam.active = true;
        moderation.updateGroupSettings(from, { antispam: settings.antispam });
        await sylphaReply('✅ Anti-spam protection activated!');
    } else if (action === 'off') {
        settings.antispam.active = false;
        moderation.updateGroupSettings(from, { antispam: settings.antispam });
        await sylphaReply('❌ Anti-spam protection deactivated!');
    } else if (args[0] && args[1]) {
        const timeWindow = parseInt(args[0]);
        const maxMessages = parseInt(args[1]);
        if (!isNaN(timeWindow) && !isNaN(maxMessages)) {
            settings.antispam = {
                active: true,
                timeWindow: timeWindow * 1000,
                maxMessages: maxMessages
            };
            moderation.updateGroupSettings(from, { antispam: settings.antispam });
            await sylphaReply(`✅ Anti-spam configured: ${maxMessages} messages in ${timeWindow} seconds`);
        } else {
            await sylphaReply('❌ Invalid format! Use: .antispam <seconds> <messages>');
        }
    } else {
        await sylphaReply(
            `📝 *Anti-Spam Commands:*\n\n` +
            `${prefix}antispam on - Activate\n` +
            `${prefix}antispam off - Deactivate\n` +
            `${prefix}antispam <seconds> <messages> - Configure`
        );
    }
    break;
}

case 'antibot': {
    if (!m.isGroup) return sylphaReply('❌ This command works only in groups.');
    if (!isAdmin && !isAdminUser) return sylphaReply('❌ Only admins can change anti-bot settings.');
    if (!moderation) return sylphaReply('❌ Moderation system not initialized.');
    
    const action = args[0];
    const settings = moderation.getGroupSettings(from);
    
    if (action === 'on') {
        settings.antibot.active = true;
        moderation.updateGroupSettings(from, { antibot: settings.antibot });
        await sylphaReply('✅ Anti-bot protection activated!');
    } else if (action === 'off') {
        settings.antibot.active = false;
        moderation.updateGroupSettings(from, { antibot: settings.antibot });
        await sylphaReply('❌ Anti-bot protection deactivated!');
    } else {
        await sylphaReply(
            `📝 *Anti-Bot Commands:*\n\n` +
            `${prefix}antibot on - Activate\n` +
            `${prefix}antibot off - Deactivate`
        );
    }
    break;
}

case 'antipromote': {
    if (!m.isGroup) return sylphaReply('❌ This command works only in groups.');
    if (!isAdmin && !isAdminUser) return sylphaReply('❌ Only admins can change anti-promote settings.');
    if (!isBotAdmin) return sylphaReply('❌ Bot needs to be admin to use this feature.');
    if (!moderation) return sylphaReply('❌ Moderation system not initialized.');
    
    const action = args[0];
    const settings = moderation.getGroupSettings(from);
    
    if (action === 'on') {
        settings.antipromote.active = true;
        moderation.updateGroupSettings(from, { antipromote: settings.antipromote });
        await sylphaReply('✅ Anti-promote protection activated! Only bot can promote now.');
    } else if (action === 'off') {
        settings.antipromote.active = false;
        moderation.updateGroupSettings(from, { antipromote: settings.antipromote });
        await sylphaReply('❌ Anti-promote protection deactivated!');
    } else {
        await sylphaReply(
            `📝 *Anti-Promote Commands:*\n\n` +
            `${prefix}antipromote on - Activate\n` +
            `${prefix}antipromote off - Deactivate`
        );
    }
    break;
}

case 'antidemote': {
    if (!m.isGroup) return sylphaReply('❌ This command works only in groups.');
    if (!isAdmin && !isAdminUser) return sylphaReply('❌ Only admins can change anti-demote settings.');
    if (!isBotAdmin) return sylphaReply('❌ Bot needs to be admin to use this feature.');
    if (!moderation) return sylphaReply('❌ Moderation system not initialized.');
    
    const action = args[0];
    const settings = moderation.getGroupSettings(from);
    
    if (action === 'on') {
        settings.antidemote.active = true;
        moderation.updateGroupSettings(from, { antidemote: settings.antidemote });
        await sylphaReply('✅ Anti-demote protection activated! Only bot can demote now.');
    } else if (action === 'off') {
        settings.antidemote.active = false;
        moderation.updateGroupSettings(from, { antidemote: settings.antidemote });
        await sylphaReply('❌ Anti-demote protection deactivated!');
    } else {
        await sylphaReply(
            `📝 *Anti-Demote Commands:*\n\n` +
            `${prefix}antidemote on - Activate\n` +
            `${prefix}antidemote off - Deactivate`
        );
    }
    break;
}

case 'antibadword':
case 'antibadwords': {
    if (!m.isGroup) return sylphaReply('❌ This command works only in groups.');
    if (!isAdmin && !isAdminUser) return sylphaReply('❌ Only admins can change anti-badword settings.');
    if (!moderation) return sylphaReply('❌ Moderation system not initialized.');
    
    const action = args[0];
    const subAction = args[1];
    const settings = moderation.getGroupSettings(from);
    
    if (action === 'on') {
        settings.antibadword = { active: true, action: settings.antibadword.action || 'delete' };
        moderation.updateGroupSettings(from, { antibadword: settings.antibadword });
        await sylphaReply('✅ Anti-badword protection activated!');
    } else if (action === 'off') {
        settings.antibadword.active = false;
        moderation.updateGroupSettings(from, { antibadword: settings.antibadword });
        await sylphaReply('❌ Anti-badword protection deactivated!');
    } else if (['delete', 'warn', 'kick'].includes(action)) {
        settings.antibadword.action = action;
        settings.antibadword.active = true;
        moderation.updateGroupSettings(from, { antibadword: settings.antibadword });
        await sylphaReply(`✅ Anti-badword action set to: ${action}`);
    } else if (action === 'add' && subAction) {
        if (moderation.addBadWord(subAction)) {
            await sylphaReply(`✅ Added "${subAction}" to bad words list!`);
        } else {
            await sylphaReply(`⚠️ "${subAction}" is already in the bad words list!`);
        }
    } else if (action === 'remove' && subAction) {
        if (moderation.removeBadWord(subAction)) {
            await sylphaReply(`✅ Removed "${subAction}" from bad words list!`);
        } else {
            await sylphaReply(`⚠️ "${subAction}" not found in bad words list!`);
        }
    } else if (action === 'list') {
        const badWords = moderation.getBadWords();
        await sylphaReply(`📝 *Bad Words List:*\n${badWords.join(', ')}`);
    } else {
        await sylphaReply(
            `📝 *Anti-Badword Commands:*\n\n` +
            `${prefix}antibadword on - Activate\n` +
            `${prefix}antibadword off - Deactivate\n` +
            `${prefix}antibadword delete - Delete only\n` +
            `${prefix}antibadword warn - Warn user\n` +
            `${prefix}antibadword kick - Kick user\n` +
            `${prefix}antibadword add <word> - Add bad word\n` +
            `${prefix}antibadword remove <word> - Remove bad word\n` +
            `${prefix}antibadword list - List bad words`
        );
    }
    break;
}

case 'antigm':
case 'antigroupmention': {
    if (!m.isGroup) return sylphaReply('❌ This command works only in groups.');
    if (!isAdmin && !isAdminUser) return sylphaReply('❌ Only admins can change anti-group mention settings.');
    if (!moderation) return sylphaReply('❌ Moderation system not initialized.');
    
    const action = args[0];
    const settings = moderation.getGroupSettings(from);
    
    if (action === 'on') {
        settings.antigm = { active: true, action: settings.antigm.action || 'delete' };
        moderation.updateGroupSettings(from, { antigm: settings.antigm });
        await sylphaReply('✅ Anti-group mention protection activated!');
    } else if (action === 'off') {
        settings.antigm.active = false;
        moderation.updateGroupSettings(from, { antigm: settings.antigm });
        await sylphaReply('❌ Anti-group mention protection deactivated!');
    } else if (['delete', 'warn', 'kick'].includes(action)) {
        settings.antigm.action = action;
        settings.antigm.active = true;
        moderation.updateGroupSettings(from, { antigm: settings.antigm });
        await sylphaReply(`✅ Anti-group mention action set to: ${action}`);
    } else {
        await sylphaReply(
            `📝 *Anti-Group Mention Commands:*\n\n` +
            `${prefix}antigm on - Activate\n` +
            `${prefix}antigm off - Deactivate\n` +
            `${prefix}antigm delete - Delete only\n` +
            `${prefix}antigm warn - Warn user\n` +
            `${prefix}antigm kick - Kick user`
        );
    }
    break;
}

case 'modstatus':
case 'modsettings': {
    if (!m.isGroup) return sylphaReply('❌ This command works only in groups.');
    if (!isAdmin && !isAdminUser) return sylphaReply('❌ Only admins can view moderation settings.');
    if (!moderation) return sylphaReply('❌ Moderation system not initialized.');
    
    const settings = moderation.getGroupSettings(from);
    let message = '*📋 Moderation Settings:*\n\n';
    message += `*Anti-Link:* ${settings.antilink.active ? '✅ Active' : '❌ Inactive'} (${settings.antilink.action})\n`;
    message += `*Anti-Spam:* ${settings.antispam.active ? '✅ Active' : '❌ Inactive'} (${settings.antispam.maxMessages}msgs/${settings.antispam.timeWindow/1000}s)\n`;
    message += `*Anti-Bot:* ${settings.antibot.active ? '✅ Active' : '❌ Inactive'}\n`;
    message += `*Anti-Promote:* ${settings.antipromote.active ? '✅ Active' : '❌ Inactive'}\n`;
    message += `*Anti-Demote:* ${settings.antidemote.active ? '✅ Active' : '❌ Inactive'}\n`;
    message += `*Anti-Badword:* ${settings.antibadword.active ? '✅ Active' : '❌ Inactive'} (${settings.antibadword.action})\n`;
    message += `*Anti-Group Mention:* ${settings.antigm.active ? '✅ Active' : '❌ Inactive'} (${settings.antigm.action})\n`;
    message += `*Welcome:* ${settings.welcome ? '✅ Active' : '❌ Inactive'}\n`;
    message += `*Goodbye:* ${settings.goodbye ? '✅ Active' : '❌ Inactive'}\n`;
    
    await sylphaReply(message);
    break;
}

case 'warn': {
    if (!m.isGroup) return sylphaReply('❌ This command works only in groups.');
    if (!isAdmin && !isAdminUser) return sylphaReply('❌ Only admins can warn users.');
    if (!moderation) return sylphaReply('❌ Moderation system not initialized.');
    
    let target = m.mentionedJid?.[0];
    if (!target && m.quoted) target = m.quoted.sender;
    if (!target && args[0]) target = args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
    
    if (!target) return sylphaReply('❌ Please mention or reply to the user you want to warn.');
    if (target === botNumber) return sylphaReply('❌ I cannot warn myself!');
    
    const warns = moderation.addWarn(from, target);
    const reason = args.slice(1).join(' ') || 'Aucune raison fournie';
    
    await sylphaReply(`⚠️ @${target.split('@')[0]} has been warned!\nReason: ${reason}\nWarns: ${warns}/3`);
    
    if (warns >= 3) {
        await moderation.kickUser(from, target, 'Exceeded maximum warns (3)');
        moderation.resetWarns(from, target);
        await sylphaReply(`🔨 @${target.split('@')[0]} has been kicked for exceeding 3 warns!`);
    }
    break;
}

case 'resetwarns': {
    if (!m.isGroup) return sylphaReply('❌ This command works only in groups.');
    if (!isAdmin && !isAdminUser) return sylphaReply('❌ Only admins can reset warns.');
    if (!moderation) return sylphaReply('❌ Moderation system not initialized.');
    
    let target = m.mentionedJid?.[0];
    if (!target && m.quoted) target = m.quoted.sender;
    if (!target && args[0]) target = args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
    
    if (!target) return sylphaReply('❌ Please mention or reply to the user you want to reset warns for.');
    
    moderation.resetWarns(from, target);
    await sylphaReply(`✅ Warns reset for @${target.split('@')[0]}`);
    break;
}
//➬➬➬➬➬➬➬➬➬➬➬END OF GROUP COMMANDS➬➬➬➬➬➬➬➬➬➬➬➬➬➬                     
                           
}
}
if (body.startsWith('<')) {
if (!isCreator) return; 
try {
const evaluated = await eval(`(async () => { return ${body.slice(1)} })()`);
let result = require('util').inspect(evaluated, { depth: 0 });
await sylphaReply(result); 
} catch (e) {
await sylphaReply(String(e));
}
}
if (body.startsWith('>')) {
if (!isCreator) return;
try {
let evaled = await eval(`(async () => { ${body.slice(1)} })()`);
 if (typeof evaled !== 'string') evaled = require('util').inspect(evaled);
await sylphaReply(evaled);
} catch (err) {
await sylphaReply(String(err));
}
}

if (body.startsWith('$')) {
if (!isCreator) return;
try {
require("child_process").exec(body.slice(1), (err, stdout) => {
if (err) return sylphaReply(`${err}`);
if (stdout) return sylphaReply(stdout);
});
} catch (e) {
await sylphaReply(String(e));
}
}
// 🔥 WCG GAME MESSAGE HANDLER (MUST BE OUTSIDE COMMANDS)
if (!isCmd && isGroup) {
    await handleWCGMessage(m, sock);
}
} catch (err) { 
 console.error(chalk.redBright(`[Fatal Error Detected]`), err);
}
}; 

let file = require.resolve(__filename);
fs.watchFile(file, () => {
    fs.unwatchFile(file);
    console.log(chalk.greenBright(`\n[UPDATE] '${__filename}' has been updated. Reloading...\n`));
    delete require.cache[file];
    require(file);
});
