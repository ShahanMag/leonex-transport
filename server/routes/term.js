const express = require('express');
const router = express.Router();
const termController = require('../controllers/termController');

// Get all terms
router.get('/', termController.getAllTerms);

// Get active terms (for quotation selection)
// router.get('/active/list', termController.getActiveTerms);

// Get single term by ID
router.get('/:id', termController.getTermById);

// Create new term
router.post('/', termController.createTerm);

// Update term
router.put('/:id', termController.updateTerm);

// Delete term
router.delete('/:id', termController.deleteTerm);

module.exports = router;