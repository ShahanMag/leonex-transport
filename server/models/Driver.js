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
    iqama_id: {
      type: String,
      required: true,
      unique: true,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'suspended'],
      default: 'active',
    },
    // Separated phone fields for better internationalization support
    phone_country_code: {
      type: String,
      default: '+966',  // Default to Saudi Arabia code
    },
    phone_number: {
      type: String,
      required: true,
    },
    vehicle_type: {
      type: String,
      default: '',
    },
    plate_no: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Driver', driverSchema);
