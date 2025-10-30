const Payment = require('../models/Payment');
const Vehicle = require('../models/Vehicle');
const Load = require('../models/Load');
const Driver = require('../models/Driver');
const Company = require('../models/Company');

// Get all payments
exports.getAllPayments = async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate('payer_id')
      .populate('payee_id')
      .populate('load_id')
      .populate('vehicle_id', 'plate_no vehicle_type')
      .populate('related_payment_id');
    res.status(200).json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Search payments by vehicle plate number
exports.searchPayments = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    // Find vehicles with matching plate number
    const Vehicle = require('../models/Vehicle');
    const vehicles = await Vehicle.find({
      plate_no: { $regex: query, $options: 'i' }
    });

    const vehicleIds = vehicles.map(v => v._id);

    const payments = await Payment.find({
      vehicle_id: { $in: vehicleIds }
    })
      .populate('payer_id')
      .populate('payee_id')
      .populate('load_id')
      .populate('vehicle_id', 'plate_no vehicle_type')
      .populate('related_payment_id');

    res.status(200).json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Filter payments by status
exports.filterPayments = async (req, res) => {
  try {
    const { status } = req.query;

    if (!status) {
      return res.status(400).json({ message: 'status filter is required' });
    }

    const validStatuses = ['unpaid', 'partial', 'paid'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        message: `Status must be one of: ${validStatuses.join(', ')}`
      });
    }

    const payments = await Payment.find({ status })
      .populate('payer_id')
      .populate('payee_id')
      .populate('load_id')
      .populate('vehicle_id', 'plate_no vehicle_type')
      .populate('related_payment_id');

    res.status(200).json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get payment by ID
