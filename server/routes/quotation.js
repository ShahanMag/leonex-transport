const express = require('express');
const router = express.Router();
const quotationController = require('../controllers/quotationController');

// 🔹 Get all quotations
router.get('/', quotationController.getAllQuotations);

// 🔹 Get single quotation by ID
router.get('/:id', quotationController.getQuotationById);

// 🔹 Create quotation
router.post('/', quotationController.createQuotation);

// 🔹 Update quotation
router.put('/:id', quotationController.updateQuotation);

// 🔹 Delete quotation
router.delete('/:id', quotationController.deleteQuotation);

module.exports = router;