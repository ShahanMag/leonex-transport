const ExcelJS = require('exceljs');
const moment = require('moment');
const Company = require('../models/Company');
const Driver = require('../models/Driver');
const Agent = require('../models/Agent');
const Load = require('../models/Load');
const Payment = require('../models/Payment');
const Bill = require('../models/Bill');
const Customer = require('../models/Customer');
const Invoice = require('../models/Invoice');

/**
 * 🧩 Helper: Generate Excel file
 */
const generateExcel = async (sheetName, columns, data, res) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(sheetName);

    worksheet.columns = columns;
    worksheet.addRows(data);

    // Styling
    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
      cell.alignment = { horizontal: 'center' };
    });

    const fileName = `${sheetName}-${moment().format('YYYY-MM-DD-HHmmss')}.xlsx`;

    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${fileName}"`
    );
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('Excel generation error:', err);
    res.status(500).json({ message: 'Failed to generate Excel report' });
  }
};

/* ===========================
 * 🏢 COMPANY REPORT
 * =========================== */
exports.getCompanyReport = async (req, res) => {
  try {
    const companies = await Company.find().lean();

    const data = companies.map((c) => ({
      Name: c.name,
      Contact: c.contact,
      Email: c.email,
      Address: c.address,
      Phone: `${c.phone_country_code || ''}${c.phone_number || ''}`,
      CreatedAt: moment(c.createdAt).format('YYYY-MM-DD'),
    }));

    const columns = [
      { header: 'Name', key: 'Name', width: 25 },
      { header: 'Contact', key: 'Contact', width: 25 },
      { header: 'Email', key: 'Email', width: 30 },
      { header: 'Address', key: 'Address', width: 30 },
      { header: 'Phone', key: 'Phone', width: 20 },
      { header: 'Created At', key: 'CreatedAt', width: 15 },
    ];

    await generateExcel('Company Report', columns, data, res);
  } catch (err) {
    console.error('Company report error:', err);
    res.status(500).json({ message: 'Failed to generate company report' });
  }
};

/* ===========================
 * 👷 DRIVER REPORT
 * =========================== */
exports.getDriverReport = async (req, res) => {
  try {
    const drivers = await Driver.find().lean();

    const data = drivers.map((d) => ({
      Name: d.name,
      IqamaID: d.iqama_id,
      Phone: `${d.phone_country_code || ''}${d.phone_number || ''}`,
      CreatedAt: moment(d.createdAt).format('YYYY-MM-DD'),
    }));

    const columns = [
      { header: 'Name', key: 'Name', width: 25 },
      { header: 'Iqama ID', key: 'IqamaID', width: 20 },
      { header: 'Phone', key: 'Phone', width: 20 },
      { header: 'Created At', key: 'CreatedAt', width: 15 },
    ];

    await generateExcel('Driver Report', columns, data, res);
  } catch (err) {
    console.error('Driver report error:', err);
    res.status(500).json({ message: 'Failed to generate driver report' });
  }
};

/* ===========================
 * 🚗 VEHICLE REPORT
 * =========================== */
exports.getVehicleReport = async (req, res) => {
  try {
    const loads = await Load.find().populate('company_id', 'name').lean();

    const data = loads.map((l) => ({
      VehicleType: l.vehicle_type || 'N/A',
      PlateNo: l.plate_no || 'N/A',
      Company: l.company_id?.name || 'N/A',
      AcquisitionCost: l.acquisition_cost || 0,
      AcquisitionDate: l.acquisition_date
        ? moment(l.acquisition_date).format('YYYY-MM-DD')
        : 'N/A',
    }));

    const columns = [
      { header: 'Vehicle Type', key: 'VehicleType', width: 20 },
      { header: 'Plate Number', key: 'PlateNo', width: 20 },
      { header: 'Company', key: 'Company', width: 25 },
      { header: 'Acquisition Cost', key: 'AcquisitionCost', width: 20 },
      { header: 'Purchase Date', key: 'AcquisitionDate', width: 20 },
    ];

    await generateExcel('Vehicle Report', columns, data, res);
  } catch (err) {
    console.error('Vehicle report error:', err);
    res.status(500).json({ message: 'Failed to generate vehicle report' });
  }
};

/* ===========================
 * 📦 LOAD REPORT
 * =========================== */
exports.getLoadReport = async (req, res) => {
  try {
    const loads = await Load.find()
      .populate('company_id', 'name')
      .populate('driver_id', 'name')
      .lean();

    const data = loads.map((l) => ({
      RentalCode: l.rental_code,
      Company: l.company_id?.name || 'N/A',
      Driver: l.driver_id?.name || 'N/A',
      From: l.from_location,
      To: l.to_location,
      VehicleType: l.vehicle_type,
      CreatedAt: moment(l.createdAt).format('YYYY-MM-DD'),
    }));

    const columns = [
      { header: 'Rental Code', key: 'RentalCode', width: 20 },
      { header: 'Company', key: 'Company', width: 25 },
      { header: 'Driver', key: 'Driver', width: 25 },
      { header: 'From', key: 'From', width: 20 },
      { header: 'To', key: 'To', width: 20 },
      { header: 'Vehicle Type', key: 'VehicleType', width: 20 },
      { header: 'Created At', key: 'CreatedAt', width: 15 },
    ];

    await generateExcel('Load Report', columns, data, res);
  } catch (err) {
    console.error('Load report error:', err);
    res.status(500).json({ message: 'Failed to generate load report' });
  }
};

