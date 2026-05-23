const express = require('express');
const statusController = require('../controllers/status.controller');

const router = express.Router();

router.get('/health', statusController.health);
router.get('/api/health', statusController.apiHealth);
router.get('/db-status', statusController.dbStatus);
router.get('/api/db-status', statusController.dbStatus);
router.get('/', statusController.root);

module.exports = router;
