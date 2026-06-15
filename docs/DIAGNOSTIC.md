# 🔍 DIAGNOSTIC ZERO TRACE BOT v5.0

## ✅ Ce qui fonctionne bien

| Élément | Statut | Notes |
|---|---|---|
| Baileys `@whiskeysockets/baileys` v6.7.9 | ✅ OK | Version stable récente |
| Connexion par pairing code | ✅ OK | `PAIRING_NUMBER` dans `.env` |
| Handler principal | ✅ OK | 871 lignes, bien structuré |
| Système de commandes | ✅ OK | ~150 commandes enregistrées |
| Anti-ban module | ✅ OK | Rate limit messages bot, typing, retry |
| Mode privé | ✅ OK | Exceptions `.pair` + chatbot DM |
| Chatbot IA | ✅ OK | OpenRouter + Groq + DM support |
| Agent IA | ✅ OK | Mode groupe public ajouté |
| Menu carousel | ✅ OK | 3 fallbacks (carousel→list→texte) |
| Antilink / Antibadword | ✅ OK | |
| Antiraid | ✅ OK | Verrouille le groupe si raid |
| Antidelete | ✅ OK | Cache les messages supprimés |
| TicTacToe | ✅ OK | Jeu interactif |
| AFK | ✅ OK | Statut absent automatique |

---

## ⚠️ Problèmes détectés et corrigés

### 1. Reconnexion trop agressive (`connect.js`)
**Problème :** Quand `reason === 'unknown'`, le bot appelait `process.exit(1)` au lieu de se reconnecter.  
**Correction :** Logique de reconnexion à 4 niveaux :
- `loggedOut / badSession` → supprime session + arrêt
- `conflict (440)` → attente 15s (conflit multi-appareil)
- `restartRequired` → reconnexion rapide 3s
- **Autre** → backoff exponentiel (5s → 10s → 15s → max 30s)

### 2. `syncFullHistory: true` (connect.js)
**Problème :** `syncFullHistory: true` ralentit énormément le démarrage (télécharge tout l'historique WA).  
**Correction :** Mis à `false` → connexion 3x plus rapide.

### 3. `keepAliveIntervalMs` trop court
**Problème :** 10 secondes = trop fréquent, peut déclencher des ban WhatsApp.  
**Correction :** Mis à `25000` (25s) = valeur recommandée Baileys.

### 4. Nouvelles commandes non enregistrées dans COMMANDS
**Problème :** `soundcloud`, `capcut`, `imgsearch`, `resize` avaient leurs fichiers mais n'étaient pas dans le registre du handler.  
**Correction :** Ajoutés avec tous leurs alias dans `COMMANDS`.

---

## 🆕 Système Rate Limit (NOUVEAU)

### Fonctionnement
```
Utilisateur → commande
    ↓
checkRateLimit(sender, cmdKey)
    ↓ allowed?
   OUI → exécuter normalement
   NON (première fois) → envoyer message d'avertissement
   NON (2e fois+) → ignorer silencieusement
    ↓
Après 30s → fenêtre reset automatiquement
```

### Configuration (`.env`)
```env
RATELIMIT_ENABLED=true       # Activer/désactiver
RATELIMIT_MAX=2               # 2 commandes max par fenêtre
RATELIMIT_WINDOW_MS=30000     # Fenêtre de 30 secondes
# Pour 1 minute : RATELIMIT_WINDOW_MS=60000
```

### Message reçu par l'utilisateur (1 seule fois par blocage)
```
⏳ Ralentis-toi !

Tu as utilisé 2 commandes en 30s.

🚫 Commande .tiktok bloquée temporairement.

⏱️ Réessaie dans : 22 secondes
[▓▓▓░░░░░░░]

💡 Tu peux envoyer max 2 commandes toutes les 30 secondes.
```

### Exemptions (pas de limite)
- Owner et Sudos : **jamais limités**
- Commandes : `ping`, `alive`, `help`, `menu`, `pair`, `info`, `myid`

### Commandes de gestion (owner)
| Commande | Description |
|---|---|
| `.rlstatus` | Voir config + stats (utilisateurs actifs, bloqués) |
| `.rlreset @user` | Débloquer quelqu'un immédiatement |
| `.rlreset 22656354706` | Débloquer par numéro |

---

## 📋 Résumé des fichiers modifiés/créés

| Fichier | Action | Description |
|---|---|---|
| `lib/ratelimit.js` | 🆕 Créé | Module rate limiter complet |
| `commands/ratelimit_cmd.js` | 🆕 Créé | Commandes `.rlstatus`, `.rlreset` |
| `handler.js` | 🔧 Modifié | Import + injection rate limit + nouveaux COMMANDS |
| `connect.js` | 🔧 Corrigé | Reconnexion, syncFullHistory, keepAlive |