/* ===========================
 * 🏢 COMPANY PAYMENTS (Excel)
 * =========================== */
exports.getCompanyPaymentsReport = async (req, res) => {
  try {
    const { status, startDate, endDate, companies } = req.query;

    const query = { payment_type: { $in: ['vehicle-acquisition', 'company-expense'] } };
    if (status) {
      const statuses = status.split(',').filter(Boolean);
      if (statuses.length) query.status = { $in: statuses };
    }
    if (startDate || endDate) {
      query.transaction_date = {};
      if (startDate) query.transaction_date.$gte = new Date(startDate);
      if (endDate) query.transaction_date.$lte = new Date(endDate + 'T23:59:59.999Z');
    }
    if (companies) {
      const companyNames = companies.split(',').filter(Boolean);
      if (companyNames.length) {
        const companyDocs = await Company.find({ name: { $in: companyNames } }).select('_id').lean();
        query.company_id = { $in: companyDocs.map(c => c._id) };
      }
    }

    const companyPayments = await Payment.find(query)
      .populate('company_id', 'name')
      .populate('driver_id', 'name')
      .populate('load_id', 'rental_code')
      .lean();

    if (!companyPayments.length) {
      return res.status(404).json({ message: 'No company payments found' });
    }

    // 🔹 Find the maximum number of installments
    let maxInstallments = 0;
    companyPayments.forEach((p) => {
      if (Array.isArray(p.installments)) {
        maxInstallments = Math.max(maxInstallments, p.installments.length);
      }
    });

    // 🔹 Define dynamic columns for installments
    const installmentColumns = Array.from({ length: maxInstallments }).map((_, i) => ({
      header: `Installment ${i + 1}`,
      key: `Installment_${i + 1}`,
      width: 22,
    }));

    // 🔹 Standard columns
    const columns = [
      { header: 'Payment Type', key: 'PaymentType', width: 20 },
      { header: 'Company', key: 'Company', width: 25 },
      { header: 'Driver', key: 'Driver', width: 25 },
      { header: 'Load Code', key: 'LoadCode', width: 20 },
      { header: 'Total Amount', key: 'TotalAmount', width: 15 },
      { header: 'Paid', key: 'Paid', width: 15 },
      { header: 'Due', key: 'Due', width: 15 },
      { header: 'Status', key: 'Status', width: 15 },
      { header: 'Transaction Date', key: 'TransactionDate', width: 20 },
      ...installmentColumns,
    ];

    // 🔹 Prepare Excel rows
    const data = companyPayments.map((p) => {
      const row = {
        PaymentType: p.payment_type,
        Company: p.company_id?.name || 'N/A',
        Driver: p.driver_id?.name || 'N/A',
        LoadCode: p.load_id?.rental_code || 'N/A',
        TotalAmount: p.total_amount,
        Paid: p.total_paid,
        Due: p.total_due,
        Status: p.status,
        TransactionDate: p.transaction_date
          ? moment(p.transaction_date).format('YYYY-MM-DD')
          : 'N/A',
      };

      // ✅ Add each installment as "amount (date)"
      if (Array.isArray(p.installments)) {
        p.installments.forEach((inst, idx) => {
          const key = `Installment_${idx + 1}`;
          const amount = inst.amount || 0;
          const date =
            inst.paid_date || inst.date
              ? moment(inst.paid_date || inst.date).format('YYYY-MM-DD')
              : 'N/A';
          row[key] = `${amount} (${date})`;
        });
      }

      return row;
    });

    // 🔹 Generate Excel
    await generateExcel('Company Payments Report', columns, data, res);
  } catch (err) {
    console.error('Company Payments report error:', err);
    res.status(500).json({ message: 'Failed to generate company payments report' });
  }
};



/* ===========================
 * 🚛 RENTAL PAYMENTS (Excel)
 * =========================== */
