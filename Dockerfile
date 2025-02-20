FROM node:23

WORKDIR /app
RUN npm install --global corepack@latest
RUN corepack enable pnpm
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm run build

EXPOSE 4000

CMD [ "node", "build/index.js" ]
