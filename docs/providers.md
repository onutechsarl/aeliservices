# 🏪 API Prestataires - Documentation Complète

Documentation détaillée de tous les endpoints liés aux prestataires.

## Base URL
```
/api/providers
```

---

## 🌐 1. ROUTES PUBLIQUES

### `GET /` - Liste des prestataires

**Description :**  
Récupère la liste paginée des prestataires avec filtres et recherche. C'est l'endpoint principal pour la page d'accueil et la recherche.

**Ce qu'il fait :**
- Retourne uniquement les prestataires vérifiés (`isVerified = true`)
- Les prestataires "featured" apparaissent en premier
- Tri par note moyenne, nombre de vues ou date
- Cache Redis (5 min) pour les performances

**Paramètres query :**
| Param | Type | Description |
|-------|------|-------------|
| `page` | int | Numéro de page (défaut: 1) |
| `limit` | int | Éléments par page (défaut: 20, max: 50) |
| `search` | string | Recherche dans nom, description du prestataire **ET des services** |
| `location` | string | Filtrer par ville (Douala, Yaoundé, etc.) |
| `categoryId` | UUID | Filtrer par catégorie de service (via `services.category_id`) |
| `category` | string | Filtrer par catégorie via le `slug` (alternative à `categoryId`) |
| `minRating` | float | Note minimum (1-5) |
| `minPrice` | float | Prix minimum d'un service du prestataire |
| `maxPrice` | float | Prix maximum d'un service du prestataire |
| `sort` | string | `rating`, `views`, `recent`, `price_asc`, `price_desc` |
| `order` | string | `asc`, `desc` (obsolète, préférez `sort`) |

**Exemple :**
```
GET /api/providers?search=coiffure&minPrice=2000&maxPrice=10000&sort=price_asc
```

**Réponse 200 :**
```json
{
  "success": true,
  "providers": [
    {
      "id": "uuid",
      "businessName": "Salon Marie",
      "description": "Coiffure, tresses, maquillage...",
      "location": "Douala",
      "averageRating": 4.8,
      "totalReviews": 25,
      "totalViews": 150,
      "isFeatured": true,
      "profilePhoto": "https://res.cloudinary.com/...",
      "photos": ["url1", "url2"],  // ⚠️ Vide si abonnement expiré
      "whatsapp": "+237...",       // ⚠️ Masqué si abonnement expiré
      "categories": [
        {
          "id": "uuid-cat-coiffure",
          "name": "Coiffure",
          "slug": "coiffure",
          "icon": "scissors"
        }
      ],
      "subscription": {
        "isActive": true
      }
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 95,
    "hasNextPage": true
  }
}
```

**⚠️ Impact de l'abonnement :**
- Si `subscription.isActive = false`, les champs sensibles sont masqués :
  - `whatsapp` → `"***"`
  - `phone` → `"***"`
  - `photos` → `[]`
- Le profil reste visible mais sans moyens de contact

---

### `GET /:id` - Détails d'un prestataire

**Description :**  
Récupère le profil complet d'un prestataire avec ses services, avis récents et statistiques.

**Ce qu'il fait :**
- Incrémente automatiquement le compteur de vues
- Inclut les services du prestataire
- Inclut les 5 derniers avis
- Vérifie le statut d'abonnement pour masquer les contacts

**Réponse 200 :**
```json
{
  "success": true,
  "provider": {
    "id": "uuid",
    "businessName": "Salon Marie",
    "description": "Salon de coiffure spécialisé...",
    "location": "Douala",
    "address": "Rue de la Joie, Akwa",
    "whatsapp": "+237699123456",  // Masqué si abonnement expiré
    "facebook": "facebook.com/salonmarie",
    "instagram": "@salonmarie",
    "profilePhoto": "https://res.cloudinary.com/...",
    "photos": ["url1", "url2", "url3"],
    "isVerified": true,
    "isFeatured": false,
    "featuredUntil": null,
    "averageRating": 4.8,
    "totalReviews": 25,
    "totalViews": 151,  // Incrémenté !
    "services": [
      {
        "id": "uuid",
        "name": "Tresses africaines",
        "description": "...",
        "price": 5000,
        "priceType": "from"
      }
    ],
    "recentReviews": [
      {
        "rating": 5,
        "comment": "Excellent service !",
        "user": { "firstName": "Fatou" }
      }
    ],
    "subscription": {
      "isActive": true,
      "plan": "monthly"
    }
  }
}
```