exports.getRentalPaymentsReport = async (req, res) => {
  try {
    const { status, startDate, endDate, drivers } = req.query;

    const query = { payment_type: { $in: ['driver-rental', 'rental-payment'] } };
    if (status) {
      const statuses = status.split(',').filter(Boolean);
      if (statuses.length) query.status = { $in: statuses };
    }
    if (startDate || endDate) {
      query.transaction_date = {};
      if (startDate) query.transaction_date.$gte = new Date(startDate);
      if (endDate) query.transaction_date.$lte = new Date(endDate + 'T23:59:59.999Z');
    }
    if (drivers) {
      const driverNames = drivers.split(',').filter(Boolean);
      if (driverNames.length) {
        const driverDocs = await Driver.find({ name: { $in: driverNames } }).select('_id').lean();
        query.driver_id = { $in: driverDocs.map(d => d._id) };
      }
    }

    const rentalPayments = await Payment.find(query)
      .populate('company_id', 'name')
      .populate('driver_id', 'name iqama_id')
      .populate('load_id', 'rental_code')
      .lean();

    if (!rentalPayments.length) {
      return res.status(404).json({ message: 'No rental payments found' });
    }

    // 🔹 Find the maximum number of installments
    let maxInstallments = 0;
    rentalPayments.forEach((p) => {
      if (Array.isArray(p.installments)) {
        maxInstallments = Math.max(maxInstallments, p.installments.length);
      }
    });

    // 🔹 Define dynamic columns for installments
    const installmentColumns = Array.from({ length: maxInstallments }).map((_, i) => ({
      header: `Installment ${i + 1}`,
      key: `Installment_${i + 1}`,
      width: 22,
    }));

    // 🔹 Standard columns
    const columns = [
      { header: 'Payment Type', key: 'PaymentType', width: 20 },
      { header: 'Company', key: 'Company', width: 25 },
      { header: 'Driver', key: 'Driver', width: 25 },
      { header: 'Iqama ID', key: 'IqamaID', width: 20 },
      { header: 'Load Code', key: 'LoadCode', width: 20 },
      { header: 'Total Amount', key: 'TotalAmount', width: 15 },
      { header: 'Paid', key: 'Paid', width: 15 },
      { header: 'Due', key: 'Due', width: 15 },
      { header: 'Status', key: 'Status', width: 15 },
      { header: 'Transaction Date', key: 'TransactionDate', width: 20 },
      ...installmentColumns,
    ];

    // 🔹 Prepare Excel rows
    const data = rentalPayments.map((p) => {
      const row = {
        PaymentType: p.payment_type,
        Company: p.company_id?.name || 'N/A',
        Driver: p.driver_id?.name || 'N/A',
        IqamaID: p.driver_id?.iqama_id || 'N/A',
        LoadCode: p.load_id?.rental_code || 'N/A',
        TotalAmount: p.total_amount,
        Paid: p.total_paid,
        Due: p.total_due,
        Status: p.status,
        TransactionDate: p.transaction_date
          ? moment(p.transaction_date).format('YYYY-MM-DD')
          : 'N/A',
      };

      // ✅ Add each installment as "amount (date)"
      if (Array.isArray(p.installments)) {
        p.installments.forEach((inst, idx) => {
          const key = `Installment_${idx + 1}`;
          const amount = inst.amount || 0;
          const date =
            inst.paid_date || inst.date
              ? moment(inst.paid_date || inst.date).format('YYYY-MM-DD')
              : 'N/A';
          row[key] = `${amount} (${date})`;
        });
      }

      return row;
    });

    // 🔹 Generate Excel
    await generateExcel('Rental Payments Report', columns, data, res);
  } catch (err) {
    console.error('Rental Payments report error:', err);
    res.status(500).json({ message: 'Failed to generate rental payments report' });
  }
};

/* ===========================
 * 🧾 COMPANY PAYMENTS (JSON)
 * =========================== */
exports.getCompanyPaymentsJSON = async (req, res) => {
  try {
    const { status, startDate, endDate, companies } = req.query;

    const query = { payment_type: { $in: ['vehicle-acquisition', 'company-expense'] } };

    if (status) {
      const statuses = status.split(',').filter(Boolean);
      if (statuses.length) query.status = { $in: statuses };
    }
    if (startDate || endDate) {
      query.transaction_date = {};
      if (startDate) query.transaction_date.$gte = new Date(startDate);
      if (endDate) query.transaction_date.$lte = new Date(endDate + 'T23:59:59.999Z');
    }
    if (companies) {
      const companyNames = companies.split(',').filter(Boolean);
      if (companyNames.length) {
        const companyDocs = await Company.find({ name: { $in: companyNames } }).select('_id').lean();
        query.company_id = { $in: companyDocs.map(c => c._id) };
      }
    }

    const payments = await Payment.find(query)
      .populate('company_id', 'name')
      .populate('driver_id', 'name')
      .lean();

    const data = payments.map((p) => ({
      payment_type: p.payment_type,
      company: p.company_id?.name || 'N/A',
      driver: p.driver_id?.name || 'N/A',
      total_amount: p.total_amount || 0,
      total_paid: p.total_paid || 0,
      total_due: p.total_due || 0,
      status: p.status,
      transaction_date: p.transaction_date,
    }));

    res.status(200).json(data);
  } catch (err) {
    console.error('Company payments JSON error:', err);
    res.status(500).json({ message: 'Failed to load company payments report' });
  }
};

/* ===========================
 * 🧾 RENTAL PAYMENTS (JSON)
 * =========================== */
