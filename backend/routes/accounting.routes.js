const express = require('express');
const accountingController = require('../controllers/accounting.controller');

const router = express.Router();

router.get('/accounts', accountingController.getAccounts);
router.get('/journal-entries', accountingController.getJournalEntries);
router.post('/journal-entries', accountingController.postJournalEntry);
router.get('/trial-balance', accountingController.getTrialBalance);

module.exports = router;
