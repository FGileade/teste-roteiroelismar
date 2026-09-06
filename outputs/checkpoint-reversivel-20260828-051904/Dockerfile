# Use Node.js LTS light image
FROM node:20-slim

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy built code and assets
COPY dist ./dist

EXPOSE 3000

ENV NODE_ENV=production

# Start Express server
CMD ["node", "dist/server.cjs"]
