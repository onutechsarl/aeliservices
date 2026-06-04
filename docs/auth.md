# 🔐 API Authentification - Documentation Complète

Documentation détaillée de tous les endpoints d'authentification.

## Base URL
```
/api/auth
```

---

## 📝 1. INSCRIPTION

### `POST /register` - Créer un compte

**Description :**  
Crée un nouveau compte utilisateur. Par défaut, tous les utilisateurs sont créés avec le rôle `client`. Pour devenir prestataire, l'utilisateur devra ensuite faire une candidature (`POST /api/providers/apply`).

**Ce qu'il fait :**
1. Vérifie que l'email n'existe pas déjà
2. Hash le mot de passe avec bcrypt (10 rounds)
3. Génère un code OTP à 6 chiffres
4. Envoie l'OTP par email
5. Crée l'utilisateur avec `isEmailVerified = false`

**Rate Limiting :** aucune limite spécifique sur cette route (le rate limit global de l'API s'applique).

**Body :**
```json
{
  "email": "marie@example.com",
  "password": "SecurePass123!",
  "confirmPassword": "SecurePass123!",
  "firstName": "Marie",
  "lastName": "Dupont",
  "phone": "+237699123456",  // Optionnel
  "country": "Cameroun",      // Optionnel, défaut: Cameroun
  "gender": "female",         // Optionnel: male, female, other, prefer_not_to_say
  "referralCode": "AELI-X7K2P9" // Optionnel — code de parrainage d'un autre user
}
```

**Validation :**
- `email` : format email valide, unique
- `password` : min 8 caractères, 1 majuscule, 1 minuscule, 1 chiffre
- `confirmPassword` : requis, doit correspondre au `password`
- `firstName`, `lastName` : 2-100 caractères
- `country` : optionnel, 2-100 caractères
- `gender` : optionnel, valeurs acceptées: `male`, `female`, `other`, `prefer_not_to_say`
- `referralCode` : optionnel, string ≤ 40 caractères. Normalisé en majuscules. Un code inconnu n'empêche pas l'inscription, le champ `referralAccepted` indique simplement `false` dans la réponse.

**Réponse 201 :**
```json
{
  "success": true,
  "message": "Inscription réussie. Vérifiez votre email.",
  "user": {
    "id": "uuid",
    "email": "marie@example.com",
    "firstName": "Marie",
    "lastName": "Dupont",
    "role": "client",
    "profilePhoto": null,
    "isEmailVerified": false
  },
  "requiresOTP": true,
  "referralAccepted": true
}
```

**À propos du parrainage :**
- Si `referralCode` correspond à un utilisateur actif, un enregistrement `Referral` est créé en statut `pending`.
- Le bonus est appliqué automatiquement au parrain quand le filleul vérifie son email via l'OTP (réglage par défaut, modifiable depuis le dashboard admin).
- Le filleul ne reçoit rien (v1 du programme).

**⚠️ Important :**  
L'utilisateur ne peut PAS se connecter tant qu'il n'a pas vérifié son email avec l'OTP.

---

## ✅ 2. VÉRIFICATION EMAIL (OTP)

### `POST /verify-otp` - Vérifier le code OTP

**Description :**  
Valide le code OTP envoyé par email lors de l'inscription.

**Ce qu'il fait :**
1. Vérifie que l'OTP correspond et n'est pas expiré (10 min)
2. Vérifie le nombre de tentatives (max 3)
3. Si valide : `isEmailVerified = true`
4. Génère les tokens (access + refresh)
5. Envoie un email de bienvenue

**Rate Limiting :** 5 requêtes / 5 min par IP

**Body :**
```json
{
  "email": "marie@example.com",
  "otp": "123456"
}
```

**Réponse 200 :**
```json
{
  "success": true,
  "message": "Email vérifié avec succès",
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "user": {
    "id": "uuid",
    "email": "marie@example.com",
    "role": "client",
    "profilePhoto": null,
    "isEmailVerified": true
  }
}
```

**Erreurs possibles :**
- `400` : OTP invalide ou expiré
- `400` : Trop de tentatives (compte temporairement bloqué)

---

### `POST /resend-otp` - Renvoyer le code OTP

