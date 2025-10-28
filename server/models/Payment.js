const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    payer: {
      type: String,
      required: true,
    },
    payer_id: mongoose.Schema.Types.ObjectId,
    payee: String,
    payee_id: mongoose.Schema.Types.ObjectId,
    amount: {
      type: Number,
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    type: {
      type: String,
      enum: ['rental', 'driver-commission', 'company-payment', 'other'],
      required: true,
    },
    balance: Number,
    description: String,
    load_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Load',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payment', paymentSchema);
