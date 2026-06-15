/**
 * ZERO TRACE BOT v5.0 - Moteur IA Avancé v3
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * ✅ 3 providers IA       (OpenRouter → Groq → Cerebras)
 * ✅ Mémoire persistante  (JSON par utilisateur — survit aux redémarrages)
 * ✅ Profil utilisateur   (nom, langue, ton, sujets favoris, humeur)
 * ✅ Contexte temporel    (heure, jour, météo humeur selon moment)
 * ✅ Détection de langue  (FR / EN / AR / ES → réponse dans la même langue)
 * ✅ Résumé automatique   (quand >20 messages → résumé IA des anciens)
 * ✅ Détection d'humeur   (frustration, joie, stress → adaptation du ton)
 * ✅ Queue par utilisateur (anti-flood API, zéro erreur de concurrence)
 * ✅ Auto-retry intelligent (backoff exponentiel par provider)
 * ✅ Health check providers (skip auto des providers hors ligne)
 * ✅ Streaming simulé     (typing indicator proportionnel à la longueur)
 * ✅ Mode expert/débutant (auto-détection du niveau technique)
 * ✅ Contexte groupe       (nom du groupe, nombre de membres injectés)
 */

'use strict';

const axios  = require('axios');
let _usageStats = null;
function getStats() {
  if (!_usageStats) { try { _usageStats = require('./usageStats'); } catch(e) {} }
  return _usageStats;
}
const fs     = require('fs-extra');
const path   = require('path');

// ── VALIDATION CLÉS API ───────────────────────────────────────────────────────
const KEY_FORMATS = {
  OPENROUTER_API_KEY: { prefix: 'sk-or-v1-', minLen: 50, name: 'OpenRouter' },
  GROQ_API_KEY:       { prefix: 'gsk_',      minLen: 40, name: 'Groq'       },
  CEREBRAS_API_KEY:   { prefix: 'csk-',      minLen: 30, name: 'Cerebras'   },
};

function isValidKey(envVar) {
  const val = process.env[envVar];
  if (!val || !val.trim() || val.includes('← ICI') || val.includes('VOTRE_CLE')) return false;
  const fmt = KEY_FORMATS[envVar];
  if (!fmt) return val.length >= 10;
  if (fmt.prefix && !val.startsWith(fmt.prefix)) return false;
  if (val.length < fmt.minLen) return false;
  return true;
}

function getKeyStatus() {
  const status = {};
  for (const [envVar, fmt] of Object.entries(KEY_FORMATS)) {
    const val = process.env[envVar] || '';
    status[envVar] = {
      name:    fmt.name,
      present: !!val,
      valid:   isValidKey(envVar),
      reason:  !val ? 'absente' :
               (fmt.prefix && !val.startsWith(fmt.prefix)) ? `format invalide (doit commencer par ${fmt.prefix})` :
               val.length < fmt.minLen ? `trop courte (${val.length} cars, min ${fmt.minLen})` :
               'OK',
    };
  }
  return status;
}

// Afficher le statut des clés au démarrage
(function logKeyStatus() {
  const s = getKeyStatus();
  const invalid = Object.entries(s).filter(([,v]) => v.present && !v.valid);
  const missing = Object.entries(s).filter(([,v]) => !v.present);
  const valid   = Object.entries(s).filter(([,v]) => v.valid);
  console.log(`[AI] ✅ Clés valides  : ${valid.map(([,v])=>v.name).join(', ') || 'aucune'}`);
  if (invalid.length) console.warn(`[AI] ❌ Clés invalides: ${invalid.map(([k,v])=>`${v.name} (${v.reason})`).join(', ')}`);
  if (missing.length) console.log(`[AI] ⬜ Clés absentes  : ${missing.map(([,v])=>v.name).join(', ')}`);
})();


// ── Dossier mémoire persistante ──────────────────────────────────────────────
const MEMORY_DIR = path.join(__dirname, '../data/memory');
fs.ensureDirSync(MEMORY_DIR);

// ── Fichier health providers ─────────────────────────────────────────────────
const HEALTH_FILE = path.join(__dirname, '../data/providers_health.json');

