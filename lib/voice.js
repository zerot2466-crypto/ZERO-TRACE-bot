/**
 * ZERO TRACE BOT v5.0 — Moteur Voix v4 (STABLE)
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * TTS chain (ordre de fiabilité 2026) :
 *   1. ElevenLabs (si clé dispo)
 *   2. Google TTS v3 (tts.google.com — plus stable)
 *   3. gTTS npm fallback
 *   4. VoiceRSS (si clé dispo)
 *
 * STT chain :
 *   1. Groq Whisper (rapide, gratuit)
 *   2. OpenRouter Whisper
 */
'use strict';
const axios  = require('axios');
const fs     = require('fs-extra');
const path   = require('path');

const TMP = path.join(__dirname, '../tmp');
fs.ensureDirSync(TMP);

const DEFAULT_MALE_VOICE_ID = 'ErXwobaYiN019PkySvjV';
const CLONED_VOICE_ID_FILE  = path.join(__dirname, '../data/cloned_voice_id.json');

function getClonedVoiceId() {
  try { return fs.readJsonSync(CLONED_VOICE_ID_FILE)?.voiceId || null; } catch { return null; }
}
function saveClonedVoiceId(id) {
  try { fs.writeJsonSync(CLONED_VOICE_ID_FILE, { voiceId: id }); } catch (e) {}
}

// ── Validation buffer audio (assouplie) ───────────────────────────────────────
function isValidAudioBuffer(buf) {
  if (!buf || buf.length < 256) return false;
  // Rejet si c'est du HTML (erreur API déguisée)
  const head = buf.slice(0, 20).toString('ascii').toLowerCase();
  if (head.includes('<html') || head.includes('<!doc')) return false;
  // Rejet si c'est du JSON d'erreur
  if (head.trim().startsWith('{') && buf.length < 2000) {
    try { JSON.parse(buf.toString()); return false; } catch {}
  }
  // Accepter tout buffer de taille raisonnable sans magic bytes connu
  return true;
}

