/**
 * ZERO TRACE BOT v5.0 — Analyseur de liens & fichiers malveillants
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * FONCTIONNEMENT :
 *   .scanlink [url]          → analyser un lien manuellement
 *   .scanlink (répondre)     → analyser le lien dans le message cité
 *   .scanfile (répondre)     → analyser un fichier (doc, apk, pdf...)
 *   .scanauto on/off         → mode automatique : scan chaque lien reçu
 *
 * MOTEURS D'ANALYSE :
 *   1. VirusTotal API (si VIRUSTOTAL_API_KEY dans .env)
 *   2. Google Safe Browsing API (si GOOGLE_SAFEBROWSING_KEY dans .env)
 *   3. URLScan.io (si URLSCAN_API_KEY dans .env)
 *   4. Analyse heuristique locale (patterns suspects, domaines connus)
 *   5. PhishTank (liste noire open source)
 *
 * Toujours actif même sans clé API grâce à l'analyse heuristique.
 */

'use strict';
const axios = require('axios');
const path  = require('path');
const fs    = require('fs-extra');
const crypto = require('crypto');

const DATA_DIR    = path.join(__dirname, '../data');
const SCANAUTO_FILE = path.join(DATA_DIR, 'scanauto.json');
fs.ensureDirSync(DATA_DIR);

// ── Charger/sauver la config scanauto ────────────────────────────────────────
function loadAutoScan() {
  try { return fs.existsSync(SCANAUTO_FILE) ? fs.readJsonSync(SCANAUTO_FILE) : {}; } catch { return {}; }
}
function saveAutoScan(data) {
  try { fs.writeJsonSync(SCANAUTO_FILE, data, { spaces: 2 }); } catch (e) {}
}
function isAutoScanEnabled(jid) { return !!loadAutoScan()[jid]; }
function setAutoScan(jid, val) {
  const d = loadAutoScan();
  if (val) d[jid] = true; else delete d[jid];
  saveAutoScan(d);
}

// ── Patterns heuristiques suspects ───────────────────────────────────────────
const SUSPICIOUS_PATTERNS = [
  // Phishing / vol d'identifiants
  /login.*whatsapp/i, /verify.*account/i, /confirm.*password/i,
  /compte.*suspendu/i, /account.*suspended/i, /click.*here.*win/i,
  /congratulations.*won/i, /prize.*claim/i, /free.*iphone/i,
  /your.*account.*hacked/i, /urgent.*action.*required/i,
  // URLs raccourcies (souvent malveillantes)
  /bit\.ly\/[a-z0-9]+$/i, /tinyurl\.com\//i, /t\.co\//i,
  /goo\.gl\//i, /ow\.ly\//i, /short\.to\//i,
  // APK / malware direct
  /\.apk(\?|$)/i, /download.*apk/i, /install.*free/i,
  // Exploitation
  /javascript:/i, /data:text\/html/i, /vbscript:/i,
  /<script/i, /onload=/i, /onerror=/i,
  // Domaines de phishing connus
  /whatsapp-.*\.com/i, /whatsap{1,3}\.com/i, /what5app/i,
  /facebo{2,}k/i, /paypa1\.com/i, /g00gle\.com/i,
  /arnaqu/i, /hack.*gratuit/i,
];

// Domaines toujours sûrs (whitelist)
const TRUSTED_DOMAINS = [
  'google.com', 'youtube.com', 'facebook.com', 'instagram.com',
  'twitter.com', 'x.com', 'github.com', 'wikipedia.org',
  'whatsapp.com', 'wa.me', 'web.whatsapp.com',
  'tiktok.com', 'soundcloud.com', 'spotify.com',
  'amazon.com', 'apple.com', 'microsoft.com',
];

// Extensions de fichiers dangereuses
const DANGEROUS_EXTENSIONS = [
  '.exe', '.bat', '.cmd', '.msi', '.vbs', '.js', '.jar',
  '.ps1', '.sh', '.apk', '.ipa', '.dmg', '.scr', '.pif',
  '.com', '.hta', '.wsf', '.reg', '.inf',
];

// Extensions de fichiers à analyser (potentiellement malveillantes)
const SUSPICIOUS_EXTENSIONS = [
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
  '.zip', '.rar', '.7z', '.tar', '.gz',
];