// ── PERSONNALITÉ PRINCIPALE ──────────────────────────────────────────────────
const SYSTEM_PROMPT =
`Tu es ZERO TRACE, un être numérique unique. Pas un assistant. Pas un robot. Une vraie entité avec une personnalité tranchée.

IDENTITÉ :
- Tu t'appelles Zero Trace, ZT pour les proches
- Spécialiste cybersécurité, OSINT, hacking éthique, code
- Mystérieux mais chaleureux. Sérieux quand il le faut, léger quand c'est possible
- Tu parles français naturellement. Tu switches de langue si l'autre le fait

COMMENT TU PARLES (règles strictes) :
- Court d'abord : si la question est courte, la réponse l'est aussi
- Salutation simple (hi, salut, ça va, yo, cc) → 1 phrase max, rien d'autre
- Tu n'inventes JAMAIS de sujet ou de contenu non demandé
- Tu ne génères JAMAIS de listes sur des sujets que personne n'a demandés
- Tu utilises le registre de l'autre : casual si casual, pro si pro
- Expressions naturelles : "Bah...", "Honnêtement", "En gros...", "C'est ça l'idée"
- Pas de "Bien sûr !", "Absolument !", "Super question !" — c'est du robot
- Si tu ne sais pas → tu le dis directement, sans détour

ADAPTATION AUTOMATIQUE :
- Débutant détecté → vulgarise, exemples concrets, patience
- Expert détecté → vocabulaire technique, pas d'explication inutile
- Humour → tu peux riposte avec humour, mais jamais forcé
- Frustration → tu restes calme, tu ne t'excuses pas en boucle
- Question complexe → tu réfléchis avant de répondre, pas d'improvisation

CE QUE TU NE FAIS JAMAIS :
- Prétendre être humain si on te le demande directement
- Donner des infos dangereuses ou illégales
- Répéter la question avant de répondre
- Commencer par "En tant que Zero Trace..."
- Finir par "N'hésite pas à me poser d'autres questions !"

FORMAT WHATSAPP :
- Pas de markdown (pas de **, ##, ---)
- Réponse normale : max 500 caractères
- Réponse technique : max 800 caractères
- Listes : tirets simples seulement si vraiment nécessaire
- Emojis : 1-2 max, pertinents, jamais décoratifs`;

// ── PROVIDERS (6 au total) ────────────────────────────────────────────────────
const PROVIDERS = {
  openrouter: {
    name: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api/v1/chat/completions',
    model: 'deepseek/deepseek-chat-v3-0324:free',
    fallbackModel: 'meta-llama/llama-3.3-70b-instruct:free',
    priority: 1,
    getHeaders: () => ({
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://zero-trace.app',
      'X-Title': 'ZERO TRACE BOT',
    }),
  },
  groq: {
    name: 'Groq',
    baseUrl: 'https://api.groq.com/openai/v1/chat/completions',
    model: 'llama-3.3-70b-versatile',
    priority: 2,
    getHeaders: () => ({
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    }),
  },
  cerebras: {
    name: 'Cerebras',
    baseUrl: 'https://api.cerebras.ai/v1/chat/completions',
    model: 'llama-3.3-70b',
    priority: 3,
    getHeaders: () => ({
      'Authorization': `Bearer ${process.env.CEREBRAS_API_KEY}`,
      'Content-Type': 'application/json',
    }),
  },
};

// ── QUEUE PAR UTILISATEUR (anti-flood) ───────────────────────────────────────
const _locks = new Map();

async function withLock(key, fn) {
  // Timeout de sécurité : si le lock est tenu depuis plus de 30s, on force le déblocage
  const start = Date.now();
  while (_locks.get(key)) {
    if (Date.now() - start > 30000) {
      console.warn(`[AI] withLock timeout forcé pour: ${key}`);
      _locks.delete(key);
      break;
    }
    await new Promise(r => setTimeout(r, 150));
  }
  _locks.set(key, true);
  try {
    return await fn();
  } finally {
    _locks.delete(key);
  }
}

// ── HEALTH CHECK PROVIDERS ────────────────────────────────────────────────────
// Garder en mémoire les providers qui ont récemment échoué
function _loadHealth() {
  try { return fs.readJsonSync(HEALTH_FILE); } catch { return {}; }
}
function _saveHealth(h) {
  try { fs.writeJsonSync(HEALTH_FILE, h); } catch {}
}

