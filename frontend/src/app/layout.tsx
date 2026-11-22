import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'MedLink AI — Centralized Medicine Distribution & Intelligent Inventory Platform',
  description: 'Enterprise pharmaceutical B2B network connecting medical stores, distributors, and administrators with explainable AI supplier recommendations and demand forecasting.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
