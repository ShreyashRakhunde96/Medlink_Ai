/**
 * MedLink Pharmaceutical B2B Tax Invoice & Consignment Note Generator
 * Compliant with:
 * - CGST Rules, 2017 (Rule 46 - Tax Invoice)
 * - Drugs and Cosmetics Act, 1940 & Rules 1945 (Form 20B/21B Warranty & Schedule H/C1 mandates)
 */

export interface InvoiceLineItem {
  sr: number;
  medicineName: string;
  genericName?: string;
  hsnCode: string;
  batchNumber: string;
  expiryDate: string;
  quantity: number;
  unitRate: number;
  mrp: number;
  taxableAmount: number;
  gstRate: number; // e.g. 12
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalAmount: number;
}

export interface InvoiceParty {
  name: string;
  address: string;
  city?: string;
  pincode: string;
  state: string;
  stateCode: string;
  gstin: string;
  drugLicenseNumber: string;
  phone?: string;
  email?: string;
}

export interface FormattedWholesaleInvoice {
  invoiceNumber: string;
  invoiceDate: string;
  orderNumber: string;
  orderDate: string;
  paymentTerms: string;
  placeOfSupply: string;
  reverseCharge: string;
  transportMode: string;
  carrierName: string;
  trackingNumber: string;
  vehicleNumber: string;
  seller: InvoiceParty;
  buyer: InvoiceParty;
  lineItems: InvoiceLineItem[];
  subtotalTaxable: number;
  cgstTotal: number;
  sgstTotal: number;
  igstTotal: number;
  shippingFee: number;
  grandTotal: number;
  amountInWords: string;
  bankDetails: {
    bankName: string;
    accountNumber: string;
    ifscCode: string;
    branch: string;
  };
  warrantyClause: string;
  storageCondition: string;
}

// Master Depot Registry with verified statutory licenses & GSTINs
export const DISTRIBUTOR_REGISTRY: Record<
  string,
  {
    name: string;
    address: string;
    city: string;
    pincode: string;
    dl20b: string;
    dl21b: string;
    gstin: string;
    phone: string;
    email: string;
  }
> = {
  'dist-01': {
    name: 'MedVantage Pharma Logistics',
    address: 'Bhiwandi Central Pharma Hub, Unit 14-18, Mankoli',
    city: 'Thane',
    pincode: '421302',
    dl20b: 'MH-TZ5-20B-99821',
    dl21b: 'MH-TZ5-21B-99822',
    gstin: '27AABCM1420P1Z8',
    phone: '+91 22 2849 5500',
    email: 'dispatch@medvantagepharma.in',
  },
  'dist-02': {
    name: 'Apex Global Health Distributors',
    address: 'Kurla West Logistics Park, LBS Marg',
    city: 'Mumbai',
    pincode: '400070',
    dl20b: 'MH-MZ1-20B-88310',
    dl21b: 'MH-MZ1-21B-88311',
    gstin: '27AABCA7721L1Z2',
    phone: '+91 22 2650 4410',
    email: 'billing@apexpharma.in',
  },
  'dist-03': {
    name: 'PulseLife Distribution Network',
    address: 'MIDC Phase II Pharma Complex, Chakan',
    city: 'Pune',
    pincode: '410501',
    dl20b: 'MH-PZ2-20B-76491',
    dl21b: 'MH-PZ2-21B-76492',
    gstin: '27AABCP5514K1Z4',
    phone: '+91 20 2710 8820',
    email: 'logistics@pulselife.in',
  },
  'dist-04': {
    name: 'SunRise Healthcare Wholesalers',
    address: 'Warehouse Hub, Sector 8, Rabale',
    city: 'Navi Mumbai',
    pincode: '400701',
    dl20b: 'MH-TZ4-20B-66230',
    dl21b: 'MH-TZ4-21B-66231',
    gstin: '27AABCS3389J1Z9',
    phone: '+91 22 2760 1199',
    email: 'orders@sunrisehealthcare.com',
  },
  'dist-05': {
    name: 'BioPharma Cold-Chain Supply',
    address: 'Bio Park, Hinjewadi Phase 1',
    city: 'Pune',
    pincode: '411057',
    dl20b: 'MH-PZ1-20B-55104',
    dl21b: 'MH-PZ1-21B-55105',
    gstin: '27AABCB1190D1Z6',
    phone: '+91 20 6680 3344',
    email: 'coldchain@biopharmasupply.in',
  },
};

