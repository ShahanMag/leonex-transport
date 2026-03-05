const Term = require("../models/Terms");

// 🔹 Get All Terms
exports.getAllTerms = async (req, res) => {
  try {
    const terms = await Term.find({ is_deleted: { $ne: true } }).sort({ order: 1, createdAt: -1 });
    res.status(200).json(terms);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🔹 Get Single Term By ID
exports.getTermById = async (req, res) => {
  try {
    const term = await Term.findById(req.params.id);
    if (!term || term.is_deleted) return res.status(404).json({ message: "Term not found" });

    res.status(200).json(term);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🔹 Create Term
exports.createTerm = async (req, res) => {
  try {
    const { title, description, order } = req.body;

    if (!description) {
      return res.status(400).json({ message: "Term description is required" });
    }

    const term = new Term({
      title: title || "",
      description: description.trim(),
      order: order || 0,
    });

    const saved = await term.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// 🔹 Update Term
exports.updateTerm = async (req, res) => {
  try {
    const { title, description, is_active, order } = req.body;

    const term = await Term.findById(req.params.id);
    if (!term) return res.status(404).json({ message: "Term not found" });

    if (title !== undefined) term.title = title;
    if (description !== undefined) term.description = description.trim();
    if (is_active !== undefined) term.is_active = is_active;
    if (order !== undefined) term.order = order;

    const updated = await term.save();
    res.status(200).json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// 🔹 Delete Term
exports.deleteTerm = async (req, res) => {
  try {
    const term = await Term.findById(req.params.id);
    if (!term || term.is_deleted) return res.status(404).json({ message: "Term not found" });

    term.is_deleted = true;
    term.deleted_at = new Date();
    await term.save();

    res.status(200).json({ message: "Term deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getActiveTerms = async (req, res) => {
  try {
    const terms = await Term.find({ is_active: true, is_deleted: { $ne: true } }).sort({ order: 1 });
    res.status(200).json(terms);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
