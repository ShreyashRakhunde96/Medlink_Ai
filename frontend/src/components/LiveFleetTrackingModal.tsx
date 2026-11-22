'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Truck,
  Phone,
  ShieldCheck,
  MapPin,
  Clock,
  Activity,
  Thermometer,
  KeyRound,
  CheckCircle2,
  Navigation,
  Compass,
  Radio,
} from 'lucide-react';

interface LiveFleetTrackingModalProps {
  order: any;
  onClose: () => void;
}

export const LiveFleetTrackingModal: React.FC<LiveFleetTrackingModalProps> = ({ order, onClose }) => {
  const [transitProgress, setTransitProgress] = useState(65); // percentage along route
  const [liveTemp, setLiveTemp] = useState(3.8);

  // Animate transit slightly every few seconds to simulate live motion
  useEffect(() => {
    const timer = setInterval(() => {
      setTransitProgress((prev) => (prev < 92 ? prev + 0.5 : 92));
      setLiveTemp((prev) => parseFloat((3.7 + Math.sin(Date.now() / 5000) * 0.3).toFixed(1)));
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  if (!order) return null;

  const dName = order.distributorName || 'MedVantage Pharma Logistics';

  // Master Depots
  const DEPOT_REGISTRY: Record<string, { name: string; address: string; city: string; pin: string; lat: number; lon: number }> = {
    'dist-01': { name: 'MedVantage Pharma Logistics', address: 'Bhiwandi Central Pharma Hub, Unit 14-18, Mankoli', city: 'Thane', pin: '421302', lat: 19.2967, lon: 73.0631 },
    'dist-02': { name: 'Apex Global Health Distributors', address: 'Kurla West Logistics Park, LBS Marg', city: 'Mumbai', pin: '400070', lat: 19.0728, lon: 72.8826 },
    'dist-03': { name: 'PulseLife Distribution Network', address: 'MIDC Phase II Pharma Complex, Chakan', city: 'Pune', pin: '410501', lat: 18.7606, lon: 73.8636 },
    'dist-04': { name: 'SunRise Healthcare Wholesalers', address: 'Warehouse Hub, Sector 8, Rabale', city: 'Navi Mumbai', pin: '400701', lat: 19.1363, lon: 73.0044 },
    'dist-05': { name: 'BioPharma Cold-Chain Supply', address: 'Bio Park, Hinjewadi Phase 1', city: 'Pune', pin: '411057', lat: 18.5913, lon: 73.7389 },
  };

  let depot = Object.values(DEPOT_REGISTRY).find(
    (d) => d.name.toLowerCase() === dName.toLowerCase() || dName.toLowerCase().includes(d.name.toLowerCase())
  );
  if (!depot) {
    depot = DEPOT_REGISTRY[order.distributorId] || DEPOT_REGISTRY['dist-01'];
  }

  // Destination Store Details
  const destName = order.medicalStoreName || 'Apollo Care Pharmacy';
  const destAddress = order.medicalStoreAddress || 'Shop 4, Market Yard, Kalamba Lake';
  const destCity = order.medicalStoreCity || 'Kolhapur';
  const destPin = order.medicalStorePincode || '416006';

  // Distance computation
  const baseDistance = 320; // km
  const isDelivered = order.status === 'DELIVERED';
  const isDispatched = order.status === 'DISPATCHED';
  const isConfirmed = order.status === 'CONFIRMED';

  const remainingKm = isDelivered ? 0 : isDispatched ? Math.max(4.2, parseFloat((baseDistance * (1 - transitProgress / 100)).toFixed(1))) : baseDistance;
  const etaMins = isDelivered
    ? 'Delivered at Pharmacy'
    : isDispatched
    ? `~${Math.round(remainingKm * 1.5)} mins remaining`
    : '~5.5 hrs ETA (Scheduled)';

  // Driver details
  const driverMap: Record<string, { name: string; phone: string; van: string }> = {
    'MedVantage Pharma Logistics': { name: 'Santosh Shinde', phone: '+91 98209 11442', van: 'MH-04-AX-9912 · Reefer Van' },
    'Apex Global Health Distributors': { name: 'Ramesh Varma', phone: '+91 98205 66778', van: 'MH-02-BQ-3481 · Express Courier' },
    'PulseLife Distribution Network': { name: 'Sachin More', phone: '+91 98334 11229', van: 'MH-14-GH-7822 · Heavy Freight Van' },
    'SunRise Healthcare Wholesalers': { name: 'Mahesh Patil', phone: '+91 98218 99001', van: 'MH-43-AK-5520 · Temperature Van' },
    'BioPharma Cold-Chain Supply': { name: 'Nilesh Kadam', phone: '+91 98221 44550', van: 'MH-12-QZ-4819 · Biologics Reefer' },
  };
  const driver = driverMap[depot.name] || driverMap['MedVantage Pharma Logistics'];

  // Generated Delivery OTP
  const numSuffix = (order.orderNumber || order.id || '8451').replace(/[^0-9]/g, '');
  const deliveryOtp = (parseInt(numSuffix.slice(-4) || '4821', 10) % 9000 + 1000).toString();

  // Position of van on SVG curve
  // Route from (40, 160) to (560, 40)
  const truckX = isDelivered ? 560 : 40 + (transitProgress / 100) * 520;
  const truckY = isDelivered ? 40 : 160 - Math.sin((transitProgress / 100) * Math.PI) * 50 - (transitProgress / 100) * 120;

  return (
    <div
      className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white border border-slate-200 rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold ${
                isDelivered
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : isDispatched
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'bg-purple-500/20 text-purple-400'
              }`}
            >
              <Truck className={`w-5 h-5 ${isDispatched ? 'animate-bounce' : ''}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                    isDelivered
                      ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700'
                      : isDispatched
                      ? 'bg-blue-900/60 text-blue-300 border border-blue-700'
                      : 'bg-purple-900/60 text-purple-300 border border-purple-700'
                  }`}
                >
                  {isDelivered
                    ? 'DELIVERED AT PHARMACY'
                    : isDispatched
                    ? 'LIVE GPS IN TRANSIT'
                    : isConfirmed
                    ? 'BATCH PACKED & SEALED'
                    : 'AWAITING DISPATCH'}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  Order #{order.orderNumber}
                </span>
              </div>
              <h2 className="text-base font-extrabold text-white mt-0.5">
                {order.medicineName} · {order.quantity} units
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Interactive Visual Route Map Illustration */}
        <div className="relative bg-slate-950 p-4 border-b border-slate-800 overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-[11px] font-mono text-emerald-400 font-bold uppercase tracking-wider">
                Live GPS Transit Corridor (NH-48 Golden Quadrilateral)
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              AWB: {order.trackingNumber || `AWB-MED-${numSuffix.slice(-5) || '98214'}`}
            </span>
          </div>

          {/* SVG Map Canvas */}
          <div className="relative w-full h-44 bg-slate-900/90 rounded-2xl border border-slate-800 p-2 overflow-hidden flex items-center justify-center">
            {/* Grid Pattern */}
            <svg className="absolute inset-0 w-full h-full opacity-15" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
                  <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#38bdf8" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>

            {/* SVG Highway Route */}
            <svg viewBox="0 0 600 200" className="w-full h-full relative z-10">
              <defs>
                <linearGradient id="routeGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="50%" stopColor="#38bdf8" />
                  <stop offset="100%" stopColor="#818cf8" />
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>

              {/* Background Route Path */}
              <path
                d="M 40 160 Q 200 110, 320 120 T 560 40"
                fill="none"
                stroke="#334155"
                strokeWidth="6"
                strokeLinecap="round"
              />

              {/* Active Route Path */}
              <path
                d="M 40 160 Q 200 110, 320 120 T 560 40"
                fill="none"
                stroke="url(#routeGrad)"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray="8 4"
                className="animate-pulse"
              />

              {/* Origin Point (Warehouse Depot) */}
              <circle cx="40" cy="160" r="8" fill="#10b981" filter="url(#glow)" />
              <circle cx="40" cy="160" r="4" fill="#ffffff" />
              <text x="40" y="185" fill="#94a3b8" fontSize="10" fontWeight="bold" textAnchor="middle">
                {depot.city} Depot
              </text>

              {/* Waypoint: Toll Checkpoint */}
              <circle cx="200" cy="125" r="4" fill="#38bdf8" />
              <text x="200" y="112" fill="#64748b" fontSize="8" textAnchor="middle">
                Expressway Toll
              </text>

              {/* Waypoint: Transit Hub */}
              <circle cx="360" cy="100" r="4" fill="#38bdf8" />
              <text x="360" y="88" fill="#64748b" fontSize="8" textAnchor="middle">
                Pune Bypass
              </text>

              {/* Destination Point (Chemist Store) */}
              <circle cx="560" cy="40" r="8" fill="#ec4899" filter="url(#glow)" />
              <circle cx="560" cy="40" r="4" fill="#ffffff" />
              <text x="545" y="25" fill="#f472b6" fontSize="10" fontWeight="bold" textAnchor="middle">
                {destCity} Store
              </text>

              {/* Moving Delivery Truck Marker */}
              {isDispatched && (
                <g transform={`translate(${truckX}, ${truckY})`}>
                  {/* Radar wave */}
                  <circle cx="0" cy="0" r="14" fill="#38bdf8" opacity="0.3" className="animate-ping" />
                  <circle cx="0" cy="0" r="10" fill="#0284c7" />
                  <circle cx="0" cy="0" r="4" fill="#ffffff" />
                  <text x="0" y="-14" fill="#38bdf8" fontSize="9" fontWeight="bold" textAnchor="middle">
                    VAN (Live)
                  </text>
                </g>
              )}
            </svg>
          </div>
        </div>

        {/* Telemetry HUD */}
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3">
              <span className="text-[10px] text-slate-400 block uppercase font-bold">Speed & Status</span>
              <span className="font-extrabold font-mono text-slate-900 text-sm">
                {isDelivered ? '0 km/h (Arrived)' : isDispatched ? '54 km/h' : 'Depot Staged'}
              </span>
              <span className="text-[10px] text-emerald-600 font-bold block mt-0.5">
                {isDelivered ? '✓ Completed' : isDispatched ? '● Highway Active' : '● Packing'}
              </span>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3">
              <span className="text-[10px] text-slate-400 block uppercase font-bold">Remaining Dist.</span>
              <span className="font-extrabold font-mono text-slate-900 text-sm">
                {remainingKm} km
              </span>
              <span className="text-[10px] text-slate-500 font-medium block mt-0.5">{etaMins}</span>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3">
              <span className="text-[10px] text-slate-400 block uppercase font-bold">Cold-Chain IoT</span>
              <span className="font-extrabold font-mono text-blue-700 text-sm flex items-center gap-1">
                <Thermometer className="w-3.5 h-3.5 text-blue-500" />
                <span>{liveTemp}°C</span>
              </span>
              <span className="text-[10px] text-blue-600 font-bold block mt-0.5">Safe (2°C–8°C)</span>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3">
              <span className="text-[10px] text-slate-400 block uppercase font-bold">Delivery OTP</span>
              <span className="font-extrabold font-mono text-emerald-700 text-sm flex items-center gap-1">
                <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
                <span>{deliveryOtp}</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono block mt-0.5">Handover code</span>
            </div>
          </div>

          {/* Driver Card */}
          <div className="bg-blue-50/60 border border-blue-200/80 rounded-2xl p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold text-sm flex items-center justify-center shrink-0">
                {driver.name[0]}
              </div>
              <div>
                <span className="font-extrabold text-sm text-slate-900 block leading-tight">
                  {driver.name}
                </span>
                <span className="text-xs text-slate-600 font-medium">
                  {driver.van} · {depot.name}
                </span>
              </div>
            </div>
            <a
              href={`tel:${driver.phone}`}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>{driver.phone}</span>
            </a>
          </div>

          {/* Stepper Milestones */}
          <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50">
            <span className="text-xs font-bold text-slate-700 block mb-3 uppercase tracking-wider">
              Transit Milestones
            </span>
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div className="space-y-1">
                <div className="w-7 h-7 rounded-full bg-emerald-500 text-white mx-auto flex items-center justify-center font-bold text-xs">
                  ✓
                </div>
                <span className="font-extrabold text-slate-900 block text-[11px]">PO Placed</span>
                <span className="text-[9.5px] text-slate-400">Verified</span>
              </div>

              <div className="space-y-1">
                <div className={`w-7 h-7 rounded-full mx-auto flex items-center justify-center font-bold text-xs ${isConfirmed || isDispatched || isDelivered ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                  {isConfirmed || isDispatched || isDelivered ? '✓' : '2'}
                </div>
                <span className="font-extrabold text-slate-900 block text-[11px]">Batch QA Seal</span>
                <span className="text-[9.5px] text-slate-400">Inspected</span>
              </div>

              <div className="space-y-1">
                <div className={`w-7 h-7 rounded-full mx-auto flex items-center justify-center font-bold text-xs ${isDispatched || isDelivered ? 'bg-blue-600 text-white animate-pulse' : 'bg-slate-200 text-slate-400'}`}>
                  {isDelivered ? '✓' : isDispatched ? '●' : '3'}
                </div>
                <span className="font-extrabold text-slate-900 block text-[11px]">In Transit</span>
                <span className="text-[9.5px] text-blue-600 font-bold">{isDispatched ? 'Active' : 'Staged'}</span>
              </div>

              <div className="space-y-1">
                <div className={`w-7 h-7 rounded-full mx-auto flex items-center justify-center font-bold text-xs ${isDelivered ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                  {isDelivered ? '✓' : '4'}
                </div>
                <span className="font-extrabold text-slate-900 block text-[11px]">Delivered</span>
                <span className="text-[9.5px] text-slate-400">{isDelivered ? 'Signed' : 'Pending'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex items-center justify-between text-xs">
          <span className="text-[11px] text-slate-500 flex items-center gap-1.5 font-mono">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>WHO-GDP Pharma Transport Certified · Data Loggers Active</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold cursor-pointer transition text-xs"
          >
            Close Tracker
          </button>
        </div>
      </div>
    </div>
  );
};

