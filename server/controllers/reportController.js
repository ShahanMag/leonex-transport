const ExcelJS = require('exceljs');
const moment = require('moment');
const Company = require('../models/Company');
const Driver = require('../models/Driver');
const Load = require('../models/Load');
const Payment = require('../models/Payment');
const Bill = require('../models/Bill');

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
      { header: 'Acquisition Date', key: 'AcquisitionDate', width: 20 },
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
    const companyPayments = await Payment.find({
      payment_type: { $in: ['vehicle-acquisition', 'company-expense'] },
    })
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
    const rentalPayments = await Payment.find({
      payment_type: { $in: ['driver-rental', 'rental-payment'] },
    })
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
    const payments = await Payment.find({
      payment_type: { $in: ['vehicle-acquisition', 'company-expense'] },
    })
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
    const payments = await Payment.find({
      payment_type: { $in: ['driver-rental', 'rental-payment'] },
    })
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
    const loads = await Load.find()
      .populate('company_id', 'name')
      .populate('driver_id', 'name')
      .lean();

    const data = await Promise.all(
      loads.map(async (load) => {
        // Find related payments
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
          rental_code: load.rental_code,
          company: load.company_id?.name || 'N/A',
          driver: load.driver_id?.name || 'N/A',
          from_location: load.from_location,
          to_location: load.to_location,
          vehicle_type: load.vehicle_type,
          revenue: revenue,
          revenue_paid: revenuePaid,
          revenue_due: revenueDue,
          revenue_status: acquisitionPayment?.status || 'unpaid',
          cost: cost,
          cost_paid: costPaid,
          cost_due: costDue,
          cost_status: rentalPayment?.status || 'unpaid',
          net_profit: netProfit,
          rental_date: load.rental_date,
        };
      })
    );

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
    const loads = await Load.find()
      .populate('company_id', 'name')
      .populate('driver_id', 'name')
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
        rental_code: load.rental_code,
        company: load.company_id?.name || 'N/A',
        driver: load.driver_id?.name || 'N/A',
        revenue: revenue,
        cost: cost,
        net_profit: netProfit,
        profit_margin: revenue > 0 ? ((netProfit / revenue) * 100).toFixed(2) + '%' : '0%',
        rental_date: load.rental_date,
      };
    });

    const allData = await Promise.all(dataPromises);
    // Filter out null values (transactions that were skipped)
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
    const loads = await Load.find()
      .populate('company_id', 'name')
      .populate('driver_id', 'name')
      .lean();

    const data = await Promise.all(
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
          RentalCode: load.rental_code,
          Company: load.company_id?.name || 'N/A',
          Driver: load.driver_id?.name || 'N/A',
          From: load.from_location,
          To: load.to_location,
          VehicleType: load.vehicle_type,
          Revenue: revenue,
          RevenuePaid: revenuePaid,
          RevenueDue: revenueDue,
          Cost: cost,
          CostPaid: costPaid,
          CostDue: costDue,
          NetProfit: netProfit,
          RentalDate: load.rental_date ? moment(load.rental_date).format('YYYY-MM-DD') : 'N/A',
        };
      })
    );

    const columns = [
      { header: 'Rental Code', key: 'RentalCode', width: 20 },
      { header: 'Company', key: 'Company', width: 25 },
      { header: 'Driver', key: 'Driver', width: 25 },
      { header: 'From', key: 'From', width: 20 },
      { header: 'To', key: 'To', width: 20 },
      { header: 'Vehicle Type', key: 'VehicleType', width: 20 },
      { header: 'Revenue', key: 'Revenue', width: 15 },
      { header: 'Revenue Paid', key: 'RevenuePaid', width: 15 },
      { header: 'Revenue Due', key: 'RevenueDue', width: 15 },
      { header: 'Cost', key: 'Cost', width: 15 },
      { header: 'Cost Paid', key: 'CostPaid', width: 15 },
      { header: 'Cost Due', key: 'CostDue', width: 15 },
      { header: 'Net Profit/Loss', key: 'NetProfit', width: 18 },
      { header: 'Rental Date', key: 'RentalDate', width: 15 },
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
    const loads = await Load.find()
      .populate('company_id', 'name')
      .populate('driver_id', 'name')
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
    const { type, status } = req.query;
    const filter = {};
    if (type) filter.type = type;
    if (status) filter.status = status;

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
    const bills = await Bill.find()
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
