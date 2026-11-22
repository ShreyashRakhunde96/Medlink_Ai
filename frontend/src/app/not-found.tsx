import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-slate-900 font-sans">
      <div className="bg-white border border-slate-200 rounded-xl p-8 max-w-md w-full text-center shadow-xs">
        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-600 font-bold text-sm">
          404
        </div>
        <h2 className="text-base font-bold text-slate-900 mb-1">Page Not Found</h2>
        <p className="text-xs text-slate-500 mb-5">
          The requested route does not exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-flex px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium transition"
        >
          Return to Portal Hub
        </Link>
      </div>
    </div>
  );
}

