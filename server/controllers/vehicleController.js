const Vehicle = require('../models/Vehicle');
const Payment = require('../models/Payment');
const Company = require('../models/Company');
const codeGenerator = require('../utils/codeGenerator');

// Get all vehicles
exports.getAllVehicles = async (req, res) => {
  try {
    const vehicles = await Vehicle.find().populate('company_id', 'name');
    res.status(200).json(vehicles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Search vehicles by plate number
exports.searchVehicles = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const vehicles = await Vehicle.find({
      plate_no: { $regex: query, $options: 'i' } // Case-insensitive search
    }).populate('company_id', 'name');

    res.status(200).json(vehicles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Filter vehicles by date range
exports.filterVehicles = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'startDate and endDate are required' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    const vehicles = await Vehicle.find({
      acquisition_date: {
        $gte: start,
        $lte: end
      }
    }).populate('company_id', 'name');

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
  const {
    company_id,
    vehicle_type,
    plate_no,
    status,
    acquisition_cost,
    acquisition_date,
  } = req.body;

  try {
    // Auto-generate vehicle code
    const vehicle_code = await codeGenerator.generateVehicleCode();

    const vehicle = new Vehicle({
      company_id,
      vehicle_code,
      vehicle_type,
      plate_no,
      status: status || 'available',
      acquisition_cost,
      acquisition_date,
    });

    const savedVehicle = await vehicle.save();

    // Get company details for payment creation
    const company = await Company.findById(company_id);

    // Auto-create acquisition payment with installment structure
    const payment = new Payment({
      payer: company?.name || 'Unknown',
      payer_id: company_id,
      payee: 'Supplier',
      total_amount: acquisition_cost,
      total_paid: 0,
      total_due: acquisition_cost,
      description: `Acquired ${vehicle_type} - ${plate_no}`,
      payment_type: 'vehicle-acquisition',
      status: 'unpaid',
      vehicle_id: savedVehicle._id,
      transaction_date: new Date(acquisition_date),
      installments: [],
    });

    const savedPayment = await payment.save();

    const populated = await savedVehicle.populate('company_id', 'name');

    res.status(201).json({
      ...populated.toObject(),
      auto_payment_id: savedPayment._id,
    });
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
