# 👤 API Utilisateurs - Documentation Complète

Documentation détaillée des endpoints de gestion du profil utilisateur.

## Base URL
```
/api/users
```

🔒 **Toutes les routes requièrent une authentification**

---

## 📋 Profil Utilisateur

### Informations stockées
| Champ | Type | Description |
|-------|------|-------------|
| `firstName` | string | Prénom |
| `lastName` | string | Nom de famille |
| `email` | string | Email (unique, non modifiable ici) |
| `phone` | string | Téléphone (chiffré en base) |
| `profilePhoto` | string | URL de la photo de profil |
| `role` | enum | `client`, `provider`, `admin` |
| `isEmailVerified` | bool | Email vérifié via OTP |
| `isActive` | bool | Compte actif |
| `lastLogin` | date | Dernière connexion |
| `lastActivity` | date | Dernière activité |

---

## 👁️ 1. VOIR MON PROFIL

### `GET /profile` - Récupérer mon profil

**🔒 Authentification requise**

**Description :**  
Récupère toutes les informations du profil de l'utilisateur connecté.

**Ce qu'il fait :**
- Retourne les informations utilisateur
- Si prestataire : inclut le profil Provider
- Déchiffre automatiquement le téléphone

**Réponse 200 :**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "marie@example.com",
    "firstName": "Marie",
    "lastName": "Dupont",
    "phone": "+237699123456",  // Déchiffré
    "profilePhoto": "https://cloudinary.com/.../photo.jpg",
    "role": "provider",
    "isEmailVerified": true,
    "isActive": true,
    "createdAt": "2025-12-01T10:00:00Z",
    "lastLogin": "2026-01-15T18:00:00Z"
  }
}
```

**Si l'utilisateur est prestataire :**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "marie@example.com",
    "firstName": "Marie",
    "lastName": "Dupont",
    "role": "provider",
    "provider": {
      "id": "uuid",
      "businessName": "Salon Marie",
      "isVerified": true,
      "averageRating": 4.8,
      "subscription": {
        "status": "active",
        "plan": "monthly",
        "daysRemaining": 15
      }
    }
  }
}
```

---

## ✏️ 2. MODIFIER MON PROFIL

### `PUT /profile` - Mettre à jour mon profil

**🔒 Authentification requise**

**Description :**  
Met à jour les informations du profil utilisateur.

**Ce qu'il fait :**
1. Valide les données
2. Chiffre le téléphone si modifié
3. Upload la photo si fournie (vers Cloudinary)
4. Met à jour l'utilisateur

**Content-Type :** `multipart/form-data` (si photo) ou `application/json`

**Body :**
```json
{
  "firstName": "Marie-Claire",
  "lastName": "Dupont",
  "phone": "+237699999999"
}
```

**Ou avec photo :**
```
Content-Type: multipart/form-data

firstName: Marie-Claire
lastName: Dupont
profilePhoto: [fichier image]
```

**Validation :**
| Champ | Requis | Règles |
|-------|--------|--------|
| `firstName` | ❌ | 2-100 caractères, lettres uniquement |
| `lastName` | ❌ | 2-100 caractères, lettres uniquement |
| `phone` | ❌ | Format téléphone international |
| `profilePhoto` | ❌ | Image JPG/PNG, max 5MB |

**Réponse 200 :**
```json
{
  "success": true,
  "message": "Profil mis à jour avec succès",
  "user": {
    "id": "uuid",
    "firstName": "Marie-Claire",
    "lastName": "Dupont",
    "phone": "+237699999999",
    "profilePhoto": "https://cloudinary.com/.../new-photo.jpg"
  }
}
```

**⚠️ Notes importantes :**
- L'**email ne peut pas être modifié** via cet endpoint (utiliser `/auth/change-email`)
- Le **rôle ne peut pas être modifié** par l'utilisateur
- La **photo précédente** est supprimée de Cloudinary automatiquement

---

## 🔐 3. CHANGER MON MOT DE PASSE

### `PUT /password` - Modifier le mot de passe

**🔒 Authentification requise**

**Description :**  
Permet à l'utilisateur de changer son mot de passe.

**Ce qu'il fait :**
1. Vérifie le mot de passe actuel
2. Valide le nouveau mot de passe
3. Hash le nouveau mot de passe (bcrypt)
4. Invalide tous les refresh tokens (sécurité)
5. Envoie un email de notification

