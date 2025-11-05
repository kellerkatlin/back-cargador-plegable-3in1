# ---------- Build stage ----------
FROM node:20-alpine AS build
WORKDIR /app

# Habilitar pnpm (puedes usar npm si prefieres)
RUN corepack enable && corepack prepare pnpm@9 --activate

# Instalar deps con lockfile si existe
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile

# Copiar el resto y construir
COPY . .
# (Opcional) pasa variables de build para Vite, solo las que empiecen con VITE_
# docker build --build-arg VITE_API_URL=https://api.tuapp.com .
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

RUN pnpm run build

# Etapa de Producción: nginx
FROM nginx:stable-alpine

# Copiar artefactos
COPY --from=build /app/dist /usr/share/nginx/html

# Config Nginx con fallback a index.html para React Router
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Salud y puerto
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
