# Aeli Services Client/Prestataire – Documentation technique

## Vue d’ensemble

Ce projet correspond à l’interface **client/prestataire** de la plateforme **Aeli Services**.
Il couvre les parcours d’authentification, la recherche de prestataires, la consultation de profils,
la gestion des services côté prestataire, les avis, les favoris, la messagerie de contact
et la souscription/abonnement.

---

## Stack technique utilisée

### Frontend

- **React 19** : construction de l’interface en composants.
- **React Router 7** : routage SPA et navigation entre écrans.
- **TanStack React Query 5** : gestion des appels API, cache, mutations, invalidation.
- **Tailwind CSS 4** : stylisation utilitaire et responsive design.
- **React Toastify** : notifications utilisateur (succès/erreurs).
- **Lucide React** : icônes de l’interface.
- **Leaflet + React Leaflet** : affichage carte pour la recherche géographique.
- **React Google Autocomplete** : saisie assistée d’adresses/lieux.
- **Framer Motion** : animations UI.
- **DotLottie React** : animations Lottie.

### Build & tooling

- **Vite 7 (Rolldown Vite)** : bundler et serveur de développement.
- **ESLint 9** : qualité et cohérence du code.
- **PostCSS + Autoprefixer** : pipeline CSS.

### Déploiement / infra

- **Nginx** (configuration incluse).
- **Docker** (dockerfile présent).
- **Vercel** (fichier de configuration présent).

---

## Fonctionnalités implémentées dans cette partie `aeli_service` (client/prestataire)

## 1) Architecture de Communication (Client API)

L'application communique avec le backend via un client HTTP centralisé situé dans `src/api/apiClient.jsx`. Ce dernier encapsule la logique de `fetch` pour uniformiser les échanges.

### Logique du Client `request`

