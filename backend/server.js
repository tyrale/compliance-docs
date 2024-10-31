const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { errorHandler } = require('./middleware/errorMiddleware');
const connectDB = require('./config/db');
const { initializeElasticsearch } = require('./config/elasticsearch');
const path = require('path');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

// Initialize Elasticsearch
initializeElasticsearch().catch(console.error);

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/documents', require('./routes/documentRoutes'));
app.use('/api/search', require('./routes/searchRoutes'));

// Error handling middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