exports.getRentalPaymentsJSON = async (req, res) => {
  try {
    const { status, startDate, endDate, drivers } = req.query;

    const query = { payment_type: { $in: ['driver-rental', 'rental-payment'] } };

    if (status) {
      const statuses = status.split(',').filter(Boolean);
      if (statuses.length) query.status = { $in: statuses };
    }
    if (startDate || endDate) {
      query.transaction_date = {};
      if (startDate) query.transaction_date.$gte = new Date(startDate);
      if (endDate) query.transaction_date.$lte = new Date(endDate + 'T23:59:59.999Z');
    }
    if (drivers) {
      const driverNames = drivers.split(',').filter(Boolean);
      if (driverNames.length) {
        const driverDocs = await Driver.find({ name: { $in: driverNames } }).select('_id').lean();
        query.driver_id = { $in: driverDocs.map(d => d._id) };
      }
    }

    const payments = await Payment.find(query)
      .populate('company_id', 'name')
      .populate('driver_id', 'name iqama_id')
      .lean();

    const data = payments.map((p) => ({
      payment_type: p.payment_type,
      company: p.company_id?.name || 'N/A',
      driver: p.driver_id?.name || 'N/A',
      iqama_id: p.driver_id?.iqama_id || 'N/A',
      total_amount: p.total_amount || 0,
      total_paid: p.total_paid || 0,
      total_due: p.total_due || 0,
      status: p.status,
      transaction_date: p.transaction_date,
    }));

    res.status(200).json(data);
  } catch (err) {
    console.error('Rental payments JSON error:', err);
    res.status(500).json({ message: 'Failed to load rental payments report' });
  }
};

/* ===========================
 * 🏢🚛 COMBINED REPORT (JSON)
 * Company + Rental with Net Profit/Loss
 * =========================== */
exports.getCombinedReportJSON = async (req, res) => {
  try {
    const { status, startDate, endDate, companies, drivers, agents } = req.query;

    const loadQuery = {};
    if (startDate || endDate) {
      loadQuery.rental_date = {};
      if (startDate) loadQuery.rental_date.$gte = new Date(startDate);
      if (endDate) loadQuery.rental_date.$lte = new Date(endDate + 'T23:59:59.999Z');
    }
    if (companies) {
      const companyNames = companies.split(',').filter(Boolean);
      if (companyNames.length) {
        const companyDocs = await Company.find({ name: { $in: companyNames } }).select('_id').lean();
        loadQuery.company_id = { $in: companyDocs.map(c => c._id) };
      }
    }
    if (drivers) {
      const driverNames = drivers.split(',').filter(Boolean);
      if (driverNames.length) {
        const driverDocs = await Driver.find({ name: { $in: driverNames } }).select('_id').lean();
        loadQuery.driver_id = { $in: driverDocs.map(d => d._id) };
      }
    }
    if (agents) {
      const agentNames = agents.split(',').filter(Boolean);
      if (agentNames.length) {
        const agentDocs = await Agent.find({ name: { $in: agentNames } }).select('_id').lean();
        loadQuery.agent_id = { $in: agentDocs.map(a => a._id) };
      }
    }

    const loads = await Load.find(loadQuery)
      .populate('company_id', 'name')
      .populate('driver_id', 'name')
      .populate('agent_id', 'name')
      .lean();

    let data = await Promise.all(
      loads.map(async (load) => {
        const payments = await Payment.find({ load_id: load._id }).lean();
        const acquisitionPayment = payments.find(p => p.payment_type === 'vehicle-acquisition');
        const rentalPayment = payments.find(p => p.payment_type === 'driver-rental');

        const revenue = acquisitionPayment?.total_amount || 0;
        const cost = rentalPayment?.total_amount || 0;
        const netProfit = revenue - cost;

        return {
          rental_code: load.rental_code,
          company: load.company_id?.name || 'N/A',
          driver: load.driver_id?.name || 'N/A',
          agent: load.agent_id?.name || '-',
          from_location: load.from_location,
          to_location: load.to_location,
          vehicle_type: load.vehicle_type,
          revenue,
          revenue_paid: acquisitionPayment?.total_paid || 0,
          revenue_due: acquisitionPayment?.total_due || 0,
          revenue_status: acquisitionPayment?.status || 'unpaid',
          cost,
          cost_paid: rentalPayment?.total_paid || 0,
          cost_due: rentalPayment?.total_due || 0,
          cost_status: rentalPayment?.status || 'unpaid',
          net_profit: netProfit,
          rental_date: load.rental_date,
        };
      })
    );

    // Status filter: show row if either revenue_status or cost_status matches
    if (status) {
      const statuses = status.split(',').filter(Boolean);
      if (statuses.length) {
        data = data.filter(item =>
          statuses.some(s => item.revenue_status === s || item.cost_status === s)
        );
      }
    }

    res.status(200).json(data);
  } catch (err) {
    console.error('Combined report JSON error:', err);
    res.status(500).json({ message: 'Failed to load combined report' });
  }
};

/* ===========================
 * 📊 PROFIT/LOSS ONLY REPORT (JSON)
 * Only shows transactions where BOTH company and rental payments are fully paid
 * =========================== */
