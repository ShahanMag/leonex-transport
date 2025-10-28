const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema(
  {
    company_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
    },
    vehicle_type: {
      type: String,
      required: true,
    },
    plate_no: {
      type: String,
      required: true,
      unique: true,
    },
    rent_price: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['available', 'rented', 'maintenance'],
      default: 'available',
    },
    manufacturer: String,
    year: Number,
    capacity: Number,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Vehicle', vehicleSchema);
