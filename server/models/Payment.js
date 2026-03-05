const mongoose = require('mongoose');

const installmentSchema = new mongoose.Schema(
  {
    amount: { type: Number, required: true },
    paid_date: { type: Date, default: Date.now },
    notes: String,
  },
  { _id: true, timestamps: true }
);

const paymentSchema = new mongoose.Schema(
  {
    payer: { type: String, required: true },
    payer_id: mongoose.Schema.Types.ObjectId,
    payee: String,
    payee_id: mongoose.Schema.Types.ObjectId,

    total_amount: { type: Number, required: true },
    total_paid: { type: Number, default: 0 },
    total_due: { type: Number, required: true },

    amount: Number,
    balance: Number,
    description: String,

    payment_type: {
      type: String,
      enum: ['vehicle-acquisition', 'driver-rental'],
      required: true,
    },

    status: { type: String, enum: ['unpaid', 'partial', 'paid'], default: 'unpaid' },

    installments: [installmentSchema],

    date: { type: Date, default: Date.now },
    transaction_date: { type: Date, default: Date.now },

    vehicle_type: { type: String, required: true },
    plate_no: String,
    from_location: String,
    to_location: String,
    acquisition_date: Date,
    rental_date: Date,

    load_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Load' },
    driver_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver' },
    company_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
    related_payment_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },

    receipt_code: { type: String, unique: true, sparse: true },

    is_deleted: { type: Boolean, default: false },
    deleted_at: { type: Date, default: null },
  },
  { timestamps: true }
);

paymentSchema.pre(/^find/, function (next) {
  if (!Object.prototype.hasOwnProperty.call(this.getQuery(), 'is_deleted')) {
    this.where({ is_deleted: { $ne: true } });
  }
  next();
});

module.exports = mongoose.model('Payment', paymentSchema);
