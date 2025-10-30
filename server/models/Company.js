const mongoose = require('mongoose');

const companySchema = new mongoose.Schema(
  {
    company_code: {
      type: String,
      unique: true,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    contact: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    email: String,
    // Separated phone fields for better internationalization support
    phone_country_code: {
      type: String,
      default: '+91',
    },
    phone_number: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Company', companySchema);
