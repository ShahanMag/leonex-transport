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

    // Driver rental fields - What driver pays company per day/job/km
    driver_rental_price: {
      type: Number,
      required: true,
    },
    driver_rental_type: {
      type: String,
      enum: ['per_day', 'per_job', 'per_km'],
      default: 'per_day',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Vehicle', vehicleSchema);
