const Invoice = require('../models/Invoice');
const Company = require('../models/Company');
const Customer = require('../models/Customer');

exports.getAllInvoices = async (req, res) => {
  try {
    const filter = {};
    if (req.query.company_id)  filter.company_id  = req.query.company_id;
    if (req.query.customer_id) filter.customer_id = req.query.customer_id;
    if (req.query.startDate || req.query.endDate) {
      filter.date = {};
      if (req.query.startDate) filter.date.$gte = new Date(req.query.startDate);
      if (req.query.endDate)   filter.date.$lte = new Date(req.query.endDate + 'T23:59:59.999Z');
    }

    const invoices = await Invoice.find(filter)
      .populate('company_id', 'name')
      .populate('customer_id', 'name')
      .sort({ date: -1 });

    res.status(200).json(invoices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('company_id', 'name')
      .populate('customer_id', 'name');
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
    res.status(200).json(invoice);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createInvoice = async (req, res) => {
  try {
    const { invoice_number, amount, date, company_id, customer_id, commission_pct, notes, description } = req.body;

    if (!invoice_number || amount === undefined || !date) {
      return res.status(400).json({ message: 'invoice_number, amount, and date are required' });
    }

    const invoice = new Invoice({
      invoice_number: invoice_number.trim(),
      amount,
      date: new Date(date),
      company_id:    company_id    || null,
      customer_id:   customer_id   || null,
      commission_pct: commission_pct !== undefined ? commission_pct : 0,
      notes:         notes         || undefined,
      description:   description   || undefined,
    });

    const saved = await invoice.save();
    await saved.populate('company_id', 'name');
    await saved.populate('customer_id', 'name');
    res.status(201).json(saved);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateInvoice = async (req, res) => {
  try {
    const { invoice_number, amount, date, company_id, customer_id, commission_pct, notes, description } = req.body;

    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

    if (invoice_number !== undefined) invoice.invoice_number = invoice_number.trim();
    if (amount        !== undefined) invoice.amount        = amount;
    if (date          !== undefined) invoice.date          = new Date(date);
    if (company_id    !== undefined) invoice.company_id    = company_id    || null;
    if (customer_id   !== undefined) invoice.customer_id   = customer_id   || null;
    if (commission_pct !== undefined) invoice.commission_pct = commission_pct;
    if (notes         !== undefined) invoice.notes         = notes;
    if (description   !== undefined) invoice.description   = description;

    const updated = await invoice.save();
    await updated.populate('company_id', 'name');
    await updated.populate('customer_id', 'name');
    res.status(200).json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

    invoice.isDeleted = true;
    invoice.deletedAt = new Date();
    await invoice.save();

    res.status(200).json({ message: 'Invoice deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Bulk create from Excel (parsed client-side, sent as JSON rows)
exports.bulkCreateInvoices = async (req, res) => {
  try {
    const { rows } = req.body;
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ message: 'rows array is required and must not be empty' });
    }

    // Pre-load companies and customers for name lookup (case-insensitive)
    const [allCompanies, allCustomers] = await Promise.all([
      Company.find().select('_id name').lean(),
      Customer.find().select('_id name').lean(),
    ]);

    const companyMap  = new Map(allCompanies.map(c  => [c.name.toLowerCase(),  c._id]));
    const customerMap = new Map(allCustomers.map(c => [c.name.toLowerCase(), c._id]));

    const results = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2; // Excel row number (1=header, so data starts at 2)

      try {
        const { invoice_number, date, company_name, customer_name, amount, commission_pct, description, notes } = row;

        if (!invoice_number || !date || amount === undefined || amount === null || amount === '') {
          results.push({ row: rowNum, status: 'error', message: 'invoice_number, date, and amount are required' });
          continue;
        }

        const parsedAmount = parseFloat(amount);
        const parsedCommPct = parseFloat(commission_pct) || 0;

        if (isNaN(parsedAmount) || parsedAmount < 0) {
          results.push({ row: rowNum, status: 'error', message: `Invalid amount: ${amount}` });
          continue;
        }
        if (parsedCommPct < 0 || parsedCommPct > 100) {
          results.push({ row: rowNum, status: 'error', message: `Commission % must be 0–100, got: ${commission_pct}` });
          continue;
        }

        // Resolve company/customer by name
        const company_id  = company_name  ? (companyMap.get(company_name.toString().toLowerCase())   || null) : null;
        const customer_id = customer_name ? (customerMap.get(customer_name.toString().toLowerCase()) || null) : null;

        // Parse date — handle Excel serial numbers and string dates
        let parsedDate;
        if (typeof date === 'number') {
          // Excel serial date: days since 1900-01-01 (with 1900 leap-year bug)
          parsedDate = new Date(Math.round((date - 25569) * 86400 * 1000));
        } else {
          parsedDate = new Date(date);
        }
        if (isNaN(parsedDate.getTime())) {
          results.push({ row: rowNum, status: 'error', message: `Invalid date: ${date}` });
          continue;
        }

        const invoice = new Invoice({
          invoice_number: invoice_number.toString().trim(),
          date:           parsedDate,
          company_id,
          customer_id,
          amount:         parsedAmount,
          commission_pct: parsedCommPct,
          description:    description || undefined,
          notes:          notes       || undefined,
        });

        await invoice.save();
        results.push({ row: rowNum, status: 'success', invoice_number: invoice_number.toString().trim() });
      } catch (err) {
        const msg = err.code === 11000 ? 'Duplicate invoice number' : err.message;
        results.push({ row: rowNum, status: 'error', message: msg });
      }
    }

    const successCount = results.filter(r => r.status === 'success').length;
    const errorCount   = results.filter(r => r.status === 'error').length;

    res.status(200).json({ successCount, errorCount, results });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
