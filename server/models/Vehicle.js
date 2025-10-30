const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema(
  {
    company_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
    },
    vehicle_code: {
      type: String,
      unique: true,
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
    status: {
      type: String,
      enum: ['available', 'rented', 'maintenance'],
      default: 'available',
    },
    manufacturer: String,
    year: Number,
    capacity: Number,

    // Acquisition fields - What company paid to acquire/rent vehicle from supplier
    acquisition_cost: {
      type: Number,
      required: true,
    },
    acquisition_type: {
      type: String,
      enum: ['bought', 'rented'],
      required: true,
    },
    acquisition_date: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Vehicle', vehicleSchema);
