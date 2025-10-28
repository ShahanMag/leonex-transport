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
    balance: Number,
    description: String,

    // Renamed from type to avoid conflict with type keyword
    payment_type: {
      type: String,
      enum: [
        'vehicle-acquisition',    // Company buys/rents vehicle from supplier
        'driver-rental',          // Driver pays company for rental
        'vehicle-maintenance',    // Company pays for maintenance
        'driver-commission',      // Company pays driver commission
        'other'
      ],
      required: true,
    },

    // Status tracking
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending',
    },

    // Date fields
    date: {
      type: Date,
      default: Date.now,
    },
    transaction_date: {
      type: Date,
      default: Date.now,
    },

    // References
    vehicle_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
    },
    load_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Load',
    },

    // Link related payments (e.g., acquisition payment linked to rental payment)
    related_payment_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payment', paymentSchema);
