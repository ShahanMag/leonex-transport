const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

// === 🧾 New Excel Download Reports ===
router.get('/companies', reportController.getCompanyReport);
router.get('/drivers', reportController.getDriverReport);
router.get('/vehicles', reportController.getVehicleReport);
router.get('/loads', reportController.getLoadReport);
router.get('/payments', reportController.getPaymentReport);

// === 📊 Existing Summary Reports (optional, keep if you use them) ===
router.get('/balance', reportController.getBalanceReport);
router.get('/payment-history', reportController.getPaymentHistory);
router.get('/vehicle-utilization', reportController.getVehicleUtilizationReport);
router.get('/driver-performance', reportController.getDriverPerformanceReport);

module.exports = router;
