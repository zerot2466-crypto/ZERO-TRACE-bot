# ZERO TRACE BOT v5.0 — Modifications appliquées

## 📦 Fichiers modifiés

### 1. `commands/pair.js` — Commande `.pair` corrigée

**Problème résolu :** La commande `.pair` bloquait les tentatives depuis un groupe
sans explication claire.

**Changements :**
- ✅ Refus propre en groupe avec message explicatif (redirige vers DM)
- ✅ Cooldown augmenté à 3 minutes (anti-spam plus robuste)
- ✅ Messages d'erreur plus clairs (déjà connecté, session expirée, rate limit)
- ✅ L'owner peut générer un code pour n'importe quel numéro depuis n'importe où

**Utilisation :**
```
.pair              → DM uniquement, génère ton code (ton numéro auto-détecté)
.pair 22656354706  → Owner : génère pour ce numéro
```

---

### 2. `commands/chatbot.js` — Chatbot IA v3 (DM privé)

**Problème résolu :** Le chatbot ne fonctionnait qu'en groupe.

**Nouvelles fonctionnalités :**
- ✅ `.chatbot private on` — Active le chatbot en DM (répond à TOUS ceux qui écrivent)
- ✅ `.chatbot private off` — Désactive le mode DM
- ✅ Mot-clé `"zero trace activé"` — N'importe qui peut activer le chatbot dans son DM
- ✅ Mot-clé `"zero trace désactivé"` — Désactiver depuis un DM
- ✅ Détection intent menu dans les conversations DM
- ✅ Persistance via `data/chatbot_private.json`

**Utilisation :**
```
.chatbot private on    → Active le chatbot pour tous les DM
.chatbot private off   → Désactive
.chatbot on            → Active dans ce groupe (inchangé)
.chatbot private status → Voir l'état
```
Une personne en DM peut aussi écrire :
```
zero trace activé    → Active le chatbot dans sa conversation
zero trace désactivé → Désactive
```

---

### 3. `commands/agent.js` — Agent IA v2 (mode groupe public)

**Problème résolu :** L'agent n'était utilisable qu'en DM par owner/sudo.

**Nouvelles fonctionnalités :**
- ✅ `.agent group on` — Ouvre l'agent à TOUS les membres du groupe
- ✅ `.agent group off` — Revient au mode privé (owner/sudo seulement)
- ✅ Sécurité maintenue : l'exécution de commandes reste réservée owner/sudo
- ✅ En mode public, l'agent répond uniquement aux messages contenant "zero trace"
- ✅ Contexte groupe injecté dans le prompt (nom du groupe, utilisateur)

**Utilisation :**
```
.agent on              → Activer l'agent dans ce chat
.agent off             → Désactiver
.agent group on        → Ouvrir aux membres du groupe
.agent group off       → Fermer aux membres
.agent status          → Voir l'état complet
```
En mode groupe public, les membres écrivent :
```
zero trace c'est quoi la météo à Paris ?
zero trace blague svp
```

---

### 4. `handler.js` — Corrections du gestionnaire principal

**Corrections :**
- ✅ Mode privé : ne bloque plus les DM quand le chatbot privé est actif
- ✅ Filtre `fromMe` : exception ajoutée pour le chatbot privé côté owner
- ✅ `.pair` toujours accessible même en mode privé (déjà présent, conservé)

---

## 🚀 Résumé des commandes ajoutées/modifiées

| Commande | Nouveauté |
|---|---|
| `.pair` | Refus propre en groupe, meilleurs messages d'erreur |
| `.chatbot private on/off` | Chatbot en DM pour tout le monde |
| `.chatbot private status` | Voir l'état du chatbot DM |
| `.agent group on/off` | Agent accessible aux membres du groupe |
| `.agent status` | Affiche aussi l'état du mode groupe |
| `"zero trace activé"` | Mot-clé pour activer chatbot depuis DM |
| `"zero trace désactivé"` | Mot-clé pour désactiver depuis DM |