**Description :**  
Génère et envoie un nouveau code OTP si l'utilisateur n'a pas reçu le premier.

**Ce qu'il fait :**
1. Vérifie que l'utilisateur existe et n'est pas déjà vérifié
2. Génère un nouveau code OTP
3. Réinitialise le compteur de tentatives
4. Envoie l'email

**Rate Limiting :** 3 requêtes / 15 min par email

**Body :**
```json
{
  "email": "marie@example.com"
}
```

---

## 🔑 3. CONNEXION

### `POST /login` - Se connecter

**Description :**  
Authentifie un utilisateur et retourne les tokens JWT.

**Ce qu'il fait :**
1. Vérifie que le compte n'est pas verrouillé
2. Vérifie email + password
3. Vérifie que l'email est vérifié
4. Vérifie que le compte est actif
5. Génère access token (15 min) + refresh token (7 jours)
6. Enregistre le refresh token en base
7. Met à jour `lastLogin` et `lastActivity`
8. Log l'événement de sécurité

**Rate Limiting :** 5 requêtes / 15 min par IP

**Body :**
```json
{
  "email": "marie@example.com",
  "password": "SecurePass123!"
}
```

**Réponse 200 :**
```json
{
  "success": true,
  "message": "Connexion réussie",
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "expiresIn": 900,  // 15 minutes
  "user": {
    "id": "uuid",
    "email": "marie@example.com",
    "firstName": "Marie",
    "lastName": "Dupont",
    "role": "client",
    "profilePhoto": "https://cloudinary.com/.../photo.jpg",
    "isEmailVerified": true
  }
}
```

**Mécanisme de verrouillage :**
- 5 tentatives échouées → compte verrouillé 30 minutes
- Une connexion réussie réinitialise le compteur

**Erreurs possibles :**
| Code | Message | Cause |
|------|---------|-------|
| 401 | Identifiants incorrects | Email ou mot de passe invalide |
| 403 | Email non vérifié | Doit faire verify-otp d'abord |
| 403 | Compte désactivé | Admin a désactivé le compte |
| 429 | Compte verrouillé | Trop de tentatives échouées |

---

## 🔄 4. REFRESH TOKEN

### `POST /refresh-token` - Renouveler l'access token

**Description :**  
Génère un nouveau access token à partir d'un refresh token valide. Permet de maintenir la session sans redemander le mot de passe.

**Ce qu'il fait :**
1. Vérifie que le refresh token existe en base
2. Vérifie qu'il n'est pas expiré
3. Génère un nouvel access token
4. ⚠️ Génère aussi un nouveau refresh token (rotation)
5. Invalide l'ancien refresh token

**Body :**
```json
{
  "refreshToken": "eyJhbGc..."
}
```

**Réponse 200 :**
```json
{
  "success": true,
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",  // Nouveau !
  "expiresIn": 900
}
```

**Frontend - Implémentation recommandée :**
```javascript
// Intercepteur Axios
axios.interceptors.response.use(
  response => response,
  async error => {
    if (error.response.status === 401 && !error.config._retry) {
      error.config._retry = true;
      const { accessToken, refreshToken } = await refreshTokenAPI();
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      error.config.headers.Authorization = `Bearer ${accessToken}`;
      return axios(error.config);
    }
    return Promise.reject(error);
  }
);
```

---

## 🚪 5. DÉCONNEXION

### `POST /logout` - Déconnexion simple

**Description :**  
Invalide le refresh token actuel. L'access token reste valide jusqu'à expiration (15 min max).

**Ce qu'il fait :**
1. Supprime le refresh token de la base
2. Log l'événement de sécurité

**Headers requis :**
```
Authorization: Bearer <accessToken>
```

**Body (optionnel) :**
```json
{
  "refreshToken": "eyJhbGc..."  // Pour invalider un token spécifique
}
```

---

### `POST /logout-all` - Déconnexion de tous les appareils

**Description :**  
Invalide TOUS les refresh tokens de l'utilisateur. Utile en cas de compromission du compte.

**Ce qu'il fait :**
1. Supprime tous les refresh tokens de l'utilisateur
2. L'utilisateur devra se reconnecter sur tous ses appareils

