const express = require('express');
const router = express.Router();
const vehicleTypeController = require('../controllers/vehicleTypeController');

router.get('/', vehicleTypeController.getAllVehicleTypes);
router.get('/:id', vehicleTypeController.getVehicleTypeById);
router.post('/', vehicleTypeController.createVehicleType);
router.put('/:id', vehicleTypeController.updateVehicleType);
router.delete('/:id', vehicleTypeController.deleteVehicleType);

module.exports = router;
