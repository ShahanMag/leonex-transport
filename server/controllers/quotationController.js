const Quotation = require('../models/Quotation');
const Customer = require('../models/Customer');
const Term = require('../models/Terms');


// 🔹 Get All Quotations
exports.getAllQuotations = async (req, res) => {
  try {
    const quotations = await Quotation.find()
      .populate('customer')
      .sort({ createdAt: -1 });

    res.status(200).json(quotations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// 🔹 Get Quotation By ID
exports.getQuotationById = async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id)
      .populate('customer');

    if (!quotation)
      return res.status(404).json({ message: 'Quotation not found' });

    res.status(200).json(quotation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// 🔹 Create Quotation
exports.createQuotation = async (req, res) => {
  try {
    const {
      quotation_number,
      customer,
      transport_rates,
      term_ids,
      valid_until,
      notes
    } = req.body;

    if (!quotation_number || !customer) {
      return res.status(400).json({
        message: 'Quotation number and customer are required'
      });
    }

    // Validate customer
    const foundCustomer = await Customer.findById(customer);
    if (!foundCustomer)
      return res.status(404).json({ message: 'Customer not found' });

    // Validate transport rows
    if (!transport_rates || transport_rates.length === 0) {
      return res.status(400).json({
        message: 'At least one transport rate row is required'
      });
    }

    // 🔥 Snapshot Terms
    let selectedTerms = [];

    if (term_ids && term_ids.length > 0) {
      const terms = await Term.find({ _id: { $in: term_ids } });

      selectedTerms = terms.map(term => ({
        term_id: term._id,
        description: term.description
      }));
    }

    const quotation = new Quotation({
      quotation_number,
      customer,
      transport_rates,
      terms: selectedTerms,
      valid_until,
      notes
    });

    const saved = await quotation.save();

    res.status(201).json(saved);

  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};


// 🔹 Update Quotation
exports.updateQuotation = async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id);

    if (!quotation)
      return res.status(404).json({ message: 'Quotation not found' });

    const {
      transport_rates,
      term_ids,
      status,
      valid_until,
      notes
    } = req.body;

    if (transport_rates !== undefined)
      quotation.transport_rates = transport_rates;

    if (status !== undefined)
      quotation.status = status;

    if (valid_until !== undefined)
      quotation.valid_until = valid_until;

    if (notes !== undefined)
      quotation.notes = notes;

    // 🔥 Update Terms Snapshot
    if (term_ids && term_ids.length > 0) {
      const terms = await Term.find({ _id: { $in: term_ids } });

      quotation.terms = terms.map(term => ({
        term_id: term._id,
        description: term.description
      }));
    }

    const updated = await quotation.save();

    res.status(200).json(updated);

  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};


// 🔹 Delete Quotation
exports.deleteQuotation = async (req, res) => {
  try {
    const quotation = await Quotation.findByIdAndDelete(req.params.id);

    if (!quotation)
      return res.status(404).json({ message: 'Quotation not found' });

    res.status(200).json({ message: 'Quotation deleted successfully' });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};