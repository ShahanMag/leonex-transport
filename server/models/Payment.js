const mongoose = require('mongoose');

// Installment subdocument schema
const installmentSchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: true,
    },
    paid_date: {
      type: Date,
      default: Date.now,
    },
    notes: String,
  },
  { _id: true, timestamps: true }
);

const paymentSchema = new mongoose.Schema(
  {
    payer: {
      type: String,
      required: true,
    },
    payer_id: mongoose.Schema.Types.ObjectId,
    payee: String,
    payee_id: mongoose.Schema.Types.ObjectId,

    // Amount fields for installment tracking
    total_amount: {
      type: Number,
      required: true,
    },
    total_paid: {
      type: Number,
      default: 0,
    },
    total_due: {
      type: Number,
      required: true,
    },

    // Legacy field - kept for backward compatibility
    amount: Number,
    balance: Number,
    description: String,

    // Payment type - only two types supported
    payment_type: {
      type: String,
      enum: [
        'vehicle-acquisition',    // Company buys/rents vehicle from supplier
        'driver-rental',          // Driver pays company for rental
      ],
      required: true,
    },

    // Status tracking - for installment payments
    status: {
      type: String,
      enum: ['unpaid', 'partial', 'paid'],
      default: 'unpaid',
    },

    // Installments array
    installments: [installmentSchema],

    // Date fields
    date: {
      type: Date,
      default: Date.now,
    },
    transaction_date: {
      type: Date,
      default: Date.now,
    },

    // Vehicle information (stored as descriptive fields, no Vehicle model reference)
    vehicle_type: {
      type: String,
      required: true,
    },
    plate_no: String,

    // Location fields for rental payments
    from_location: String,
    to_location: String,

    // Date fields for specific transaction types
    acquisition_date: Date,
    rental_date: Date,

    // References
    load_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Load',
    },
    driver_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Driver',
    },
    company_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
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
