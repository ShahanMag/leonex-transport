const mongoose = require('mongoose');

const loadSchema = new mongoose.Schema(
  {
    rental_code: {
      type: String,
      unique: true,
      required: true,
    },
    vehicle_type: {
      type: String,
      required: true,
    },
    driver_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Driver',
    },
    from_location: {
      type: String,
      required: true,
    },
    to_location: {
      type: String,
      required: true,
    },
    load_description: String,

    // Dynamic pricing fields - NEW in 2.0
    rental_price_per_day: {
      type: Number,
      required: true,
    },
    rental_type: {
      type: String,
      enum: ['per_day', 'per_job', 'per_km'],
      default: 'per_day',
    },
    distance_km: Number,           // For per-km rental type

    // Calculated/stored amounts
    rental_amount: {
      type: Number,
      required: true,
    },
    actual_rental_cost: {
      type: Number,
    },

    status: {
      type: String,
      enum: ['pending', 'assigned', 'in-transit', 'completed', 'cancelled'],
      default: 'pending',
    },

    start_date: Date,
    end_date: Date,

    // Calculated fields
    days_rented: Number,           // Calculated from end_date - start_date
  },
  { timestamps: true }
);

module.exports = mongoose.model('Load', loadSchema);
