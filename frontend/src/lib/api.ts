/**
 * Centralized API configuration for MedLink
 * Supports local development and production deployments (e.g., Render, Railway, Vercel)
 */

export const getApiBase = (): string => {
  // 1. Prioritize environment variable (configured in Vercel / .env.production / .env.local)
  if (process.env.NEXT_PUBLIC_API_URL) {
    const trimmed = process.env.NEXT_PUBLIC_API_URL.trim().replace(/\/+$/, '');
    return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
  }

  // 2. Client-side browser hostname detection (useful on local network / wifi)
  if (typeof window !== 'undefined') {
    const host = window.location.hostname || 'localhost';
    if (host !== 'localhost' && host !== '127.0.0.1') {
      return `http://${host}:5000/api`;
    }
  }

  // 3. Default fallback
  return 'http://localhost:5000/api';
};

export const API_BASE = getApiBase();

