const Driver = require('../models/Driver');
const codeGenerator = require('../utils/codeGenerator');

// Get all drivers
exports.getAllDrivers = async (req, res) => {
  try {
    const drivers = await Driver.find();
    res.status(200).json(drivers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get driver by ID
exports.getDriverById = async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.id);
    if (!driver) return res.status(404).json({ message: 'Driver not found' });
    res.status(200).json(driver);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create driver
exports.createDriver = async (req, res) => {
  const {
    name,
    contact,
    license_no,
    iqama_id,
    status,
    email,
    phone_country_code = '+966',
    phone_number,
    address,
  } = req.body;

  try {
    // Auto-generate driver code
    const driver_code = await codeGenerator.generateDriverCode();

    const driver = new Driver({
      driver_code,
      name,
      contact,
      license_no,
      iqama_id,
      status: status || 'active',
      email,
      phone_country_code,
      phone_number,
      address,
    });

    const savedDriver = await driver.save();
    res.status(201).json(savedDriver);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update driver
exports.updateDriver = async (req, res) => {
  try {
    const driver = await Driver.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!driver) return res.status(404).json({ message: 'Driver not found' });
    res.status(200).json(driver);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete driver
exports.deleteDriver = async (req, res) => {
  try {
    const driver = await Driver.findByIdAndDelete(req.params.id);
    if (!driver) return res.status(404).json({ message: 'Driver not found' });
    res.status(200).json({ message: 'Driver deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
