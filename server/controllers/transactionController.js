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
 * 3. Create Load record (to generate rental code)
 * 4. Create Acquisition Payment (Company → Supplier)
 * 5. Create Rental Payment (Driver → Company)
 *
 * Uses MongoDB transactions for atomicity
 */
exports.createRentalTransaction = async (req, res) => {
  // Note: MongoDB transactions require a replica set
  // For standalone MongoDB, we don't use sessions
  let session = null;

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
      rental_amount,
      rental_date,
    } = req.body;

    // Validation
    if (!vehicle_type || !acquisition_cost || !from_location || !to_location || !rental_amount) {
      if (session) await session.abortTransaction();
      return res.status(400).json({
        message: 'Missing required fields: vehicle_type, acquisition_cost, from_location, to_location, rental_amount'
      });
    }

    // 1. Find or create Company
    let company;
    if (company_id) {
      company = await Company.findById(company_id).session(session || undefined);
      if (!company) {
        if (session) await session.abortTransaction();
        return res.status(404).json({ message: 'Company not found' });
      }
    } else if (company_name) {
      // Check if company with this name exists
      company = await Company.findOne({ name: company_name }).session(session || undefined);

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
        company = await company.save({ session: session || undefined });
      }
    } else {
      if (session) await session.abortTransaction();
      return res.status(400).json({ message: 'Either company_id or company_name is required' });
    }

    // 2. Find or create Driver
    let driver;
    if (driver_id) {
      driver = await Driver.findById(driver_id).session(session || undefined);
      if (!driver) {
        if (session) await session.abortTransaction();
        return res.status(404).json({ message: 'Driver not found' });
      }
    } else if (driver_name && driver_iqama_id) {
      // Check if driver with this iqama_id exists
      driver = await Driver.findOne({ iqama_id: driver_iqama_id }).session(session || undefined);

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
          vehicle_type: vehicle_type || '',
          plate_no: plate_no || '',
        });
        driver = await driver.save({ session: session || undefined });
      }
    } else {
      if (session) await session.abortTransaction();
      return res.status(400).json({ message: 'Either driver_id or (driver_name + driver_iqama_id) is required' });
    }

    // 3. Rental amount is provided directly, no calculation needed

    // 5. Create Load record (needed first to get rental_code for acquisition payment)
    const rental_code = await codeGenerator.generateRentalCode();
    const load = new Load({
      rental_code,
      vehicle_type,
      company_id: company._id,
      driver_id: driver._id,
      from_location,
      to_location,
      rental_amount,
      rental_date: new Date(rental_date),
      status: 'pending',
    });

    const savedLoad = await load.save({ session: session || undefined });

    // 4. Create Acquisition Payment (Company → Supplier)
    const acquisitionReceiptCode = await codeGenerator.generateReceiptCode();
    const acquisitionPayment = new Payment({
      payer: company.name,
      payer_id: company._id,
      payee: 'Leonix',
      company_id: company._id,
      driver_id: driver._id,
      load_id: savedLoad._id,
      total_amount: acquisition_cost,
      total_paid: 0,
      total_due: acquisition_cost,
      vehicle_type,
      plate_no,
      acquisition_date: new Date(acquisition_date),
      description: `Vehicle acquisition - ${vehicle_type} (${plate_no}) for ${rental_code}`,
      payment_type: 'vehicle-acquisition',
      status: 'unpaid',
      installments: [],
      date: new Date(),
      transaction_date: new Date(acquisition_date),
      receipt_code: acquisitionReceiptCode,
    });

    const savedAcquisitionPayment = await acquisitionPayment.save({ session: session || undefined });

    // 5. Create Rental Payment (Driver → Company)
    const rentalReceiptCode = await codeGenerator.generateReceiptCode();
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
      plate_no,
      from_location,
      to_location,
      rental_date: new Date(rental_date),
      description: `Rental payment for ${rental_code} - ${from_location} to ${to_location}`,
      payment_type: 'driver-rental',
      status: 'unpaid',
      installments: [],
      date: new Date(),
      transaction_date: new Date(rental_date),
      related_payment_id: savedAcquisitionPayment._id,
      receipt_code: rentalReceiptCode,
    });

    const savedRentalPayment = await rentalPayment.save({ session: session || undefined });

    // Link the payments together
    await Payment.findByIdAndUpdate(
      savedAcquisitionPayment._id,
      { related_payment_id: savedRentalPayment._id },
      { session: session || undefined }
    );

    if (session) await session.commitTransaction();

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
    if (session) await session.abortTransaction();
    console.error('Transaction error:', error);
    res.status(400).json({ message: error.message });
  } finally {
    if (session) session.endSession();
  }
};
exports.getRentalTransactionById = async (req, res) => {
  try {
    const { id } = req.params;

    // 1️⃣ Find Load (rental)
    const load = await Load.findOne({
      $or: [{ _id: id }, { rental_code: id }],
    })
      .populate('company_id', 'name company_code contact address email phone_country_code phone_number')
      .populate('driver_id', 'name driver_code iqama_id phone_country_code phone_number status')
      .lean();

    if (!load) {
      return res.status(404).json({ message: 'Rental transaction not found' });
    }

    // 2️⃣ Find related payments
    const payments = await Payment.find({ load_id: load._id }).lean();

    const rentalPayment = payments.find(p => p.payment_type === 'driver-rental');
    const acquisitionPayment = payments.find(p => p.payment_type === 'vehicle-acquisition');

    // 3️⃣ Combine into one structured response
    res.status(200).json({
      rental_code: load.rental_code,
      vehicle_type: load.vehicle_type,
      from_location: load.from_location,
      to_location: load.to_location,
      rental_amount: load.rental_amount,
      rental_date: load.rental_date,
      status: load.status,

      company: load.company_id, // full populated company object
      driver: load.driver_id,   // full populated driver object

      payments: {
        rental: rentalPayment || null,
        acquisition: acquisitionPayment || null,
      },
    });

  } catch (error) {
    console.error('Error fetching rental transaction:', error);
    res.status(500).json({ message: 'Failed to fetch rental transaction', error: error.message });
  }
};