**Body :**
```json
{
  "currentPassword": "AncienMotDePasse123!",
  "newPassword": "NouveauMotDePasse456!",
  "confirmPassword": "NouveauMotDePasse456!"
}
```

**Validation :**
| Champ | Requis | Règles |
|-------|--------|--------|
| `currentPassword` | ✅ | Mot de passe actuel correct |
| `newPassword` | ✅ | 8-128 car., 1 maj., 1 min., 1 chiffre |
| `confirmPassword` | ✅ | Doit correspondre à newPassword |

**Réponse 200 :**
```json
{
  "success": true,
  "message": "Mot de passe modifié avec succès"
}
```

**Erreurs possibles :**
| Code | Message | Cause |
|------|---------|-------|
| 400 | Mot de passe actuel incorrect | Vérification échouée |
| 400 | Les mots de passe ne correspondent pas | confirm ≠ new |
| 400 | Mot de passe trop faible | Ne respecte pas les règles |

**⚠️ Sécurité :**  
Après changement, l'utilisateur doit se reconnecter sur tous ses appareils.

---

## ❌ 4. DÉSACTIVER MON COMPTE

### `DELETE /account` - Désactiver mon compte

**🔒 Authentification requise**

**Description :**  
Désactive le compte de l'utilisateur (soft delete).

**Ce qu'il fait :**
1. Met `isActive = false`
2. Invalide tous les tokens
3. Envoie un email de confirmation
4. **Ne supprime PAS les données** (récupération possible)

**Body (optionnel) :**
```json
{
  "password": "MotDePasse123!",  // Confirmation de sécurité
  "reason": "Je n'utilise plus la plateforme"
}
```

**Réponse 200 :**
```json
{
  "success": true,
  "message": "Compte désactivé avec succès"
}
```

**Conséquences :**
- L'utilisateur ne peut plus se connecter
- Si prestataire : le profil n'apparaît plus dans les recherches
- Les données sont conservées 30 jours avant suppression définitive
- Contacter le support pour réactiver

---

## 🎁 5. PROGRAMME DE PARRAINAGE

