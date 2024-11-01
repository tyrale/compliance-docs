require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const { errorHandler } = require('./middleware/errorMiddleware');
const docsRouter = require('./routes/docs');

// Import routes
const userRoutes = require('./routes/userRoutes');
const documentRoutes = require('./routes/documentRoutes');
const searchRoutes = require('./routes/searchRoutes');
const sectionRoutes = require('./routes/sectionRoutes');
const annotationRoutes = require('./routes/annotationRoutes');
const versionRoutes = require('./routes/versionRoutes');

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// API Documentation
app.use('/api-docs', docsRouter);

// Routes
app.use('/api/users', userRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/sections', sectionRoutes);
app.use('/api/annotations', annotationRoutes);
app.use('/api/versions', versionRoutes);

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