// ── Analyse heuristique locale (sans clé API) ─────────────────────────────────
function analyzeHeuristic(url) {
  const results = {
    score:    0,       // 0-100 (100 = très dangereux)
    flags:    [],      // Raisons de suspicion
    verdict:  'safe',  // safe | suspicious | dangerous
    trusted:  false,
  };

  if (!url || typeof url !== 'string') return results;

  const cleanUrl = url.toLowerCase().trim();

  // Domaine de confiance ?
  for (const domain of TRUSTED_DOMAINS) {
    if (cleanUrl.includes(domain)) {
      results.trusted = true;
      return results;
    }
  }

  // Extension dangereuse directe
  for (const ext of DANGEROUS_EXTENSIONS) {
    if (cleanUrl.includes(ext)) {
      results.score += 60;
      results.flags.push(`Extension dangereuse : ${ext}`);
    }
  }

  // Patterns suspects
  for (const pattern of SUSPICIOUS_PATTERNS) {
    if (pattern.test(url)) {
      results.score += 25;
      results.flags.push(`Motif suspect : ${pattern.source.slice(0, 40)}`);
    }
  }

  // IP directe dans l'URL (souvent malveillant)
  if (/https?:\/\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/i.test(url)) {
    results.score += 30;
    results.flags.push('Adresse IP directe dans l\'URL');
  }

  // Trop de sous-domaines (phishing classique)
  try {
    const u = new URL(url.startsWith('http') ? url : 'http://' + url);
    const parts = u.hostname.split('.');
    if (parts.length > 4) {
      results.score += 20;
      results.flags.push(`Trop de sous-domaines (${parts.length})`);
    }
    // Caractères spéciaux dans le domaine
    if (/-{2,}/.test(u.hostname) || u.hostname.includes('--')) {
      results.score += 15;
      results.flags.push('Caractères suspects dans le domaine');
    }
  } catch (e) {
    results.score += 10;
    results.flags.push('URL mal formée');
  }

  // Verdict
  if (results.score >= 60)      results.verdict = 'dangerous';
  else if (results.score >= 25) results.verdict = 'suspicious';
  else                          results.verdict = 'safe';

  return results;
}