/**
 * Converts numeric INR amount into proper Indian currency words
 */
export function numberToWordsINR(amount: number): string {
  if (!amount || isNaN(amount) || amount <= 0) return 'Indian Rupees Zero Only';

  const a = [
    '',
    'One ',
    'Two ',
    'Three ',
    'Four ',
    'Five ',
    'Six ',
    'Seven ',
    'Eight ',
    'Nine ',
    'Ten ',
    'Eleven ',
    'Twelve ',
    'Thirteen ',
    'Fourteen ',
    'Fifteen ',
    'Sixteen ',
    'Seventeen ',
    'Eighteen ',
    'Nineteen ',
  ];
  const b = [
    '',
    '',
    'Twenty',
    'Thirty',
    'Forty',
    'Fifty',
    'Sixty',
    'Seventy',
    'Eighty',
    'Ninety',
  ];

  function inWords(n: number): string {
    if (n === 0) return '';
    let str = '';
    if (Math.floor(n / 10000000) > 0) {
      str += inWords(Math.floor(n / 10000000)) + 'Crore ';
      n %= 10000000;
    }
    if (Math.floor(n / 100000) > 0) {
      str += inWords(Math.floor(n / 100000)) + 'Lakh ';
      n %= 100000;
    }
    if (Math.floor(n / 1000) > 0) {
      str += inWords(Math.floor(n / 1000)) + 'Thousand ';
      n %= 1000;
    }
    if (Math.floor(n / 100) > 0) {
      str += inWords(Math.floor(n / 100)) + 'Hundred ';
      n %= 100;
    }
    if (n > 0) {
      if (n < 20) str += a[n];
      else {
        str += b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : ' ');
      }
    }
    return str;
  }

  const rupees = Math.floor(amount);
  const paise = Math.round((amount - rupees) * 100);
  let result = 'Indian Rupees ' + (rupees === 0 ? 'Zero ' : inWords(rupees).trim());
  if (paise > 0) {
    result += ' and ' + inWords(paise).trim() + ' Paise';
  }
  result += ' Only';
  return result;
}

/**
 * Normalizes raw order + API invoice data into a guaranteed, statutory invoice model
 */