exports.getProfitLossReportJSON = async (req, res) => {
  try {
    const { startDate, endDate, companies, drivers, agents } = req.query;

    const loadQuery = {};
    if (startDate || endDate) {
      loadQuery.rental_date = {};
      if (startDate) loadQuery.rental_date.$gte = new Date(startDate);
      if (endDate) loadQuery.rental_date.$lte = new Date(endDate + 'T23:59:59.999Z');
    }
    if (companies) {
      const companyNames = companies.split(',').filter(Boolean);
      if (companyNames.length) {
        const companyDocs = await Company.find({ name: { $in: companyNames } }).select('_id').lean();
        loadQuery.company_id = { $in: companyDocs.map(c => c._id) };
      }
    }
    if (drivers) {
      const driverNames = drivers.split(',').filter(Boolean);
      if (driverNames.length) {
        const driverDocs = await Driver.find({ name: { $in: driverNames } }).select('_id').lean();
        loadQuery.driver_id = { $in: driverDocs.map(d => d._id) };
      }
    }
    if (agents) {
      const agentNames = agents.split(',').filter(Boolean);
      if (agentNames.length) {
        const agentDocs = await Agent.find({ name: { $in: agentNames } }).select('_id').lean();
        loadQuery.agent_id = { $in: agentDocs.map(a => a._id) };
      }
    }

    const loads = await Load.find(loadQuery)
      .populate('company_id', 'name')
      .populate('driver_id', 'name')
      .populate('agent_id', 'name')
      .lean();

    const dataPromises = loads.map(async (load) => {
      const payments = await Payment.find({ load_id: load._id }).lean();
      const acquisitionPayment = payments.find(p => p.payment_type === 'vehicle-acquisition');
      const rentalPayment = payments.find(p => p.payment_type === 'driver-rental');

      if (!acquisitionPayment || !rentalPayment) return null;
      if (acquisitionPayment.status !== 'paid' || rentalPayment.status !== 'paid') return null;

      const revenue = acquisitionPayment.total_amount || 0;
      const cost = rentalPayment.total_amount || 0;
      const netProfit = revenue - cost;

      return {
        rental_code: load.rental_code,
        company: load.company_id?.name || 'N/A',
        driver: load.driver_id?.name || 'N/A',
        agent: load.agent_id?.name || '-',
        revenue,
        cost,
        net_profit: netProfit,
        profit_margin: revenue > 0 ? ((netProfit / revenue) * 100).toFixed(2) + '%' : '0%',
        rental_date: load.rental_date,
      };
    });

    const allData = await Promise.all(dataPromises);
    const data = allData.filter(item => item !== null);

    res.status(200).json(data);
  } catch (err) {
    console.error('Profit/Loss report JSON error:', err);
    res.status(500).json({ message: 'Failed to load profit/loss report' });
  }
};

/* ===========================
 * 🏢🚛 COMBINED REPORT (Excel)
 * =========================== */
exports.getCombinedReportExcel = async (req, res) => {
  try {
    const { status, startDate, endDate, companies, drivers, agents } = req.query;

    const loadQuery = {};
    if (startDate || endDate) {
      loadQuery.rental_date = {};
      if (startDate) loadQuery.rental_date.$gte = new Date(startDate);
      if (endDate) loadQuery.rental_date.$lte = new Date(endDate + 'T23:59:59.999Z');
    }
    if (companies) {
      const companyNames = companies.split(',').filter(Boolean);
      if (companyNames.length) {
        const companyDocs = await Company.find({ name: { $in: companyNames } }).select('_id').lean();
        loadQuery.company_id = { $in: companyDocs.map(c => c._id) };
      }
    }
    if (drivers) {
      const driverNames = drivers.split(',').filter(Boolean);
      if (driverNames.length) {
        const driverDocs = await Driver.find({ name: { $in: driverNames } }).select('_id').lean();
        loadQuery.driver_id = { $in: driverDocs.map(d => d._id) };
      }
    }
    if (agents) {
      const agentNames = agents.split(',').filter(Boolean);
      if (agentNames.length) {
        const agentDocs = await Agent.find({ name: { $in: agentNames } }).select('_id').lean();
        loadQuery.agent_id = { $in: agentDocs.map(a => a._id) };
      }
    }

    const loads = await Load.find(loadQuery)
      .populate('company_id', 'name')
      .populate('driver_id', 'name')
      .populate('agent_id', 'name')
      .lean();

    let data = await Promise.all(
      loads.map(async (load) => {
        const payments = await Payment.find({ load_id: load._id }).lean();
        const acquisitionPayment = payments.find(p => p.payment_type === 'vehicle-acquisition');
        const rentalPayment = payments.find(p => p.payment_type === 'driver-rental');

        const revenue = acquisitionPayment?.total_amount || 0;
        const cost = rentalPayment?.total_amount || 0;
        const revenuePaid = acquisitionPayment?.total_paid || 0;
        const costPaid = rentalPayment?.total_paid || 0;
        const revenueDue = acquisitionPayment?.total_due || 0;
        const costDue = rentalPayment?.total_due || 0;
        const netProfit = revenue - cost;

        return {
          _revenueStatus: acquisitionPayment?.status || 'unpaid',
          _costStatus: rentalPayment?.status || 'unpaid',
          RentalCode: load.rental_code,
          Company: load.company_id?.name || 'N/A',
          Driver: load.driver_id?.name || 'N/A',
          Agent: load.agent_id?.name || '-',
          From: load.from_location,
          To: load.to_location,
          VehicleType: load.vehicle_type,
          Revenue: revenue,
          RevenuePaid: revenuePaid,
          RevenueDue: revenueDue,
          RevenueStatus: acquisitionPayment?.status || 'unpaid',
          Cost: cost,
          CostPaid: costPaid,
          CostDue: costDue,
          CostStatus: rentalPayment?.status || 'unpaid',
          NetProfit: netProfit,
          RentalDate: load.rental_date ? moment(load.rental_date).format('YYYY-MM-DD') : 'N/A',
        };
      })
    );

    // Status filter
    if (status) {
      const statuses = status.split(',').filter(Boolean);
      if (statuses.length) {
        data = data.filter(item =>
          statuses.some(s => item._revenueStatus === s || item._costStatus === s)
        );
      }
    }
    // Remove internal fields before export
    data = data.map(({ _revenueStatus, _costStatus, ...rest }) => rest);

    const columns = [
      { header: 'Rental Code', key: 'RentalCode', width: 20 },
      { header: 'Rental Date', key: 'RentalDate', width: 15 },
      { header: 'Company', key: 'Company', width: 25 },
      { header: 'Driver', key: 'Driver', width: 25 },
      { header: 'Agent', key: 'Agent', width: 25 },
      { header: 'From', key: 'From', width: 20 },
      { header: 'To', key: 'To', width: 20 },
      { header: 'Vehicle Type', key: 'VehicleType', width: 20 },
      { header: 'Vehicle Cost', key: 'Revenue', width: 15 },
      { header: 'Vehicle Paid', key: 'RevenuePaid', width: 15 },
      { header: 'Vehicle Due', key: 'RevenueDue', width: 15 },
      { header: 'Vehicle Payment Status', key: 'RevenueStatus', width: 20 },
      { header: 'Driver Cost', key: 'Cost', width: 15 },
      { header: 'Driver Paid', key: 'CostPaid', width: 15 },
      { header: 'Driver Due', key: 'CostDue', width: 15 },
      { header: 'Driver Payment Status', key: 'CostStatus', width: 20 },
      { header: 'Net Profit/Loss', key: 'NetProfit', width: 18 },
    ];

    await generateExcel('Combined Report', columns, data, res);
  } catch (err) {
    console.error('Combined report Excel error:', err);
    res.status(500).json({ message: 'Failed to generate combined report' });
  }
};

