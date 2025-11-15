const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

/**
 * GET /api/dashboard/monthly-rental-analytics
 *
 * Get monthly rental analytics with rental amount, company cost, and profit
 *
 * Query params:
 * - year: Target year (default: current year)
 */
router.get('/monthly-rental-analytics', dashboardController.getMonthlyRentalAnalytics);

module.exports = router;
