# ---- Stage 1: Build the React app ----
FROM node:24.6-alpine AS builder

# Enable corepack (for pnpm)
RUN corepack enable

# Set working directory
WORKDIR /app

RUN ls
COPY .env ./
# Copy dependency files first (for better caching)
COPY package.json pnpm-lock.yaml ./

# Install dependencies (no dev cache pollution)
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the app (transpile TypeScript)
RUN pnpm run build


# ---- Stage 2: Serve with nginx ----
FROM nginx:stable-alpine

# Copy the build output to nginx's web root
COPY --from=builder /app/dist /usr/share/nginx/html

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy our custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80 (Traefik will route to this)
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]