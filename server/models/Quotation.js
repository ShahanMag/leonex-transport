const mongoose = require('mongoose');

const quotationSchema = new mongoose.Schema(
  {
    quotation_number: {
      type: String,
      required: true,
      unique: true,
    },

    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      default: null,
    },

    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      default: null,
    },

    // 🔥 Transport Table Rows
    transport_rates: [
      {
        from_location: {
          type: String,
          required: true,
        },

        to_location: {
          type: String,
          required: true,
        },

        rate_4m_dyna: {
          type: Number,
          default: 0,
        },

        rate_6m_dyna: {
          type: Number,
          default: 0,
        },

        rate_fsr: {
          type: Number,
          default: 0,
        },

        rate_trailer: {
          type: Number,
          default: 0,
        }
      }
    ],

    // Terms snapshot
    terms: [
      {
        term_id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Term',
        },
        description: String,
      }
    ],

    status: {
      type: String,
      enum: ['Draft', 'Sent', 'Approved', 'Rejected'],
      default: 'Draft',
    },

    quotation_date: { type: Date },
    valid_until: Date,

    notes: String,

    is_deleted: { type: Boolean, default: false },
    deleted_at: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Quotation', quotationSchema);