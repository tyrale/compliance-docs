# Configuration Guide

This guide details the configuration settings for the Compliance Documents Management System in a production environment.

## Application Configuration

### 1. Backend Configuration

#### API Server
```javascript
// config/production.js
module.exports = {
  server: {
    port: process.env.PORT || 5000,
    cors: {
      origin: ['https://yourdomain.com'],
      credentials: true
    },
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100 // limit each IP to 100 requests per windowMs
    }
  }
};
```

#### Database
```javascript
// config/database.js
module.exports = {
  mongodb: {
    uri: process.env.MONGODB_URI,
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    }
  },
  elasticsearch: {
    node: process.env.ELASTICSEARCH_NODE,
    auth: {
      username: process.env.ES_USERNAME,
      password: process.env.ES_PASSWORD
    },
    maxRetries: 3,
    requestTimeout: 30000
  }
};
```

#### Authentication
```javascript
// config/auth.js
module.exports = {
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: '24h',
    refreshExpiresIn: '7d'
  },
  password: {
    saltRounds: 12,
    minLength: 8
  }
};
```

### 2. Frontend Configuration

#### Vite Config
```javascript
// vite.config.js
export default defineConfig({
  build: {
    sourcemap: false,
    minify: 'terser',
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          redux: ['@reduxjs/toolkit', 'react-redux']
        }
      }
    }
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://backend:5000',
        changeOrigin: true
      }
    }
  }
});
```

#### Environment Variables
```bash
# .env.production
VITE_API_URL=https://api.yourdomain.com
VITE_ENVIRONMENT=production
VITE_SENTRY_DSN=your-sentry-dsn
```

## Infrastructure Configuration

### 1. Nginx Configuration

```nginx
# nginx.conf
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';
    
    access_log /var/log/nginx/access.log main;
    
    sendfile on;
    keepalive_timeout 65;
    
    # GZIP Configuration
    gzip on;
    gzip_disable "msie6";
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    
    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;
    
    # Frontend Server
    server {
        listen 443 ssl http2;
        server_name yourdomain.com;
        
        ssl_certificate /etc/nginx/ssl/live/yourdomain.com/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/live/yourdomain.com/privkey.pem;
        
        root /usr/share/nginx/html;
        index index.html;
        
        location / {
            try_files $uri $uri/ /index.html;
            expires 1h;
            add_header Cache-Control "public, no-transform";
        }
        
        location /static/ {
            expires 1y;
            add_header Cache-Control "public, no-transform";
        }
        
        location /api/ {
            proxy_pass http://backend:5000;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }
    }
}
```

### 2. Docker Compose Configuration

```yaml
# docker-compose.production.yml
version: '3.8'

services:
  frontend:
    image: ${ECR_REGISTRY}/compliance-docs-frontend:latest
    restart: always
    depends_on:
      - backend
    ports:
      - "443:443"
    volumes:
      - ./ssl:/etc/nginx/ssl
      - ./nginx.conf:/etc/nginx/nginx.conf
    networks:
      - app-network

  backend:
    image: ${ECR_REGISTRY}/compliance-docs-backend:latest
    restart: always
    environment:
      - NODE_ENV=production
      - PORT=5000
      - MONGODB_URI=${MONGODB_URI}
      - ELASTICSEARCH_NODE=${ELASTICSEARCH_NODE}
      - JWT_SECRET=${JWT_SECRET}
    ports:
      - "5000:5000"
    networks:
      - app-network

networks:
  app-network:
    driver: bridge
```

### 3. Monitoring Configuration

#### Prometheus Configuration
```yaml
# prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'compliance-docs'
    static_configs:
      - targets: ['backend:5000']
    metrics_path: '/metrics'
```

#### Grafana Dashboard
```json
{
  "dashboard": {
    "id": null,
    "title": "Compliance Docs Metrics",
    "panels": [
      {
        "title": "API Request Rate",
        "type": "graph",
        "datasource": "Prometheus",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])"
          }
        ]
      }
    ]
  }
}
```

## Security Configuration

### 1. AWS Security Groups

```json
{
  "GroupName": "compliance-docs-sg",
  "Description": "Security group for Compliance Docs",
  "IpPermissions": [
    {
      "IpProtocol": "tcp",
      "FromPort": 80,
      "ToPort": 80,
      "IpRanges": [{"CidrIp": "0.0.0.0/0"}]
    },
    {
      "IpProtocol": "tcp",
      "FromPort": 443,
      "ToPort": 443,
      "IpRanges": [{"CidrIp": "0.0.0.0/0"}]
    }
  ]
}
```

### 2. AWS IAM Policies

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::compliance-docs-bucket",
        "arn:aws:s3:::compliance-docs-bucket/*"
      ]
    }
  ]
}
```

## Backup Configuration

### 1. MongoDB Backup

```javascript
// backup-config.js
module.exports = {
  mongodb: {
    backup: {
      schedule: '0 0 * * *', // Daily at midnight
      retention: 30, // Keep backups for 30 days
      destination: 's3://compliance-docs-backup/mongodb'
    }
  }
};
```

### 2. Elasticsearch Backup

```json
{
  "snapshot": {
    "repository": "s3-repository",
    "schedule": "0 0 * * *",
    "retention": {
      "expire_after": "30d",
      "min_count": 5,
      "max_count": 50
    }
  }
}
