# syntax=docker/dockerfile:1

# The site is built from the committed data/*.json: no Notion access, no secret.

# ---------- Stage 1: pre-render the static site ----------
FROM node:24-alpine AS build
WORKDIR /app

# Dependencies first, so this layer stays cached until the lockfile changes.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run generate

# ---------- Stage 2: serve the files with Caddy ----------
FROM caddy:2-alpine
COPY --from=build /app/.output/public /srv
COPY docker/Caddyfile /etc/caddy/Caddyfile
EXPOSE 80
