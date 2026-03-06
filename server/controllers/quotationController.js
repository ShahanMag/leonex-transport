const Quotation = require('../models/Quotation');
const Customer = require('../models/Customer');
const Term = require('../models/Terms');
const { generateQuotationCode } = require('../utils/codeGenerator');


// 🔹 Get All Quotations
exports.getAllQuotations = async (req, res) => {
  try {
    let { page = 1, limit = 10, search = '' } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);

    const skip = (page - 1) * limit;

    // 🔎 Search by quotation number
    const searchFilter = search
      ? {
          quotation_number: { $regex: search, $options: 'i' },
          is_deleted: { $ne: true }
        }
      : { is_deleted: { $ne: true } };

    // Total count (for frontend pagination)
    const total = await Quotation.countDocuments(searchFilter);

    const quotations = await Quotation.find(searchFilter)
      .populate('customer')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      data: quotations,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// 🔹 Get Quotation By ID
exports.getQuotationById = async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id)
      .populate('customer');

    if (!quotation || quotation.is_deleted)
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
      customer,
      transport_rates,
      term_ids,
      quotation_date,
      valid_until,
      notes
    } = req.body;

    if (!customer)
      return res.status(400).json({ message: 'Customer is required' });

    if (!quotation_date)
      return res.status(400).json({ message: 'Quotation date is required' });

    if (!valid_until)
      return res.status(400).json({ message: 'Valid until date is required' });

    const quotation_number = await generateQuotationCode();

    // Validate customer
    const foundCustomer = await Customer.findById(customer);
    if (!foundCustomer)
      return res.status(404).json({ message: 'Customer not found' });

    // Validate transport rows
    if (!transport_rates || transport_rates.length === 0)
      return res.status(400).json({ message: 'At least one transport rate row is required' });

    const emptyRow = transport_rates.find((r) => !r.from_location?.trim() || !r.to_location?.trim());
    if (emptyRow)
      return res.status(400).json({ message: 'Every transport rate row must have From and To cities' });

    const baseDate = quotation_date ? new Date(quotation_date) : new Date();

    // 🔥 Snapshot Terms
    let selectedTerms = [];

    if (term_ids && term_ids.length > 0) {
      const terms = await Term.find({ _id: { $in: term_ids } }).sort({ order: 1, createdAt: 1 });

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
      quotation_date: baseDate,
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
      quotation_date,
      valid_until,
      notes
    } = req.body;

    if (transport_rates !== undefined) {
      const emptyRow = transport_rates.find((r) => !r.from_location?.trim() || !r.to_location?.trim());
      if (emptyRow)
        return res.status(400).json({ message: 'Every transport rate row must have From and To cities' });
      quotation.transport_rates = transport_rates;
    }

    if (status !== undefined)
      quotation.status = status;

    if (quotation_date)
      quotation.quotation_date = new Date(quotation_date);

    if (valid_until)
      quotation.valid_until = new Date(valid_until);

    if (notes !== undefined)
      quotation.notes = notes;

    // 🔥 Update Terms Snapshot
    if (term_ids && term_ids.length > 0) {
      const terms = await Term.find({ _id: { $in: term_ids } }).sort({ order: 1, createdAt: 1 });

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
    const quotation = await Quotation.findById(req.params.id);

    if (!quotation || quotation.is_deleted)
      return res.status(404).json({ message: 'Quotation not found' });

    quotation.is_deleted = true;
    quotation.deleted_at = new Date();
    await quotation.save();

    res.status(200).json({ message: 'Quotation deleted successfully' });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};