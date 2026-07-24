# API — Render Docker (Root Directory: server)
FROM node:22-alpine
WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY . .

# Birinchi yig'ilishda demo ma'lumot
RUN npm run seed || true

ENV NODE_ENV=production
EXPOSE 3001

CMD ["npm", "start"]