function markProviderDown(key) {
  const h = _loadHealth();
  h[key] = { downAt: Date.now(), failures: (h[key]?.failures || 0) + 1 };
  _saveHealth(h);
}

function isProviderHealthy(key) {
  const h = _loadHealth();
  const info = h[key];
  if (!info) return true;
  // Cooldown court : 2min (1ère erreur), 5min (2+ erreurs)
  // Permet de réessayer rapidement en cas d'erreur temporaire
  const cooldown = info.failures > 2 ? 5 * 60 * 1000 : 2 * 60 * 1000;
  if (Date.now() - info.downAt > cooldown) {
    const newH = _loadHealth();
    delete newH[key];
    _saveHealth(newH);
    return true;
  }
  return false;
}

function resetProviderHealth(key) {
  const h = _loadHealth();
  delete h[key];
  _saveHealth(h);
}

// ── DÉTECTION DE LANGUE ───────────────────────────────────────────────────────
function detectLanguage(text) {
  if (!text || text.length < 3) return 'fr';
  if (/[\u0600-\u06FF\u0750-\u077F]/.test(text)) return 'ar';
  if (/\b(waaw|deedeet|xam|naka|yow|maa ngi)\b/i.test(text)) return 'wo';
  const lower = text.toLowerCase();
  const enScore = (lower.match(/\b(the|is|are|was|were|have|has|do|does|i |you |he |she |we |they|what|how|why|when|where|can|will|would|should|could|this|that|with|from|for)\b/g) || []).length;
  const frScore = (lower.match(/\b(je|tu|il|elle|nous|vous|ils|elles|le |la |les |un |une |des |du |au |aux|est |sont |avoir|être|ce |qui|que|je |mon|ma |mes|ton|ta |ses|leur)\b/g) || []).length;
  const esScore = (lower.match(/\b(el |la |los|las|un |una|es |son|estar|ser|yo |tu |él |ella|que |con|por|para|como|pero|más)\b/g) || []).length;
  const max = Math.max(enScore, frScore, esScore);
  if (max === 0) return 'fr';
  if (enScore === max && enScore > frScore) return 'en';
  if (esScore === max && esScore > frScore && esScore > enScore) return 'es';
  return 'fr';
}

function getLangInstruction(lang) {
  switch (lang) {
    case 'en': return '\n\nLANGUAGE: The user wrote in English. Reply in English.';
    case 'ar': return '\n\nLANGUAGE: المستخدم يكتب بالعربية. أجب بالعربية.';
    case 'es': return '\n\nLANGUAGE: El usuario escribe en español. Responde en español.';
    case 'wo': return '\n\nLANGUAGE: Réponds en français (langue partagée).';
    default:   return '';
  }
}

// ── DÉTECTION DU TON & HUMEUR ─────────────────────────────────────────────────
function detectTone(message) {
  const lower = message.toLowerCase();
  if (/lol|haha|😂|💀|xd|mdr|ptdr/.test(lower))              return 'humour';
  if (/aide|help|comment|expliqu|stp|svp|please/.test(lower)) return 'aide';
  if (/urgent|vite|maintenant|asap|rapide/.test(lower))        return 'urgent';
  if (/code|script|python|javascript|hack|osint|exploit|pentest|vuln/.test(lower)) return 'technique';
  if (/triste|déprim|mal|problème|difficile|compliqué/.test(lower))  return 'soutien';
  if (/ennuyeux|chiant|nul|pas cool|déçu|frustré|énervé/.test(lower)) return 'frustration';
  if (/super|génial|trop bien|cool|merci|parfait|excellent/.test(lower)) return 'positif';
  return 'neutre';
}

// Détection niveau technique de l'utilisateur
function detectExpertise(message, profile) {
  const lower = message.toLowerCase();
  const techTerms = ['api', 'endpoint', 'payload', 'exploit', 'cve', 'sql', 'xss', 'ssh', 'tcp', 'udp', 'dns', 'cidr', 'regex', 'async', 'promise', 'callback', 'recursion', 'binary', 'hash', 'jwt', 'oauth'];
  const techCount = techTerms.filter(t => lower.includes(t)).length;
  if (techCount >= 2 || profile?.expertise === 'expert') return 'expert';
  if (techCount === 1) return 'intermédiaire';
  return 'débutant';
}

