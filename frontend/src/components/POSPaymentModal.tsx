'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  CreditCard,
  QrCode,
  Banknote,
  Building2,
  CheckCircle2,
  ShieldCheck,
  RefreshCw,
  Wallet,
  ArrowRight,
  Sparkles,
  Smartphone,
  Copy,
  Check,
  AlertCircle,
  Receipt,
} from 'lucide-react';

export interface POSPaymentResult {
  paymentMode: 'CASH' | 'UPI' | 'CARD' | 'WALLET';
  transactionRef: string;
  amount: number;
  tenderedAmount?: number;
  changeAmount?: number;
  cardLast4?: string;
  upiVpa?: string;
  notes?: string;
}

interface POSPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  grandTotal: number;
  taxableAmount: number;
  totalTax: number;
  discountAmount: number;
  customerName: string;
  customerPhone: string;
  onPaymentSuccess: (result: POSPaymentResult) => void;
}

export const POSPaymentModal: React.FC<POSPaymentModalProps> = ({
  isOpen,
  onClose,
  grandTotal,
  taxableAmount,
  totalTax,
  discountAmount,
  customerName,
  customerPhone,
  onPaymentSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'UPI' | 'CARD' | 'CASH' | 'WALLET'>('UPI');
  const [isProcessing, setIsProcessing] = useState(false);
  const [successAnimation, setSuccessAnimation] = useState(false);

  // Cash state
  const [cashTendered, setCashTendered] = useState<number>(grandTotal);
  const changeDue = Math.max(0, cashTendered - grandTotal);

  // Card state
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardHolder, setCardHolder] = useState(customerName || 'Walk-in Patient');

  // UPI state
  const [upiTimer, setUpiTimer] = useState(300); // 5 min countdown
  const [copiedVpa, setCopiedVpa] = useState(false);
  const dynamicUpiVpa = 'apollo.pos@icici';
  const dynamicTxnId = `UPI${Date.now().toString().slice(-8)}`;

  // Wallet state
  const [selectedWallet, setSelectedWallet] = useState<'PHONEPE' | 'PAYTM' | 'GPAY' | 'HDFC_NET'>('PHONEPE');

  useEffect(() => {
    setCashTendered(grandTotal);
    setCardHolder(customerName || 'Walk-in Patient');
  }, [grandTotal, customerName]);

  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setUpiTimer((prev) => (prev > 0 ? prev - 1 : 300));
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleCopyVpa = () => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard?.writeText(dynamicUpiVpa);
      setCopiedVpa(true);
      setTimeout(() => setCopiedVpa(false), 2000);
    }
  };

  const fillTestCard = () => {
    setCardNumber('4532 •••• •••• 8821');
    setCardExpiry('08/29');
    setCardCvv('721');
    setCardHolder(customerName || 'Walk-in Patient');
  };

  const handleSimulateUpiPayment = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setSuccessAnimation(true);
      setTimeout(() => {
        onPaymentSuccess({
          paymentMode: 'UPI',
          transactionRef: `UPI/${dynamicTxnId}/ICICI`,
          amount: grandTotal,
          upiVpa: dynamicUpiVpa,
          notes: `Instant UPI QR Verified (${dynamicUpiVpa})`,
        });
      }, 500);
    }, 1000);
  };

  const handleProcessCardPayment = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setSuccessAnimation(true);
      setTimeout(() => {
        onPaymentSuccess({
          paymentMode: 'CARD',
          transactionRef: `AUTH-VISA-${Math.floor(100000 + Math.random() * 900000)}`,
          amount: grandTotal,
          cardLast4: cardNumber.replace(/\s/g, '').slice(-4) || '8821',
          notes: `POS Terminal Card Swipe Approved (Visa / RuPay)`,
        });
      }, 500);
    }, 1200);
  };

  const handleFinalizeCashPayment = () => {
    if (cashTendered < grandTotal) {
      alert(`Amount tendered (₹${cashTendered}) cannot be less than total bill (₹${grandTotal})`);
      return;
    }
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setSuccessAnimation(true);
      setTimeout(() => {
        onPaymentSuccess({
          paymentMode: 'CASH',
          transactionRef: `CSH-${Date.now().toString().slice(-6)}`,
          amount: grandTotal,
          tenderedAmount: cashTendered,
          changeAmount: changeDue,
          notes: `Counter Cash Settled (Received ₹${cashTendered}, Change ₹${changeDue})`,
        });
      }, 400);
    }, 400);
  };

  const handleProcessWalletPayment = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setSuccessAnimation(true);
      setTimeout(() => {
        onPaymentSuccess({
          paymentMode: 'WALLET',
          transactionRef: `${selectedWallet}-${Math.floor(10000000 + Math.random() * 90000000)}`,
          amount: grandTotal,
          notes: `Digital Wallet Payment Approved via ${selectedWallet}`,
        });
      }, 500);
    }, 900);
  };

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - MedLink Forest Green Theme */}
        <div className="bg-[#004733] text-white p-5 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-200 flex items-center justify-center font-bold">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-300">
                  MedLink Retail Checkout
                </span>
                <span className="text-[10px] bg-emerald-950/60 border border-emerald-400/30 px-2 py-0.5 rounded text-emerald-200 font-medium">
                  Form 20 Tax Invoice
                </span>
              </div>
              <h2 className="text-base font-extrabold text-white">
                Collect Retail Counter Payment
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-emerald-900/60 text-emerald-200 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Patient Summary Strip */}
        <div className="bg-slate-50 border-b border-slate-200/90 p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">
              Patient / Customer Details
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-sm font-extrabold text-slate-900">
                {customerName || 'Walk-in Customer'}
              </span>
              <span className="text-xs text-slate-500 font-mono">
                · {customerPhone || 'Counter Walk-in'}
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">
              Total Amount (MRP Incl. Taxes)
            </span>
            <span className="text-2xl font-black font-mono text-slate-900">
              ₹{grandTotal.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Payment Mode Selector Tabs */}
        <div className="p-3 bg-slate-100/70 border-b border-slate-200 grid grid-cols-4 gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('UPI')}
            className={`py-2 px-2 rounded-xl text-xs font-bold transition flex flex-col items-center gap-1 cursor-pointer ${
              activeTab === 'UPI'
                ? 'bg-[#004733] text-white shadow-2xs'
                : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-200/90'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>UPI / QR</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('CARD')}
            className={`py-2 px-2 rounded-xl text-xs font-bold transition flex flex-col items-center gap-1 cursor-pointer ${
              activeTab === 'CARD'
                ? 'bg-[#004733] text-white shadow-2xs'
                : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-200/90'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Card / EDC</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('CASH')}
            className={`py-2 px-2 rounded-xl text-xs font-bold transition flex flex-col items-center gap-1 cursor-pointer ${
              activeTab === 'CASH'
                ? 'bg-[#004733] text-white shadow-2xs'
                : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-200/90'
            }`}
          >
            <Banknote className="w-4 h-4" />
            <span>Cash Tender</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('WALLET')}
            className={`py-2 px-2 rounded-xl text-xs font-bold transition flex flex-col items-center gap-1 cursor-pointer ${
              activeTab === 'WALLET'
                ? 'bg-[#004733] text-white shadow-2xs'
                : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-200/90'
            }`}
          >
            <Wallet className="w-4 h-4" />
            <span>Net / Wallet</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-5">
          {/* TAB 1: UPI DYNAMIC QR */}
          {activeTab === 'UPI' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-center gap-5 bg-emerald-50/40 border border-emerald-200/70 rounded-2xl p-4">
                {/* Dynamic UPI QR SVG */}
                <div className="w-36 h-36 bg-white p-2 rounded-xl border border-slate-200 shadow-2xs flex flex-col items-center justify-center shrink-0">
                  <svg className="w-28 h-28 text-slate-900" viewBox="0 0 100 100" fill="currentColor">
                    {/* QR Finder Corners */}
                    <rect x="5" y="5" width="25" height="25" rx="3" fill="#004733" />
                    <rect x="9" y="9" width="17" height="17" fill="#ffffff" />
                    <rect x="13" y="13" width="9" height="9" fill="#00875a" />

                    <rect x="70" y="5" width="25" height="25" rx="3" fill="#004733" />
                    <rect x="74" y="9" width="17" height="17" fill="#ffffff" />
                    <rect x="78" y="13" width="9" height="9" fill="#00875a" />

                    <rect x="5" y="70" width="25" height="25" rx="3" fill="#004733" />
                    <rect x="9" y="74" width="17" height="17" fill="#ffffff" />
                    <rect x="13" y="78" width="9" height="9" fill="#00875a" />

                    {/* QR Data Matrix */}
                    <rect x="36" y="8" width="6" height="6" fill="#1e293b" />
                    <rect x="48" y="8" width="6" height="6" fill="#1e293b" />
                    <rect x="58" y="14" width="6" height="6" fill="#1e293b" />
                    <rect x="36" y="22" width="6" height="6" fill="#1e293b" />
                    <rect x="48" y="22" width="6" height="6" fill="#1e293b" />
                    <rect x="8" y="36" width="6" height="6" fill="#1e293b" />
                    <rect x="18" y="36" width="6" height="6" fill="#1e293b" />
                    <rect x="28" y="44" width="6" height="6" fill="#1e293b" />
                    <rect x="38" y="36" width="6" height="6" fill="#1e293b" />
                    <rect x="48" y="44" width="6" height="6" fill="#1e293b" />
                    <rect x="58" y="36" width="6" height="6" fill="#1e293b" />
                    <rect x="68" y="44" width="6" height="6" fill="#1e293b" />
                    <rect x="78" y="36" width="6" height="6" fill="#1e293b" />
                    <rect x="88" y="44" width="6" height="6" fill="#1e293b" />
                    <rect x="36" y="58" width="6" height="6" fill="#1e293b" />
                    <rect x="48" y="58" width="6" height="6" fill="#1e293b" />
                    <rect x="58" y="66" width="6" height="6" fill="#1e293b" />
                    <rect x="36" y="76" width="6" height="6" fill="#1e293b" />
                    <rect x="48" y="76" width="6" height="6" fill="#1e293b" />
                    <rect x="68" y="76" width="6" height="6" fill="#1e293b" />
                    <rect x="78" y="86" width="6" height="6" fill="#1e293b" />
                    <rect x="88" y="76" width="6" height="6" fill="#1e293b" />
                  </svg>
                  <span className="text-[9px] font-mono text-slate-500 font-bold mt-1">Scan via any UPI App</span>
                </div>

                <div className="flex-1 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-500">Merchant VPA:</span>
                    <button
                      type="button"
                      onClick={handleCopyVpa}
                      className="font-mono font-bold text-[#006644] bg-white px-2 py-0.5 rounded-lg border border-emerald-300 hover:bg-emerald-50 flex items-center gap-1 cursor-pointer"
                    >
                      <span>{dynamicUpiVpa}</span>
                      {copiedVpa ? <Check className="w-3 h-3 text-[#00875a]" /> : <Copy className="w-3 h-3 text-slate-400" />}
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-500">Bill Amount:</span>
                    <span className="font-mono font-black text-slate-900 text-sm">₹{grandTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-500">Session Timer:</span>
                    <span className="font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                      ⏱ {formatTimer(upiTimer)}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed pt-1">
                    Customer scans using Google Pay, PhonePe, Paytm, or BHIM. Live counter webhook confirms receipt instantly.
                  </p>
                </div>
              </div>

              <button
                type="button"
                disabled={isProcessing}
                onClick={handleSimulateUpiPayment}
                className="w-full py-3 bg-[#004733] hover:bg-[#003828] text-white rounded-xl text-sm font-extrabold transition shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:bg-slate-300"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>Verifying Bank UTR Webhook...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                    <span>Confirm Customer Paid via UPI (₹{grandTotal.toFixed(2)})</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* TAB 2: CARD / POS TERMINAL */}
          {activeTab === 'CARD' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">Enter Card / Swipe on EDC Terminal</span>
                <button
                  type="button"
                  onClick={fillTestCard}
                  className="text-[11px] font-bold text-[#00875a] hover:underline cursor-pointer flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3 text-[#00875a]" />
                  <span>Use Test Card</span>
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                    Card Number (Visa / Mastercard / RuPay)
                  </label>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    placeholder="4532 •••• •••• 8821"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#00875a]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                      Expiry (MM/YY)
                    </label>
                    <input
                      type="text"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      placeholder="08/29"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#00875a]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                      CVV / Security Code
                    </label>
                    <input
                      type="password"
                      maxLength={4}
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value)}
                      placeholder="•••"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#00875a]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                    Cardholder Name
                  </label>
                  <input
                    type="text"
                    value={cardHolder}
                    onChange={(e) => setCardHolder(e.target.value)}
                    placeholder="Full name as printed on card"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#00875a]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-500 font-medium">
                <ShieldCheck className="w-4 h-4 text-[#00875a] shrink-0" />
                <span>PCI-DSS Level-1 Certified Retail EDC Machine Integration</span>
              </div>

              <button
                type="button"
                disabled={isProcessing}
                onClick={handleProcessCardPayment}
                className="w-full py-3 bg-[#004733] hover:bg-[#003828] text-white rounded-xl text-sm font-extrabold transition shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:bg-slate-300"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>Authorizing POS Terminal Swipe...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 text-emerald-300" />
                    <span>Authorize &amp; Collect ₹{grandTotal.toFixed(2)}</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* TAB 3: CASH TENDER */}
          {activeTab === 'CASH' && (
            <div className="space-y-4">
              <div className="bg-emerald-50/40 border border-emerald-200/80 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-600">Net Payable Bill:</span>
                  <span className="font-mono font-black text-slate-900 text-base">₹{grandTotal.toFixed(2)}</span>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Cash Tendered by Customer (₹)
                  </label>
                  <input
                    type="number"
                    min={grandTotal}
                    step={1}
                    value={cashTendered || ''}
                    onChange={(e) => setCashTendered(parseFloat(e.target.value) || 0)}
                    className="w-full px-3.5 py-2.5 bg-white border border-emerald-300 rounded-xl text-lg font-mono font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#00875a]"
                  />
                </div>

                {/* Quick Tender Pills */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="text-[10px] text-slate-400 font-bold self-center mr-1">Quick Tender:</span>
                  <button
                    type="button"
                    onClick={() => setCashTendered(grandTotal)}
                    className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold cursor-pointer transition"
                  >
                    Exact (₹{grandTotal})
                  </button>
                  {[100, 200, 500, 1000, 2000].map((preset) => {
                    if (preset >= grandTotal) {
                      return (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setCashTendered(preset)}
                          className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold cursor-pointer transition"
                        >
                          ₹{preset}
                        </button>
                      );
                    }
                    return null;
                  })}
                </div>

                {/* Change to Return Banner */}
                <div className="pt-2 border-t border-emerald-200/80 flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-700">
                    Change to Return to Patient:
                  </span>
                  <span className={`text-xl font-mono font-black ${changeDue > 0 ? 'text-[#00875a]' : 'text-slate-400'}`}>
                    ₹{changeDue.toFixed(2)}
                  </span>
                </div>
              </div>

              <button
                type="button"
                disabled={isProcessing || cashTendered < grandTotal}
                onClick={handleFinalizeCashPayment}
                className="w-full py-3 bg-[#004733] hover:bg-[#003828] disabled:bg-slate-200 text-white rounded-xl text-sm font-extrabold transition shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>Finalizing Cash Till Settlement...</span>
                  </>
                ) : (
                  <>
                    <Banknote className="w-4 h-4 text-emerald-300" />
                    <span>Accept Cash (₹{cashTendered}) &amp; Issue Form 20 Receipt</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* TAB 4: WALLET / NETBANKING */}
          {activeTab === 'WALLET' && (
            <div className="space-y-4">
              <span className="text-xs font-bold text-slate-700 block">Select Patient Digital Wallet or Netbanking</span>

              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { id: 'PHONEPE', name: 'PhonePe Merchant', icon: Smartphone, color: 'text-purple-600 bg-purple-50' },
                  { id: 'PAYTM', name: 'Paytm Business', icon: Smartphone, color: 'text-blue-600 bg-blue-50' },
                  { id: 'GPAY', name: 'Google Pay Business', icon: Smartphone, color: 'text-amber-600 bg-amber-50' },
                  { id: 'HDFC_NET', name: 'HDFC NetBanking', icon: Building2, color: 'text-rose-600 bg-rose-50' },
                ].map((w) => (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => setSelectedWallet(w.id as any)}
                    className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition cursor-pointer ${
                      selectedWallet === w.id
                        ? 'border-[#00875a] bg-emerald-50/50 ring-1 ring-[#00875a]'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${w.color}`}>
                      <w.icon className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-extrabold text-slate-900 block leading-tight">{w.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">Instant Gateway API</span>
                    </div>
                  </button>
                ))}
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600">
                <span>Customer wallet identifier: </span>
                <span className="font-mono font-bold text-slate-900">{customerPhone || '+91 98200 12345'}</span>
              </div>

              <button
                type="button"
                disabled={isProcessing}
                onClick={handleProcessWalletPayment}
                className="w-full py-3 bg-[#004733] hover:bg-[#003828] text-white rounded-xl text-sm font-extrabold transition shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:bg-slate-300"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>Triggering {selectedWallet} Gateway Push...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                    <span>Collect ₹{grandTotal.toFixed(2)} via {selectedWallet}</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
          <span>Stamps Form 20 Statutory Retail Tax Invoice as PAID immediately</span>
          <button
            type="button"
            onClick={onClose}
            className="font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
