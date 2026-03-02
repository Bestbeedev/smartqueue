# Utilise une version légère de Node
FROM node:20-alpine

WORKDIR /app

# On copie d'abord les fichiers de dépendances pour profiter du cache Docker
COPY package.json package-lock.json* ./

# Installation des dépendances
RUN npm install

# Copie le reste du code
COPY . .

# Expose le port par défaut de Vite (5173) ou CRA (3000)
# Ajuste le port dans ton docker-compose si nécessaire
EXPOSE 3000

CMD ["npm", "run", "dev", "--", "--host"]
