const fs = require('fs');
const path = require('path');
const chromium = require('@sparticuz/chromium');
const Payment = require('../models/Payment');
const Company = require('../models/Company');
const Driver = require('../models/Driver');
const generateCompanyReceiptHTML = require('../templates/companyReceiptTemplate');
const generateDriverReceiptHTML = require('../templates/driverReceiptTemplate');

// Pre-load header and footer images as base64 data URIs for Puppeteer PDF templates
const headerBase64 = `data:image/png;base64,${fs.readFileSync(path.join(__dirname, '../assets/EESA header.png')).toString('base64')}`;
const footerBase64 = `data:image/png;base64,${fs.readFileSync(path.join(__dirname, '../assets/EESA Footer.png')).toString('base64')}`;

// Renders on every page via Puppeteer's native header/footer support
const pdfHeaderTemplate = `<div style="margin:0;padding:0;width:100%;"><img src="${headerBase64}" style="width:100%;height:230px;object-fit:fill;display:block;margin-top:-50px;" /></div>`;
const pdfFooterTemplate = `<div style="margin:0;padding:0;width:65%;margin-left:auto;margin-right:auto;"><img src="${footerBase64}" style="width:100%;height:220px;object-fit:fill;display:block;margin-bottom:-100px;" /></div>`;

// Detect environment and use appropriate puppeteer configuration
const isProduction = process.env.VERCEL || process.env.NODE_ENV === 'production';
const puppeteer = isProduction
  ? require('puppeteer-core')
  : require('puppeteer');

// Get browser launch options based on environment
const getBrowserOptions = async () => {
  if (isProduction) {
    // Use @sparticuz/chromium for Vercel/serverless
    return {
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    };
  } else {
    // Use local Chrome for development
    return {
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    };
  }
};

// Generate Company Receipt PDF
exports.generateCompanyReceipt = async (req, res) => {
  try {
    const { paymentId } = req.params;

    // Fetch payment with populated references
    const payment = await Payment.findById(paymentId)
      .populate('company_id')
      .populate('driver_id')
      .populate('load_id')
      .lean();

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    // Verify this is a company payment type
    if (payment.payment_type !== 'vehicle-acquisition') {
      return res.status(400).json({
        message: 'This payment is not a company payment. Use driver receipt endpoint instead.'
      });
    }

    const company = payment.company_id;
    const driver = payment.driver_id;

    // Generate HTML (summary mode - no installment breakdown)
    const html = generateCompanyReceiptHTML(payment, company, driver, { showInstallments: false });

    // Launch Puppeteer and generate PDF
    const browserOptions = await getBrowserOptions();
    const browser = await puppeteer.launch(browserOptions);

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: pdfHeaderTemplate,
      footerTemplate: pdfFooterTemplate,
      margin: {
        top: '190px',
        right: '10px',
        bottom: '130px',
        left: '10px'
      }
    });

    await browser.close();

    // Send PDF as response
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=company-receipt-${payment._id}.pdf`);
    res.send(pdfBuffer);

  } catch (error) {
    console.error('Error generating company receipt:', error);
    res.status(500).json({ message: 'Failed to generate receipt', error: error.message });
  }
};

// Generate Driver Receipt PDF
exports.generateDriverReceipt = async (req, res) => {
  try {
    const { paymentId } = req.params;

    // Fetch payment with populated references
    const payment = await Payment.findById(paymentId)
      .populate('company_id')
      .populate('driver_id')
      .populate('load_id')
      .lean();

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    // Verify this is a driver rental payment type
    if (!['driver-rental', 'rental-payment'].includes(payment.payment_type)) {
      return res.status(400).json({
        message: 'This payment is not a driver rental payment. Use company receipt endpoint instead.'
      });
    }

    const company = payment.company_id;
    const driver = payment.driver_id;

    // Generate HTML (summary mode - no installment breakdown)
    const html = generateDriverReceiptHTML(payment, company, driver, { showInstallments: false });

    // Launch Puppeteer and generate PDF
    const browserOptions = await getBrowserOptions();
    const browser = await puppeteer.launch(browserOptions);

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: pdfHeaderTemplate,
      footerTemplate: pdfFooterTemplate,
      margin: {
        top: '190px',
        right: '10px',
        bottom: '130px',
        left: '10px'
      }
    });

    await browser.close();

    // Send PDF as response
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=driver-receipt-${payment._id}.pdf`);
    res.send(pdfBuffer);

  } catch (error) {
    console.error('Error generating driver receipt:', error);
    res.status(500).json({ message: 'Failed to generate receipt', error: error.message });
  }
};

// Generate Company Installment Receipt PDF
exports.generateCompanyInstallmentReceipt = async (req, res) => {
  try {
    const { paymentId, installmentId } = req.params;

    // Fetch payment with populated references
    const payment = await Payment.findById(paymentId)
      .populate('company_id')
      .populate('driver_id')
      .populate('load_id')
      .lean();

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    // Verify this is a company payment type
    if (payment.payment_type !== 'vehicle-acquisition') {
      return res.status(400).json({
        message: 'This payment is not a company payment.'
      });
    }

    // Find the specific installment
    const installment = payment.installments.find(inst => inst._id.toString() === installmentId);
    if (!installment) {
      return res.status(404).json({ message: 'Installment not found' });
    }

    const company = payment.company_id;
    const driver = payment.driver_id;

    // Generate HTML with specific installment
    const html = generateCompanyReceiptHTML(payment, company, driver, { installment });

    // Launch Puppeteer and generate PDF
    const browserOptions = await getBrowserOptions();
    const browser = await puppeteer.launch(browserOptions);

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: pdfHeaderTemplate,
      footerTemplate: pdfFooterTemplate,
      margin: {
        top: '190px',
        right: '10px',
        bottom: '130px',
        left: '10px'
      }
    });

    await browser.close();

    // Send PDF as response
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=company-installment-${installmentId}.pdf`);
    res.send(pdfBuffer);

  } catch (error) {
    console.error('Error generating company installment receipt:', error);
    res.status(500).json({ message: 'Failed to generate receipt', error: error.message });
  }
};

// Generate Driver Installment Receipt PDF
exports.generateDriverInstallmentReceipt = async (req, res) => {
  try {
    const { paymentId, installmentId } = req.params;

    // Fetch payment with populated references
    const payment = await Payment.findById(paymentId)
      .populate('company_id')
      .populate('driver_id')
      .populate('load_id')
      .lean();

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    // Verify this is a driver rental payment type
    if (!['driver-rental', 'rental-payment'].includes(payment.payment_type)) {
      return res.status(400).json({
        message: 'This payment is not a driver rental payment.'
      });
    }

    // Find the specific installment
    const installment = payment.installments.find(inst => inst._id.toString() === installmentId);
    if (!installment) {
      return res.status(404).json({ message: 'Installment not found' });
    }

    const company = payment.company_id;
    const driver = payment.driver_id;

    // Generate HTML with specific installment
    const html = generateDriverReceiptHTML(payment, company, driver, { installment });

    // Launch Puppeteer and generate PDF
    const browserOptions = await getBrowserOptions();
    const browser = await puppeteer.launch(browserOptions);

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: pdfHeaderTemplate,
      footerTemplate: pdfFooterTemplate,
      margin: {
        top: '190px',
        right: '10px',
        bottom: '130px',
        left: '10px'
      }
    });

    await browser.close();

    // Send PDF as response
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=driver-installment-${installmentId}.pdf`);
    res.send(pdfBuffer);

  } catch (error) {
    console.error('Error generating driver installment receipt:', error);
    res.status(500).json({ message: 'Failed to generate receipt', error: error.message });
  }
};
