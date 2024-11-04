require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const { errorHandler } = require('./middleware/errorMiddleware');
const docsRouter = require('./routes/docs');

// Import routes testing summaries
const userRoutes = require('./routes/userRoutes');
const documentRoutes = require('./routes/documentRoutes');
const searchRoutes = require('./routes/searchRoutes');
const sectionRoutes = require('./routes/sectionRoutes');
const annotationRoutes = require('./routes/annotationRoutes');

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Increase timeout for file uploads
app.use((req, res, next) => {
  // Set longer timeout for upload routes
  if (req.url.includes('/documents') && req.method === 'POST') {
    res.setTimeout(300000, () => {
      res.status(408).send('Upload request timeout');
    });
  } else {
    res.setTimeout(300000, () => {
      res.status(408).send('Request timeout');
    });
  }
  next();
});

// Enable compression for responses
const compression = require('compression');
app.use(compression());

// Static file serving for uploads
app.use('/uploads', express.static('uploads'));

// API Documentation
app.use('/api-docs', docsRouter);

// Routes
app.use('/api/users', userRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/sections', sectionRoutes);
app.use('/api/annotations', annotationRoutes);

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5001;

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Increase server timeout
server.timeout = 300000; // 5 minutes

// Enable keep-alive
server.keepAliveTimeout = 120000; // 2 minutes
server.headersTimeout = 120000; // 2 minutes
