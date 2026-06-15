# 🎙️ DIAGNOSTIC VOCAL — ZERO TRACE BOT v5.0

## 🐛 Bugs identifiés et corrigés

### Bug 1 — "Fichier audio indisponible" (PRINCIPAL)
**Cause :** `downloadMediaMessage` dans Baileys échoue quand le message vocal
est encapsulé dans `viewOnceMessage`, `ephemeralMessage` ou `documentWithCaptionMessage`.
WhatsApp encapsule parfois les messages vocaux dans ces enveloppes.

**Correction :** `downloadAudio()` dans `handler.js` déballe maintenant automatiquement
toutes ces enveloppes avant de télécharger :
```
viewOnceMessage → déballer
viewOnceMessageV2 → déballer
ephemeralMessage → déballer
documentWithCaptionMessage → déballer
```
Et fait **2 tentatives** : avec `reuploadRequest` puis sans (compatibilité versions Baileys).

---

### Bug 2 — `isVoiceMessage()` ne détectait pas les vocaux encapsulés
**Cause :** La fonction cherchait uniquement `msg.message.audioMessage?.ptt`
mais les vocaux encapsulés n'étaient pas à cet emplacement.

**Correction :** Nouvelle fonction `_unwrapAudio()` qui déballe toutes
les couches avant de tester le `ptt`.

---

### Bug 3 — Google TTS retournait du HTML au lieu d'audio
**Cause :** L'URL `translate.google.com/translate_tts?client=tw-ob`
est bloquée/limitée — retourne parfois une page HTML d'erreur.
Le bot envoyait ce HTML comme audio → "fichier audio indisponible".

**Correction :**
- Validation `isValidAudioBuffer()` — vérifie les magic bytes (ID3, OggS, RIFF)
  et détecte si le buffer est du HTML déguisé
- Nouvelle URL principale : `translate.googleapis.com` (plus stable)
- User-Agent mobile simulé (moins bloqué)

---

### Bug 4 — Aucun fallback si Google TTS tombait
**Avant :** ElevenLabs → Google TTS → rien
**Après :** ElevenLabs → StreamElements → Google TTS v2 → VoiceRSS → ResponsiveVoice

---

## 📦 Dépendances mises à jour

| Package | Avant | Après | Changement |
|---|---|---|---|
| `axios` | 1.6.0 | **1.7.9** | Fix fuite mémoire |
| `dotenv` | 16.3.1 | **16.4.7** | Stabilité |
| `sharp` | 0.33.2 | **0.33.5** | Fix Apple Silicon |
| `jimp` | 0.22.12 | **1.6.0** | Nouvelle API majeure |
| `pino` | 8.17.2 | **9.5.0** | Performance |
| `@distube/ytdl-core` | 4.14.4 | **4.16.4** | Fix YouTube |

### Nouvelles dépendances ajoutées
| Package | Utilité |
|---|---|
| `mime-types` | Détection MIME fiable pour les fichiers |
| `link-preview-js` | Prévisualisation de liens (`.scanlink`) |
| `node-cron` | Tâches planifiées (rappels, clean tmp) |

### Dépendances optionnelles
| Package | Utilité |
|---|---|
| `fluent-ffmpeg` | Conversion audio OGG→MP3 si besoin |
| `@ffmpeg-installer/ffmpeg` | FFmpeg embarqué (pas besoin d'installer système) |

---

## 🚀 Après mise à jour

```bash
# Dans le dossier du bot :
npm install

# Vérifier que tout est installé :
node -e "require('@whiskeysockets/baileys'); console.log('Baileys OK')"
node -e "require('fluent-ffmpeg'); console.log('FFmpeg OK')" 2>/dev/null || echo "FFmpeg optionnel"
```

---

## ⚙️ Variables `.env` pour le vocal

```env
# TTS haute qualité (recommandé)
ELEVENLABS_API_KEY=sk_...

# STT transcription vocaux (gratuit)
GROQ_API_KEY=gsk_...

# TTS alternatif (gratuit)
VOICERSS_API_KEY=...
```

**Sans aucune clé API :** StreamElements TTS + Google TTS = vocal fonctionnel gratuitement.