/* ===========================
 * 📊 PROFIT/LOSS REPORT (Excel)
 * Only shows transactions where BOTH company and rental payments are fully paid
 * =========================== */
exports.getProfitLossReportExcel = async (req, res) => {
  try {
    const { startDate, endDate, companies, drivers, agents } = req.query;

    const loadQuery = {};
    if (startDate || endDate) {
      loadQuery.rental_date = {};
      if (startDate) loadQuery.rental_date.$gte = new Date(startDate);
      if (endDate) loadQuery.rental_date.$lte = new Date(endDate + 'T23:59:59.999Z');
    }
    if (companies) {
      const companyNames = companies.split(',').filter(Boolean);
      if (companyNames.length) {
        const companyDocs = await Company.find({ name: { $in: companyNames } }).select('_id').lean();
        loadQuery.company_id = { $in: companyDocs.map(c => c._id) };
      }
    }
    if (drivers) {
      const driverNames = drivers.split(',').filter(Boolean);
      if (driverNames.length) {
        const driverDocs = await Driver.find({ name: { $in: driverNames } }).select('_id').lean();
        loadQuery.driver_id = { $in: driverDocs.map(d => d._id) };
      }
    }
    if (agents) {
      const agentNames = agents.split(',').filter(Boolean);
      if (agentNames.length) {
        const agentDocs = await Agent.find({ name: { $in: agentNames } }).select('_id').lean();
        loadQuery.agent_id = { $in: agentDocs.map(a => a._id) };
      }
    }

    const loads = await Load.find(loadQuery)
      .populate('company_id', 'name')
      .populate('driver_id', 'name')
      .populate('agent_id', 'name')
      .lean();

    const dataPromises = loads.map(async (load) => {
      const payments = await Payment.find({ load_id: load._id }).lean();
      const acquisitionPayment = payments.find(p => p.payment_type === 'vehicle-acquisition');
      const rentalPayment = payments.find(p => p.payment_type === 'driver-rental');

      // Only include if BOTH payments exist and are fully paid
      if (!acquisitionPayment || !rentalPayment) {
        return null; // Skip if either payment is missing
      }

      if (acquisitionPayment.status !== 'paid' || rentalPayment.status !== 'paid') {
        return null; // Skip if either payment is not fully paid
      }

      const revenue = acquisitionPayment.total_amount || 0;
      const cost = rentalPayment.total_amount || 0;
      const netProfit = revenue - cost;

      return {
        RentalCode: load.rental_code,
        Company: load.company_id?.name || 'N/A',
        Driver: load.driver_id?.name || 'N/A',
        Agent: load.agent_id?.name || '-',
        Revenue: revenue,
        Cost: cost,
        NetProfit: netProfit,
        ProfitMargin: revenue > 0 ? ((netProfit / revenue) * 100).toFixed(2) + '%' : '0%',
        RentalDate: load.rental_date ? moment(load.rental_date).format('YYYY-MM-DD') : 'N/A',
      };
    });

    const allData = await Promise.all(dataPromises);
    // Filter out null values (transactions that were skipped)
    const data = allData.filter(item => item !== null);

    const columns = [
      { header: 'Rental Code', key: 'RentalCode', width: 20 },
      { header: 'Company', key: 'Company', width: 25 },
      { header: 'Driver', key: 'Driver', width: 25 },
      { header: 'Agent', key: 'Agent', width: 25 },
      { header: 'Revenue', key: 'Revenue', width: 15 },
      { header: 'Cost', key: 'Cost', width: 15 },
      { header: 'Net Profit/Loss', key: 'NetProfit', width: 18 },
      { header: 'Profit Margin', key: 'ProfitMargin', width: 15 },
      { header: 'Rental Date', key: 'RentalDate', width: 15 },
    ];

    await generateExcel('Profit Loss Report', columns, data, res);
  } catch (err) {
    console.error('Profit/Loss report Excel error:', err);
    res.status(500).json({ message: 'Failed to generate profit/loss report' });
  }
};

