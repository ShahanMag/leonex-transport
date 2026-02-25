const Customer = require('../models/Customer');

exports.getAllCustomers = async (req, res) => {
  try {
    const customers = await Customer.find().sort({ createdAt: -1 });
    res.status(200).json(customers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ message: 'Customer not found' });
    res.status(200).json(customer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createCustomer = async (req, res) => {
  try {
    const { name, iqama_id, phone_country_code, phone_number } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Customer name is required' });
    }

    const customer = new Customer({
      name: name.trim(),
      iqama_id: iqama_id || '',
      phone_country_code: phone_country_code || '+966',
      phone_number: phone_number || '',
    });

    const saved = await customer.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateCustomer = async (req, res) => {
  try {
    const { name, iqama_id, phone_country_code, phone_number } = req.body;

    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ message: 'Customer not found' });

    if (name !== undefined) customer.name = name.trim();
    if (iqama_id !== undefined) customer.iqama_id = iqama_id;
    if (phone_country_code !== undefined) customer.phone_country_code = phone_country_code;
    if (phone_number !== undefined) customer.phone_number = phone_number;

    const updated = await customer.save();
    res.status(200).json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findByIdAndDelete(req.params.id);
    if (!customer) return res.status(404).json({ message: 'Customer not found' });
    res.status(200).json({ message: 'Customer deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
