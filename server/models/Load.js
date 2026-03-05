const mongoose = require('mongoose');

const loadSchema = new mongoose.Schema(
  {
    rental_code: { type: String, unique: true, required: true },
    vehicle_type: { type: String, required: true },
    company_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
    driver_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver' },
    agent_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Agent', default: null },
    from_location: { type: String, required: true },
    to_location: { type: String, required: true },
    rental_amount: Number,
    rental_date: Date,
    status: { type: String, enum: ['pending'], default: 'pending' },
    is_deleted: { type: Boolean, default: false },
    deleted_at: { type: Date, default: null },
  },
  { timestamps: true }
);

loadSchema.pre(/^find/, function (next) {
  if (!Object.prototype.hasOwnProperty.call(this.getQuery(), 'is_deleted')) {
    this.where({ is_deleted: { $ne: true } });
  }
  next();
});

module.exports = mongoose.model('Load', loadSchema);
