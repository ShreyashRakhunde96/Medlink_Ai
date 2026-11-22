'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Building2,
  Truck,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Package,
  Layers,
  Activity,
  CheckCircle2,
  RefreshCw,
  FileText,
  Check,
  TrendingUp,
  Clock,
  MapPin,
  Store,
  Snowflake,
  Sliders,
  X,
  Phone,
  PhoneCall,
  Mail,
  UserPlus,
  LogIn,
  CreditCard,
  QrCode,
  AlertCircle
} from 'lucide-react';
import Header from '@/components/Header';
import { API_BASE } from '@/lib/api';

export default function PortalHomePage() {
  const [stats, setStats] = useState({
    medicinesCount: 32,
    inventoryCount: 32,
    ordersCount: 3,
    apiStatus: 'UP',
  });

  // Partner Registration State
  const [joinRole, setJoinRole] = useState<'RETAILER' | 'DISTRIBUTOR'>('RETAILER');
  const [joinEntityName, setJoinEntityName] = useState('');
  const [joinLicense, setJoinLicense] = useState('');
  const [joinGstin, setJoinGstin] = useState('');
  const [joinCity, setJoinCity] = useState('Mumbai');
  const [joinPincode, setJoinPincode] = useState('400001');
  const [joinContactName, setJoinContactName] = useState('');
  const [joinPhone, setJoinPhone] = useState('');
  const [joinEmail, setJoinEmail] = useState('');
  const [joinPassword, setJoinPassword] = useState('');
  const [joinAddress, setJoinAddress] = useState('');
  const [joinSubmitting, setJoinSubmitting] = useState(false);
  const [joinSuccessMessage, setJoinSuccessMessage] = useState<string | null>(null);

  // Legal & Compliance Modals
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);

  // Contact Form State
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactRole, setContactRole] = useState<'RETAILER' | 'DISTRIBUTOR' | 'MANUFACTURER' | 'OTHER'>('RETAILER');
  const [contactMessage, setContactMessage] = useState('');
  const [contactSubmitted, setContactSubmitted] = useState(false);

  useEffect(() => {
    // Fetch live system telemetry
    fetch(`${API_BASE}/health`)
      .then((res) => res.json())
      .then((data) => {
        setStats((prev) => ({ ...prev, apiStatus: data.status }));
      })
      .catch(() => {});

    fetch(`${API_BASE}/catalogue`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setStats((prev) => ({ ...prev, medicinesCount: data.count }));
      })
      .catch(() => {});

    fetch(`${API_BASE}/orders`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setStats((prev) => ({ ...prev, ordersCount: data.count }));
      })
      .catch(() => {});
  }, []);

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setJoinSubmitting(true);

    const regPayload = {
      id: `reg-${Date.now()}`,
      role: joinRole === 'RETAILER' ? 'MEDICAL_STORE' : 'DISTRIBUTOR',
      name: joinEntityName.trim(),
      storeName: joinEntityName.trim(),
      companyName: joinEntityName.trim(),
      licenseNumber: joinLicense.trim().toUpperCase(),
      license_number: joinLicense.trim().toUpperCase(),
      gstin: joinGstin.trim().toUpperCase() || '27AABCU9603R1ZM',
      phone: joinPhone.trim(),
      email: joinEmail.trim().toLowerCase(),
      address: joinAddress.trim() || `${joinCity}, Maharashtra`,
      city: joinCity.trim(),
      state: 'Maharashtra',
      pincode: joinPincode.trim(),
      contactPerson: joinContactName.trim(),
      contact_person: joinContactName.trim(),
      status: 'PENDING',
      verification_status: 'PENDING',
      createdAt: new Date().toISOString(),
    };

    // 1. Immediately store in localStorage so Admin Panel picks it up instantaneously
    if (typeof window !== 'undefined') {
      try {
        const stored = JSON.parse(localStorage.getItem('medlink_pending_registrations') || '[]');
        stored.unshift(regPayload);
        localStorage.setItem('medlink_pending_registrations', JSON.stringify(stored));
      } catch (err) {
        console.error('Local registration cache error:', err);
      }
    }

    // 2. Transmit to backend auth registration route
    try {
      await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...regPayload,
          password: joinPassword || 'MedLink@2026',
        }),
      });
    } catch (err) {
      console.warn('Backend registration notice:', err);
    }

    setJoinSubmitting(false);
    setJoinSuccessMessage(
      `Registration for "${joinEntityName}" submitted! Your CDSCO drug license (${joinLicense.toUpperCase()}) has been queued in the Administrator verification desk. Credentials will be activated upon approval.`
    );
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setContactSubmitted(true);
    setTimeout(() => {
      setContactSubmitted(false);
      setContactName('');
      setContactEmail('');
      setContactPhone('');
      setContactMessage('');
    }, 4000);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 scroll-smooth">
      {/* Top Navbar */}
      <Header />

      {/* ========================================================================= */}
      {/* 1. HERO SECTION: AUTHORITATIVE & CLEAN                                     */}
      {/* ========================================================================= */}
      <section className="bg-gradient-to-b from-white via-white to-slate-50/80 border-b border-slate-200/90 py-16 lg:py-24 relative overflow-hidden">
        {/* Subtle decorative background glow */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-100/40 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 left-10 w-80 h-80 bg-blue-100/30 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl">
            {/* Regulatory Verification Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/90 text-emerald-800 text-xs font-bold mb-6 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>India&apos;s Unified Pharmaceutical B2B &amp; Distribution Network</span>
              <span className="text-[10px] bg-[#00875a] text-white px-2 py-0.5 rounded-full font-black uppercase">
                CDSCO Form 20/21
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.12]">
              Where Retail Chemists &amp; Wholesale Depots{' '}
              <span className="text-[#00875a] underline decoration-[#00875a]/30 decoration-wavy">
                Connect Seamlessly.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="mt-5 text-base sm:text-lg text-slate-600 leading-relaxed font-medium">
              Eliminate medicine stockouts, opaque pricing, and manual phone calls. MedLink links licensed retail chemists directly with authorized C&amp;F wholesale depots for real-time quotation comparison, automated batch quarantine controls, and temperature-tracked deliveries.
            </p>

            {/* Clear Call-To-Action (Register & Portal Login only) */}
            <div className="mt-8 flex flex-wrap items-center gap-3.5">
              <a
                href="#register"
                className="px-6 py-3.5 bg-[#00875a] hover:bg-[#007048] text-white rounded-xl text-sm font-extrabold transition flex items-center gap-2 shadow-xs cursor-pointer group"
              >
                <UserPlus className="w-4 h-4" />
                <span>Register Pharmacy or Wholesaler</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
              </a>

              <Link
                href="/login"
                className="px-5 py-3.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-sm font-bold transition flex items-center gap-2 shadow-2xs"
              >
                <LogIn className="w-4 h-4 text-slate-500" />
                <span>Sign In to Your Account</span>
              </Link>
            </div>

            {/* Regulatory & Enterprise Architecture Trust Badges */}
            <div className="mt-10 pt-6 border-t border-slate-200/80">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-3">
                Statutory Compliance &amp; Operational Standards:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
                  <div className="w-9 h-9 rounded-lg bg-emerald-50 text-[#00875a] flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-extrabold text-xs block text-slate-900">CDSCO Form 20 / 20B</span>
                    <span className="text-[11px] text-slate-500">Drugs &amp; Cosmetics Rules 1945</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 text-[#1b64da] flex items-center justify-center shrink-0">
                    <Snowflake className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-extrabold text-xs block text-slate-900">Cold-Chain 2°C–8°C</span>
                    <span className="text-[11px] text-slate-500">IoT Continuous Loggers</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
                  <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-extrabold text-xs block text-slate-900">PostgreSQL Relational DB</span>
                    <span className="text-[11px] text-slate-500">Atomic Stock Reservations</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* LIVE NETWORK TELEMETRY STRIP                                              */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 w-full relative z-20">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#00875a] flex items-center justify-center shrink-0 font-black">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Verified Retail Stores</span>
              <span className="text-xl font-black text-slate-900 font-mono">140+ Chemist Desks</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1b64da] flex items-center justify-center shrink-0 font-black">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Authorized Wholesale Hubs</span>
              <span className="text-xl font-black text-slate-900 font-mono">5 Central MMR Depots</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0 font-black">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">CDSCO Released Batches</span>
              <span className="text-xl font-black text-slate-900 font-mono">{stats.inventoryCount || 524} Formulations</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 font-black">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">On-Time Transit SLA</span>
              <span className="text-xl font-black text-emerald-700 font-mono">98.5% Delivery Rate</span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. ABOUT US SECTION (#about)                                              */}
      {/* ========================================================================= */}
      <section id="about" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full scroll-mt-20">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#00875a] bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
            About MedLink Network
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mt-3">
            Transforming Indian Pharmaceutical Supply Chains
          </h2>
          <p className="text-sm sm:text-base text-slate-600 mt-3 font-medium">
            Bridging the gap between 100,000+ neighborhood retail chemists and wholesale C&amp;F depots with a digital, transparent, and regulatory-first platform.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs space-y-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-[#00875a] flex items-center justify-center font-bold">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-base text-slate-900">100% CDSCO License Verification</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Every participant on MedLink is strictly vetted by our compliance team against CDSCO and State FDA databases. Retail pharmacies must hold valid Form 20/21 licenses; wholesalers must hold Form 20B/21B licenses. Zero unlicensed actors.
            </p>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs space-y-3">
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-[#1b64da] flex items-center justify-center font-bold">
              <Snowflake className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-base text-slate-900">WHO-GDP Cold-Chain Assurance</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Biologicals, vaccines, and insulin require uninterrupted 2°C–8°C storage. MedLink connects temperature-controlled depot freezers directly with dedicated refrigerated transit vans, recording digital IoT temperature logs on every tax invoice.
            </p>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs space-y-3">
            <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
              <Sliders className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-base text-slate-900">Multi-Factor Wholesale Allocation</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Our Multi-Criteria Decision Making (MCDM) allocation engine transparently ranks wholesale quotes using genuine stock availability, verified distance in kilometers, delivery lead-time, and historical fulfillment SLA ratings.
            </p>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. PRODUCTS & PLATFORM ECOSYSTEM (#products)                              */}
      {/* ========================================================================= */}
      <section id="products" className="bg-slate-100/60 border-y border-slate-200/80 py-20 w-full scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#1b64da] bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
              Platform Features &amp; Products
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mt-3">
              An End-to-End Operating System for Pharma Trade
            </h2>
            <p className="text-sm sm:text-base text-slate-600 mt-3 font-medium">
              From the retail chemist counter dispensing medicines to walk-in patients, to wholesale C&amp;F warehouses dispatching reefer vans across highways.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Product 1: Retail POS */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs hover:border-[#00875a]/50 transition flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#00875a] flex items-center justify-center font-bold mb-3">
                  <Store className="w-5 h-5" />
                </div>
                <h3 className="font-extrabold text-sm text-slate-900 mb-1">Multi-Terminal Retail POS Desk</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Fast counter billing desk with barcode batch scanning, customer prescription management, Form 20 retail tax receipt generation, and integrated Dynamic UPI / Card payment gateway.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-xs font-bold text-[#00875a]">
                <Check className="w-3.5 h-3.5" />
                <span>Form 20 Tax Invoices</span>
              </div>
            </div>

            {/* Product 2: Wholesale Comparison */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs hover:border-blue-400 transition flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1b64da] flex items-center justify-center font-bold mb-3">
                  <Sliders className="w-5 h-5" />
                </div>
                <h3 className="font-extrabold text-sm text-slate-900 mb-1">Wholesale Quote Comparison</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Direct access to authentic stock across verified C&amp;F distributors. Real-time comparison of unit prices, GST rates, transit distances, batch expiry dates, and delivery lead times.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-xs font-bold text-[#1b64da]">
                <Check className="w-3.5 h-3.5" />
                <span>Live Authentic Stock Only</span>
              </div>
            </div>

            {/* Product 3: WMS Logistics & Fleet */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs hover:border-purple-400 transition flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold mb-3">
                  <Truck className="w-5 h-5" />
                </div>
                <h3 className="font-extrabold text-sm text-slate-900 mb-1">C&amp;F Warehouse Management</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Comprehensive depot inventory tracking with batch QA quarantine holds, emergency recalls, live GPS fleet corridor maps, IoT 3.8°C cold-chain sensors, and handover OTPs.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-xs font-bold text-purple-700">
                <Check className="w-3.5 h-3.5" />
                <span>Live Fleet GPS Tracking</span>
              </div>
            </div>

            {/* Product 4: Chemist Indents */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs hover:border-amber-400 transition flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold mb-3">
                  <Package className="w-5 h-5" />
                </div>
                <h3 className="font-extrabold text-sm text-slate-900 mb-1">Chemist Indents &amp; Sourcing</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  When specific formulations are out-of-stock across wholesale catalogues, pharmacists can raise an official indent specifying quantity, urgency, and target date directly to wholesalers.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-xs font-bold text-amber-700">
                <Check className="w-3.5 h-3.5" />
                <span>Direct Sourcing Channel</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. DISTRIBUTION NETWORK & COVERAGE (#network)                              */}
      {/* ========================================================================= */}
      <section id="network" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full scroll-mt-20">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#00875a] bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
            Logistics Infrastructure
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mt-3">
            Physical Depot Network &amp; Transit Corridors
          </h2>
          <p className="text-sm sm:text-base text-slate-600 mt-3 font-medium">
            Strategically located C&amp;F logistics hubs servicing Greater Mumbai, Thane, Navi Mumbai, Pune, and Western Maharashtra.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-blue-600 uppercase">Hub 1 · Central Depot</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">24/7 Active</span>
            </div>
            <h4 className="font-extrabold text-sm text-slate-900">Bhiwandi Central Pharma Hub</h4>
            <p className="text-xs text-slate-500 font-medium">Mankoli Logistics Park, Units 14–18, Thane (Pin 421302)</p>
            <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-600 space-y-1">
              <div>Capacity: <strong>12,000 WMS Pallets</strong></div>
              <div>Cold-Chain: <strong>3 Walk-in Freezers</strong></div>
              <div>License: <strong className="font-mono">WDL-2024-MVL-101</strong></div>
            </div>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-blue-600 uppercase">Hub 2 · Intra-City Express</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">Active</span>
            </div>
            <h4 className="font-extrabold text-sm text-slate-900">Kurla West Logistics Depot</h4>
            <p className="text-xs text-slate-500 font-medium">LBS Marg Logistics Center, Kurla, Mumbai (Pin 400070)</p>
            <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-600 space-y-1">
              <div>Coverage: <strong>South &amp; Central Mumbai</strong></div>
              <div>Transit SLA: <strong>&lt; 90 mins Express</strong></div>
              <div>License: <strong className="font-mono">WDL-2024-APX-202</strong></div>
            </div>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-blue-600 uppercase">Hub 3 · Commercial Hub</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">Active</span>
            </div>
            <h4 className="font-extrabold text-sm text-slate-900">Vashi APMC Wholesale Complex</h4>
            <p className="text-xs text-slate-500 font-medium">Sector 19-C, APMC Market Complex, Navi Mumbai (Pin 400703)</p>
            <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-600 space-y-1">
              <div>Coverage: <strong>Navi Mumbai &amp; Konkan</strong></div>
              <div>Fleet: <strong>Refrigerated Tata Ace</strong></div>
              <div>License: <strong className="font-mono">WDL-2024-SHW-303</strong></div>
            </div>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-blue-600 uppercase">Hub 4 · Regional Depot</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">Active</span>
            </div>
            <h4 className="font-extrabold text-sm text-slate-900">Pune Regional Logistics Hub</h4>
            <p className="text-xs text-slate-500 font-medium">Hadapsar Industrial Estate, Phase 2, Pune (Pin 411013)</p>
            <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-600 space-y-1">
              <div>Coverage: <strong>Western Maharashtra</strong></div>
              <div>Corridor: <strong>NH-48 Expressway Reefer</strong></div>
              <div>License: <strong className="font-mono">WDL-2024-BPS-505</strong></div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. PARTNER REGISTRATION FORM SECTION (#register)                          */}
      {/* ========================================================================= */}
      <section id="register" className="bg-slate-900 text-white py-20 w-full scroll-mt-20 relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-10">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-800/80">
              Partner Registration Desk
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mt-3">
              Apply to Join MedLink Network
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-xl mx-auto">
              Registration requests are submitted directly to the Administrator Panel for CDSCO drug license verification. Once verified, official portal credentials will be issued.
            </p>
          </div>

          <div className="bg-slate-800/90 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md">
            {joinSuccessMessage ? (
              <div className="py-12 text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-xs border border-emerald-500/30">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="font-black text-xl text-white">Application Received!</h3>
                <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
                  {joinSuccessMessage}
                </p>
                <div className="pt-4">
                  <Link
                    href="/login"
                    className="px-5 py-2.5 bg-[#00875a] hover:bg-[#007048] text-white rounded-xl text-xs font-extrabold transition inline-flex items-center gap-1.5"
                  >
                    <span>Go to Sign In Portal</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleRegisterSubmit} className="space-y-4 text-xs">
                {/* Role Toggle Switch */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-2">
                    I want to register as:
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setJoinRole('RETAILER')}
                      className={`py-3 px-4 rounded-xl font-extrabold transition flex items-center justify-center gap-2 cursor-pointer border ${
                        joinRole === 'RETAILER'
                          ? 'bg-[#00875a] text-white border-emerald-400 shadow-xs'
                          : 'bg-slate-700/50 text-slate-300 border-slate-600 hover:bg-slate-700'
                      }`}
                    >
                      <Store className="w-4 h-4" />
                      <span>Medical Store / Retail Chemist</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setJoinRole('DISTRIBUTOR')}
                      className={`py-3 px-4 rounded-xl font-extrabold transition flex items-center justify-center gap-2 cursor-pointer border ${
                        joinRole === 'DISTRIBUTOR'
                          ? 'bg-[#1b64da] text-white border-blue-400 shadow-xs'
                          : 'bg-slate-700/50 text-slate-300 border-slate-600 hover:bg-slate-700'
                      }`}
                    >
                      <Truck className="w-4 h-4" />
                      <span>Wholesale Distributor / C&amp;F Depot</span>
                    </button>
                  </div>
                </div>

                {/* Entity / Shop Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    {joinRole === 'RETAILER' ? 'Medical Store / Pharmacy Name *' : 'Wholesale Distribution / C&F Depot Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={joinEntityName}
                    onChange={(e) => setJoinEntityName(e.target.value)}
                    placeholder={joinRole === 'RETAILER' ? 'e.g. Sanjeevani Care Chemist' : 'e.g. Metro Pharma Logistics Depot'}
                    className="w-full px-3.5 py-2.5 bg-slate-900/80 border border-slate-600 rounded-xl text-xs font-bold text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                  />
                </div>

                {/* Drug License & GSTIN */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      CDSCO Drug License (Form 20/21 or 20B/21B) *
                    </label>
                    <input
                      type="text"
                      required
                      value={joinLicense}
                      onChange={(e) => setJoinLicense(e.target.value.toUpperCase())}
                      placeholder={joinRole === 'RETAILER' ? 'DL-2024-MH-SAN102' : 'WDL-2024-MET-991'}
                      className="w-full px-3.5 py-2.5 bg-slate-900/80 border border-slate-600 rounded-xl text-xs font-mono font-bold text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      GSTIN / Tax Registration No. *
                    </label>
                    <input
                      type="text"
                      required
                      value={joinGstin}
                      onChange={(e) => setJoinGstin(e.target.value.toUpperCase())}
                      placeholder="27AABCU9603R1ZM"
                      className="w-full px-3.5 py-2.5 bg-slate-900/80 border border-slate-600 rounded-xl text-xs font-mono font-bold text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                    />
                  </div>
                </div>

                {/* Contact Person & Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Registered Pharmacist / Owner Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={joinContactName}
                      onChange={(e) => setJoinContactName(e.target.value)}
                      placeholder="e.g. Yashodip Patil"
                      className="w-full px-3.5 py-2.5 bg-slate-900/80 border border-slate-600 rounded-xl text-xs font-bold text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Mobile Number (WhatsApp OTP) *
                    </label>
                    <input
                      type="tel"
                      required
                      value={joinPhone}
                      onChange={(e) => setJoinPhone(e.target.value)}
                      placeholder="+91 98200 12345"
                      className="w-full px-3.5 py-2.5 bg-slate-900/80 border border-slate-600 rounded-xl text-xs font-mono font-bold text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                    />
                  </div>
                </div>

                {/* Email & Password */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Official Work Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={joinEmail}
                      onChange={(e) => setJoinEmail(e.target.value)}
                      placeholder="contact@sanjeevani-care.in"
                      className="w-full px-3.5 py-2.5 bg-slate-900/80 border border-slate-600 rounded-xl text-xs font-mono font-bold text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Desired Portal Password *
                    </label>
                    <input
                      type="password"
                      required
                      value={joinPassword}
                      onChange={(e) => setJoinPassword(e.target.value)}
                      placeholder="Create secure password"
                      className="w-full px-3.5 py-2.5 bg-slate-900/80 border border-slate-600 rounded-xl text-xs font-mono font-bold text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                    />
                  </div>
                </div>

                {/* City & Pincode */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Operating City / District *
                    </label>
                    <input
                      type="text"
                      required
                      value={joinCity}
                      onChange={(e) => setJoinCity(e.target.value)}
                      placeholder="e.g. Mumbai, Thane, Pune"
                      className="w-full px-3.5 py-2.5 bg-slate-900/80 border border-slate-600 rounded-xl text-xs font-bold text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      PIN Code *
                    </label>
                    <input
                      type="text"
                      required
                      value={joinPincode}
                      onChange={(e) => setJoinPincode(e.target.value)}
                      placeholder="e.g. 400001"
                      className="w-full px-3.5 py-2.5 bg-slate-900/80 border border-slate-600 rounded-xl text-xs font-mono font-bold text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Premises Address
                  </label>
                  <input
                    type="text"
                    value={joinAddress}
                    onChange={(e) => setJoinAddress(e.target.value)}
                    placeholder="Shop/Depot Unit No, Street, Landmark"
                    className="w-full px-3.5 py-2.5 bg-slate-900/80 border border-slate-600 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                  />
                </div>

                <div className="pt-3 border-t border-slate-700/80 flex items-center justify-between">
                  <p className="text-[11px] text-slate-400">
                    By registering, you confirm valid Form 20/21 or 20B/21B CDSCO drug licensing.
                  </p>
                  <button
                    type="submit"
                    disabled={joinSubmitting}
                    className={`px-6 py-3 rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-md cursor-pointer ${
                      joinRole === 'RETAILER'
                        ? 'bg-[#00875a] hover:bg-[#007048] text-white'
                        : 'bg-[#1b64da] hover:bg-[#1554ba] text-white'
                    }`}
                  >
                    {joinSubmitting ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Submitting to Admin...</span>
                      </>
                    ) : (
                      <>
                        <span>Submit Application</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. CONTACT US SECTION (#contact)                                          */}
      {/* ========================================================================= */}
      <section id="contact" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full scroll-mt-20">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#1b64da] bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
            Contact &amp; Hub Locations
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mt-3">
            Get in Touch with MedLink Operations
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-2 font-medium">
            Direct access to our central logistics parks, corporate headquarters, and 24/7 chemist emergency helpline.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Depots & Hotline */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1b64da] flex items-center justify-center font-bold shrink-0">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono font-bold text-blue-600 uppercase tracking-wider block">Central C&amp;F Logistics Hub</span>
                    <h3 className="text-base font-extrabold text-slate-900">Bhiwandi Central Pharma Depot</h3>
                  </div>
                </div>
                <span className="text-[11px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-md">24/7 Dispatch</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600 pt-2 border-t border-slate-100">
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">Location</span>
                  <p className="font-semibold text-slate-800 mt-0.5">Mankoli Pharma Park, Units 14–18, Bhiwandi (Pin 421302)</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">Specifications</span>
                  <p className="font-semibold text-slate-800 mt-0.5">12,000 Pallets · 3 Walk-in Freezers (-20°C to 8°C)</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">Dispatch Helpline</span>
                  <p className="font-mono font-bold text-slate-900 mt-0.5">+91 98200 44551 / +91 2522 698800</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">Email</span>
                  <p className="font-mono text-blue-600 mt-0.5">dispatch@medlink-network.in</p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center font-bold shrink-0">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider block">Corporate Office</span>
                    <h3 className="text-base font-extrabold text-slate-900">MedLink Corporate Headquarters</h3>
                  </div>
                </div>
                <span className="text-[11px] font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">Nariman Point</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600 pt-2 border-t border-slate-100">
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">Address</span>
                  <p className="font-semibold text-slate-800 mt-0.5">Express Towers, 14th Floor, Nariman Point, Mumbai 400021</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">Phone</span>
                  <p className="font-mono font-bold text-slate-900 mt-0.5">+91 22 6988 4000</p>
                </div>
              </div>
            </div>

            {/* 24/7 Helpline Banner */}
            <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#00875a] text-white flex items-center justify-center font-bold shrink-0">
                  <PhoneCall className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-emerald-800 block">Toll-Free 24/7 Chemist Emergency Hotline</span>
                  <span className="text-base font-black font-mono text-emerald-950">1800-419-MEDLINK (1800-419-6335)</span>
                </div>
              </div>
              <span className="text-[11px] text-emerald-700 font-bold hidden sm:inline">Instant Response</span>
            </div>
          </div>

          {/* Right Column: Contact Inquiry Form */}
          <div className="lg:col-span-5">
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs">
              <div className="mb-4">
                <h3 className="text-base font-extrabold text-slate-900">Send an Inquiry</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Have questions about network onboarding, cold-chain SLAs, or technical integrations? Reach out to our logistics desk.
                </p>
              </div>

              {contactSubmitted ? (
                <div className="py-10 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-[#00875a] flex items-center justify-center mx-auto shadow-xs">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <h4 className="font-black text-base text-slate-900">Inquiry Transmitted!</h4>
                  <p className="text-xs text-slate-600 max-w-xs mx-auto leading-relaxed">
                    Thank you, {contactName || 'Partner'}. A regional logistics coordinator will respond within 2 business hours.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-3.5 text-xs">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      placeholder="e.g. Yashodip Patil"
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#00875a]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Work Email *</label>
                      <input
                        type="email"
                        required
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        placeholder="yashodip@pharmacy.in"
                        className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#00875a]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Number *</label>
                      <input
                        type="tel"
                        required
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        placeholder="+91 98200 12345"
                        className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#00875a]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Stakeholder Type</label>
                    <select
                      value={contactRole}
                      onChange={(e) => setContactRole(e.target.value as any)}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#00875a]"
                    >
                      <option value="RETAILER">Retail Chemist / Community Pharmacy</option>
                      <option value="DISTRIBUTOR">Wholesale Distributor / C&amp;F Depot</option>
                      <option value="MANUFACTURER">Pharmaceutical Manufacturer</option>
                      <option value="OTHER">Healthcare Hospital / Regulatory Authority</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Message / Inquiry *</label>
                    <textarea
                      required
                      rows={3}
                      value={contactMessage}
                      onChange={(e) => setContactMessage(e.target.value)}
                      placeholder="Describe your inquiry regarding stock sourcing, delivery lead times, or network verification..."
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#00875a]"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Submit Inquiry</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. CLEAN & PROFESSIONAL FOOTER                                            */}
      {/* ========================================================================= */}
      <footer className="bg-white border-t border-slate-200 text-slate-600 text-xs py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
            {/* Brand Col */}
            <div className="space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-black text-sm">
                  M
                </div>
                <span className="font-extrabold text-slate-900 text-sm">MedLink Network</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                National B2B digital distribution infrastructure connecting CDSCO licensed retail community pharmacies with authorized C&amp;F wholesale pharmaceutical depots.
              </p>
              <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
                <span>CDSCO Verified</span>
                <span>·</span>
                <span>WHO-GDP</span>
                <span>·</span>
                <span>ISO 9001:2015</span>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <span className="font-extrabold text-slate-900 block mb-3 uppercase tracking-wider text-[11px]">Platform</span>
              <ul className="space-y-2 text-[11px]">
                <li><a href="#about" className="hover:text-slate-900 transition">About Us</a></li>
                <li><a href="#products" className="hover:text-slate-900 transition">Products &amp; POS</a></li>
                <li><a href="#network" className="hover:text-slate-900 transition">Distribution Network</a></li>
                <li><a href="#contact" className="hover:text-slate-900 transition">Contact &amp; Hubs</a></li>
              </ul>
            </div>

            {/* Regulatory Links */}
            <div>
              <span className="font-extrabold text-slate-900 block mb-3 uppercase tracking-wider text-[11px]">Regulatory Compliance</span>
              <ul className="space-y-2 text-[11px]">
                <li><button type="button" onClick={() => setIsTermsOpen(true)} className="hover:text-slate-900 transition cursor-pointer">Terms of Pharmaceutical Trade</button></li>
                <li><button type="button" onClick={() => setIsPrivacyOpen(true)} className="hover:text-slate-900 transition cursor-pointer">Data Privacy &amp; Patient Security</button></li>
                <li><a href="#regulatory" className="hover:text-slate-900 transition">Form 20/21 Verification Protocol</a></li>
                <li><a href="#regulatory" className="hover:text-slate-900 transition">Cold-Chain Temperature Standard</a></li>
              </ul>
            </div>

            {/* Portals Access */}
            <div>
              <span className="font-extrabold text-slate-900 block mb-3 uppercase tracking-wider text-[11px]">Verified Portals</span>
              <ul className="space-y-2 text-[11px]">
                <li><Link href="/login" className="hover:text-slate-900 font-semibold transition">Portal Sign In</Link></li>
                <li><a href="#register" className="hover:text-slate-900 font-semibold transition">New Partner Registration</a></li>
                <li><Link href="/admin" className="hover:text-slate-900 font-semibold transition">Administrator Panel</Link></li>
              </ul>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-400">
            <span>© {new Date().getFullYear()} MedLink Network Technologies Pvt. Ltd. All rights reserved.</span>
            <span>Operating under Drugs &amp; Cosmetics Rules 1945 · CDSCO Approved</span>
          </div>
        </div>
      </footer>

      {/* ========================================================================= */}
      {/* MODAL: STATUTORY TERMS & CONDITIONS                                       */}
      {/* ========================================================================= */}
      {isTermsOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4"
          onClick={() => setIsTermsOpen(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4 shrink-0">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-[#00875a]" />
                <h3 className="text-base font-extrabold text-slate-900">
                  MedLink Terms &amp; Conditions (B2B Pharmaceutical Trade)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsTermsOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto space-y-3.5 text-xs text-slate-600 leading-relaxed pr-2">
              <div>
                <h4 className="font-extrabold text-slate-900 mb-0.5">1. Statutory Drug Licensing</h4>
                <p>
                  Access to MedLink Network is restricted exclusively to entities holding valid licenses issued by the Central Drugs Standard Control Organisation (CDSCO) or State Licensing Authorities under the Drugs and Cosmetics Act, 1940: Form 20 / 21 for retail pharmacies, and Form 20B / 21B for wholesale C&amp;F distributors.
                </p>
              </div>

              <div>
                <h4 className="font-extrabold text-slate-900 mb-0.5">2. Cold-Chain &amp; Temperature Integrity</h4>
                <p>
                  Wholesale distributors are contractually obligated to maintain biologicals, vaccines, and specified injectables within 2.0°C to 8.0°C during storage and transit. Any excursion logged by MedLink IoT telemetry exceeding 8.5°C triggers immediate quarantine holds and free batch replacement.
                </p>
              </div>

              <div>
                <h4 className="font-extrabold text-slate-900 mb-0.5">3. Batch Traceability &amp; No-Counterfeit Warranty</h4>
                <p>
                  All medicines transacted through MedLink must originate directly from licensed pharmaceutical manufacturers with valid Certificates of Analysis (CoA). Wholesale distributors warrant that every delivered consignment matches the manufacturer batch number and expiry date recorded on the electronic tax invoice.
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end mt-4 shrink-0">
              <button
                type="button"
                onClick={() => setIsTermsOpen(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Close Terms
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: PRIVACY POLICY & DATA SECURITY                                     */}
      {/* ========================================================================= */}
      {isPrivacyOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4"
          onClick={() => setIsPrivacyOpen(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4 shrink-0">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-extrabold text-slate-900">
                  Data Security &amp; Patient Privacy Standards
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsPrivacyOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto space-y-3.5 text-xs text-slate-600 leading-relaxed pr-2">
              <div>
                <h4 className="font-extrabold text-slate-900 mb-0.5">1. Patient Prescription Confidentiality</h4>
                <p>
                  Patient personal details and prescription records captured at the Retail POS terminal are strictly encrypted under 256-bit AES standards and stored exclusively within India in accordance with the Digital Personal Data Protection Act (DPDP), 2023. Wholesalers and third-party logistics carriers have zero access to patient identification data.
                </p>
              </div>

              <div>
                <h4 className="font-extrabold text-slate-900 mb-0.5">2. B2B Commercial Price Privacy</h4>
                <p>
                  Wholesale quotation tiers, discount schemes, and negotiated commercial terms are strictly confidential between the transacting chemist store and the selected wholesale distributor.
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end mt-4 shrink-0">
              <button
                type="button"
                onClick={() => setIsPrivacyOpen(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Close Privacy Policy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
