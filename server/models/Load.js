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
    rent_amount: {
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
  },
  { timestamps: true }
);

module.exports = mongoose.model('Load', loadSchema);
