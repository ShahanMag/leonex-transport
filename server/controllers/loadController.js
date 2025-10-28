const Load = require('../models/Load');
const Vehicle = require('../models/Vehicle');

// Get all loads
exports.getAllLoads = async (req, res) => {
  try {
    const loads = await Load.find()
      .populate('vehicle_id', 'plate_no vehicle_type')
      .populate('driver_id', 'name contact');
    res.status(200).json(loads);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get load by ID
exports.getLoadById = async (req, res) => {
  try {
    const load = await Load.findById(req.params.id)
      .populate('vehicle_id', 'plate_no vehicle_type')
      .populate('driver_id', 'name contact');
    if (!load) return res.status(404).json({ message: 'Load not found' });
    res.status(200).json(load);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create load
exports.createLoad = async (req, res) => {
  const { vehicle_id, from_location, to_location, load_description, rent_amount, start_date, end_date } = req.body;
  try {
    const load = new Load({
      vehicle_id,
      from_location,
      to_location,
      load_description,
      rent_amount,
      start_date,
      end_date,
    });
    const savedLoad = await load.save();
    const populated = await savedLoad.populate([
      { path: 'vehicle_id', select: 'plate_no vehicle_type' },
      { path: 'driver_id', select: 'name contact' }
    ]);
    res.status(201).json(populated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update load
exports.updateLoad = async (req, res) => {
  try {
    const load = await Load.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).populate([
      { path: 'vehicle_id', select: 'plate_no vehicle_type' },
      { path: 'driver_id', select: 'name contact' }
    ]);
    if (!load) return res.status(404).json({ message: 'Load not found' });
    res.status(200).json(load);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Assign driver to load
exports.assignDriver = async (req, res) => {
  const { driver_id } = req.body;
  try {
    const load = await Load.findByIdAndUpdate(
      req.params.id,
      { driver_id, status: 'assigned' },
      { new: true }
    ).populate([
      { path: 'vehicle_id', select: 'plate_no vehicle_type' },
      { path: 'driver_id', select: 'name contact' }
    ]);
    if (!load) return res.status(404).json({ message: 'Load not found' });

    // Update vehicle status to rented
    await Vehicle.findByIdAndUpdate(load.vehicle_id, { status: 'rented' });

    res.status(200).json(load);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete load
exports.deleteLoad = async (req, res) => {
  try {
    const load = await Load.findByIdAndDelete(req.params.id);
    if (!load) return res.status(404).json({ message: 'Load not found' });
    res.status(200).json({ message: 'Load deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