---

## 🔓 6. MOT DE PASSE OUBLIÉ

### `POST /forgot-password` - Demander réinitialisation

**Description :**  
Envoie un email avec un lien de réinitialisation du mot de passe.

**Ce qu'il fait :**
1. Génère un token sécurisé (hash SHA-256)
2. Stocke le token avec expiration (1 heure)
3. Envoie un email avec le lien

**Rate Limiting :** 3 requêtes / heure par email

**Body :**
```json
{
  "email": "marie@example.com"
}
```

**Réponse 200 :**
```json
{
  "success": true,
  "message": "Email de réinitialisation envoyé"
}
```

**⚠️ Sécurité :**  
Retourne toujours 200 même si l'email n'existe pas (évite l'énumération).

---

### `POST /reset-password/:token` - Réinitialiser le mot de passe

**Description :**  
Définit un nouveau mot de passe via le token reçu par email.

**Ce qu'il fait :**
1. Vérifie que le token est valide et non expiré
2. Hash le nouveau mot de passe
3. Efface le token de réinitialisation
4. Invalide tous les refresh tokens (force reconnexion)
5. Envoie un email de confirmation

**Body :**
```json
{
  "password": "NewSecurePass456!"
}
```

**Validation :**
- Min 8 caractères
- Au moins 1 majuscule, 1 minuscule, 1 chiffre

---

## 👤 7. PROFIL UTILISATEUR

### `GET /me` - Récupérer mon profil

**Description :**  
Retourne les informations de l'utilisateur connecté.

**Ce qu'il fait :**
- Récupère l'utilisateur depuis le token
- Si prestataire : inclut les infos du profil Provider
- Met à jour `lastActivity`

**Headers requis :**
```
Authorization: Bearer <accessToken>
```

**Réponse 200 :**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "marie@example.com",
    "firstName": "Marie",
    "lastName": "Dupont",
    "phone": "+237699123456",
    "role": "provider",
    "profilePhoto": "https://cloudinary.com/.../photo.jpg",
    "isEmailVerified": true,
    "provider": {  // Si role = provider
      "id": "uuid",
      "businessName": "Salon Marie",
      "isVerified": true,
      "subscription": {
        "status": "active",
        "plan": "monthly",
        "endDate": "2026-02-15"
      }
    }
  }
}
```

---

## 🔒 Tokens JWT

### Access Token
- **Durée :** 15 minutes
- **Payload :** `{ id, email, role, iat, exp }`
- **Usage :** Header `Authorization: Bearer <token>`

### Refresh Token
- **Durée :** 7 jours
- **Stockage :** En base de données (table RefreshToken)
- **Rotation :** Nouveau token généré à chaque refresh

---

##  Gestion des erreurs

| Code | Situation |
|------|-----------|
| 400 | Données invalides, OTP expiré |
| 401 | Token invalide/expiré, mauvais credentials |
| 403 | Email non vérifié, compte désactivé |
| 429 | Rate limit atteint, compte verrouillé |
| 500 | Erreur serveur |

---

## 📱 Recommandations Frontend

### Stockage des tokens
```javascript
// Stocker en localStorage ou SecureStore (mobile)
localStorage.setItem('accessToken', response.accessToken);
localStorage.setItem('refreshToken', response.refreshToken);
```

### Vérifier l'authentification
```javascript
const isAuthenticated = () => {
  const token = localStorage.getItem('accessToken');
  if (!token) return false;
  
  // Décoder et vérifier expiration
  const payload = JSON.parse(atob(token.split('.')[1]));
  return payload.exp * 1000 > Date.now();
};
```

### Flow d'inscription
```
1. POST /register → Afficher "Vérifiez votre email"
2. Utilisateur entre OTP
3. POST /verify-otp → Tokens reçus → Rediriger vers dashboard
```

### Flow de connexion
```
1. POST /login → Tokens reçus
2. Stocker tokens
3. Rediriger vers dashboard
4. Si 403 "Email non vérifié" → Afficher écran OTP
```

---

## 🔄 WORKFLOWS VISUELS

### Workflow Inscription Complète
```
┌─────────────────────────────────────────────────────────────────┐
│                      INSCRIPTION                                 │
└─────────────────────────────────────────────────────────────────┘

