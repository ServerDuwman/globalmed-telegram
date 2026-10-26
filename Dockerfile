FROM node:20-alpine
WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY . .

ENV PORT=8080
ENV NODE_ENV=production
ENV BACKEND_URL=http://87.192.224.166:8989

EXPOSE 8080

CMD ["node", "server.js"]
