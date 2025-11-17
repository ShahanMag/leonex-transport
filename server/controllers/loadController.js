const Load = require('../models/Load');
const Payment = require('../models/Payment');
const Driver = require('../models/Driver');
const Company = require('../models/Company');
const codeGenerator = require('../utils/codeGenerator');

// Get all loads
exports.getAllLoads = async (req, res) => {
  try {
    const loads = await Load.find()
      .populate('company_id', 'name company_code')
      .populate('driver_id', 'name contact driver_code');
    res.status(200).json(loads);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Search loads by rental code or vehicle type
exports.searchLoads = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    // Search loads by rental code OR vehicle type
    const loads = await Load.find({
      $or: [
        { rental_code: { $regex: query, $options: 'i' } },
        { vehicle_type: { $regex: query, $options: 'i' } }
      ]
    })
      .populate('company_id', 'name company_code')
      .populate('driver_id', 'name contact driver_code');

    res.status(200).json(loads);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Filter loads by vehicle type
exports.filterLoadsByVehicle = async (req, res) => {
  try {
    const { vehicle_type } = req.query;

    if (!vehicle_type) {
      return res.status(400).json({ message: 'vehicle_type is required' });
    }

    const loads = await Load.find({ vehicle_type })
      .populate('company_id', 'name company_code')
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
      .populate('company_id', 'name company_code')
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
    vehicle_type,
    from_location,
    to_location,
    rental_amount,
    rental_date,
  } = req.body;

  try {
    // Auto-generate rental code
    const rental_code = await codeGenerator.generateRentalCode();

    const load = new Load({
      rental_code,
      vehicle_type,
      from_location,
      to_location,
      rental_amount,
      rental_date: new Date(rental_date),
    });

    const savedLoad = await load.save();

    const populated = await savedLoad.populate([
      { path: 'driver_id', select: 'name contact driver_code' },
    ]);

    res.status(201).json({
      ...populated.toObject(),
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

    // Extract update fields
    const {
      vehicle_type,
      from_location,
      to_location,
      rental_amount,
      rental_date,
    } = req.body;

    // Only allow updating basic load info
    const updateData = {
      vehicle_type: vehicle_type || load.vehicle_type,
      from_location: from_location || load.from_location,
      to_location: to_location || load.to_location,
      rental_amount: rental_amount || load.rental_amount,
      rental_date: rental_date ? new Date(rental_date) : load.rental_date,
    };

    const updatedLoad = await Load.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate([
      { path: 'driver_id', select: 'name contact driver_code' },
    ]);

    // 🔥 ALSO UPDATE RELATED PAYMENT RECORDS
    const rentalPayment = await Payment.findOne({
      load_id: load._id,
      payment_type: 'driver-rental'
    });

    if (rentalPayment) {
      // Update rental payment fields
      if (vehicle_type) rentalPayment.vehicle_type = vehicle_type;
      if (from_location) rentalPayment.from_location = from_location;
      if (to_location) rentalPayment.to_location = to_location;

      if (rental_amount) {
        rentalPayment.total_amount = rental_amount;
        rentalPayment.total_due = rental_amount - rentalPayment.total_paid;

        // Recalculate status based on new amount
        if (rentalPayment.total_paid >= rental_amount) {
          rentalPayment.status = 'paid';
        } else if (rentalPayment.total_paid > 0) {
          rentalPayment.status = 'partial';
        } else {
          rentalPayment.status = 'unpaid';
        }
      }

      if (rental_date) {
        rentalPayment.rental_date = new Date(rental_date);
        rentalPayment.transaction_date = new Date(rental_date);
      }

      await rentalPayment.save();
    }

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
      { path: 'driver_id', select: 'name contact driver_code' },
    ]);
    if (!load) return res.status(404).json({ message: 'Load not found' });

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
      { path: 'driver_id', select: 'name contact driver_code' },
    ]);

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
