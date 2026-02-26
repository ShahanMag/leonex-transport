const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');

/**
 * POST /api/transactions/rental
 *
 * Create a unified rental transaction
 * Handles: Company creation/selection, Driver creation/selection,
 *          Acquisition payment, Rental payment, and Load creation
 *
 * Request body:
 * {
 *   // Company (either company_id OR company_name required)
 *   company_id?: string,
 *   company_name?: string,
 *   company_contact?: string,
 *   company_address?: string,
 *   company_email?: string,
 *   company_phone_country_code?: string (default: '+91'),
 *   company_phone_number?: string,
 *
 *   // Driver (either driver_id OR (driver_name + driver_iqama_id) required)
 *   driver_id?: string,
 *   driver_name?: string,
 *   driver_iqama_id?: string,
 *   driver_phone_country_code?: string (default: '+966'),
 *   driver_phone_number?: string,
 *
 *   // Vehicle & Acquisition (required)
 *   vehicle_type: string (e.g., "Truck", "Van"),
 *   plate_no?: string,
 *   acquisition_cost: number,
 *   acquisition_date: date,
 *
 *   // Load & Rental (required)
 *   from_location: string,
 *   to_location: string,
 *   load_description?: string,
 *   rental_price_per_day: number,
 *   rental_type?: string ("per_day" | "per_job" | "per_km", default: "per_day"),
 *   rental_date?: date,
 *   start_date: date,
 *   end_date: date,
 *   distance_km?: number
 * }
 */
router.post('/rental', transactionController.createRentalTransaction);
router.post('/rental/bulk', transactionController.bulkCreateRentalTransactions);
router.get('/rental/:id', transactionController.getRentalTransactionById);
router.put('/rental/:id', transactionController.updateRentalTransaction);

module.exports = router;