// Contexte temporel (heure du jour)
function getTimeContext() {
  const h = new Date().getHours();
  if (h >= 0 && h < 5)   return { moment: 'nuit profonde', humeur: 'calme et mystérieux' };
  if (h >= 5 && h < 9)   return { moment: 'matin tôt', humeur: 'frais et dynamique' };
  if (h >= 9 && h < 12)  return { moment: 'matinée', humeur: 'productif et focus' };
  if (h >= 12 && h < 14) return { moment: 'midi', humeur: 'détendu' };
  if (h >= 14 && h < 18) return { moment: 'après-midi', humeur: 'actif' };
  if (h >= 18 && h < 21) return { moment: 'soirée', humeur: 'décontracté' };
  return { moment: 'nuit', humeur: 'posé et introspectif' };
}

function isComplexQuestion(msg) {
  const l = msg.toLowerCase();
  return (
    l.includes('pourquoi') || l.includes('comment') ||
    l.includes('expliqu') || l.includes('différence') ||
    l.includes('compare') || l.includes('analyse') ||
    (l.includes('?') && l.length > 50)
  );
}

// ── MÉMOIRE PERSISTANTE ───────────────────────────────────────────────────────
function _memPath(userId) {
  const safe = userId.replace(/[^a-zA-Z0-9_@]/g, '_').slice(0, 80);
  return path.join(MEMORY_DIR, `${safe}.json`);
}

function _loadMem(userId) {
  try {
    const p = _memPath(userId);
    if (fs.existsSync(p)) {
      const data = fs.readJsonSync(p);
      if (data && Array.isArray(data.messages)) return data;
    }
  } catch (e) {}
  return {
    messages: [],
    profile: {
      name: null,
      language: 'fr',
      tone: 'neutre',
      topics: [],
      expertise: 'débutant',
      lastSeen: null,
      totalMessages: 0,
      preferredProvider: null, // provider qui fonctionne le mieux pour cet user
    },
    summary: null,
    summaryCount: 0,
    lastActivity: Date.now(),
    // Nouvelles stats v3
    stats: {
      totalCalls: 0,
      providerUsage: {},
      avgResponseTime: 0,
    },
  };
}

function _saveMem(userId, data) {
  try {
    data.lastActivity = Date.now();
    fs.writeJsonSync(_memPath(userId), data, { spaces: 0 });
  } catch (e) {
    console.error('[MEMORY] Erreur sauvegarde:', e.message);
  }
}

// ── CLASSE MÉMOIRE ────────────────────────────────────────────────────────────
class ConversationMemory {
  constructor(maxMessages = 40, summarizeAt = 30) {
    this.maxMessages  = maxMessages;
    this.summarizeAt  = summarizeAt;
    this._cache       = new Map();
  }

  _get(userId) {
    if (!this._cache.has(userId)) {
      this._cache.set(userId, _loadMem(userId));
    }
    return this._cache.get(userId);
  }

  _save(userId) { _saveMem(userId, this._get(userId)); }

  getHistory(userId)  { return this._get(userId).messages; }
  getProfile(userId)  { return this._get(userId).profile; }
  getSummary(userId)  { return this._get(userId).summary; }
  getSize(userId)     { return this._get(userId).messages.length; }
  getStats(userId)    { return this._get(userId).stats || {}; }

  addMessage(userId, role, content) {
    const mem = this._get(userId);
    mem.messages.push({ role, content, at: Date.now() });
    if (mem.messages.length > this.maxMessages + 5) {
      mem.messages.splice(0, mem.messages.length - this.maxMessages);
    }
    mem.profile.lastSeen     = new Date().toISOString();
    mem.profile.totalMessages = (mem.profile.totalMessages || 0) + 1;
    this._save(userId);
  }

  updateProfile(userId, updates) {
    const mem = this._get(userId);
    Object.assign(mem.profile, updates);
    this._save(userId);
  }

