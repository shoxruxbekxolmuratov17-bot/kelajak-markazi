# Web + API birga (Render Docker — Root Directory: repo root)
FROM node:22-alpine AS webbuild
WORKDIR /repo
COPY package*.json ./
# postinstall server/ talab qiladi — web build uchun kerak emas
RUN npm install --ignore-scripts
COPY . .
ENV VITE_API_URL=/api
RUN npm run build

FROM node:22-alpine
WORKDIR /app
COPY server/package*.json ./
RUN npm install --omit=dev
COPY server/ .
COPY --from=webbuild /repo/dist /app/web-dist
RUN npx tsx src/seed.ts

ENV NODE_ENV=production
ENV SERVE_WEB=1
ENV WEB_DIST=/app/web-dist
EXPOSE 3001

CMD ["npm", "start"]
