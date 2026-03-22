FROM node:18

WORKDIR /app

COPY package*.json ./
RUN npm install

# Ensure tsx + concurrently
RUN npm install -g tsx concurrently

COPY . .

EXPOSE 3000
EXPOSE 4000   

CMD ["npx", "concurrently", "\"npm run api\"", "\"npm run dev\""]