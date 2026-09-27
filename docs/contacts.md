# 📩 API Contacts - Documentation Complète

Documentation détaillée des endpoints de demande de contact entre clients et prestataires.

## Base URL
```
/api/contacts
```

---

## 📞 Fonctionnalité Contact

### Principe
Les clients peuvent envoyer des demandes de contact aux prestataires. Ces demandes contiennent un message et les coordonnées du client pour que le prestataire puisse répondre.

### Confidentialité
- Les **emails** et **téléphones** des clients sont **chiffrés** en base de données (AES-256-GCM)
- Seul le prestataire destinataire peut voir les coordonnées

### 🔓 Messages entièrement visibles (pay-per-view retiré)

> **La restriction « message payant » a été retirée (demande client).**
> Le prestataire destinataire voit **toujours** le message complet et les
> coordonnées du client, **sans abonnement et sans paiement**.

**Principe :**
- Les clients envoient des messages aux prestataires (avec ou sans compte).
- Les messages sont créés **déverrouillés** (`isUnlocked: true`).
- Plus aucun masquage des coordonnées, plus de paiement de 500 FCFA.
- Les messages créés avant ce changement sont **normalisés automatiquement**
  en « déverrouillé » au premier chargement de `GET /received`.

Les points d'entrée `POST /:id/unlock` et `POST /:id/unlock/confirm` existent
encore mais sont **inutiles** : comme tout est déjà visible, `POST /:id/unlock`
répond « déjà débloqué » (400). Ils pourront être retirés d'une future version.

---

## 📧 1. ENVOYER UN MESSAGE

### `POST /` - Contacter un prestataire

**🔓 Authentification optionnelle** (mais recommandée)

**Description :**  
Envoie une demande de contact à un prestataire. Peut être utilisé par des visiteurs non inscrits.