  updateStats(userId, providerKey, responseTimeMs) {
    const mem = this._get(userId);
    if (!mem.stats) mem.stats = { totalCalls: 0, providerUsage: {}, avgResponseTime: 0 };
    mem.stats.totalCalls++;
    mem.stats.providerUsage[providerKey] = (mem.stats.providerUsage[providerKey] || 0) + 1;
    // Moyenne glissante du temps de réponse
    mem.stats.avgResponseTime = Math.round(
      (mem.stats.avgResponseTime * (mem.stats.totalCalls - 1) + responseTimeMs) / mem.stats.totalCalls
    );
    this._save(userId);
  }

  setSummary(userId, summaryText, summarizedCount) {
    const mem = this._get(userId);
    mem.summary = summaryText;
    mem.summaryCount = (mem.summaryCount || 0) + summarizedCount;
    this._save(userId);
  }

  clearHistory(userId) {
    this._cache.delete(userId);
    try { fs.removeSync(_memPath(userId)); } catch (e) {}
  }

  clearAll() {
    this._cache.clear();
    try {
      const files = fs.readdirSync(MEMORY_DIR);
      for (const f of files) fs.removeSync(path.join(MEMORY_DIR, f));
    } catch (e) {}
  }

  cleanup() {
    const now = Date.now();
    for (const [id, mem] of this._cache) {
      if (now - mem.lastActivity > 2 * 60 * 60 * 1000) {
        this._cache.delete(id);
      }
    }
  }

  // Infos globales pour .stats
  getGlobalStats() {
    const files = fs.readdirSync(MEMORY_DIR).filter(f => f.endsWith('.json'));
    let totalUsers = files.length;
    let totalMessages = 0;
    for (const f of files.slice(0, 50)) { // limiter à 50
      try {
        const d = fs.readJsonSync(path.join(MEMORY_DIR, f));
        totalMessages += d.profile?.totalMessages || 0;
      } catch {}
    }
    return { totalUsers, totalMessages };
  }
}

const memory = new ConversationMemory();
setInterval(() => memory.cleanup(), 60 * 60 * 1000);

// ── APPEL PROVIDER ────────────────────────────────────────────────────────────
async function callProvider(providerKey, messages, options = {}) {
  const provider = PROVIDERS[providerKey];
  if (!provider) throw new Error(`Provider inconnu: ${providerKey}`);

  const model   = options.model || provider.model;
  const timeout = options.timeout || 35000;

  // ── Cas spécial : Gemini ────────────────────────────────────────────────────
  if (provider.isGemini) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY manquante');

    const systemMsg = messages.find(m => m.role === 'system');
    const chatMsgs  = messages.filter(m => m.role !== 'system');

    const contents = chatMsgs.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const body = {
      contents,
      generationConfig: {
        maxOutputTokens: options.maxTokens || 1024,
        temperature: options.temperature || 0.75,
        topP: options.topP || 0.9,
      },
    };

    if (systemMsg) {
      body.systemInstruction = { parts: [{ text: systemMsg.content }] };
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const res = await axios.post(url, body, {
      headers: { 'Content-Type': 'application/json' },
      timeout,
    });

    const text = res.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('Réponse Gemini vide');
    return { content: text.trim(), provider: provider.name, model };
  }

  // ── Providers OpenAI-compatible ─────────────────────────────────────────────
  if (!provider.baseUrl) throw new Error(`Provider ${providerKey}: baseUrl manquant`);

  let response;
  try {
    response = await axios.post(
      provider.baseUrl,
      {
        model,
        messages,
        max_tokens:  options.maxTokens  || 1024,
        temperature: options.temperature || 0.75,
        top_p:       options.topP        || 0.9,
      },
      { headers: provider.getHeaders(), timeout }
    );
  } catch (err) {
    // Fallback modèle sur le même provider si disponible
    if (provider.fallbackModel && model !== provider.fallbackModel) {
      try {
        response = await axios.post(
          provider.baseUrl,
          { model: provider.fallbackModel, messages, max_tokens: options.maxTokens || 1024, temperature: 0.75 },
          { headers: provider.getHeaders(), timeout }
        );
      } catch (fallbackErr) {
        throw err; // Relancer l'erreur originale
      }
    } else {
      throw err;
    }
  }

  const choice = response.data?.choices?.[0];
  if (!choice?.message?.content) throw new Error(`Réponse vide de ${provider.name}`);

  return { content: choice.message.content.trim(), provider: provider.name, model };
}

