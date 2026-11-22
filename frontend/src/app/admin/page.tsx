'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileText,
  RefreshCw,
  Check,
  LogOut,
  Lock,
  Mail,
  ArrowRight,
  Store,
  Truck,
  Send,
  Key,
  Copy,
  Search,
  X,
  Phone,
  MapPin,
  Building2,
  UserCheck,
  Ban,
  Clock,
  Plus
} from 'lucide-react';
import { getStoredUser, setStoredUser, clearStoredUser, DEMO_USERS, UserSession } from '@/lib/auth';
import { API_BASE } from '@/lib/api';

export default function AdminDashboard() {
  const [user, setUser] = useState<UserSession | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Login form state if unauthenticated
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);

  // Dashboard state: strictly managing verifications, stores, distributors, and audit
  const [activeTab, setActiveTab] = useState<'verifications' | 'stores' | 'distributors' | 'audit'>('verifications');
  const [pendingVerifications, setPendingVerifications] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [distributors, setDistributors] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Search filters
  const [searchStoreQuery, setSearchStoreQuery] = useState('');
  const [searchDistQuery, setSearchDistQuery] = useState('');

  // Credential Issuance Modal State
  const [credentialModalData, setCredentialModalData] = useState<any | null>(null);
  const [isSendingCredentials, setIsSendingCredentials] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4500);
  };

  useEffect(() => {
    const session = getStoredUser('ADMIN');
    if (session && session.role === 'ADMIN') {
      setUser(session);
    }
    setIsCheckingAuth(false);
    fetchAllData();
  }, []);

  const fetchAllData = () => {
    fetchVerifications();
    fetchStores();
    fetchDistributors();
    fetchAuditLogs();
  };

  const handleQuickLogin = () => {
    const session = DEMO_USERS.ADMIN;
    setStoredUser(session);
    setUser(session);
    setAuthError(null);
  };

  const handleCustomLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        const session: UserSession = {
          id: data.user.id,
          email: data.user.email,
          name: data.user.name || 'Yashodip (Platform Compliance Administrator)',
          role: 'ADMIN',
          licenseNumber: 'REG-FDA-MH-2026',
          pincode: '400001',
          token: data.token,
        };
        setStoredUser(session);
        setUser(session);
      } else {
        if (loginEmail.toLowerCase().includes('admin')) {
          handleQuickLogin();
        } else {
          setAuthError(data.message || 'Invalid administrator credentials.');
        }
      }
    } catch (err) {
      handleQuickLogin();
    }
  };

  const handleLogout = () => {
    clearStoredUser('ADMIN');
    setUser(null);
  };

  const fetchVerifications = async () => {
    let localPending: any[] = [];
    if (typeof window !== 'undefined') {
      try {
        localPending = JSON.parse(localStorage.getItem('medlink_pending_registrations') || '[]');
      } catch (e) {}
    }

    try {
      const res = await fetch(`${API_BASE}/admin/verifications`);
      const data = await res.json();
      const serverPending = data.success ? (data.pending || []) : [];

      // Merge and deduplicate by license_number or id
      const seen = new Set<string>();
      const merged: any[] = [];

      for (const item of [...serverPending, ...localPending]) {
        const key = String(item.license_number || item.licenseNumber || item.id || '').toUpperCase().trim();
        if (key && !seen.has(key)) {
          seen.add(key);
          merged.push(item);
        }
      }

      setPendingVerifications(merged);
    } catch (err) {
      console.error(err);
      if (localPending.length > 0) {
        setPendingVerifications(localPending);
      }
    }
  };

  const handleSeedRegistrationRequest = async (role: 'MEDICAL_STORE' | 'DISTRIBUTOR') => {
    const isChemist = role === 'MEDICAL_STORE';
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const mockPayload = isChemist
      ? {
          role: 'MEDICAL_STORE',
          name: `Kalyani Care Pharmacy #${randomSuffix}`,
          email: `kalyani.${randomSuffix}@medlink.io`,
          password: 'Password@123',
          licenseNumber: `DL-2026-MH-KC${randomSuffix}`,
          gstin: `27AAAKC${randomSuffix}A1Z3`,
          phone: `+91 98200 ${randomSuffix}`,
          city: 'Kolhapur',
          pincode: '416006',
        }
      : {
          role: 'DISTRIBUTOR',
          name: `Sahyadri Pharma Distributors #${randomSuffix}`,
          email: `sahyadri.${randomSuffix}@medlink.io`,
          password: 'Password@123',
          licenseNumber: `WDL-2026-MH-SD${randomSuffix}`,
          gstin: `27AAASD${randomSuffix}A1Z8`,
          phone: `+91 98220 ${randomSuffix}`,
          city: 'Pune',
          pincode: '411001',
        };

    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockPayload),
      });
      const data = await res.json();
      showToast(`✅ New ${isChemist ? 'Chemist' : 'Distributor'} registration request queued!`);
      fetchVerifications();
    } catch (e) {
      showToast('Error seeding registration request.');
    }
  };

  const fetchStores = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/stores`);
      const data = await res.json();
      if (data.success) setStores(data.stores || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDistributors = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/distributors`);
      const data = await res.json();
      if (data.success) setDistributors(data.distributors || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/audit-logs`);
      const data = await res.json();
      if (data.success) setAuditLogs(data.logs || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleVerify = async (item: any, decision: 'APPROVE' | 'REJECT') => {
    setActionLoadingId(item.id);

    // Clean up from local cache if stored there
    if (typeof window !== 'undefined') {
      try {
        const storedList = JSON.parse(localStorage.getItem('medlink_pending_registrations') || '[]');
        const updated = storedList.filter((x: any) =>
          (x.license_number || x.licenseNumber) !== (item.license_number || item.licenseNumber) &&
          x.id !== item.id
        );
        localStorage.setItem('medlink_pending_registrations', JSON.stringify(updated));
      } catch (e) {}
    }

    try {
      const generatedTempPassword = `MedLink@${Math.floor(100000 + Math.random() * 900000)}`;
      const res = await fetch(`${API_BASE}/admin/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: item.id,
          type: item.type,
          decision,
          temporaryPassword: generatedTempPassword,
          reason: decision === 'APPROVE'
            ? 'Regulatory Drug License Form 20/21B and GSTIN verified against FDA State Database.'
            : 'Mismatched drug license number or unverified registered premises.',
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        if (decision === 'APPROVE') {
          // Open the credentials modal so admin can review and dispatch credentials
          setCredentialModalData({
            name: item.name,
            email: item.email || (data.credentials && data.credentials.email) || `${item.name.toLowerCase().replace(/\s+/g, '')}@medlink.io`,
            role: item.type,
            licenseNumber: item.licenseNumber || item.license_number,
            temporaryPassword: (data.credentials && data.credentials.temporaryPassword) || generatedTempPassword,
            phone: item.phone,
            city: item.city,
          });
        }
        fetchAllData();
      } else {
        showToast(data.message || 'Error processing verification.');
      }
    } catch (err) {
      showToast('Error recording verification decision.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleToggleStatus = async (id: string, type: 'MEDICAL_STORE' | 'DISTRIBUTOR', currentStatus: string) => {
    const nextStatus = currentStatus === 'APPROVED' ? 'SUSPENDED' : 'APPROVED';
    try {
      const res = await fetch(`${API_BASE}/admin/entity-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, type, status: nextStatus }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Status updated to ${nextStatus}.`);
        if (type === 'MEDICAL_STORE') fetchStores();
        else fetchDistributors();
        fetchAuditLogs();
      }
    } catch (err) {
      showToast('Error updating status.');
    }
  };

  const handleSendCredentials = async () => {
    if (!credentialModalData) return;
    setIsSendingCredentials(true);
    try {
      const res = await fetch(`${API_BASE}/admin/send-credentials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentialModalData),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`✅ Credentials and authorization certificate sent to ${credentialModalData.email}!`);
        setCredentialModalData(null);
        fetchAuditLogs();
      } else {
        showToast(data.message || 'Failed to dispatch credentials.');
      }
    } catch (err) {
      showToast('Error sending credentials.');
    } finally {
      setIsSendingCredentials(false);
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-xs text-slate-500">
        <RefreshCw className="w-5 h-5 animate-spin mx-auto text-slate-400" />
      </div>
    );
  }

  // =========================================================================
  // AUTH GUARD: DEDICATED ADMIN LOGIN SCREEN
  // =========================================================================
  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans text-slate-900">
        <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
          <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xl mx-auto mb-3 shadow-xs">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">
            Compliance Administrator Login
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Regulatory Drug License Oversight & System Registry
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-6 sm:px-8 border border-slate-200 rounded-xl shadow-xs">
            {/* Quick Demo Login */}
            <div className="mb-6 bg-slate-100 border border-slate-200 rounded-lg p-3.5">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-slate-900">
                  Authorized Admin Profile:
                </span>
                <span className="text-[10px] bg-slate-900 text-white font-mono px-1.5 py-0.5 rounded">
                  Admin
                </span>
              </div>
              <p className="text-[11px] text-slate-600 mb-3">
                Yashodip (Platform Compliance Administrator) · REG-FDA-MH-2026
              </p>
              <button
                type="button"
                onClick={handleQuickLogin}
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-lg transition flex items-center justify-center gap-1.5 shadow-xs"
              >
                <span>1-Click Launch Compliance Console</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {authError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2 text-rose-700 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{authError}</span>
              </div>
            )}

            <form onSubmit={handleCustomLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Administrator Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="admin@medlink.io"
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium transition"
              >
                Sign In to Admin Console
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <Link href="/" className="hover:text-slate-900 transition">
                ← Portal Hub
              </Link>
              <Link href="/login" className="hover:text-slate-900 transition font-medium">
                Choose Another Dashboard →
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // AUTHENTICATED ADMIN DASHBOARD
  // =========================================================================
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      {/* DEDICATED ADMIN TOPBAR (NO OTHER DASHBOARD LINKS) */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <Link href="/admin" className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-base shadow-xs">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-bold text-slate-900 tracking-tight text-base leading-none">
                    MedLink <span className="text-slate-500 font-normal">Compliance</span>
                  </span>
                  <span className="text-[11px] text-slate-500 block">Regulatory Admin Console</span>
                </div>
              </Link>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden sm:flex flex-col text-right text-xs">
                <span className="font-semibold text-slate-900">{user.name}</span>
                <span className="text-[11px] text-slate-500 font-mono">REG-FDA-MH-2026</span>
              </div>

              <Link
                href="/"
                className="px-2.5 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-medium transition"
              >
                Portal Hub
              </Link>

              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 hover:bg-rose-50 hover:text-rose-600 text-slate-700 rounded-lg text-xs font-medium transition"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1">
        {/* Top Control Bar: Admin Identity & System Stats (NO Add Medicine button) */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6 flex flex-wrap justify-between items-center gap-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold text-slate-900">
                  {user.name}
                </h1>
                <span className="text-[10px] bg-slate-100 text-slate-800 border border-slate-200 px-2 py-0.5 rounded font-mono font-medium">
                  Regulatory Governance Console
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                FDA Maharashtra Central Licensing &amp; B2B Entity Authorization Registry
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Metrics */}
            <div className="hidden md:flex items-center gap-2 text-xs">
              <span className="bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-lg font-medium">
                {pendingVerifications.length} Pending Approvals
              </span>
              <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-lg font-medium">
                {stores.length} Retail Stores
              </span>
              <span className="bg-blue-50 text-blue-800 border border-blue-200 px-2.5 py-1 rounded-lg font-medium">
                {distributors.length} Wholesalers
              </span>
            </div>

            <button
              onClick={fetchAllData}
              className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-700 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
              title="Refresh Registry"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Registry</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation: Verifications, Stores, Distributors, Audit */}
        <div className="flex items-center space-x-2 border-b border-slate-200 mb-6">
          <button
            onClick={() => setActiveTab('verifications')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition relative cursor-pointer ${
              activeTab === 'verifications'
                ? 'border-slate-900 text-slate-900 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Registration Requests</span>
            {pendingVerifications.length > 0 && (
              <span className="bg-amber-100 text-amber-800 text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold">
                {pendingVerifications.length} Pending
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('stores')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition cursor-pointer ${
              activeTab === 'stores'
                ? 'border-slate-900 text-slate-900 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Store className="w-4 h-4" />
            <span>Manage Retail Stores</span>
            <span className="bg-slate-100 text-slate-700 text-[10px] font-mono px-1.5 py-0.2 rounded-full">
              {stores.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('distributors')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition cursor-pointer ${
              activeTab === 'distributors'
                ? 'border-slate-900 text-slate-900 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>Manage Wholesale Distributors</span>
            <span className="bg-slate-100 text-slate-700 text-[10px] font-mono px-1.5 py-0.2 rounded-full">
              {distributors.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition cursor-pointer ${
              activeTab === 'audit'
                ? 'border-slate-900 text-slate-900 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Regulatory Audit Trail</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: REGISTRATION & LICENSE VERIFICATIONS                               */}
        {/* ========================================================================= */}
        {activeTab === 'verifications' && (
          <div className="space-y-4">
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-xs font-bold text-slate-900 mb-1">
                  Pending Entity Verification &amp; Credential Issuance Queue
                </h3>
                <p className="text-[11px] text-slate-500">
                  When a Retail Pharmacy or Wholesale Distributor self-registers, their submission is held in regulatory escrow. Admin must verify their Drug License (Form 20/21 or 20B/21B) and GSTIN before authorizing login access and issuing official credentials.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    fetchVerifications();
                    showToast('Refreshed verification queue.');
                  }}
                  className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Refresh Queue</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSeedRegistrationRequest('MEDICAL_STORE')}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  title="Simulate a new incoming Chemist registration"
                >
                  <Plus className="w-3.5 h-3.5 text-emerald-400" />
                  <span>+ Test Chemist Sign-up</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSeedRegistrationRequest('DISTRIBUTOR')}
                  className="px-3 py-1.5 border border-blue-200 bg-blue-50/50 hover:bg-blue-100 text-blue-800 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  title="Simulate a new incoming Distributor registration"
                >
                  <Plus className="w-3.5 h-3.5 text-blue-600" />
                  <span>+ Test Distributor Sign-up</span>
                </button>
              </div>
            </div>

            {pendingVerifications.length === 0 ? (
              <div className="p-12 text-center bg-white border border-slate-200 rounded-xl space-y-3">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                <p className="text-xs font-semibold text-slate-900">Verification Queue is Clear</p>
                <p className="text-[11px] text-slate-500 max-w-md mx-auto">
                  All registered pharmacies and distributors have been reviewed and issued credentials. New sign-ups submitted from the Registration page will automatically appear here.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => handleSeedRegistrationRequest('MEDICAL_STORE')}
                    className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Simulate Incoming Chemist Request</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSeedRegistrationRequest('DISTRIBUTOR')}
                    className="px-3.5 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-blue-600" />
                    <span>Simulate Incoming Distributor Request</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingVerifications.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-xs"
                  >
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">{item.name}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                          item.type === 'MEDICAL_STORE' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {item.type === 'MEDICAL_STORE' ? 'Retail Pharmacy' : 'Wholesale Distributor'}
                        </span>
                        <span className="text-[10px] bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded font-semibold flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>Awaiting FDA Authorization</span>
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-1 text-xs text-slate-600">
                        <div>
                          <span className="text-slate-400">Drug License: </span>
                          <span className="font-mono font-bold text-slate-800">{item.license_number || item.licenseNumber}</span>
                        </div>
                        <div>
                          <span className="text-slate-400">GSTIN: </span>
                          <span className="font-mono font-bold text-slate-800">{item.gstin}</span>
                        </div>
                        <div>
                          <span className="text-slate-400">Email: </span>
                          <span className="font-medium text-slate-800">{item.email}</span>
                        </div>
                        <div>
                          <span className="text-slate-400">Phone: </span>
                          <span className="font-mono text-slate-800">{item.phone || '+91 98200 12345'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400">Location: </span>
                          <span>{item.city || 'Mumbai'}, {item.pincode}</span>
                        </div>
                        <div>
                          <span className="text-slate-400">Submitted: </span>
                          <span className="font-mono">{new Date(item.submittedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                      <button
                        onClick={() => handleVerify(item, 'APPROVE')}
                        disabled={actionLoadingId === item.id}
                        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                      >
                        <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Verify &amp; Issue Credentials</span>
                      </button>

                      <button
                        onClick={() => handleVerify(item, 'REJECT')}
                        disabled={actionLoadingId === item.id}
                        className="px-3 py-2 border border-rose-200 text-rose-700 hover:bg-rose-50 rounded-lg text-xs font-semibold transition cursor-pointer disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: MANAGE RETAIL STORES DIRECTORY                                     */}
        {/* ========================================================================= */}
        {activeTab === 'stores' && (
          <div className="space-y-4">
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-xs font-bold text-slate-900">
                    Registered Retail Pharmacies Directory ({stores.length})
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Retail stores authorized to dispense Schedule H/H1 medicines and procure from certified wholesalers
                  </p>
                </div>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search by store name, license, city..."
                    value={searchStoreQuery}
                    onChange={(e) => setSearchStoreQuery(e.target.value)}
                    className="w-64 pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] uppercase font-semibold">
                      <th className="py-2.5 px-4">Pharmacy &amp; Contact</th>
                      <th className="py-2.5 px-4">Drug License &amp; GSTIN</th>
                      <th className="py-2.5 px-4">Location</th>
                      <th className="py-2.5 px-4 text-center">POS Terminals</th>
                      <th className="py-2.5 px-4 text-center">License Status</th>
                      <th className="py-2.5 px-4 text-right">Admin Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
                    {stores
                      .filter((s) => {
                        if (!searchStoreQuery.trim()) return true;
                        const q = searchStoreQuery.toLowerCase();
                        return (
                          s.name?.toLowerCase().includes(q) ||
                          s.license_number?.toLowerCase().includes(q) ||
                          s.city?.toLowerCase().includes(q) ||
                          s.email?.toLowerCase().includes(q)
                        );
                      })
                      .map((store) => (
                        <tr key={store.id} className="hover:bg-slate-50/70 transition">
                          <td className="py-3 px-4">
                            <span className="font-bold text-slate-900 block">{store.name}</span>
                            <span className="text-[11px] text-slate-500">{store.email}</span>
                            {store.phone && <span className="text-[10px] text-slate-400 block font-mono">{store.phone}</span>}
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-mono text-slate-900 font-semibold block">{store.license_number}</span>
                            <span className="text-[10px] text-slate-400 font-mono">GSTIN: {store.gstin || 'N/A'}</span>
                          </td>
                          <td className="py-3 px-4 text-slate-600">
                            <div>{store.city || 'Maharashtra'}</div>
                            <span className="text-[10px] text-slate-400 font-mono">PIN: {store.pincode}</span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 text-[11px] font-mono font-bold">
                              {store.terminalCount || 1} Desk
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              store.status === 'APPROVED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : store.status === 'PENDING'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}>
                              {store.status === 'APPROVED' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                              <span>{store.status}</span>
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right space-x-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setCredentialModalData({
                                  name: store.name,
                                  email: store.email,
                                  role: 'MEDICAL_STORE',
                                  licenseNumber: store.license_number,
                                  temporaryPassword: `MedLink@${Math.floor(100000 + Math.random() * 900000)}`,
                                  phone: store.phone,
                                  city: store.city,
                                });
                              }}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold transition cursor-pointer"
                              title="View & Re-issue Credentials"
                            >
                              Credentials
                            </button>

                            <button
                              type="button"
                              onClick={() => handleToggleStatus(store.id, 'MEDICAL_STORE', store.status)}
                              className={`px-2.5 py-1 rounded text-xs font-semibold transition cursor-pointer ${
                                store.status === 'APPROVED'
                                  ? 'border border-rose-200 text-rose-700 hover:bg-rose-50'
                                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                              }`}
                            >
                              {store.status === 'APPROVED' ? 'Suspend' : 'Activate'}
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: MANAGE WHOLESALE DISTRIBUTORS DIRECTORY                             */}
        {/* ========================================================================= */}
        {activeTab === 'distributors' && (
          <div className="space-y-4">
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-xs font-bold text-slate-900">
                    Authorized Wholesale Distributors ({distributors.length})
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Pharmaceutical distributors licensed under Form 20B/21B supplying wholesale consignments to retail network
                  </p>
                </div>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search by company name, license, hub..."
                    value={searchDistQuery}
                    onChange={(e) => setSearchDistQuery(e.target.value)}
                    className="w-64 pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] uppercase font-semibold">
                      <th className="py-2.5 px-4">Distributor Company</th>
                      <th className="py-2.5 px-4">Wholesale License &amp; GSTIN</th>
                      <th className="py-2.5 px-4">Logistics Depot Location</th>
                      <th className="py-2.5 px-4 text-center">Status</th>
                      <th className="py-2.5 px-4 text-right">Admin Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
                    {distributors
                      .filter((d) => {
                        if (!searchDistQuery.trim()) return true;
                        const q = searchDistQuery.toLowerCase();
                        return (
                          d.name?.toLowerCase().includes(q) ||
                          d.license_number?.toLowerCase().includes(q) ||
                          d.city?.toLowerCase().includes(q) ||
                          d.email?.toLowerCase().includes(q)
                        );
                      })
                      .map((dist) => (
                        <tr key={dist.id} className="hover:bg-slate-50/70 transition">
                          <td className="py-3 px-4">
                            <span className="font-bold text-slate-900 block">{dist.name}</span>
                            <span className="text-[11px] text-slate-500">{dist.email}</span>
                            {dist.phone && <span className="text-[10px] text-slate-400 block font-mono">{dist.phone}</span>}
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-mono text-slate-900 font-semibold block">{dist.license_number}</span>
                            <span className="text-[10px] text-slate-400 font-mono">GSTIN: {dist.gstin || 'N/A'}</span>
                          </td>
                          <td className="py-3 px-4 text-slate-600">
                            <div>{dist.city || 'Maharashtra'}</div>
                            <span className="text-[10px] text-slate-400 block truncate max-w-xs">{dist.address}</span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              dist.status === 'APPROVED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : dist.status === 'PENDING'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}>
                              {dist.status === 'APPROVED' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                              <span>{dist.status}</span>
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right space-x-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setCredentialModalData({
                                  name: dist.name,
                                  email: dist.email,
                                  role: 'DISTRIBUTOR',
                                  licenseNumber: dist.license_number,
                                  temporaryPassword: `MedLink@${Math.floor(100000 + Math.random() * 900000)}`,
                                  phone: dist.phone,
                                  city: dist.city,
                                });
                              }}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold transition cursor-pointer"
                              title="View & Re-issue Credentials"
                            >
                              Credentials
                            </button>

                            <button
                              type="button"
                              onClick={() => handleToggleStatus(dist.id, 'DISTRIBUTOR', dist.status)}
                              className={`px-2.5 py-1 rounded text-xs font-semibold transition cursor-pointer ${
                                dist.status === 'APPROVED'
                                  ? 'border border-rose-200 text-rose-700 hover:bg-rose-50'
                                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                              }`}
                            >
                              {dist.status === 'APPROVED' ? 'Suspend' : 'Activate'}
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: CHRONOLOGICAL REGULATORY AUDIT TRAIL                               */}
        {/* ========================================================================= */}
        {activeTab === 'audit' && (
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center">
              <div>
                <h3 className="text-xs font-bold text-slate-900">
                  Immutable Regulatory Audit Trail
                </h3>
                <p className="text-[11px] text-slate-500">
                  Chronological tamper-evident audit records of license approvals, credential transmissions, and entity status modifications
                </p>
              </div>
              <button
                onClick={fetchAuditLogs}
                className="px-2.5 py-1 border border-slate-200 hover:bg-slate-50 rounded text-slate-600 text-xs flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Refresh</span>
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {auditLogs.map((log) => (
                <div key={log.id} className="p-3.5 hover:bg-slate-50/70 transition flex items-start justify-between gap-4 text-xs">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-[11px] font-bold text-slate-900">
                        {log.action}
                      </span>
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">
                        {log.actorRole}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Entity: {log.entityName}
                      </span>
                    </div>
                    <p className="text-slate-600 text-xs">{log.details}</p>
                  </div>
                  <span className="text-[11px] text-slate-400 shrink-0 font-mono">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* ========================================================================= */}
      {/* CREDENTIAL ISSUANCE & DISPATCH MODAL                                      */}
      {/* ========================================================================= */}
      {credentialModalData && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-md w-full p-6 text-xs space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    Official Login Credentials Issued
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    FDA Regulatory Certificate &amp; Account Provisioning
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCredentialModalData(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500 font-medium">Authorized Entity:</span>
                <span className="font-bold text-slate-900">{credentialModalData.name}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500 font-medium">Assigned Role:</span>
                <span className="font-mono font-bold text-slate-800 uppercase">{credentialModalData.role}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500 font-medium">Drug License No:</span>
                <span className="font-mono font-bold text-slate-800">{credentialModalData.licenseNumber}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500 font-medium">Login Email:</span>
                <span className="font-mono font-bold text-[#1b64da]">{credentialModalData.email}</span>
              </div>
              <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-200">
                <span className="text-slate-500 font-medium">Temporary Password:</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-black text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {credentialModalData.temporaryPassword}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(credentialModalData.temporaryPassword);
                      showToast('Password copied to clipboard!');
                    }}
                    className="p-1 hover:bg-slate-200 rounded text-slate-500 cursor-pointer"
                    title="Copy Password"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-500">
              Clicking below will dispatch the official credentials package to the owner&apos;s registered email and mobile number via SMS gateway.
            </p>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCredentialModalData(null)}
                className="flex-1 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-bold transition cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleSendCredentials}
                disabled={isSendingCredentials}
                className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSendingCredentials ? 'Dispatching...' : 'Dispatch Credentials'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 bg-slate-900 text-white text-xs px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 z-50 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
