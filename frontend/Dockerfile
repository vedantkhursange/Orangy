# Build Stage — Node 20 (alpine) matching the dev toolchain
FROM node:20-alpine AS build
WORKDIR /app
# Copy manifests and install dependencies first (caches the deps layer)
COPY package.json package-lock.json ./
RUN npm ci
# Copy the source and build the standalone server bundle
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Runtime Stage — minimal Node runtime with the standalone output
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# Standalone server + static assets + public files (film frames, images)
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
# Non-root runtime user
RUN addgroup -S orangy && adduser -S orangy -G orangy && chown -R orangy:orangy /app
USER orangy
# Expose the Next.js port
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
# BACKEND_URL is provided by K8s (in-cluster service); rewrites read it at startup
ENTRYPOINT ["node", "server.js"]