---

### `GET /by-slug/:slug` - Profil public via lien partageable

**Description :**
Identique à `GET /:id`, mais résout le prestataire par son **slug** (identifiant URL-friendly généré depuis `businessName`). Pensé pour le partage de lien : un prestataire copie son URL publique (ex. `https://app.aeli.cm/p/eco-prestige`) et l'envoie sur WhatsApp / Instagram / SMS, le destinataire ouvre la page **sans avoir besoin de se connecter ni de créer un compte**.

**Ce qu'il fait :**
- Renvoie exactement le même payload que `GET /:id` (services, avis, profil complet).
- Incrémente le compteur de vues à chaque ouverture publique.
- Applique les mêmes règles de visibilité liées à l'abonnement (whatsapp / photos masqués si abonnement expiré).
- Cache Redis (5 min).

**Format du slug :**
- Auto-généré au moment de la création / mise à jour du `businessName`.
- Lower-case, sans accents ni caractères spéciaux (ex. `"Éco Prestige"` → `eco-prestige`).
- Garanti unique : en cas de collision, suffixé d'un compteur (`eco-prestige`, `eco-prestige-2`, `eco-prestige-3`, …).
- Stocké en colonne unique sur la table `providers`.

**Exemple :**
```
GET /api/providers/by-slug/eco-prestige
```

**Réponse 200 :** identique à `GET /:id` (le champ `slug` est aussi exposé dans la réponse).

**Réponse 404 :**
```json
{ "success": false, "message": "Prestataire introuvable" }
```

**Côté front :**
- Page publique recommandée : `https://<domaine-front>/p/:slug`.
- Bouton « Copier mon lien » dans l'espace pro qui copie cette URL dans le clipboard.
- Aucune protection d'auth requise sur la page : elle doit être accessible directement sans guard.

---

## 📝 2. CANDIDATURE PRESTATAIRE

### `POST /apply` - Postuler pour devenir prestataire

**🔒 Authentification requise** | **Rôle : client uniquement**

**Description :**  
Permet à un client de soumettre une candidature complète pour devenir prestataire. Inclut l'upload des pièces d'identité (Recto/Verso) et des photos de réalisations.

**Ce qu'il fait :**
1. Vérifie que l'utilisateur n'est pas déjà prestataire
2. Vérifie qu'il n'y a pas de candidature en attente
3. Vérifie qu'il n'y a pas eu de rejet récent (< 7 jours)
4. Upload les images (CNI + Photos) vers Cloudinary
5. Crée la candidature avec toutes les infos personnelles et professionnelles
6. Envoie un email de confirmation

**Content-Type :** `multipart/form-data`

**Champs (Paramètres) :**
| Champ | Type | Requis | Description |
|-------|------|--------|-------------|
| `businessName` | string | ✅ | Nom de l'activité (3-100 car.) |
| `description` | string | ✅ | Description (50-5000 car.) |
| `location` | string | ✅ | Ville/Quartier |
| `address` | string | ❌ | Adresse physique précise |
| `whatsapp` | string | ❌ | Numéro WhatsApp (format international) |
| `businessContact` | string | ❌ | Numéro pro alternatif |
| `activities` | JSON string | ✅ | ex: `["Coiffure", "Maquillage"]` |
| `latitude` | number | ❌ | Coordonnée géographique |
| `longitude` | number | ❌ | Coordonnée géographique |
| `cniNumber` | string | ❌ | Numéro de la CNI |
| `firstName` | string | ❌ | Prénom (si différent du compte) |
| `lastName` | string | ❌ | Nom (si différent du compte) |
| `email` | string | ❌ | Email pro (si différent du compte) |
| `phone` | string | ❌ | Téléphone pro (si différent du compte) |

