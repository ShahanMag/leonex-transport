const express = require('express');
const router = express.Router();
const vehicleController = require('../controllers/vehicleController');

router.get('/', vehicleController.getAllVehicles);
router.get('/search', vehicleController.searchVehicles);
router.get('/filter', vehicleController.filterVehicles);
router.get('/:id', vehicleController.getVehicleById);
router.get('/company/:companyId', vehicleController.getVehiclesByCompany);
router.post('/', vehicleController.createVehicle);
router.put('/:id', vehicleController.updateVehicle);
router.delete('/:id', vehicleController.deleteVehicle);

module.exports = router;
