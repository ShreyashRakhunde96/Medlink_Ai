export type UserRole = 'MEDICAL_STORE' | 'DISTRIBUTOR' | 'ADMIN';

export interface UserSession {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  licenseNumber?: string;
  gstin?: string;
  pincode?: string;
  phone?: string;
  pharmacistName?: string;
  city?: string;
  state?: string;
  address?: string;
  token?: string;
  isTerminal?: boolean;
  terminalCode?: string;
  terminalName?: string;
  operatorName?: string;
  username?: string;
}

export const DEMO_USERS: Record<string, UserSession> = {
  MEDICAL_STORE: {
    id: 'usr-store-01',
    email: 'apollo.chemist@medlink.io',
    name: 'Apollo Care Pharmacy',
    role: 'MEDICAL_STORE',
    licenseNumber: 'DL-2024-MH-APO8821',
    gstin: '27AABCA1234F1Z8',
    pincode: '400001',
    address: 'Shop 4, Colaba Causeway, Fort, Mumbai 400001',
    token: 'jwt_mock_token_store_123',
    isTerminal: false,
    terminalCode: 'COUNTER-01',
    operatorName: 'Yashodip (Store Owner)',
    pharmacistName: 'Yashodip',
  },
  TERMINAL_2: {
    id: 'term-apollo-02',
    email: 'terminal2@apollocare.com',
    name: 'Apollo Care Pharmacy',
    role: 'MEDICAL_STORE',
    isTerminal: true,
    terminalCode: 'COUNTER-02',
    terminalName: 'Billing Counter #2 (Express Counter)',
    operatorName: 'Suresh Kadam (Cashier)',
    username: 'terminal2',
    licenseNumber: 'DL-2024-MH-APO8821',
    pincode: '400001',
    address: 'Shop 4, Colaba Causeway, Fort, Mumbai 400001',
    token: 'jwt_mock_token_terminal_02',
  },
  TERMINAL_3: {
    id: 'term-apollo-03',
    email: 'terminal3@apollocare.com',
    name: 'Apollo Care Pharmacy',
    role: 'MEDICAL_STORE',
    isTerminal: true,
    terminalCode: 'COUNTER-03',
    terminalName: 'Billing Counter #3 (Drive-Through / Night)',
    operatorName: 'Pooja Sharma (Staff Pharmacist)',
    username: 'terminal3',
    licenseNumber: 'DL-2024-MH-APO8821',
    pincode: '400001',
    address: 'Shop 4, Colaba Causeway, Fort, Mumbai 400001',
    token: 'jwt_mock_token_terminal_03',
  },
  DISTRIBUTOR: {
    id: 'usr-dist-01',
    email: 'medvantage.logistics@medlink.io',
    name: 'MedVantage Pharma Logistics',
    role: 'DISTRIBUTOR',
    licenseNumber: 'WDL-2024-MVL-101',
    gstin: '27AABCM9988D1Z9',
    pincode: '421302',
    address: 'Central Logistics Hub, Sector 18, Bhiwandi, Maharashtra 421302',
    token: 'jwt_mock_token_dist_456',
  },
  ADMIN: {
    id: 'usr-admin-01',
    email: 'admin@medlink.io',
    name: 'Yashodip (Platform Compliance Administrator)',
    role: 'ADMIN',
    licenseNumber: 'REG-FDA-MH-2026',
    gstin: '27AAACG0000A1Z5',
    pincode: '400001',
    address: 'MedLink Regulatory HQ, Nariman Point, Mumbai 400021',
    token: 'jwt_mock_token_admin_789',
  },
};

const getRoleStorageKey = (role?: UserRole) => {
  if (role === 'MEDICAL_STORE') return 'medlink_session_store';
  if (role === 'DISTRIBUTOR') return 'medlink_session_distributor';
  if (role === 'ADMIN') return 'medlink_session_admin';
  return 'medlink_active_session';
};

export function getStoredUser(requiredRole?: UserRole): UserSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const key = getRoleStorageKey(requiredRole);
    const raw = localStorage.getItem(key);
    if (raw) {
      const user = JSON.parse(raw);
      if (!requiredRole || user.role === requiredRole) {
        return user;
      }
    }
    // Also check generic active session
    const genericRaw = localStorage.getItem('medlink_active_session');
    if (genericRaw) {
      const user = JSON.parse(genericRaw);
      if (!requiredRole || user.role === requiredRole) {
        return user;
      }
    }
  } catch (e) {
    console.error('Error reading session from localStorage', e);
  }
  return null;
}

export function setStoredUser(user: UserSession): void {
  if (typeof window === 'undefined') return;
  try {
    const roleKey = getRoleStorageKey(user.role);
    localStorage.setItem(roleKey, JSON.stringify(user));
    localStorage.setItem('medlink_active_session', JSON.stringify(user));
  } catch (e) {
    console.error('Error saving session to localStorage', e);
  }
}

export function clearStoredUser(role?: UserRole): void {
  if (typeof window === 'undefined') return;
  try {
    if (role) {
      localStorage.removeItem(getRoleStorageKey(role));
    }
    localStorage.removeItem('medlink_active_session');
  } catch (e) {
    console.error('Error clearing session from localStorage', e);
  }
}

export function loginDemoUser(role: UserRole): UserSession {
  const user = DEMO_USERS[role];
  setStoredUser(user);
  return user;
}
