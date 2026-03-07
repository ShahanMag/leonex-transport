const moment = require("moment-timezone");
const generateCompanyReceiptHTML = (payment, company, driver, options = {}) => {
  const saudiTime = moment().tz("Asia/Riyadh").format("DD/MM/YYYY HH:mm");
  const { showInstallments = false, installment = null, watermark = null } = options;

  // If printing a specific installment, show all installments up to and including that one
  const installmentsRows = installment
    ? (() => {
        const idx = payment.installments
          ? payment.installments.findIndex(i => i._id.toString() === installment._id.toString())
          : -1;
        const upTo = idx >= 0 ? payment.installments.slice(0, idx + 1) : [installment];
        return upTo.map((inst, index) => `
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${index + 1}</td>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">SAR ${inst.amount.toLocaleString()}</td>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${moment(inst.paid_date || inst.date).tz("Asia/Riyadh").format("DD/MM/YYYY")}</td>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;"><span class="status-badge status-paid">PAID</span></td>
          </tr>`).join('');
      })()
    : showInstallments &&
        payment.installments &&
        payment.installments.length > 0
      ? payment.installments
          .map(
            (inst, index) => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${index + 1}</td>
          <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">SAR ${inst.amount.toLocaleString()}</td>
          <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${moment(
            inst.paid_date || inst.date,
          )
            .tz("Asia/Riyadh")
            .format("DD/MM/YYYY")}</td>
          <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;"><span class="status-badge status-paid">PAID</span></td>
        </tr>
      `,
          )
          .join("")
      : '<tr><td colspan="4" style="padding: 20px; text-align: center; color: #9ca3af;">No installments recorded</td></tr>';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Company Payment Receipt</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;600;700&display=swap" rel="stylesheet">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, 'Noto Sans Arabic', sans-serif; padding: 15px; color: #1f2937; font-size: 11px; }
        .receipt-container { max-width: 800px; margin: 0 auto; }
        .receipt-info { display: flex; justify-content: space-between; margin-bottom: 10px; }
        .info-block { flex: 1; }
        .info-label { font-weight: bold; color: #6b7280; font-size: 10px; text-transform: uppercase; letter-spacing: 0.03em; }
        .info-value { color: #1f2937; font-size: 11px; margin-bottom: 4px; }
        .section-title { font-size: 10px; font-weight: bold; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; margin: 12px 0 5px 0; border-bottom: 1px solid #e5e7eb; padding-bottom: 3px; }
        .details-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 5px 14px; margin-bottom: 8px; }
        .detail-item .label { font-size: 10px; color: #374151; text-transform: uppercase; letter-spacing: 0.04em; font-weight: 600; }
        .detail-item .value { font-size: 11px; color: #1f2937; font-weight: 500; margin-top: 1px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
        th { background-color: #f9fafb; padding: 5px 7px; text-align: left; font-weight: 600; color: #6b7280; border-bottom: 1px solid #e5e7eb; font-size: 10px; text-transform: uppercase; letter-spacing: 0.03em; }
        td { padding: 5px 7px; border-bottom: 1px solid #f3f4f6; font-size: 11px; color: #374151; }
        .summary-row { display: flex; justify-content: space-between; padding: 3px 0; font-size: 11px; border-bottom: 1px solid #f3f4f6; }
        .summary-label { color: #6b7280; }
        .summary-value { font-weight: 600; color: #1f2937; }
        .status-badge { display: inline-block; padding: 2px 7px; border-radius: 3px; font-weight: bold; font-size: 9px; }
        .status-paid { background-color: #d1fae5; color: #065f46; }
        .status-partial { background-color: #fef3c7; color: #92400e; }
        .status-unpaid { background-color: #fee2e2; color: #991b1b; }
      </style>
    </head>
    <body>
      ${watermark ? `<div style="position:fixed;top:0;left:0;width:100%;height:100%;display:flex;align-items:center;justify-content:center;z-index:-1;pointer-events:none;"><img src="${watermark}" style="width:630px;height:630px;object-fit:contain;" /></div>` : ''}
      <div class="receipt-container">
        <!-- Receipt Info -->
        <div class="receipt-info">
          <div class="info-block">
            <div class="info-label">Receipt No:</div>
            <div class="info-value">${payment.receipt_code || "#" + payment._id.toString().slice(-8).toUpperCase()}</div>
            <div class="info-label">Date:</div>
            <div class="info-value">${saudiTime}</div>
          </div>
          <div class="info-block" style="text-align: right;">
            <div class="info-label">Payment Type:</div>
            <div class="info-value">${payment.payment_type === "vehicle-acquisition" ? "Vehicle Rental" : "Company Expense"}</div>
          </div>
        </div>

        <!-- Company Details -->
        <div class="section-title">Company Details</div>
        <div class="details-grid">
          <div class="detail-item"><div class="label">Company Name</div><div class="value">${company?.name || "N/A"}</div></div>
          <div class="detail-item"><div class="label">Contact Person</div><div class="value">${company?.contact || "N/A"}</div></div>
          <div class="detail-item"><div class="label">Phone</div><div class="value">${company?.phone_country_code || ""} ${company?.phone_number || "N/A"}</div></div>
          <div class="detail-item"><div class="label">Email</div><div class="value">${company?.email || "N/A"}</div></div>
        </div>

        <!-- Vehicle Details -->
        ${payment.vehicle_type ? `
        <div class="section-title">Vehicle Details</div>
        <div class="details-grid">
          <div class="detail-item"><div class="label">Vehicle Type</div><div class="value">${payment.vehicle_type || "N/A"}</div></div>
          <div class="detail-item"><div class="label">Plate Number</div><div class="value">${payment.plate_no || "N/A"}</div></div>
          <div class="detail-item"><div class="label">Purchase Date</div><div class="value">${payment.acquisition_date ? moment(payment.acquisition_date).tz("Asia/Riyadh").format("DD/MM/YYYY") : "N/A"}</div></div>
          <div class="detail-item"><div class="label">From</div><div class="value">${payment.from_location || payment.load_id?.from_location || "N/A"}</div></div>
          <div class="detail-item"><div class="label">To</div><div class="value">${payment.to_location || payment.load_id?.to_location || "N/A"}</div></div>
        </div>
        ` : ""}

        <!-- Driver Details -->
        ${driver ? `
        <div class="section-title">Driver Details</div>
        <div class="details-grid">
          <div class="detail-item"><div class="label">Driver Name</div><div class="value">${driver.name || "N/A"}</div></div>
          <div class="detail-item"><div class="label">Iqama ID</div><div class="value">${driver.iqama_id || "N/A"}</div></div>
          <div class="detail-item"><div class="label">Phone</div><div class="value">${driver.phone_country_code || ""} ${driver.phone_number || "N/A"}</div></div>
        </div>
        ` : ""}

        <!-- Payment Installments -->
        ${
          installment || showInstallments
            ? `
        <div class="section-title">${installment ? "Installment Details" : "Payment History"}</div>
        <table>
          <thead>
            <tr>
              <th style="width: 10%;">#</th>
              <th style="width: 30%;">Amount</th>
              <th style="width: 30%;">Date</th>
              <th style="width: 30%;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${installmentsRows}
          </tbody>
        </table>
        `
            : ""
        }

        <!-- Payment Summary + Signatures: never split across pages -->
        <div style="page-break-inside: avoid;">
          <!-- Payment Summary -->
          <div style="margin-top: 12px; border-top: 1px solid #e5e7eb; padding-top: 10px;">
            <div class="summary-row">
              <span class="summary-label">Total Amount</span>
              <span class="summary-value">SAR ${payment.total_amount.toLocaleString()}</span>
            </div>
            <div class="summary-row">
              <span class="summary-label">Total Paid</span>
              <span class="summary-value" style="color: #059669;">SAR ${payment.total_paid.toLocaleString()}</span>
            </div>
            <div class="summary-row" style="border-bottom: none;">
              <span class="summary-label">Total Due</span>
              <span class="summary-value" style="color: #dc2626;">SAR ${payment.total_due.toLocaleString()}</span>
            </div>
          </div>

          <!-- Signatures -->
          <div style="display: flex; justify-content: space-between; margin-top: 40px; padding: 0 10px;">
            <div style="text-align: center; width: 40%;">
              <div style="border-top: 1px solid #374151; padding-top: 8px; margin-top: 40px;"></div>
              <p style="font-size: 11px; font-weight: bold; color: #374151;">التوقيع المعتمد</p>
              <p style="font-size: 10px; color: #374151;">Authorized Signature</p>
              <p style="font-size: 10px; color: #6b7280; margin-top: 2px;">شركة عيسى للنقل / EESA Transport</p>
            </div>
            <div style="text-align: center; width: 40%;">
              <div style="border-top: 1px solid #374151; padding-top: 8px; margin-top: 40px;"></div>
              <p style="font-size: 11px; font-weight: bold; color: #374151;">توقيع العميل</p>
              <p style="font-size: 10px; color: #374151;">Customer Signature</p>
              <p style="font-size: 10px; color: #6b7280; margin-top: 2px;">${company?.name || ""}</p>
            </div>
          </div>
        </div>

        <!-- OLD FOOTER (commented out for rollback)
        <div class="footer">
          <p>This is a computer-generated receipt.</p>
          <p>EESA Transport © ${new Date().getFullYear()}</p>
        </div>
        END OLD FOOTER -->
      </div>
    </body>
    </html>
  `;
};

module.exports = generateCompanyReceiptHTML;