- **Gestion des En-têtes (Headers)** :
  - Injection automatique du `Authorization: Bearer <token>` pour toutes les requêtes.
  - Détection intelligente du format : si le corps de la requête est un `FormData` (ex: upload d'image pour une bannière), le header `Content-Type` est géré par le navigateur. Sinon, il est fixé à `application/json`.
- **Gestion du Rafraîchissement (Silent Refresh)** :
  - Si une requête échoue avec le code `TOKEN_EXPIRED`, le client intercepte l'erreur.
  - Il tente automatiquement de renouveler le `accessToken` via l'endpoint `/api/auth/refresh`.
  - En cas de succès, la requête initiale est rejouée avec le nouveau token, offrant une expérience transparente pour l'administrateur.
  - En cas d'échec du refresh, la session est nettoyée (`localStorage.clear()`) et l'utilisateur est redirigé vers la page de connexion.
- **Sécurisation des réponses** : Utilisation d'un helper `getSafeJson` pour éviter les plantages lors du parsing des réponses vides ou des erreurs serveurs brutes.

## 2) Gestion des États avec React Query

Nous utilisons **TanStack React Query 5** pour la gestion du cache et de la synchronisation des données asynchrones. Cette approche permet de découpler la logique de récupération de données de la logique d'affichage.

### Cycle de vie des États

Chaque hook (ex: `useStats`, `useGetUsers`) expose des variables d'état que nous utilisons pour piloter l'interface utilisateur :

| État            | Utilisation dans l'Admin                                 | Impact UI                                                               |
| :-------------- | :------------------------------------------------------- | :---------------------------------------------------------------------- |
| **`isLoading`** | Chargement initial des données.                          | Affichage des `React Loading Skeleton` sur les tableaux/cartes.         |
| **`isPending`** | Mutation en cours (création, modification, suppression). | Désactivation des boutons d'action et affichage de loaders circulaires. |
| **`isSuccess`** | Réception confirmée des données.                         | Rendu des graphiques `Recharts` et arrêt des indicateurs de chargement. |
| **`isError`**   | Échec de la communication API.                           | Déclenchement d'un toast `React Toastify` avec le message d'erreur.     |
| **`data`**      | Objet de réponse JSON.                                   | Distribution des données vers les composants fils (props).              |
| **`error`**     | Détails de l'exception levée.                            | Log technique ou message spécifique affiché à l'utilisateur.            |

### Exemple de logique d'implémentation

```javascript
const { data, isLoading, isError, error } = useGetUsers();

if (isLoading) return <UserTableSkeleton />;
if (isError) return <ErrorMessage message={error.message} />;

return <UserTable users={data} />;
```

## 3) Authentification & gestion de session

- Inscription utilisateur (`useRegister`).
- Vérification OTP (`useOtp`).
- Renvoi OTP (`useResendOtp`).
- Connexion (`useLogin`).
- Déconnexion (`useLogout`).
- Mot de passe oublié (`useForgotPassword`).
- Réinitialisation du mot de passe via token (`useResetPassword`).
- Gestion automatique du token d’accès + refresh token côté client (`request` dans `src/api/apiClient.jsx`).

## 4) Accueil & découverte

- Affichage de recommandations (`RecommendationSection`).
- Affichage des services à explorer (`ServicesSection`).
- Présentation générale des prestataires/services depuis l’écran d’accueil (`HomeScreen`).

## 5) Recherche de prestataires (liste + carte)

- Recherche avec filtres (texte, prix max, note min) (`SearchScreen` + `useGetProviderList`).
- Pagination des résultats (`Pagination`, `CountItems`).
- Vue liste de prestataires (`ServiceSearch`).
- Vue cartographique des prestataires (`MapSearch`) basée sur Leaflet.

## 6) Profil utilisateur & espace prestataire

- Consultation des informations du compte connecté (`useInfoUserConnected`).
- Mise à jour du profil utilisateur (`useUpdateProfile`).
- Affichage conditionnel du panneau prestataire (`ProviderPanel`).
- Gestion de l’abonnement depuis le profil (`Abonnement`).

## 7) Parcours “Devenir prestataire” & gestion offre

- Soumission de candidature prestataire (`useApplyProvider`, écran `RegistrationProviderScreen`).
- Création de catégories de services (`useCreateCategories`).
- Liste des catégories (`useGetCategory`).
- Création de services (`useCreateServices`).
- Mise à jour de services (`useUpdateServices`).
- Suppression de services (`useDeleteServices`).
- Récupération des services d’un prestataire (`useGetServicesByProvider`).
- Mise à jour du profil prestataire (`useUpdateProviderProfile`).
- Suppression de photos prestataire (`useDeleteProviderPhoto`).

## 8) Consultation fiche prestataire & statistiques

- Consultation d’un prestataire depuis recherche/profil (`ProviderScreen`, `ServiceProvider`).
- Affichage des stats associées (`StatsProvider`).
- Chargement d’un prestataire par identifiant (`useGetProviderByid`).

## 9) Avis & notation

- Récupération des avis d’un prestataire (`useGetReviewByProvider`).
- Création d’un avis (`useCreateReview`).
- Modification d’un avis (`useUpdateReview`).
- Suppression d’un avis (`useDeleteReview`).
- Flux modal de feedback utilisateur (`FeedbackCard`).

## 10) Favoris

- Liste des favoris (`useGetFavorites`).
- Vérification d’un favori par prestataire (`useCheckFavorites`).
- Ajout aux favoris (`useAddToFavorites`).
- Suppression des favoris (`useDeleteFavorites`).
- Interface de gestion des favoris (`FavoriteList`).

## 11) Contact & messagerie client/prestataire

- Envoi d’un message de contact (`useContact`).
- Consultation des messages envoyés (`useGetContactSend`).
- Consultation des messages reçus (`useGetReceivedContact`).
- Mise à jour du statut de message (`useUpdateStatusMessage`).
- Déverrouillage de message (`useUnlockMessage`).
- Statistiques journalières de contact (`useGetStatDaily`).
- Composants de chat/messagerie (`ProviderMessaging`, `ChatList`, `ChatWindow`).

## 12) Souscriptions & paiements

- Consultation des plans d’abonnement (`useGetPlans`).
- Consultation de l’abonnement prestataire courant (`useGetAbonnementProvider`).
- Initialisation de paiement (NotchPay) pour souscription (`useSubscribe`).

## 13) Bannières & communication produit

- Récupération des bannières (`useGetBanners`).
- Affichage via modal de bannière (`Banner`).

## 14) Infrastructure UX transversale

- Layout applicatif partagé (`Base`) avec header/sidebar et modales globales.
- Notifications globales (`ToastContainer`).
- État de chargement global (`GlobalLoadingContext`).
- Composants utilitaires réutilisables (`ui/`, `components/global`).

---

## Organisation applicative (résumé)

- `src/screens` : pages/écrans.
- `src/components` : composants métier/UI.
- `src/hooks` : hooks de consommation API (queries/mutations).
- `src/api/apiClient.jsx` : client de requêtes HTTP centralisé (auth + refresh).
- `src/context` : contextes globaux (ex: chargement).
- `src/ui` : composants UI réutilisables.

---

## Routes principales (client/prestataire)

- `/`
- `/login`
- `/forgot-password`
- `/register`
- `/otp`
- `/reset-password/:token`
- `/become-service-provider`
- `/add-category`
- `/add-service`
- `/home`
- `/profile`
- `/search`
- `/provider`
- `/consult-provider`
- `/subscription`

---

## Scripts disponibles

- `npm run dev` : démarrage en développement.
- `npm run build` : build de production.
- `npm run preview` : preview locale du build.
- `npm run lint` : vérification lint.
