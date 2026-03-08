const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: [true, 'Date is required'],
      default: Date.now,
    },
    company_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      default: null,
    },
    customer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      default: null,
    },
    invoice_number: {
      type: String,
      required: [true, 'Invoice number is required'],
      unique: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount cannot be negative'],
    },
    commission_pct: {
      type: Number,
      required: true,
      min: [0, 'Commission % cannot be negative'],
      max: [100, 'Commission % cannot exceed 100'],
      default: 0,
    },
    notes: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
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
invoiceSchema.index({ date: -1 });
invoiceSchema.index({ company_id: 1 });
invoiceSchema.index({ customer_id: 1 });
invoiceSchema.index({ isDeleted: 1 });

// Auto-exclude soft-deleted docs from find queries
invoiceSchema.pre(/^find/, function (next) {
  if (this.getQuery && !Object.prototype.hasOwnProperty.call(this.getQuery(), 'isDeleted')) {
    this.where({ isDeleted: { $ne: true } });
  }
  next();
});

// Virtuals — amount is the invoice total (VAT-inclusive)
invoiceSchema.virtual('vat_amount').get(function () {
  return this.amount * 0.15 / 1.15;
});

invoiceSchema.virtual('amount_without_vat').get(function () {
  return this.amount / 1.15;
});

invoiceSchema.virtual('commission_amount').get(function () {
  return (this.amount / 1.15) * (this.commission_pct / 100);
});

invoiceSchema.virtual('balance').get(function () {
  const amtNoVat = this.amount / 1.15;
  return this.amount - (this.amount * 0.15 / 1.15) - amtNoVat * (this.commission_pct / 100);
});

invoiceSchema.set('toJSON', { virtuals: true });
invoiceSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Invoice', invoiceSchema);
