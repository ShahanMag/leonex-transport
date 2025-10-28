const express = require('express');
const router = express.Router();
const loadController = require('../controllers/loadController');

router.get('/', loadController.getAllLoads);
router.get('/:id', loadController.getLoadById);
router.post('/', loadController.createLoad);
router.put('/:id', loadController.updateLoad);
router.put('/:id/assign-driver', loadController.assignDriver);
router.delete('/:id', loadController.deleteLoad);

module.exports = router;
