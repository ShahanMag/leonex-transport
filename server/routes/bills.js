const express = require('express');
const router = express.Router();
const billController = require('../controllers/billController');

router.get('/', billController.getAllBills);
router.get('/:id', billController.getBillById);
router.post('/', billController.createBill);
router.put('/:id', billController.updateBill);
router.delete('/:id', billController.deleteBill);

// Installment routes
router.post('/:id/installments', billController.addInstallment);
router.put('/:id/installments/:installmentId', billController.updateInstallment);
router.delete('/:id/installments/:installmentId', billController.deleteInstallment);

module.exports = router;
