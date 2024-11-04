const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const { errorHandler } = require('./middleware/errorMiddleware');
const { staticAuthMiddleware, createStaticMiddleware } = require('./middleware/staticAuthMiddleware');
const swaggerSetup = require('./config/swagger');

// Route imports
const userRoutes = require('./routes/userRoutes');
const documentRoutes = require('./routes/documentRoutes');
const searchRoutes = require('./routes/searchRoutes');
const annotationRoutes = require('./routes/annotationRoutes');
const sectionRoutes = require('./routes/sectionRoutes');
const versionRoutes = require('./routes/versionRoutes');

// Initialize express
const app = express();

// Connect to database
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// API routes
app.use('/api/users', userRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/annotations', annotationRoutes);
app.use('/api/sections', sectionRoutes);
app.use('/api/versions', versionRoutes);

// Serve static files from uploads directory with authentication
app.use('/uploads', staticAuthMiddleware, createStaticMiddleware());

// Swagger documentation
swaggerSetup(app);

// Error handling middleware
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
