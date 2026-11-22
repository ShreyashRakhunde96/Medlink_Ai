'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ShieldCheck,
  ArrowRight,
  UserPlus,
  LogIn,
  Menu,
  X
} from 'lucide-react';

interface HeaderProps {
  currentRole?: string;
  title?: string;
}

export default function Header({ currentRole, title }: HeaderProps) {
  const pathname = usePathname();
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Check backend health
    const host = typeof window !== 'undefined' ? (window.location.hostname || 'localhost') : 'localhost';
    fetch(`http://${host}:5000/api/health`)
      .then((res) => res.json())
      .then((data) => setApiOnline(data.status === 'UP'))
      .catch(() => setApiOnline(false));
  }, []);

  const navLinks = [
    { href: '/#about', label: 'About Us' },
    { href: '/#products', label: 'Products & Platform' },
    { href: '/#network', label: 'Distribution Network' },
    { href: '/#contact', label: 'Contact Us' },
  ];

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/90 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Brand Mark */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-base shadow-xs group-hover:bg-[#00875a] transition">
                M
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-slate-900 tracking-tight text-base leading-none">
                  MedLink <span className="text-[#00875a]">Network</span>
                </span>
                <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold mt-1">
                  B2B Pharma Distribution
                </span>
              </div>
            </Link>

            {/* Navigation Tabs (Informative & Clean: About, Products, Network, Contact) */}
            <nav className="hidden md:flex items-center space-x-1 pl-4 border-l border-slate-200">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      isActive
                        ? 'bg-slate-100 text-slate-900'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Controls: Network Health, Login, and Primary Register CTA */}
          <div className="flex items-center gap-3">
            {/* System Health Pill */}
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 border border-slate-200/80 rounded-lg text-[11px] font-semibold text-slate-600">
              <span
                className={`w-2 h-2 rounded-full ${
                  apiOnline === true ? 'bg-emerald-500 animate-pulse' : apiOnline === false ? 'bg-rose-500' : 'bg-amber-400'
                }`}
              />
              <span>{apiOnline === true ? 'B2B Network Online' : apiOnline === false ? 'Standby Mode' : 'Connecting...'}</span>
            </div>

            {/* Simple Portal Login */}
            <Link
              href="/login"
              className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <LogIn className="w-3.5 h-3.5 text-slate-500" />
              <span>Login</span>
            </Link>

            {/* Primary Register CTA */}
            <a
              href="/#register"
              className="px-4 py-2 rounded-xl bg-[#00875a] hover:bg-[#007048] text-white text-xs font-extrabold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Register</span>
            </a>

            {/* Mobile Hamburger Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-3 px-2 border-t border-slate-100 bg-white space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-2 border-t border-slate-100 flex gap-2">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex-1 text-center py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-700"
              >
                Login
              </Link>
              <a
                href="/#register"
                onClick={() => setMobileMenuOpen(false)}
                className="flex-1 text-center py-2 bg-[#00875a] text-white rounded-lg text-xs font-bold"
              >
                Register
              </a>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
