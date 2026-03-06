const Company = require('../models/Company');
const Driver = require('../models/Driver');
const Load = require('../models/Load');
const Payment = require('../models/Payment');
const Quotation = require('../models/Quotation');

/**
 * Generate unique company code
 * Format: COMP-XXX (3-digit incrementing number)
 */
exports.generateCompanyCode = async () => {
  try {
    const lastCompany = await Company.findOne()
      .select('company_code')
      .sort({ _id: -1 })
      .exec();

    let nextNumber = 1;
    if (lastCompany && lastCompany.company_code) {
      const match = lastCompany.company_code.match(/COMP-(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1]) + 1;
      }
    }

    return `COMP-${String(nextNumber).padStart(3, '0')}`;
  } catch (error) {
    console.error('Error generating company code:', error);
    throw error;
  }
};

/**
 * Generate unique driver code
 * Format: DRV-XXX (3-digit incrementing number)
 */
exports.generateDriverCode = async () => {
  try {
    const lastDriver = await Driver.findOne()
      .select('driver_code')
      .sort({ _id: -1 })
      .exec();

    let nextNumber = 1;
    if (lastDriver && lastDriver.driver_code) {
      const match = lastDriver.driver_code.match(/DRV-(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1]) + 1;
      }
    }

    return `DRV-${String(nextNumber).padStart(3, '0')}`;
  } catch (error) {
    console.error('Error generating driver code:', error);
    throw error;
  }
};

/**
 * Generate unique receipt code
 * Format: ESSA1001, ESSA1002, ...
 */
exports.generateReceiptCode = async () => {
  try {
    const lastPayment = await Payment.findOne({ receipt_code: { $regex: '^ESSA' }, is_deleted: { $in: [true, false, null] } })
      .select('receipt_code')
      .sort({ receipt_code: -1 })
      .exec();

    let nextNumber = 1001;
    if (lastPayment && lastPayment.receipt_code) {
      const match = lastPayment.receipt_code.match(/ESSA(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1]) + 1;
      }
    }

    return `ESSA${nextNumber}`;
  } catch (error) {
    console.error('Error generating receipt code:', error);
    throw error;
  }
};

/**
 * Generate unique vehicle (company acquisition) receipt code
 * Format: EESA-VEH-YYYY-XXXX (e.g. EESA-VEH-2025-0001)
 */
exports.generateVehicleReceiptCode = async () => {
  try {
    const currentYear = new Date().getFullYear();
    const lastPayment = await Payment.findOne({
      receipt_code: { $regex: `^EESA-VEH-${currentYear}-` },
      is_deleted: { $in: [true, false, null] },
    })
      .select('receipt_code')
      .sort({ receipt_code: -1 })
      .exec();

    let nextNumber = 1;
    if (lastPayment && lastPayment.receipt_code) {
      const match = lastPayment.receipt_code.match(/EESA-VEH-\d+-(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1]) + 1;
      }
    }

    return `EESA-VEH-${currentYear}-${String(nextNumber).padStart(4, '0')}`;
  } catch (error) {
    console.error('Error generating vehicle receipt code:', error);
    throw error;
  }
};

/**
 * Generate unique driver rental receipt code
 * Format: EESA-DRV-YYYY-XXXX (e.g. EESA-DRV-2025-0001)
 */
exports.generateDriverReceiptCode = async () => {
  try {
    const currentYear = new Date().getFullYear();
    const lastPayment = await Payment.findOne({
      receipt_code: { $regex: `^EESA-DRV-${currentYear}-` },
      is_deleted: { $in: [true, false, null] },
    })
      .select('receipt_code')
      .sort({ receipt_code: -1 })
      .exec();

    let nextNumber = 1;
    if (lastPayment && lastPayment.receipt_code) {
      const match = lastPayment.receipt_code.match(/EESA-DRV-\d+-(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1]) + 1;
      }
    }

    return `EESA-DRV-${currentYear}-${String(nextNumber).padStart(4, '0')}`;
  } catch (error) {
    console.error('Error generating driver receipt code:', error);
    throw error;
  }
};

/**
 * Generate unique quotation code
 * Format: EESA-QUO-YYYY-XXXX (e.g. EESA-QUO-2026-0001)
 */
exports.generateQuotationCode = async () => {
  try {
    const currentYear = new Date().getFullYear();
    const lastQuotation = await Quotation.findOne({
      quotation_number: { $regex: `^EESA-QUO-${currentYear}-` },
      is_deleted: { $ne: true },
    })
      .select('quotation_number')
      .sort({ _id: -1 })
      .exec();

    let nextNumber = 1;
    if (lastQuotation && lastQuotation.quotation_number) {
      const match = lastQuotation.quotation_number.match(/EESA-QUO-\d+-(\d+)/);
      if (match) nextNumber = parseInt(match[1]) + 1;
    }

    return `EESA-QUO-${currentYear}-${String(nextNumber).padStart(4, '0')}`;
  } catch (error) {
    console.error('Error generating quotation code:', error);
    throw error;
  }
};

/**
 * Generate unique rental code
 * Format: RNT-YYYY-XXX (Year-3-digit incrementing number)
 */
exports.generateRentalCode = async () => {
  try {
    const currentYear = new Date().getFullYear();
    const prefix = `RNT-${currentYear}-`;

    const lastLoad = await Load.findOne({ rental_code: { $regex: `^${prefix}` }, is_deleted: { $in: [true, false, null] } })
      .select('rental_code')
      .sort({ rental_code: -1 })
      .exec();

    let nextNumber = 1;
    if (lastLoad && lastLoad.rental_code) {
      const match = lastLoad.rental_code.match(/RNT-\d+-(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1]) + 1;
      }
    }

    return `${prefix}${String(nextNumber).padStart(3, '0')}`;
  } catch (error) {
    console.error('Error generating rental code:', error);
    throw error;
  }
};
