# ⚡ ZERO TRACE BOT v5.0 — Nouvelles Commandes (API drexapp)

## 🌐 API : api.drexapp.space

Toutes les nouvelles commandes utilisent `api.drexapp.space` comme API **principale**,
avec des fallbacks automatiques si elle ne répond pas.

---

## 📥 Nouveaux Downloaders

### `.soundcloud [lien]` | `.sc [lien]`
**Fichier :** `commands/soundcloud.js`

Télécharge n'importe quelle piste SoundCloud publique en **MP3**.

```
.soundcloud https://soundcloud.com/artiste/titre
.sc https://soundcloud.com/artiste/titre
```

**Ce qui est envoyé :**
- 🎵 Fichier audio MP3
- 🖼️ Pochette d'artwork (si disponible)
- 📝 Titre + artiste + durée

**APIs :**
1. `api.drexapp.space/downloader/soundcloud` ← principale
2. `soundcloudmp3.art` ← fallback
3. `sndcld.org` ← fallback ultime

---

### `.capcut [lien]` | `.cc [lien]`
**Fichier :** `commands/capcut.js`

Télécharge des vidéos et templates CapCut **sans filigrane**.

```
.capcut https://www.capcut.com/t/...
.cc https://www.capcut.com/t/...
```

**Ce qui est envoyé :**
- 🎬 Vidéo MP4 sans filigrane
- 🖼️ Thumbnail du template
- 👤 Créateur + durée + likes

**APIs :**
1. `api.drexapp.space/downloader/capcut` ← principale
2. `capcutdownloader.pro` ← fallback
3. `cobalt.tools` ← fallback ultime

---

### `.instagram [lien]` (amélioré)
**Fichier :** `commands/instagram.js`

Maintenant utilise `igdlv2` de drexapp comme API principale.

```
.instagram https://www.instagram.com/reel/...
.ig https://www.instagram.com/p/...    (photo)
.reel https://www.instagram.com/reel/...
```

**Nouveau :**
- ✅ Supporte les **carousels** (jusqu'à 5 médias envoyés)
- ✅ Affiche la **légende (caption)** du post
- API principale : `api.drexapp.space/downloader/igdlv2`

---

## 🔍 Nouvelles Recherches / Outils

### `.imgsearch [requête]` | `.imgs [requête]`
**Fichier :** `commands/imgsearch.js`

Recherche des images sur Google et les envoie directement dans WhatsApp.

```
.imgsearch coucher de soleil
.imgsearch Bugatti 3         ← envoie 3 images
.imgs chat noir 5            ← envoie 5 images (max)
```

**Options :**
- Sans chiffre → 1 image
- Avec chiffre (1-5) → plusieurs images

**APIs :**
1. `api.drexapp.space/search/google-images` ← principale
2. Google Custom Search API ← si `GOOGLE_CSE_KEY` et `GOOGLE_CSE_CX` définis dans `.env`
3. Bing Images scrape ← fallback ultime

**Variables `.env` optionnelles :**
```env
GOOGLE_CSE_KEY=AIza...
GOOGLE_CSE_CX=abc123...
```
_(Sans ces clés, Bing scrape est utilisé automatiquement)_

---

### `.resize [taille]` | `.imageresize [taille]`
**Fichier :** `commands/imageresize.js`

Redimensionner une image. Il faut **répondre à une image** avec la commande.

```
.resize 800x600     → exactement 800 × 600 px
.resize 512         → carré 512 × 512 px
.resize 50%         → réduire de moitié
.resize 1080x1920   → format Story Instagram
.resize 512x512     → format sticker IA
```

**APIs :**
1. `api.drexapp.space/tools/imageresize` ← principale
2. `Jimp` (traitement local) ← fallback

**Dépendance :** `jimp` (ajouté dans `package.json`)
```bash
npm install
```

---

## 🔧 Mise à jour du menu

Les nouvelles commandes sont visibles dans `.menu` :

- 📂 **MÉDIAS** : `.soundcloud`, `.capcut`
- 📂 **OUTILS** : `.imgsearch`, `.resize`

---

## 📋 Résumé

| Commande | Alias | API principale | Fallback |
|---|---|---|---|
| `.soundcloud` | `.sc` | drexapp/soundcloud | soundcloudmp3.art |
| `.capcut` | `.cc` | drexapp/capcut | cobalt.tools |
| `.instagram` | `.ig`, `.reel` | drexapp/igdlv2 | cobalt, saveig |
| `.imgsearch` | `.imgs`, `.gimage` | drexapp/google-images | Bing scrape |
| `.resize` | `.imageresize` | drexapp/imageresize | Jimp (local) |

