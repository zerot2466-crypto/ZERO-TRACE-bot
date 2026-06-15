# ⚡ ZERO TRACE BOT v5.0 — Améliorations Complètes

## 🆕 Nouveaux fichiers

### `commands/menu_carousel.js`
Module dédié au menu en **carousel interactif** (style Silent Tech).

- Cartes swipables avec GIF/video en arrière-plan
- Boutons `quick_reply` sur chaque carte
- Chargement du GIF depuis l'URL configurée dans `.env` (`MENU_GIF_URL`)
- Fallback automatique si le GIF ne charge pas (cartes sans media)
- Compatible Baileys 6.x+ (vérifie la présence de `proto.Message.InteractiveMessage.CarouselMessage`)

---

## 🔧 Fichiers améliorés

### `commands/help.js` — Menu v2

**Avant :** menu listMessage simple  
**Après :** système à 3 niveaux avec fallback automatique

| Priorité | Type | Compatible |
|---|---|---|
| 1 | 🎠 Carousel interactif (swipe + GIF) | WhatsApp MD récent |
| 2 | 📋 listMessage Baileys | Android + iOS |
| 3 | 📝 Texte numéroté | Tout appareil |

**Nouvelles commandes du menu :**
- `.chatbot private on/off` visible dans la catégorie IA
- `.agent group on/off` visible dans la catégorie IA
- Catégorie BOT mise à jour avec `.pair`

**Boutons carousel directs :**
- Carte ⚡ PING → exécute `.ping` directement
- Carte ⏱️ UPTIME → exécute `.alive` directement
- Carte 👑 OWNER → exécute `.owner` directement

---

### `commands/alive.js` — Statut amélioré

- Affiche l'image du bot (`assets/bot_image.jpg`) avec le statut
- Indicateur de stabilité (🔴/🟡/🟢 selon l'uptime)
- RAM utilisée / RAM totale
- Mode privé actif ou non
- Badge rôle de l'utilisateur (👑 Owner / 🛡️ Sudo)

---

### `commands/ping.js` — Ping amélioré

- Barre visuelle de latence (`▓▓▓▓▓` / `▓▓▓░░` / `▓░░░░`)
- Qualité affichée : Excellent / Bon / Lent
- Version du bot affichée

---

### `commands/info.js` — Info améliorée

- Affiche l'image du bot avec les infos
- Nombre de sudos enregistrés
- RAM + uptime
- Mode privé
- Liens canal WhatsApp et GitHub (depuis `.env`)

---

### `handler.js` — Interception carousel

Nouveau bloc ajouté pour intercepter les `quick_reply` du carousel :

```
body = "cat_ia"    → ouvre le sous-menu IA
body = "cat_media" → ouvre le sous-menu Médias
body = ".ping"     → exécute la commande ping directement
body = ".alive"    → exécute alive directement
body = ".owner"    → exécute owner directement
```

---

### `settings.js` — Settings enrichis

- `menuCarouselGifUrl` — URL du GIF carousel (depuis `.env`)
- `naturalKeywords` enrichis : `weather`, `owner` ajoutés
- `excludedFromSupremacy` : `alive` et `info` ajoutés

---

## 📋 Récapitulatif des commandes

### Nouvelles (ce sprint)
| Commande | Description |
|---|---|
| `.chatbot private on/off` | Chatbot en DM pour tout le monde |
| `.agent group on/off` | Agent accessible aux membres du groupe |
| `.pair` | Code de connexion (DM uniquement, refus propre en groupe) |

### Améliorées
| Commande | Amélioration |
|---|---|
| `.menu` | Carousel swipable + 2 fallbacks |
| `.alive` | Image + RAM totale + mode privé + badge rôle |
| `.ping` | Barre visuelle + qualité latence |
| `.info` | Image + sudos + RAM + liens |

---

## 🚀 Configuration `.env`

Ajouter dans ton `.env` :

```env
MENU_GIF_URL=https://ton-url/video.mp4   # GIF du carousel
CHANNEL_LINK=https://whatsapp.com/...    # Lien canal
GITHUB_LINK=https://github.com/...       # Lien GitHub
```

