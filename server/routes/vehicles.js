const express = require('express');
const router = express.Router();

// Vehicle management has been deprecated
// Vehicles are now managed through the unified rental transaction endpoint

router.get('/', (req, res) => {
  res.status(410).json({
    message: 'Vehicle management endpoint has been deprecated',
    reason: 'Vehicles are now embedded in Payment and Load records',
    useInstead: 'POST /api/transactions/rental'
  });
});

router.get('/search', (req, res) => {
  res.status(410).json({
    message: 'Vehicle search endpoint has been deprecated',
    reason: 'Search payments by plate_no or vehicle_type instead',
    useInstead: 'GET /api/payments/search'
  });
});

router.get('/filter', (req, res) => {
  res.status(410).json({
    message: 'Vehicle filter endpoint has been deprecated',
    reason: 'Filter loads by vehicle_type instead',
    useInstead: 'GET /api/loads/filter'
  });
});

router.get('/:id', (req, res) => {
  res.status(410).json({
    message: 'Vehicle retrieval endpoint has been deprecated',
    reason: 'Vehicles are now embedded in Payment and Load records',
    useInstead: 'POST /api/transactions/rental'
  });
});

router.get('/company/:companyId', (req, res) => {
  res.status(410).json({
    message: 'Vehicle lookup by company endpoint has been deprecated',
    reason: 'Vehicle data is stored in Payment records',
    useInstead: 'GET /api/payments'
  });
});

router.post('/', (req, res) => {
  res.status(410).json({
    message: 'Vehicle creation endpoint has been deprecated',
    reason: 'Vehicles are created as part of the unified rental transaction',
    useInstead: 'POST /api/transactions/rental'
  });
});

router.put('/:id', (req, res) => {
  res.status(410).json({
    message: 'Vehicle update endpoint has been deprecated',
    reason: 'Vehicles are created as part of the unified rental transaction',
    useInstead: 'POST /api/transactions/rental'
  });
});

router.delete('/:id', (req, res) => {
  res.status(410).json({
    message: 'Vehicle deletion endpoint has been deprecated',
    reason: 'Vehicles are managed through rental transactions',
    useInstead: 'POST /api/transactions/rental'
  });
});

module.exports = router;
