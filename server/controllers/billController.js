const Bill = require('../models/Bill');

// Helper: recalculate paidAmount + status from installments
function recalculate(bill) {
  bill.paidAmount = bill.installments.reduce((sum, i) => sum + i.amount, 0);
  if (bill.paidAmount >= bill.totalAmount) {
    bill.status = 'paid';
  } else if (bill.paidAmount > 0) {
    bill.status = 'partial';
  } else {
    bill.status = 'unpaid';
  }
}

exports.getAllBills = async (req, res) => {
  try {
    const filter = {};
    if (req.query.type) filter.type = req.query.type;
    if (req.query.status) filter.status = req.query.status;

    const bills = await Bill.find(filter)
      .populate('customer_id', 'name phone_number')
      .sort({ date: -1 });

    res.status(200).json(bills);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getBillById = async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id).populate('customer_id', 'name phone_number');
    if (!bill) return res.status(404).json({ message: 'Bill not found' });
    res.status(200).json(bill);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createBill = async (req, res) => {
  try {
    const { type, name, totalAmount, date, customer_id } = req.body;

    if (!type || !name || totalAmount === undefined) {
      return res.status(400).json({ message: 'type, name and totalAmount are required' });
    }

    const bill = new Bill({
      type,
      name: name.trim(),
      totalAmount,
      paidAmount: 0,
      status: 'unpaid',
      installments: [],
      date: date ? new Date(date) : new Date(),
      customer_id: customer_id || null,
    });

    const saved = await bill.save();
    await saved.populate('customer_id', 'name phone_number');
    res.status(201).json(saved);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateBill = async (req, res) => {
  try {
    const { type, name, totalAmount, date, customer_id } = req.body;

    const bill = await Bill.findById(req.params.id);
    if (!bill) return res.status(404).json({ message: 'Bill not found' });

    if (type !== undefined) bill.type = type;
    if (name !== undefined) bill.name = name.trim();
    if (date !== undefined) bill.date = new Date(date);
    if (customer_id !== undefined) bill.customer_id = customer_id || null;

    if (totalAmount !== undefined) {
      if (totalAmount < bill.paidAmount) {
        return res.status(400).json({
          message: `Cannot set total amount (${totalAmount}) lower than already paid amount (${bill.paidAmount}). Adjust or delete installments first.`,
        });
      }
      bill.totalAmount = totalAmount;
      // Recalculate status after totalAmount change
      recalculate(bill);
    }

    const updated = await bill.save();
    await updated.populate('customer_id', 'name phone_number');
    res.status(200).json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Soft delete
exports.deleteBill = async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id);
    if (!bill) return res.status(404).json({ message: 'Bill not found' });

    bill.isDeleted = true;
    bill.deletedAt = new Date();
    await bill.save();

    res.status(200).json({ message: 'Bill deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Installments ────────────────────────────────────────────────

exports.addInstallment = async (req, res) => {
  try {
    const { amount, paid_date, notes } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Amount must be greater than 0' });
    }
    if (!paid_date) {
      return res.status(400).json({ message: 'Payment date is required' });
    }
    const dateObj = new Date(paid_date);
    if (isNaN(dateObj.getTime())) {
      return res.status(400).json({ message: 'Invalid date format' });
    }

    const bill = await Bill.findById(req.params.id);
    if (!bill) return res.status(404).json({ message: 'Bill not found' });

    if (bill.paidAmount >= bill.totalAmount) {
      return res.status(400).json({ message: 'Bill is already fully paid' });
    }

    const remaining = bill.totalAmount - bill.paidAmount;
    if (amount > remaining) {
      return res.status(400).json({ message: `Amount exceeds remaining due (${remaining} SAR)` });
    }

    bill.installments.push({ amount, paid_date: dateObj, notes });
    recalculate(bill);

    const saved = await bill.save();
    await saved.populate('customer_id', 'name phone_number');
    res.status(200).json({ message: 'Installment added successfully', bill: saved });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateInstallment = async (req, res) => {
  try {
    const { amount, paid_date, notes } = req.body;
    const { id, installmentId } = req.params;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Amount must be greater than 0' });
    }
    if (!paid_date) {
      return res.status(400).json({ message: 'Payment date is required' });
    }
    const dateObj = new Date(paid_date);
    if (isNaN(dateObj.getTime())) {
      return res.status(400).json({ message: 'Invalid date format' });
    }

    const bill = await Bill.findById(id);
    if (!bill) return res.status(404).json({ message: 'Bill not found' });

    const idx = bill.installments.findIndex(i => i._id.toString() === installmentId);
    if (idx === -1) return res.status(404).json({ message: 'Installment not found' });

    // Validate: new amount vs total (excluding this installment)
    const otherPaid = bill.installments.reduce((s, i, index) => index !== idx ? s + i.amount : s, 0);
    if (otherPaid + amount > bill.totalAmount) {
      return res.status(400).json({ message: `Amount exceeds remaining due (${bill.totalAmount - otherPaid} SAR)` });
    }

    bill.installments[idx].amount = amount;
    bill.installments[idx].paid_date = dateObj;
    bill.installments[idx].notes = notes;
    recalculate(bill);

    const saved = await bill.save();
    await saved.populate('customer_id', 'name phone_number');
    res.status(200).json({ message: 'Installment updated successfully', bill: saved });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteInstallment = async (req, res) => {
  try {
    const { id, installmentId } = req.params;

    const bill = await Bill.findById(id);
    if (!bill) return res.status(404).json({ message: 'Bill not found' });

    const idx = bill.installments.findIndex(i => i._id.toString() === installmentId);
    if (idx === -1) return res.status(404).json({ message: 'Installment not found' });

    bill.installments.splice(idx, 1);
    recalculate(bill);

    const saved = await bill.save();
    await saved.populate('customer_id', 'name phone_number');
    res.status(200).json({ message: 'Installment deleted successfully', bill: saved });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