/**
 * Update Rental Transaction
 *
 * Updates Load and related Payment records
 */
exports.updateRentalTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      vehicle_type,
      plate_no,
      from_location,
      to_location,
      acquisition_cost,
      acquisition_date,
      rental_amount,
      rental_date,
    } = req.body;

    // 1️⃣ Find and update Load
    const load = await Load.findOne({
      $or: [{ _id: id }, { rental_code: id }],
    });

    if (!load) {
      return res.status(404).json({ message: 'Rental transaction not found' });
    }

    // Update load fields
    if (vehicle_type) load.vehicle_type = vehicle_type;
    if (from_location) load.from_location = from_location;
    if (to_location) load.to_location = to_location;
    if (rental_amount) load.rental_amount = rental_amount;
    if (rental_date) load.rental_date = new Date(rental_date);

    await load.save();

    // 2️⃣ Find and update related payments
    const payments = await Payment.find({ load_id: load._id });

    const acquisitionPayment = payments.find(p => p.payment_type === 'vehicle-acquisition');
    const rentalPayment = payments.find(p => p.payment_type === 'driver-rental');

    // Update acquisition payment
    if (acquisitionPayment) {
      if (vehicle_type) acquisitionPayment.vehicle_type = vehicle_type;
      if (plate_no !== undefined) acquisitionPayment.plate_no = plate_no;
      if (acquisition_cost) {
        acquisitionPayment.total_amount = acquisition_cost;
        acquisitionPayment.total_due = acquisition_cost - acquisitionPayment.total_paid;

        // Recalculate status based on new amount
        if (acquisitionPayment.total_paid >= acquisition_cost) {
          acquisitionPayment.status = 'paid';
        } else if (acquisitionPayment.total_paid > 0) {
          acquisitionPayment.status = 'partial';
        } else {
          acquisitionPayment.status = 'unpaid';
        }
      }
      if (acquisition_date) {
        acquisitionPayment.acquisition_date = new Date(acquisition_date);
        acquisitionPayment.transaction_date = new Date(acquisition_date);
      }
      await acquisitionPayment.save();
    }

    // Update rental payment
    if (rentalPayment) {
      if (vehicle_type) rentalPayment.vehicle_type = vehicle_type;
      if (plate_no !== undefined) rentalPayment.plate_no = plate_no;
      if (from_location) rentalPayment.from_location = from_location;
      if (to_location) rentalPayment.to_location = to_location;
      if (rental_amount) {
        rentalPayment.total_amount = rental_amount;
        rentalPayment.total_due = rental_amount - rentalPayment.total_paid;

        // Recalculate status based on new amount
        if (rentalPayment.total_paid >= rental_amount) {
          rentalPayment.status = 'paid';
        } else if (rentalPayment.total_paid > 0) {
          rentalPayment.status = 'partial';
        } else {
          rentalPayment.status = 'unpaid';
        }
      }
      if (rental_date) {
        rentalPayment.rental_date = new Date(rental_date);
        rentalPayment.transaction_date = new Date(rental_date);
      }
      await rentalPayment.save();
    }

    res.status(200).json({
      message: 'Rental transaction updated successfully',
      data: {
        load,
        payments: {
          acquisition: acquisitionPayment,
          rental: rentalPayment,
        },
      },
    });

  } catch (error) {
    console.error('Error updating rental transaction:', error);
    res.status(500).json({ message: 'Failed to update rental transaction', error: error.message });
  }
};