# Dockerfile for API
FROM node:22-alpine
WORKDIR /app/server
COPY server/package*.json ./
RUN npm install --omit=dev
COPY server ./
ENV NODE_ENV=production
EXPOSE 3001
CMD ["npm", "run", "start"]
