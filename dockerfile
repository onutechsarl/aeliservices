# Étape 1 : Construction (Build)
FROM node:20-alpine AS build

WORKDIR /app

# Copie des fichiers de dépendances
COPY package*.json ./

# Installation des dépendances
RUN npm install

# Copie du reste du code source
COPY . .

# Compilation du projet (crée le dossier /dist)
RUN npm run build

# Étape 2 : Serveur de production (Nginx)
FROM nginx:stable-alpine

# Copie des fichiers compilés de l'étape précédente vers Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Copie d'une config Nginx personnalisée pour gérer React Router (Optionnel mais recommandé)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]