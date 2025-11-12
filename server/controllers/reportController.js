const ExcelJS = require('exceljs');
const moment = require('moment');
const Company = require('../models/Company');
const Driver = require('../models/Driver');
const Vehicle = require('../models/Vehicle');
const Load = require('../models/Load');
const Payment = require('../models/Payment');

/**
 * Helper: Generate Excel file from data array
 */
const generateExcel = async (sheetName, columns, data, res) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(sheetName);

    worksheet.columns = columns;
    worksheet.addRows(data);

    // Add simple styling
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

/**
 * 🏢 Company Report
 */
exports.getCompanyReport = async (req, res) => {
  try {
    const companies = await Company.find().lean();

    const data = companies.map(c => ({
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

/**
 * 👷 Driver Report
 */
exports.getDriverReport = async (req, res) => {
  try {
    const drivers = await Driver.find().lean();

    const data = drivers.map(d => ({
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

/**
 * 🚚 Vehicle Report
 */
exports.getVehicleReport = async (req, res) => {
  try {
    const vehicles = await Vehicle.find().populate('company_id').lean();

    const data = vehicles.map(v => ({
      VehicleType: v.vehicle_type,
      PlateNo: v.plate_no,
      Company: v.company_id?.name || 'N/A',
      AcquisitionCost: v.acquisition_cost || 0,
      AcquisitionDate: moment(v.acquisition_date).format('YYYY-MM-DD'),
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

/**
 * 📦 Load Report
 */
exports.getLoadReport = async (req, res) => {
  try {
    const loads = await Load.find()
      .populate('company_id')
      .populate('driver_id')
      .lean();

    const data = loads.map(l => ({
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

/**
 * 💰 Payment Report
 */
exports.getPaymentReport = async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate('company_id')
      .populate('driver_id')
      .populate('load_id')
      .lean();

    const data = payments.map(p => ({
      PaymentType: p.payment_type,
      Company: p.company_id?.name || 'N/A',
      Driver: p.driver_id?.name || 'N/A',
      LoadCode: p.load_id?.rental_code || 'N/A',
      TotalAmount: p.total_amount,
      Status: p.status,
      TransactionDate: moment(p.transaction_date).format('YYYY-MM-DD'),
    }));

    const columns = [
      { header: 'Payment Type', key: 'PaymentType', width: 20 },
      { header: 'Company', key: 'Company', width: 25 },
      { header: 'Driver', key: 'Driver', width: 25 },
      { header: 'Load Code', key: 'LoadCode', width: 20 },
      { header: 'Total Amount', key: 'TotalAmount', width: 20 },
      { header: 'Status', key: 'Status', width: 15 },
      { header: 'Transaction Date', key: 'TransactionDate', width: 20 },
    ];

    await generateExcel('Payment Report', columns, data, res);
  } catch (err) {
    console.error('Payment report error:', err);
    res.status(500).json({ message: 'Failed to generate payment report' });
  }
};
