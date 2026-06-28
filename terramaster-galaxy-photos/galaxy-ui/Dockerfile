# Build the static React app, then serve it with nginx which also reverse-
# proxies /immich/* to the Immich server and injects the API key.
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/templates/default.conf.template
# nginx:alpine's entrypoint runs envsubst on templates using these vars.
ENV IMMICH_URL=http://immich-server:2283
ENV IMMICH_API_KEY=""
EXPOSE 80
