const mongoose = require('mongoose');

const driverSchema = new mongoose.Schema(
  {
    driver_code: { type: String, unique: true, required: true },
    name: { type: String, required: true },
    iqama_id: { type: String, required: true, unique: true },
    status: { type: String, enum: ['active', 'inactive', 'suspended'], default: 'active' },
    phone_country_code: { type: String, default: '+966' },
    phone_number: { type: String, required: true },
    vehicle_type: { type: String, default: '' },
    plate_no: { type: String, default: '' },
    is_deleted: { type: Boolean, default: false },
    deleted_at: { type: Date, default: null },
  },
  { timestamps: true }
);

driverSchema.pre(/^find/, function (next) {
  if (!Object.prototype.hasOwnProperty.call(this.getQuery(), 'is_deleted')) {
    this.where({ is_deleted: { $ne: true } });
  }
  next();
});

module.exports = mongoose.model('Driver', driverSchema);
