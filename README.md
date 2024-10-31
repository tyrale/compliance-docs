# Compliance Document Management System

A comprehensive system for managing, versioning, and searching compliance documents with advanced features for annotations and section management.

## Features

- 📄 Document Management
  - PDF document upload and storage
  - Version control
  - Section management
  - Annotation support

- 🔍 Advanced Search
  - Full-text search
  - Section-based search
  - Search history tracking
  - Advanced filters

- 👥 User Management
  - Authentication and authorization
  - Role-based access control
  - User profiles

- 📱 Modern UI
  - Responsive design
  - Real-time updates
  - Intuitive interface

## Technology Stack

### Frontend
- React with Vite
- Redux Toolkit for state management
- Material-UI components
- React Router for navigation
- PDF.js for document viewing

### Backend
- Node.js with Express
- MongoDB for document storage
- Elasticsearch for search functionality
- Redis for caching
- JWT for authentication

### Infrastructure
- Docker containerization
- Nginx for frontend serving
- RESTful API architecture

## Getting Started

### Prerequisites
- Docker and Docker Compose
- Node.js (for development)
- MongoDB
- Elasticsearch
- Redis

### Installation

1. Clone the repository:
```bash
git clone [repository-url]
cd compliance-docs
```

2. Create environment files:
```bash
cp .env.example .env
```

3. Start the application using Docker:
```bash
docker-compose up -d
```

The application will be available at:
- Frontend: http://localhost
- Backend API: http://localhost/api
- Elasticsearch: http://localhost:9200
- MongoDB: localhost:27017
- Redis: localhost:6379

### Development Setup

1. Install frontend dependencies:
```bash
cd frontend
npm install
```

2. Install backend dependencies:
```bash
cd backend
npm install
```

3. Start development servers:
```bash
# Frontend
cd frontend
npm run dev

# Backend
cd backend
npm run dev
```

## Project Structure

```
.
├── frontend/                # React frontend application
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API services
│   │   └── store/         # Redux store and slices
│   └── public/            # Static assets
│
├── backend/               # Node.js backend application
│   ├── controllers/      # Route controllers
│   ├── models/          # Database models
│   ├── routes/          # API routes
│   ├── middleware/      # Custom middleware
│   └── utils/           # Utility functions
│
└── docker/              # Docker configuration files
```

## API Documentation

Detailed API documentation is available at `/api/docs` when running the application.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- PDF.js for PDF rendering
- Material-UI for the component library
- Elasticsearch for search functionality
