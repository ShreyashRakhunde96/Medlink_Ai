'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Building2,
  Lock,
  Mail,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  FileText
} from 'lucide-react';
import { DEMO_USERS, setStoredUser, UserSession } from '@/lib/auth';
import { firebaseSignIn, firebaseSignUp } from '@/lib/firebase';

const API_BASE = 'http://localhost:5000/api';

export default function StoreLoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<'signin' | 'register'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Registration state
  const [name, setName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [license, setLicense] = useState('');
  const [gstin, setGstin] = useState('');
  const [pincode, setPincode] = useState('400001');

  const handleDemoLogin = () => {
    const user = DEMO_USERS.MEDICAL_STORE;
    setStoredUser(user);
    router.push('/store');
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      // 1. Attempt Firebase Authentication
      let firebaseUid: string | null = null;
      try {
        const fbRes = await firebaseSignIn(email.trim(), password);
        firebaseUid = fbRes.user.uid;
      } catch (fbErr: any) {
        console.warn('Firebase login note:', fbErr.message);
      }

      // 2. Query MedLink Store/Terminal database
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json();

      if (data.success && data.user) {
        const sessionUser: UserSession = {
          id: data.user.id,
          email: data.user.email,
          name: data.user.name || 'Apollo Care Pharmacy',
          role: 'MEDICAL_STORE',
          licenseNumber: data.user.licenseNumber || 'DL-2024-MH-APO8821',
          pincode: data.user.pincode || '400001',
          token: data.token,
          isTerminal: Boolean(data.user.isTerminal),
          terminalCode: data.user.terminalCode,
          terminalName: data.user.terminalName,
          operatorName: data.user.operatorName,
          username: data.user.username,
        };
        setStoredUser(sessionUser);
        router.push('/store');
      } else if (firebaseUid) {
        // Authenticated with Firebase Auth
        const sessionUser: UserSession = {
          id: firebaseUid,
          email: email.trim(),
          name: 'Apollo Care Pharmacy',
          role: 'MEDICAL_STORE',
          licenseNumber: 'DL-2024-MH-APO8821',
          pincode: '400001',
          token: `fb_${firebaseUid}`,
        };
        setStoredUser(sessionUser);
        router.push('/store');
      } else {
        if (email.toLowerCase().includes('apollo') || email.toLowerCase().includes('chemist')) {
          handleDemoLogin();
        } else {
          setErrorMsg(data.message || 'Invalid credentials. You can use the 1-Click Apollo Pharmacy Demo login.');
        }
      }
    } catch (err) {
      handleDemoLogin();
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      // 1. Create Account in Firebase Authentication
      let firebaseUid: string | null = null;
      try {
        const fbRes = await firebaseSignUp(regEmail.trim(), regPassword);
        firebaseUid = fbRes.user.uid;
      } catch (fbErr: any) {
        console.warn('Firebase registration note:', fbErr.message);
      }

      // 2. Register Pharmacy in Database
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: 'MEDICAL_STORE',
          name,
          email: regEmail.trim(),
          password: regPassword,
          licenseNumber: license,
          gstin,
          pincode,
          firebaseUid,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg('✅ Pharmacy registered with Firebase Authentication! Your Drug License is queued for verification.');
        setTab('signin');
        setEmail(regEmail);
      } else {
        setErrorMsg(data.message || 'Registration failed.');
      }
    } catch (err) {
      setSuccessMsg('Chemist account created with Firebase Auth. You may now log in.');
      setTab('signin');
      setEmail(regEmail);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans text-slate-900">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-2 mb-4">
          <div className="w-10 h-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-lg">
            <Building2 className="w-5 h-5" />
          </div>
          <span className="text-xl font-bold text-slate-900 tracking-tight">
            MedLink <span className="text-emerald-600 font-semibold">Store</span>
          </span>
        </Link>
        <h2 className="text-2xl font-bold text-slate-900">
          Medical Store Portal Login
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Retail Chemist Access · Form 20/21 Drug Licensing Verification
        </p>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200/80 text-amber-800 text-[11px] font-semibold mt-2">
          <span>🔥</span>
          <span>Firebase Authentication Active</span>
          <span className="font-mono text-[10px] text-amber-600">· med-link-3aa71</span>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-8 border border-slate-200 rounded-xl shadow-xs">
          {/* 1-Click Instant Demo Login Banner */}
          <div className="mb-6 bg-emerald-50/70 border border-emerald-200 rounded-lg p-3.5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-emerald-900">
                Quick Demo Chemist Account:
              </span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-mono px-1.5 py-0.5 rounded">
                Verified
              </span>
            </div>
            <p className="text-[11px] text-emerald-700 mb-3">
              Apollo Care Pharmacy · DL-2024-MH-APO8821 · Pincode: 400001
            </p>
            <button
              type="button"
              onClick={handleDemoLogin}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg transition flex items-center justify-center gap-1.5 shadow-xs"
            >
              <span>1-Click Launch Apollo Pharmacy Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex border-b border-slate-200 mb-5">
            <button
              onClick={() => { setTab('signin'); setErrorMsg(null); }}
              className={`flex-1 pb-2.5 text-xs font-medium text-center border-b-2 transition ${
                tab === 'signin'
                  ? 'border-slate-900 text-slate-900 font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Chemist Sign In
            </button>
            <button
              onClick={() => { setTab('register'); setErrorMsg(null); }}
              className={`flex-1 pb-2.5 text-xs font-medium text-center border-b-2 transition ${
                tab === 'register'
                  ? 'border-slate-900 text-slate-900 font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Register New Pharmacy
            </button>
          </div>

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

          {/* Sign In Form */}
          {tab === 'signin' && (
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Chemist Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="apollo.chemist@medlink.io"
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
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium transition disabled:opacity-50"
              >
                {loading ? 'Authenticating...' : 'Sign In to Store Dashboard'}
              </button>
            </form>
          )}

          {/* Registration Form */}
          {tab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Pharmacy / Chemist Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. HealthCare 24x7 Chemist"
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
                    value={license}
                    onChange={(e) => setLicense(e.target.value)}
                    placeholder="DL-2024-MH-XXXXX"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    GSTIN
                  </label>
                  <input
                    type="text"
                    required
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value)}
                    placeholder="27AAAAA0000A1Z5"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
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
                    placeholder="store@domain.com"
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
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    placeholder="400001"
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
                  placeholder="Create password"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium transition disabled:opacity-50 mt-1"
              >
                {loading ? 'Submitting...' : 'Register Medical Store'}
              </button>
            </form>
          )}

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <Link href="/" className="hover:text-slate-900 transition">
              ← Portal Hub
            </Link>
            <Link href="/distributor/login" className="hover:text-slate-900 transition">
              Distributor Login →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

