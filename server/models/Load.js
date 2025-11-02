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
    company_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
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

    rental_amount: Number,
    rental_date: Date,

    status: {
      type: String,
      enum: ['pending'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Load', loadSchema);
