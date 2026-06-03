# Guide de déploiement — AELI Services Backend

Guide de déploiement Docker en production.

## 1. Prérequis

- Docker Engine 20.x+ et Docker Compose v2
- Ports `5000` (API) et `5432` (Postgres) disponibles
- Accès réseau sortant vers Cloudinary, Mailtrap/SMTP, CinetPay et NotchPay

## 2. Variables d'environnement (`.env`)

Copier `.env.example` vers `.env` à la racine du projet puis renseigner les variables. Valeurs clés pour un déploiement Docker :

```env
# Runtime
NODE_ENV=production
PORT=5000

# Postgres (service docker-compose = "db")
DB_HOST=db
DB_PORT=5432
DB_NAME=aeli_services
DB_USER=<db_user>
DB_PASSWORD=<db_password>

# SSL Postgres
#   - true  : Postgres managé (Neon, Render, RDS...) → SSL requis
#   - false : Postgres local (docker-compose)        → SSL désactivé
DB_SSL=false

# Redis (service docker-compose = "redis")
REDIS_URL=redis://redis:6379
REDIS_HOST=redis
REDIS_PORT=6379

# Compte admin bootstrap (consommé par la migration 20260331112000)
AELI_ADMIN_EMAIL=admin@aeli-service.com
AELI_ADMIN_PASSWORD=<mot_de_passe_fort>

# JWT
JWT_SECRET=<secret_fort_32+caractères>
JWT_ACCESS_EXPIRES=1h
JWT_REFRESH_EXPIRES=7d

# Chiffrement AES-256 (exactement 32 caractères)
ENCRYPTION_KEY=<32_caractères>

# Cloudinary, SMTP, CinetPay, NotchPay : voir .env.example
```

> ⚠️ `AELI_ADMIN_EMAIL` et `AELI_ADMIN_PASSWORD` sont **obligatoires** : la migration qui provisionne le compte administrateur échoue sans eux.

## 3. Lancer les services

```bash
# Build de l'image API
docker compose build

# Démarrage (Postgres, Redis, API)
docker compose up -d

# Vérifier que tout est healthy
docker compose ps
```

```bash
# Appliquer les modifs du code et relancer l'api sans supprimer la bd et les données (quand tout est deja déployé)
docker compose up -d --no-deps --build api
```

Attendu :

```
SERVICE   STATUS
api       Up (healthy)
db        Up (healthy)
redis     Up (healthy)
```

## 4. Appliquer les migrations

Les migrations ne sont **pas** exécutées automatiquement au démarrage du container. À lancer manuellement :

```bash
docker compose exec api npx sequelize-cli db:migrate
```

La migration `20260331112000-update-admin-credentials` crée (ou met à jour) le compte administrateur à partir des variables `AELI_ADMIN_EMAIL` / `AELI_ADMIN_PASSWORD`.

La migration `20260430120000-add-slug-to-providers` ajoute la colonne `slug` sur la table `providers` et **backfill** les slugs des prestataires déjà en base à partir de leur `business_name` (ex. `"Eco Prestige"` → `eco-prestige`). À lancer une seule fois après le déploiement de la feature de partage de profil.

## 5. Seeder les données de production

Seul le jeu de **catégories** est inséré. Aucune donnée fictive (utilisateurs, prestataires, services, avis) n'est seedée.

```bash
docker compose exec api node seeds/index.js
```

## 6. Vérifier le déploiement

| Ressource | URL |
|---|---|
| Health | http://localhost:5000/api/health |
| Swagger UI | http://localhost:5000/api-docs/ |
| WebSocket | ws://localhost:5000 |

Smoke-test rapide :

```bash
# Santé API
curl http://localhost:5000/api/health

# Login admin
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@aeli-service.com","password":"<AELI_ADMIN_PASSWORD>"}'
```

## 7. Exploitation

```bash
# Logs API en temps réel
docker compose logs -f api

# Logs applicatifs (Winston) dans le container
docker compose exec api tail -f logs/combined.log
docker compose exec api tail -f logs/error.log

# Restart de l'API après modification du .env
docker compose up -d --force-recreate api

# Arrêt complet
docker compose down

# Arrêt + suppression du volume Postgres (⚠️ destructif)
docker compose down -v
```

## 8. Déploiement avec Postgres managé (Neon, Render, RDS…)

Si la base est hébergée en dehors du docker-compose :

1. Retirer le service `db` de `docker-compose.yml` ou l'ignorer.
2. Dans `.env` :
   - `DB_HOST=<host_postgres_managé>`
   - `DB_SSL=true`
3. Lancer uniquement l'API et Redis : `docker compose up -d api redis`.

## 9. Checklist avant mise en production

- [ ] `NODE_ENV=production`
- [ ] `JWT_SECRET` régénéré (≥ 32 caractères aléatoires)
- [ ] `ENCRYPTION_KEY` régénéré (exactement 32 caractères)
- [ ] `AELI_ADMIN_PASSWORD` fort et stocké dans un gestionnaire de secrets
- [ ] `DB_PASSWORD` fort
- [ ] `DB_SSL=true` si base managée
- [ ] SMTP production configuré (pas Mailtrap sandbox)
- [ ] Clés CinetPay / NotchPay **live** (pas test)
- [ ] `FRONTEND_URL` contient les domaines réels du front (utilisé pour le CORS)
- [ ] `FRONTEND_URL_USER` et `FRONTEND_URL_ADMIN` renseignés si tu as deux fronts distincts (sinon le lien de reset password tombera sur le mauvais domaine pour les admins)
- [ ] Backups Postgres programmés
- [ ] Reverse proxy TLS devant l'API (Nginx, Traefik, Caddy…)

## 10. Dépannage

**`Missing required env vars: AELI_ADMIN_EMAIL and AELI_ADMIN_PASSWORD`**
Les variables ne sont pas chargées. Vérifier `.env` et relancer la migration.

**`Redis error (cache disabled)`**
`REDIS_URL` n'est pas défini ou pointe vers un host inaccessible. En docker-compose, utiliser `REDIS_URL=redis://redis:6379`.

**`ECONNREFUSED` vers la DB**
`DB_HOST=localhost` au lieu de `db` (nom du service docker-compose). Dans un container, `localhost` = le container lui-même.

**SSL error (`no pg_hba.conf entry ... SSL off`)**
La base cible n'a pas SSL activé alors que le code le force. Mettre `DB_SSL=false` dans `.env`.

**Migrations passent mais `Tables already exist`**
Normal lors du premier run après un `sequelize.sync()` : les migrations déjà « compatibles » sont juste enregistrées dans `SequelizeMeta`.
