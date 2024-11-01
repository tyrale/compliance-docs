const express = require('express');
const swaggerUi = require('swagger-ui-express');
const specs = require('../config/swagger');

const router = express.Router();

router.use('/', swaggerUi.serve);
router.get('/', swaggerUi.setup(specs, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
}));

module.exports = router;
