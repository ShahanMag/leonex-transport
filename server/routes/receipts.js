const express = require('express');
const router = express.Router();
const receiptController = require('../controllers/receiptController');

// Generate company payment summary receipt
router.get('/company/:paymentId', receiptController.generateCompanyReceipt);

// Generate driver rental payment summary receipt
router.get('/driver/:paymentId', receiptController.generateDriverReceipt);

// Generate company payment installment receipt
router.get('/company/:paymentId/installment/:installmentId', receiptController.generateCompanyInstallmentReceipt);

// Generate driver rental payment installment receipt
router.get('/driver/:paymentId/installment/:installmentId', receiptController.generateDriverInstallmentReceipt);

module.exports = router;
