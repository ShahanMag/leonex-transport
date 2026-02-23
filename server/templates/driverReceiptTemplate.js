const moment = require('moment');

const generateDriverReceiptHTML = (payment, company, driver, options = {}) => {
  const { showInstallments = false, installment = null } = options;

  // If printing a specific installment, show only that one
  const installmentsRows = installment
    ? `<tr>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">1</td>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">SAR ${installment.amount.toLocaleString()}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${moment(installment.paid_date || installment.date).format('DD/MM/YYYY')}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${installment.notes || '-'}</td>
      </tr>`
    : showInstallments && payment.installments && payment.installments.length > 0
    ? payment.installments.map((inst, index) => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${index + 1}</td>
          <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">SAR ${inst.amount.toLocaleString()}</td>
          <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${moment(inst.paid_date || inst.date).format('DD/MM/YYYY')}</td>
          <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${inst.notes || '-'}</td>
        </tr>
      `).join('')
    : '<tr><td colspan="4" style="padding: 20px; text-align: center; color: #9ca3af;">No installments recorded</td></tr>';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Driver Rental Payment Receipt</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; padding: 15px; color: #1f2937; }
        .receipt-container { max-width: 800px; margin: 0 auto; }
        .header { text-align: center; margin-bottom: 15px; border-bottom: 2px solid #8b5cf6; padding-bottom: 10px; }
        .company-name { font-size: 22px; font-weight: bold; color: #1f2937; margin-bottom: 3px; }
        .receipt-title { font-size: 16px; color: #6b7280; margin-top: 5px; }
        .receipt-info { display: flex; justify-content: space-between; margin-bottom: 15px; }
        .info-block { flex: 1; }
        .info-label { font-weight: bold; color: #4b5563; margin-bottom: 3px; font-size: 13px; }
        .info-value { color: #1f2937; margin-bottom: 6px; font-size: 13px; }
        .section-title { font-size: 15px; font-weight: bold; color: #1f2937; margin: 15px 0 8px 0; border-left: 3px solid #8b5cf6; padding-left: 8px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
        th { background-color: #f3f4f6; padding: 8px; text-align: left; font-weight: bold; color: #374151; border-bottom: 2px solid #d1d5db; font-size: 13px; }
        td { padding: 6px 8px; border-bottom: 1px solid #e5e7eb; font-size: 13px; }
        .summary-box { background-color: #faf5ff; border: 2px solid #e9d5ff; border-radius: 6px; padding: 12px; margin-top: 15px; }
        .summary-row { display: flex; justify-content: space-between; padding: 5px 0; font-size: 13px; }
        .summary-label { font-weight: bold; color: #4b5563; }
        .summary-value { color: #1f2937; font-weight: bold; }
        .total-row { border-top: 2px solid #d1d5db; margin-top: 8px; padding-top: 8px; font-size: 15px; }
        .status-badge { display: inline-block; padding: 4px 10px; border-radius: 4px; font-weight: bold; font-size: 12px; }
        .status-paid { background-color: #d1fae5; color: #065f46; }
        .status-partial { background-color: #fef3c7; color: #92400e; }
        .status-unpaid { background-color: #fee2e2; color: #991b1b; }
        .footer { text-align: center; margin-top: 20px; padding-top: 12px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 11px; }
      </style>
    </head>
    <body>
      <div class="receipt-container">
        <!-- Header -->
        <div class="header" style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #8b5cf6; padding-bottom: 12px; margin-bottom: 15px; text-align: unset;">
          <!-- English (Left) -->
          <div style="text-align: left;">
            <div style="font-size: 20px; font-weight: bold; color: #1f2937;">EESA Transport Co.</div>
            <div style="font-size: 12px; color: #4b5563; margin-top: 4px;">C.R: 1010569210</div>
            <div style="font-size: 12px; color: #4b5563;">Mobile: 0508702137</div>
            <div style="font-size: 12px; color: #4b5563;">VAT No.: 300756371300003</div>
            <div style="font-size: 13px; color: #6b7280; margin-top: 6px;">${installment ? 'Payment Voucher' : 'Driver Rental Payment Summary'}</div>
          </div>
          <!-- Arabic (Right) -->
          <div style="text-align: right; direction: rtl;">
            <div style="font-size: 20px; font-weight: bold; color: #1f2937;">شركة عيسى للنقل</div>
            <div style="font-size: 12px; color: #4b5563; margin-top: 4px;">س.ت: ١٠١٠٥٦٩٢١٠</div>
            <div style="font-size: 12px; color: #4b5563;">الجوال: ٠٥٠٨٧٠٢١٣٧</div>
            <div style="font-size: 12px; color: #4b5563;">الرقم الضريبي: ٣٠٠٧٥٦٣٧١٣٠٠٠٠٣</div>
            <div style="font-size: 13px; color: #6b7280; margin-top: 6px;">${installment ? 'سند صرف' : 'ملخص مدفوعات السائق'}</div>
          </div>
        </div>

        <!-- Receipt Info -->
        <div class="receipt-info">
          <div class="info-block">
            <div class="info-label">Receipt No:</div>
            <div class="info-value">#${payment._id.toString().slice(-8).toUpperCase()}</div>
            <div class="info-label">Date:</div>
            <div class="info-value">${moment().format('DD/MM/YYYY HH:mm')}</div>
          </div>
          <div class="info-block" style="text-align: right;">
            <div class="info-label">Payment Type:</div>
            <div class="info-value">${payment.payment_type === 'driver-rental' ? 'Driver Rental' : 'Rental Payment'}</div>
          </div>
        </div>

        <!-- Driver Details -->
        <div class="section-title">Driver Details</div>
        <table>
          <tr>
            <th style="width: 30%;">Driver Name</th>
            <td>${driver?.name || 'N/A'}</td>
          </tr>
          <tr>
            <th>Iqama ID</th>
            <td>${driver?.iqama_id || 'N/A'}</td>
          </tr>
          <tr>
            <th>Phone</th>
            <td>${driver?.phone_country_code || ''} ${driver?.phone_number || 'N/A'}</td>
          </tr>
        </table>

        <!-- Company Details -->
        <div class="section-title">Company Details</div>
        <table>
          <tr>
            <th style="width: 30%;">Company Name</th>
            <td>${company?.name || 'N/A'}</td>
          </tr>
          <tr>
            <th>Contact Person</th>
            <td>${company?.contact || 'N/A'}</td>
          </tr>
        </table>

        <!-- Vehicle/Load Details -->
        ${payment.vehicle_type ? `
        <div class="section-title">Vehicle & Load Details</div>
        <table>
          <tr>
            <th style="width: 30%;">Vehicle Type</th>
            <td>${payment.vehicle_type || 'N/A'}</td>
          </tr>
          <tr>
            <th>Plate Number</th>
            <td>${payment.plate_no || 'N/A'}</td>
          </tr>
          <tr>
            <th style="width: 25%;">From Location</th>
            <td style="width: 25%;">${payment.from_location || payment.load_id?.from_location || 'N/A'}</td>
            <th style="width: 25%;">Rental Date</th>
            <td style="width: 25%;">${payment.rental_date ? moment(payment.rental_date).format('DD/MM/YYYY') : 'N/A'}</td>
          </tr>
          <tr>
            <th>To Location</th>
            <td colspan="3">${payment.to_location || payment.load_id?.to_location || 'N/A'}</td>
          </tr>
        </table>
        ` : ''}

        <!-- Payment Installments -->
        ${installment || showInstallments ? `
        <div class="section-title">${installment ? 'Installment Details' : 'Payment History'}</div>
        <table>
          <thead>
            <tr>
              <th style="width: 10%;">#</th>
              <th style="width: 30%;">Amount</th>
              <th style="width: 30%;">Date</th>
              <th style="width: 30%;">Notes</th>
            </tr>
          </thead>
          <tbody>
            ${installmentsRows}
          </tbody>
        </table>
        ` : ''}

        <!-- Payment Summary -->
        <div class="summary-box">
          <div class="summary-row">
            <span class="summary-label">Total Amount:</span>
            <span class="summary-value">SAR ${payment.total_amount.toLocaleString()}</span>
          </div>
          <div class="summary-row">
            <span class="summary-label">Total Paid:</span>
            <span class="summary-value" style="color: #059669;">SAR ${payment.total_paid.toLocaleString()}</span>
          </div>
          <div class="summary-row">
            <span class="summary-label">Total Due:</span>
            <span class="summary-value" style="color: #dc2626;">SAR ${payment.total_due.toLocaleString()}</span>
          </div>
          <div class="summary-row total-row">
            <span class="summary-label">Payment Status:</span>
            <span class="summary-value">
              <span class="status-badge status-${payment.status}">
                ${payment.status.toUpperCase()}
              </span>
            </span>
          </div>
        </div>

        <!-- Signatures -->
        <div style="display: flex; justify-content: space-between; margin-top: 40px; padding: 0 10px;">
          <div style="text-align: center; width: 40%;">
            <div style="border-top: 1px solid #374151; padding-top: 8px; margin-top: 40px;"></div>
            <p style="font-size: 13px; font-weight: bold; color: #374151;">التوقيع المعتمد</p>
            <p style="font-size: 12px; color: #374151;">Authorized Signature</p>
            <p style="font-size: 11px; color: #6b7280; margin-top: 2px;">شركة عيسى للنقل / EESA Transport</p>
          </div>
          <div style="text-align: center; width: 40%;">
            <div style="border-top: 1px solid #374151; padding-top: 8px; margin-top: 40px;"></div>
            <p style="font-size: 13px; font-weight: bold; color: #374151;">توقيع العميل</p>
            <p style="font-size: 12px; color: #374151;">Customer Signature</p>
            <p style="font-size: 11px; color: #6b7280; margin-top: 2px;">${driver?.name || ''}</p>
          </div>
        </div>

        <!-- Footer -->
        <div class="footer">
          <p>This is a computer-generated receipt.</p>
          <p>EESA Transport © ${new Date().getFullYear()}</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

module.exports = generateDriverReceiptHTML;
