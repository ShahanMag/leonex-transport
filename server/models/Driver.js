const mongoose = require('mongoose');

const driverSchema = new mongoose.Schema(
  {
    driver_code: {
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
    license_no: {
      type: String,
      required: true,
      unique: true,
    },
    iqama_id: {
      type: String,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'suspended'],
      default: 'active',
    },
    email: String,
    // Separated phone fields for better internationalization support
    phone_country_code: {
      type: String,
      default: '+966',  // Default to Saudi Arabia code
    },
    phone_number: String,
    address: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Driver', driverSchema);