[Client] Formulaire inscription
    │
    ▼
POST /api/auth/register
    │
    ├── Validation (email, password, nom...)
    │
    ▼
┌─────────────────────┐
│ User créé           │
│ isEmailVerified:false│
│ OTP généré (6 digits)│
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│ 📧 Email envoyé     │
│ "Votre code OTP:    │
│  123456"            │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    PAGE VÉRIFICATION OTP                         │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │          Vérifiez votre email                               ││
│  │                                                              ││
│  │  Un code a été envoyé à marie@example.com                   ││
│  │                                                              ││
│  │  ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐                       ││
│  │  │ 1 │ │ 2 │ │ 3 │ │ 4 │ │ 5 │ │ 6 │                       ││
│  │  └───┘ └───┘ └───┘ └───┘ └───┘ └───┘                       ││
│  │                                                              ││
│  │  [Vérifier]         Renvoyer le code                        ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
          │
          ▼
POST /api/auth/verify-otp { email, otp: "123456" }
          │
    ┌─────┴─────┐
    │           │
    ▼           ▼
[OTP OK]    [OTP KO]
    │           │
    │           └──► Erreur: "Code invalide" (max 3 essais)
    │                    │
    │                    └──► POST /resend-otp (nouveau code)
    │
    ▼
┌─────────────────────┐
│ isEmailVerified:true│
│ Access Token généré │
│ Refresh Token généré│
│ 📧 Email bienvenue  │
└─────────┬───────────┘
          │
          ▼
    ✅ Redirection vers Dashboard
       Utilisateur connecté !
```

---

### Workflow Connexion
```
┌─────────────────────────────────────────────────────────────────┐
│                      CONNEXION                                   │
└─────────────────────────────────────────────────────────────────┘

[Client] Formulaire login
    │
    ▼
POST /api/auth/login { email, password }
    │
    ▼
┌─────────────────────┐
│ Vérifications:      │
│ 1. Compte verrouillé?│
│ 2. Email existe?    │
│ 3. Password correct?│
│ 4. Email vérifié?   │
│ 5. Compte actif?    │
└─────────┬───────────┘
          │
    ┌─────┴──────────────────────────────────────┐
    │                    │                        │
    ▼                    ▼                        ▼
[Succès]           [Password KO]            [Compte locked]
    │                    │                        │
    │                    ▼                        ▼
    │           failedLoginAttempts++      429 "Compte verrouillé"
    │                    │                  Attendre 30 min
    │                    │
    │              ┌─────┴─────┐
    │              │           │
    │              ▼           ▼
    │         [< 5 fois]  [≥ 5 fois]
    │              │           │
    │              │           ▼
    │              │     ┌─────────────────┐
    │              │     │ Compte VERROUILLÉ│
    │              │     │ isAccountLocked │
    │              │     │ = true          │
    │              │     │ Durée: 30 min   │
    │              │     └─────────────────┘
    │              │
    │              ▼
    │         401 "Identifiants incorrects"
    │
    ▼
┌─────────────────────┐
│ Access Token (15min)│
│ Refresh Token (7j)  │
│ lastLogin = now()   │
│ failedAttempts = 0  │
│ SecurityLog(SUCCESS)│
└─────────┬───────────┘
          │
          ▼
    ✅ 200 OK + tokens
       Redirection dashboard
```

---

### Workflow Refresh Token
```
┌─────────────────────────────────────────────────────────────────┐
│                    REFRESH TOKEN                                 │
└─────────────────────────────────────────────────────────────────┘

[Client] Access token expiré (15 min)
    │
    ▼
401 Unauthorized sur une requête API
    │
    ▼
POST /api/auth/refresh-token { refreshToken }
    │
    ▼
┌─────────────────────┐
│ Vérifications:      │
│ 1. Token existe?    │
│ 2. Token expiré?    │
│ 3. User actif?      │
└─────────┬───────────┘
          │
    ┌─────┴─────┐
    │           │
    ▼           ▼
[VALIDE]    [INVALIDE]
    │           │
    │           └──► 401 "Session expirée"
    │                    │
    │                    └──► Redirection page login
    │
    ▼