**Fichiers :**
| Champ | Type | Requis | Description |
|-------|------|--------|-------------|
| `profilePhoto` | file | ❌ | Photo de profil du prestataire |
| `photos` | files | ❌ | Photos de réalisations (max 5) |
| `imgcnirecto` | file | ✅ | Photo CNI Face avant |
| `imgcniverso` | file | ✅ | Photo CNI Face arrière |

**Réponse 201 :**
```json
{
  "success": true,
  "message": "Candidature soumise avec succès",
  "application": {
    "id": "uuid",
    "businessName": "Salon Marie",
    "status": "pending",
    "createdAt": "2026-02-15T10:00:00Z"
  }
}
```

**Erreurs possibles :**
| Code | Message | Cause |
|------|---------|-------|
| 400 | Vous êtes déjà prestataire | Déjà le rôle provider |
| 400 | Candidature en attente | Une candidature PENDING existe déjà |
| 400 | CNI requis | Fichiers CNI manquants |
| 400 | Description trop courte | < 50 caractères |

---

### `GET /my-application` - Voir ma candidature

**🔒 Authentification requise**

**Description :**  
Récupère le statut de la dernière candidature de l'utilisateur.

**Réponse 200 :**
```json
{
  "success": true,
  "application": {
    "id": "uuid",
    "businessName": "Salon Marie",
    "status": "pending",  // pending, approved, rejected
    "createdAt": "2026-01-15T19:00:00Z",
    "reviewedAt": null,
    "rejectionReason": null
  }
}
```

**Workflow frontend :**
1. Afficher statut avec indicateur visuel
2. Si `rejected` : afficher `rejectionReason` et bouton pour resoumettre (après 7j)
3. Si `approved` : rediriger vers dashboard prestataire

---

## 👤 3. PROFIL PRESTATAIRE (Connecté)

### `GET /my-profile` - Mon profil prestataire

**🔒 Authentification requise** | **Rôle : provider**

**Description :**  
Récupère le profil complet du prestataire connecté, y compris les statistiques.

**Réponse 200 :**
```json
{
  "success": true,
  "provider": {
    "id": "uuid",
    "businessName": "Salon Marie",
    "description": "...",
    "location": "Douala",
    "profilePhoto": "https://res.cloudinary.com/...",
    "photos": [...],
    "documents": [...],
    "isVerified": true,
    "isFeatured": false,
    "featuredUntil": null,
    "verificationStatus": "approved",
    "averageRating": 4.8,
    "totalViews": 500,
    "totalContacts": 45,
    "subscription": {
      "status": "active",
      "plan": "monthly",
      "daysRemaining": 22,
      "endDate": "2026-02-06"
    }
  }
}
```

---

### `GET /my-dashboard` - Dashboard prestataire

**🔒 Authentification requise** | **Rôle : provider**

**Description :**  
Récupère les statistiques et activités récentes pour le tableau de bord du prestataire.

**Ce qu'il retourne :**
- Statistiques (vues, contacts, avis ce mois)
- 10 dernières demandes de contact
- 5 derniers avis reçus
- Statut de l'abonnement

**Réponse 200 :**
```json
{
  "success": true,
  "dashboard": {
    "stats": {
      "viewsThisMonth": 120,
      "contactsThisMonth": 15,
      "reviewsThisMonth": 5,
      "averageRating": 4.8
    },
    "recentContacts": [
      {
        "id": "uuid",
        "senderName": "Fatou",
        "message": "Bonjour, je voudrais...",
        "status": "pending",
        "createdAt": "2026-01-15T18:00:00Z"
      }
    ],
    "recentReviews": [...],
    "subscription": {
      "status": "trial",
      "daysRemaining": 25,
      "endDate": "2026-02-15"
    }
  }
}
```

---

## ✏️ 4. MODIFICATION DU PROFIL

### `PUT /:id` - Mettre à jour le profil