/* ===========================
 * 💵 BILLS REPORT (JSON)
 * Income & Expense summary
 * =========================== */
exports.getBillsReportJSON = async (req, res) => {
  try {
    const { type, status, customer, startDate, endDate, country } = req.query;
    const filter = {};
    if (type) filter.type = type;
    if (status) filter.status = status;
    if (country) filter.country = country;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate)   filter.date.$lte = new Date(endDate + 'T23:59:59.999Z');
    }
    if (customer) {
      const customerDoc = await Customer.findOne({ name: customer }).select('_id').lean();
      if (customerDoc) filter.customer_id = customerDoc._id;
      else filter.customer_id = null; // no match → return empty
    }

    const bills = await Bill.find(filter)
      .populate('customer_id', 'name')
      .sort({ date: -1 })
      .lean();

    const totalIncome  = bills.filter(b => b.type === 'income').reduce((s, b) => s + b.totalAmount, 0);
    const totalExpense = bills.filter(b => b.type === 'expense').reduce((s, b) => s + b.totalAmount, 0);
    const totalPaid    = bills.reduce((s, b) => s + (b.paidAmount || 0), 0);
    const totalDue     = bills.reduce((s, b) => s + (b.totalAmount - (b.paidAmount || 0)), 0);

    const data = bills.map(b => ({
      type:        b.type,
      name:        b.name,
      customer:    b.customer_id?.name || '-',
      totalAmount: b.totalAmount,
      paidAmount:  b.paidAmount || 0,
      dues:        b.totalAmount - (b.paidAmount || 0),
      status:      b.status,
      date:        b.date,
      installments: (b.installments || []).map(i => ({
        amount:    i.amount,
        paid_date: i.paid_date,
        notes:     i.notes,
      })),
    }));

    res.status(200).json({
      summary: { totalIncome, totalExpense, netBalance: totalIncome - totalExpense, totalPaid, totalDue },
      data,
    });
  } catch (err) {
    console.error('Bills report JSON error:', err);
    res.status(500).json({ message: 'Failed to load bills report' });
  }
};

/* ===========================
 * 💵 BILLS REPORT (Excel)
 * =========================== */
exports.getBillsReportExcel = async (req, res) => {
  try {
    const { type, status, customer, startDate, endDate, country } = req.query;
    const filter = {};
    if (type) filter.type = type;
    if (status) filter.status = status;
    if (country) filter.country = country;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate)   filter.date.$lte = new Date(endDate + 'T23:59:59.999Z');
    }
    if (customer) {
      const customerDoc = await Customer.findOne({ name: customer }).select('_id').lean();
      filter.customer_id = customerDoc ? customerDoc._id : null;
    }

    const bills = await Bill.find(filter)
      .populate('customer_id', 'name')
      .sort({ date: -1 })
      .lean();

    // Find max installments for dynamic columns
    const maxInstallments = bills.reduce((m, b) => Math.max(m, (b.installments || []).length), 0);

    const installmentColumns = Array.from({ length: maxInstallments }).map((_, i) => ({
      header: `Payment ${i + 1}`,
      key: `Payment_${i + 1}`,
      width: 22,
    }));

    const columns = [
      { header: 'Type',         key: 'Type',       width: 12 },
      { header: 'Name',         key: 'Name',       width: 30 },
      { header: 'Customer',     key: 'Customer',   width: 25 },
      { header: 'Total Amount', key: 'Total',      width: 15 },
      { header: 'Paid Amount',  key: 'Paid',       width: 15 },
      { header: 'Dues',         key: 'Dues',       width: 15 },
      { header: 'Status',       key: 'Status',     width: 12 },
      { header: 'Date',         key: 'Date',       width: 15 },
      ...installmentColumns,
    ];

    const data = bills.map(b => {
      const row = {
        Type:     b.type,
        Name:     b.name,
        Customer: b.customer_id?.name || '-',
        Total:    b.totalAmount,
        Paid:     b.paidAmount || 0,
        Dues:     b.totalAmount - (b.paidAmount || 0),
        Status:   b.status,
        Date:     b.date ? moment(b.date).format('YYYY-MM-DD') : '-',
      };
      (b.installments || []).forEach((inst, idx) => {
        const date = inst.paid_date ? moment(inst.paid_date).format('YYYY-MM-DD') : 'N/A';
        row[`Payment_${idx + 1}`] = `${inst.amount} (${date})${inst.notes ? ' - ' + inst.notes : ''}`;
      });
      return row;
    });

    await generateExcel('Income & Expense Report', columns, data, res);
  } catch (err) {
    console.error('Bills report Excel error:', err);
    res.status(500).json({ message: 'Failed to generate bills report' });
  }
};

