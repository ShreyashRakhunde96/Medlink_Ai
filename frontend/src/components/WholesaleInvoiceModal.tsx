'use client';

import React, { useMemo } from 'react';
import {
  X,
  Printer,
  FileCheck2,
  Building2,
  Store,
  Truck,
  ShieldCheck,
  CreditCard,
} from 'lucide-react';
import {
  formatWholesaleInvoice,
  printWholesaleInvoiceDirectly,
  FormattedWholesaleInvoice,
} from '@/lib/wholesaleInvoice';

interface WholesaleInvoiceModalProps {
  order: any | null;
  invoiceData?: any | null;
  storeDetails?: any | null;
  onClose: () => void;
}

export const WholesaleInvoiceModal: React.FC<WholesaleInvoiceModalProps> = ({
  order,
  invoiceData,
  storeDetails,
  onClose,
}) => {
  const invoice: FormattedWholesaleInvoice | null = useMemo(() => {
    if (!order) return null;
    return formatWholesaleInvoice(order, invoiceData, storeDetails);
  }, [order, invoiceData, storeDetails]);

  if (!order || !invoice) return null;

  const handlePrint = () => {
    printWholesaleInvoiceDirectly(invoice);
  };

  return (
    <div
      className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white border border-slate-300 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top App Modal Header Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-900 text-white border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <FileCheck2 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
                  Official B2B Tax Invoice
                </span>
                <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-300 font-mono">
                  {invoice.invoiceNumber}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Rule 46 CGST Rules · Drugs &amp; Cosmetics Act Form 20B/21B Consignment Note
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Print 1-Page A4 Invoice (Isolated Print Engine)"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print A4 Invoice</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Document Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100 flex justify-center">
          {/* A4 Styled Sheet */}
          <div
            id="printable-invoice-portal"
            className="printable-container bg-white border border-slate-300 shadow-md rounded-lg max-w-3xl w-full p-6 text-slate-900 text-xs"
          >
            {/* Header / Brand Strip */}
            <div className="flex items-center justify-between pb-3 border-b-2 border-slate-900 mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-black text-base shadow-xs">
                  ✚
                </div>
                <div>
                  <h2 className="text-sm font-black tracking-wide text-slate-900 leading-tight">
                    MEDLINK CENTRAL PHARMA LOGISTICS
                  </h2>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                    Authorized B2B Pharmaceutical Consignment &amp; Tax Settlement
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="inline-block px-2.5 py-1 rounded bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase tracking-wide">
                  Original for Recipient
                </span>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">Chemist / Store Copy</p>
              </div>
            </div>

            {/* Document Title Strip */}
            <div className="text-center py-2 bg-slate-50 rounded-lg border border-slate-200 mb-3">
              <h1 className="text-sm font-black text-slate-900 uppercase tracking-widest">
                Tax Invoice &amp; Consignment Note
              </h1>
              <p className="text-[10px] text-slate-500 font-medium">
                (Issued under Rule 46 of CGST Rules, 2017 &amp; Drug License Form 20B/21B under Drugs and Cosmetics Act, 1940)
              </p>
            </div>

            {/* Reference Meta Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200 mb-4">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Invoice No:</span>
                <span className="font-mono font-extrabold text-slate-900 text-xs">{invoice.invoiceNumber}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Invoice Date:</span>
                <span className="font-mono font-bold text-slate-900 text-xs">{invoice.invoiceDate}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">PO Number:</span>
                <span className="font-mono font-bold text-slate-900 text-xs">{invoice.orderNumber}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Payment Terms:</span>
                <span className="font-bold text-slate-800 text-xs">{invoice.paymentTerms}</span>
              </div>
            </div>

            {/* Parties Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              {/* Supplier */}
              <div className="p-3.5 bg-white border border-slate-200 rounded-xl">
                <div className="flex items-center gap-1.5 text-blue-600 font-bold text-[11px] uppercase tracking-wider mb-2">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Supplier / Consignor (Dispatched From)</span>
                </div>
                <h3 className="font-extrabold text-slate-900 text-xs mb-1">{invoice.seller.name}</h3>
                <p className="text-slate-600 text-[11px] leading-relaxed mb-2">
                  {invoice.seller.address}, {invoice.seller.city} - {invoice.seller.pincode}
                  <br />
                  State: <strong>{invoice.seller.state}</strong> (Code: <strong>{invoice.seller.stateCode}</strong>)
                </p>
                <div className="space-y-1 font-mono text-[10.5px]">
                  <div className="flex justify-between bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                    <span className="text-slate-500 font-sans font-medium">GSTIN:</span>
                    <span className="font-bold text-slate-900">{invoice.seller.gstin}</span>
                  </div>
                  <div className="flex justify-between bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                    <span className="text-slate-500 font-sans font-medium">Drug Lic:</span>
                    <span className="font-bold text-slate-900 text-[10px]">{invoice.seller.drugLicenseNumber}</span>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 mt-2">
                  Helpline: {invoice.seller.phone} · {invoice.seller.email}
                </p>
              </div>

              {/* Buyer */}
              <div className="p-3.5 bg-white border border-slate-200 rounded-xl">
                <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-[11px] uppercase tracking-wider mb-2">
                  <Store className="w-3.5 h-3.5" />
                  <span>Buyer / Consignee (Billed &amp; Shipped To)</span>
                </div>
                <h3 className="font-extrabold text-slate-900 text-xs mb-1">{invoice.buyer.name}</h3>
                <p className="text-slate-600 text-[11px] leading-relaxed mb-2">
                  {invoice.buyer.address}, {invoice.buyer.city} - {invoice.buyer.pincode}
                  <br />
                  State: <strong>{invoice.buyer.state}</strong> (Code: <strong>{invoice.buyer.stateCode}</strong>)
                </p>
                <div className="space-y-1 font-mono text-[10.5px]">
                  <div className="flex justify-between bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                    <span className="text-slate-500 font-sans font-medium">GSTIN:</span>
                    <span className="font-bold text-slate-900">{invoice.buyer.gstin}</span>
                  </div>
                  <div className="flex justify-between bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                    <span className="text-slate-500 font-sans font-medium">Drug Lic:</span>
                    <span className="font-bold text-slate-900 text-[10px]">{invoice.buyer.drugLicenseNumber}</span>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 mt-2">
                  Chemist Desk: {invoice.buyer.phone} · Place of Supply: {invoice.placeOfSupply}
                </p>
              </div>
            </div>

            {/* Logistics Dispatch Strip */}
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex flex-wrap items-center justify-between gap-2 mb-4 text-[11px]">
              <div className="flex items-center gap-1.5 text-slate-700">
                <Truck className="w-3.5 h-3.5 text-slate-500" />
                <span><strong>Carrier:</strong> {invoice.carrierName}</span>
              </div>
              <div className="text-slate-700">
                <span><strong>AWB / Tracking:</strong> <span className="font-mono font-bold">{invoice.trackingNumber}</span></span>
              </div>
              <div className="text-slate-700">
                <span><strong>Fleet / Reefer:</strong> <span className="font-mono">{invoice.vehicleNumber}</span></span>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-lg mb-4">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white text-[10px] uppercase tracking-wider">
                    <th className="py-2 px-2 text-center w-8">#</th>
                    <th className="py-2 px-2.5">Medicine Description</th>
                    <th className="py-2 px-2 text-center">HSN</th>
                    <th className="py-2 px-2 text-center">Batch</th>
                    <th className="py-2 px-2 text-center">Exp</th>
                    <th className="py-2 px-2 text-right">Qty</th>
                    <th className="py-2 px-2 text-right">Rate</th>
                    <th className="py-2 px-2 text-right">Taxable</th>
                    <th className="py-2 px-2 text-right">CGST</th>
                    <th className="py-2 px-2 text-right">SGST</th>
                    <th className="py-2 px-2.5 text-right">Total (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-[11px]">
                  {invoice.lineItems.map((item) => (
                    <tr key={item.sr} className="hover:bg-slate-50/80">
                      <td className="py-2.5 px-2 text-center text-slate-500">{item.sr}</td>
                      <td className="py-2.5 px-2.5">
                        <div className="font-bold text-slate-900">{item.medicineName}</div>
                        {item.genericName && (
                          <div className="text-[10px] text-slate-500 italic">{item.genericName}</div>
                        )}
                      </td>
                      <td className="py-2.5 px-2 text-center font-mono text-[10px] text-slate-600">
                        {item.hsnCode}
                      </td>
                      <td className="py-2.5 px-2 text-center font-mono font-bold text-[10px] text-slate-900">
                        {item.batchNumber}
                      </td>
                      <td className="py-2.5 px-2 text-center font-mono text-[10px] text-slate-600">
                        {item.expiryDate}
                      </td>
                      <td className="py-2.5 px-2 text-right font-bold text-slate-900">
                        {item.quantity}
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono text-slate-700">
                        ₹{item.unitRate.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono font-semibold text-slate-900">
                        ₹{item.taxableAmount.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono text-[10px] text-slate-600">
                        ₹{item.cgstAmount.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono text-[10px] text-slate-600">
                        ₹{item.sgstAmount.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-2.5 text-right font-mono font-black text-slate-900">
                        ₹{item.totalAmount.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Calculations & Statutory Bottom Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t-2 border-slate-900 pt-3 mb-4">
              {/* Left Column: Words, Bank & Warranty */}
              <div className="space-y-3">
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">
                    Amount in Words (INR):
                  </span>
                  <span className="font-bold text-slate-900 text-xs block mt-0.5 leading-snug">
                    {invoice.amountInWords}
                  </span>
                </div>

                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[10.5px] leading-relaxed">
                  <div className="flex items-center gap-1 font-bold text-slate-800 mb-1">
                    <CreditCard className="w-3.5 h-3.5 text-slate-600" />
                    <span>Bank Details for RTGS / NEFT:</span>
                  </div>
                  <div>Bank: <strong>{invoice.bankDetails.bankName}</strong> | Branch: <strong>{invoice.bankDetails.branch}</strong></div>
                  <div>A/C No: <strong className="font-mono">{invoice.bankDetails.accountNumber}</strong> | IFSC: <strong className="font-mono">{invoice.bankDetails.ifscCode}</strong></div>
                </div>

                <div className="p-2 bg-emerald-50/70 border-l-2 border-emerald-600 rounded-r text-[10px] text-slate-600 leading-snug">
                  <div className="flex items-center gap-1 font-bold text-emerald-900 mb-0.5">
                    <ShieldCheck className="w-3 h-3 text-emerald-700" />
                    <span>Section 18 Drug Warranty</span>
                  </div>
                  <p>{invoice.warrantyClause}</p>
                  <p className="mt-1 italic font-medium text-slate-700">Notice: {invoice.storageCondition}</p>
                </div>
              </div>

              {/* Right Column: GST Totals */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 text-xs flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex justify-between text-slate-600">
                    <span>Taxable Value (Subtotal):</span>
                    <span className="font-mono font-bold text-slate-900">₹{invoice.subtotalTaxable.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Central Tax (CGST 6.0%):</span>
                    <span className="font-mono text-slate-800">₹{invoice.cgstTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>State Tax (SGST 6.0%):</span>
                    <span className="font-mono text-slate-800">₹{invoice.sgstTotal.toFixed(2)}</span>
                  </div>
                  {invoice.igstTotal > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>Integrated Tax (IGST 12.0%):</span>
                      <span className="font-mono text-slate-800">₹{invoice.igstTotal.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-600">
                    <span>Freight / Cold-Chain Handling:</span>
                    <span className="font-mono text-slate-800">₹{invoice.shippingFee.toFixed(2)}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-300">
                  <div className="flex justify-between items-baseline bg-slate-900 text-white p-2.5 rounded-lg">
                    <span className="text-xs font-black uppercase tracking-wider">Grand Total (INR):</span>
                    <span className="font-mono font-black text-base">₹{invoice.grandTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Signatures Grid */}
            <div className="grid grid-cols-2 gap-4 border-t border-slate-200 pt-3">
              <div className="border border-slate-200 rounded-lg p-3 min-h-[72px] flex flex-col justify-between bg-slate-50/50">
                <span className="text-[10px] font-bold text-slate-500 uppercase">
                  Receiver's Stamp &amp; Signature
                </span>
                <div className="border-t border-dashed border-slate-300 pt-1 text-[9.5px] text-slate-400 flex justify-between">
                  <span>Pharmacist / In-Charge</span>
                  <span>Date: ____________</span>
                </div>
              </div>
              <div className="border border-slate-200 rounded-lg p-3 min-h-[72px] flex flex-col justify-between bg-slate-50/50">
                <span className="text-[10px] font-bold text-slate-500 uppercase text-right">
                  For {invoice.seller.name}
                </span>
                <div className="border-t border-dashed border-slate-300 pt-1 text-[9.5px] text-slate-400 flex justify-between">
                  <span>Digitally Authorized B2B Consignment</span>
                  <span>Authorized Signatory</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Action Footer */}
        <div className="px-5 py-3 bg-white border-t border-slate-200 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-500">
            Clicking <strong>Print A4 Invoice</strong> prints strictly 1 clean sheet with zero dashboard background.
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print A4 Invoice</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

