const Agent = require('../models/Agent');

exports.getAllAgents = async (req, res) => {
  try {
    const agents = await Agent.find().sort({ createdAt: -1 });
    res.status(200).json(agents);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAgentById = async (req, res) => {
  try {
    const agent = await Agent.findById(req.params.id);
    if (!agent) return res.status(404).json({ message: 'Agent not found' });
    res.status(200).json(agent);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createAgent = async (req, res) => {
  try {
    const { name, phone_country_code, phone_number, email, location } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Agent name is required' });
    }
    if (!phone_number || !phone_number.trim()) {
      return res.status(400).json({ message: 'Phone number is required' });
    }

    const agent = new Agent({
      name: name.trim(),
      phone_country_code: phone_country_code || '+966',
      phone_number: phone_number.trim(),
      email: email || '',
      location: location || '',
    });

    const saved = await agent.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateAgent = async (req, res) => {
  try {
    const { name, phone_country_code, phone_number, email, location } = req.body;

    const agent = await Agent.findById(req.params.id);
    if (!agent) return res.status(404).json({ message: 'Agent not found' });

    if (name !== undefined) agent.name = name.trim();
    if (phone_country_code !== undefined) agent.phone_country_code = phone_country_code;
    if (phone_number !== undefined) agent.phone_number = phone_number.trim();
    if (email !== undefined) agent.email = email;
    if (location !== undefined) agent.location = location;

    const updated = await agent.save();
    res.status(200).json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteAgent = async (req, res) => {
  try {
    const agent = await Agent.findById(req.params.id);
    if (!agent) return res.status(404).json({ message: 'Agent not found' });

    agent.is_deleted = true;
    agent.deleted_at = new Date();
    await agent.save();

    res.status(200).json({ message: 'Agent deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