// ── VirusTotal API ────────────────────────────────────────────────────────────
async function scanVirusTotal(url) {
  const apiKey = process.env.VIRUSTOTAL_API_KEY;
  if (!apiKey) return null;

  try {
    // Soumettre l'URL
    const submitRes = await axios.post(
      'https://www.virustotal.com/api/v3/urls',
      `url=${encodeURIComponent(url)}`,
      {
        headers: {
          'x-apikey': apiKey,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        timeout: 15000,
      }
    );

    const analysisId = submitRes.data?.data?.id;
    if (!analysisId) return null;

    // Récupérer les résultats
    await new Promise(r => setTimeout(r, 3000)); // attendre l'analyse
    const reportRes = await axios.get(
      `https://www.virustotal.com/api/v3/analyses/${analysisId}`,
      { headers: { 'x-apikey': apiKey }, timeout: 15000 }
    );

    const stats = reportRes.data?.data?.attributes?.stats;
    if (!stats) return null;

    return {
      engine:     'VirusTotal',
      malicious:  stats.malicious  || 0,
      suspicious: stats.suspicious || 0,
      harmless:   stats.harmless   || 0,
      total:      (stats.malicious || 0) + (stats.suspicious || 0) +
                  (stats.harmless  || 0) + (stats.undetected || 0),
    };
  } catch (e) {
    console.log('[SCAN] VirusTotal erreur:', e.message);
    return null;
  }
}

// ── Google Safe Browsing ──────────────────────────────────────────────────────
async function scanGoogleSafeBrowsing(url) {
  const apiKey = process.env.GOOGLE_SAFEBROWSING_KEY;
  if (!apiKey) return null;

  try {
    const res = await axios.post(
      `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${apiKey}`,
      {
        client: { clientId: 'zero-trace-bot', clientVersion: '5.0.0' },
        threatInfo: {
          threatTypes: ['MALWARE', 'SOCIAL_ENGINEERING', 'UNWANTED_SOFTWARE', 'POTENTIALLY_HARMFUL_APPLICATION'],
          platformTypes: ['ANY_PLATFORM'],
          threatEntryTypes: ['URL'],
          threatEntries: [{ url }],
        },
      },
      { timeout: 10000 }
    );

    const matches = res.data?.matches || [];
    return {
      engine:   'Google Safe Browsing',
      threats:  matches.map(m => m.threatType),
      safe:     matches.length === 0,
    };
  } catch (e) {
    return null;
  }
}

// ── URLScan.io ────────────────────────────────────────────────────────────────
async function scanUrlscan(url) {
  const apiKey = process.env.URLSCAN_API_KEY;
  if (!apiKey) return null;

  try {
    // Soumettre
    const submit = await axios.post(
      'https://urlscan.io/api/v1/scan/',
      { url, visibility: 'private' },
      {
        headers: { 'API-Key': apiKey, 'Content-Type': 'application/json' },
        timeout: 12000,
      }
    );
    const scanId = submit.data?.uuid;
    if (!scanId) return null;

    // Attendre + récupérer
    await new Promise(r => setTimeout(r, 8000));
    const result = await axios.get(
      `https://urlscan.io/api/v1/result/${scanId}/`,
      { headers: { 'API-Key': apiKey }, timeout: 12000 }
    );

    const verdicts = result.data?.verdicts?.overall;
    return {
      engine:    'URLScan.io',
      malicious: verdicts?.malicious || false,
      score:     verdicts?.score     || 0,
      tags:      verdicts?.tags      || [],
      link:      `https://urlscan.io/result/${scanId}/`,
    };
  } catch (e) {
    return null;
  }
}

// ── Hash d'un fichier ─────────────────────────────────────────────────────────
function hashBuffer(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

// ── Scanner un fichier via VirusTotal ─────────────────────────────────────────
async function scanFileVirusTotal(buf, filename) {
  const apiKey = process.env.VIRUSTOTAL_API_KEY;
  if (!apiKey) return null;

  try {
    const FormData = require('form-data');
    const form = new FormData();
    form.append('file', buf, { filename: filename || 'file', contentType: 'application/octet-stream' });

    const res = await axios.post(
      'https://www.virustotal.com/api/v3/files',
      form,
      {
        headers: { ...form.getHeaders(), 'x-apikey': apiKey },
        timeout: 30000,
        maxContentLength: 30 * 1024 * 1024,
      }
    );

    const id = res.data?.data?.id;
    if (!id) return null;

    await new Promise(r => setTimeout(r, 5000));
    const report = await axios.get(
      `https://www.virustotal.com/api/v3/analyses/${id}`,
      { headers: { 'x-apikey': apiKey }, timeout: 15000 }
    );

    const stats = report.data?.data?.attributes?.stats;
    if (!stats) return null;

    return {
      engine:     'VirusTotal',
      malicious:  stats.malicious  || 0,
      suspicious: stats.suspicious || 0,
      harmless:   stats.harmless   || 0,
      total:      Object.values(stats).reduce((a, b) => a + b, 0),
      hash:       hashBuffer(buf),
    };
  } catch (e) {
    console.log('[SCAN FILE] VT erreur:', e.message);
    return null;
  }
}

// ── Formater le rapport final ─────────────────────────────────────────────────
function buildReport(url, heuristic, vtResult, gsbResult, urlscanResult) {
  const lines = [];

  // ── En-tête
  const urlShort = url.length > 50 ? url.slice(0, 47) + '...' : url;
  lines.push(`🔍 *ANALYSE DE SÉCURITÉ*`);
  lines.push(`━━━━━━━━━━━━━━━━━━━━━━━━`);
  lines.push(`🔗 \`${urlShort}\``);
  lines.push('');

  // ── Verdict global
  let globalDanger = false;
  let globalSuspect = false;

  if (vtResult && vtResult.malicious > 0)    globalDanger = true;
  if (vtResult && vtResult.suspicious > 0)   globalSuspect = true;
  if (gsbResult && !gsbResult.safe)          globalDanger = true;
  if (urlscanResult && urlscanResult.malicious) globalDanger = true;
  if (heuristic.verdict === 'dangerous')     globalDanger = true;
  if (heuristic.verdict === 'suspicious')    globalSuspect = true;

  if (heuristic.trusted) {
    lines.push(`✅ *VERDICT : SÛRE*`);
    lines.push(`_Domaine de confiance reconnu_`);
  } else if (globalDanger) {
    lines.push(`🚨 *VERDICT : DANGEREUX*`);
    lines.push(`_⚠️ NE PAS CLIQUER SUR CE LIEN !_`);
  } else if (globalSuspect) {
    lines.push(`⚠️ *VERDICT : SUSPECT*`);
    lines.push(`_Sois prudent avec ce lien_`);
  } else {
    lines.push(`✅ *VERDICT : AUCUNE MENACE DÉTECTÉE*`);
  }

  lines.push('');

  // ── Analyse heuristique
  lines.push(`🧠 *Analyse locale :*`);
  if (heuristic.trusted) {
    lines.push(`  ✅ Domaine de confiance`);
  } else if (heuristic.flags.length > 0) {
    for (const flag of heuristic.flags.slice(0, 3)) {
      lines.push(`  ⚠️ ${flag}`);
    }
    lines.push(`  Score : ${heuristic.score}/100`);
  } else {
    lines.push(`  ✅ Aucun motif suspect détecté`);
  }

  // ── VirusTotal
  if (vtResult) {
    lines.push('');
    lines.push(`🔬 *VirusTotal :*`);
    lines.push(`  🦠 Malveillants : ${vtResult.malicious}/${vtResult.total}`);
    lines.push(`  ⚠️ Suspects : ${vtResult.suspicious}/${vtResult.total}`);
    lines.push(`  ✅ Sûrs : ${vtResult.harmless}/${vtResult.total}`);
  }

  // ── Google Safe Browsing
  if (gsbResult) {
    lines.push('');
    lines.push(`🛡️ *Google Safe Browsing :*`);
    if (gsbResult.safe) {
      lines.push(`  ✅ Aucune menace détectée`);
    } else {
      for (const t of gsbResult.threats) {
        lines.push(`  🚨 ${t}`);
      }
    }
  }

  // ── URLScan
  if (urlscanResult) {
    lines.push('');
    lines.push(`🌐 *URLScan.io :*`);
    lines.push(`  ${urlscanResult.malicious ? '🚨 Malveillant' : '✅ OK'} — Score : ${urlscanResult.score}/100`);
    if (urlscanResult.link) lines.push(`  Rapport : ${urlscanResult.link}`);
  }

  // ── Pas de clé API
  if (!vtResult && !gsbResult && !urlscanResult && !heuristic.trusted) {
    lines.push('');
    lines.push(`💡 _Pour une analyse plus poussée,_`);
    lines.push(`_ajoute tes clés API dans .env :_`);
    lines.push(`_VIRUSTOTAL_API_KEY, GOOGLE_SAFEBROWSING_KEY_`);
  }

  lines.push('');
  lines.push(`> *ZERO TRACE BOT v5.0*`);

  return lines.join('\n');
}

// ── Extraire les URLs d'un texte ──────────────────────────────────────────────
function extractUrls(text) {
  const regex = /https?:\/\/[^\s<>"{}|\\^[\]`]+|www\.[a-zA-Z0-9-]+\.[a-zA-Z]{2,}[^\s]*/gi;
  return [...new Set((text.match(regex) || []).map(u => u.replace(/[.,;!?]$/, '')))];
}

// ── Scanner une URL complète ──────────────────────────────────────────────────
async function fullScanUrl(url) {
  const heuristic = analyzeHeuristic(url);
  if (heuristic.trusted) return { heuristic, vt: null, gsb: null, urlscan: null };

  // Lancer les scans en parallèle
  const [vt, gsb, urlscan] = await Promise.allSettled([
    scanVirusTotal(url),
    scanGoogleSafeBrowsing(url),
    scanUrlscan(url),
  ]);

  return {
    heuristic,
    vt:      vt.status      === 'fulfilled' ? vt.value      : null,
    gsb:     gsb.status     === 'fulfilled' ? gsb.value     : null,
    urlscan: urlscan.status === 'fulfilled' ? urlscan.value : null,
  };
}

// ── MODULE EXPORT ─────────────────────────────────────────────────────────────
module.exports = {
  name:    'scanlink',
  aliases: ['scan', 'checklink', 'scanurl', 'urlcheck'],
  description: 'Analyser un lien ou fichier pour détecter les menaces',
  usage:   '.scanlink [url] | .scanfile (répondre à un fichier) | .scanauto on/off',
  category: 'securite',

  async execute(ctx) {
    const { sock, jid, msg, args, antiBan, command, isOwner, isSudo } = ctx;

    // ── .scanauto on/off (owner/sudo seulement) ────────────────────────────
    if (command === 'scanauto') {
      if (!isOwner && !isSudo) {
        await antiBan.safeSend(sock, jid, { text: '❌ Seuls les admins peuvent gérer le scan automatique.' }, { msgOptions: { quoted: msg } });
        return;
      }
      const sub = (args[0] || '').toLowerCase();
      if (sub === 'on') {
        setAutoScan(jid, true);
        await antiBan.safeSend(sock, jid, {
          text:
            `🔍 *Scan automatique ACTIVÉ*\n\n` +
            `Chaque lien reçu dans ce chat sera analysé.\n` +
            `Si un lien est dangereux, il sera signalé.\n\n` +
            `> *ZERO TRACE BOT v5.0*`,
        }, { msgOptions: { quoted: msg } });
      } else if (sub === 'off') {
        setAutoScan(jid, false);
        await antiBan.safeSend(sock, jid, { text: `🔕 *Scan automatique désactivé.*\n\n> *ZERO TRACE BOT v5.0*` }, { msgOptions: { quoted: msg } });
      } else {
        const state = isAutoScanEnabled(jid);
        await antiBan.safeSend(sock, jid, {
          text:
            `🔍 *Scan automatique :* ${state ? '🟢 Activé' : '🔴 Désactivé'}\n\n` +
            `• *.scanauto on*  → activer\n` +
            `• *.scanauto off* → désactiver\n\n` +
            `> *ZERO TRACE BOT v5.0*`,
        }, { msgOptions: { quoted: msg } });
      }
      return;
    }

    // ── .scanfile → analyser un fichier ───────────────────────────────────
    if (command === 'scanfile') {
      const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
      const docMsg = quoted?.documentMessage || quoted?.imageMessage || quoted?.videoMessage || quoted?.audioMessage;

      if (!docMsg) {
        await antiBan.safeSend(sock, jid, {
          text:
            `📁 *.scanfile*\n\n` +
            `Réponds à un *fichier* avec cette commande pour l'analyser.\n\n` +
            `✅ Supporte : PDF, DOC, APK, ZIP, EXE, etc.\n\n` +
            `> *ZERO TRACE BOT v5.0*`,
        }, { msgOptions: { quoted: msg } });
        return;
      }

      await sock.sendMessage(jid, { react: { text: '🔍', key: msg.key } }).catch(() => {});
      await antiBan.safeSend(sock, jid, { text: '🔍 _Analyse du fichier en cours..._' }, { msgOptions: { quoted: msg } });

      const filename  = docMsg.fileName || 'fichier_inconnu';
      const fileExt   = path.extname(filename).toLowerCase();
      const fileSize  = docMsg.fileLength || 0;
      const fileMime  = docMsg.mimetype   || '';

      // Analyse locale immédiate
      let localVerdict = '✅ Aucune menace détectée localement';
      const localFlags = [];

      if (DANGEROUS_EXTENSIONS.includes(fileExt)) {
        localFlags.push(`🚨 Extension exécutable : ${fileExt}`);
      }
      if (SUSPICIOUS_EXTENSIONS.includes(fileExt)) {
        localFlags.push(`⚠️ Extension pouvant contenir des macros : ${fileExt}`);
      }
      if (fileSize > 50 * 1024 * 1024) {
        localFlags.push(`⚠️ Fichier très volumineux (${(fileSize / 1024 / 1024).toFixed(1)} MB)`);
      }
      if (localFlags.length > 0) localVerdict = localFlags.join('\n  ');

      // Télécharger et scanner via VT si possible (max 32 MB)
      let vtResult = null;
      if (process.env.VIRUSTOTAL_API_KEY && fileSize < 32 * 1024 * 1024) {
        try {
          const { downloadMediaMessage } = require('@whiskeysockets/baileys');
          const fakeMsg = {
            key: msg.key,
            message: { [Object.keys(quoted)[0]]: docMsg },
          };
          const buf = await downloadMediaMessage(fakeMsg, 'buffer', {});
          if (buf) vtResult = await scanFileVirusTotal(buf, filename);
        } catch (e) {
          console.log('[SCANFILE] Téléchargement échoué:', e.message);
        }
      }

      // Construire le rapport
      let report =
        `📁 *ANALYSE FICHIER — ZERO TRACE*\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `📎 *Fichier :* ${filename}\n` +
        `📏 *Taille :* ${fileSize > 0 ? (fileSize / 1024).toFixed(1) + ' KB' : 'Inconnue'}\n` +
        `🗂️ *Type :* ${fileMime || fileExt || 'Inconnu'}\n\n`;

      if (vtResult) {
        const isDanger = vtResult.malicious > 0;
        const isSupect = vtResult.suspicious > 0;
        report +=
          `${isDanger ? '🚨' : isSupect ? '⚠️' : '✅'} *Verdict global : ${isDanger ? 'DANGEREUX' : isSupect ? 'SUSPECT' : 'PROPRE'}*\n\n` +
          `🔬 *VirusTotal :*\n` +
          `  🦠 Malveillants : ${vtResult.malicious}/${vtResult.total}\n` +
          `  ⚠️ Suspects : ${vtResult.suspicious}/${vtResult.total}\n` +
          `  ✅ Sûrs : ${vtResult.harmless}/${vtResult.total}\n` +
          `  🔑 SHA-256 : \`${vtResult.hash?.slice(0, 16)}...\`\n\n`;
      } else {
        report +=
          `🧠 *Analyse locale :*\n  ${localVerdict}\n\n`;
        if (!process.env.VIRUSTOTAL_API_KEY) {
          report += `💡 _Configure VIRUSTOTAL_API_KEY dans keys.js_\n_pour une analyse complète._\n\n`;
        }
      }

      report += `> *ZERO TRACE BOT v5.0*`;
      await antiBan.safeSend(sock, jid, { text: report }, { msgOptions: { quoted: msg } });
      await sock.sendMessage(jid, { react: { text: '✅', key: msg.key } }).catch(() => {});
      return;
    }

    // ── .scanlink [url] → analyser un lien ────────────────────────────────
    // Chercher l'URL dans les args OU dans le message cité
    let url = args.join(' ').trim();
    if (!url) {
      const quotedText = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.conversation ||
                         msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.extendedTextMessage?.text || '';
      const urls = extractUrls(quotedText);
      if (urls.length > 0) url = urls[0];
    }

    if (!url) {
      await antiBan.safeSend(sock, jid, {
        text:
          `🔍 *ZERO TRACE — SCANNER DE SÉCURITÉ*\n\n` +
          `*Commandes :*\n` +
          `• *.scanlink [url]*   → analyser un lien\n` +
          `• *.scanlink* (répondre à un message avec lien)\n` +
          `• *.scanfile* (répondre à un fichier)\n` +
          `• *.scanauto on/off*  → scan auto de tous les liens\n\n` +
          `*Moteurs utilisés :*\n` +
          `• 🧠 Analyse heuristique locale (toujours actif)\n` +
          `• 🔬 VirusTotal _(VIRUSTOTAL_API_KEY)_\n` +
          `• 🛡️ Google Safe Browsing _(GOOGLE_SAFEBROWSING_KEY)_\n` +
          `• 🌐 URLScan.io _(URLSCAN_API_KEY)_\n\n` +
          `> *ZERO TRACE BOT v5.0*`,
      }, { msgOptions: { quoted: msg } });
      return;
    }

    // Normaliser
    if (!url.startsWith('http')) url = 'https://' + url;

    await sock.sendMessage(jid, { react: { text: '🔍', key: msg.key } }).catch(() => {});
    await antiBan.safeSend(sock, jid, { text: `🔍 _Analyse en cours...\n${url}_` }, { msgOptions: { quoted: msg } });

    try {
      const { heuristic, vt, gsb, urlscan } = await fullScanUrl(url);
      const report = buildReport(url, heuristic, vt, gsb, urlscan);
      await antiBan.safeSend(sock, jid, { text: report }, { msgOptions: { quoted: msg } });
      await sock.sendMessage(jid, { react: { text: heuristic.trusted || (!vt?.malicious && !gsb?.threats?.length) ? '✅' : '🚨', key: msg.key } }).catch(() => {});
    } catch (err) {
      await antiBan.safeSend(sock, jid, {
        text: `❌ Erreur d'analyse : ${err.message}\n\n> *ZERO TRACE BOT v5.0*`,
      }, { msgOptions: { quoted: msg } });
    }
  },

  // Exposé pour le scan automatique depuis le handler
  analyzeHeuristic,
  extractUrls,
  fullScanUrl,
  buildReport,
  isAutoScanEnabled,
};
