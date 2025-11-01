const mongoose = require('mongoose');
const Company = require('../models/Company');
const Driver = require('../models/Driver');
const Payment = require('../models/Payment');
const Load = require('../models/Load');
const codeGenerator = require('../utils/codeGenerator');

/**
 * Create Rental Transaction
 *
 * This unified endpoint handles the complete rental transaction flow:
 * 1. Find or create Company
 * 2. Find or create Driver
 * 3. Create Acquisition Payment (Company → Supplier)
 * 4. Create Rental Payment (Driver → Company)
 * 5. Create Load record
 *
 * Uses MongoDB transactions for atomicity
 */
exports.createRentalTransaction = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      // Company data
      company_id,
      company_name,
      company_contact,
      company_address,
      company_email,
      company_phone_country_code = '+91',
      company_phone_number,

      // Driver data
      driver_id,
      driver_name,
      driver_iqama_id,
      driver_phone_country_code = '+966',
      driver_phone_number,

      // Vehicle & Acquisition data
      vehicle_type,
      plate_no,
      acquisition_cost,
      acquisition_date,

      // Load & Rental data
      from_location,
      to_location,
      load_description,
      rental_price_per_day,
      rental_type = 'per_day',
      rental_date,
      start_date,
      end_date,
      distance_km,
    } = req.body;

    // Validation
    if (!vehicle_type || !acquisition_cost || !from_location || !to_location || !rental_price_per_day) {
      await session.abortTransaction();
      return res.status(400).json({
        message: 'Missing required fields: vehicle_type, acquisition_cost, from_location, to_location, rental_price_per_day'
      });
    }

    // 1. Find or create Company
    let company;
    if (company_id) {
      company = await Company.findById(company_id).session(session);
      if (!company) {
        await session.abortTransaction();
        return res.status(404).json({ message: 'Company not found' });
      }
    } else if (company_name) {
      // Check if company with this name exists
      company = await Company.findOne({ name: company_name }).session(session);

      if (!company) {
        // Create new company
        const company_code = await codeGenerator.generateCompanyCode();
        company = new Company({
          company_code,
          name: company_name,
          contact: company_contact || '',
          address: company_address || '',
          email: company_email,
          phone_country_code: company_phone_country_code,
          phone_number: company_phone_number,
        });
        company = await company.save({ session });
      }
    } else {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Either company_id or company_name is required' });
    }

    // 2. Find or create Driver
    let driver;
    if (driver_id) {
      driver = await Driver.findById(driver_id).session(session);
      if (!driver) {
        await session.abortTransaction();
        return res.status(404).json({ message: 'Driver not found' });
      }
    } else if (driver_name && driver_iqama_id) {
      // Check if driver with this iqama_id exists
      driver = await Driver.findOne({ iqama_id: driver_iqama_id }).session(session);

      if (!driver) {
        // Create new driver
        const driver_code = await codeGenerator.generateDriverCode();
        driver = new Driver({
          driver_code,
          name: driver_name,
          iqama_id: driver_iqama_id,
          phone_country_code: driver_phone_country_code,
          phone_number: driver_phone_number,
          status: 'active',
        });
        driver = await driver.save({ session });
      }
    } else {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Either driver_id or (driver_name + driver_iqama_id) is required' });
    }

    // 3. Calculate rental amount
    const calculateDaysRented = (startDate, endDate) => {
      if (!startDate || !endDate) return null;
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    };

    const calculateRentalAmount = (type, pricePerDay, daysRented, distKm) => {
      if (type === 'per_day') {
        return daysRented * pricePerDay;
      } else if (type === 'per_job') {
        return pricePerDay;
      } else if (type === 'per_km') {
        return distKm * pricePerDay;
      }
      return pricePerDay;
    };

    const days_rented = calculateDaysRented(start_date, end_date);
    const rental_amount = calculateRentalAmount(rental_type, rental_price_per_day, days_rented, distance_km);

    // 4. Create Acquisition Payment (Company → Supplier)
    const acquisitionPayment = new Payment({
      payer: company.name,
      payer_id: company._id,
      payee: 'Supplier',
      company_id: company._id,
      total_amount: acquisition_cost,
      total_paid: 0,
      total_due: acquisition_cost,
      vehicle_type,
      plate_no,
      acquisition_date: new Date(acquisition_date),
      description: `Vehicle acquisition - ${vehicle_type} (${plate_no})`,
      payment_type: 'vehicle-acquisition',
      status: 'unpaid',
      installments: [],
      date: new Date(),
      transaction_date: new Date(acquisition_date),
    });

    const savedAcquisitionPayment = await acquisitionPayment.save({ session });

    // 5. Create Load record
    const rental_code = await codeGenerator.generateRentalCode();
    const load = new Load({
      rental_code,
      vehicle_type,
      driver_id: driver._id,
      from_location,
      to_location,
      load_description,
      rental_price_per_day,
      rental_type,
      rental_amount,
      actual_rental_cost: rental_amount,
      start_date: new Date(start_date),
      end_date: new Date(end_date),
      distance_km,
      days_rented,
      status: 'pending',
    });

    const savedLoad = await load.save({ session });

    // 6. Create Rental Payment (Driver → Company)
    const rentalPayment = new Payment({
      payer: driver.name,
      payer_id: driver._id,
      payee: company.name,
      payee_id: company._id,
      company_id: company._id,
      driver_id: driver._id,
      load_id: savedLoad._id,
      total_amount: rental_amount,
      total_paid: 0,
      total_due: rental_amount,
      vehicle_type,
      from_location,
      to_location,
      rental_date: new Date(rental_date || start_date),
      description: `Rental payment for ${rental_code} - ${from_location} to ${to_location}`,
      payment_type: 'driver-rental',
      status: 'unpaid',
      installments: [],
      date: new Date(),
      transaction_date: new Date(rental_date || start_date),
      related_payment_id: savedAcquisitionPayment._id,
    });

    const savedRentalPayment = await rentalPayment.save({ session });

    // Link the payments together
    await Payment.findByIdAndUpdate(
      savedAcquisitionPayment._id,
      { related_payment_id: savedRentalPayment._id },
      { session }
    );

    await session.commitTransaction();

    res.status(201).json({
      message: 'Rental transaction created successfully',
      data: {
        company: {
          _id: company._id,
          name: company.name,
          company_code: company.company_code,
        },
        driver: {
          _id: driver._id,
          name: driver.name,
          driver_code: driver.driver_code,
        },
        load: {
          _id: savedLoad._id,
          rental_code: savedLoad.rental_code,
          from_location: savedLoad.from_location,
          to_location: savedLoad.to_location,
        },
        payments: {
          acquisition_payment_id: savedAcquisitionPayment._id,
          acquisition_amount: acquisition_cost,
          rental_payment_id: savedRentalPayment._id,
          rental_amount: rental_amount,
        },
      }
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('Transaction error:', error);
    res.status(400).json({ message: error.message });
  } finally {
    session.endSession();
  }
};
