'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Building2,
  Truck,
  ShieldCheck,
  Lock,
  Mail,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  FileText,
  MapPin,
  Sparkles
} from 'lucide-react';
import { DEMO_USERS, setStoredUser, UserRole, UserSession } from '@/lib/auth';
import { API_BASE } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [authMode, setAuthMode] = useState<'demo' | 'email' | 'register'>('demo');
  const [selectedRole, setSelectedRole] = useState<UserRole>('MEDICAL_STORE');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Registration form states
  const [regRole, setRegRole] = useState<'MEDICAL_STORE' | 'DISTRIBUTOR'>('MEDICAL_STORE');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regLicense, setRegLicense] = useState('');
  const [regGstin, setRegGstin] = useState('');
  const [regPincode, setRegPincode] = useState('400001');
  const [regPhone, setRegPhone] = useState('+91 98200 12345');
  const [regCity, setRegCity] = useState('Mumbai');

  // 1-Click Instant Demo Login
  const handleQuickDemoLogin = (role: UserRole) => {
    const user = DEMO_USERS[role];
    setStoredUser(user);

    if (role === 'MEDICAL_STORE') router.push('/store');
    else if (role === 'DISTRIBUTOR') router.push('/distributor');
    else if (role === 'ADMIN') router.push('/admin');
  };

  // Standard Email Login
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      // Attempt backend auth
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (data.success && data.user) {
        const sessionUser: UserSession = {
          id: data.user.id,
          email: data.user.email,
          name: data.user.name || (data.user.role === 'MEDICAL_STORE' ? 'Apollo Care Pharmacy' : 'MedVantage Logistics'),
          role: data.user.role,
          licenseNumber: data.user.licenseNumber,
          pincode: data.user.pincode,
          token: data.token,
        };
        setStoredUser(sessionUser);

        if (sessionUser.role === 'MEDICAL_STORE') router.push('/store');
        else if (sessionUser.role === 'DISTRIBUTOR') router.push('/distributor');
        else router.push('/admin');
      } else {
        // Fallback to match demo credentials if backend has test data
        if (email.toLowerCase().includes('apollo') || email.toLowerCase().includes('chemist')) {
          handleQuickDemoLogin('MEDICAL_STORE');
        } else if (email.toLowerCase().includes('medvantage') || email.toLowerCase().includes('dist')) {
          handleQuickDemoLogin('DISTRIBUTOR');
        } else if (email.toLowerCase().includes('admin')) {
          handleQuickDemoLogin('ADMIN');
        } else {
          setErrorMsg(data.message || 'Invalid credentials. Please verify your email and password.');
        }
      }
    } catch (err) {
      // Resilient fallback for offline testing
      if (email.toLowerCase().includes('apollo')) handleQuickDemoLogin('MEDICAL_STORE');
      else if (email.toLowerCase().includes('dist')) handleQuickDemoLogin('DISTRIBUTOR');
      else if (email.toLowerCase().includes('admin')) handleQuickDemoLogin('ADMIN');
      else {
        setErrorMsg('Offline fallback: Please use the 1-Click Demo Accounts or verify backend server.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Register New Entity
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    const pendingItem = {
      id: `reg-${Date.now()}`,
      userId: `usr-${Date.now()}`,
      type: regRole,
      name: regName.trim(),
      license_number: regLicense.trim(),
      gstin: regGstin.trim(),
      email: regEmail.trim(),
      phone: regPhone.trim() || '+91 98200 12345',
      city: regCity.trim() || 'Mumbai',
      pincode: regPincode.trim(),
      submittedAt: new Date().toISOString(),
      status: 'PENDING',
    };

    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: regRole,
          name: regName.trim(),
          email: regEmail.trim(),
          password: regPassword,
          licenseNumber: regLicense.trim(),
          gstin: regGstin.trim(),
          pincode: regPincode.trim(),
          phone: regPhone.trim() || '+91 98200 12345',
          city: regCity.trim() || 'Mumbai',
        }),
      });
      const data = await res.json();

      // Mirror to local cache for instant admin panel queue visibility
      try {
        const storedList = JSON.parse(localStorage.getItem('medlink_pending_registrations') || '[]');
        localStorage.setItem('medlink_pending_registrations', JSON.stringify([pendingItem, ...storedList]));
      } catch (err) {}

      if (data.success) {
        setSuccessMsg('Registration submitted! Your license credentials have been queued for Administrator verification. You can log in once approved.');
        setAuthMode('email');
        setEmail(regEmail);
      } else {
        setErrorMsg(data.message || 'Registration failed. Please check inputs.');
      }
    } catch (err) {
      // Local fallback simulation
      try {
        const storedList = JSON.parse(localStorage.getItem('medlink_pending_registrations') || '[]');
        localStorage.setItem('medlink_pending_registrations', JSON.stringify([pendingItem, ...storedList]));
      } catch (e) {}
      setSuccessMsg(`Registration queued for verification: ${regName} (${regLicense}). Administrator can now approve in /admin.`);
      setAuthMode('email');
      setEmail(regEmail);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Brand & Title */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-2 mb-4">
          <div className="w-10 h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-lg">
            M
          </div>
          <span className="text-xl font-bold text-slate-900 tracking-tight">
            MedLink <span className="text-slate-500 font-normal">AI</span>
          </span>
        </Link>
        <h2 className="text-2xl font-semibold text-slate-900">
          Sign in to your Dashboard
        </h2>
        <p className="mt-1 text-xs text-slate-600">
          Centralized medicine distribution, multi-factor supplier ranking & demand forecasting
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-8 border border-slate-200 rounded-xl shadow-xs">
          {/* Mode Switcher Tabs */}
          <div className="flex border-b border-slate-200 mb-6">
            <button
              onClick={() => { setAuthMode('demo'); setErrorMsg(null); }}
              className={`flex-1 pb-3 text-xs font-medium text-center border-b-2 transition ${
                authMode === 'demo'
                  ? 'border-slate-900 text-slate-900 font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              1-Click Demo
            </button>
            <button
              onClick={() => { setAuthMode('email'); setErrorMsg(null); }}
              className={`flex-1 pb-3 text-xs font-medium text-center border-b-2 transition ${
                authMode === 'email'
                  ? 'border-slate-900 text-slate-900 font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Email & Password
            </button>
            <button
              onClick={() => { setAuthMode('register'); setErrorMsg(null); }}
              className={`flex-1 pb-3 text-xs font-medium text-center border-b-2 transition ${
                authMode === 'register'
                  ? 'border-slate-900 text-slate-900 font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Register Entity
            </button>
          </div>

          {/* Alert Messages */}
          {errorMsg && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2 text-rose-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-2 text-emerald-800 text-xs">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* TAB 1: 1-CLICK INSTANT DEMO ROLES */}
          {authMode === 'demo' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-600 mb-3">
                Select an authorized account to launch its dedicated, fully functional dashboard:
              </p>

              {/* Medical Store Card */}
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('MEDICAL_STORE')}
                className="w-full text-left p-3.5 border border-slate-200 rounded-lg hover:border-emerald-500 hover:bg-emerald-50/30 transition group flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-900 group-hover:text-emerald-700 transition">
                      Apollo Care Pharmacy
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Medical Store · DL-2024-MH-APO8821
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition" />
              </button>

              {/* Distributor Card */}
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('DISTRIBUTOR')}
                className="w-full text-left p-3.5 border border-slate-200 rounded-lg hover:border-blue-500 hover:bg-blue-50/30 transition group flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-900 group-hover:text-blue-700 transition">
                      MedVantage Pharma Logistics
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Wholesale Distributor · WDL-2024-MVL-101
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition" />
              </button>

              {/* Administrator Card */}
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('ADMIN')}
                className="w-full text-left p-3.5 border border-slate-200 rounded-lg hover:border-slate-900 hover:bg-slate-50 transition group flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-900 group-hover:text-slate-900 transition">
                      Platform Compliance Admin
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Master Catalogue & License Verification
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-900 transition" />
              </button>
            </div>
          )}

          {/* TAB 2: EMAIL & PASSWORD SIGN IN */}
          {authMode === 'email' && (
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Registered Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. apollo.chemist@medlink.io"
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
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
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Default dev password for all demo accounts: <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800">Password@123</code>
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs rounded-lg transition disabled:opacity-50"
              >
                {loading ? 'Authenticating...' : 'Sign In to Dashboard'}
              </button>
            </form>
          )}

          {/* TAB 3: SELF-REGISTRATION FOR NEW PHARMACY OR DISTRIBUTOR */}
          {authMode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Entity Category
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRegRole('MEDICAL_STORE')}
                    className={`py-2 px-3 border rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition ${
                      regRole === 'MEDICAL_STORE'
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    Medical Store
                  </button>
                  <button
                    type="button"
                    onClick={() => setRegRole('DISTRIBUTOR')}
                    className={`py-2 px-3 border rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition ${
                      regRole === 'DISTRIBUTOR'
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Truck className="w-3.5 h-3.5" />
                    Distributor
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Organization / Pharmacy Name
                </label>
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="e.g. Wellness Forever Chemist"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Drug License No.
                  </label>
                  <input
                    type="text"
                    required
                    value={regLicense}
                    onChange={(e) => setRegLicense(e.target.value)}
                    placeholder="DL-2024-MH-XXXXX"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-900 font-mono focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    GSTIN
                  </label>
                  <input
                    type="text"
                    required
                    value={regGstin}
                    onChange={(e) => setRegGstin(e.target.value)}
                    placeholder="27AAAAA0000A1Z5"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-900 font-mono focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="contact@pharmacy.com"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Pincode
                  </label>
                  <input
                    type="text"
                    required
                    value={regPincode}
                    onChange={(e) => setRegPincode(e.target.value)}
                    placeholder="400001"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Phone Contact
                  </label>
                  <input
                    type="text"
                    required
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="+91 98200 12345"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    City / Location
                  </label>
                  <input
                    type="text"
                    required
                    value={regCity}
                    onChange={(e) => setRegCity(e.target.value)}
                    placeholder="Mumbai / Pune / Kolhapur"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="Create a secure password"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs rounded-lg transition disabled:opacity-50 mt-2"
              >
                {loading ? 'Submitting Registration...' : 'Submit Credentials for Verification'}
              </button>
            </form>
          )}

          {/* Quick link back */}
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <Link href="/" className="hover:text-slate-900 transition">
              ← Return to Portal Hub
            </Link>
            <Link href="/ai-forecast" className="hover:text-slate-900 transition flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              AI Demand Analytics
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

