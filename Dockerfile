FROM node:20-slim

WORKDIR /app
RUN npm install --global corepack@latest
RUN corepack enable pnpm
COPY . .
RUN pnpm install
RUN pnpm run build

EXPOSE 4000

CMD [ "node", "build/index.js" ]
