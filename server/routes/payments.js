const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

router.get('/', paymentController.getAllPayments);
router.get('/search', paymentController.searchPayments);
router.get('/filter', paymentController.filterPayments);
router.get('/:id', paymentController.getPaymentById);
router.post('/', paymentController.createPayment);
router.put('/:id', paymentController.updatePayment);
router.post('/:id/installments', paymentController.registerInstallment);
router.put('/:id/installments/:installmentId', paymentController.updateInstallment);
router.delete('/:id/installments/:installmentId', paymentController.deleteInstallment);
router.delete('/:id', paymentController.deletePayment);

module.exports = router;
