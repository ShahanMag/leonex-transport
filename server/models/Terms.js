const mongoose = require('mongoose');

const termSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    is_active: {
      type: Boolean,
      default: true,
    },

    order: {
      type: Number,
      default: 0,
    },

    is_deleted: { type: Boolean, default: false },
    deleted_at: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Term', termSchema);