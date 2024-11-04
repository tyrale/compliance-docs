const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const { initializeElasticsearch } = require('./config/elasticsearch');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');
const swaggerDocument = YAML.load(path.join(__dirname, 'swagger.yaml'));

// Import routes
const documentRoutes = require('./routes/documentRoutes');
const userRoutes = require('./routes/userRoutes');
const searchRoutes = require('./routes/searchRoutes');
const annotationRoutes = require('./routes/annotationRoutes');
const versionRoutes = require('./routes/versionRoutes');
const sectionRoutes = require('./routes/sectionRoutes');

const app = express();

// Connect to MongoDB
connectDB();
// Connect to Elasticsearch
initializeElasticsearch();

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Routes
app.use('/api/documents', documentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/annotations', annotationRoutes);
app.use('/api/versions', versionRoutes);
app.use('/api/sections', sectionRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
