const moment = require('moment-timezone');

const generateQuotationHTML = (quotation) => {
  const customer = quotation.customer || {};
  const quotationDate = quotation.quotation_date
    ? moment(quotation.quotation_date).tz('Asia/Riyadh').format('DD/MM/YYYY')
    : moment().tz('Asia/Riyadh').format('DD/MM/YYYY');

  const transportRatesRows = (quotation.transport_rates || [])
    .map(
      (row) => `
      <tr>
        <td>${row.from_location || ''}</td>
        <td>${row.to_location || ''}</td>
        <td>${row.rate_4m_dyna ? row.rate_4m_dyna.toLocaleString() : '—'}</td>
        <td>${row.rate_6m_dyna ? row.rate_6m_dyna.toLocaleString() : '—'}</td>
        <td>${row.rate_fsr ? row.rate_fsr.toLocaleString() : '—'}</td>
        <td>${row.rate_trailer ? row.rate_trailer.toLocaleString() : '—'}</td>
      </tr>`
    )
    .join('');

  const termsItems = (quotation.terms || [])
    .map((t, i) => `<li>${t.description || ''}</li>`)
    .join('');

  const customerPhone = [customer.phone_country_code, customer.phone_number]
    .filter(Boolean)
    .join(' ');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Transportation Service Quotation</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; font-size: 13px; color: #1f2937; padding: 20px 30px; }

    .doc-title {
      text-align: center;
      font-size: 17px;
      font-weight: bold;
      color: #1e40af;
      letter-spacing: 1px;
      margin-bottom: 6px;
      text-transform: uppercase;
    }
    .doc-meta {
      text-align: center;
      font-size: 12px;
      color: #374151;
      margin-bottom: 18px;
    }

    .section-heading {
      font-size: 13px;
      font-weight: bold;
      color: #1e40af;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 2px solid #1e40af;
      padding-bottom: 3px;
      margin: 18px 0 10px 0;
    }

    /* Parties */
    .parties-grid {
      display: flex;
      gap: 20px;
      margin-bottom: 4px;
    }
    .party-box {
      flex: 1;
      border: 1px solid #d1d5db;
      border-radius: 4px;
      padding: 10px 12px;
    }
    .party-label {
      font-weight: bold;
      color: #1e40af;
      margin-bottom: 6px;
      font-size: 12px;
      text-transform: uppercase;
    }
    .party-row { margin-bottom: 3px; }
    .party-key { color: #6b7280; display: inline; }
    .party-val { color: #1f2937; font-weight: 600; display: inline; }

    /* Tables */
    table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
    th {
      background-color: #1e40af;
      color: #fff;
      padding: 7px 10px;
      text-align: center;
      font-weight: bold;
      border: 1px solid #1e3a8a;
    }
    td {
      padding: 6px 10px;
      border: 1px solid #d1d5db;
      text-align: center;
      color: #374151;
    }
    tr:nth-child(even) td { background-color: #f8fafc; }
    td.left { text-align: left; }

    /* Additional charges bullets */
    .charges-wrapper { margin-top: 6px; }
    .charges-group { margin-bottom: 10px; }
    .charges-group-title {
      font-weight: bold;
      color: #374151;
      margin-bottom: 4px;
      font-size: 12.5px;
    }
    .charges-list { list-style: disc; padding-left: 20px; margin: 0; }
    .charges-list li { margin-bottom: 3px; color: #374151; line-height: 1.5; }

    /* Terms */
    ol { padding-left: 22px; }
    ol li { margin-bottom: 5px; line-height: 1.5; }

    /* Acceptance / signatures */
    .acceptance-intro { margin-bottom: 14px; color: #374151; line-height: 1.6; }
    .sig-grid {
      display: flex;
      justify-content: space-between;
      margin-top: 30px;
      gap: 30px;
    }
    .sig-box { flex: 1; }
    .sig-party-label { font-weight: bold; color: #1e40af; margin-bottom: 8px; font-size: 13px; }
    .sig-line {
      border-bottom: 1px solid #374151;
      margin-top: 50px;
      margin-bottom: 6px;
    }
    .sig-caption { font-size: 12px; color: #374151; text-align: center; }
  </style>
</head>
<body>

  <!-- 1. Title -->
  <div class="doc-title">Transportation Service Quotation</div>
  <div class="doc-meta">
    Quotation No: <strong>${quotation.quotation_number || '—'}</strong>
    &nbsp;&nbsp;|&nbsp;&nbsp;
    Date: <strong>${quotationDate}</strong>
  </div>

  <!-- 2. Parties -->
  <div class="section-heading">1. Parties</div>
  <div class="parties-grid">
    <div class="party-box">
      <div class="party-label">First Party (Service Provider)</div>
      <div class="party-row">
        <span class="party-val">EESA Transport Co. &nbsp;/&nbsp; شركة عيسى للنقل</span>
      </div>
      <div class="party-row"><span class="party-key">C.R: </span><span class="party-val">1010569210</span></div>
      <div class="party-row"><span class="party-key">Mobile: </span><span class="party-val">0508702137</span></div>
      <div class="party-row"><span class="party-key">VAT No.: </span><span class="party-val">300756371300003</span></div>
    </div>
    <div class="party-box">
      <div class="party-label">Second Party (Client)</div>
      <div class="party-row"><span class="party-val">${customer.name || '—'}</span></div>
      ${customer.email ? `<div class="party-row"><span class="party-key">Email: </span><span class="party-val">${customer.email}</span></div>` : ''}
      ${customerPhone ? `<div class="party-row"><span class="party-key">Phone: </span><span class="party-val">${customerPhone}</span></div>` : ''}
    </div>
  </div>

  <!-- 3. Transport Rates -->
  <div class="section-heading">2. Transport Rates (SAR)</div>
  <table>
    <thead>
      <tr>
        <th>From</th>
        <th>To</th>
        <th>4M Dyna</th>
        <th>6M Dyna</th>
        <th>FSR</th>
        <th>Trailer</th>
      </tr>
    </thead>
    <tbody>
      ${transportRatesRows || '<tr><td colspan="6" style="text-align:center;color:#9ca3af;">No rates specified</td></tr>'}
    </tbody>
  </table>

  <!-- 4. Additional Charges -->
  <div class="section-heading">3. Additional Charges</div>
  <div class="charges-wrapper">

    <div class="charges-group">
      <div class="charges-group-title">Waiting / Detention</div>
      <ul class="charges-list">
        <li>Dyna: SAR 400 / day</li>
        <li>Trailer: SAR 600 / day</li>
        <li>1 hour free at each location</li>
      </ul>
    </div>

    <div class="charges-group">
      <div class="charges-group-title">Extra Location Charge</div>
      <ul class="charges-list">
        <li>Dyna: SAR 100</li>
        <li>Trailer: SAR 150</li>
      </ul>
    </div>

    <div class="charges-group">
      <div class="charges-group-title">Local Charges — Dyna</div>
      <ul class="charges-list">
        <li>Within 5 km: SAR 150</li>
        <li>5 – 20 km: SAR 200</li>
        <li>Above 20 km: SAR 250</li>
      </ul>
    </div>

    <div class="charges-group">
      <div class="charges-group-title">Local Charges — Lorry</div>
      <ul class="charges-list">
        <li>Within 5 km: SAR 350</li>
      </ul>
    </div>

  </div>

  <!-- 5. Terms & Conditions -->
  ${termsItems ? `
  <div class="section-heading">4. Terms &amp; Conditions</div>
  <ol>${termsItems}</ol>
  ` : ''}

  <!-- 6. Acceptance -->
  <div class="section-heading">${termsItems ? '5' : '4'}. Acceptance</div>
  <p class="acceptance-intro">
    By signing below, both parties agree to the rates and conditions set out in this quotation.
  </p>
  <div class="sig-grid">
    <div class="sig-box">
      <div class="sig-party-label">First Party — EESA Transport Co.</div>
      <div class="sig-line"></div>
      <div class="sig-caption">Signature</div>
    </div>
    <div class="sig-box">
      <div class="sig-party-label">Second Party — ${customer.name || 'Client'}</div>
      <div class="sig-line"></div>
      <div class="sig-caption">Signature</div>
    </div>
  </div>

</body>
</html>`;
};

module.exports = generateQuotationHTML;
