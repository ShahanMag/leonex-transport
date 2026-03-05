const mongoose = require('mongoose');

const companySchema = new mongoose.Schema(
  {
    company_code: { type: String, unique: true, required: true },
    name: { type: String, required: true },
    contact: { type: String, required: true },
    address: { type: String, required: true },
    email: String,
    phone_country_code: { type: String, default: '+91' },
    phone_number: String,
    is_deleted: { type: Boolean, default: false },
    deleted_at: { type: Date, default: null },
  },
  { timestamps: true }
);

companySchema.pre(/^find/, function (next) {
  if (!Object.prototype.hasOwnProperty.call(this.getQuery(), 'is_deleted')) {
    this.where({ is_deleted: { $ne: true } });
  }
  next();
});

module.exports = mongoose.model('Company', companySchema);