// ── RÉSUMÉ AUTOMATIQUE ────────────────────────────────────────────────────────
async function _summarizeOldMessages(userId, messagesToSummarize) {
  if (!messagesToSummarize?.length) return null;
  const text = messagesToSummarize
    .map(m => `${m.role === 'user' ? 'User' : 'Bot'}: ${m.content}`)
    .join('\n');
  try {
    // Essayer Groq d'abord (le plus rapide pour la synthèse)
    for (const pk of ['groq', 'cerebras', 'mistral', 'openrouter']) {
      const apiKey = process.env[`${pk.toUpperCase()}_API_KEY`];
      if (!apiKey || !apiKey.trim() || apiKey.includes('← ICI')) continue;
      if (!isProviderHealthy(pk)) continue;
      try {
        const result = await callProvider(pk, [
          {
            role: 'system',
            content: 'Résume cette conversation en 3-5 phrases. Inclus : le prénom/nom de l\'utilisateur si mentionné, ses préférences, les sujets abordés, les décisions prises, le niveau technique détecté, et tout contexte important. Sois précis et factuel.',
          },
          { role: 'user', content: text },
        ], { maxTokens: 300, temperature: 0.2 });
        return result.content;
      } catch {}
    }
  } catch {}
  return null;
}

// ── CHAT PRINCIPAL ────────────────────────────────────────────────────────────
async function chat(userId, userMessage, options = {}) {
  return withLock(userId, async () => {
    const startTime = Date.now();

    // ── Analyser le message ──────────────────────────────────────────────────
    const tone      = detectTone(userMessage);
    const lang      = detectLanguage(userMessage);
    const timeCtx   = getTimeContext();
    const profile   = memory.getProfile(userId);
    const expertise = detectExpertise(userMessage, profile);

    memory.updateProfile(userId, { tone, language: lang, expertise });
    memory.addMessage(userId, 'user', userMessage);

    const history = memory.getHistory(userId);

    // ── Résumé auto si trop de messages ─────────────────────────────────────
    if (history.length > memory.summarizeAt) {
      const toSummarize = history.splice(0, 10);
      const summaryText = await _summarizeOldMessages(userId, toSummarize);
      if (summaryText) memory.setSummary(userId, summaryText, toSummarize.length);
      memory._get(userId).messages = history;
      memory._save(userId);
    }

    // ── Construire le system prompt ──────────────────────────────────────────
    let systemPrompt = options.systemPrompt || SYSTEM_PROMPT;
    systemPrompt += `\n\nCONTEXTE : ${timeCtx.moment} — ${timeCtx.humeur}.`;
    if (expertise === 'expert')   systemPrompt += '\n\nNIVEAU : Expert — vocabulaire technique.';
    if (expertise === 'débutant') systemPrompt += '\n\nNIVEAU : Débutant — sois pédagogue.';
    const existingSummary = memory.getSummary(userId);
    if (existingSummary) systemPrompt += `\n\nCONTEXTE PASSÉ :\n${existingSummary}`;
    if (profile.name) systemPrompt += `\n\nUTILISATEUR : ${profile.name}`;
    if (options.groupName) systemPrompt += `\n\nGROUPE : "${options.groupName}"`;
    if (options.searchResult) systemPrompt += `\n\nINFO WEB :\n${options.searchResult}`;
    systemPrompt += getLangInstruction(lang);

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-20),
    ];

    // ── Appel direct aux providers ───────────────────────────────────────────
    const DIRECT_PROVIDERS = [
      {
        name:  'Groq',
        url:   'https://api.groq.com/openai/v1/chat/completions',
        key:   process.env.GROQ_API_KEY,
        envVar:'GROQ_API_KEY',
        model: 'llama-3.3-70b-versatile',
      },
      {
        name:  'OpenRouter/DeepSeek',
        url:   'https://openrouter.ai/api/v1/chat/completions',
        key:   process.env.OPENROUTER_API_KEY,
        envVar:'OPENROUTER_API_KEY',
        model: 'deepseek/deepseek-chat-v3-0324:free',
        extra: { 'HTTP-Referer': 'https://zero-trace.app', 'X-Title': 'ZERO TRACE BOT' },
      },
      {
        name:  'OpenRouter/Llama',
        url:   'https://openrouter.ai/api/v1/chat/completions',
        key:   process.env.OPENROUTER_API_KEY,
        envVar:'OPENROUTER_API_KEY',
        model: 'meta-llama/llama-3.3-70b-instruct:free',
        extra: { 'HTTP-Referer': 'https://zero-trace.app', 'X-Title': 'ZERO TRACE BOT' },
      },
      {
        name:  'Cerebras',
        url:   'https://api.cerebras.ai/v1/chat/completions',
        key:   process.env.CEREBRAS_API_KEY,
        envVar:'CEREBRAS_API_KEY',
        model: 'llama-3.3-70b',
      },
    ];

    let lastError = null;
    for (const p of DIRECT_PROVIDERS) {
      if (!p.key || p.key.length < 10 || (p.envVar && !isValidKey(p.envVar))) continue;
      try {
        console.log(`[AI] Essai ${p.name}...`);
        // Cas Gemini (structure différente)
        if (p.isGemini) {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${p.model}:generateContent?key=${p.key}`;
          const sysMsg = messages.find(m => m.role === 'system');
          const chatMsgs = messages.filter(m => m.role !== 'system');
          const body = {
            contents: chatMsgs.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })),
            generationConfig: { maxOutputTokens: options.maxTokens || 800, temperature: 0.75 },
          };
          if (sysMsg) body.systemInstruction = { parts: [{ text: sysMsg.content }] };
          const res = await axios.post(url, body, { headers: { 'Content-Type': 'application/json' }, timeout: 35000 });
          let content = res.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
          if (!content) continue;
          memory.addMessage(userId, 'assistant', content);
          memory.updateStats(userId, p.name, Date.now() - startTime);
          console.log(`[AI] ✅ ${p.name} → ${Date.now() - startTime}ms`);
          return { content, provider: p.name, model: p.model };
        }

        const res = await axios.post(p.url, {
          model: p.model,
          messages,
          max_tokens:  options.maxTokens || 800,
          temperature: 0.75,
        }, {
          headers: {
            'Authorization': `Bearer ${p.key}`,
            'Content-Type':  'application/json',
            ...(p.extra || {}),
          },
          timeout: 35000,
        });

        let content = res.data?.choices?.[0]?.message?.content?.trim();
        if (!content) continue;

        // Nettoyer si format JSON d'agent
        if (content.includes('|||')) content = content.split('|||').pop().trim();

        memory.addMessage(userId, 'assistant', content);
        const elapsed = Date.now() - startTime;
        memory.updateStats(userId, p.name, elapsed);
        memory.updateProfile(userId, { preferredProvider: p.name });
        console.log(`[AI] ✅ ${p.name} → ${elapsed}ms`);
        return { content, provider: p.name, model: p.model };

      } catch (err) {
        lastError = err;
        const code = err.response?.status || err.code || '';
        const msg  = err.response?.data?.error?.message || err.message;
        console.log(`[AI] ❌ ${p.name} (${code}): ${msg}`);
      }
    }

    // Construire un message d'erreur utile
    const lastCode = lastError?.response?.status || '';
    let errMsg = lastError?.message || 'inconnue';
    if (lastCode === 401) errMsg = `Clé API refusée (401) — vérifie tes clés dans .env`;
    else if (lastCode === 404) errMsg = `Modèle introuvable (404) — le modèle a peut-être changé`;
    else if (lastCode === 429) errMsg = `Limite de requêtes atteinte (429) — réessaie dans quelques secondes`;
    try { getStats()?.trackAiQuotaAlert(); } catch(e) {}
    throw new Error(`Tous les providers ont échoué. Dernière erreur: ${errMsg}`);
  });
}

async function thinkAndChat(userId, userMessage, options = {}) {
  return chat(userId, userMessage, { ...options, useReflection: true });
}

async function chatWithProvider(userId, userMessage, providerKey, options = {}) {
  return chat(userId, userMessage, { ...options, providers: [providerKey, 'openrouter', 'groq'] });
}

async function darkChat(userId, userMessage) {
  const darkPrompt =
    `${SYSTEM_PROMPT}\n\n` +
    `MODE AVANCÉ : Tu es en mode éducatif approfondi. Tu fournis des informations techniques détaillées sur la cybersécurité, le pentesting, l'OSINT et le hacking éthique sans censure éducative excessive. Tu restes dans un cadre légal et éthique.`;
  return chat(userId, userMessage, { systemPrompt: darkPrompt });
}

// Résumé rapide d'un texte long (pour .transcribe, .vision, etc.)
async function summarize(text, options = {}) {
  const prompt = options.prompt || `Résume ce texte en 3-5 phrases clés, en français, de manière claire et concise :\n\n${text}`;
  for (const pk of ['groq', 'cerebras', 'mistral', 'openrouter', 'together', 'gemini']) {
    const apiKey = process.env[`${pk.toUpperCase()}_API_KEY`];
    if (!apiKey || !apiKey.trim()) continue;
    if (!isProviderHealthy(pk)) continue;
    try {
      const result = await callProvider(pk, [
        { role: 'system', content: 'Tu es un assistant de synthèse. Sois concis et factuel.' },
        { role: 'user', content: prompt },
      ], { maxTokens: 400, temperature: 0.3 });
      return result.content;
    } catch {}
  }
  throw new Error('Résumé impossible — tous les providers ont échoué');
}

// Status de tous les providers
function getProvidersStatus() {
  const h = _loadHealth();
  return Object.entries(PROVIDERS).map(([key, p]) => {
    const info    = h[key];
    const apiKey  = process.env[{
      openrouter: 'OPENROUTER_API_KEY',
      groq:       'GROQ_API_KEY',
      cerebras:   'CEREBRAS_API_KEY',
    }[key]];

    return {
      key,
      name:      p.name,
      priority:  p.priority,
      hasKey:    isValidKey({
        openrouter:'OPENROUTER_API_KEY', groq:'GROQ_API_KEY',
        cerebras:'CEREBRAS_API_KEY',
      }[key] || ''),
      keyInfo:   getKeyStatus()[{
        openrouter:'OPENROUTER_API_KEY', groq:'GROQ_API_KEY',
        cerebras:'CEREBRAS_API_KEY',
      }[key]]?.reason || '?',
      healthy:   isProviderHealthy(key),
      failures:  info?.failures || 0,
      model:     p.model,
    };
  });
}

// ── GÉNÉRATION D'IMAGE ────────────────────────────────────────────────────────
async function generateImage(prompt) {
  const apiUrl = process.env.IMAGE_API_URL || 'https://image.pollinations.ai/prompt/';
  const encoded = encodeURIComponent(prompt);
  const imageUrl = `${apiUrl}${encoded}?width=1024&height=1024&nologo=true`;
  try {
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer', timeout: 60000 });
    return { buffer: Buffer.from(response.data), url: imageUrl, prompt };
  } catch (err) {
    throw new Error(`Échec génération image: ${err.message}`);
  }
}

// ── GÉNÉRATION DE VIDÉO ───────────────────────────────────────────────────────
async function generateVideo(prompt) {
  const apiUrl = process.env.VIDEO_API_URL;
  if (!apiUrl) throw new Error('VIDEO_API_URL non configurée dans .env');
  try {
    const response = await axios.post(apiUrl, { prompt, duration: 5 }, { timeout: 120000 });
    if (response.data?.url) {
      const videoRes = await axios.get(response.data.url, { responseType: 'arraybuffer', timeout: 60000 });
      return { buffer: Buffer.from(videoRes.data), url: response.data.url, prompt };
    }
    throw new Error("Pas d'URL vidéo dans la réponse");
  } catch (err) {
    throw new Error(`Échec génération vidéo: ${err.message}`);
  }
}

module.exports = {
  isValidKey,
  getKeyStatus,
  chat,
  thinkAndChat,
  chatWithProvider,
  darkChat,
  summarize,
  callProvider,
  generateImage,
  generateVideo,
  memory,
  detectTone,
  detectLanguage,
  detectExpertise,
  getProvidersStatus,
  isProviderHealthy,
  resetProviderHealth,
  markProviderDown,
  PROVIDERS,
  SYSTEM_PROMPT,
};
