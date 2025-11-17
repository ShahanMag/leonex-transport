const Payment = require('../models/Payment');
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
      .populate('related_payment_id');
    res.status(200).json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Search payments by plate number or vehicle type
exports.searchPayments = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    // Search by plate_no or vehicle_type in payments
    const payments = await Payment.find({
      $or: [
        { plate_no: { $regex: query, $options: 'i' } },
        { vehicle_type: { $regex: query, $options: 'i' } }
      ]
    })
      .populate('payer_id')
      .populate('payee_id')
      .populate('load_id')
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
      .populate('related_payment_id');
    if (!payment) return res.status(404).json({ message: 'Payment not found' });
    res.status(200).json(payment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create payment - Manual recording (simplified - payments are created via transaction endpoint)
exports.createPayment = async (req, res) => {
  try {
    res.status(400).json({
      message: 'Manual payment creation is deprecated. Use the unified rental transaction endpoint instead.',
      endpoint: 'POST /api/transactions/rental'
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update payment
exports.updatePayment = async (req, res) => {
  try {
    // Get the existing payment first
    const existingPayment = await Payment.findById(req.params.id);
    if (!existingPayment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    // If total_amount is being updated, validate and recalculate
    if (req.body.total_amount !== undefined) {
      const newTotalAmount = parseFloat(req.body.total_amount);

      // Validate: new amount cannot be less than what's already paid
      if (newTotalAmount < existingPayment.total_paid) {
        return res.status(400).json({
          message: `Cannot set total amount (${newTotalAmount}) lower than already paid amount (${existingPayment.total_paid}). Please adjust or delete installments first.`
        });
      }

      // Recalculate total_due
      req.body.total_due = newTotalAmount - existingPayment.total_paid;

      // Update status based on new amounts
      if (existingPayment.total_paid >= newTotalAmount) {
        req.body.status = 'paid';
      } else if (existingPayment.total_paid > 0) {
        req.body.status = 'partial';
      } else {
        req.body.status = 'unpaid';
      }
    }

    // Update the payment
    const payment = await Payment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).populate([
      'payer_id',
      'payee_id',
      'load_id',
      'related_payment_id'
    ]);

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
