const Company = require('../models/Company');
const Driver = require('../models/Driver');
const Load = require('../models/Load');

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
 * Generate unique rental code
 * Format: RNT-YYYY-XXX (Year-3-digit incrementing number)
 */
exports.generateRentalCode = async () => {
  try {
    const currentYear = new Date().getFullYear();
    const lastLoad = await Load.findOne()
      .select('rental_code')
      .sort({ _id: -1 })
      .exec();

    let nextNumber = 1;
    if (lastLoad && lastLoad.rental_code) {
      const match = lastLoad.rental_code.match(/RNT-\d+-(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1]) + 1;
      }
    }

    return `RNT-${currentYear}-${String(nextNumber).padStart(3, '0')}`;
  } catch (error) {
    console.error('Error generating rental code:', error);
    throw error;
  }
};