/* ===========================
 * 🧾 INVOICES REPORT (JSON)
 * =========================== */
exports.getInvoicesReportJSON = async (req, res) => {
  try {
    const { company_id, company_ids, customer_id, startDate, endDate } = req.query;
    const filter = {};
    if (company_ids) {
      const ids = company_ids.split(',').filter(Boolean);
      filter.company_id = ids.length === 1 ? ids[0] : { $in: ids };
    } else if (company_id) {
      filter.company_id = company_id;
    }
    if (customer_id) filter.customer_id = customer_id;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate)   filter.date.$lte = new Date(endDate + 'T23:59:59.999Z');
    }

    const invoices = await Invoice.find(filter)
      .populate('company_id', 'name')
      .populate('customer_id', 'name')
      .sort({ date: -1 })
      .lean();

    const totalAmount     = invoices.reduce((s, inv) => s + inv.amount, 0);
    const totalVAT        = invoices.reduce((s, inv) => s + inv.amount * 0.15 / 1.15, 0);
    const totalCommission = invoices.reduce((s, inv) => s + (inv.amount / 1.15) * (inv.commission_pct / 100), 0);
    const totalBalance    = totalAmount - totalVAT - totalCommission;

    const data = invoices.map(inv => ({
      _id:                inv._id,
      invoice_number:     inv.invoice_number,
      company:            inv.company_id?.name || '-',
      customer:           inv.customer_id?.name || '-',
      date:               inv.date,
      amount:             inv.amount,
      vat_amount:         inv.amount * 0.15 / 1.15,
      amount_without_vat: inv.amount / 1.15,
      commission_pct:     inv.commission_pct,
      commission_amount:  (inv.amount / 1.15) * (inv.commission_pct / 100),
      balance:            inv.amount - (inv.amount * 0.15 / 1.15) - (inv.amount / 1.15) * (inv.commission_pct / 100),
      notes:              inv.notes || '-',
      description:        inv.description || '-',
    }));

    res.status(200).json({
      summary: { totalAmount, totalVAT, totalCommission, totalBalance },
      data,
    });
  } catch (err) {
    console.error('Invoices report JSON error:', err);
    res.status(500).json({ message: 'Failed to load invoices report' });
  }
};

/* ===========================
 * 🧾 INVOICES REPORT (Excel)
 * =========================== */
exports.getInvoicesReportExcel = async (req, res) => {
  try {
    const { company_id, company_ids, customer_id, startDate, endDate } = req.query;
    const filter = {};
    if (company_ids) {
      const ids = company_ids.split(',').filter(Boolean);
      filter.company_id = ids.length === 1 ? ids[0] : { $in: ids };
    } else if (company_id) {
      filter.company_id = company_id;
    }
    if (customer_id) filter.customer_id = customer_id;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate)   filter.date.$lte = new Date(endDate + 'T23:59:59.999Z');
    }

    const invoices = await Invoice.find(filter)
      .populate('company_id', 'name')
      .populate('customer_id', 'name')
      .sort({ date: -1 })
      .lean();

    const columns = [
      { header: '#',               key: 'No',        width: 6  },
      { header: 'Invoice No.',     key: 'InvoiceNo', width: 20 },
      { header: 'Company',         key: 'Company',   width: 25 },
      { header: 'Customer',        key: 'Customer',  width: 25 },
      { header: 'Date',            key: 'Date',      width: 15 },
      { header: 'Amount',          key: 'Amount',    width: 15 },
      { header: 'VAT (15%)',       key: 'VAT',       width: 15 },
      { header: 'Amt w/o VAT',     key: 'AmtNoVAT',  width: 15 },
      { header: 'Commission %',    key: 'CommPct',   width: 15 },
      { header: 'Commission Amt',  key: 'CommAmt',   width: 15 },
      { header: 'Balance',         key: 'Balance',   width: 15 },
      { header: 'Notes',           key: 'Notes',     width: 30 },
    ];

    const data = invoices.map((inv, idx) => ({
      No:        idx + 1,
      InvoiceNo: inv.invoice_number,
      Company:   inv.company_id?.name || '-',
      Customer:  inv.customer_id?.name || '-',
      Date:      inv.date ? moment(inv.date).format('YYYY-MM-DD') : '-',
      Amount:    inv.amount,
      VAT:       inv.amount * 0.15 / 1.15,
      AmtNoVAT:  inv.amount / 1.15,
      CommPct:   inv.commission_pct,
      CommAmt:   (inv.amount / 1.15) * (inv.commission_pct / 100),
      Balance:   inv.amount - (inv.amount * 0.15 / 1.15) - (inv.amount / 1.15) * (inv.commission_pct / 100),
      Notes:     inv.notes || '-',
    }));

    await generateExcel('Invoices Report', columns, data, res);
  } catch (err) {
    console.error('Invoices report Excel error:', err);
    res.status(500).json({ message: 'Failed to generate invoices report' });
  }
};