exports.getPaymentById = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('payer_id')
      .populate('payee_id')
      .populate('load_id')
      .populate('vehicle_id', 'plate_no vehicle_type')
      .populate('related_payment_id');
    if (!payment) return res.status(404).json({ message: 'Payment not found' });
    res.status(200).json(payment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create payment - Manual recording
exports.createPayment = async (req, res) => {
  const {
    payment_type,
    vehicle_id,
    load_id,
  } = req.body;

  try {
    // Validate payment type
    if (!payment_type || !['vehicle-acquisition', 'driver-rental'].includes(payment_type)) {
      return res.status(400).json({
        message: 'Payment type must be either vehicle-acquisition or driver-rental'
      });
    }

    let payment;

    if (payment_type === 'vehicle-acquisition') {
      // Acquisition payment - requires vehicle_id
      if (!vehicle_id) {
        return res.status(400).json({ message: 'vehicle_id is required for vehicle-acquisition' });
      }

      const vehicle = await Vehicle.findById(vehicle_id).populate('company_id');
      if (!vehicle) {
        return res.status(404).json({ message: 'Vehicle not found' });
      }

      // Create acquisition payment
      payment = new Payment({
        payer: vehicle.company_id?.name || 'Unknown',
        payer_id: vehicle.company_id?._id,
        payee: 'Supplier',
        total_amount: vehicle.acquisition_cost,
        total_paid: 0,
        total_due: vehicle.acquisition_cost,
        description: `Acquired ${vehicle.vehicle_type} - ${vehicle.plate_no}`,
        payment_type: 'vehicle-acquisition',
        status: 'unpaid',
        vehicle_id: vehicle._id,
        transaction_date: vehicle.acquisition_date,
        installments: [],
      });

    } else if (payment_type === 'driver-rental') {
      // Rental payment - requires load_id
      if (!load_id) {
        return res.status(400).json({ message: 'load_id is required for driver-rental' });
      }

      const load = await Load.findById(load_id)
        .populate('vehicle_id')
        .populate('driver_id');

      if (!load) {
        return res.status(404).json({ message: 'Load not found' });
      }

      if (!load.driver_id) {
        return res.status(400).json({ message: 'Driver must be assigned to load before creating payment' });
      }

      const vehicle = await Vehicle.findById(load.vehicle_id).populate('company_id');

      // Create rental payment
      payment = new Payment({
        payer: load.driver_id?.name || 'Unknown',
        payer_id: load.driver_id?._id,
        payee: vehicle?.company_id?.name || 'Unknown',
        payee_id: vehicle?.company_id?._id,
        driver_id: load.driver_id?._id,
        total_amount: load.rental_amount,
        total_paid: 0,
        total_due: load.rental_amount,
        description: `Rental payment for ${load.rental_code} - ${load.from_location} to ${load.to_location}`,
        payment_type: 'driver-rental',
        status: 'unpaid',
        vehicle_id: load.vehicle_id,
        load_id: load._id,
        transaction_date: load.start_date,
        installments: [],
      });
    }

    const savedPayment = await payment.save();
    const populated = await savedPayment.populate([
      'payer_id',
      'payee_id',
      'load_id',
      'vehicle_id',
      'driver_id',
      'related_payment_id'
    ]);
    res.status(201).json(populated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update payment
exports.updatePayment = async (req, res) => {
  try {
    const payment = await Payment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).populate([
      'payer_id',
      'payee_id',
      'load_id',
      { path: 'vehicle_id', select: 'plate_no vehicle_type' },
      'related_payment_id'
    ]);
    if (!payment) return res.status(404).json({ message: 'Payment not found' });
    res.status(200).json(payment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Register installment payment
exports.registerInstallment = async (req, res) => {
  const { amount, paid_date, notes } = req.body;
  const paymentId = req.params.id;

  try {
    // Validate amount
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Amount must be greater than 0' });
    }

    // Validate paid_date
    if (!paid_date) {
      return res.status(400).json({ message: 'Payment date is required' });
    }

    // Validate date format
    const dateObj = new Date(paid_date);
    if (isNaN(dateObj.getTime())) {
      return res.status(400).json({ message: 'Invalid date format' });
    }

    // Get payment
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    // Check if full amount is already paid
    if (payment.total_paid >= payment.total_amount) {
      return res.status(400).json({ message: 'Payment is already fully paid' });
    }

    // Check if installment amount exceeds remaining due
    const remainingDue = payment.total_amount - payment.total_paid;
    if (amount > remainingDue) {
      return res.status(400).json({
        message: `Amount exceeds remaining due (₹${remainingDue})`,
      });
    }

    // Create new installment
    const newInstallment = {
      amount,
      paid_date: dateObj,
      notes,
    };

    // Update payment
    payment.installments.push(newInstallment);
    payment.total_paid += amount;
    payment.total_due = payment.total_amount - payment.total_paid;

    // Update status based on payment
    if (payment.total_paid >= payment.total_amount) {
      payment.status = 'paid';
    } else if (payment.total_paid > 0) {
      payment.status = 'partial';
    } else {
      payment.status = 'unpaid';
    }

    const updatedPayment = await payment.save();

    const populated = await updatedPayment.populate([
      'payer_id',
      'payee_id',
      'load_id',
      { path: 'vehicle_id', select: 'plate_no vehicle_type' },
      'related_payment_id',
    ]);

    res.status(200).json({
      message: 'Installment registered successfully',
      payment: populated,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update installment payment
exports.updateInstallment = async (req, res) => {
  const { amount, paid_date, notes } = req.body;
  const { id: paymentId, installmentId } = req.params;

  try {
    // Validate amount
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Amount must be greater than 0' });
    }

    // Validate paid_date
    if (!paid_date) {
      return res.status(400).json({ message: 'Payment date is required' });
    }

    // Validate date format
    const dateObj = new Date(paid_date);
    if (isNaN(dateObj.getTime())) {
      return res.status(400).json({ message: 'Invalid date format' });
    }

    // Get payment
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    // Find the installment
    const installmentIndex = payment.installments.findIndex(
      (inst) => inst._id.toString() === installmentId
    );
    if (installmentIndex === -1) {
      return res.status(404).json({ message: 'Installment not found' });
    }

    // Get old installment amount for recalculation
    const oldAmount = payment.installments[installmentIndex].amount;

    // Update installment
    payment.installments[installmentIndex].amount = amount;
    payment.installments[installmentIndex].paid_date = dateObj;
    payment.installments[installmentIndex].notes = notes;

    // Recalculate totals
    payment.total_paid = payment.installments.reduce((sum, inst) => sum + inst.amount, 0);
    payment.total_due = payment.total_amount - payment.total_paid;

    // Update status based on payment
    if (payment.total_paid >= payment.total_amount) {
      payment.status = 'paid';
    } else if (payment.total_paid > 0) {
      payment.status = 'partial';
    } else {
      payment.status = 'unpaid';
    }

    const updatedPayment = await payment.save();

    const populated = await updatedPayment.populate([
      'payer_id',
      'payee_id',
      'load_id',
      { path: 'vehicle_id', select: 'plate_no vehicle_type' },
      'related_payment_id',
    ]);

    res.status(200).json({
      message: 'Installment updated successfully',
      payment: populated,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete installment payment
exports.deleteInstallment = async (req, res) => {
  const { id: paymentId, installmentId } = req.params;

  try {
    // Get payment
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    // Find the installment index
    const installmentIndex = payment.installments.findIndex(
      (inst) => inst._id.toString() === installmentId
    );
    if (installmentIndex === -1) {
      return res.status(404).json({ message: 'Installment not found' });
    }

    // Remove installment
    payment.installments.splice(installmentIndex, 1);

    // Recalculate totals
    payment.total_paid = payment.installments.reduce((sum, inst) => sum + inst.amount, 0);
    payment.total_due = payment.total_amount - payment.total_paid;

    // Update status based on payment
    if (payment.total_paid >= payment.total_amount) {
      payment.status = 'paid';
    } else if (payment.total_paid > 0) {
      payment.status = 'partial';
    } else {
      payment.status = 'unpaid';
    }

    const updatedPayment = await payment.save();

    const populated = await updatedPayment.populate([
      'payer_id',
      'payee_id',
      'load_id',
      { path: 'vehicle_id', select: 'plate_no vehicle_type' },
      'related_payment_id',
    ]);

    res.status(200).json({
      message: 'Installment deleted successfully',
      payment: populated,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete payment
exports.deletePayment = async (req, res) => {
  try {
    const payment = await Payment.findByIdAndDelete(req.params.id);
    if (!payment) return res.status(404).json({ message: 'Payment not found' });
    res.status(200).json({ message: 'Payment deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