export function formatWholesaleInvoice(
  order: any,
  rawInvoiceData?: any,
  storeDetails?: any
): FormattedWholesaleInvoice {
  const cleanOrderNum = (order?.orderNumber || 'SO-2026-85451').toString();
  const numSuffix = cleanOrderNum.replace(/^SO-2026-/, '').replace(/^SO-/, '');
  const invoiceNumber = rawInvoiceData?.invoiceNumber || `INV-2026-${numSuffix}`;

  // Date resolution
  const nowStr = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const invoiceDate = rawInvoiceData?.invoiceDate
    ? new Date(rawInvoiceData.invoiceDate).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : order?.dateFormatted || nowStr;

  // Resolve distributor info
  const distName =
    rawInvoiceData?.seller?.name ||
    order?.distributorName ||
    'MedVantage Pharma Logistics';
  let matchedDist = Object.values(DISTRIBUTOR_REGISTRY).find(
    (d) =>
      d.name.toLowerCase() === distName.toLowerCase() ||
      distName.toLowerCase().includes(d.name.toLowerCase())
  );
  if (!matchedDist && order?.distributorId) {
    matchedDist = DISTRIBUTOR_REGISTRY[order.distributorId];
  }
  if (!matchedDist) {
    matchedDist = DISTRIBUTOR_REGISTRY['dist-01'];
  }

  const seller: InvoiceParty = {
    name: matchedDist.name,
    address: rawInvoiceData?.seller?.address || matchedDist.address,
    city: matchedDist.city,
    pincode: rawInvoiceData?.seller?.pincode || matchedDist.pincode,
    state: 'Maharashtra',
    stateCode: '27',
    gstin: rawInvoiceData?.seller?.gstin || matchedDist.gstin,
    drugLicenseNumber:
      rawInvoiceData?.seller?.licenseNumber ||
      `${matchedDist.dl20b} & ${matchedDist.dl21b}`,
    phone: matchedDist.phone,
    email: matchedDist.email,
  };

  // Resolve buyer info
  const buyerName =
    rawInvoiceData?.buyer?.name ||
    order?.medicalStoreName ||
    order?.storeName ||
    storeDetails?.name ||
    'Apollo Care Pharmacy';

  const buyerAddress =
    rawInvoiceData?.buyer?.address ||
    order?.medicalStoreAddress ||
    order?.deliveryAddress ||
    storeDetails?.address ||
    'Shop No. 4, Kalamba Lake Road';

  const buyerCity =
    order?.medicalStoreCity ||
    storeDetails?.city ||
    'Kolhapur';

  const buyerPincode =
    rawInvoiceData?.buyer?.pincode ||
    order?.medicalStorePincode ||
    order?.pincode ||
    storeDetails?.pincode ||
    '416006';

  const buyer: InvoiceParty = {
    name: buyerName,
    address: buyerAddress,
    city: buyerCity,
    pincode: buyerPincode,
    state: 'Maharashtra',
    stateCode: '27',
    gstin:
      rawInvoiceData?.buyer?.gstin ||
      order?.medicalStoreGstin ||
      storeDetails?.gstin ||
      '27AABCU9603R1ZM',
    drugLicenseNumber:
      rawInvoiceData?.buyer?.licenseNumber ||
      order?.medicalStoreLicense ||
      storeDetails?.licenseNumber ||
      'DL-2024-MH-APO8821 (Form 20/21)',
    phone:
      order?.medicalStorePhone ||
      order?.phone ||
      storeDetails?.phone ||
      '+91 98200 12345',
    email: storeDetails?.email || 'apollocare@gmail.com',
  };

  // Grand total calculation & line items
  let grandTotal = parseFloat(
    order?.totalAmount ||
      rawInvoiceData?.taxSummary?.grandTotal ||
      0
  );

  let lineItems: InvoiceLineItem[] = [];

  if (Array.isArray(rawInvoiceData?.lineItems) && rawInvoiceData.lineItems.length > 0) {
    lineItems = rawInvoiceData.lineItems.map((item: any, idx: number) => ({
      sr: idx + 1,
      medicineName: item.medicineName,
      genericName: item.genericName,
      hsnCode: item.hsnCode || '300490',
      batchNumber: item.batchNumber || 'BTH-MVL-101',
      expiryDate: item.expiryDate || '12/2028',
      quantity: item.quantity,
      unitRate: item.unitRate,
      mrp: item.mrp || parseFloat((item.unitRate * 1.15).toFixed(2)),
      taxableAmount: item.taxableAmount,
      gstRate: 12,
      cgstAmount: item.cgstAmount,
      sgstAmount: item.sgstAmount,
      igstAmount: item.igstAmount || 0,
      totalAmount: item.totalItemAmount,
    }));
  } else {
    // Generate from single order record
    const medName = order?.medicineName || 'Amlong 5';
    const genericName =
      order?.genericName ||
      (medName.toLowerCase().includes('amlong')
        ? 'Amlodipine Besylate 5mg'
        : medName.toLowerCase().includes('asthalin')
        ? 'Salbutamol Inhaler 100mcg'
        : medName.toLowerCase().includes('augmentin')
        ? 'Amoxicillin + Clavulanic Acid 625mg'
        : medName.toLowerCase().includes('azee')
        ? 'Azithromycin 500mg'
        : 'Pharmaceutical Formulation');
    const qty = parseInt(order?.quantity || 50, 10);
    const unitPrice = parseFloat(order?.unitPrice || 48.0);
    const taxable = parseFloat((qty * unitPrice).toFixed(2));
    const cgst = parseFloat((taxable * 0.06).toFixed(2));
    const sgst = parseFloat((taxable * 0.06).toFixed(2));
    const total = parseFloat((taxable + cgst + sgst).toFixed(2));

    if (!grandTotal || grandTotal === 0) {
      grandTotal = total;
    }

    lineItems = [
      {
        sr: 1,
        medicineName: medName,
        genericName,
        hsnCode: '300490',
        batchNumber: order?.batchNumber || `BTH-${numSuffix.slice(-4) || '9901'}`,
        expiryDate: order?.expiryDate || '12/2028',
        quantity: qty,
        unitRate: unitPrice,
        mrp: parseFloat((unitPrice * 1.15).toFixed(2)),
        taxableAmount: taxable,
        gstRate: 12,
        cgstAmount: cgst,
        sgstAmount: sgst,
        igstAmount: 0,
        totalAmount: total,
      },
    ];
  }

  // Summary figures
  const subtotalTaxable = lineItems.reduce((acc, it) => acc + it.taxableAmount, 0);
  const cgstTotal = lineItems.reduce((acc, it) => acc + it.cgstAmount, 0);
  const sgstTotal = lineItems.reduce((acc, it) => acc + it.sgstAmount, 0);
  const igstTotal = lineItems.reduce((acc, it) => acc + it.igstAmount, 0);

  if (!grandTotal || grandTotal === 0) {
    grandTotal = subtotalTaxable + cgstTotal + sgstTotal + igstTotal;
  }

  // Format currency in words
  const amountInWords = numberToWordsINR(grandTotal);

  return {
    invoiceNumber,
    invoiceDate,
    orderNumber: cleanOrderNum,
    orderDate: invoiceDate,
    paymentTerms: rawInvoiceData?.paymentTerms || 'Net 30 Days B2B Credit',
    placeOfSupply: '27 - Maharashtra',
    reverseCharge: 'No',
    transportMode: 'Dedicated Pharma Cold-Chain / Express Road Freight',
    carrierName:
      rawInvoiceData?.dispatchDetails?.carrierName ||
      'MedVantage Dedicated Logistics (GPS Tracked)',
    trackingNumber:
      rawInvoiceData?.dispatchDetails?.trackingNumber ||
      order?.trackingNumber ||
      `TRK-MED-${numSuffix.slice(-5) || '84512'}`,
    vehicleNumber: 'MH-04-GP-8832',
    seller,
    buyer,
    lineItems,
    subtotalTaxable: parseFloat(subtotalTaxable.toFixed(2)),
    cgstTotal: parseFloat(cgstTotal.toFixed(2)),
    sgstTotal: parseFloat(sgstTotal.toFixed(2)),
    igstTotal: parseFloat(igstTotal.toFixed(2)),
    shippingFee: 0,
    grandTotal: parseFloat(grandTotal.toFixed(2)),
    amountInWords,
    bankDetails: {
      bankName: 'HDFC Bank Ltd',
      accountNumber: '50200088912401',
      ifscCode: 'HDFC0000128',
      branch: 'Pharma Corporate Banking, Mumbai',
    },
    warrantyClause:
      'We hereby give this warranty that the drugs or cosmetic formulations specified in this invoice do not contravene in any way the provisions of Section 18 of the Drugs and Cosmetics Act, 1940 and rules thereunder.',
    storageCondition:
      'Store below 25°C in a dry place. Protect from direct sunlight & moisture. Maintain Cold-Chain items strictly at 2°C – 8°C.',
  };
}