┌─────────────────────┐
│ Ancien refresh      │
│ token INVALIDÉ      │
│ ───────────────     │
│ Nouveau access token│
│ Nouveau refresh token│ ◄── TOKEN ROTATION
└─────────┬───────────┘
          │
          ▼
    ✅ Tokens reçus
       Répéter requête initiale
```

---

### Workflow Mot de Passe Oublié
```
┌─────────────────────────────────────────────────────────────────┐
│                    MOT DE PASSE OUBLIÉ                           │
└─────────────────────────────────────────────────────────────────┘

[Client] Clic "Mot de passe oublié"
    │
    ▼
┌─────────────────────────────────────────────────────────────────┐
│  ┌─────────────────────────────────────────────────────────────┐│
│  │        Réinitialiser votre mot de passe                     ││
│  │                                                              ││
│  │  Email: [___________________________]                       ││
│  │                                                              ││
│  │  [Envoyer le lien de réinitialisation]                      ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
    │
    ▼
POST /api/auth/forgot-password { email }
    │
    ▼
┌─────────────────────┐
│ Token généré        │
│ (SHA-256, 1h)       │
│ Stocké en base      │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│ 📧 Email envoyé:    │
│ "Cliquez sur ce lien│
│  pour réinitialiser │
│  votre mot de passe"│
│                     │
│ https://app.com/    │
│ reset-password/     │
│ abc123xyz...        │
└─────────┬───────────┘
          │
          ▼ (1 heure max)
          
[Client] Clic sur le lien
    │
    ▼
┌─────────────────────────────────────────────────────────────────┐
│  ┌─────────────────────────────────────────────────────────────┐│
│  │        Nouveau mot de passe                                 ││
│  │                                                              ││
│  │  Nouveau mot de passe:  [_________________________]         ││
│  │  Confirmer:             [_________________________]         ││
│  │                                                              ││
│  │  ✓ 8 caractères min                                         ││
│  │  ✓ 1 majuscule                                              ││
│  │  ✓ 1 chiffre                                                ││
│  │                                                              ││
│  │  [Réinitialiser]                                            ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
    │
    ▼
POST /api/auth/reset-password/:token { password }
    │
    ▼
┌─────────────────────┐
│ Password hashé      │
│ Token invalidé      │
│ Tous refresh tokens │
│   invalidés!        │
│ 📧 Email confirmation│
└─────────┬───────────┘
          │
          ▼
    ✅ "Mot de passe modifié"
       Redirection page login
```

---

### Diagramme des Tokens JWT
```
┌─────────────────────────────────────────────────────────────────┐
│                    GESTION DES TOKENS                            │
└─────────────────────────────────────────────────────────────────┘

        ┌──────────────────┐         ┌──────────────────┐
        │   ACCESS TOKEN   │         │  REFRESH TOKEN   │
        │   (15 minutes)   │         │    (7 jours)     │
        ├──────────────────┤         ├──────────────────┤
        │ Payload:         │         │ Stocké en:       │
        │ • user.id        │         │ • Base de données│
        │ • user.email     │         │ • Table RefreshToken
        │ • user.role      │         │                  │
        │ • iat (issued)   │         │ Rotation:        │
        │ • exp (expiry)   │         │ Nouveau à chaque │
        └────────┬─────────┘         │ refresh          │
                 │                   └────────┬─────────┘
                 │                            │
                 ▼                            ▼
┌────────────────────────────────────────────────────────────────┐
│                         USAGE                                   │
│                                                                 │
│  Access Token:                    Refresh Token:               │
│  Header de chaque requête API     Uniquement pour /refresh-token│
│                                                                 │
│  Authorization: Bearer eyJhbGc... POST body: { refreshToken }  │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────────────────────────┐
│                      DÉCONNEXION                                │
│                                                                 │
│  POST /logout        → Invalide 1 refresh token (appareil actuel)
│  POST /logout-all    → Invalide TOUS les refresh tokens        │
│                                                                 │
│  Note: L'access token reste valide jusqu'à expiration (15 min) │
└────────────────────────────────────────────────────────────────┘
```
