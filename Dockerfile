FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# The Docker build also checks lint, tests and build.
RUN npm run lint
RUN npm test
RUN npm run build

FROM node:22-alpine AS production

WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev

COPY client ./client
COPY --from=build /app/build ./build

EXPOSE 3000

CMD ["npm", "run", "start"]
