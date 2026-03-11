const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController');

router.get('/',       invoiceController.getAllInvoices);
router.get('/:id',    invoiceController.getInvoiceById);
router.post('/bulk',  invoiceController.bulkCreateInvoices);  // must be before /:id
router.post('/',      invoiceController.createInvoice);
router.put('/:id',    invoiceController.updateInvoice);
router.delete('/:id', invoiceController.deleteInvoice);

// Installments (track = 'amount' or 'commission')
router.post('/:id/installments/:track',                          invoiceController.addInstallment);
router.put('/:id/installments/:track/:installmentId',            invoiceController.updateInstallment);
router.delete('/:id/installments/:track/:installmentId',         invoiceController.deleteInstallment);

module.exports = router;
