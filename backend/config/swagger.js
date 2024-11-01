const swaggerJsdoc = require('swagger-jsdoc');
const YAML = require('yamljs');
const path = require('path');

const swaggerDocument = YAML.load(path.join(__dirname, '../swagger.yaml'));

const options = {
  definition: swaggerDocument,
  apis: ['./routes/*.js'], // Path to the API routes
};

module.exports = swaggerJsdoc(options);
