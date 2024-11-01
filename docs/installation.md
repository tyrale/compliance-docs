# Installation Guide

This guide will walk you through the process of setting up the Compliance Documents Management System in both development and production environments.

## Prerequisites

Before installing the system, ensure you have the following prerequisites installed:

- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- Elasticsearch (v7.9 or higher)
- Docker and Docker Compose
- Git

## Development Setup

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/compliance-docs.git
cd compliance-docs
```

### 2. Environment Configuration

1. Create `.env` files for both frontend and backend:

```bash
# Backend (.env)
PORT=5000
MONGODB_URI=mongodb://localhost:27017/compliance-docs
ELASTICSEARCH_NODE=http://localhost:9200
JWT_SECRET=your_jwt_secret
NODE_ENV=development

# Frontend (.env)
VITE_API_URL=http://localhost:5000/api
```

### 3. Install Dependencies

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 4. Start Development Servers

```bash
# Start backend server
cd backend
npm run dev

# Start frontend development server
cd frontend
npm run dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- API Documentation: http://localhost:5000/api-docs

## Production Deployment

### 1. Using Docker Compose

1. Configure production environment variables in `.env`:

```bash
# .env
MONGODB_URI=mongodb://mongodb:27017/compliance-docs
ELASTICSEARCH_NODE=http://elasticsearch:9200
JWT_SECRET=your_production_jwt_secret
NODE_ENV=production
```

2. Build and start the containers:

```bash
docker-compose up -d
```

This will start:
- Frontend container (Nginx)
- Backend container (Node.js)
- MongoDB container
- Elasticsearch container

### 2. Manual Deployment

If you prefer to deploy without Docker:

1. Build the frontend:
```bash
cd frontend
npm run build
```

2. Serve the frontend build using Nginx or another web server

3. Start the backend server:
```bash
cd backend
npm start
```

## SSL/TLS Configuration

For production deployments, configure SSL/TLS:

1. Obtain SSL certificates (e.g., using Let's Encrypt)
2. Configure Nginx with SSL:

```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # Frontend
    location / {
        root /usr/share/nginx/html;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://backend:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Troubleshooting

### Common Issues

1. MongoDB Connection Issues
   - Verify MongoDB is running
   - Check connection string in `.env`
   - Ensure network connectivity

2. Elasticsearch Issues
   - Verify Elasticsearch is running
   - Check cluster health: `curl -X GET "localhost:9200/_cluster/health"`
   - Ensure proper memory allocation

3. Frontend API Connection
   - Verify API URL in frontend `.env`
   - Check CORS configuration
   - Ensure backend is running

For more detailed troubleshooting, refer to the maintenance guide.
