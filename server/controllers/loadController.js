const Load = require('../models/Load');
const Vehicle = require('../models/Vehicle');
const Payment = require('../models/Payment');
const Driver = require('../models/Driver');
const Company = require('../models/Company');
const codeGenerator = require('../utils/codeGenerator');

// Helper function to calculate days between dates
const calculateDaysRented = (startDate, endDate) => {
  if (!startDate || !endDate) return null;
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

// Helper function to calculate rental amount based on pricing type
const calculateRentalAmount = (rentalType, rentalPricePerDay, daysRented, distanceKm) => {
  if (rentalType === 'per_day') {
    return daysRented * rentalPricePerDay;
  } else if (rentalType === 'per_job') {
    return rentalPricePerDay; // Fixed price per job
  } else if (rentalType === 'per_km') {
    return distanceKm * rentalPricePerDay;
  }
  return null;
};

// Get all loads
exports.getAllLoads = async (req, res) => {
  try {
    const loads = await Load.find()
      .populate('vehicle_id', 'plate_no vehicle_type vehicle_code')
      .populate('driver_id', 'name contact driver_code');
    res.status(200).json(loads);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Search loads by rental code or vehicle plate number
exports.searchLoads = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    // Find vehicles matching the plate number
    const vehicles = await Vehicle.find({
      plate_no: { $regex: query, $options: 'i' }
    });
    const vehicleIds = vehicles.map(v => v._id);

    // Search loads by rental code OR vehicle plate number
    const loads = await Load.find({
      $or: [
        { rental_code: { $regex: query, $options: 'i' } },
        { vehicle_id: { $in: vehicleIds } }
      ]
    })
      .populate('vehicle_id', 'plate_no vehicle_type vehicle_code')
      .populate('driver_id', 'name contact driver_code');

    res.status(200).json(loads);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Filter loads by vehicle
exports.filterLoadsByVehicle = async (req, res) => {
  try {
    const { vehicle_id } = req.query;

    if (!vehicle_id) {
      return res.status(400).json({ message: 'vehicle_id is required' });
    }

    const loads = await Load.find({ vehicle_id })
      .populate('vehicle_id', 'plate_no vehicle_type vehicle_code')
      .populate('driver_id', 'name contact driver_code');

    res.status(200).json(loads);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get load by ID
exports.getLoadById = async (req, res) => {
  try {
    const load = await Load.findById(req.params.id)
      .populate('vehicle_id', 'plate_no vehicle_type vehicle_code')
      .populate('driver_id', 'name contact driver_code');
    if (!load) return res.status(404).json({ message: 'Load not found' });
    res.status(200).json(load);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create load
exports.createLoad = async (req, res) => {
  const {
    vehicle_id,
    from_location,
    to_location,
    load_description,
    rental_price_per_day,
    rental_type = 'per_day',
    start_date,
    end_date,
    distance_km,
  } = req.body;

  try {
    // Get vehicle and company
    const vehicle = await Vehicle.findById(vehicle_id).populate('company_id');
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    // Auto-generate rental code
    const rental_code = await codeGenerator.generateRentalCode();

    // Calculate days_rented if dates are provided
    const days_rented = calculateDaysRented(start_date, end_date);

    // Calculate rental_amount based on pricing type
    const rental_amount = calculateRentalAmount(rental_type, rental_price_per_day, days_rented, distance_km);

    const load = new Load({
      rental_code,
      vehicle_id,
      from_location,
      to_location,
      load_description,
      rental_price_per_day,
      rental_type,
      rental_amount,
      actual_rental_cost: rental_amount,
      start_date,
      end_date,
      distance_km,
      days_rented,
    });

    const savedLoad = await load.save();

    // Auto-create rental payment with installment structure (payment created when load is created)
    const payment = new Payment({
      payer: 'Driver', // Will be updated when driver is assigned
      payee: vehicle?.company_id?.name || 'Unknown',
      payee_id: vehicle?.company_id?._id,
      total_amount: rental_amount,
      total_paid: 0,
      total_due: rental_amount,
      description: `Rental payment for ${rental_code} - ${from_location} to ${to_location}`,
      payment_type: 'driver-rental',
      status: 'unpaid',
      vehicle_id: vehicle_id,
      load_id: savedLoad._id,
      transaction_date: new Date(start_date),
      installments: [],
    });

    const savedPayment = await payment.save();

    const populated = await savedLoad.populate([
      { path: 'vehicle_id', select: 'plate_no vehicle_type vehicle_code' },
      { path: 'driver_id', select: 'name contact driver_code' },
    ]);

    res.status(201).json({
      ...populated.toObject(),
      auto_payment_id: savedPayment._id,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update load
exports.updateLoad = async (req, res) => {
  try {
    const load = await Load.findById(req.params.id);
    if (!load) return res.status(404).json({ message: 'Load not found' });

    // Prepare update data
    const updateData = { ...req.body };

    // Recalculate days_rented and rental_amount if dates or pricing changed
    const startDate = updateData.start_date || load.start_date;
    const endDate = updateData.end_date || load.end_date;
    const rentalType = updateData.rental_type || load.rental_type;
    const rentalPricePerDay = updateData.rental_price_per_day || load.rental_price_per_day;
    const distanceKm = updateData.distance_km || load.distance_km;

    const days_rented = calculateDaysRented(startDate, endDate);
    if (days_rented) {
      updateData.days_rented = days_rented;
      const rentalAmount = calculateRentalAmount(rentalType, rentalPricePerDay, days_rented, distanceKm);
      updateData.rental_amount = rentalAmount;
      updateData.actual_rental_cost = rentalAmount;
    }

    const updatedLoad = await Load.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate([
      { path: 'vehicle_id', select: 'plate_no vehicle_type vehicle_code' },
      { path: 'driver_id', select: 'name contact driver_code' },
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
      { path: 'vehicle_id', select: 'plate_no vehicle_type vehicle_code' },
      { path: 'driver_id', select: 'name contact driver_code' },
    ]);
    if (!load) return res.status(404).json({ message: 'Load not found' });

    // Update vehicle status to rented
    await Vehicle.findByIdAndUpdate(load.vehicle_id, { status: 'rented' });

    // Update payment payer with driver info
    const driver = await Driver.findById(driver_id);
    await Payment.findOneAndUpdate(
      { load_id: load._id },
      {
        payer: driver?.name || 'Unknown',
        payer_id: driver_id,
        driver_id: driver_id
      }
    );

    res.status(200).json(load);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Complete load
exports.completeLoad = async (req, res) => {
  try {
    const load = await Load.findById(req.params.id);

    if (!load) return res.status(404).json({ message: 'Load not found' });

    // Update load status to completed
    const updatedLoad = await Load.findByIdAndUpdate(
      req.params.id,
      { status: 'completed' },
      { new: true }
    ).populate([
      { path: 'vehicle_id', select: 'plate_no vehicle_type vehicle_code' },
      { path: 'driver_id', select: 'name contact driver_code' },
    ]);

    // Update vehicle status back to available
    await Vehicle.findByIdAndUpdate(load.vehicle_id, { status: 'available' });

    res.status(200).json(updatedLoad);
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
