const mongoose = require('mongoose');

const installmentSchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: true,
      min: [0, 'Amount cannot be negative'],
    },
    paid_date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  { _id: true, timestamps: true }
);

const billSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: [true, 'Bill type is required'],
      enum: {
        values: ['income', 'expense'],
        message: 'Type must be either income or expense',
      },
    },
    name: {
      type: String,
      required: [true, 'Bill name is required'],
      trim: true,
    },
    totalAmount: {
      type: Number,
      required: [true, 'Total amount is required'],
      min: [0, 'Total amount cannot be negative'],
    },
    paidAmount: {
      type: Number,
      default: 0,
      min: [0, 'Paid amount cannot be negative'],
    },
    status: {
      type: String,
      enum: ['unpaid', 'partial', 'paid'],
      default: 'unpaid',
    },
    installments: [installmentSchema],
    date: {
      type: Date,
      required: [true, 'Date is required'],
      default: Date.now,
    },
    customer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      default: null,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Indexes
billSchema.index({ type: 1 });
billSchema.index({ status: 1 });
billSchema.index({ customer_id: 1 });
billSchema.index({ date: -1 });
billSchema.index({ type: 1, date: -1 });
billSchema.index({ isDeleted: 1 });

// Auto-exclude soft-deleted docs from find queries
billSchema.pre(/^find/, function (next) {
  if (this.getQuery && !Object.prototype.hasOwnProperty.call(this.getQuery(), 'isDeleted')) {
    this.where({ isDeleted: { $ne: true } });
  }
  next();
});

// Virtual: amount still due
billSchema.virtual('dues').get(function () {
  return this.totalAmount - (this.paidAmount || 0);
});

billSchema.set('toJSON', { virtuals: true });
billSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Bill', billSchema);
