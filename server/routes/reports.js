const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

// 📊 JSON report endpoints
router.get('/company-payments', reportController.getCompanyPaymentsJSON);
router.get('/rental-payments', reportController.getRentalPaymentsJSON);
router.get('/combined-report', reportController.getCombinedReportJSON);
router.get('/profit-loss', reportController.getProfitLossReportJSON);

// 📈 Excel report endpoints
router.get('/payments/company', reportController.getCompanyPaymentsReport);
router.get('/payments/rental', reportController.getRentalPaymentsReport);
router.get('/combined-report/excel', reportController.getCombinedReportExcel);
router.get('/profit-loss/excel', reportController.getProfitLossReportExcel);
router.get('/companies', reportController.getCompanyReport);
router.get('/drivers', reportController.getDriverReport);
router.get('/vehicles', reportController.getVehicleReport);
router.get('/loads', reportController.getLoadReport);

// 💵 Bills (Income & Expense) report
router.get('/bills', reportController.getBillsReportJSON);
router.get('/bills/excel', reportController.getBillsReportExcel);

// 🧾 Invoices report
router.get('/invoices', reportController.getInvoicesReportJSON);
router.get('/invoices/excel', reportController.getInvoicesReportExcel);

module.exports = router;
