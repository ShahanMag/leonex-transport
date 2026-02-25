const VehicleType = require('../models/VehicleType');

exports.getAllVehicleTypes = async (req, res) => {
  try {
    const vehicleTypes = await VehicleType.find().sort({ createdAt: -1 });
    res.status(200).json(vehicleTypes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getVehicleTypeById = async (req, res) => {
  try {
    const vehicleType = await VehicleType.findById(req.params.id);
    if (!vehicleType) return res.status(404).json({ message: 'Vehicle type not found' });
    res.status(200).json(vehicleType);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createVehicleType = async (req, res) => {
  try {
    const { name, isAvailable } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Vehicle type name is required' });
    }

    const existing = await VehicleType.findOne({ name: name.trim() });
    if (existing) {
      return res.status(400).json({ message: 'Vehicle type already exists' });
    }

    const vehicleType = new VehicleType({
      name: name.trim(),
      isAvailable: isAvailable !== undefined ? isAvailable : true,
    });

    const saved = await vehicleType.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateVehicleType = async (req, res) => {
  try {
    const { name, isAvailable } = req.body;

    const vehicleType = await VehicleType.findById(req.params.id);
    if (!vehicleType) return res.status(404).json({ message: 'Vehicle type not found' });

    if (name && name.trim() !== vehicleType.name) {
      const existing = await VehicleType.findOne({ name: name.trim() });
      if (existing) {
        return res.status(400).json({ message: 'Vehicle type already exists' });
      }
      vehicleType.name = name.trim();
    }

    if (isAvailable !== undefined) vehicleType.isAvailable = isAvailable;

    const updated = await vehicleType.save();
    res.status(200).json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteVehicleType = async (req, res) => {
  try {
    const vehicleType = await VehicleType.findByIdAndDelete(req.params.id);
    if (!vehicleType) return res.status(404).json({ message: 'Vehicle type not found' });
    res.status(200).json({ message: 'Vehicle type deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
