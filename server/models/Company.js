const mongoose = require('mongoose');

const companySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    contact: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    email: String,
    phone: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Company', companySchema);