// ── STT : AUDIO → TEXTE ───────────────────────────────────────────────────────
async function transcribeAudio(audioBuffer) {
  const tmpFile = path.join(TMP, `voice_${Date.now()}.ogg`);
  try {
    await fs.writeFile(tmpFile, audioBuffer);

    // 1. Groq Whisper
    if (process.env.GROQ_API_KEY) {
      try {
        const FormData = require('form-data');
        const form = new FormData();
        form.append('file', fs.createReadStream(tmpFile), { filename: 'voice.ogg', contentType: 'audio/ogg; codecs=opus' });
        form.append('model', 'whisper-large-v3-turbo');
        form.append('language', 'fr');
        form.append('response_format', 'json');
        const res = await axios.post('https://api.groq.com/openai/v1/audio/transcriptions', form, {
          headers: { ...form.getHeaders(), Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
          timeout: 30000,
        });
        const text = res.data?.text?.trim();
        if (text && text.length > 1) { await fs.remove(tmpFile).catch(() => {}); return { text, provider: 'Groq Whisper' }; }
      } catch (e) { console.log('[STT] Groq échoué:', e.message); }
    }

    // 2. OpenRouter Whisper
    if (process.env.OPENROUTER_API_KEY) {
      try {
        const FormData = require('form-data');
        const form = new FormData();
        form.append('file', fs.createReadStream(tmpFile), { filename: 'voice.ogg', contentType: 'audio/ogg' });
        form.append('model', 'openai/whisper-large-v3');
        const res = await axios.post('https://openrouter.ai/api/v1/audio/transcriptions', form, {
          headers: { ...form.getHeaders(), Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}` },
          timeout: 35000,
        });
        const text = res.data?.text?.trim();
        if (text && text.length > 1) { await fs.remove(tmpFile).catch(() => {}); return { text, provider: 'OpenRouter Whisper' }; }
      } catch (e) { console.log('[STT] OpenRouter échoué:', e.message); }
    }

    await fs.remove(tmpFile).catch(() => {});
    return null;
  } catch (err) {
    await fs.remove(tmpFile).catch(() => {});
    console.error('[STT] Erreur globale:', err.message);
    return null;
  }
}

// ── TTS : TEXTE → AUDIO ───────────────────────────────────────────────────────
async function synthesizeSpeech(text, useClonedVoice = false, lang = 'fr') {
  if (!text?.trim()) return null;
  const cleanText = text.trim().slice(0, 500);
  const ttsLang   = lang || 'fr';

  // ── 1. ElevenLabs ────────────────────────────────────────────────────────
  if (process.env.ELEVENLABS_API_KEY) {
    try {
      const voiceId = (useClonedVoice ? getClonedVoiceId() : null) || DEFAULT_MALE_VOICE_ID;
      const res = await axios.post(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
        { text: cleanText, model_id: 'eleven_multilingual_v2', voice_settings: { stability: 0.5, similarity_boost: 0.85, style: 0.3, use_speaker_boost: true } },
        { headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY, 'Content-Type': 'application/json', Accept: 'audio/mpeg' }, responseType: 'arraybuffer', timeout: 30000 }
      );
      const buf = Buffer.from(res.data);
      if (isValidAudioBuffer(buf)) return { buffer: buf, mimeType: 'audio/mpeg', provider: 'ElevenLabs' };
    } catch (e) { console.log('[TTS] ElevenLabs échoué:', e.message); }
  }

  // ── 2. Google TTS (tts.google.com — URL stable 2026) ─────────────────────
  for (const baseUrl of [
    'https://translate.googleapis.com',
    'https://translate.google.com',
    'https://translate.google.fr',
  ]) {
    try {
      const encoded = encodeURIComponent(cleanText.slice(0, 200));
      const url = `${baseUrl}/translate_tts?ie=UTF-8&q=${encoded}&tl=${ttsLang}&client=gtx&ttsspeed=1`;
      const res = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Linux; Android 12; Pixel 6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Mobile Safari/537.36',
          'Referer': 'https://translate.google.com/',
          'Accept': 'audio/mpeg,audio/*;q=0.8,*/*;q=0.5',
          'Accept-Language': `${ttsLang},fr;q=0.9,en;q=0.7`,
        },
      });
      const buf = Buffer.from(res.data);
      if (isValidAudioBuffer(buf)) {
        console.log(`[TTS] Google TTS OK (${baseUrl})`);
        return { buffer: buf, mimeType: 'audio/mpeg', provider: 'Google TTS' };
      }
    } catch (e) { console.log(`[TTS] Google (${baseUrl}) échoué:`, e.message); }
  }

  // ── 3. gTTS npm (fallback local sans réseau externe dédié) ───────────────
  try {
    const gTTS = require('gtts');
    const tmpFile = path.join(TMP, `gtts_${Date.now()}.mp3`);
    await new Promise((resolve, reject) => {
      const g = new gTTS(cleanText.slice(0, 300), ttsLang);
      g.save(tmpFile, (err) => err ? reject(err) : resolve());
    });
    const buf = fs.readFileSync(tmpFile);
    try { fs.unlinkSync(tmpFile); } catch {}
    if (isValidAudioBuffer(buf)) {
      console.log('[TTS] gTTS OK');
      return { buffer: buf, mimeType: 'audio/mpeg', provider: 'gTTS' };
    }
  } catch (e) { console.log('[TTS] gTTS échoué:', e.message); }

  // ── 4. VoiceRSS ──────────────────────────────────────────────────────────
  if (process.env.VOICERSS_API_KEY) {
    try {
      const hl = ttsLang.includes('-') ? ttsLang : `${ttsLang}-${ttsLang.toUpperCase()}`;
      const res = await axios.get('https://api.voicerss.org/', {
        params: { key: process.env.VOICERSS_API_KEY, hl, src: cleanText.slice(0, 500), c: 'MP3', f: '44khz_16bit_stereo', r: '0' },
        responseType: 'arraybuffer',
        timeout: 20000,
      });
      const buf = Buffer.from(res.data);
      if (isValidAudioBuffer(buf)) return { buffer: buf, mimeType: 'audio/mpeg', provider: 'VoiceRSS' };
    } catch (e) { console.log('[TTS] VoiceRSS échoué:', e.message); }
  }

  // ── 5. TikTok TTS (gratuit, sans clé, voix fr) ───────────────────────────
  try {
    const voiceMap = { fr: 'fr_001', en: 'en_us_006', ar: 'ar_001', es: 'es_002', de: 'de_001', pt: 'pt_001' };
    const voice = voiceMap[ttsLang] || 'fr_001';
    const res = await axios.post(
      'https://tiktok-tts.weilnet.workers.dev/api/generation',
      { text: cleanText.slice(0, 300), voice },
      { headers: { 'Content-Type': 'application/json' }, timeout: 15000, responseType: 'json' }
    );
    if (res.data?.success && res.data?.data) {
      const buf = Buffer.from(res.data.data, 'base64');
      if (isValidAudioBuffer(buf)) {
        console.log('[TTS] TikTok TTS OK');
        return { buffer: buf, mimeType: 'audio/mpeg', provider: 'TikTok TTS' };
      }
    }
  } catch (e) { console.log('[TTS] TikTok TTS échoué:', e.message); }

  console.error('[TTS] Tous les providers ont échoué');
  return null;
}

// ── CLONAGE DE VOIX ───────────────────────────────────────────────────────────
async function cloneVoice(audioBuffer, ownerName = 'ZeroTrace Owner') {
  if (!process.env.ELEVENLABS_API_KEY) return { success: false, error: 'ELEVENLABS_API_KEY manquante dans .env' };
  const tmpFile = path.join(TMP, `clone_${Date.now()}.ogg`);
  try {
    await fs.writeFile(tmpFile, audioBuffer);
    const FormData = require('form-data');
    const form = new FormData();
    form.append('name', `ZeroTrace-${ownerName}`);
    form.append('description', `Voix clonée de ${ownerName} — ZERO TRACE BOT`);
    form.append('labels', JSON.stringify({ owner: ownerName, bot: 'zero-trace' }));
    form.append('files', fs.createReadStream(tmpFile), { filename: 'voice_sample.ogg', contentType: 'audio/ogg' });
    const res = await axios.post('https://api.elevenlabs.io/v1/voices/add', form, {
      headers: { ...form.getHeaders(), 'xi-api-key': process.env.ELEVENLABS_API_KEY },
      timeout: 60000,
    });
    const voiceId = res.data?.voice_id;
    if (!voiceId) throw new Error('Pas de voice_id dans la réponse');
    saveClonedVoiceId(voiceId);
    await fs.remove(tmpFile).catch(() => {});
    return { success: true, voiceId, name: ownerName };
  } catch (err) {
    await fs.remove(tmpFile).catch(() => {});
    return { success: false, error: err.response?.data?.detail?.message || err.message };
  }
}

async function listVoices() {
  if (!process.env.ELEVENLABS_API_KEY) return [];
  try {
    const res = await axios.get('https://api.elevenlabs.io/v1/voices', { headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY }, timeout: 10000 });
    return res.data?.voices || [];
  } catch { return []; }
}

module.exports = { transcribeAudio, synthesizeSpeech, cloneVoice, listVoices, getClonedVoiceId, isValidAudioBuffer };
