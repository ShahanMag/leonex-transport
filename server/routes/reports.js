const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

router.get('/balance', reportController.getBalanceReport);
router.get('/payment-history', reportController.getPaymentHistory);
router.get('/vehicle-utilization', reportController.getVehicleUtilizationReport);
router.get('/driver-performance', reportController.getDriverPerformanceReport);

module.exports = router;
