const mongoose = require('mongoose');

const agentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone_country_code: { type: String, default: '+966' },
    phone_number: { type: String, default: '', trim: true },
    email: { type: String, trim: true, default: '' },
    location: { type: String, trim: true, default: '' },
    is_deleted: { type: Boolean, default: false },
    deleted_at: { type: Date, default: null },
  },
  { timestamps: true }
);

agentSchema.pre(/^find/, function (next) {
  if (!Object.prototype.hasOwnProperty.call(this.getQuery(), 'is_deleted')) {
    this.where({ is_deleted: { $ne: true } });
  }
  next();
});

module.exports = mongoose.model('Agent', agentSchema);
