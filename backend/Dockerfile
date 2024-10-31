# Build stage
FROM node:18-alpine as builder

# Install build dependencies for PDF processing
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    giflib-dev

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Production stage
FROM node:18-alpine

# Install runtime dependencies
RUN apk add --no-cache \
    cairo \
    jpeg \
    pango \
    giflib \
    # PDF processing dependencies
    poppler-utils \
    ghostscript

WORKDIR /app

# Copy built node modules and source code
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app ./

# Create uploads directory
RUN mkdir -p uploads && chown -R node:node uploads

# Switch to non-root user
USER node

# Expose port
EXPOSE 5000

# Set environment variables
ENV NODE_ENV=production

# Start the application
CMD ["npm", "start"]
