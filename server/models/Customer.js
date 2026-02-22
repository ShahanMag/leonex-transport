const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    iqama_id: {
      type: String,
      trim: true,
    },
    phone_country_code: {
      type: String,
      default: '+966',
    },
    phone_number: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Customer', customerSchema);
