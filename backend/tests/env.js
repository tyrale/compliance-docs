// Test environment variables
process.env.NODE_ENV = 'test';
process.env.PORT = 5001;
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.MONGO_URI = 'mongodb://localhost:27017/test-db';
process.env.ELASTICSEARCH_NODE = 'http://localhost:9200';
process.env.REDIS_URL = 'redis://localhost:6379';

// Email configuration for testing
process.env.SMTP_HOST = 'smtp.test.com';
process.env.SMTP_PORT = 587;
process.env.SMTP_USER = 'test@example.com';
process.env.SMTP_PASS = 'test-password';

// Storage configuration
process.env.UPLOAD_PATH = './tests/uploads';
process.env.MAX_FILE_SIZE = '10mb';

// Security settings
process.env.CORS_ORIGIN = 'http://localhost:3000';
process.env.RATE_LIMIT_WINDOW = 15;
process.env.RATE_LIMIT_MAX = 100;