**Ce qu'il fait :**
1. Vérifie que le prestataire existe (pas besoin d'abonnement actif)
2. Chiffre les coordonnées du client (email, téléphone)
3. Crée l'enregistrement Contact **déverrouillé** (`isUnlocked: true`)
4. Incrémente le compteur de contacts du prestataire
5. Envoie un email de notification au prestataire
6. Envoie un email de confirmation au client

**Rate Limiting :** 5 contacts / heure par IP

**Body :**
```json
{
  "providerId": "uuid",
  "message": "Bonjour, je voudrais prendre rendez-vous pour une coupe et une coloration. Êtes-vous disponible samedi matin ?",
  "senderName": "Fatou Kamga",
  "senderEmail": "fatou@example.com",
  "senderPhone": "+237699123456"  // Optionnel
}
```

**Validation :**
| Champ | Requis | Règles |
|-------|--------|--------|
| `providerId` | ✅ | UUID valide |
| `message` | ✅ | 10-2000 caractères |
| `senderName` | ✅ | Max 200 caractères |
| `senderEmail` | ✅ | Email valide |
| `senderPhone` | ❌ | Format téléphone |

**Réponse 201 :**
```json
{
  "success": true,
  "message": "Message envoyé avec succès",
  "contact": {
    "id": "uuid",
    "message": "Bonjour, je voudrais...",
    "status": "pending",
    "createdAt": "2026-01-15T19:30:00Z"
  }
}
```

**⚠️ Si l'utilisateur est connecté :**
- Les champs `senderName`, `senderEmail` peuvent être pré-remplis depuis le profil
- Le contact est lié à `userId`

**Erreurs possibles :**
| Code | Message | Cause |
|------|---------|-------|
| 400 | Message trop court | < 10 caractères |
| 404 | Prestataire non trouvé | ID invalide |
| 429 | Trop de demandes | Rate limit atteint |

---

## 📥 2. MESSAGES REÇUS (Prestataire)

### `GET /received` - Mes contacts reçus

**🔒 Authentification requise** | **Rôle : provider**

**Description :**  
Récupère la liste des demandes de contact reçues par le prestataire connecté.

**Ce qu'il fait :**
- Retourne les contacts avec pagination
- Chaque message est renvoyé **entièrement** (message complet + coordonnées déchiffrées) — plus de masquage
- Normalise en « déverrouillé » les anciens messages encore marqués verrouillés
- Peut filtrer par statut

**Paramètres query :**
| Param | Type | Description |
|-------|------|-------------|
| `page` | int | Numéro de page |
| `limit` | int | Éléments par page |
| `status` | string | `pending`, `contacted`, `completed`, `spam` |

**Réponse 200 :**
```json
{
  "success": true,
  "contacts": [
    {
      "id": "uuid",
      "senderName": "Fatou Kamga",
      "senderEmail": "fatou@example.com",  // Déchiffré !
      "senderPhone": "+237699123456",      // Déchiffré !
      "message": "Bonjour, je voudrais...",
      "status": "pending",
      "createdAt": "2026-01-15T19:30:00Z",
      "user": {  // Si connecté lors de l'envoi
        "id": "uuid",
        "firstName": "Fatou",
        "lastName": "Kamga"
      }
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 45
  }
}
```

---

### `PUT /:id/status` - Changer le statut d'un contact

**🔒 Authentification requise** | **Propriétaire du contact**

**Description :**  
Met à jour le statut d'un contact pour le suivi.

**Ce qu'il fait :**
- Vérifie que le prestataire est bien le destinataire
- Met à jour le statut

**Statuts disponibles :**
| Statut | Description | Email envoyé au client ? |
|--------|-------------|-------------------------|
| `pending` | Remis en non-traité | ❌ Non |
| `read` | Message lu par le prestataire | ✅ Oui |
| `replied` | Prestataire a répondu | ✅ Oui |

> ⚠️ **Important pour les avis** : le client ne peut noter le prestataire que si son contact est passé en `read` ou `replied`. Cela garantit que l'interaction a bien eu lieu.

**Body :**
```json
{
  "status": "read"
}
```

---

### `GET /stats/daily` - Statistiques journalières

**🔒 Authentification requise** | **Rôle : provider**

**Description :**  
Récupère les statistiques de contacts par jour (30 derniers jours).

**Ce qu'il retourne :**
- Nombre de contacts par jour
- Évolution sur le mois
- Utile pour graphiques dashboard

**Réponse 200 :**
```json
{
  "success": true,
  "stats": [
    { "date": "2026-01-15", "count": 5 },
    { "date": "2026-01-14", "count": 3 },
    { "date": "2026-01-13", "count": 7 }
  ],
  "total": 45,
  "period": "30 days"
}
```

---

### `GET /by-date/:date` - Contacts d'une date

**🔒 Authentification requise** | **Rôle : provider**

**Description :**  
Récupère tous les contacts reçus à une date spécifique.

**Exemple :**
```
GET /api/contacts/by-date/2026-01-15
```

---

## 💰 4. DÉBLOQUAGE PAYANT (Pay-Per-View) — ⚠️ DÉPRÉCIÉ

> **Ces endpoints sont dépréciés.** La restriction « message payant » a été
> retirée : tous les messages sont déjà visibles par le prestataire.
> `POST /:id/unlock` répond désormais « déjà débloqué » (400). La section
> ci-dessous est conservée pour référence historique uniquement.

### `POST /:id/unlock` - Initier le débloquage d'un message

**🔒 Authentification requise** | **Rôle : provider (propriétaire)**

**Description :**  
Initialise le paiement de 500 FCFA pour débloquer un message verrouillé.

**Ce qu'il fait :**
1. Vérifie que le prestataire est bien le destinataire du message
2. Vérifie que le message n'est pas déjà débloqué
3. Vérifie que le prestataire n'a pas d'abonnement actif (sinon auto-unlock)
4. Crée un paiement de type `contact_unlock` (500 FCFA)
5. Initialise la transaction CinetPay
6. Retourne l'URL de paiement

**Réponse 200 :**
```json
{
  "success": true,
  "message": "Paiement initialisé",
  "paymentUrl": "https://cinetpay.com/payment/...",
  "paymentId": "uuid",
  "transactionId": "AELI1234567890",
  "amount": 500
}
```

**Erreurs possibles :**
| Code | Message | Cause |
|------|---------|-------|
| 400 | Message déjà débloqué | isUnlocked = true |
| 403 | Non autorisé | N'est pas le destinataire |
| 404 | Contact non trouvé | ID invalide |

**Workflow Frontend :**
```javascript
// Bouton "Débloquer (500 FCFA)"
const unlockContact = async (contactId) => {
  const res = await fetch(`/api/contacts/${contactId}/unlock`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  const { paymentUrl } = await res.json();
  // Rediriger vers CinetPay
  window.location.href = paymentUrl;
};
```

---

### `POST /:id/unlock/confirm` - Confirmer le débloquage

**🔒 Authentification requise** | **Rôle : provider**

**Description :**  
Confirme le débloquage après paiement réussi via CinetPay.

**Body :**
```json
{
  "transactionId": "AELI1234567890"
}
```

**Ce qu'il fait :**
1. Vérifie que le paiement existe et est ACCEPTED
2. Débloque le message (`isUnlocked = true`)
3. Enregistre la référence du paiement (`unlockPaymentId`)
4. Retourne le contact avec coordonnées déchiffrées

**Réponse 200 :**
```json
{
  "success": true,
  "message": "Message débloqué avec succès",
  "contact": {
    "id": "uuid",
    "message": "Bonjour, je voudrais prendre rendez-vous...",
    "senderName": "Fatou Kamga",
    "senderEmail": "fatou@example.com",      // ← DÉCHIFFRÉ
    "senderPhone": "+237699123456",          // ← DÉCHIFFRÉ
    "isUnlocked": true,
    "unlockedAt": "2026-02-11T13:45:00Z",
    "unlockPaymentId": "uuid",
    "createdAt": "2026-02-11T10:30:00Z"
  }
}
```

**Erreurs possibles :**
| Code | Message | Cause |
|------|---------|-------|
| 400 | Paiement non confirmé | status !== 'ACCEPTED' |
| 404 | Paiement non trouvé | transactionId invalide |

---

## 📤 3. MESSAGES ENVOYÉS (Client)

### `GET /sent` - Mes messages envoyés

**🔒 Authentification requise**

**Description :**  
Récupère la liste des demandes de contact envoyées par l'utilisateur connecté.

**Ce qu'il fait :**
- Retourne les contacts envoyés par l'utilisateur
- Inclut les informations du prestataire

**Réponse 200 :**
```json
{
  "success": true,
  "contacts": [
    {
      "id": "uuid",
      "message": "Bonjour, je voudrais...",
      "status": "contacted",
      "createdAt": "2026-01-15T19:30:00Z",
      "provider": {
        "id": "uuid",
        "businessName": "Salon Marie",
        "photos": ["url"]
      }
    }
  ],
  "pagination": {...}
}
```

---

## 📧 Emails Automatiques

### Email au prestataire (nouveau contact)
```
Objet: 📩 Nouveau message de Fatou K. - AELI Services

Bonjour Marie,

Vous avez reçu une nouvelle demande de contact !

📝 Message de Fatou Kamga :
"Bonjour, je voudrais prendre rendez-vous pour une coupe 
et une coloration. Êtes-vous disponible samedi matin ?"

📞 Coordonnées :
- Email : fatou@example.com
- Téléphone : +237 699 123 456

[Voir tous mes messages]

L'équipe AELI Services
```

### Email au client (confirmation)
```
Objet: ✅ Votre message a été envoyé - AELI Services

Bonjour Fatou,

Votre message a bien été envoyé à "Salon Marie" !

Le prestataire vous contactera bientôt via les coordonnées 
que vous avez fournies.

[Découvrir d'autres prestataires]

L'équipe AELI Services
```

---

## 🔄 Workflow Frontend

### Page prestataire (client)
```javascript
const contactProvider = async (providerId, message) => {
  const response = await fetch('/api/contacts', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,  // Optionnel
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      providerId,
      message,
      senderName: user?.name || 'Visiteur',
      senderEmail: user?.email || formEmail,
      senderPhone: formPhone
    })
  });
  
  if (response.ok) {
    showSuccess('Message envoyé !');
  }
};
```

### Dashboard prestataire
```javascript
const loadContacts = async () => {
  const response = await fetch('/api/contacts/received?status=pending', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  const { contacts } = await response.json();
  
  contacts.forEach(contact => {
    // Afficher avec boutons d'action
    showContact({
      ...contact,
      actions: [
        { label: '📞 Appeler', action: () => window.open(`tel:${contact.senderPhone}`) },
        { label: '✅ Traité', action: () => updateStatus(contact.id, 'completed') }
      ]
    });
  });
};
```

---

## 🚨 Codes d'erreur

| Code | Situation |
|------|-----------|
| 400 | Données invalides |
| 401 | Non authentifié (routes protégées) |
| 403 | Non autorisé (pas propriétaire) |
| 404 | Contact/Prestataire non trouvé |
| 429 | Rate limit atteint |

---

## 🔄 WORKFLOWS VISUELS

### Formulaire Contact (Client → Prestataire)
```
┌─────────────────────────────────────────────────────────────────┐
│                    CONTACTER UN PRESTATAIRE                      │
│                    POST /api/contacts                            │
└─────────────────────────────────────────────────────────────────┘

[Client] Page du prestataire "Salon Marie"
    │
    ▼
┌─────────────────────────────────────────────────────────────────┐
│  📧 Contacter Salon Marie                                        │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                                                              ││
│  │  Votre nom: [Fatou Kamga_____________________]              ││
│  │                                                              ││
│  │  Votre email: [fatou@example.com_____________]              ││
│  │                                                              ││
│  │  Votre téléphone (optionnel):                               ││
│  │  [+237 699 ___ ___]                                         ││
│  │                                                              ││
│  │  Votre message:                                             ││
│  │  ┌──────────────────────────────────────────────────────┐   ││
│  │  │ Bonjour,                                             │   ││
│  │  │                                                      │   ││
│  │  │ Je voudrais prendre rendez-vous pour une coupe      │   ││
│  │  │ et une coloration. Êtes-vous disponible samedi      │   ││
│  │  │ matin ?                                              │   ││
│  │  │                                                      │   ││
│  │  │ Merci !                                              │   ││
│  │  └──────────────────────────────────────────────────────┘   ││
│  │  145/2000 caractères                                        ││
│  │                                                              ││
│  │  [Envoyer mon message]                                      ││
│  │                                                              ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
    │
    ▼
POST /api/contacts
{
  providerId: "uuid",
  message: "Bonjour...",
  senderName: "Fatou Kamga",
  senderEmail: "fatou@example.com", // → Chiffré en BDD
  senderPhone: "+237699..."         // → Chiffré en BDD
}
    │
    ▼
┌─────────────────────────────────────────────────────────────────┐
│                    TRAITEMENT BACKEND                            │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ 1. Validation des données                                 │  │
│  │ 2. Vérification rate limit (5/heure/IP)                  │  │
│  │ 3. Vérification abonnement prestataire actif             │  │
│  │ 4. Chiffrement email/phone (AES-256-GCM)                 │  │
│  │ 5. Création Contact en base                               │  │
│  │ 6. Incrémentation compteur totalContacts du provider     │  │
│  │ 7. Envoi email au prestataire                            │  │
│  │ 8. Envoi email confirmation au client                    │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
    │
    ├────────────────────────────────────────────┐
    │                                            │
    ▼                                            ▼
┌─────────────────────┐                ┌─────────────────────┐
│ 📧 EMAIL PRESTATAIRE │                │ 📧 EMAIL CLIENT     │
│                     │                │                     │
│ "Nouveau message    │                │ "Votre message a    │
│  de Fatou K."       │                │  été envoyé à       │
│                     │                │  Salon Marie"       │
│ Message: "..."      │                │                     │
│ Email: fatou@...    │                │ "Le prestataire     │
│ Tél: +237 699...    │                │  vous contactera"   │
│                     │                │                     │
│ [Voir le message]   │                │ [Voir d'autres]     │
└─────────────────────┘                └─────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────────┐
│  ✅ Message envoyé !                                             │
│                                                                  │
│  Votre demande a été transmise à Salon Marie.                   │
│  Le prestataire vous contactera via les coordonnées fournies.   │
│                                                                  │
│  [Retour au profil]  [Voir d'autres prestataires]               │
└─────────────────────────────────────────────────────────────────┘
```

---

### Inbox Prestataire (Messages reçus)
```
┌─────────────────────────────────────────────────────────────────┐
│                    MES MESSAGES REÇUS                            │
│                    GET /api/contacts/received                    │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  📩 Messages (45)                        Filtrer: [Tous ▼]      │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ 🔴 NOUVEAU                                                  ││
│  │ ┌───────────────────────────────────────────────────────┐   ││
│  │ │ Fatou K.                              Il y a 2h      │   ││
│  │ │ ────────────────────────────────────────────────────  │   ││
│  │ │ "Bonjour, je voudrais prendre rendez-vous pour..."   │   ││
│  │ │                                                       │   ││
│  │ │ 📧 fatou@example.com  📞 +237 699 123 456            │   ││
│  │ │                                                       │   ││
│  │ │ [📞 Appeler] [💬 WhatsApp] [✅ Marquer traité] [🗑️] │   ││
│  │ └───────────────────────────────────────────────────────┘   ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ 📨 CONTACTÉ                                                 ││
│  │ ┌───────────────────────────────────────────────────────┐   ││
│  │ │ Jean P.                               Il y a 5h      │   ││
│  │ │ ────────────────────────────────────────────────────  │   ││
│  │ │ "Bonjour, disponible samedi pour une coupe ?"        │   ││
│  │ │                                                       │   ││
│  │ │ 📧 jean@example.com   📞 +237 677 987 654            │   ││
│  │ │                                                       │   ││
│  │ │ [📞 Appeler] [💬 WhatsApp] [✅ Terminé]              │   ││
│  │ └───────────────────────────────────────────────────────┘   ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ ✅ TERMINÉ                                                  ││
│  │ ┌───────────────────────────────────────────────────────┐   ││
│  │ │ Aminata                                    Hier       │   ││
│  │ │ ────────────────────────────────────────────────────  │   ││
│  │ │ "Prix pour les tresses ?"                             │   ││
│  │ └───────────────────────────────────────────────────────┘   ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  [< Précédent] Page 1 sur 5 [Suivant >]                         │
└─────────────────────────────────────────────────────────────────┘
```

---

### Statistiques Contacts (Dashboard)
```
┌─────────────────────────────────────────────────────────────────┐
│                    STATISTIQUES CONTACTS                         │
│                    GET /api/contacts/stats/daily                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  📊 Mes demandes de contact - 30 derniers jours                 │
│                                                                  │
│  Total: 45 demandes                                             │
│                                                                  │
│   8│                               ▓▓                           │
│   7│                               ██                           │
│   6│              ▓▓               ██                           │
│   5│    ▓▓        ██▓▓     ▓▓      ██▓▓                        │
│   4│    ██▓▓      ██████   ██      ████                        │
│   3│ ▓▓ ██████    ██████▓▓ ██▓▓    ████▓▓                      │
│   2│ ██████████▓▓ ████████ ████    ██████                      │
│   1│ ████████████████████████████████████                      │
│   0└─────────────────────────────────────────▶                  │
│     1  5     10        15        20        25   30              │
│                      Janvier 2026                               │
│                                                                  │
│  📈 Évolution: +15% par rapport au mois dernier                 │
│                                                                  │
│  Par statut:                                                    │
│  ├── 🔴 En attente:  5                                         │
│  ├── 📨 Contactés:   12                                         │
│  ├── ✅ Terminés:    25                                         │
│  └── 🚫 Spam:        3                                          │
└─────────────────────────────────────────────────────────────────┘
```

---

### Page "Mes Messages Envoyés" (Client)
```
┌─────────────────────────────────────────────────────────────────┐
│                    MES MESSAGES ENVOYÉS                          │
│                    GET /api/contacts/sent                        │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  📤 Mes demandes de contact                                     │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ [📸] Salon Marie                        ⭐ 4.8             ││
│  │      📍 Douala                                              ││
│  │ ──────────────────────────────────────────────────────────  ││
│  │ 📅 15 janvier 2026                                          ││
│  │ "Bonjour, je voudrais prendre rendez-vous..."              ││
│  │                                                              ││
│  │ Statut: 📨 Contacté                                         ││
│  │ (Le prestataire vous a contacté)                            ││
│  │                                                              ││
│  │ [Recontacter]  [Laisser un avis ⭐]                         ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ [📸] Traiteur Fatou                     ⭐ 4.5             ││
│  │      📍 Yaoundé                                             ││
│  │ ──────────────────────────────────────────────────────────  ││
│  │ 📅 10 janvier 2026                                          ││
│  │ "Devis pour un buffet 50 personnes..."                      ││
│  │                                                              ││
│  │ Statut: 🔴 En attente                                       ││
│  │ (Pas encore de réponse)                                     ││
│  │                                                              ││
│  │ [Voir d'autres traiteurs]                                   ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  [< Précédent] Page 1 sur 2 [Suivant >]                         │
└─────────────────────────────────────────────────────────────────┘
```