Chaque utilisateur reçoit automatiquement un code de parrainage à l'inscription (format `AELI-XXXXXX`). Quand quelqu'un s'inscrit en utilisant ce code, le parrain reçoit une période d'abonnement offerte (durée configurée par l'admin, 7 jours par défaut).

Le bonus est appliqué automatiquement après la vérification OTP du filleul, à condition que le parrain soit lui-même prestataire. S'il ne l'est pas, le parrainage est marqué `revoked` avec une raison claire — il pourra parrainer à nouveau plus tard.

Si le filleul ferme ou désactive son compte dans la fenêtre configurée (30 jours par défaut), le bonus du parrain est automatiquement annulé (anti-abus).

### `GET /me/referral` - Mon code et mon lien de partage

**🔒 Authentification requise**

**Description :**
Renvoie le code de parrainage de l'utilisateur connecté et une URL prête à partager.

**Réponse 200 :**
```json
{
  "success": true,
  "data": {
    "referralCode": "AELI-X7K2P9",
    "shareUrl": "https://app.aeli.cm/register?ref=AELI-X7K2P9"
  }
}
```

> L'URL est construite avec le bon domaine selon le rôle (admin → domaine admin, autres → domaine user).

### `GET /me/referrals` - Mes parrainages

**🔒 Authentification requise**

**Paramètres query :**
| Param | Type | Défaut | Description |
|-------|------|--------|-------------|
| `page` | int | 1 | Numéro de page |
| `limit` | int | 20 | Éléments par page |
| `status` | string | - | Filtre `pending`, `rewarded`, `revoked` (toute autre valeur ignorée) |

**Réponse 200 :**
```json
{
  "success": true,
  "data": {
    "referrals": [
      {
        "id": "uuid",
        "status": "rewarded",
        "codeUsed": "AELI-X7K2P9",
        "rewardDays": 7,
        "rewardedAt": "2026-05-01T10:00:00Z",
        "revokedAt": null,
        "revokedReason": null,
        "createdAt": "2026-04-28T15:30:00Z",
        "referredUser": {
          "displayName": "Marie K.",
          "isEmailVerified": true
        }
      }
    ],
    "pagination": { "currentPage": 1, "totalItems": 1, "itemsPerPage": 20 }
  }
}
```

> Le nom du filleul est masqué en `Prénom I.` (RGPD-friendly). Ni l'email ni le téléphone du filleul ne sont exposés.

### `GET /me/referrals/stats` - Statistiques de mes parrainages

**🔒 Authentification requise**

**Réponse 200 :**
```json
{
  "success": true,
  "data": {
    "stats": {
      "total": 6,
      "pending": 2,
      "rewarded": 3,
      "revoked": 1,
      "totalDaysEarned": 28
    }
  }
}
```

> `totalDaysEarned` est la somme des `rewardDays` des parrainages `rewarded` (ne déduit pas les éventuels rollbacks ultérieurs qui sont déjà reflétés par le passage de `rewarded` à `revoked`).

---

## 🎨 Formulaires Frontend Suggérés

### Formulaire Profil
```html
<form id="profile-form" enctype="multipart/form-data">
  <div class="photo-section">
    <img id="profile-preview" src="current-photo.jpg" />
    <input type="file" name="profilePhoto" accept="image/*" />
    <button type="button">Changer la photo</button>
  </div>
  
  <div class="form-group">
    <label>Prénom</label>
    <input type="text" name="firstName" value="Marie" />
  </div>
  
  <div class="form-group">
    <label>Nom</label>
    <input type="text" name="lastName" value="Dupont" />
  </div>
  
  <div class="form-group">
    <label>Téléphone</label>
    <input type="tel" name="phone" value="+237699123456" />
  </div>
  
  <div class="form-group">
    <label>Email</label>
    <input type="email" value="marie@example.com" disabled />
    <small>Pour changer d'email, utilisez les paramètres de sécurité</small>
  </div>
  
  <button type="submit">Enregistrer</button>
</form>
```

### Formulaire Changement Mot de Passe
```html
<form id="password-form">
  <div class="form-group">
    <label>Mot de passe actuel</label>
    <input type="password" name="currentPassword" required />
  </div>
  
  <div class="form-group">
    <label>Nouveau mot de passe</label>
    <input type="password" name="newPassword" required />
    <small>8 caractères min., 1 majuscule, 1 minuscule, 1 chiffre</small>
  </div>
  
  <div class="form-group">
    <label>Confirmer le nouveau mot de passe</label>
    <input type="password" name="confirmPassword" required />
  </div>
  
  <button type="submit">Changer le mot de passe</button>
</form>
```

### Validation côté client
```javascript
const validatePassword = (password) => {
  const rules = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password)
  };
  
  const isValid = Object.values(rules).every(Boolean);
  
  return { isValid, rules };
};

// Afficher les règles en temps réel
passwordInput.addEventListener('input', (e) => {
  const { rules } = validatePassword(e.target.value);
  
  Object.entries(rules).forEach(([rule, passed]) => {
    const indicator = document.querySelector(`[data-rule="${rule}"]`);
    indicator.classList.toggle('valid', passed);
  });
});
```

---

## 🔄 Cycle de Vie du Compte

```
┌─────────────────────────────────────────────────────────────────┐
│                  CYCLE DE VIE DU COMPTE                          │
└─────────────────────────────────────────────────────────────────┘

  ┌─────────────┐      ┌─────────────┐      ┌─────────────┐
  │  REGISTER   │ ───► │   VERIFY    │ ───► │   ACTIVE    │
  │             │      │   (OTP)     │      │             │
  └─────────────┘      └─────────────┘      └──────┬──────┘
                                                   │
                    ┌──────────────────────────────┼──────────┐
                    │                              │          │
                    ▼                              ▼          ▼
             ┌─────────────┐              ┌─────────────┐ ┌─────────┐
             │   LOCKED    │              │  INACTIVE   │ │ PROVIDER│
             │(5 bad logins)│              │(self deact) │ │(applied)│
             └──────┬──────┘              └─────────────┘ └─────────┘
                    │
                    │ 30 min timeout
                    ▼
             ┌─────────────┐
             │   ACTIVE    │
             └─────────────┘
```

---

## 🚨 Codes d'erreur

| Code | Situation |
|------|-----------|
| 400 | Données invalides, mot de passe incorrect |
| 401 | Non authentifié |
| 413 | Photo trop volumineuse (> 5MB) |

---

## 🔄 WORKFLOWS VISUELS

### Page "Mon Profil" (Client/Prestataire)
```
┌─────────────────────────────────────────────────────────────────┐
│                    MON PROFIL                                    │
│                    GET/PUT /api/users/profile                    │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  👤 Mon Profil                                                   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                                                              ││
│  │        ┌───────────────────┐                                ││
│  │        │                   │                                ││
│  │        │    [📸 Photo]     │  [Changer la photo]            ││
│  │        │                   │                                ││
│  │        │    Marie D.       │                                ││
│  │        └───────────────────┘                                ││
│  │                                                              ││
│  │  ┌───────────────────────────────────────────────────────┐  ││
│  │  │ Prénom:    [Marie-Claire_________________________]   │  ││
│  │  └───────────────────────────────────────────────────────┘  ││
│  │                                                              ││
│  │  ┌───────────────────────────────────────────────────────┐  ││
│  │  │ Nom:       [Dupont______________________________]    │  ││
│  │  └───────────────────────────────────────────────────────┘  ││
│  │                                                              ││
│  │  ┌───────────────────────────────────────────────────────┐  ││
│  │  │ Téléphone: [+237 699 123 456___________________]     │  ││
│  │  └───────────────────────────────────────────────────────┘  ││
│  │                                                              ││
│  │  ┌───────────────────────────────────────────────────────┐  ││
│  │  │ Email:     marie@example.com                   🔒     │  ││
│  │  │            (non modifiable - Paramètres sécurité)     │  ││
│  │  └───────────────────────────────────────────────────────┘  ││
│  │                                                              ││
│  │  [Enregistrer les modifications]                            ││
│  │                                                              ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  🔒 Sécurité                                                    │
│  ├── [Changer mon mot de passe →]                               │
│  └── [Désactiver mon compte →]                                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

### Formulaire Changement Mot de Passe
```
┌─────────────────────────────────────────────────────────────────┐
│                    CHANGER MON MOT DE PASSE                      │
│                    PUT /api/users/password                       │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  🔐 Changer mon mot de passe                                    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                                                              ││
│  │  Mot de passe actuel:                                       ││
│  │  [••••••••••••••••••]                                       ││
│  │                                                              ││
│  │  Nouveau mot de passe:                                      ││
│  │  [NouveauMotDePasse456!]                                    ││
│  │                                                              ││
│  │  Règles du mot de passe:                                    ││
│  │  ✅ Au moins 8 caractères                                   ││
│  │  ✅ Une lettre majuscule                                    ││
│  │  ✅ Une lettre minuscule                                    ││
│  │  ✅ Un chiffre                                              ││
│  │                                                              ││
│  │  Confirmer le nouveau mot de passe:                         ││
│  │  [NouveauMotDePasse456!]                                    ││
│  │  ✅ Les mots de passe correspondent                         ││
│  │                                                              ││
│  │  [Changer mon mot de passe]                                 ││
│  │                                                              ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
    │
    ▼
PUT /api/users/password
{
  currentPassword: "AncienMotDePasse123!",
  newPassword: "NouveauMotDePasse456!",
  confirmPassword: "NouveauMotDePasse456!"
}
    │
    ├── Vérification mot de passe actuel (bcrypt.compare)
    ├── Hash nouveau mot de passe (bcrypt.hash)
    ├── Invalidation tous les refresh tokens
    └── Email notification "Mot de passe modifié"
    │
    ▼
┌─────────────────────────────────────────────────────────────────┐
│  ✅ Mot de passe modifié avec succès !                          │
│                                                                  │
│  Vous allez être déconnecté de tous vos appareils.             │
│  Reconnectez-vous avec votre nouveau mot de passe.             │
│                                                                  │
│  [Se reconnecter]                                               │
└─────────────────────────────────────────────────────────────────┘
```

---

### Upload Photo de Profil
```
┌─────────────────────────────────────────────────────────────────┐
│                    UPLOAD PHOTO PROFIL                           │
│                    PUT /api/users/profile (multipart/form-data)  │
└─────────────────────────────────────────────────────────────────┘

[Clic sur "Changer la photo"]
    │
    ▼
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│  📸 Changer ma photo de profil                                  │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                                                              ││
│  │  ┌───────────────────────┐   ┌───────────────────────┐      ││
│  │  │                       │   │                       │      ││
│  │  │   [ Photo actuelle ]  │ → │   [ Aperçu nouvelle ] │      ││
│  │  │                       │   │                       │      ││
│  │  └───────────────────────┘   └───────────────────────┘      ││
│  │                                                              ││
│  │  [Choisir un fichier]  nouvelle_photo.jpg                   ││
│  │                                                              ││
│  │  ⚠️ Format accepté: JPG, PNG                                ││
│  │  ⚠️ Taille max: 5 MB                                        ││
│  │                                                              ││
│  │  [Annuler]   [Sauvegarder]                                  ││
│  │                                                              ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
    │
    ▼
PUT /api/users/profile
Content-Type: multipart/form-data
    │
    ├── Upload vers Cloudinary
    ├── Suppression ancienne photo (si existante)
    └── Update user.profilePhoto = nouvelle_url
    │
    ▼
┌─────────────────────────────────────────────────────────────────┐
│  ✅ Photo mise à jour !                                          │
│                                                                  │
│  [Voir mon profil]                                              │
└─────────────────────────────────────────────────────────────────┘
```

---

### Désactivation de Compte
```
┌─────────────────────────────────────────────────────────────────┐
│                    DÉSACTIVER MON COMPTE                         │
│                    DELETE /api/users/account                     │
└─────────────────────────────────────────────────────────────────┘

[Clic sur "Désactiver mon compte"]
    │
    ▼
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│  ⚠️ Désactiver mon compte                                       │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                                                              ││
│  │  Êtes-vous sûr de vouloir désactiver votre compte ?        ││
│  │                                                              ││
│  │  ⚠️ Votre profil ne sera plus visible                       ││
│  │  ⚠️ Vous ne pourrez plus vous connecter                     ││
│  │  ⚠️ Vos données seront conservées 30 jours                  ││
│  │                                                              ││
│  │  Pour réactiver votre compte, contactez le support.         ││
│  │                                                              ││
│  │  Raison (optionnel):                                        ││
│  │  [Je n'utilise plus la plateforme___________________]       ││
│  │                                                              ││
│  │  Confirmez avec votre mot de passe:                         ││
│  │  [••••••••••••••••••]                                       ││
│  │                                                              ││
│  │  [Annuler]   [Désactiver définitivement]                    ││
│  │                                                              ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
    │
    ▼
DELETE /api/users/account
{
  password: "MonMotDePasse123!",
  reason: "Je n'utilise plus la plateforme"
}
    │
    ├── Vérification mot de passe
    ├── user.isActive = false
    ├── Invalidation tous les tokens
    └── Email "Compte désactivé"
    │
    ▼
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│  ✅ Compte désactivé                                             │
│                                                                  │
│  Votre compte a été désactivé avec succès.                      │
│                                                                  │
│  Vos données seront supprimées dans 30 jours.                   │
│  Pour réactiver, contactez support@aeli.cm                      │
│                                                                  │
│  [Retour à l'accueil]                                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

### Profil Prestataire (Vue étendue)
```
┌─────────────────────────────────────────────────────────────────┐
│                    PROFIL PRESTATAIRE                            │
│                    GET /api/users/profile (role: provider)       │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  👤 Mon Profil                                                   │
│                                                                  │
│  ┌──────────── INFORMATIONS PERSONNELLES ──────────────────────┐│
│  │                                                              ││
│  │  [📸] Marie Dupont                                          ││
│  │  marie@example.com                                          ││
│  │  +237 699 123 456                                           ││
│  │                                                              ││
│  │  [Modifier mes informations →]                              ││
│  │                                                              ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ┌──────────── MON ACTIVITÉ PRESTATAIRE ───────────────────────┐│
│  │                                                              ││
│  │  🏪 Salon Marie                                             ││
│  │  ✅ Profil vérifié                                          ││
│  │                                                              ││
│  │  ⭐ 4.8/5 (25 avis)                                         ││
│  │  📩 45 contacts reçus                                       ││
│  │  👁️ 1 234 vues ce mois                                      ││
│  │                                                              ││
│  │  [Gérer mon profil prestataire →]                           ││
│  │                                                              ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ┌──────────── ABONNEMENT ─────────────────────────────────────┐│
│  │                                                              ││
│  │  💎 ACTIF - Plan Mensuel                                    ││
│  │  Expire dans 15 jours                                       ││
│  │                                                              ││
│  │  [Gérer mon abonnement →]                                   ││
│  │                                                              ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```