**🔒 Authentification requise** | **Propriétaire ou Admin**

**Description :**  
Met à jour les informations du profil prestataire. Permet aussi d'ajouter des photos.

**Content-Type :** `multipart/form-data`

**Body :**
| Champ | Type | Description |
|-------|------|-------------|
| `businessName` | string | Nom de l'activité |
| `description` | string | Description |
| `location` | string | Ville |
| `address` | string | Adresse |
| `whatsapp` | string | Numéro WhatsApp |
| `facebook` | string | URL Facebook |
| `instagram` | string | Pseudo Instagram |
| `logo` | file | Photo de profil du prestataire (remplace l'ancienne) |
| `photos` | files | Nouvelles photos à ajouter à la galerie |

**⚠️ Le WhatsApp est chiffré** en base de données (AES-256-GCM).

---

### `DELETE /:id/photos/:photoIndex` - Supprimer une photo

**🔒 Authentification requise** | **Propriétaire ou Admin**

**Description :**  
Supprime une photo de la galerie du prestataire.

**Ce qu'il fait :**
1. Supprime l'image de Cloudinary
2. Retire l'URL du tableau `photos`
3. Invalide le cache

**Paramètres URL :**
- `:id` - ID du prestataire
- `:photoIndex` - Index de la photo (0-based)

---

## 📄 5. DOCUMENTS (KYC)

### `POST /:id/documents` - Upload documents

**🔒 Authentification requise** | **Propriétaire**

**Description :**  
Soumet des documents pour vérification (CNI, licence commerciale, etc.).

**Content-Type :** `multipart/form-data`

**Body :**
| Champ | Type | Description |
|-------|------|-------------|
| `documents` | files | Fichiers PDF, JPG ou PNG (max 5MB) |
| `documentType` | string | `cni`, `license`, `tax`, `address_proof` |

**Ce qu'il fait :**
1. Upload vers Cloudinary (dossier sécurisé)
2. Ajoute au tableau `documents` du provider
3. Met `verificationStatus = 'under_review'`
4. Envoie un email de confirmation

---

### `GET /:id/documents` - Voir mes documents

**🔒 Authentification requise** | **Propriétaire ou Admin**

**Réponse 200 :**
```json
{
  "documents": [
    {
      "type": "cni",
      "url": "https://res.cloudinary.com/...",
      "status": "approved",  // pending, approved, rejected
      "uploadedAt": "2026-01-10",
      "rejectionReason": null
    }
  ]
}
```

---

### `DELETE /:id/documents/:docIndex` - Supprimer un document

**🔒 Authentification requise** | **Propriétaire**

---

## 📊 Statuts et Workflow

### Cycle de vie d'un prestataire

```
┌─────────────┐     POST /apply      ┌─────────────┐
│   CLIENT    │ ──────────────────→  │ APPLICATION │
│             │                      │   pending   │
└─────────────┘                      └──────┬──────┘
                                            │
                    ┌───────────────────────┼───────────────────────┐
                    │ Admin review          │                       │
                    ▼                       ▼                       ▼
            ┌─────────────┐         ┌─────────────┐         ┌─────────────┐
            │  APPROVED   │         │  REJECTED   │         │   PENDING   │
            │             │         │             │         │  (attente)  │
            └──────┬──────┘         └─────────────┘         └─────────────┘
                   │
                   ▼
            ┌─────────────┐
            │  PROVIDER   │
            │ isVerified  │
            │ trial 30j   │
            └──────┬──────┘
                   │
        ┌──────────┼──────────┐
        ▼          ▼          ▼
┌─────────────┐ ┌─────┐ ┌─────────────┐
│ SUBSCRIPTION│ │VIEWS│ │   REVIEWS   │
│ active/exp  │ │     │ │             │
└─────────────┘ └─────┘ └─────────────┘
```

### Statuts d'abonnement

| Statut | Description | Contacts visibles |
|--------|-------------|-------------------|
| `trial` | Essai gratuit 30j | ✅ Oui |
| `active` | Abonnement payé | ✅ Oui |
| `expired` | Abonnement expiré | ❌ Non (masqués) |
| `cancelled` | Annulé manuellement | ❌ Non |

---

## 🚨 Codes d'erreur

| Code | Situation |
|------|-----------|
| 400 | Validation échouée |
| 401 | Non authentifié |
| 403 | Non autorisé (pas propriétaire) |
| 404 | Prestataire non trouvé |
| 413 | Fichier trop volumineux |

---

## 🔄 WORKFLOWS VISUELS

### Workflow Complet : Devenir Prestataire
```
┌─────────────────────────────────────────────────────────────────┐
│                    DEVENIR PRESTATAIRE                           │
└─────────────────────────────────────────────────────────────────┘

[Client connecté] 
    │
    ▼
┌─────────────────────────────────────────────────────────────────┐
│                    FORMULAIRE CANDIDATURE                        │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  Nom de votre activité: [Salon Marie____________]          ││
│  │                                                              ││
│  │  Description:                                               ││
│  │  [Salon de coiffure spécialisé dans les tresses...]        ││
│  │                                                              ││
│  │  Ville: [Douala ▼]                                          ││
│  │                                                              ││
│  │  WhatsApp: [+237 ___ ___ ___]                               ││
│  │                                                              ││
│  │  📸 Photos de votre activité:                               ││
│  │  [photo1.jpg] [photo2.jpg] [+ Ajouter]                      ││
│  │                                                              ││
│  │  📄 CNI (obligatoire):                                      ││
│  │  [cni_recto.jpg] [cni_verso.jpg]                            ││
│  │                                                              ││
│  │  [Soumettre ma candidature]                                 ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
    │
    ▼
POST /api/providers/apply  (multipart/form-data)
    │
    ├── Validation des données
    ├── Upload photos → Cloudinary
    ├── Upload documents → Cloudinary (dossier sécurisé)
    │
    ▼
┌─────────────────────┐
│ ProviderApplication │
│ status: "pending"   │
│ userId: xxx         │
│ businessName: "..." │
│ documents: [urls]   │
│ photos: [urls]      │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│ 📧 Email envoyé:    │
│ "Candidature reçue, │
│  nous vous tiendrons│
│  informé"           │
└─────────┬───────────┘
          │
          ▼ (Attente validation Admin - 24-72h)
          
┌─────────────────────────────────────────────────────────────────┐
│                           ADMIN                                  │
│                                                                  │
│  GET /api/admin/provider-applications?status=pending            │
│      │                                                           │
│      ▼                                                           │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ 📋 Candidatures en attente                                  ││
│  │                                                              ││
│  │ • Marie Dupont - Salon Marie - il y a 2h       [Examiner]   ││
│  │ • Fatou Kamga - Traiteur Fatou - il y a 5h     [Examiner]   ││
│  └─────────────────────────────────────────────────────────────┘│
│      │                                                           │
│      │ Clic [Examiner]                                          │
│      ▼                                                           │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ 📄 Détails de la candidature                                ││
│  │                                                              ││
│  │ Nom: Marie Dupont          Email: marie@example.com         ││
│  │ Business: Salon Marie      Ville: Douala                    ││
│  │                                                              ││
│  │ Description:                                                 ││
│  │ "Salon de coiffure spécialisé en tresses africaines..."    ││
│  │                                                              ││
│  │ 📸 Photos:      [img1] [img2] [img3]                        ││
│  │ 📄 Documents:   [CNI recto ✓] [CNI verso ✓]                 ││
│  │                                                              ││
│  │ ┌─────────────────┐  ┌─────────────────┐                    ││
│  │ │ ✅ Approuver    │  │ ❌ Rejeter      │                    ││
│  │ └─────────────────┘  └─────────────────┘                    ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
          │
    ┌─────┴─────┐
    │           │
    ▼           ▼
[APPROUVÉ]  [REJETÉ]
    │           │
    │           ▼
    │     ┌─────────────────────┐
    │     │ status: "rejected"  │
    │     │ rejectionReason:    │
    │     │ "CNI illisible..."  │
    │     └─────────┬───────────┘
    │               │
    │               ▼
    │     ┌─────────────────────┐
    │     │ 📧 Email rejet:     │
    │     │ "CNI illisible,     │
    │     │  veuillez resoumettre│
    │     │  dans 7 jours"      │
    │     └─────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────────┐
│                    TRANSACTION ATOMIQUE                          │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ 1. User.role = 'provider'                                 │  │
│  │ 2. Provider.create({                                      │  │
│  │      businessName: "Salon Marie",                         │  │
│  │      description: "...",                                  │  │
│  │      whatsapp: encrypt("+237..."),                        │  │
│  │      photos: [urls],                                      │  │
│  │      isVerified: true                                     │  │
│  │    })                                                     │  │
│  │ 3. Subscription.createTrial({                             │  │
│  │      providerId: xxx,                                     │  │
│  │      plan: 'trial',                                       │  │
│  │      startDate: now(),                                    │  │
│  │      endDate: now() + 30 days                             │  │
│  │    })                                                     │  │
│  │ 4. Application.status = 'approved'                        │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  Si erreur → ROLLBACK total (rien n'est créé)                   │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│ 📧 Email félicitations:                                          │
│ "Bienvenue chez AELI Services !                                  │
│  Votre profil est maintenant visible.                            │
│  Vous bénéficiez de 30 jours d'essai gratuit."                  │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
    ✅ Nouveau prestataire créé !
       - Visible dans les recherches
       - Accès au dashboard prestataire
       - Essai gratuit 30 jours activé
```

---

### Dashboard Prestataire
```
┌─────────────────────────────────────────────────────────────────┐
│                    DASHBOARD PRESTATAIRE                         │
│                    GET /my-dashboard                             │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  Bonjour Marie ! 👋                              [Mon Profil]   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐            │
│  │ 👁️ 120       │ │ 📩 15        │ │ ⭐ 4.8       │            │
│  │ Vues ce mois │ │ Contacts     │ │ Note moyenne │            │
│  └──────────────┘ └──────────────┘ └──────────────┘            │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ 💎 ABONNEMENT                                               ││
│  │                                                              ││
│  │ Plan: Essai gratuit    ████████░░░░░░░░ 25 jours restants   ││
│  │ Expire le: 15 février 2026                                  ││
│  │                                                              ││
│  │ [Passer à un abonnement payant]                             ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ 📩 DERNIÈRES DEMANDES DE CONTACT           [Voir tout →]    ││
│  │                                                              ││
│  │ • Fatou K. - "Bonjour, je voudrais..." - Il y a 2h  [Nouveau]│
│  │ • Jean P. - "Disponible samedi ?" - Il y a 5h       [Lu]    ││
│  │ • Aminata - "Prix pour tresses ?" - Hier            [Traité]││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ ⭐ DERNIERS AVIS                            [Voir tout →]    ││
│  │                                                              ││
│  │ ⭐⭐⭐⭐⭐ - Fatou - "Excellent service !"                   ││
│  │ ⭐⭐⭐⭐ - Jean - "Bon travail"                               ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

---

### Gestion Photos et Documents
```
┌─────────────────────────────────────────────────────────────────┐
│                    GESTION DU PROFIL                             │
│                    PUT /:id + POST /:id/documents               │
└─────────────────────────────────────────────────────────────────┘

[Prestataire] Page "Mon profil"
    │
    ▼
┌─────────────────────────────────────────────────────────────────┐
│  📸 MES PHOTOS                                                   │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  [img1] 🗑️   [img2] 🗑️   [img3] 🗑️   [+ Ajouter]          ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  Clic 🗑️ sur photo2                                             │
│      │                                                           │
│      ▼                                                           │
│  DELETE /api/providers/:id/photos/1                             │
│      │                                                           │
│      ├── Suppression de Cloudinary                              │
│      ├── Retrait du tableau photos[]                            │
│      └── Invalidation cache Redis                               │
│                                                                  │
│  Clic [+ Ajouter]                                               │
│      │                                                           │
│      ▼                                                           │
│  PUT /api/providers/:id (multipart/form-data)                   │
│      photos: [newphoto.jpg]                                     │
│      │                                                           │
│      ├── Upload vers Cloudinary                                 │
│      ├── Ajout au tableau photos[]                              │
│      └── Invalidation cache Redis                               │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  📄 MES DOCUMENTS (KYC)                                          │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  Document           │ Statut        │ Actions               ││
│  │ ─────────────────────────────────────────────────────────── ││
│  │  CNI Recto          │ ✅ Approuvé   │ [Voir]               ││
│  │  CNI Verso          │ ✅ Approuvé   │ [Voir]               ││
│  │  Licence commerce   │ ⏳ En revue   │ [Voir]               ││
│  │                                                              ││
│  │  [+ Ajouter un document]                                    ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  Clic [+ Ajouter]                                               │
│      │                                                           │
│      ▼                                                           │
│  POST /api/providers/:id/documents                              │
│      documentType: "license"                                    │
│      documents: [licence.pdf]                                   │
│      │                                                           │
│      ├── Upload vers Cloudinary (dossier sécurisé)              │
│      ├── Ajout au tableau documents[]                           │
│      ├── verificationStatus = 'under_review'                    │
│      └── 📧 Email confirmation                                  │
│                                                                  │
│      ▼                                                           │
│  [ADMIN] Révision des documents                                 │
│      │                                                           │
│      ├── Approuver → document.status = 'approved'               │
│      └── Rejeter → document.status = 'rejected'                 │
│                     document.rejectionReason = "..."            │
└─────────────────────────────────────────────────────────────────┘
```

---

### Recherche Prestataires (Frontend)
```
┌─────────────────────────────────────────────────────────────────┐
│                    RECHERCHE PRESTATAIRES                        │
│                    GET /api/providers                            │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  🔍 Rechercher un prestataire                                    │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  [Coiffure, maquillage...]     [Douala ▼]    [🔍 Rechercher]││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  Filtres: [Catégorie ▼] [Note min ⭐⭐⭐⭐] [Trier par: Note ▼] │
└─────────────────────────────────────────────────────────────────┘
    │
    ▼
GET /api/providers?search=coiffure&location=Douala&minRating=4&sortBy=rating
    │
    ▼
┌─────────────────────────────────────────────────────────────────┐
│                    RÉSULTATS                                     │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ ⭐ MISE EN AVANT                                            ││
│  │ ┌───────────────────────────────────────────────────────┐   ││
│  │ │ [📸]  Salon Marie                        ⭐ 4.8 (25)  │   ││
│  │ │       📍 Douala, Akwa                    💎 Premium   │   ││
│  │ │       "Coiffure, tresses, maquillage..."              │   ││
│  │ │       [Voir le profil] [❤️ Favori]                    │   ││
│  │ └───────────────────────────────────────────────────────┘   ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ ┌───────────────────────────────────────────────────────┐   ││
│  │ │ [📸]  Beauté Cam                         ⭐ 4.5 (18)  │   ││
│  │ │       📍 Douala, Bonapriso                            │   ││
│  │ │       "Institut de beauté complet..."                 │   ││
│  │ │       [Voir le profil] [❤️]                           │   ││
│  │ └───────────────────────────────────────────────────────┘   ││
│  │ ┌───────────────────────────────────────────────────────┐   ││
│  │ │ [📸]  Chez Fatou                         ⭐ 4.3 (12)  │   ││
│  │ │       📍 Douala, Deido                   ⚠️ Abonnement││
│  │ │       "Tresses et coiffures traditionnelles"  expiré  │   ││
│  │ │       [Voir le profil] [❤️]                           │   ││
│  │ └───────────────────────────────────────────────────────┘   ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  [Page 1] [2] [3] ... [5] [Suivant →]                           │
└─────────────────────────────────────────────────────────────────┘

Note: "Chez Fatou" a un abonnement expiré :
- Contacts masqués (whatsapp: "***")
- Photos masquées
- Profil visible mais non contactable
```
