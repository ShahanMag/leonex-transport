const Load = require('../models/Load');
const Vehicle = require('../models/Vehicle');

// Helper function to calculate days between dates
const calculateDaysRented = (startDate, endDate) => {
  if (!startDate || !endDate) return null;
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

// Helper function to calculate actual rental cost
const calculateActualRentalCost = (daysRented, driverRentalPrice) => {
  if (!daysRented || !driverRentalPrice) return null;
  return daysRented * driverRentalPrice;
};

// Get all loads
exports.getAllLoads = async (req, res) => {
  try {
    const loads = await Load.find()
      .populate('vehicle_id', 'plate_no vehicle_type driver_rental_price driver_rental_type')
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
      .populate('vehicle_id', 'plate_no vehicle_type driver_rental_price driver_rental_type')
      .populate('driver_id', 'name contact');
    if (!load) return res.status(404).json({ message: 'Load not found' });
    res.status(200).json(load);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create load
exports.createLoad = async (req, res) => {
  const { vehicle_id, from_location, to_location, load_description, rental_amount, start_date, end_date, distance_km } = req.body;
  try {
    // Get vehicle to access driver_rental_price
    const vehicle = await Vehicle.findById(vehicle_id);
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    // Calculate days_rented if dates are provided
    const days_rented = calculateDaysRented(start_date, end_date);

    // Calculate actual_rental_cost (days × driver_rental_price)
    const actual_rental_cost = calculateActualRentalCost(days_rented, vehicle.driver_rental_price);

    const load = new Load({
      vehicle_id,
      from_location,
      to_location,
      load_description,
      rental_amount,
      start_date,
      end_date,
      distance_km,
      days_rented,
      actual_rental_cost,
    });
    const savedLoad = await load.save();
    const populated = await savedLoad.populate([
      { path: 'vehicle_id', select: 'plate_no vehicle_type driver_rental_price driver_rental_type' },
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
    const load = await Load.findById(req.params.id);
    if (!load) return res.status(404).json({ message: 'Load not found' });

    // Get vehicle to access driver_rental_price
    const vehicle = await Vehicle.findById(load.vehicle_id);

    // Prepare update data
    const updateData = { ...req.body };

    // Recalculate days_rented and actual_rental_cost if dates are provided
    const startDate = updateData.start_date || load.start_date;
    const endDate = updateData.end_date || load.end_date;

    const days_rented = calculateDaysRented(startDate, endDate);
    if (days_rented) {
      updateData.days_rented = days_rented;
      updateData.actual_rental_cost = calculateActualRentalCost(days_rented, vehicle.driver_rental_price);
    }

    const updatedLoad = await Load.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate([
      { path: 'vehicle_id', select: 'plate_no vehicle_type driver_rental_price driver_rental_type' },
      { path: 'driver_id', select: 'name contact' }
    ]);

    res.status(200).json(updatedLoad);
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
