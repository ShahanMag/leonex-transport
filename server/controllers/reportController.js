const Payment = require('../models/Payment');
const Load = require('../models/Load');
const Driver = require('../models/Driver');
const Company = require('../models/Company');

// Balance Report - Displays pending payments per driver or company
exports.getBalanceReport = async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate('payer_id')
      .populate('payee_id');

    const balanceReport = {};
    payments.forEach((payment) => {
      const payee = payment.payee || 'Unknown';
      if (!balanceReport[payee]) {
        balanceReport[payee] = { total: 0, payments: [] };
      }
      balanceReport[payee].total += payment.amount;
      balanceReport[payee].payments.push(payment);
    });

    res.status(200).json(balanceReport);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Payment History - Tracks all rental and driver-related transactions
exports.getPaymentHistory = async (req, res) => {
  try {
    const payments = await Payment.find()
      .sort({ date: -1 })
      .populate('payer_id')
      .populate('payee_id')
      .populate('load_id');

    const history = payments.map((payment) => ({
      _id: payment._id,
      payer: payment.payer,
      payee: payment.payee,
      amount: payment.amount,
      date: payment.date,
      type: payment.type,
      description: payment.description,
      load: payment.load_id,
    }));

    res.status(200).json(history);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Vehicle Type Utilization Report - Shows usage by vehicle type
exports.getVehicleUtilizationReport = async (req, res) => {
  try {
    const loads = await Load.find();
    const payments = await Payment.find();

    // Group loads by vehicle type
    const vehicleTypeMap = {};
    loads.forEach((load) => {
      if (!vehicleTypeMap[load.vehicle_type]) {
        vehicleTypeMap[load.vehicle_type] = {
          total_loads: 0,
          completed_loads: 0,
          pending_loads: 0,
        };
      }
      vehicleTypeMap[load.vehicle_type].total_loads++;
      if (load.status === 'completed') {
        vehicleTypeMap[load.vehicle_type].completed_loads++;
      } else if (load.status === 'pending' || load.status === 'assigned') {
        vehicleTypeMap[load.vehicle_type].pending_loads++;
      }
    });

    const utilizationReport = Object.entries(vehicleTypeMap).map(([vehicleType, data]) => ({
      vehicle_type: vehicleType,
      ...data,
      utilization_rate: data.total_loads > 0
        ? ((data.completed_loads / data.total_loads) * 100).toFixed(2) + '%'
        : '0%',
    }));

    res.status(200).json(utilizationReport);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Driver Performance Report - Monitors completed deliveries and earnings
exports.getDriverPerformanceReport = async (req, res) => {
  try {
    const drivers = await Driver.find();
    const loads = await Load.find();
    const payments = await Payment.find();

    const performanceReport = drivers.map((driver) => {
      const driverLoads = loads.filter((load) => load.driver_id && load.driver_id.toString() === driver._id.toString());
      const completedLoads = driverLoads.filter((load) => load.status === 'completed');
      const driverPayments = payments.filter((payment) => payment.payee === driver.name);

      const totalEarnings = driverPayments.reduce((sum, payment) => sum + payment.amount, 0);

      return {
        _id: driver._id,
        name: driver.name,
        license_no: driver.license_no,
        status: driver.status,
        total_loads: driverLoads.length,
        completed_loads: completedLoads.length,
        pending_loads: driverLoads.filter((load) => load.status === 'in-transit').length,
        total_earnings: totalEarnings,
        performance_rate: driverLoads.length > 0
          ? ((completedLoads.length / driverLoads.length) * 100).toFixed(2) + '%'
          : '0%',
      };
    });

    res.status(200).json(performanceReport);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
