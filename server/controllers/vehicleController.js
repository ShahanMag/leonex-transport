const Vehicle = require('../models/Vehicle');

// Get all vehicles
exports.getAllVehicles = async (req, res) => {
  try {
    const vehicles = await Vehicle.find().populate('company_id', 'name');
    res.status(200).json(vehicles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get vehicle by ID
exports.getVehicleById = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id).populate('company_id', 'name');
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
    res.status(200).json(vehicle);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get vehicles by company
exports.getVehiclesByCompany = async (req, res) => {
  try {
    const vehicles = await Vehicle.find({ company_id: req.params.companyId }).populate('company_id', 'name');
    res.status(200).json(vehicles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create vehicle
exports.createVehicle = async (req, res) => {
  const { company_id, vehicle_type, plate_no, rent_price, status, manufacturer, year, capacity } = req.body;
  try {
    const vehicle = new Vehicle({
      company_id,
      vehicle_type,
      plate_no,
      rent_price,
      status,
      manufacturer,
      year,
      capacity,
    });
    const savedVehicle = await vehicle.save();
    const populated = await savedVehicle.populate('company_id', 'name');
    res.status(201).json(populated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update vehicle
exports.updateVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).populate('company_id', 'name');
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
    res.status(200).json(vehicle);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete vehicle
exports.deleteVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findByIdAndDelete(req.params.id);
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
    res.status(200).json({ message: 'Vehicle deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