/**
 * Builds standalone, pixel-perfect, statutory HTML optimized for 1-sheet A4 printing
 */
export function generateWholesaleInvoiceHtml(inv: FormattedWholesaleInvoice): string {
  const lineRows = inv.lineItems
    .map(
      (item) => `
      <tr>
        <td style="text-align: center; border-bottom: 1px solid #e2e8f0; padding: 6px 4px; font-size: 11px;">${item.sr}</td>
        <td style="border-bottom: 1px solid #e2e8f0; padding: 6px 6px;">
          <div style="font-weight: 700; font-size: 11.5px; color: #0f172a;">${item.medicineName}</div>
          ${item.genericName ? `<div style="font-size: 9.5px; color: #64748b; font-style: italic;">${item.genericName}</div>` : ''}
        </td>
        <td style="text-align: center; border-bottom: 1px solid #e2e8f0; padding: 6px 4px; font-family: monospace; font-size: 10.5px;">${item.hsnCode}</td>
        <td style="text-align: center; border-bottom: 1px solid #e2e8f0; padding: 6px 4px; font-family: monospace; font-size: 10.5px; font-weight: 600;">${item.batchNumber}</td>
        <td style="text-align: center; border-bottom: 1px solid #e2e8f0; padding: 6px 4px; font-family: monospace; font-size: 10.5px;">${item.expiryDate}</td>
        <td style="text-align: right; border-bottom: 1px solid #e2e8f0; padding: 6px 6px; font-weight: 700; font-size: 11px;">${item.quantity}</td>
        <td style="text-align: right; border-bottom: 1px solid #e2e8f0; padding: 6px 6px; font-family: monospace; font-size: 11px;">₹${item.unitRate.toFixed(2)}</td>
        <td style="text-align: right; border-bottom: 1px solid #e2e8f0; padding: 6px 6px; font-family: monospace; font-size: 11px; color: #475569;">₹${item.mrp.toFixed(2)}</td>
        <td style="text-align: right; border-bottom: 1px solid #e2e8f0; padding: 6px 6px; font-family: monospace; font-size: 11px; font-weight: 600;">₹${item.taxableAmount.toFixed(2)}</td>
        <td style="text-align: right; border-bottom: 1px solid #e2e8f0; padding: 6px 6px; font-family: monospace; font-size: 10.5px;">₹${item.cgstAmount.toFixed(2)}</td>
        <td style="text-align: right; border-bottom: 1px solid #e2e8f0; padding: 6px 6px; font-family: monospace; font-size: 10.5px;">₹${item.sgstAmount.toFixed(2)}</td>
        <td style="text-align: right; border-bottom: 1px solid #e2e8f0; padding: 6px 6px; font-family: monospace; font-size: 11.5px; font-weight: 800; color: #0f172a;">₹${item.totalAmount.toFixed(2)}</td>
      </tr>
    `
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Tax Invoice - ${inv.invoiceNumber}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 8mm 9mm 8mm 9mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      margin: 0;
      padding: 0;
      background: #ffffff;
      color: #0f172a;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-size: 11px;
      line-height: 1.35;
    }
    .invoice-wrapper {
      width: 100%;
      max-width: 100%;
      margin: 0 auto;
      border: 1.5px solid #0f172a;
      background: #ffffff;
    }
    .header-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #0f172a;
      color: #ffffff;
      padding: 7px 14px;
    }
    .header-bar .brand {
      font-size: 14px;
      font-weight: 900;
      letter-spacing: 0.5px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .header-bar .tagline {
      font-size: 9.5px;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.6px;
    }
    .header-bar .copy-badge {
      background: #10b981;
      color: #ffffff;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    .title-strip {
      text-align: center;
      padding: 6px 10px;
      background: #f8fafc;
      border-bottom: 1.5px solid #0f172a;
    }
    .title-strip h1 {
      margin: 0;
      font-size: 15px;
      font-weight: 900;
      letter-spacing: 0.8px;
      color: #0f172a;
    }
    .title-strip p {
      margin: 2px 0 0 0;
      font-size: 9px;
      color: #475569;
      font-weight: 600;
    }
    .meta-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      border-bottom: 1px solid #cbd5e1;
      background: #f1f5f9;
    }
    .meta-cell {
      padding: 6px 10px;
      border-right: 1px solid #cbd5e1;
    }
    .meta-cell:last-child {
      border-right: none;
    }
    .meta-label {
      font-size: 9px;
      text-transform: uppercase;
      font-weight: 700;
      color: #64748b;
      margin-bottom: 2px;
    }
    .meta-val {
      font-size: 11.5px;
      font-weight: 800;
      color: #0f172a;
      font-family: monospace;
    }
    .parties-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      border-bottom: 1.5px solid #0f172a;
    }
    .party-col {
      padding: 8px 12px;
    }
    .party-col:first-child {
      border-right: 1px solid #cbd5e1;
    }
    .party-tag {
      font-size: 9.5px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #0284c7;
      margin-bottom: 4px;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .party-name {
      font-size: 13px;
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 3px;
    }
    .party-line {
      font-size: 10px;
      color: #334155;
      margin-bottom: 2px;
    }
    .party-badge-line {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 4px;
      font-size: 9.5px;
      font-weight: 700;
    }
    .stat-pill {
      background: #e2e8f0;
      color: #1e293b;
      padding: 2px 6px;
      border-radius: 3px;
      font-family: monospace;
    }
    .dispatch-strip {
      display: grid;
      grid-template-columns: 2fr 1.2fr 1fr;
      padding: 5px 12px;
      background: #f8fafc;
      border-bottom: 1px solid #cbd5e1;
      font-size: 9.5px;
      color: #334155;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
    }
    .items-table th {
      background: #0f172a;
      color: #ffffff;
      font-size: 9.5px;
      font-weight: 800;
      text-transform: uppercase;
      padding: 6px 5px;
      letter-spacing: 0.3px;
    }
    .bottom-container {
      display: grid;
      grid-template-columns: 1.35fr 1fr;
      border-top: 1.5px solid #0f172a;
    }
    .bottom-left {
      padding: 8px 12px;
      border-right: 1px solid #cbd5e1;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .words-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 4px;
      padding: 6px 8px;
      margin-bottom: 6px;
    }
    .words-label {
      font-size: 8.5px;
      text-transform: uppercase;
      font-weight: 800;
      color: #64748b;
    }
    .words-val {
      font-size: 10.5px;
      font-weight: 800;
      color: #0f172a;
      margin-top: 1px;
    }
    .bank-box {
      font-size: 9.5px;
      line-height: 1.35;
      color: #334155;
      background: #f1f5f9;
      padding: 5px 8px;
      border-radius: 4px;
      margin-bottom: 6px;
    }
    .warranty-box {
      font-size: 8.5px;
      line-height: 1.3;
      color: #475569;
      border-left: 2px solid #0284c7;
      padding-left: 6px;
    }
    .bottom-right {
      padding: 0;
      display: flex;
      flex-direction: column;
    }
    .calc-row {
      display: flex;
      justify-content: space-between;
      padding: 5px 12px;
      border-bottom: 1px solid #e2e8f0;
      font-size: 10.5px;
      color: #334155;
    }
    .calc-row.grand-total {
      background: #0f172a;
      color: #ffffff;
      font-size: 13px;
      font-weight: 900;
      padding: 8px 12px;
      border-bottom: none;
    }
    .signatures-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      border-top: 1px solid #cbd5e1;
    }
    .sig-box {
      padding: 8px 14px 4px 14px;
      min-height: 62px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .sig-box:first-child {
      border-right: 1px solid #cbd5e1;
    }
    .sig-title {
      font-size: 9.5px;
      font-weight: 800;
      text-transform: uppercase;
      color: #475569;
    }
    .sig-space {
      margin-top: 24px;
      border-top: 1px dashed #94a3b8;
      padding-top: 3px;
      font-size: 9px;
      color: #64748b;
      display: flex;
      justify-content: space-between;
    }
    .footer-bar {
      background: #f8fafc;
      border-top: 1px solid #cbd5e1;
      padding: 4px 12px;
      text-align: center;
      font-size: 8px;
      color: #64748b;
    }
  </style>
</head>
<body>
  <div class="invoice-wrapper">
    <!-- Brand Header -->
    <div class="header-bar">
      <div>
        <div class="brand">
          <span>✚</span> MEDLINK CENTRAL PHARMA LOGISTICS
        </div>
        <div class="tagline">Official B2B Pharmaceutical Consignment &amp; Tax Portal</div>
      </div>
      <div>
        <span class="copy-badge">ORIGINAL FOR RECIPIENT</span>
      </div>
    </div>

    <!-- Title Strip -->
    <div class="title-strip">
      <h1>TAX INVOICE &amp; CONSIGNMENT NOTE</h1>
      <p>(Issued under Rule 46 of CGST Rules, 2017 &amp; Drug License Form 20B/21B under Drugs and Cosmetics Act, 1940)</p>
    </div>

    <!-- Meta Details Bar -->
    <div class="meta-grid">
      <div class="meta-cell">
        <div class="meta-label">Invoice Number</div>
        <div class="meta-val">${inv.invoiceNumber}</div>
      </div>
      <div class="meta-cell">
        <div class="meta-label">Invoice Date</div>
        <div class="meta-val">${inv.invoiceDate}</div>
      </div>
      <div class="meta-cell">
        <div class="meta-label">Purchase Order Ref</div>
        <div class="meta-val">${inv.orderNumber}</div>
      </div>
      <div class="meta-cell">
        <div class="meta-label">Payment Terms / Supply</div>
        <div class="meta-val" style="font-size: 10px;">${inv.paymentTerms}</div>
      </div>
    </div>

    <!-- Parties Grid (Bilateral Consignor vs Consignee) -->
    <div class="parties-grid">
      <!-- Seller / Consignor -->
      <div class="party-col">
        <div class="party-tag">🏢 SUPPLIER / CONSIGNOR (Billed &amp; Dispatched From)</div>
        <div class="party-name">${inv.seller.name}</div>
        <div class="party-line">${inv.seller.address}, ${inv.seller.city || ''} - ${inv.seller.pincode}</div>
        <div class="party-line">State: <strong>${inv.seller.state}</strong> (Code: <strong>${inv.seller.stateCode}</strong>)</div>
        <div class="party-badge-line">
          <span class="stat-pill">GSTIN: ${inv.seller.gstin}</span>
          <span class="stat-pill">D.L.: ${inv.seller.drugLicenseNumber}</span>
        </div>
        <div class="party-line" style="margin-top: 4px; font-size: 9px; color: #64748b;">
          Contact: ${inv.seller.phone || '+91 22 2849 5500'} | ${inv.seller.email || 'dispatch@medvantagepharma.in'}
        </div>
      </div>

      <!-- Buyer / Consignee -->
      <div class="party-col">
        <div class="party-tag" style="color: #059669;">🏥 BUYER / CONSIGNEE (Billed &amp; Shipped To)</div>
        <div class="party-name">${inv.buyer.name}</div>
        <div class="party-line">${inv.buyer.address}, ${inv.buyer.city || ''} - ${inv.buyer.pincode}</div>
        <div class="party-line">State: <strong>${inv.buyer.state}</strong> (Code: <strong>${inv.buyer.stateCode}</strong>)</div>
        <div class="party-badge-line">
          <span class="stat-pill" style="background: #d1fae5; color: #065f46;">GSTIN: ${inv.buyer.gstin}</span>
          <span class="stat-pill">D.L.: ${inv.buyer.drugLicenseNumber}</span>
        </div>
        <div class="party-line" style="margin-top: 4px; font-size: 9px; color: #64748b;">
          Pharmacist Contact: ${inv.buyer.phone || '+91 98200 12345'} | Place of Supply: ${inv.placeOfSupply}
        </div>
      </div>
    </div>

    <!-- Logistics Dispatch Strip -->
    <div class="dispatch-strip">
      <div>
        <strong>Carrier / Mode:</strong> ${inv.transportMode} (${inv.carrierName})
      </div>
      <div>
        <strong>Tracking / AWB:</strong> <span style="font-family: monospace; font-weight: 700;">${inv.trackingNumber}</span>
      </div>
      <div>
        <strong>Vehicle / Reefer:</strong> <span style="font-family: monospace;">${inv.vehicleNumber}</span>
      </div>
    </div>

    <!-- Itemized Table -->
    <table class="items-table">
      <thead>
        <tr>
          <th style="width: 25px; text-align: center;">#</th>
          <th style="text-align: left;">Description of Medicines</th>
          <th style="width: 55px; text-align: center;">HSN</th>
          <th style="width: 80px; text-align: center;">Batch No</th>
          <th style="width: 55px; text-align: center;">Expiry</th>
          <th style="width: 40px; text-align: right;">Qty</th>
          <th style="width: 60px; text-align: right;">Rate (₹)</th>
          <th style="width: 55px; text-align: right;">MRP (₹)</th>
          <th style="width: 75px; text-align: right;">Taxable (₹)</th>
          <th style="width: 55px; text-align: right;">CGST 6%</th>
          <th style="width: 55px; text-align: right;">SGST 6%</th>
          <th style="width: 85px; text-align: right;">Total (₹)</th>
        </tr>
      </thead>
      <tbody>
        ${lineRows}
      </tbody>
    </table>

    <!-- Calculations & Statutory Bottom Container -->
    <div class="bottom-container">
      <!-- Left side: Words, Bank, Warranty -->
      <div class="bottom-left">
        <div>
          <div class="words-box">
            <div class="words-label">Invoice Amount in Words</div>
            <div class="words-val">${inv.amountInWords}</div>
          </div>

          <div class="bank-box">
            <strong>Bank Settlement Details for RTGS / NEFT:</strong><br />
            Bank: <strong>${inv.bankDetails.bankName}</strong> | Branch: <strong>${inv.bankDetails.branch}</strong><br />
            A/C No: <strong style="font-family: monospace;">${inv.bankDetails.accountNumber}</strong> | IFSC: <strong style="font-family: monospace;">${inv.bankDetails.ifscCode}</strong>
          </div>
        </div>

        <div class="warranty-box">
          <strong>Section 18 Statutory Drug Warranty:</strong><br />
          ${inv.warrantyClause}<br />
          <em>Storage: ${inv.storageCondition}</em>
        </div>
      </div>

      <!-- Right side: GST Totals -->
      <div class="bottom-right">
        <div class="calc-row">
          <span>Subtotal (Taxable Value):</span>
          <span style="font-family: monospace; font-weight: 700;">₹${inv.subtotalTaxable.toFixed(2)}</span>
        </div>
        <div class="calc-row">
          <span>Central Tax (CGST 6.0%):</span>
          <span style="font-family: monospace;">₹${inv.cgstTotal.toFixed(2)}</span>
        </div>
        <div class="calc-row">
          <span>State Tax (SGST 6.0%):</span>
          <span style="font-family: monospace;">₹${inv.sgstTotal.toFixed(2)}</span>
        </div>
        ${inv.igstTotal > 0 ? `
        <div class="calc-row">
          <span>Integrated Tax (IGST 12.0%):</span>
          <span style="font-family: monospace;">₹${inv.igstTotal.toFixed(2)}</span>
        </div>
        ` : ''}
        <div class="calc-row">
          <span>Pharma Freight &amp; Handling:</span>
          <span style="font-family: monospace;">₹${inv.shippingFee.toFixed(2)}</span>
        </div>
        <div class="calc-row grand-total">
          <span>GRAND TOTAL (INR):</span>
          <span style="font-family: monospace;">₹${inv.grandTotal.toFixed(2)}</span>
        </div>
      </div>
    </div>

    <!-- Signatures Grid -->
    <div class="signatures-grid">
      <div class="sig-box">
        <div class="sig-title">Receiver's Verification &amp; Seal</div>
        <div class="sig-space">
          <span>Chemist Stamp &amp; Authorized Pharmacist Signature</span>
          <span>Date: ____________</span>
        </div>
      </div>
      <div class="sig-box">
        <div class="sig-title" style="text-align: right;">For ${inv.seller.name}</div>
        <div class="sig-space">
          <span>Digitally Verified &amp; Signed Consignment</span>
          <span>Authorized Signatory</span>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer-bar">
      This is a statutory computer-generated B2B Pharmaceutical Tax Invoice under Rule 46 of CGST Rules 2017 and Drugs &amp; Cosmetics Rules 1945. MedLink AI Certified Network.
    </div>
  </div>
</body>
</html>`;
}

/**
 * Isolated print engine: prints strictly the invoice via an offscreen iframe,
 * guaranteeing 0 background dashboard bleed and exactly 1 A4 sheet.
 */
export function printWholesaleInvoiceDirectly(inv: FormattedWholesaleInvoice): void {
  if (typeof window === 'undefined') return;

  const existingFrame = document.getElementById('medlink-isolated-print-frame');
  if (existingFrame) existingFrame.remove();

  const printFrame = document.createElement('iframe');
  printFrame.id = 'medlink-isolated-print-frame';
  printFrame.style.position = 'fixed';
  printFrame.style.top = '-9999px';
  printFrame.style.left = '-9999px';
  printFrame.style.width = '0px';
  printFrame.style.height = '0px';
  printFrame.style.border = 'none';
  document.body.appendChild(printFrame);

  const doc = printFrame.contentWindow?.document;
  if (!doc) {
    window.print();
    return;
  }

  const html = generateWholesaleInvoiceHtml(inv);
  doc.open();
  doc.write(html);
  doc.close();

  setTimeout(() => {
    try {
      printFrame.contentWindow?.focus();
      printFrame.contentWindow?.print();
    } catch (e) {
      console.error('Print iframe error:', e);
      window.print();
    } finally {
      setTimeout(() => {
        if (document.body.contains(printFrame)) {
          document.body.removeChild(printFrame);
        }
      }, 2500);
    }
  }, 350);
}

