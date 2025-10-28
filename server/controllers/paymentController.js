const Payment = require('../models/Payment');

// Get all payments
exports.getAllPayments = async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate('payer_id')
      .populate('payee_id')
      .populate('load_id');
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
      .populate('load_id');
    if (!payment) return res.status(404).json({ message: 'Payment not found' });
    res.status(200).json(payment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create payment
exports.createPayment = async (req, res) => {
  const { payer, payer_id, payee, payee_id, amount, type, balance, description, load_id } = req.body;
  try {
    const payment = new Payment({
      payer,
      payer_id,
      payee,
      payee_id,
      amount,
      type,
      balance,
      description,
      load_id,
    });
    const savedPayment = await payment.save();
    const populated = await savedPayment.populate([
      'payer_id',
      'payee_id',
      'load_id'
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
      'load_id'
    ]);
    if (!payment) return res.status(404).json({ message: 'Payment not found' });
    res.status(200).json(payment);
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
