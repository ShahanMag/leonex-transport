const mongoose = require('mongoose');

const loadSchema = new mongoose.Schema(
  {
    vehicle_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
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

    // Renamed from rent_amount - Driver pays to company
    rental_amount: {
      type: Number,
      required: true,
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
    actual_rental_cost: Number,    // Calculated: days_rented × driver_rental_price
    distance_km: Number,           // For per-km rental type
  },
  { timestamps: true }
);

module.exports = mongoose.model('Load', loadSchema);
