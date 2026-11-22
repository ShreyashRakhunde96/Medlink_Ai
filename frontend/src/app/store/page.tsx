'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Building2,
  Search,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  X,
  ArrowRight,
  AlertCircle,
  Truck,
  MapPin,
  Filter,
  FileText,
  Printer,
  Package,
  AlertTriangle,
  LogOut,
  Lock,
  Mail,
  Check,
  CreditCard,
  QrCode,
  Banknote,
  Wallet,
  ShoppingCart,
  User,
  Plus,
  Minus,
  Trash2,
  Calendar,
  Phone,
  DollarSign,
  TrendingUp,
  Receipt,
  Store,
  Clock,
  LayoutDashboard,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  Stethoscope,
  Boxes,
  ExternalLink,
  Scan,
  UserPlus,
  MoreVertical,
  Activity,
  Pill,
  Droplet,
  Edit3,
  PackagePlus,
  ShoppingBag,
  Send,
  Settings,
  Percent,
} from 'lucide-react';
import { getStoredUser, setStoredUser, clearStoredUser, DEMO_USERS, UserSession } from '@/lib/auth';
import { createTerminalFirebaseUser, firebaseSignOut } from '@/lib/firebase';
import { API_BASE, getApiBase } from '@/lib/api';
import { WholesaleInvoiceModal } from '@/components/WholesaleInvoiceModal';
import { WholesalePaymentModal } from '@/components/WholesalePaymentModal';
import { POSPaymentModal, POSPaymentResult } from '@/components/POSPaymentModal';
import { NotificationCenter } from '@/components/NotificationCenter';
import { LiveFleetTrackingModal } from '@/components/LiveFleetTrackingModal';
import { formatWholesaleInvoice, printWholesaleInvoiceDirectly } from '@/lib/wholesaleInvoice';

// INR Currency in Words converter
function numberToWordsINR(amount: number): string {
  const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertLessThanOneThousand(n: number): string {
    let current = '';
    if (n >= 100) {
      current += units[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }
    if (n >= 20) {
      current += tens[Math.floor(n / 10)] + ' ';
      n %= 10;
    } else if (n >= 10) {
      current += teens[n - 10] + ' ';
      return current;
    }
    if (n > 0) {
      current += units[n] + ' ';
    }
    return current;
  }

  const num = Math.round(Number(amount || 0) * 100) / 100;
  const whole = Math.floor(num);
  const paise = Math.round((num - whole) * 100);

  if (whole === 0 && paise === 0) return 'Zero Rupees Only';

  let result = '';
  const crore = Math.floor(whole / 10000000);
  const lakh = Math.floor((whole % 10000000) / 100000);
  const thousand = Math.floor((whole % 100000) / 1000);
  const remainder = whole % 1000;

  if (crore > 0) result += convertLessThanOneThousand(crore) + 'Crore ';
  if (lakh > 0) result += convertLessThanOneThousand(lakh) + 'Lakh ';
  if (thousand > 0) result += convertLessThanOneThousand(thousand) + 'Thousand ';
  if (remainder > 0) result += convertLessThanOneThousand(remainder);

  result = result.trim() + ' Rupees';

  if (paise > 0) {
    result += ' and ' + convertLessThanOneThousand(paise).trim() + ' Paise';
  }

  return result + ' Only';
}

interface CartItem {
  storeInventoryId: string;
  medicineId: string;
  brandName: string;
  genericName: string;
  dosageForm: string;
  batchNumber: string;
  expiryDate: string;
  onHandQuantity: number;
  mrp: number;
  sellingPrice: number;
  quantity: number;
  discountPercent: number;
}

// Medicine Icon Helper matching screenshot pastel circles
function MedicineIcon({ name }: { name: string }) {
  const n = (name || '').toLowerCase();
  if (n.includes('asthalin')) {
    return (
      <div className="w-8 h-8 rounded-full bg-sky-50 text-sky-500 flex items-center justify-center shrink-0 border border-sky-100">
        <Activity className="w-4 h-4" />
      </div>
    );
  }
  if (n.includes('augmentin')) {
    return (
      <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-500 flex items-center justify-center shrink-0 border border-purple-100">
        <Pill className="w-4 h-4" />
      </div>
    );
  }
  if (n.includes('azee')) {
    return (
      <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
        <Pill className="w-4 h-4" />
      </div>
    );
  }
  if (n.includes('brufen')) {
    return (
      <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center shrink-0 border border-amber-100">
        <Pill className="w-4 h-4" />
      </div>
    );
  }
  if (n.includes('cifran')) {
    return (
      <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center shrink-0 border border-blue-100">
        <Pill className="w-4 h-4" />
      </div>
    );
  }
  if (n.includes('dolo')) {
    return (
      <div className="w-8 h-8 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center shrink-0 border border-orange-100">
        <Pill className="w-4 h-4" />
      </div>
    );
  }
  if (n.includes('glycomet')) {
    return (
      <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-500 flex items-center justify-center shrink-0 border border-indigo-100">
        <Pill className="w-4 h-4" />
      </div>
    );
  }
  if (n.includes('huminsulin')) {
    return (
      <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
        <Droplet className="w-4 h-4" />
      </div>
    );
  }
  return (
    <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center shrink-0 border border-rose-100">
      <Pill className="w-4 h-4" />
    </div>
  );
}

export default function MedicalStoreDashboard() {
  const [user, setUser] = useState<UserSession | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Login form state if unauthenticated
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);

  // Main Navigation State
  const [activeTab, setActiveTab] = useState<'pos' | 'inventory' | 'transactions' | 'procurement' | 'settings'>('pos');
  const [destinationPincode, setDestinationPincode] = useState('400001');

  // Collapsible Sidebar State (collapses into icon-only mode)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('store_sidebar_collapsed', String(next));
      } catch (e) {}
      return next;
    });
  };

  // ==========================================
  // 1. RETAIL POS COUNTER STATES
  // ==========================================
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerDoctor, setCustomerDoctor] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [isCustomerSaved, setIsCustomerSaved] = useState(false);
  const [customerSuggestions, setCustomerSuggestions] = useState<any[]>([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const customerDropdownRef = useRef<HTMLDivElement>(null);

  const [posMedicineQuery, setPosMedicineQuery] = useState('');
  const [posCategoryFilter, setPosCategoryFilter] = useState('ALL');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'UPI' | 'CARD' | 'CREDIT'>('UPI');
  const [billDiscountPercent, setBillDiscountPercent] = useState<number>(0);
  const [billDiscountAmount, setBillDiscountAmount] = useState<number>(0);
  const [taxInvoiceToggle, setTaxInvoiceToggle] = useState<boolean>(true);
  const [billNotes, setBillNotes] = useState('');
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [activeBillReceipt, setActiveBillReceipt] = useState<any | null>(null);

  // ==========================================
  // 2. SHELF STOCK INVENTORY STATES
  // ==========================================
  const [storeInventory, setStoreInventory] = useState<any[]>([]);
  const [loadingStoreInventory, setLoadingStoreInventory] = useState(false);
  const [inventorySearchQuery, setInventorySearchQuery] = useState('');
  const [updateStockModalItem, setUpdateStockModalItem] = useState<any | null>(null);
  const [newPhysicalStockCount, setNewPhysicalStockCount] = useState<number>(100);
  const [updateDrawerLocation, setUpdateDrawerLocation] = useState<string>('Rack A · Drawer 1');
  const [updateReason, setUpdateReason] = useState('Physical shelf stock count audit');
  const [isUpdatingStock, setIsUpdatingStock] = useState(false);

  // Add Manual Product & Store Drawer Locator modal state
  const [addManualProductModalOpen, setAddManualProductModalOpen] = useState(false);
  const [manualBrandName, setManualBrandName] = useState('');
  const [manualGenericName, setManualGenericName] = useState('');
  const [manualCategory, setManualCategory] = useState('Analgesics / Fever');
  const [manualDosageForm, setManualDosageForm] = useState('TABLET');
  const [manualStrength, setManualStrength] = useState('500 mg');
  const [manualPackSize, setManualPackSize] = useState('10 Tablets Strip');
  const [manualBatchNumber, setManualBatchNumber] = useState('');
  const [manualExpiryDate, setManualExpiryDate] = useState('2028-12-31');
  const [manualDrawerLocation, setManualDrawerLocation] = useState('Rack A · Drawer 2');
  const [manualOnHandQty, setManualOnHandQty] = useState('100');
  const [manualUnitCost, setManualUnitCost] = useState('25');
  const [manualMrp, setManualMrp] = useState('45');
  const [manualSellingPrice, setManualSellingPrice] = useState('40');
  const [manualMinThreshold, setManualMinThreshold] = useState('20');
  const [isSubmittingManualProduct, setIsSubmittingManualProduct] = useState(false);

  // ==========================================
  // 5. STORE SETTINGS & PHYSICAL RACK DIRECTORY
  // ==========================================
  const [storeDetails, setStoreDetails] = useState({
    id: 'store-apollo-01',
    name: 'Apollo Care Pharmacy',
    licenseNumber: 'DL-2024-MH-AP08821',
    gstin: '27AAAAA0000A1Z5',
    pharmacistName: 'Dr. Ramesh Patil',
    phone: '+91 98200 12345',
    email: 'apollo.care@medlink.io',
    address: 'Shop 4, Colaba Causeway, Near Regal Cinema',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400001',
    workingHours: '8:00 AM - 11:30 PM (365 Days Open)',
  });

  const [storeShelfLocations, setStoreShelfLocations] = useState<any[]>([
    { id: 'loc-1', name: 'Rack A · Drawer 1', section: 'Cardiovascular / Blood Pressure', count: 1 },
    { id: 'loc-2', name: 'Rack A · Drawer 2', section: 'Fever & Pain / Analgesics', count: 1 },
    { id: 'loc-3', name: 'Rack A · Drawer 3', section: 'Pain & NSAIDs', count: 1 },
    { id: 'loc-4', name: 'Rack A · Drawer 4', section: 'Hypertension Care', count: 1 },
    { id: 'loc-5', name: 'Rack A · Drawer 5', section: 'Pain Management', count: 1 },
    { id: 'loc-6', name: 'Rack B · Drawer 1', section: 'Antibiotics Shelf', count: 1 },
    { id: 'loc-7', name: 'Rack B · Drawer 2', section: 'Broad-Spectrum Antibiotics', count: 1 },
    { id: 'loc-8', name: 'Rack B · Drawer 3', section: 'Macrolides & Cephalosporins', count: 1 },
    { id: 'loc-9', name: 'Rack B · Drawer 4', section: 'Fluoroquinolones', count: 1 },
    { id: 'loc-10', name: 'Rack B · Drawer 5', section: 'Pediatric Antibiotics', count: 1 },
    { id: 'loc-11', name: 'Rack C · Drawer 1', section: 'Diabetic Care (Metformin & Sulfonylureas)', count: 1 },
    { id: 'loc-12', name: 'Rack C · Drawer 3', section: 'Antacids & Gastro Care (PPIs)', count: 1 },
    { id: 'loc-13', name: 'Rack D · Drawer 2', section: 'Allergy, Cold & Cough (Antihistamines)', count: 1 },
    { id: 'loc-14', name: 'Rack D · Drawer 4', section: 'Respiratory Inhalers & Nebulizers', count: 1 },
    { id: 'loc-15', name: 'Rack E · Drawer 1', section: 'Calcium & Vitamin Supplements', count: 1 },
    { id: 'loc-16', name: 'Cold Fridge #1 · Top Shelf', section: '2°C–8°C Cold Chain Insulin & Biologics', count: 1 },
    { id: 'loc-17', name: 'Front Counter Drawer C-1', section: 'Fast-Moving OTC & Emergency Front Desk', count: 1 },
  ]);

  const [newShelfName, setNewShelfName] = useState('');
  const [newShelfSection, setNewShelfSection] = useState('');
  const [isSavingStoreSettings, setIsSavingStoreSettings] = useState(false);

  // Real-time ticking date and time in header
  const [currentDateTime, setCurrentDateTime] = useState<Date>(new Date());

  // Store Terminals & Multi-Counter Operators
  const [storeTerminals, setStoreTerminals] = useState<any[]>([]);
  const [loadingTerminals, setLoadingTerminals] = useState(false);
  const [newTerminalCode, setNewTerminalCode] = useState('COUNTER-02');
  const [newTerminalName, setNewTerminalName] = useState('Billing Counter #2');
  const [newTerminalOperator, setNewTerminalOperator] = useState('');
  const [newTerminalUsername, setNewTerminalUsername] = useState('');
  const [newTerminalEmail, setNewTerminalEmail] = useState('');
  const [newTerminalPassword, setNewTerminalPassword] = useState('');
  const [isAddingTerminal, setIsAddingTerminal] = useState(false);
  const [settingsActiveSection, setSettingsActiveSection] = useState<'profile' | 'shelves' | 'terminals' | 'discounts'>('profile');

  // Store Promotional Discounts & Seasonal Campaigns (Configured by Store Owner)
  const [discountCampaigns, setDiscountCampaigns] = useState<any[]>([]);
  const [loadingDiscounts, setLoadingDiscounts] = useState(false);
  const [applyCampaignDiscount, setApplyCampaignDiscount] = useState<boolean>(true);
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<any | null>(null);
  const [discountFormName, setDiscountFormName] = useState('');
  const [discountFormPercent, setDiscountFormPercent] = useState<number>(10);
  const [discountFormCode, setDiscountFormCode] = useState('');
  const [discountFormDesc, setDiscountFormDesc] = useState('');
  const [discountFormActive, setDiscountFormActive] = useState<boolean>(true);
  const [isSavingDiscount, setIsSavingDiscount] = useState(false);

  // Live GPS Delivery Tracking Modal
  const [trackingOrderModal, setTrackingOrderModal] = useState<any | null>(null);

  // ==========================================
  // 3. SALES TRANSACTIONS & MONTHLY ESTIMATES
  // ==========================================
  const [bills, setBills] = useState<any[]>([]);
  const [loadingBills, setLoadingBills] = useState(false);
  const [monthlyStats, setMonthlyStats] = useState({
    monthlyGrossRevenue: 5293.56,
    todaySales: 1218.56,
    totalBillsCount: 7,
    avgBillValue: 756.22,
  });
  const [billSearchQuery, setBillSearchQuery] = useState('');
  const [transactionDateFilter, setTransactionDateFilter] = useState<'ALL' | 'TODAY' | 'YESTERDAY' | 'LAST_7_DAYS' | 'THIS_MONTH' | 'CUSTOM'>('ALL');
  const [filterStartDate, setFilterStartDate] = useState<string>('');
  const [filterEndDate, setFilterEndDate] = useState<string>('');
  const [viewingBillModal, setViewingBillModal] = useState<any | null>(null);

  // ==========================================
  // 4. WHOLESALE DISTRIBUTOR PROCUREMENT STATES
  // ==========================================
  const [procurementSubTab, setProcurementSubTab] = useState<'catalogue' | 'orders' | 'ai-alerts' | 'distributors' | 'indents'>('catalogue');
  const [distributorsList, setDistributorsList] = useState<any[]>([]);
  const [loadingDistributors, setLoadingDistributors] = useState(false);
  const [medicines, setMedicines] = useState<any[]>([]);
  const [loadingMedicines, setLoadingMedicines] = useState(false);
  const [catalogueSearch, setCatalogueSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Chemist Indent Requests State
  const [indentRequests, setIndentRequests] = useState<any[]>([]);
  const [loadingIndents, setLoadingIndents] = useState(false);
  const [isIndentModalOpen, setIsIndentModalOpen] = useState(false);
  const [indentForm, setIndentForm] = useState({
    medicineName: '',
    genericName: '',
    dosageForm: 'TABLET',
    strength: '',
    requiredQty: 50,
    urgency: 'STANDARD',
    targetDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
    distributorId: 'ALL',
    notes: '',
  });
  const [isSubmittingIndent, setIsSubmittingIndent] = useState(false);

  // Quarantined Batches Map
  const [quarantinedBatches, setQuarantinedBatches] = useState<Record<string, boolean>>({});

  // POS Payment Modal State
  const [isPosPaymentModalOpen, setIsPosPaymentModalOpen] = useState(false);

  // Supplier Comparison & Ordering drawer state
  const [selectedMedicine, setSelectedMedicine] = useState<any | null>(null);
  const [requestedQty, setRequestedQty] = useState(50);
  const [comparisonResults, setComparisonResults] = useState<any | null>(null);
  const [loadingComparison, setLoadingComparison] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  // Wholesale Orders State
  const [orders, setOrders] = useState<any[]>([]);
  const [orderFilter, setOrderFilter] = useState<'ALL' | 'PENDING_APPROVAL' | 'CONFIRMED' | 'DISPATCHED' | 'DELIVERED'>('ALL');
  const [invoiceModalOrder, setInvoiceModalOrder] = useState<any | null>(null);
  const [invoiceData, setInvoiceData] = useState<any | null>(null);
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);
  const [paymentModalOrder, setPaymentModalOrder] = useState<any | null>(null);
  const [wholesaleSearch, setWholesaleSearch] = useState('');
  const [wholesaleCategory, setWholesaleCategory] = useState('ALL');

  // AI Stock Alerts State
  const [stockAlerts, setStockAlerts] = useState<any[]>([]);
  const [loadingAlerts, setLoadingAlerts] = useState(false);
  const [restockModalAlert, setRestockModalAlert] = useState<any | null>(null);
  const [restockAdjustedQty, setRestockAdjustedQty] = useState<number>(100);
  const [restockQuote, setRestockQuote] = useState<any | null>(null);
  const [loadingRestockQuote, setLoadingRestockQuote] = useState<boolean>(false);
  const [isSubmittingRestock, setIsSubmittingRestock] = useState<boolean>(false);

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Close customer dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (customerDropdownRef.current && !customerDropdownRef.current.contains(event.target as Node)) {
        setShowCustomerDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Real-time ticking clock interval
  useEffect(() => {
    const clockTimer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(clockTimer);
  }, []);

  useEffect(() => {
    try {
      const savedCollapsed = localStorage.getItem('store_sidebar_collapsed');
      if (savedCollapsed === 'true') {
        setIsSidebarCollapsed(true);
      }
      const savedProfile = localStorage.getItem('medlink_store_profile');
      if (savedProfile) {
        const parsed = JSON.parse(savedProfile);
        setStoreDetails((prev) => ({ ...prev, ...parsed }));
      }
    } catch (e) {}

    const session = getStoredUser('MEDICAL_STORE');
    if (session && session.role === 'MEDICAL_STORE') {
      setUser(session);
      if (session.pincode) setDestinationPincode(session.pincode);
    }
    setIsCheckingAuth(false);

    // Initial data fetch
    fetchStoreProfile();
    fetchStoreTerminals();
    fetchDiscountCampaigns();
    fetchStoreInventory();
    fetchBills();
    fetchCatalogue();
    fetchOrders();
    fetchStockAlerts();
    fetchDistributors();
    fetchQuarantinedBatches();
    fetchIndentRequests();

    // Silent background polling: never flashes spinners to eliminate dashboard blinking
    const interval = setInterval(() => {
      fetchOrders(true);
      fetchStoreInventory(true);
      fetchBills(true);
      fetchStockAlerts(true);
      fetchStoreTerminals(true);
      fetchDiscountCampaigns(true);
      fetchDistributors(true);
      fetchIndentRequests(true);
      fetchQuarantinedBatches();
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleQuickLogin = (roleKey: 'MEDICAL_STORE' | 'TERMINAL_2' | 'TERMINAL_3' = 'MEDICAL_STORE') => {
    const session = DEMO_USERS[roleKey] || DEMO_USERS.MEDICAL_STORE;
    setStoredUser(session);
    setUser(session);
    if (session.pincode) setDestinationPincode(session.pincode);
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
          name: data.user.name || 'Apollo Care Pharmacy',
          role: 'MEDICAL_STORE',
          licenseNumber: data.user.licenseNumber || 'DL-2024-MH-APO8821',
          pincode: data.user.pincode || '400001',
          token: data.token,
          isTerminal: !!data.user.isTerminal,
          terminalCode: data.user.terminalCode,
          terminalName: data.user.terminalName,
          operatorName: data.user.operatorName,
          username: data.user.username,
        };
        setStoredUser(session);
        setUser(session);
      } else {
        if (loginEmail.toLowerCase().includes('terminal2')) {
          handleQuickLogin('TERMINAL_2');
        } else if (loginEmail.toLowerCase().includes('terminal3')) {
          handleQuickLogin('TERMINAL_3');
        } else if (loginEmail.toLowerCase().includes('apollo') || loginEmail.toLowerCase().includes('chemist')) {
          handleQuickLogin('MEDICAL_STORE');
        } else {
          setAuthError(data.message || 'Invalid credentials.');
        }
      }
    } catch (err) {
      handleQuickLogin('MEDICAL_STORE');
    }
  };

  const handleLogout = async () => {
    try {
      await firebaseSignOut();
    } catch (e) {}
    clearStoredUser('MEDICAL_STORE');
    setUser(null);
  };

  // ==========================================
  // DATA FETCHING (SILENT POLLING)
  // ==========================================
  const fetchStoreInventory = async (silent = false) => {
    if (!silent) setLoadingStoreInventory(true);
    try {
      const res = await fetch(`${API_BASE}/store/inventory?storeId=store-apollo-01`);
      const data = await res.json();
      if (data.success) {
        setStoreInventory(data.inventory || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      if (!silent) setLoadingStoreInventory(false);
    }
  };

  const fetchBills = async (
    silent = false,
    filter: 'ALL' | 'TODAY' | 'YESTERDAY' | 'LAST_7_DAYS' | 'THIS_MONTH' | 'CUSTOM' = transactionDateFilter,
    start: string = filterStartDate,
    end: string = filterEndDate
  ) => {
    if (!silent) setLoadingBills(true);
    try {
      let url = `${API_BASE}/store/bills?storeId=store-apollo-01&dateFilter=${filter}`;
      if (start) {
        url += `&startDate=${encodeURIComponent(start)}`;
      }
      if (end) {
        url += `&endDate=${encodeURIComponent(end)}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setBills(data.bills || []);
        if (data.monthlyStats) {
          setMonthlyStats(data.monthlyStats);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      if (!silent) setLoadingBills(false);
    }
  };

  const fetchStoreTerminals = async (silent = false) => {
    if (!silent) setLoadingTerminals(true);
    try {
      const res = await fetch(`${API_BASE}/store/terminals?storeId=store-apollo-01`);
      const data = await res.json();
      if (data.success) {
        setStoreTerminals(data.terminals || []);
      }
    } catch (err) {
      console.error('Error fetching terminals:', err);
    } finally {
      if (!silent) setLoadingTerminals(false);
    }
  };

  const fetchDistributors = async (silent = false) => {
    if (!silent) setLoadingDistributors(true);
    try {
      const res = await fetch(`${API_BASE}/distributors`);
      const data = await res.json();
      if (data.success && data.distributors) {
        setDistributorsList(data.distributors);
      }
    } catch (err) {
      console.error('Distributors fetch error', err);
    } finally {
      if (!silent) setLoadingDistributors(false);
    }
  };

  const fetchDiscountCampaigns = async (silent = false) => {
    if (!silent) setLoadingDiscounts(true);
    try {
      const res = await fetch(`${API_BASE}/store/discounts?storeId=store-apollo-01`);
      const data = await res.json();
      if (data.success && Array.isArray(data.campaigns)) {
        setDiscountCampaigns(data.campaigns);
      }
    } catch (err) {
      console.error('Error fetching discount campaigns:', err);
    } finally {
      if (!silent) setLoadingDiscounts(false);
    }
  };

  const handleToggleDiscountCampaign = async (campaignId: string, currentActive: boolean) => {
    try {
      const res = await fetch(`${API_BASE}/store/discounts/${campaignId}/toggle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId: 'store-apollo-01' }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        await fetchDiscountCampaigns(true);
      } else {
        showToast(`Failed: ${data.message}`);
      }
    } catch (err) {
      showToast('Error toggling campaign status.');
    }
  };

  const handleDeleteDiscountCampaign = async (campaignId: string, campaignName: string) => {
    if (!confirm(`Delete discount campaign "${campaignName}"?`)) return;
    try {
      const res = await fetch(`${API_BASE}/store/discounts/${campaignId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Campaign "${campaignName}" deleted.`);
        await fetchDiscountCampaigns(true);
      }
    } catch (err) {
      showToast('Error deleting campaign.');
    }
  };

  const handleSaveDiscountCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!discountFormName.trim()) {
      showToast('Please enter a campaign name (e.g. Diwali Festive Offer).');
      return;
    }
    if (Number(discountFormPercent) <= 0 || Number(discountFormPercent) > 100) {
      showToast('Please enter a valid discount percentage (1 - 100%).');
      return;
    }

    setIsSavingDiscount(true);
    try {
      const isEditing = !!editingDiscount;
      const url = isEditing
        ? `${API_BASE}/store/discounts/${editingDiscount.id}`
        : `${API_BASE}/store/discounts`;
      const method = isEditing ? 'PUT' : 'POST';

      const payload = {
        storeId: 'store-apollo-01',
        name: discountFormName.trim(),
        discountPercent: Number(discountFormPercent),
        code: discountFormCode.trim() || `OFF-${discountFormPercent}`,
        description: discountFormDesc.trim() || `Store discount ${discountFormPercent}% off`,
        isActive: discountFormActive,
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        showToast(isEditing ? `Campaign "${discountFormName}" updated!` : `Campaign "${discountFormName}" created!`);
        setIsDiscountModalOpen(false);
        setEditingDiscount(null);
        await fetchDiscountCampaigns(true);
      } else {
        showToast(`Failed: ${data.message}`);
      }
    } catch (err) {
      showToast('Error saving discount campaign.');
    } finally {
      setIsSavingDiscount(false);
    }
  };

  const handleCreateTerminal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTerminalOperator.trim() || !newTerminalUsername.trim() || !newTerminalPassword.trim()) {
      showToast('Please enter operator full name, login username, and password.');
      return;
    }
    setIsAddingTerminal(true);
    try {
      const cleanUsername = newTerminalUsername.trim().toLowerCase();
      const cleanEmail = (newTerminalEmail && newTerminalEmail.trim()) ? newTerminalEmail.trim().toLowerCase() : `${cleanUsername}@apollocare.com`;
      const cleanPassword = newTerminalPassword.trim();

      // 1. Create User in Firebase Authentication for this Terminal
      let firebaseUid: string | null = null;
      let firebaseCreated = false;
      try {
        const fbRes = await createTerminalFirebaseUser(cleanEmail, cleanPassword);
        if (fbRes.success) {
          firebaseUid = fbRes.uid || null;
          firebaseCreated = true;
        } else {
          console.warn('Firebase user creation note:', fbRes.error);
        }
      } catch (fbErr: any) {
        console.warn('Firebase Auth note:', fbErr);
      }

      // 2. Register Terminal in PostgreSQL
      const res = await fetch(`${API_BASE}/store/terminals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: 'store-apollo-01',
          terminalCode: newTerminalCode.trim() || 'COUNTER-02',
          terminalName: newTerminalName.trim() || `Billing Desk ${newTerminalCode.trim()}`,
          operatorName: newTerminalOperator.trim(),
          username: cleanUsername,
          email: cleanEmail,
          password: cleanPassword,
          firebaseUid,
        }),
      });
      const data = await res.json();
      if (data.success) {
        const fbStatus = firebaseCreated ? '🔥 Firebase Auth User Created' : '';
        showToast(`✅ Created terminal ${data.terminal?.terminalCode}: ${data.terminal?.operatorName} (${cleanEmail}) ${fbStatus}`.trim());
        setNewTerminalOperator('');
        setNewTerminalUsername('');
        setNewTerminalEmail('');
        setNewTerminalPassword('');
        setNewTerminalName('');
        await fetchStoreTerminals(true);
      } else {
        showToast(`Failed: ${data.message}`);
      }
    } catch (err) {
      showToast('Error creating terminal operator.');
    } finally {
      setIsAddingTerminal(false);
    }
  };

  const handleDeleteTerminal = async (termId: string, name: string) => {
    if (!confirm(`Delete terminal operator "${name}"? They will immediately lose counter POS access.`)) return;
    try {
      const res = await fetch(`${API_BASE}/store/terminals/${termId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast(`Terminal "${name}" removed successfully.`);
        await fetchStoreTerminals(true);
      }
    } catch (err) {
      showToast('Error removing terminal.');
    }
  };

  const fetchCatalogue = async (silent = false) => {
    if (!silent) setLoadingMedicines(true);
    try {
      const res = await fetch(
        `${API_BASE}/catalogue?q=${encodeURIComponent(catalogueSearch)}&category=${encodeURIComponent(selectedCategory)}`
      );
      const data = await res.json();
      if (data.success) setMedicines(data.medicines || []);
    } catch (err) {
      console.error(err);
    } finally {
      if (!silent) setLoadingMedicines(false);
    }
  };

  const fetchOrders = async (silent = false) => {
    try {
      const res = await fetch(`${API_BASE}/orders`);
      const data = await res.json();
      if (data.success) setOrders(data.orders || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStockAlerts = async (silent = false) => {
    if (!silent) setLoadingAlerts(true);
    try {
      const res = await fetch(`${API_BASE}/forecast-alerts`);
      const data = await res.json();
      if (data.success) setStockAlerts(data.alerts || []);
    } catch (err) {
      console.error(err);
    } finally {
      if (!silent) setLoadingAlerts(false);
    }
  };

  const fetchQuarantinedBatches = async () => {
    try {
      const res = await fetch(`${API_BASE}/batches/quarantine`);
      const data = await res.json();
      if (data.success && data.quarantinedBatches) {
        setQuarantinedBatches(data.quarantinedBatches);
      }
    } catch (e) {
      console.warn('Failed to fetch quarantined batches:', e);
    }
  };

  const fetchIndentRequests = async (silent = false) => {
    if (!silent) setLoadingIndents(true);
    try {
      const storeId = storeDetails.id || 'store-apollo-01';
      const res = await fetch(`${API_BASE}/medicine-requests?storeId=${storeId}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.requests)) {
        setIndentRequests(data.requests);
      }
    } catch (e) {
      console.warn('Failed to fetch indents:', e);
    } finally {
      if (!silent) setLoadingIndents(false);
    }
  };

  const handleSubmitIndent = async () => {
    if (!indentForm.medicineName.trim()) {
      showToast('Please enter medicine brand name.');
      return;
    }
    if (indentForm.requiredQty <= 0) {
      showToast('Required quantity must be at least 1 unit.');
      return;
    }

    setIsSubmittingIndent(true);
    try {
      const storeId = storeDetails.id || 'store-apollo-01';
      const storeName = storeDetails.name || user?.name || 'Apollo Care Pharmacy';
      const distName =
        indentForm.distributorId === 'ALL'
          ? 'Broadcast to All Wholesalers'
          : (distributorsList.find((d: any) => d.id === indentForm.distributorId)?.companyName ||
             distributorsList.find((d: any) => d.id === indentForm.distributorId)?.name ||
             'Wholesaler');

      const payload = {
        storeId,
        storeName,
        storeLicense: storeDetails.licenseNumber || user?.licenseNumber || 'DL-2024-MH-APO8821',
        storePhone: storeDetails.phone || user?.phone || '+91 98200 12345',
        storeCity: storeDetails.city || 'Mumbai',
        distributorId: indentForm.distributorId,
        distributorName: distName,
        medicineName: indentForm.medicineName.trim(),
        genericName: indentForm.genericName.trim(),
        dosageForm: indentForm.dosageForm,
        strength: indentForm.strength.trim(),
        requiredQty: indentForm.requiredQty,
        urgency: indentForm.urgency,
        targetDate: indentForm.targetDate,
        notes: indentForm.notes.trim(),
      };

      const res = await fetch(`${API_BASE}/medicine-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Chemist Indent for ${indentForm.medicineName} raised successfully! Wholesalers notified.`);
        setIsIndentModalOpen(false);
        setIndentForm({
          medicineName: '',
          genericName: '',
          dosageForm: 'TABLET',
          strength: '',
          requiredQty: 50,
          urgency: 'STANDARD',
          targetDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
          distributorId: 'ALL',
          notes: '',
        });
        await fetchIndentRequests();
      } else {
        showToast(`Indent failed: ${data.message || 'Unknown error'}`);
      }
    } catch (err) {
      showToast('Error submitting indent request.');
    } finally {
      setIsSubmittingIndent(false);
    }
  };

  const handleNotificationAction = (actionType: string, metadata?: any) => {
    if (actionType === 'ORDER_MEDICINE') {
      setActiveTab('procurement');
      setProcurementSubTab('catalogue');
      if (metadata?.medicineName) {
        setWholesaleSearch(metadata.medicineName);
      }
    } else if (actionType === 'TRACK_ORDER') {
      if (metadata?.orderId) {
        const found = orders.find((o) => o.id === metadata.orderId);
        if (found) {
          setTrackingOrderModal(found);
          return;
        }
      }
      setActiveTab('procurement');
      setProcurementSubTab('orders');
    } else if (actionType === 'DISCOUNT_EXPIRY') {
      setIsDiscountModalOpen(true);
    }
  };

  // ==========================================
  // STORE PROFILE & PHYSICAL SHELF DIRECTORY
  // ==========================================
  const fetchStoreProfile = async (silent = false) => {
    try {
      const res = await fetch(`${API_BASE}/store/profile?storeId=store-apollo-01`);
      const data = await res.json();
      if (data.success && data.store) {
        const loadedProfile = {
          id: data.store.id || 'store-apollo-01',
          name: data.store.name || 'Apollo Care Pharmacy',
          licenseNumber: data.store.licenseNumber || 'DL-2024-MH-AP08821',
          gstin: data.store.gstin || '27AAAAA0000A1Z5',
          pharmacistName: data.store.pharmacistName || 'Dr. Ramesh Patil',
          phone: data.store.phone || '+91 98200 12345',
          email: data.store.email || 'apollo.care@medlink.io',
          address: data.store.address || 'Shop 4, Colaba Causeway, Near Regal Cinema',
          city: data.store.city || 'Mumbai',
          state: data.store.state || 'Maharashtra',
          pincode: data.store.pincode || '400001',
          workingHours: data.store.workingHours || '8:00 AM - 11:30 PM (365 Days Open)',
        };
        setStoreDetails(loadedProfile);
        try {
          localStorage.setItem('medlink_store_profile', JSON.stringify(loadedProfile));
        } catch (e) {}
        if (data.shelfLocations && Array.isArray(data.shelfLocations)) {
          setStoreShelfLocations(data.shelfLocations);
        }
      }
    } catch (err) {
      console.error('Error fetching store profile:', err);
    }
  };

  const handleSaveStoreProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingStoreSettings(true);
    try {
      const res = await fetch(`${API_BASE}/store/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: storeDetails.id,
          name: storeDetails.name,
          licenseNumber: storeDetails.licenseNumber,
          gstin: storeDetails.gstin,
          pharmacistName: storeDetails.pharmacistName,
          phone: storeDetails.phone,
          email: storeDetails.email,
          address: storeDetails.address,
          city: storeDetails.city,
          state: storeDetails.state,
          pincode: storeDetails.pincode,
          shelfLocations: storeShelfLocations,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('✅ Pharmacy Profile and physical shelf settings saved successfully in PostgreSQL!');
        const updatedUser: UserSession = {
          id: user?.id || 'usr-store-01',
          email: storeDetails.email || user?.email || 'apollo.care@medlink.io',
          role: user?.role || 'MEDICAL_STORE',
          ...(user || {}),
          name: storeDetails.name,
          licenseNumber: storeDetails.licenseNumber,
          gstin: storeDetails.gstin,
          phone: storeDetails.phone,
          pharmacistName: storeDetails.pharmacistName,
          address: storeDetails.address,
          city: storeDetails.city,
          state: storeDetails.state,
          pincode: storeDetails.pincode,
        };
        setUser(updatedUser);
        setStoredUser(updatedUser);
        try {
          localStorage.setItem('medlink_store_profile', JSON.stringify(storeDetails));
        } catch (e) {}
      } else {
        showToast(`Failed to save settings: ${data.message}`);
      }
    } catch (err) {
      showToast('Error saving pharmacy profile.');
    } finally {
      setIsSavingStoreSettings(false);
    }
  };

  const handleAddNewShelfLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShelfName.trim()) {
      showToast('Please enter a shelf/rack name (e.g., Rack F · Drawer 1)');
      return;
    }
    const exists = storeShelfLocations.some(
      (l) => l.name.toLowerCase() === newShelfName.trim().toLowerCase()
    );
    if (exists) {
      showToast('A shelf or drawer with this name already exists.');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/store/shelf-locations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: storeDetails.id,
          locationName: newShelfName.trim(),
          sectionName: newShelfSection.trim() || 'General Formulations Shelf',
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`✅ Added physical drawer "${newShelfName.trim()}" to store registry!`);
        setNewShelfName('');
        setNewShelfSection('');
        await fetchStoreProfile(true);
      } else {
        showToast(`Failed to add location: ${data.message}`);
      }
    } catch (err) {
      showToast('Error adding shelf location.');
    }
  };

  const handleDeleteShelfLocation = async (locId: string, locName: string) => {
    if (!confirm(`Remove shelf location "${locName}" from physical directory?`)) return;
    const updated = storeShelfLocations.filter((l) => l.id !== locId && l.name !== locName);
    setStoreShelfLocations(updated);
    try {
      const res = await fetch(`${API_BASE}/store/shelf-locations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: storeDetails.id,
          shelfLocations: updated,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Removed "${locName}" from directory.`);
        await fetchStoreProfile(true);
      }
    } catch (err) {
      showToast('Error removing shelf location.');
    }
  };

  // ==========================================
  // INLINE CUSTOMER AUTOCOMPLETE (Directly in Name Input)
  // ==========================================
  const handleCustomerNameChange = async (newName: string) => {
    setCustomerName(newName);
    setIsCustomerSaved(false);

    if (newName.trim().length > 1) {
      try {
        const res = await fetch(`${API_BASE}/store/customers?q=${encodeURIComponent(newName.trim())}`);
        const data = await res.json();
        if (data.success && data.customers && data.customers.length > 0) {
          setCustomerSuggestions(data.customers);
          setShowCustomerDropdown(true);
        } else {
          setCustomerSuggestions([]);
          setShowCustomerDropdown(false);
        }
      } catch (err) {
        console.error(err);
      }
    } else {
      setCustomerSuggestions([]);
      setShowCustomerDropdown(false);
    }
  };

  const handleSelectCustomer = (c: any) => {
    setCustomerName(c.name);
    setCustomerPhone(c.phone);
    setCustomerDoctor(c.doctorName || '');
    setCustomerAddress(c.address || '');
    setIsCustomerSaved(true);
    setShowCustomerDropdown(false);
    showToast(`Loaded registered patient profile: ${c.name}`);
  };

  const handleClearCustomer = () => {
    setCustomerName('');
    setCustomerPhone('');
    setCustomerDoctor('');
    setCustomerAddress('');
    setIsCustomerSaved(false);
    setShowCustomerDropdown(false);
  };

  // ==========================================
  // POS CART & CHECKOUT
  // ==========================================
  const handleAddToCart = (item: any) => {
    const existingIndex = cart.findIndex(
      (c) => c.storeInventoryId === item.id || (c.medicineId === item.medicineId && c.batchNumber === item.batchNumber)
    );
    if (existingIndex > -1) {
      const updated = [...cart];
      if (updated[existingIndex].quantity < item.onHandQuantity) {
        updated[existingIndex].quantity += 1;
        setCart(updated);
        showToast(`Increased ${item.brandName} to ${updated[existingIndex].quantity}`);
      } else {
        showToast(`Reached maximum shelf stock (${item.onHandQuantity} units).`);
      }
    } else {
      setCart([
        ...cart,
        {
          storeInventoryId: item.id,
          medicineId: item.medicineId,
          brandName: item.brandName,
          genericName: item.genericName,
          dosageForm: item.dosageForm,
          batchNumber: item.batchNumber,
          expiryDate: item.expiryDate,
          onHandQuantity: item.onHandQuantity,
          mrp: parseFloat(item.mrp),
          sellingPrice: parseFloat(item.sellingPrice || item.mrp),
          quantity: 1,
          discountPercent: 0,
        },
      ]);
      showToast(`Added ${item.brandName} to bill`);
    }
  };

  const handleUpdateCartQty = (index: number, newQty: number) => {
    const updated = [...cart];
    const maxQty = updated[index].onHandQuantity;
    if (newQty <= 0) {
      handleRemoveCartItem(index);
      return;
    }
    if (newQty > maxQty) {
      showToast(`Max available on shelf is ${maxQty} units.`);
      updated[index].quantity = maxQty;
    } else {
      updated[index].quantity = newQty;
    }
    setCart(updated);
  };

  const handleRemoveCartItem = (index: number) => {
    const updated = [...cart];
    updated.splice(index, 1);
    setCart(updated);
  };

  // Active Store Promotional Campaign (Configured by Store Owner in Settings)
  const activePromoCampaign = discountCampaigns.find((c) => c.isActive) || null;
  const activePromoPercent = (activePromoCampaign && applyCampaignDiscount) ? activePromoCampaign.discountPercent : 0;

  // Cart Calculations (In Indian retail pharma, selling price / MRP is inclusive of all taxes)
  // Cart Calculations
  const cartSubtotal = cart.reduce((acc, it) => acc + it.quantity * it.sellingPrice, 0);
  const cartItemDiscountTotal = cart.reduce(
    (acc, it) => acc + (it.quantity * it.sellingPrice * (it.discountPercent || 0)) / 100,
    0
  );
  // Auto-calculated discount from the active store campaign:
  const calculatedCampaignDiscount = parseFloat(((cartSubtotal * activePromoPercent) / 100).toFixed(2));
  const totalDiscount = parseFloat((cartItemDiscountTotal + calculatedCampaignDiscount).toFixed(2));
  const finalPayable = Math.max(0, parseFloat((cartSubtotal - totalDiscount).toFixed(2)));
  // Componentized Form 20 Tax Invoice GST breakdown (within MRP)
  const taxableAmount = Math.max(0, parseFloat((cartSubtotal - totalDiscount).toFixed(2)));
  const cgstAmount = taxInvoiceToggle ? parseFloat((taxableAmount * 0.06).toFixed(2)) : 0;
  const sgstAmount = taxInvoiceToggle ? parseFloat((taxableAmount * 0.06).toFixed(2)) : 0;
  const totalTaxAmount = taxInvoiceToggle ? parseFloat((cgstAmount + sgstAmount).toFixed(2)) : 0;
  const grandTotal = taxInvoiceToggle ? parseFloat((taxableAmount + totalTaxAmount).toFixed(2)) : taxableAmount;

  // Open POS Payment Gateway Modal
  const handleOpenCheckoutPayment = () => {
    if (cart.length === 0) {
      showToast('Cannot checkout: Cart is empty.');
      return;
    }
    if (!customerName.trim() || !customerPhone.trim()) {
      showToast('Please enter customer full name and phone number.');
      return;
    }
    setIsPosPaymentModalOpen(true);
  };

  // Complete Retail Checkout with Gateway Payment Result
  const handleCompletePOSCheckout = async (paymentResult: POSPaymentResult) => {
    setIsCheckingOut(true);
    setIsPosPaymentModalOpen(false);
    try {
      const isOperator = !!user?.isTerminal;
      const billedBy = isOperator
        ? `${user?.operatorName || 'Cashier'} (${user?.terminalCode || 'COUNTER-02'})`
        : `Owner (${user?.name || 'Dr. Ramesh Patil'})`;
      const terminalCode = user?.terminalCode || 'COUNTER-01';

      const payload = {
        storeId: 'store-apollo-01',
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        doctorName: customerDoctor.trim() || 'General / Self-Prescribed',
        paymentMode: paymentResult.paymentMode,
        transactionRef: paymentResult.transactionRef,
        discountAmount: totalDiscount,
        discountPercent: activePromoPercent,
        discountName: (activePromoCampaign && applyCampaignDiscount) ? activePromoCampaign.name : null,
        discountCampaignId: (activePromoCampaign && applyCampaignDiscount) ? activePromoCampaign.id : null,
        notes: `${paymentResult.notes || 'Counter POS Dispensed'} [Ref: ${paymentResult.transactionRef}]`,
        billedBy,
        terminalCode,
        items: cart.map((it) => ({
          storeInventoryId: it.storeInventoryId,
          medicineId: it.medicineId,
          brandName: it.brandName,
          batchNumber: it.batchNumber,
          quantity: it.quantity,
          unitPrice: it.sellingPrice,
          mrp: it.mrp,
          discountPercent: it.discountPercent,
        })),
      };

      const res = await fetch(`${API_BASE}/store/bills`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Tax Bill #${data.bill.billNumber} paid & generated successfully via ${paymentResult.paymentMode}!`);
        setActiveBillReceipt({
          ...data.bill,
          paymentMode: paymentResult.paymentMode,
          transactionRef: paymentResult.transactionRef,
          tenderedAmount: paymentResult.tenderedAmount,
          changeAmount: paymentResult.changeAmount,
          discountName: (activePromoCampaign && applyCampaignDiscount) ? activePromoCampaign.name : null,
          discountPercent: activePromoPercent,
          discountAmount: totalDiscount,
          storeName: storeDetails.name || user?.name || 'Apollo Care Pharmacy',
          storeLicense: storeDetails.licenseNumber || user?.licenseNumber || 'DL-2024-MH-APO8821',
          storeGstin: storeDetails.gstin || user?.gstin || '27AAAAA0000A1Z5',
          storeAddress: storeDetails.address || user?.address || 'Colaba Causeway, Mumbai',
          storePhone: storeDetails.phone || user?.phone || '+91 98200 12345',
          storePharmacist: storeDetails.pharmacistName || user?.name || 'Dr. Ramesh Patil',
        });
        setCart([]);
        setBillNotes('');
        setCustomerName('');
        setCustomerPhone('');
        setCustomerDoctor('');
        setCustomerAddress('');
        setIsCustomerSaved(false);
        await Promise.all([fetchStoreInventory(true), fetchBills(true), fetchDiscountCampaigns(true)]);
      } else {
        showToast(`Checkout failed: ${data.message || 'Unknown error'}`);
      }
    } catch (err) {
      showToast('Error completing checkout.');
    } finally {
      setIsCheckingOut(false);
    }
  };

  const handleCheckoutBill = () => {
    handleOpenCheckoutPayment();
  };

  // ==========================================
  // UPDATE SHELF STOCK COUNT
  // ==========================================
  const handleOpenUpdateStockModal = (item: any) => {
    setUpdateStockModalItem(item);
    setNewPhysicalStockCount(item.onHandQuantity);
    setUpdateDrawerLocation(item.drawerLocation || 'Rack A · Drawer 1');
    setUpdateReason('Physical shelf stock count audit');
  };

  const handleUpdateStockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!updateStockModalItem) return;
    setIsUpdatingStock(true);
    try {
      const res = await fetch(`${API_BASE}/store/inventory/adjust`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: 'store-apollo-01',
          inventoryId: updateStockModalItem.id,
          batchNumber: updateStockModalItem.batchNumber,
          newQuantity: newPhysicalStockCount,
          reason: updateReason,
          drawerLocation: updateDrawerLocation,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        setUpdateStockModalItem(null);
        await fetchStoreInventory(true);
      } else {
        showToast(`Update failed: ${data.message}`);
      }
    } catch (err) {
      showToast('Error updating shelf stock.');
    } finally {
      setIsUpdatingStock(false);
    }
  };

  const handleAddManualProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualBrandName.trim()) {
      showToast('Please enter a medicine brand name.');
      return;
    }
    setIsSubmittingManualProduct(true);
    try {
      const res = await fetch(`${API_BASE}/store/inventory/product`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: 'store-apollo-01',
          brandName: manualBrandName.trim(),
          genericName: manualGenericName.trim() || 'Pharmaceutical Formulation',
          category: manualCategory,
          dosageForm: manualDosageForm,
          strength: manualStrength.trim() || 'Standard Formulation',
          packSize: manualPackSize.trim() || '10 Units Pack',
          batchNumber: manualBatchNumber.trim() || `BTH-APO-${Math.floor(1000 + Math.random() * 9000)}`,
          expiryDate: manualExpiryDate,
          drawerLocation: manualDrawerLocation.trim() || 'Rack A · Drawer 1',
          onHandQuantity: Number(manualOnHandQty) || 0,
          unitCost: Number(manualUnitCost) || 0,
          mrp: Number(manualMrp) || 0,
          sellingPrice: Number(manualSellingPrice) || 0,
          minThreshold: Number(manualMinThreshold) || 20,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`✅ Registered ${manualBrandName} at ${manualDrawerLocation}!`);
        setAddManualProductModalOpen(false);
        await fetchStoreInventory(true);
        setManualBrandName('');
        setManualGenericName('');
      } else {
        showToast(`Failed: ${data.message}`);
      }
    } catch (err: any) {
      showToast('Error registering manual product.');
    } finally {
      setIsSubmittingManualProduct(false);
    }
  };

  // Wholesale Ordering Handlers
  const handleOpenComparison = async (med: any) => {
    setSelectedMedicine(med);
    setLoadingComparison(true);
    try {
      const res = await fetch(
        `${API_BASE}/recommendations?medicineId=${med.id}&quantity=${requestedQty}&pincode=${destinationPincode}`
      );
      const data = await res.json();
      if (data.success) setComparisonResults(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingComparison(false);
    }
  };

  const handlePlaceWholesaleOrder = async (candidateOffer: any) => {
    if (isPlacingOrder) return;
    setIsPlacingOrder(true);
    try {
      const res = await fetch(`${API_BASE}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: storeDetails.id || 'store-apollo-01',
          storeName: storeDetails.name || user?.name || 'Apollo Care Pharmacy',
          storeLicense: storeDetails.licenseNumber || user?.licenseNumber || 'DL-2024-MH-APO8821',
          storeAddress: storeDetails.address || user?.address || 'Colaba Causeway, Mumbai',
          storePhone: storeDetails.phone || user?.phone || '+91 98200 12345',
          storeCity: storeDetails.city || 'Mumbai',
          storeState: storeDetails.state || 'Maharashtra',
          storePincode: storeDetails.pincode || destinationPincode || '400001',
          distributorName: candidateOffer.distributorName,
          medicineId: selectedMedicine.id,
          medicineName: selectedMedicine.brandName,
          genericName: selectedMedicine.genericName,
          batchNumber: candidateOffer.batchNumber,
          quantity: requestedQty,
          unitPrice: candidateOffer.unitPrice,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Order #${data.order.orderNumber} placed! Batch reserved at ${candidateOffer.distributorName}.`);
        setSelectedMedicine(null);
        setComparisonResults(null);
        await fetchOrders(true);
        setProcurementSubTab('orders');
      } else {
        showToast(`Failed: ${data.message}`);
      }
    } catch (err) {
      showToast('Error placing order.');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const handleCancelWholesaleOrder = async (orderId: string, orderNumber: string) => {
    if (!confirm(`Cancel wholesale Order #${orderNumber}? This immediately releases distributor stock reservation.`)) return;
    setCancellingOrderId(orderId);
    try {
      const res = await fetch(`${API_BASE}/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'CANCELLED',
          rejectionReason: 'Cancelled by retail chemist before warehouse dispatch',
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Order #${orderNumber} cancelled. Batch released.`);
        await fetchOrders(true);
      }
    } catch (err) {
      showToast('Error cancelling order.');
    } finally {
      setCancellingOrderId(null);
    }
  };

  const handlePrintInvoice = () => {
    const printableElement = document.getElementById('form20-printable-invoice-portal');
    if (!printableElement) {
      window.print();
      return;
    }

    // Remove any stale print frame if present
    const oldFrame = document.getElementById('medlink_retail_print_frame');
    if (oldFrame) oldFrame.remove();

    // Create a fully visible isolated iframe (never use opacity: 0 as Chromium renders blank previews)
    const printFrame = document.createElement('iframe');
    printFrame.id = 'medlink_retail_print_frame';
    printFrame.name = 'medlink_retail_print_frame';
    printFrame.style.position = 'fixed';
    printFrame.style.top = '0';
    printFrame.style.left = '0';
    printFrame.style.width = '100vw';
    printFrame.style.height = '100vh';
    printFrame.style.zIndex = '999999';
    printFrame.style.backgroundColor = '#ffffff';
    printFrame.style.border = 'none';
    document.body.appendChild(printFrame);

    const frameDoc = printFrame.contentWindow?.document;
    if (!frameDoc) {
      window.print();
      return;
    }

    // Clone existing document stylesheets
    const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map((el) => el.outerHTML)
      .join('\n');

    frameDoc.open();
    frameDoc.write(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <title>Form 20 Statutory Retail Tax Invoice - ${storeDetails.name || 'Apollo Care Pharmacy'}</title>
          ${styles}
          <style>
            @page {
              size: A4 portrait;
              margin: 6mm 8mm;
            }
            *, *:before, *:after {
              box-sizing: border-box !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            html, body {
              margin: 0 !important;
              padding: 0 !important;
              background: #ffffff !important;
              color: #0f172a !important;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
              font-size: 11px !important;
              line-height: 1.35 !important;
              width: 100% !important;
              height: auto !important;
            }
            .print-a4-page {
              width: 100% !important;
              max-width: 190mm !important;
              margin: 0 auto 6mm auto !important;
              padding: 5mm 6mm !important;
              background: #ffffff !important;
              border: 1px solid #cbd5e1 !important;
              border-radius: 4px !important;
              box-sizing: border-box !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
            .print-page-break {
              page-break-after: always !important;
              break-after: page !important;
            }
            .print-no-break {
              page-break-after: avoid !important;
              break-after: avoid !important;
            }
            table {
              width: 100% !important;
              border-collapse: collapse !important;
            }
            th {
              background-color: #f1f5f9 !important;
              color: #0f172a !important;
              border: 1px solid #cbd5e1 !important;
              font-weight: 700 !important;
              font-size: 10px !important;
              padding: 4px 6px !important;
            }
            td {
              border: 1px solid #e2e8f0 !important;
              padding: 3.5px 6px !important;
              font-size: 10px !important;
            }
          </style>
        </head>
        <body>
          <div id="form20-printable-invoice-portal" style="width: 100%; max-width: 190mm; margin: 0 auto; padding: 2px;">
            ${printableElement.innerHTML}
          </div>
        </body>
      </html>
    `);
    frameDoc.close();

    setTimeout(() => {
      try {
        const cleanup = () => {
          if (document.body.contains(printFrame)) {
            printFrame.remove();
          }
        };
        printFrame.contentWindow?.addEventListener('afterprint', cleanup);
        printFrame.contentWindow?.focus();
        printFrame.contentWindow?.print();
        setTimeout(cleanup, 45000);
      } catch (e) {
        console.warn('Iframe print exception, using direct window.print fallback', e);
        if (document.body.contains(printFrame)) printFrame.remove();
        window.print();
      }
    }, 300);
  };

  const handleOpenWholesaleInvoice = async (order: any) => {
    setInvoiceModalOrder(order);
    try {
      const res = await fetch(`${API_BASE}/orders/${order.id}/invoice`);
      const data = await res.json();
      if (data.success) setInvoiceData(data.invoice);
    } catch (err) {
      console.error(err);
    }
  };

  const handlePrintWholesaleInvoice = () => {
    const printableElement = document.getElementById('wholesale-printable-invoice-card');
    if (!printableElement) {
      window.print();
      return;
    }
    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'fixed';
    printFrame.style.top = '-9999px';
    printFrame.style.left = '-9999px';
    printFrame.style.width = '0px';
    printFrame.style.height = '0px';
    printFrame.style.border = 'none';
    document.body.appendChild(printFrame);
    const frameDoc = printFrame.contentWindow?.document;
    if (!frameDoc) {
      window.print();
      return;
    }
    const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map((el) => el.outerHTML)
      .join('\n');
    frameDoc.open();
    frameDoc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Wholesale B2B Tax Invoice - MedLink</title>
          ${styles}
          <style>
            @page { size: A4 portrait; margin: 10mm; }
            body { background: #fff !important; color: #000 !important; font-family: sans-serif; padding: 15px; }
          </style>
        </head>
        <body>
          <div style="max-width: 600px; margin: 0 auto;">
            ${printableElement.innerHTML}
          </div>
        </body>
      </html>
    `);
    frameDoc.close();
    setTimeout(() => {
      try {
        printFrame.contentWindow?.focus();
        printFrame.contentWindow?.print();
      } catch {
        window.print();
      } finally {
        setTimeout(() => {
          if (document.body.contains(printFrame)) document.body.removeChild(printFrame);
        }, 1500);
      }
    }, 250);
  };

  const handleOpenRestockModal = async (alert: any) => {
    setRestockModalAlert(alert);
    const initialQty = Math.max(alert.suggestedRestockQuantity || 50, 10);
    setRestockAdjustedQty(initialQty);
    setLoadingRestockQuote(true);
    try {
      const res = await fetch(
        `${API_BASE}/recommendations?medicineId=${alert.medicineId}&quantity=${initialQty}&pincode=${destinationPincode}`
      );
      const data = await res.json();
      if (data.success) {
        setRestockQuote(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingRestockQuote(false);
    }
  };

  const handleConfirmRestockOrder = async () => {
    if (!restockModalAlert || !restockQuote?.recommendation) return;
    setIsSubmittingRestock(true);
    const rec = restockQuote.recommendation;
    try {
      const res = await fetch(`${API_BASE}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: storeDetails.id || 'store-apollo-01',
          storeName: storeDetails.name || user?.name || 'Apollo Care Pharmacy',
          storeLicense: storeDetails.licenseNumber || user?.licenseNumber || 'DL-2024-MH-APO8821',
          storeAddress: storeDetails.address || user?.address || 'Colaba Causeway, Mumbai',
          storePhone: storeDetails.phone || user?.phone || '+91 98200 12345',
          storeCity: storeDetails.city || 'Mumbai',
          storeState: storeDetails.state || 'Maharashtra',
          storePincode: storeDetails.pincode || destinationPincode || '400001',
          distributorName: rec.distributorName,
          medicineId: restockModalAlert.medicineId,
          medicineName: restockModalAlert.brandName,
          genericName: restockModalAlert.brandName,
          batchNumber: rec.batchNumber,
          quantity: restockAdjustedQty,
          unitPrice: rec.unitPrice,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`AI Restock PO #${data.order.orderNumber} sent to ${rec.distributorName}!`);
        setRestockModalAlert(null);
        await Promise.all([fetchOrders(true), fetchStockAlerts(true)]);
        setProcurementSubTab('orders');
      }
    } catch (err) {
      showToast('Error placing restock order.');
    } finally {
      setIsSubmittingRestock(false);
    }
  };

  // Filtered lists
  const filteredShelfInventory = storeInventory.filter((it) => {
    if (!inventorySearchQuery.trim()) return true;
    const q = inventorySearchQuery.toLowerCase();
    return (
      it.brandName?.toLowerCase().includes(q) ||
      it.genericName?.toLowerCase().includes(q) ||
      it.batchNumber?.toLowerCase().includes(q) ||
      it.drawerLocation?.toLowerCase().includes(q)
    );
  });

  const posAvailableMedicines = storeInventory.filter((it) => {
    const matchesCategory = posCategoryFilter === 'ALL' || (it.category && it.category.toLowerCase().includes(posCategoryFilter.toLowerCase()));
    if (!matchesCategory) return false;
    if (!posMedicineQuery.trim()) return true;
    const q = posMedicineQuery.toLowerCase();
    return (
      it.brandName?.toLowerCase().includes(q) ||
      it.genericName?.toLowerCase().includes(q) ||
      it.batchNumber?.toLowerCase().includes(q) ||
      it.drawerLocation?.toLowerCase().includes(q)
    );
  });

  const filteredBills = React.useMemo(() => {
    return bills.filter((b) => {
      // 1. Text Search query
      if (billSearchQuery.trim()) {
        const q = billSearchQuery.toLowerCase();
        const matches =
          b.billNumber?.toLowerCase().includes(q) ||
          b.customerName?.toLowerCase().includes(q) ||
          b.customerPhone?.toLowerCase().includes(q) ||
          b.doctorName?.toLowerCase().includes(q);
        if (!matches) return false;
      }

      // 2. Date Filter
      if (transactionDateFilter === 'ALL' && !filterStartDate && !filterEndDate) {
        return true;
      }

      const billDate = new Date(b.createdAt || Date.now());
      const now = new Date();

      const toLocalDate = (d: Date) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
      };

      const billStr = toLocalDate(billDate);
      const todayStr = toLocalDate(now);

      if (transactionDateFilter === 'TODAY') {
        return todayStr === billStr;
      }

      if (transactionDateFilter === 'YESTERDAY') {
        const yDate = new Date(now);
        yDate.setDate(yDate.getDate() - 1);
        const yStr = toLocalDate(yDate);
        return yStr === billStr;
      }

      if (transactionDateFilter === 'LAST_7_DAYS') {
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return billDate >= sevenDaysAgo;
      }

      if (transactionDateFilter === 'THIS_MONTH') {
        return (
          billDate.getFullYear() === now.getFullYear() &&
          billDate.getMonth() === now.getMonth()
        );
      }

      if (transactionDateFilter === 'CUSTOM' || filterStartDate || filterEndDate) {
        if (filterStartDate && billStr < filterStartDate) return false;
        if (filterEndDate && billStr > filterEndDate) return false;
      }

      return true;
    });
  }, [bills, billSearchQuery, transactionDateFilter, filterStartDate, filterEndDate]);

  // Real-time KPI Stats computed from filtered bills
  const filteredBillsStats = React.useMemo(() => {
    const totalSales = filteredBills.reduce((acc, b) => acc + (parseFloat(b.totalAmount) || 0), 0);
    const totalBills = filteredBills.length;
    const avgBill = totalBills > 0 ? totalSales / totalBills : 0;
    const totalDiscounts = filteredBills.reduce((acc, b) => acc + (parseFloat(b.discountAmount) || 0), 0);
    return {
      totalSales: parseFloat(totalSales.toFixed(2)),
      totalBills,
      avgBill: parseFloat(avgBill.toFixed(2)),
      totalDiscounts: parseFloat(totalDiscounts.toFixed(2)),
    };
  }, [filteredBills]);

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center text-sm text-slate-500">
        <RefreshCw className="w-5 h-5 animate-spin mx-auto text-[#00875a]" />
      </div>
    );
  }

  // ==========================================
  // AUTH GUARD: DEDICATED STORE LOGIN SCREEN
  // ==========================================
  if (!user) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
        <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
          <div className="w-14 h-14 rounded-lg bg-[#00875a] flex items-center justify-center text-white mx-auto shadow-md mb-3 text-2xl font-black">
            +
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">
            MedLink POS Portal
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Chemist Counter Suite & Point of Sale System
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
          <div className="bg-white py-8 px-6 shadow-sm border border-slate-200/90 rounded-lg sm:px-10">
            {authError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{authError}</span>
              </div>
            )}

            <form onSubmit={handleCustomLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Chemist Email or Terminal Operator Email / Username
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="apollo.chemist@medlink.io, terminal2@apollocare.com, or terminal2"
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#00875a]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#00875a]"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-[#00875a] hover:bg-[#007048] text-white rounded-xl text-sm font-bold transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                <span>Sign In to Pharmacy Desk</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-slate-100 space-y-2">
              <span className="text-xs text-slate-400 font-bold block mb-1">1-Click Fast Multi-Terminal Switch:</span>
              <button
                type="button"
                onClick={() => handleQuickLogin('MEDICAL_STORE')}
                className="w-full py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-[#006644] border border-emerald-200 rounded-xl text-xs font-bold transition flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-1.5 truncate">
                  <Check className="w-4 h-4 text-[#00875a] shrink-0" />
                  <span className="truncate">Store Owner: Dr. Ramesh Patil</span>
                </div>
                <span className="text-[10px] bg-emerald-200/60 px-1.5 py-0.5 rounded font-mono shrink-0">Owner</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('TERMINAL_2')}
                className="w-full py-2 px-3 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-xl text-xs font-bold transition flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-1.5 truncate">
                  <span className="w-2 h-2 rounded-full bg-blue-500 inline-block shrink-0" />
                  <span className="truncate">Counter #2: Suresh (terminal2@apollocare.com)</span>
                </div>
                <span className="text-[10px] bg-blue-200/60 px-1.5 py-0.5 rounded font-mono shrink-0">Terminal</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('TERMINAL_3')}
                className="w-full py-2 px-3 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 rounded-xl text-xs font-bold transition flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-1.5 truncate">
                  <span className="w-2 h-2 rounded-full bg-purple-500 inline-block shrink-0" />
                  <span className="truncate">Counter #3: Pooja (terminal3@apollocare.com)</span>
                </div>
                <span className="text-[10px] bg-purple-200/60 px-1.5 py-0.5 rounded font-mono shrink-0">Terminal</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // PIXEL-PERFECT WORKING UI
  // ==========================================
  return (
    <div className="min-h-screen lg:h-screen lg:overflow-hidden bg-[#f8fafc] flex flex-col lg:flex-row font-sans text-slate-900 antialiased">
      {/* Toast Notification - Small, Modern Minimalist Look at Top-Right */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 max-w-sm bg-slate-900/95 backdrop-blur-md text-white px-3.5 py-2 rounded-lg shadow-xl text-xs font-semibold flex items-center gap-2.5 border border-emerald-500/30 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 animate-pulse" />
          <span className="flex-1 pr-1 truncate">{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="p-0.5 text-slate-400 hover:text-white rounded transition cursor-pointer shrink-0"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* ========================================== */}
      {/* 1. LEFT SIDEBAR (COLLAPSIBLE / ICON-ONLY) */}
      {/* ========================================== */}
      <aside
        className={`${
          isSidebarCollapsed ? 'w-full lg:w-20 p-2.5' : 'w-full lg:w-64 p-4'
        } bg-white border-r border-slate-200/90 flex flex-col justify-between shrink-0 shadow-2xs z-30 transition-all duration-300 ease-in-out`}
      >
        <div>
          {/* Logo Header & Collapse/Expand Toggle */}
          {!isSidebarCollapsed ? (
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-[#00875a] flex items-center justify-center text-white text-2xl font-black shadow-xs shrink-0 select-none">
                  +
                </div>
                <div className="min-w-0">
                  <span className="font-extrabold text-base tracking-tight text-slate-900 block leading-tight truncate">
                    MedLink POS
                  </span>
                  <span className="text-xs text-slate-400 font-medium block truncate">Chemist Counter Suite</span>
                </div>
              </div>
              <button
                type="button"
                onClick={toggleSidebar}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer shrink-0"
                title="Collapse sidebar into icon-only mode"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center pb-3 border-b border-slate-100">
              <button
                type="button"
                onClick={toggleSidebar}
                className="w-11 h-11 rounded-lg bg-[#00875a] hover:bg-[#007048] flex items-center justify-center text-white font-black shadow-xs transition group cursor-pointer relative"
                title="Click to expand sidebar"
              >
                <span className="text-2xl group-hover:hidden leading-none mb-0.5 select-none">+</span>
                <PanelLeftOpen className="w-5 h-5 hidden group-hover:block" />
              </button>
            </div>
          )}

          {/* Navigation List */}
          <nav className="mt-4 space-y-1.5">
            {/* 1. POS Billing Counter */}
            <button
              type="button"
              onClick={() => setActiveTab('pos')}
              className={`w-full flex items-center transition cursor-pointer relative group rounded-xl text-xs ${
                isSidebarCollapsed ? 'justify-center p-2.5' : 'justify-between px-3 py-2.5'
              } ${
                activeTab === 'pos'
                  ? 'bg-[#00875a]/10 text-[#006644] font-bold border border-[#00875a]/25 shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-semibold border border-transparent'
              }`}
              title="POS Billing Counter"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <ShoppingCart className={`w-4.5 h-4.5 shrink-0 transition-colors ${activeTab === 'pos' ? 'text-[#00875a]' : 'text-slate-400 group-hover:text-slate-600'}`} />
                {!isSidebarCollapsed && <span className="truncate">POS Billing</span>}
              </div>
              {!isSidebarCollapsed && cart.length > 0 && (
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold shrink-0 tracking-tight transition-colors ${
                  activeTab === 'pos'
                    ? 'bg-[#00875a]/15 text-[#006644] border border-[#00875a]/30'
                    : 'bg-slate-100 text-slate-600 border border-slate-200/60'
                }`}>
                  {cart.length}
                </span>
              )}
              {isSidebarCollapsed && cart.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#00875a] ring-2 ring-white" />
              )}
              {isSidebarCollapsed && (
                <span className="pointer-events-none absolute left-full ml-3 hidden group-hover:flex items-center px-2.5 py-1 bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-xl whitespace-nowrap z-50">
                  POS Billing Counter {cart.length > 0 ? `(${cart.length} in cart)` : ''}
                </span>
              )}
            </button>

            {/* 2. Shelf Stock Inventory */}
            <button
              type="button"
              onClick={() => setActiveTab('inventory')}
              className={`w-full flex items-center transition cursor-pointer relative group rounded-xl text-xs ${
                isSidebarCollapsed ? 'justify-center p-2.5' : 'justify-between px-3 py-2.5'
              } ${
                activeTab === 'inventory'
                  ? 'bg-[#00875a]/10 text-[#006644] font-bold border border-[#00875a]/25 shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-semibold border border-transparent'
              }`}
              title="Shelf Stock Inventory"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Boxes className={`w-4.5 h-4.5 shrink-0 transition-colors ${activeTab === 'inventory' ? 'text-[#00875a]' : 'text-slate-400 group-hover:text-slate-600'}`} />
                {!isSidebarCollapsed && <span className="truncate">Shelf Stock</span>}
              </div>
              {!isSidebarCollapsed && (
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold shrink-0 tracking-tight transition-colors ${
                  activeTab === 'inventory'
                    ? 'bg-[#00875a]/15 text-[#006644] border border-[#00875a]/30'
                    : 'bg-slate-100 text-slate-600 border border-slate-200/60 group-hover:bg-slate-200/70 group-hover:text-slate-800'
                }`}>
                  {storeInventory.length || 17}
                </span>
              )}
              {isSidebarCollapsed && (
                <span className="pointer-events-none absolute left-full ml-3 hidden group-hover:flex items-center px-2.5 py-1 bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-xl whitespace-nowrap z-50">
                  Shelf Stock ({storeInventory.length || 17} SKUs)
                </span>
              )}
            </button>

            {/* 3. Sales & Estimates */}
            <button
              type="button"
              onClick={() => setActiveTab('transactions')}
              className={`w-full flex items-center transition cursor-pointer relative group rounded-xl text-xs ${
                isSidebarCollapsed ? 'justify-center p-2.5' : 'justify-between px-3 py-2.5'
              } ${
                activeTab === 'transactions'
                  ? 'bg-[#00875a]/10 text-[#006644] font-bold border border-[#00875a]/25 shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-semibold border border-transparent'
              }`}
              title="Sales Transactions & Monthly Estimates"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <TrendingUp className={`w-4.5 h-4.5 shrink-0 transition-colors ${activeTab === 'transactions' ? 'text-[#00875a]' : 'text-slate-400 group-hover:text-slate-600'}`} />
                {!isSidebarCollapsed && <span className="truncate">Sales & Estimates</span>}
              </div>
              {!isSidebarCollapsed && (
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold shrink-0 tracking-tight transition-colors ${
                  activeTab === 'transactions'
                    ? 'bg-[#00875a]/15 text-[#006644] border border-[#00875a]/30'
                    : 'bg-slate-100 text-slate-600 border border-slate-200/60 group-hover:bg-slate-200/70 group-hover:text-slate-800'
                }`}>
                  ₹{monthlyStats.todaySales.toLocaleString('en-IN')}
                </span>
              )}
              {isSidebarCollapsed && (
                <span className="pointer-events-none absolute left-full ml-3 hidden group-hover:flex items-center px-2.5 py-1 bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-xl whitespace-nowrap z-50">
                  Sales Ledger (Today: ₹{monthlyStats.todaySales.toLocaleString('en-IN')})
                </span>
              )}
            </button>

            {/* 4. Wholesale Orders */}
            {user?.isTerminal ? (
              <button
                type="button"
                onClick={() => showToast('Wholesale Orders are restricted to the Pharmacy License Owner.')}
                className={`w-full flex items-center text-slate-400 hover:bg-slate-50 transition cursor-not-allowed opacity-60 relative group rounded-xl text-xs ${
                  isSidebarCollapsed ? 'justify-center p-2.5' : 'justify-between px-3 py-2.5 font-semibold'
                }`}
                title="Wholesale Orders (Owner Access Only)"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Truck className="w-4.5 h-4.5 shrink-0 text-slate-400" />
                  {!isSidebarCollapsed && <span className="truncate">Wholesale Orders</span>}
                </div>
                {!isSidebarCollapsed && (
                  <span className="flex items-center gap-1 text-[10px] font-mono font-bold bg-slate-100 text-slate-500 border border-slate-200/60 px-2 py-0.5 rounded-md shrink-0">
                    <Lock className="w-3 h-3" />
                    <span>Owner</span>
                  </span>
                )}
                {isSidebarCollapsed && (
                  <span className="pointer-events-none absolute left-full ml-3 hidden group-hover:flex items-center px-2.5 py-1 bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-xl whitespace-nowrap z-50">
                    Wholesale Orders (Owner Only)
                  </span>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setActiveTab('procurement')}
                className={`w-full flex items-center transition cursor-pointer relative group rounded-xl text-xs ${
                  isSidebarCollapsed ? 'justify-center p-2.5' : 'justify-between px-3 py-2.5'
                } ${
                  activeTab === 'procurement'
                    ? 'bg-[#00875a]/10 text-[#006644] font-bold border border-[#00875a]/25 shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-semibold border border-transparent'
                }`}
                title="Wholesale Orders & Central Quotes"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Truck className={`w-4.5 h-4.5 shrink-0 transition-colors ${activeTab === 'procurement' ? 'text-[#00875a]' : 'text-slate-400 group-hover:text-slate-600'}`} />
                  {!isSidebarCollapsed && <span className="truncate">Wholesale Orders</span>}
                </div>
                {!isSidebarCollapsed && (
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold shrink-0 tracking-tight transition-colors ${
                    activeTab === 'procurement'
                      ? 'bg-[#00875a]/15 text-[#006644] border border-[#00875a]/30'
                      : 'bg-slate-100 text-slate-600 border border-slate-200/60 group-hover:bg-slate-200/70 group-hover:text-slate-800'
                  }`}>
                    7
                  </span>
                )}
                {isSidebarCollapsed && (
                  <span className="pointer-events-none absolute left-full ml-3 hidden group-hover:flex items-center px-2.5 py-1 bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-xl whitespace-nowrap z-50">
                    Wholesale Orders (7 Restock Alerts)
                  </span>
                )}
              </button>
            )}

            {/* 5. Store Settings */}
            {user?.isTerminal ? (
              <button
                type="button"
                onClick={() => showToast('Store Settings and Terminal Management are restricted to the Pharmacy License Owner.')}
                className={`w-full flex items-center text-slate-400 hover:bg-slate-50 transition cursor-not-allowed opacity-60 relative group rounded-xl text-xs ${
                  isSidebarCollapsed ? 'justify-center p-2.5' : 'justify-between px-3 py-2.5 font-semibold'
                }`}
                title="Store Settings (Owner Access Only)"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Settings className="w-4.5 h-4.5 shrink-0 text-slate-400" />
                  {!isSidebarCollapsed && <span className="truncate">Store Settings</span>}
                </div>
                {!isSidebarCollapsed && (
                  <span className="flex items-center gap-1 text-[10px] font-mono font-bold bg-slate-100 text-slate-500 border border-slate-200/60 px-2 py-0.5 rounded-md shrink-0">
                    <Lock className="w-3 h-3" />
                    <span>Owner</span>
                  </span>
                )}
                {isSidebarCollapsed && (
                  <span className="pointer-events-none absolute left-full ml-3 hidden group-hover:flex items-center px-2.5 py-1 bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-xl whitespace-nowrap z-50">
                    Store Settings (Owner Only)
                  </span>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setActiveTab('settings')}
                className={`w-full flex items-center transition cursor-pointer relative group rounded-xl text-xs ${
                  isSidebarCollapsed ? 'justify-center p-2.5' : 'justify-between px-3 py-2.5'
                } ${
                  activeTab === 'settings'
                    ? 'bg-[#00875a]/10 text-[#006644] font-bold border border-[#00875a]/25 shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-semibold border border-transparent'
                }`}
                title="Store Settings & Terminal Management"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Settings className={`w-4.5 h-4.5 shrink-0 transition-colors ${activeTab === 'settings' ? 'text-[#00875a]' : 'text-slate-400 group-hover:text-slate-600'}`} />
                  {!isSidebarCollapsed && <span className="truncate">Store Settings</span>}
                </div>
                {!isSidebarCollapsed && (
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold shrink-0 tracking-tight transition-colors ${
                    activeTab === 'settings'
                      ? 'bg-[#00875a]/15 text-[#006644] border border-[#00875a]/30'
                      : 'bg-slate-100 text-slate-600 border border-slate-200/60 group-hover:bg-slate-200/70 group-hover:text-slate-800'
                  }`}>
                    {storeTerminals.length} Counters
                  </span>
                )}
                {isSidebarCollapsed && (
                  <span className="pointer-events-none absolute left-full ml-3 hidden group-hover:flex items-center px-2.5 py-1 bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-xl whitespace-nowrap z-50">
                    Store Settings ({storeTerminals.length} Counters, {storeShelfLocations.length} Racks)
                  </span>
                )}
              </button>
            )}

            {/* 6. AI Demand Forecast */}
            <Link
              href="/ai-forecast"
              className={`w-full flex items-center transition relative group rounded-xl text-xs ${
                isSidebarCollapsed ? 'justify-center p-2.5' : 'justify-between px-3 py-2.5'
              } text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-semibold border border-transparent`}
              title="AI Demand Forecast (14-Day)"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Sparkles className="w-4.5 h-4.5 text-slate-400 group-hover:text-slate-600 shrink-0 transition-colors" />
                {!isSidebarCollapsed && <span className="truncate whitespace-nowrap">AI Demand Forecast</span>}
              </div>
              {!isSidebarCollapsed && (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold shrink-0 tracking-tight bg-slate-100 text-slate-600 border border-slate-200/60 group-hover:bg-slate-200/70 group-hover:text-slate-800 transition-colors">
                  14-Day
                </span>
              )}
              {isSidebarCollapsed && (
                <span className="pointer-events-none absolute left-full ml-3 hidden group-hover:flex items-center px-2.5 py-1 bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-xl whitespace-nowrap z-50">
                  AI Demand Forecast (14-Day)
                </span>
              )}
            </Link>
          </nav>
        </div>

        {/* Bottom Store Profile Box & Actions */}
        {!isSidebarCollapsed ? (
          <div className="pt-4 border-t border-slate-100 space-y-2">
            {user?.isTerminal ? (
              <div className="bg-blue-50/70 border border-blue-200/90 rounded-lg p-3 shadow-2xs">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse shrink-0" />
                    <span className="text-xs font-mono font-extrabold text-blue-900 truncate">
                      {user.terminalCode || 'COUNTER-02'} Active
                    </span>
                  </div>
                </div>
                <span className="font-extrabold text-sm text-slate-900 truncate block">
                  {user.operatorName}
                </span>
                <span className="text-[11px] text-slate-500 font-medium block truncate">
                  {user.name}
                </span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setActiveTab('settings')}
                className="w-full text-left bg-white hover:bg-slate-50 border border-slate-200/80 rounded-lg p-3 shadow-2xs transition group cursor-pointer block"
                title="Click to edit Store Profile & Physical Shelves in Settings"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2 truncate">
                    <Store className="w-4 h-4 text-[#00875a] shrink-0" />
                    <span className="font-extrabold text-sm text-slate-900 truncate block group-hover:text-[#00875a] transition">
                      {user?.name || 'Apollo Care Pharmacy'}
                    </span>
                  </div>
                  <Settings className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#00875a] transition shrink-0" />
                </div>
                <span className="text-[11px] text-slate-400 font-mono block">Lic: {user?.licenseNumber || 'DL-2024-MH-APO8821'}</span>
                <span className="text-[11px] text-slate-400 font-mono block">Pin: {destinationPincode}</span>
              </button>
            )}

            <div className="pt-1">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full py-2 px-3 bg-slate-50 hover:bg-rose-50 hover:text-rose-600 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="pt-3 border-t border-slate-100 flex flex-col items-center gap-2">
            {user?.isTerminal ? (
              <div
                className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-800 text-xs font-bold relative group cursor-pointer"
                title={`Terminal: ${user.operatorName} (${user.terminalCode})`}
              >
                <span>{user.operatorName?.[0] || 'C'}</span>
                <span className="pointer-events-none absolute left-full ml-3 hidden group-hover:flex items-center px-2.5 py-1 bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-xl whitespace-nowrap z-50">
                  {user.operatorName} ({user.terminalCode})
                </span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => { setActiveTab('settings'); }}
                className="w-10 h-10 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200/80 flex items-center justify-center text-[#00875a] transition group cursor-pointer relative"
                title={`Pharmacy: ${user?.name || 'Apollo Care Pharmacy'} (Click for Settings)`}
              >
                <Store className="w-4 h-4" />
                <span className="pointer-events-none absolute left-full ml-3 hidden group-hover:flex items-center px-2.5 py-1 bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-xl whitespace-nowrap z-50">
                  {user?.name || 'Pharmacy Settings'}
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={handleLogout}
              className="w-10 h-10 rounded-xl bg-slate-50 hover:bg-rose-50 hover:text-rose-600 border border-slate-200 text-slate-600 flex items-center justify-center transition cursor-pointer relative group"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
              <span className="pointer-events-none absolute left-full ml-3 hidden group-hover:flex items-center px-2.5 py-1 bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-xl whitespace-nowrap z-50">
                Sign Out
              </span>
            </button>
          </div>
        )}
      </aside>

      {/* ========================================== */}
      {/* 2. MAIN VIEW AREA (EXACT SAME AS IMAGES)   */}
      {/* ========================================== */}
      <div className="flex-1 flex flex-col lg:h-screen lg:overflow-hidden min-w-0 no-print">
        {/* Top Header Bar */}
        <header className="py-3 px-5 sm:px-6 flex items-center justify-between shrink-0 bg-transparent">
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 leading-tight">
              {activeTab === 'pos' && 'Good Morning, Shreyash 👋'}
              {activeTab === 'inventory' && 'Store Shelf Stock & Formulations'}
              {activeTab === 'transactions' && (
                <span>
                  Sales Transactions Ledger & Revenue{' '}
                  <span className="text-[#00875a] text-sm font-bold ml-1.5">● PostgreSQL Relational DB</span>
                </span>
              )}
              {activeTab === 'procurement' && 'Wholesale Procurement & Supplier Allocation'}
              {activeTab === 'settings' && (
                <span>
                  Pharmacy Settings &amp; Physical Rack Directory{' '}
                  <span className="text-[#00875a] text-sm font-bold ml-1.5">● PostgreSQL</span>
                </span>
              )}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {activeTab === 'pos' && (user?.isTerminal ? `Counter POS Desk: ${user.operatorName} (${user.terminalCode})` : "Let's keep healthcare accessible.")}
              {activeTab === 'inventory' && 'Manage your pharmacy inventory and shelf availability'}
              {activeTab === 'transactions' && 'Track your sales, bills and revenue with detailed transaction history'}
              {activeTab === 'procurement' && 'Central procurement quotes and distributor orders fulfillment'}
              {activeTab === 'settings' && 'Configure medical store licenses, pharmacy credentials and physical shop drawers'}
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Real-time Ticking Clock */}
            <div className="bg-white border border-slate-200/90 rounded-lg px-3.5 py-1.5 text-xs text-slate-700 font-semibold flex items-center gap-2 shadow-2xs">
              <Clock className="w-3.5 h-3.5 text-[#00875a]" />
              <span className="font-mono">
                {currentDateTime.toLocaleDateString('en-IN', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}{' '}
                ·{' '}
                {currentDateTime.toLocaleTimeString('en-IN', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                  hour12: true,
                })}
              </span>
            </div>

            <div
              className={`border rounded-lg px-3.5 py-1.5 text-xs font-semibold flex items-center gap-2 shadow-2xs ${
                user?.isTerminal
                  ? 'bg-blue-50 border-blue-200 text-blue-900'
                  : 'bg-white border-slate-200/90 text-slate-700'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full inline-block ${
                  user?.isTerminal ? 'bg-blue-600 animate-pulse' : 'bg-[#10b981]'
                }`}
              />
              <span>
                {user?.isTerminal
                  ? `${user.terminalCode || 'Counter 02'}: ${user.operatorName || 'Cashier'}`
                  : 'Retail Chemist Desk Active (Owner)'}
              </span>
            </div>

            {/* Real-time Notification Center */}
            <NotificationCenter
              role="store"
              inventory={storeInventory}
              orders={orders}
              indents={indentRequests}
              onAction={handleNotificationAction}
            />

            <div className="w-8 h-8 rounded-full bg-[#e0e7ff] text-[#4338ca] font-extrabold text-xs flex items-center justify-center shadow-2xs">
              {user?.isTerminal ? (user.operatorName?.[0] || 'C') : 'S'}
            </div>
          </div>
        </header>

        {/* Content Body */}
        <div className="flex-1 lg:overflow-hidden px-5 pb-5 pt-1">
          {/* ========================================================================= */}
          {/* VIEW 1: POS BILLING COUNTER (MATCHES IMAGE 1 media_1793442284337_ae8dcffc) */}
          {/* ========================================================================= */}
          {activeTab === 'pos' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-full lg:overflow-hidden">
              {/* LEFT 8 COLUMNS: CUSTOMER DETAILS + MEDICINE PICKER */}
              <div className="lg:col-span-8 flex flex-col gap-3.5 h-full lg:overflow-hidden">
                {/* 1. Customer Details Card */}
                <div className="bg-white border border-slate-200/90 rounded-lg p-4 shadow-2xs shrink-0">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-xl bg-[#00875a] text-white flex items-center justify-center shadow-xs">
                        <User className="w-4 h-4" />
                      </div>
                      <span className="font-extrabold text-sm text-slate-900">Customer Details</span>
                    </div>

                    <button
                      type="button"
                      onClick={handleClearCustomer}
                      className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 cursor-pointer"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>+ New Customer</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 relative" ref={customerDropdownRef}>
                    {/* Customer Name input with live autocomplete */}
                    <div className="relative">
                      <div className="relative">
                        <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          value={customerName}
                          onChange={(e) => handleCustomerNameChange(e.target.value)}
                          onFocus={() => {
                            if (customerSuggestions.length > 0) setShowCustomerDropdown(true);
                          }}
                          placeholder="Customer name (e.g. Amit Patil)"
                          className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#00875a]"
                        />
                      </div>

                      {/* Matching Customers Dropdown */}
                      {showCustomerDropdown && customerSuggestions.length > 0 && (
                        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-2xl z-50 max-h-56 overflow-y-auto divide-y divide-slate-100">
                          <div className="p-2 bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3">
                            Registered Patients
                          </div>
                          {customerSuggestions.map((cust) => (
                            <button
                              key={cust.id}
                              type="button"
                              onClick={() => handleSelectCustomer(cust)}
                              className="w-full text-left p-3 hover:bg-[#e6f7ef]/60 transition flex items-center justify-between text-xs cursor-pointer"
                            >
                              <div>
                                <span className="font-bold text-slate-900 block text-sm">{cust.name}</span>
                                <span className="text-slate-500 font-mono text-[11px]">📱 {cust.phone}</span>
                                {cust.doctorName && (
                                  <span className="text-slate-400 block text-[10px]">Dr: {cust.doctorName}</span>
                                )}
                              </div>
                              <span className="text-[10px] font-bold text-[#006644] bg-[#e6f7ef] border border-emerald-200 px-2.5 py-1 rounded-lg">
                                Select
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Mobile Number */}
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="Mobile (+91 98200...)"
                        className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-mono text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#00875a]"
                      />
                    </div>

                    {/* Prescribing Doctor */}
                    <div className="relative">
                      <Stethoscope className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={customerDoctor}
                        onChange={(e) => setCustomerDoctor(e.target.value)}
                        placeholder="Prescribing doctor (optional)"
                        className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#00875a]"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Medicine Picker Section */}
                <div className="flex-1 bg-white border border-slate-200/90 rounded-lg p-4 shadow-2xs flex flex-col lg:overflow-hidden min-h-[260px]">
                  {/* Search bar & Category */}
                  <div className="flex items-center gap-3 mb-3 shrink-0">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
                      <input
                        type="text"
                        value={posMedicineQuery}
                        onChange={(e) => setPosMedicineQuery(e.target.value)}
                        placeholder="Search medicine by brand, generic name or salt..."
                        className="w-full pl-10 pr-9 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#00875a]"
                      />
                      <Scan className="w-4 h-4 text-slate-400 absolute right-3.5 top-2.5 cursor-pointer" />
                    </div>

                    <select
                      value={posCategoryFilter}
                      onChange={(e) => setPosCategoryFilter(e.target.value)}
                      className="bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
                    >
                      <option value="ALL">All Categories</option>
                      <option value="Cardiovascular">Cardiovascular</option>
                      <option value="Respiratory">Respiratory</option>
                      <option value="Antibiotic">Antibiotic</option>
                      <option value="Analgesic">Analgesic</option>
                      <option value="Antacid">Antacid</option>
                      <option value="Antidiabetic">Antidiabetic</option>
                    </select>
                  </div>

                  {/* Medicines Table */}
                  <div className="flex-1 border border-slate-100 rounded-xl overflow-y-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="bg-[#f8fafc] text-slate-500 font-bold border-b border-slate-100 sticky top-0 z-10">
                        <tr>
                          <th className="py-2.5 px-3">Medicine / Formulation</th>
                          <th className="py-2.5 px-3">Batch & Expiry</th>
                          <th className="py-2.5 px-3 text-right">MRP (₹)</th>
                          <th className="py-2.5 px-3 text-center">Stock</th>
                          <th className="py-2.5 px-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-sm">
                        {posAvailableMedicines.map((item) => {
                          const isOutOfStock = item.onHandQuantity <= 0;
                          return (
                            <tr key={item.id} className="hover:bg-slate-50/70 transition">
                              <td className="py-2.5 px-3">
                                <div className="flex items-center gap-3">
                                  <MedicineIcon name={item.brandName} />
                                  <div>
                                    <span className="font-extrabold text-slate-900 block text-sm leading-snug">
                                      {item.brandName}
                                    </span>
                                    <span className="text-xs text-slate-400 font-medium">
                                      {item.genericName} · {item.dosageForm}
                                    </span>
                                  </div>
                                </div>
                              </td>
                              <td className="py-2.5 px-3 font-mono text-xs">
                                <span className="font-bold text-slate-800 block text-xs">{item.batchNumber}</span>
                                <span className="text-slate-400 text-[11px] block">Exp: {item.expiryDate}</span>
                                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-bold mt-0.5">
                                  <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                                  <span>{item.drawerLocation || 'Rack A · Drawer 1'}</span>
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-right font-extrabold font-mono text-slate-900 text-sm">
                                ₹{parseFloat(item.sellingPrice || item.mrp).toFixed(2)}
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <span
                                  className={`inline-block px-3 py-1 rounded-xl text-xs font-bold ${
                                    isOutOfStock
                                      ? 'bg-rose-50 text-rose-700'
                                      : item.onHandQuantity < 50
                                      ? 'bg-[#fff0b3] text-[#172b4d]'
                                      : 'bg-[#e6f7ef] text-[#006644]'
                                  }`}
                                >
                                  {item.onHandQuantity} units
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-right">
                                <button
                                  type="button"
                                  disabled={isOutOfStock}
                                  onClick={() => handleAddToCart(item)}
                                  className="px-4 py-1.5 bg-[#004733] hover:bg-[#003828] disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl text-xs font-extrabold transition cursor-pointer shadow-xs"
                                >
                                  + Add
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* RIGHT 4 COLUMNS: CURRENT BILL (MATCHES IMAGE 1 EXACTLY!) */}
              <div className="lg:col-span-4 bg-white border border-slate-200/90 rounded-lg p-5 shadow-2xs flex flex-col h-full lg:overflow-hidden justify-between">
                <div>
                  {/* Bill Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <ShoppingCart className="w-5 h-5 text-[#00875a]" />
                      <span className="font-extrabold text-base text-slate-900">Current Bill</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-500">Tax Invoice</span>
                      <button
                        type="button"
                        onClick={() => setTaxInvoiceToggle(!taxInvoiceToggle)}
                        className={`w-9 h-5 rounded-full p-0.5 transition cursor-pointer ${
                          taxInvoiceToggle ? 'bg-[#004733]' : 'bg-slate-300'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-full bg-white transition transform ${
                            taxInvoiceToggle ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                      <MoreVertical className="w-4 h-4 text-slate-400 cursor-pointer ml-1" />
                    </div>
                  </div>

                  {/* Empty state or line items list */}
                  {cart.length === 0 ? (
                    <div className="py-14 text-center">
                      <div className="w-16 h-16 rounded-full bg-[#e6f7ef] flex items-center justify-center text-[#00875a] mx-auto mb-3.5">
                        <ShoppingCart className="w-7 h-7" />
                      </div>
                      <h3 className="text-base font-extrabold text-slate-900">Your counter cart is empty</h3>
                      <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto leading-relaxed">
                        Search and add medicines from the list to begin creating an invoice.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          const el = document.querySelector('input[placeholder*="Search medicine"]') as HTMLInputElement;
                          el?.focus();
                        }}
                        className="bg-[#e6f7ef] hover:bg-[#d3f3e4] text-[#006644] font-bold text-xs py-2 px-5 rounded-xl flex items-center justify-center gap-2 mx-auto mt-4 transition cursor-pointer"
                      >
                        <Search className="w-3.5 h-3.5" />
                        <span>Search medicines</span>
                      </button>
                      <p className="text-[11px] text-slate-400 mt-2.5 font-medium">or scan a barcode to add quickly</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1 mt-3">
                      {cart.map((item, idx) => {
                        const lineTotal = item.quantity * item.sellingPrice * (1 - (item.discountPercent || 0) / 100);
                        return (
                          <div
                            key={`${item.storeInventoryId}-${idx}`}
                            className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between gap-2"
                          >
                            <div className="flex-1 min-w-0">
                              <span className="font-extrabold text-sm text-slate-900 truncate block">
                                {item.brandName}
                              </span>
                              <span className="text-[11px] text-slate-400 font-mono">
                                {item.batchNumber} · ₹{item.sellingPrice.toFixed(2)}
                              </span>
                            </div>

                            {/* Quantity Controls */}
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleUpdateCartQty(idx, item.quantity - 1)}
                                className="w-6 h-6 bg-white border border-slate-300 rounded-lg flex items-center justify-center text-slate-700 hover:bg-slate-100 cursor-pointer"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="w-6 text-center font-extrabold text-sm text-slate-900">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleUpdateCartQty(idx, item.quantity + 1)}
                                className="w-6 h-6 bg-white border border-slate-300 rounded-lg flex items-center justify-center text-slate-700 hover:bg-slate-100 cursor-pointer"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>

                            <div className="text-right shrink-0">
                              <span className="font-mono font-extrabold text-sm text-slate-900 block">
                                ₹{lineTotal.toFixed(2)}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleRemoveCartItem(idx)}
                                className="text-slate-400 hover:text-rose-600 mt-0.5 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Bottom Summary: Clean Alignment Showing Price, Discount (% only), Tax (GST) & Total Amount */}
                <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600 font-medium">
                    <span>Price</span>
                    <span className="font-mono font-semibold text-slate-900">₹{cartSubtotal.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between text-slate-600 font-medium">
                    <span>Discount {activePromoPercent > 0 ? `(${activePromoPercent}% OFF)` : ''}</span>
                    <span className="font-mono font-semibold text-[#00875a]">
                      {totalDiscount > 0 ? `-₹${totalDiscount.toFixed(2)}` : '₹0.00'}
                    </span>
                  </div>

                  <div className="flex justify-between text-slate-600 font-medium">
                    <span>Tax (GST {taxInvoiceToggle ? '12%' : '0%'})</span>
                    <span className="font-mono font-semibold text-slate-900">₹{totalTaxAmount.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between items-center text-base font-extrabold text-slate-900 pt-2 border-t border-slate-100">
                    <span className="text-base font-bold text-slate-900">Total Amount</span>
                    <span className="text-2xl font-black font-mono text-slate-900">
                      ₹{grandTotal.toFixed(2)}
                    </span>
                  </div>

                  <button
                    type="button"
                    disabled={isCheckingOut || cart.length === 0}
                    onClick={handleOpenCheckoutPayment}
                    className="w-full mt-3 py-3 bg-[#004733] hover:bg-[#003828] disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl text-sm font-extrabold transition flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:cursor-not-allowed"
                  >
                    {isCheckingOut ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-white" />
                        <span>Processing Bill &amp; Receipt...</span>
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4" />
                        <span>Proceed to Payment (₹{grandTotal.toFixed(2)})</span>
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* VIEW 2: SHELF STOCK INVENTORY (MATCHES IMAGE 2 media_1793442284339_8a737661) */}
          {/* ========================================================================= */}
          {activeTab === 'inventory' && (
            <div className="h-full flex flex-col bg-white border border-slate-200/90 rounded-lg p-5 shadow-2xs">
              <div className="flex flex-wrap justify-between items-center gap-3 pb-4 border-b border-slate-100 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#00875a] text-white flex items-center justify-center shadow-xs">
                    <Boxes className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-slate-900 leading-tight">
                      Current Store Shelf Stock
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Physical inventory available on pharmacy shelves for counter retail dispensing
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={inventorySearchQuery}
                      onChange={(e) => setInventorySearchQuery(e.target.value)}
                      placeholder="Search by brand, generic, or drawer (e.g. Rack A)..."
                      className="pl-9 pr-9 py-2 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#00875a] w-72"
                    />
                    <Scan className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setManualBrandName('');
                      setManualGenericName('');
                      setManualCategory('General Medicine');
                      setManualDosageForm('TABLET');
                      setManualStrength('500 mg');
                      setManualPackSize('10 Tablets Strip');
                      setManualBatchNumber(`BTH-APO-${Math.floor(1000 + Math.random() * 9000)}`);
                      setManualExpiryDate('2028-12-31');
                      setManualDrawerLocation('Rack A · Drawer 2');
                      setManualOnHandQty('100');
                      setManualUnitCost('25');
                      setManualMrp('45');
                      setManualSellingPrice('40');
                      setManualMinThreshold('20');
                      setAddManualProductModalOpen(true);
                    }}
                    className="px-3.5 py-2 bg-[#00875a] hover:bg-[#007048] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add Product to Shelf</span>
                  </button>

                  <button
                    onClick={() => fetchStoreInventory()}
                    className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Refresh</span>
                  </button>
                </div>
              </div>

              {/* Table */}
              <div className="flex-1 overflow-y-auto mt-2">
                <table className="w-full text-left text-sm border-collapse">
                  <thead className="bg-[#f8fafc] text-slate-500 font-bold border-b border-slate-100 text-xs sticky top-0 z-10">
                    <tr>
                      <th className="py-3 px-3">Medicine / Formulation</th>
                      <th className="py-3 px-3">Batch Number</th>
                      <th className="py-3 px-3">Expiry Date</th>
                      <th className="py-3 px-3">Shelf / Drawer Location 📍</th>
                      <th className="py-3 px-3 text-right">Wholesale Cost (₹)</th>
                      <th className="py-3 px-3 text-right">Retail MRP (₹)</th>
                      <th className="py-3 px-3 text-center">Available On Shelf</th>
                      <th className="py-3 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredShelfInventory.map((it) => (
                      <tr key={it.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-3">
                            <MedicineIcon name={it.brandName} />
                            <div>
                              <span className="font-extrabold text-slate-900 block text-sm leading-snug">
                                {it.brandName}
                              </span>
                              <span className="text-xs text-slate-400 font-medium">
                                {it.genericName} · {it.dosageForm}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 font-mono text-xs font-semibold text-slate-700">
                          {it.batchNumber}
                        </td>
                        <td className="py-3 px-3 text-xs text-slate-600 font-mono">
                          {it.expiryDate}
                        </td>
                        <td className="py-3 px-3">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200/80 text-xs font-bold font-mono">
                            <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>{it.drawerLocation || 'Rack A · Drawer 1'}</span>
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-xs text-slate-600">
                          ₹{parseFloat(it.unitCost || 0).toFixed(2)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-extrabold text-slate-900 text-sm">
                          ₹{parseFloat(it.sellingPrice || it.mrp).toFixed(2)}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`inline-block px-3 py-1 rounded-xl text-xs font-bold ${
                              it.onHandQuantity < 50
                                ? 'bg-[#fff0b3] text-[#172b4d]'
                                : 'bg-[#e6f7ef] text-[#006644]'
                            }`}
                          >
                            {it.onHandQuantity} units
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleOpenUpdateStockModal(it)}
                            className="px-3.5 py-1.5 bg-[#004733] hover:bg-[#003828] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 ml-auto cursor-pointer shadow-2xs"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Update Shelf / Drawer</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* VIEW 3: SALES TRANSACTIONS (MATCHES IMAGE 3 media_1793442363013_6f0ceb8c) */}
          {/* ========================================================================= */}
          {activeTab === 'transactions' && (
            <div className="h-full flex flex-col space-y-4">
              {/* Top 4 KPI Cards - Reacts dynamically to Date Range Filters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
                <div className="bg-white border border-slate-200/90 rounded-lg p-4 shadow-2xs">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#e6f7ef] text-[#00875a] flex items-center justify-center shrink-0">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                        {transactionDateFilter === 'ALL' && !filterStartDate && !filterEndDate ? "MONTH'S GROSS SALES" : "PERIOD GROSS SALES"}
                      </span>
                      <span className="text-2xl font-black font-mono text-[#006644]">
                        ₹{(transactionDateFilter === 'ALL' && !filterStartDate && !filterEndDate
                          ? monthlyStats.monthlyGrossRevenue
                          : filteredBillsStats.totalSales
                        ).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-[#00875a] font-semibold mt-2.5">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>
                      {transactionDateFilter === 'ALL' && !filterStartDate && !filterEndDate
                        ? 'Estimated Retail Sales'
                        : `${filteredBills.length} Invoices In Filtered Range`}
                    </span>
                  </div>
                </div>

                <div className="bg-white border border-slate-200/90 rounded-lg p-4 shadow-2xs">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#e6f7ef] text-[#00875a] flex items-center justify-center shrink-0">
                      <ShoppingCart className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                        {transactionDateFilter === 'ALL' && !filterStartDate && !filterEndDate ? "TODAY'S COUNTER SALES" : "DISCOUNT SAVINGS GIVEN"}
                      </span>
                      <span className="text-2xl font-black font-mono text-slate-900">
                        ₹{(transactionDateFilter === 'ALL' && !filterStartDate && !filterEndDate
                          ? monthlyStats.todaySales
                          : filteredBillsStats.totalDiscounts
                        ).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 mt-2.5 font-medium">
                    {transactionDateFilter === 'ALL' && !filterStartDate && !filterEndDate
                      ? 'Active business day sales'
                      : 'Total patient promo savings'}
                  </p>
                </div>

                <div className="bg-white border border-slate-200/90 rounded-lg p-4 shadow-2xs">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                        BILLS IN RANGE
                      </span>
                      <span className="text-2xl font-black font-mono text-slate-900">
                        {filteredBills.length}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 mt-2.5 font-medium">
                    Dispensed receipts (Total: {bills.length})
                  </p>
                </div>

                <div className="bg-white border border-slate-200/90 rounded-lg p-4 shadow-2xs">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#e6f7ef] text-[#00875a] flex items-center justify-center shrink-0">
                      <Activity className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                        AVERAGE BILL VALUE
                      </span>
                      <span className="text-2xl font-black font-mono text-slate-900">
                        ₹{(transactionDateFilter === 'ALL' && !filterStartDate && !filterEndDate
                          ? monthlyStats.avgBillValue
                          : filteredBillsStats.avgBill
                        ).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 mt-2.5 font-medium">Average ticket size</p>
                </div>
              </div>

              {/* Transactions Ledger Table */}
              <div className="flex-1 bg-white border border-slate-200/90 rounded-lg p-5 shadow-2xs flex flex-col lg:overflow-hidden">
                <div className="flex flex-wrap justify-between items-center gap-3 pb-4 border-b border-slate-100 shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[#00875a] text-white flex items-center justify-center shadow-xs">
                      <Receipt className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-extrabold text-slate-900 leading-tight">
                        Sales Transactions Ledger
                      </h2>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Historical customer sales with Form 20 tax breakdown
                      </p>
                    </div>
                  </div>

                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={billSearchQuery}
                      onChange={(e) => setBillSearchQuery(e.target.value)}
                      placeholder="Search bill #, patient, doctor..."
                      className="pl-9 pr-9 py-2 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#00875a] w-72"
                    />
                    <Scan className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                  </div>
                </div>

                {/* Date Filter & Date Range Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-2.5 pt-3 pb-2 border-b border-slate-100 shrink-0 text-xs">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-500 flex items-center gap-1 mr-1">
                      <Filter className="w-3.5 h-3.5 text-[#00875a]" />
                      <span>Filter:</span>
                    </span>

                    <button
                      type="button"
                      onClick={() => {
                        setTransactionDateFilter('ALL');
                        setFilterStartDate('');
                        setFilterEndDate('');
                        fetchBills(false, 'ALL', '', '');
                      }}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                        transactionDateFilter === 'ALL' && !filterStartDate && !filterEndDate
                          ? 'bg-[#00875a] text-white shadow-2xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      All ({bills.length})
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setTransactionDateFilter('TODAY');
                        setFilterStartDate('');
                        setFilterEndDate('');
                        fetchBills(false, 'TODAY', '', '');
                      }}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                        transactionDateFilter === 'TODAY'
                          ? 'bg-[#00875a] text-white shadow-2xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      Today
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setTransactionDateFilter('YESTERDAY');
                        setFilterStartDate('');
                        setFilterEndDate('');
                        fetchBills(false, 'YESTERDAY', '', '');
                      }}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                        transactionDateFilter === 'YESTERDAY'
                          ? 'bg-[#00875a] text-white shadow-2xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      Yesterday
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setTransactionDateFilter('LAST_7_DAYS');
                        setFilterStartDate('');
                        setFilterEndDate('');
                        fetchBills(false, 'LAST_7_DAYS', '', '');
                      }}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                        transactionDateFilter === 'LAST_7_DAYS'
                          ? 'bg-[#00875a] text-white shadow-2xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      Last 7 Days
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setTransactionDateFilter('THIS_MONTH');
                        setFilterStartDate('');
                        setFilterEndDate('');
                        fetchBills(false, 'THIS_MONTH', '', '');
                      }}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                        transactionDateFilter === 'THIS_MONTH'
                          ? 'bg-[#00875a] text-white shadow-2xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      This Month
                    </button>

                    {/* Specific Date Range Pickers (From -> To) */}
                    <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">From:</span>
                      <input
                        type="date"
                        value={filterStartDate}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFilterStartDate(val);
                          setTransactionDateFilter('CUSTOM');
                          fetchBills(false, 'CUSTOM', val, filterEndDate);
                        }}
                        className="bg-transparent text-xs font-mono font-semibold text-slate-800 focus:outline-none"
                      />
                      <span className="text-[10px] text-slate-400 font-bold uppercase ml-1">To:</span>
                      <input
                        type="date"
                        value={filterEndDate}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFilterEndDate(val);
                          setTransactionDateFilter('CUSTOM');
                          fetchBills(false, 'CUSTOM', filterStartDate, val);
                        }}
                        className="bg-transparent text-xs font-mono font-semibold text-slate-800 focus:outline-none"
                      />
                    </div>

                    {(transactionDateFilter !== 'ALL' || filterStartDate || filterEndDate) && (
                      <button
                        type="button"
                        onClick={() => {
                          setTransactionDateFilter('ALL');
                          setFilterStartDate('');
                          setFilterEndDate('');
                          fetchBills(false, 'ALL', '', '');
                        }}
                        className="text-xs text-rose-600 hover:text-rose-800 font-bold ml-1 cursor-pointer px-1.5 py-1 rounded hover:bg-rose-50"
                      >
                        ✕ Clear
                      </button>
                    )}
                  </div>

                  <span className="text-xs text-slate-500 font-medium">
                    Showing <strong className="text-slate-900 font-bold">{filteredBills.length}</strong> of {bills.length} bills
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto mt-2">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead className="bg-[#f8fafc] text-slate-500 font-bold border-b border-slate-100 text-xs sticky top-0 z-10">
                      <tr>
                        <th className="py-3 px-3">Bill Number</th>
                        <th className="py-3 px-3">Date & Time</th>
                        <th className="py-3 px-3">Customer & Doctor</th>
                        <th className="py-3 px-3">Dispensed By / Terminal</th>
                        <th className="py-3 px-3">Items Count</th>
                        <th className="py-3 px-3 text-center">Payment Mode</th>
                        <th className="py-3 px-3 text-right">Amount</th>
                        <th className="py-3 px-3 text-right">Receipt</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredBills.map((b) => (
                        <tr key={b.id} className="hover:bg-slate-50/70 transition">
                          <td className="py-3 px-3 font-mono font-bold text-slate-900 text-xs">{b.billNumber}</td>
                          <td className="py-3 px-3 text-xs text-slate-600 font-mono">
                            {new Date(b.createdAt).toLocaleString('en-IN')}
                          </td>
                          <td className="py-3 px-3">
                            <span className="font-extrabold text-slate-900 text-sm block">{b.customerName}</span>
                            <span className="text-xs text-slate-500 font-mono">📱 {b.customerPhone}</span>
                            {b.doctorName && (
                              <span className="text-xs text-slate-400 block font-medium">Dr: {b.doctorName}</span>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-slate-900 leading-tight">
                                {b.billedBy || 'Main Counter (Dr. Ramesh Patil)'}
                              </span>
                              <span
                                className={`text-[10px] font-mono font-bold inline-block mt-0.5 px-1.5 py-0.2 rounded w-fit ${
                                  b.terminalCode === 'COUNTER-01' || (b.billedBy && b.billedBy.includes('Owner'))
                                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-100'
                                    : 'bg-blue-50 text-blue-800 border border-blue-100'
                                }`}
                              >
                                {b.terminalCode || 'COUNTER-01'}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-xs text-slate-700 font-semibold">{b.items?.length || 1} items</td>
                          <td className="py-3 px-3 text-center">
                            <span
                              className={`inline-block px-3 py-0.5 rounded-lg text-xs font-bold font-mono ${
                                b.paymentMode === 'UPI'
                                  ? 'bg-[#e6f7ef] text-[#006644]'
                                  : b.paymentMode === 'CARD'
                                  ? 'bg-purple-50 text-purple-700'
                                  : 'bg-blue-50 text-blue-700'
                              }`}
                            >
                              {b.paymentMode}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-extrabold text-slate-900 text-sm">
                            ₹{parseFloat(b.totalAmount).toFixed(2)}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <button
                              type="button"
                              onClick={() => setViewingBillModal(b)}
                              className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ml-auto cursor-pointer shadow-2xs"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span>Reprint</span>
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
          {/* VIEW 4: WHOLESALE PROCUREMENT                                             */}
          {/* ========================================================================= */}
          {activeTab === 'procurement' && (
            <div className="h-full flex flex-col bg-white border border-slate-200/90 rounded-lg p-5 shadow-2xs">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100 shrink-0">
                <button
                  type="button"
                  onClick={() => setProcurementSubTab('catalogue')}
                  className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
                    procurementSubTab === 'catalogue'
                      ? 'bg-[#004733] text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Wholesale Catalogue & Quotes
                </button>

                <button
                  type="button"
                  onClick={() => setProcurementSubTab('orders')}
                  className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
                    procurementSubTab === 'orders'
                      ? 'bg-[#004733] text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Wholesale Orders Tracker ({orders.length})
                </button>

                <button
                  type="button"
                  onClick={() => setProcurementSubTab('ai-alerts')}
                  className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                    procurementSubTab === 'ai-alerts'
                      ? 'bg-[#004733] text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#ffab00]" />
                  <span>AI Restock Monitor ({stockAlerts.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setProcurementSubTab('distributors'); fetchDistributors(true); }}
                  className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                    procurementSubTab === 'distributors'
                      ? 'bg-[#004733] text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Verified Distributors ({distributorsList.length || 5})</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setProcurementSubTab('indents'); fetchIndentRequests(); }}
                  className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                    procurementSubTab === 'indents'
                      ? 'bg-[#004733] text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Chemist Indents ({indentRequests.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsIndentModalOpen(true)}
                  className="ml-auto px-3 py-1.5 bg-[#004733] hover:bg-[#003727] text-white text-xs font-bold rounded-xl shadow-2xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Raise Indent</span>
                </button>
              </div>

              {/* Sub-tab 1: Catalogue with Real-time Search & Wholesaler Availability */}
              {procurementSubTab === 'catalogue' && (() => {
                const q = catalogueSearch.trim().toLowerCase();
                const filteredCatalogue = medicines.filter((med) => {
                  const matchesSearch = !q ||
                    med.brandName?.toLowerCase().includes(q) ||
                    med.genericName?.toLowerCase().includes(q) ||
                    med.manufacturer?.toLowerCase().includes(q);
                  const matchesCategory = selectedCategory === 'ALL' || med.dosageForm?.toUpperCase() === selectedCategory;
                  return matchesSearch && matchesCategory;
                });

                return (
                  <div className="flex-1 overflow-y-auto space-y-4 pt-3">
                    {/* Search & Category Filter Header */}
                    <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 shadow-2xs space-y-3">
                      <div className="flex flex-col sm:flex-row items-center gap-3">
                        <div className="relative flex-1 w-full">
                          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                          <input
                            type="text"
                            value={catalogueSearch}
                            onChange={(e) => setCatalogueSearch(e.target.value)}
                            placeholder="Search wholesale medicines across distributors (e.g. Amlong, Augmentin, Dolo, Asthalin)..."
                            className="w-full pl-10 pr-10 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#004733]/20 focus:border-[#004733] transition"
                          />
                          {catalogueSearch && (
                            <button
                              type="button"
                              onClick={() => setCatalogueSearch('')}
                              className="absolute right-3 top-2.5 p-0.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
                              title="Clear search"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setIndentForm({
                                medicineName: catalogueSearch || '',
                                genericName: '',
                                dosageForm: 'TABLET',
                                strength: '',
                                requiredQty: 50,
                                urgency: 'HIGH',
                                targetDate: '',
                                notes: 'Chemist indent requested directly from wholesale catalogue.',
                                distributorId: '',
                              });
                              setIsIndentModalOpen(true);
                            }}
                            className="px-3 py-2 bg-[#004733] hover:bg-[#003828] text-white text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-2xs shrink-0"
                            title="Request a medicine not available with distributors"
                          >
                            <ShoppingBag className="w-3.5 h-3.5" />
                            <span>Request Medicine</span>
                          </button>
                        </div>
                      </div>

                      {/* Dosage Form Filter Chips */}
                      <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-slate-200/60 text-xs">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                          Category:
                        </span>
                        {[
                          { key: 'ALL', label: 'All Formulations' },
                          { key: 'TABLET', label: 'Tablets' },
                          { key: 'INHALER', label: 'Inhalers & Respiratory' },
                          { key: 'CAPSULE', label: 'Capsules' },
                          { key: 'INJECTION', label: 'Injections' },
                          { key: 'SYRUP', label: 'Syrups' },
                        ].map((cat) => (
                          <button
                            key={cat.key}
                            type="button"
                            onClick={() => setSelectedCategory(cat.key)}
                            className={`px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer ${
                              selectedCategory === cat.key
                                ? 'bg-[#004733] text-white shadow-2xs'
                                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            {cat.label}
                          </button>
                        ))}
                        <span className="ml-auto text-xs text-slate-400 font-mono font-medium">
                          Showing {filteredCatalogue.length} of {medicines.length} medicines
                        </span>
                      </div>
                    </div>

                    {/* Catalogue Cards Grid or Empty Search Fallback */}
                    {filteredCatalogue.length === 0 ? (
                      <div className="py-12 px-6 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl text-center space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto shadow-2xs">
                          <AlertTriangle className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="text-base font-extrabold text-slate-900">
                            {catalogueSearch ? `"${catalogueSearch}" is not in current wholesale stock` : 'No medicines found in this category'}
                          </h3>
                          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                            {catalogueSearch
                              ? `None of the registered distributors currently list "${catalogueSearch}". You can raise an immediate Chemist Indent to request distributors to source this formulation.`
                              : 'Try adjusting your search keyword or selecting a different formulation category.'}
                          </p>
                        </div>

                        {catalogueSearch && (
                          <button
                            type="button"
                            onClick={() => {
                              setIndentForm({
                                medicineName: catalogueSearch,
                                genericName: '',
                                dosageForm: 'TABLET',
                                strength: '',
                                requiredQty: 50,
                                urgency: 'HIGH',
                                targetDate: '',
                                notes: `Chemist requested "${catalogueSearch}" as it is currently unavailable across wholesale distributors.`,
                                distributorId: '',
                              });
                              setIsIndentModalOpen(true);
                            }}
                            className="px-5 py-2.5 bg-[#004733] hover:bg-[#003828] text-white rounded-xl text-xs font-bold transition inline-flex items-center gap-2 shadow-xs cursor-pointer"
                          >
                            <ShoppingBag className="w-4 h-4" />
                            <span>Raise Wholesale Indent for "{catalogueSearch}"</span>
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                        {filteredCatalogue.map((med) => (
                          <div
                            key={med.id}
                            className="bg-white border border-slate-200/90 rounded-2xl p-4 hover:border-slate-300 hover:shadow-xs transition flex flex-col justify-between"
                          >
                            <div>
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <h3 className="font-extrabold text-slate-900 text-sm">{med.brandName}</h3>
                                  <p className="text-xs text-slate-500">{med.genericName}</p>
                                </div>
                                <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-lg font-mono font-bold uppercase">
                                  {med.dosageForm}
                                </span>
                              </div>
                              <p className="text-xs text-slate-600 mt-1">
                                {med.strength} · Pack: {med.packSize}
                              </p>
                              <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                                <span>Mfg: {med.manufacturer}</span>
                              </p>
                              <div className="mt-2 text-[11px] text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                                <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                                <span>CDSCO QA Released · Ready for Dispatch</span>
                              </div>
                            </div>

                            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                              <div>
                                <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">
                                  Indicative Base
                                </span>
                                <span className="text-sm font-extrabold text-slate-900 font-mono">
                                  ₹{parseFloat(med.basePrice).toFixed(2)}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleOpenComparison(med)}
                                className="px-3.5 py-2 bg-[#004733] hover:bg-[#003828] text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                                title="Check distributor availability and compare quotes"
                              >
                                <span>Compare Wholesalers</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Sub-tab 2: Wholesale Orders */}
              {procurementSubTab === 'orders' && (
                <div className="flex-1 overflow-y-auto space-y-3 pt-3">
                  {orders.map((ord) => {
                    const isPending = ord.status === 'PENDING_APPROVAL' || ord.status === 'PENDING_CONFIRMATION';
                    return (
                      <div
                        key={ord.id}
                        className="bg-white border border-slate-200/90 rounded-lg p-4 shadow-2xs space-y-3"
                      >
                        <div className="flex flex-wrap justify-between items-start gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 text-sm">{ord.orderNumber}</span>
                              <span
                                className={`text-xs px-2.5 py-0.5 rounded-lg font-bold ${
                                  ord.status === 'DELIVERED'
                                    ? 'bg-[#e6f7ef] text-[#006644]'
                                    : ord.status === 'DISPATCHED'
                                    ? 'bg-blue-50 text-blue-800'
                                    : ord.status === 'CONFIRMED'
                                    ? 'bg-purple-50 text-purple-800'
                                    : 'bg-amber-50 text-amber-800'
                                }`}
                              >
                                {ord.status.replace('_', ' ')}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 mt-1">
                              <strong>{ord.medicineName}</strong> · Quantity: {ord.quantity} units (Batch: {ord.batchNumber})
                            </p>
                            <p className="text-xs text-slate-400">Supplier: {ord.distributorName}</p>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-sm font-extrabold text-slate-900 font-mono mr-2">
                              ₹{parseFloat(ord.totalAmount || (ord.quantity * ord.unitPrice * 1.12)).toFixed(2)}
                            </span>

                            {isPending && (
                              <button
                                type="button"
                                disabled={cancellingOrderId === ord.id}
                                onClick={() => handleCancelWholesaleOrder(ord.id, ord.orderNumber)}
                                className="px-3.5 py-1.5 border border-rose-200 hover:bg-rose-50 text-rose-700 rounded-xl text-xs font-bold transition cursor-pointer"
                              >
                                {cancellingOrderId === ord.id ? 'Cancelling...' : 'Cancel Order'}
                              </button>
                            )}

                            {ord.status === 'DISPATCHED' && (
                              <button
                                type="button"
                                onClick={() => setTrackingOrderModal(ord)}
                                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                                title="Live GPS & Cold-Chain Fleet Tracking"
                              >
                                <Truck className="w-3.5 h-3.5" />
                                <span>Track Live GPS</span>
                              </button>
                            )}

                            {ord.paymentStatus === 'PAID' ? (
                              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-xl flex items-center gap-1">
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span>PAID</span>
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setPaymentModalOrder(ord)}
                                className="px-3 py-1.5 bg-[#004733] hover:bg-[#003727] text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                              >
                                <CreditCard className="w-3.5 h-3.5" />
                                <span>Pay Wholesaler</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleOpenWholesaleInvoice(ord)}
                              className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1 shadow-2xs"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>Invoice</span>
                            </button>
                          </div>
                        </div>

                        {/* Stepper */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between max-w-md text-xs">
                          <span className="font-bold text-slate-900">1. Placed</span>
                          <span className="text-slate-300">→</span>
                          <span className={['CONFIRMED', 'DISPATCHED', 'DELIVERED'].includes(ord.status) ? 'font-bold text-slate-900' : 'text-slate-400'}>
                            2. Confirmed
                          </span>
                          <span className="text-slate-300">→</span>
                          <span className={['DISPATCHED', 'DELIVERED'].includes(ord.status) ? 'font-bold text-blue-700' : 'text-slate-400'}>
                            3. Dispatched
                          </span>
                          <span className="text-slate-300">→</span>
                          <span className={ord.status === 'DELIVERED' ? 'font-bold text-[#006644]' : 'text-slate-400'}>
                            4. Delivered
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Sub-tab 3: AI Restock */}
              {procurementSubTab === 'ai-alerts' && (
                <div className="flex-1 overflow-y-auto space-y-3 pt-3">
                  {stockAlerts.map((alt) => (
                    <div
                      key={alt.inventoryId}
                      className="bg-white border border-slate-200/90 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-extrabold text-slate-900">{alt.brandName}</span>
                          <span className="text-xs px-2.5 py-0.5 rounded-lg font-bold bg-[#fff0b3] text-[#172b4d]">
                            REORDER POINT REACHED
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          Shelf: <strong className="text-slate-800">{alt.currentStock} units</strong> · Safety Stock: {alt.safetyStock} · ROP: {alt.reorderPoint}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-sm font-extrabold text-[#006644]">+{alt.suggestedRestockQuantity} units</span>
                        <button
                          type="button"
                          onClick={() => handleOpenRestockModal(alt)}
                          className="px-3.5 py-1.5 bg-[#004733] hover:bg-[#003828] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-[#ffab00]" />
                          <span>Review Restock PO</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Sub-tab 4: Verified Distributors Directory */}
              {procurementSubTab === 'distributors' && (
                <div className="flex-1 overflow-y-auto space-y-4 pt-3">
                  <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 border border-slate-200/80 rounded-lg p-3.5">
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <Building2 className="w-4 h-4 text-[#00875a]" />
                        <span>Connected Pharmaceutical Distributors Network</span>
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Wholesale logistics hubs verified to deliver to Apollo Care Pharmacy (Pincode: {destinationPincode})
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => fetchDistributors()}
                      className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${loadingDistributors ? 'animate-spin text-[#00875a]' : ''}`} />
                      <span>Refresh Network</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                    {(distributorsList.length > 0 ? distributorsList : [
                      {
                        id: 'dist-01',
                        companyName: 'MedVantage Pharma Logistics',
                        licenseNumber: 'WDL-2024-MVL-101',
                        phone: '+91 98331 44556',
                        address: 'Bldg B3, Bhiwandi Logistics Hub',
                        city: 'Thane',
                        pincode: '421302',
                        fulfillmentRating: 98.5,
                        avgLeadTimeHours: 18,
                        coveragePincodes: ['400001', '400703', '411001']
                      },
                      {
                        id: 'dist-02',
                        companyName: 'Apex Global Health Distributors',
                        licenseNumber: 'WDL-2024-APX-202',
                        phone: '+91 98332 55667',
                        address: 'Industrial Estate, Andheri East',
                        city: 'Mumbai',
                        pincode: '400069',
                        fulfillmentRating: 94.2,
                        avgLeadTimeHours: 24,
                        coveragePincodes: ['400001', '400050']
                      },
                      {
                        id: 'dist-03',
                        companyName: 'PulseLife Distribution Network',
                        licenseNumber: 'WDL-2024-PLS-303',
                        phone: '+91 98333 66778',
                        address: 'MIDC Phase II, Chakan',
                        city: 'Pune',
                        pincode: '410501',
                        fulfillmentRating: 96.0,
                        avgLeadTimeHours: 14,
                        coveragePincodes: ['400001', '411001']
                      },
                      {
                        id: 'dist-04',
                        companyName: 'SunRise Healthcare Wholesalers',
                        licenseNumber: 'WDL-2024-SRH-404',
                        phone: '+91 98334 77889',
                        address: 'Warehouse Hub, Rabale',
                        city: 'Navi Mumbai',
                        pincode: '400701',
                        fulfillmentRating: 89.5,
                        avgLeadTimeHours: 36,
                        coveragePincodes: ['400001']
                      },
                      {
                        id: 'dist-05',
                        companyName: 'BioPharma Cold-Chain Supply',
                        licenseNumber: 'WDL-2024-BPS-505',
                        phone: '+91 98335 88990',
                        address: 'Bio Park, Hinjewadi Phase 1',
                        city: 'Pune',
                        pincode: '411057',
                        fulfillmentRating: 99.1,
                        avgLeadTimeHours: 12,
                        coveragePincodes: ['400001', '400050']
                      }
                    ]).map((dist: any) => {
                      const rating = dist.fulfillmentRating ? parseFloat(dist.fulfillmentRating).toFixed(1) : '98.0';
                      return (
                        <div
                          key={dist.id}
                          className="bg-white border border-slate-200/90 rounded-lg p-4 shadow-2xs hover:border-[#00875a]/50 transition flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div>
                                <h4 className="font-extrabold text-slate-900 text-sm leading-tight">
                                  {dist.companyName}
                                </h4>
                                <span className="text-[11px] font-mono text-slate-400 block mt-0.5">
                                  Lic: {dist.licenseNumber}
                                </span>
                              </div>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 shrink-0">
                                {rating}% SLA
                              </span>
                            </div>

                            <div className="space-y-1 text-xs text-slate-600 my-2.5">
                              <p className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span>{dist.address || dist.city}, {dist.city} ({dist.pincode})</span>
                              </p>
                              <p className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                                <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span>{dist.phone || '+91 98200 00000'}</span>
                              </p>
                              <p className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                                <Truck className="w-3.5 h-3.5 text-[#00875a] shrink-0" />
                                <span>Avg Lead Time: <strong>{dist.avgLeadTimeHours || 18} hours</strong></span>
                              </p>
                            </div>
                          </div>

                          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 bg-emerald-50 text-emerald-700">
                              <CheckCircle2 className="w-3 h-3 text-[#00875a]" />
                              <span>Delivers to {destinationPincode}</span>
                            </span>

                            <button
                              type="button"
                              onClick={() => setProcurementSubTab('catalogue')}
                              className="px-3 py-1.5 bg-[#004733] hover:bg-[#003828] text-white rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs"
                            >
                              <span>Browse Stock</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Sub-tab 5: Chemist Indents / Sourcing Requests */}
              {procurementSubTab === 'indents' && (
                <div className="flex-1 overflow-y-auto space-y-4 pt-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900">Chemist Indent &amp; Special Sourcing Book</h3>
                      <p className="text-xs text-slate-500">
                        When a medicine or specific formulation is out-of-stock across wholesale catalogues, raise an indent to notify authorized distributors directly.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsIndentModalOpen(true)}
                      className="px-3.5 py-1.5 bg-[#004733] hover:bg-[#003727] text-white text-xs font-bold rounded-xl shadow-2xs flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Raise New Indent</span>
                    </button>
                  </div>

                  {loadingIndents ? (
                    <div className="py-12 text-center text-xs text-slate-400">Loading indent requests from registry...</div>
                  ) : indentRequests.length === 0 ? (
                    <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                      <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                      <p className="text-sm font-bold text-slate-700">No Chemist Indents Raised Yet</p>
                      <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                        Need unlisted or hard-to-source drugs? Raise an indent request and wholesale distributors will be prompted to supply or source them for you.
                      </p>
                      <button
                        type="button"
                        onClick={() => setIsIndentModalOpen(true)}
                        className="mt-4 px-4 py-2 bg-[#004733] hover:bg-[#003828] text-white text-xs font-bold rounded-xl transition cursor-pointer inline-flex items-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Raise Chemist Indent</span>
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                      {indentRequests.map((req) => (
                        <div
                          key={req.id}
                          className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs flex flex-col justify-between hover:border-slate-300 transition"
                        >
                          <div>
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div>
                                <span className="text-[10px] font-mono font-bold text-slate-400 block">{req.id}</span>
                                <h4 className="text-sm font-extrabold text-slate-900 leading-tight">
                                  {req.medicineName || req.medicine_name}
                                </h4>
                                {(req.genericName || req.generic_name) && (
                                  <span className="text-xs text-slate-500 italic block mt-0.5">
                                    {req.genericName || req.generic_name}
                                  </span>
                                )}
                              </div>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 ${
                                  req.status === 'AVAILABLE'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : req.status === 'ACCEPTED'
                                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                    : req.status === 'REJECTED'
                                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                }`}
                              >
                                {req.status}
                              </span>
                            </div>

                            <div className="space-y-1.5 text-xs text-slate-600 my-3 bg-slate-50/70 p-2.5 rounded-lg border border-slate-100">
                              <div className="flex justify-between">
                                <span className="text-slate-500">Dosage Form:</span>
                                <span className="font-bold text-slate-800">{req.dosageForm || req.dosage_form || 'TABLET'} ({req.strength || 'Standard'})</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-500">Quantity Needed:</span>
                                <span className="font-extrabold text-slate-900">{req.quantityNeeded || req.required_qty || req.requiredQty} units</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-500">Target Distributor:</span>
                                <span className="font-semibold text-slate-700 truncate max-w-[150px]">
                                  {req.targetDistributorName || req.distributor_name || 'Any Wholesaler'}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-500">Priority Urgency:</span>
                                <span className={`font-bold ${req.urgency === 'CRITICAL' ? 'text-rose-600' : req.urgency === 'URGENT' ? 'text-amber-600' : 'text-slate-700'}`}>
                                  {req.urgency}
                                </span>
                              </div>
                              {req.notes && (
                                <div className="pt-1 border-t border-slate-200/60 text-[11px] text-slate-500 italic">
                                  &quot;{req.notes}&quot;
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="pt-2 text-[10px] text-slate-400 flex items-center justify-between border-t border-slate-100">
                            <span>Logged {new Date(req.createdAt || req.created_at || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
                            {req.status === 'AVAILABLE' && (
                              <button
                                type="button"
                                onClick={() => setProcurementSubTab('catalogue')}
                                className="text-xs font-bold text-[#00875a] hover:underline flex items-center gap-1 cursor-pointer"
                              >
                                <span>Order From Catalogue</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* VIEW 5: PHARMACY SETTINGS & PHYSICAL RACK DIRECTORY                       */}
          {/* ========================================================================= */}
          {activeTab === 'settings' && (
            <div className="h-full lg:overflow-y-auto space-y-4 pb-12 pr-1">
              {/* Top Banner */}
              <div className="bg-white border border-slate-200/90 rounded-lg p-4 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-lg bg-[#e6f7ef] text-[#00875a] flex items-center justify-center shadow-xs">
                    <Store className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-extrabold text-slate-900">{storeDetails.name}</h2>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-100">
                        Verified Retail Chemist
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Drug License Form 20/21 · Retail Pharmacy ID: <span className="font-mono font-bold text-slate-700">{storeDetails.id}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right hidden sm:block">
                    <span className="text-[11px] text-slate-400 block font-medium">Multi-Counter POS</span>
                    <span className="text-xs font-bold text-slate-800 font-mono">
                      {storeTerminals.length} Counters · {storeShelfLocations.length} Shelves
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      fetchStoreProfile(false);
                      fetchStoreTerminals(false);
                    }}
                    className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                    title="Reload from PostgreSQL"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Reload</span>
                  </button>
                </div>
              </div>

              {/* Settings Section Switcher */}
              <div className="flex flex-wrap items-center gap-2 border-b border-slate-200/80 pb-3">
                <button
                  type="button"
                  onClick={() => setSettingsActiveSection('profile')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                    settingsActiveSection === 'profile'
                      ? 'bg-[#00875a] text-white shadow-2xs'
                      : 'bg-white hover:bg-slate-50 border border-slate-200 text-slate-700'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Pharmacy Profile &amp; License</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSettingsActiveSection('shelves')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                    settingsActiveSection === 'shelves'
                      ? 'bg-[#00875a] text-white shadow-2xs'
                      : 'bg-white hover:bg-slate-50 border border-slate-200 text-slate-700'
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Physical Shelf Directory ({storeShelfLocations.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSettingsActiveSection('terminals')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                    settingsActiveSection === 'terminals'
                      ? 'bg-[#00875a] text-white shadow-2xs'
                      : 'bg-white hover:bg-slate-50 border border-slate-200 text-slate-700'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Billing Terminals &amp; Counters ({storeTerminals.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSettingsActiveSection('discounts')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                    settingsActiveSection === 'discounts'
                      ? 'bg-[#00875a] text-white shadow-2xs'
                      : 'bg-white hover:bg-slate-50 border border-slate-200 text-slate-700'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Promotional Discounts &amp; Campaigns ({discountCampaigns.length})</span>
                </button>
              </div>

              {/* SECTION 1: PHARMACY PROFILE & CREDENTIALS */}
              {settingsActiveSection === 'profile' && (
                <div className="bg-white border border-slate-200/90 rounded-lg p-5 shadow-2xs">
                  <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                        <FileText className="w-4 h-4 text-[#00875a]" />
                      </div>
                      <div>
                        <h3 className="text-sm font-extrabold text-slate-900">Pharmacy Profile &amp; Regulatory Credentials</h3>
                        <p className="text-[11px] text-slate-400">Official license details printed on retail tax invoices &amp; wholesale POs</p>
                      </div>
                    </div>
                  </div>

                  <form onSubmit={handleSaveStoreProfile} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                      {/* Store Name */}
                      <div className="sm:col-span-2 md:col-span-3">
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Medical Store / Pharmacy Name *
                        </label>
                        <div className="relative">
                          <Store className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                          <input
                            type="text"
                            required
                            value={storeDetails.name}
                            onChange={(e) => setStoreDetails({ ...storeDetails, name: e.target.value })}
                            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#00875a]"
                          />
                        </div>
                      </div>

                      {/* License Number */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Drug License No. (Form 20 / 21) *
                        </label>
                        <div className="relative">
                          <ShieldCheck className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                          <input
                            type="text"
                            required
                            value={storeDetails.licenseNumber}
                            onChange={(e) => setStoreDetails({ ...storeDetails, licenseNumber: e.target.value })}
                            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#00875a]"
                          />
                        </div>
                      </div>

                      {/* GSTIN */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          GSTIN / Tax Registration No. *
                        </label>
                        <div className="relative">
                          <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                          <input
                            type="text"
                            required
                            value={storeDetails.gstin}
                            onChange={(e) => setStoreDetails({ ...storeDetails, gstin: e.target.value })}
                            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#00875a]"
                          />
                        </div>
                      </div>

                      {/* Pharmacist In-Charge */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Registered Pharmacist In-Charge *
                        </label>
                        <div className="relative">
                          <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                          <input
                            type="text"
                            required
                            value={storeDetails.pharmacistName}
                            onChange={(e) => setStoreDetails({ ...storeDetails, pharmacistName: e.target.value })}
                            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#00875a]"
                          />
                        </div>
                      </div>

                      {/* Phone */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Chemist Phone / Mobile *
                        </label>
                        <div className="relative">
                          <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                          <input
                            type="text"
                            required
                            value={storeDetails.phone}
                            onChange={(e) => setStoreDetails({ ...storeDetails, phone: e.target.value })}
                            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#00875a]"
                          />
                        </div>
                      </div>

                      {/* Email */}
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Official Communication Email *
                        </label>
                        <div className="relative">
                          <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                          <input
                            type="email"
                            required
                            value={storeDetails.email}
                            onChange={(e) => setStoreDetails({ ...storeDetails, email: e.target.value })}
                            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#00875a]"
                          />
                        </div>
                      </div>

                      {/* Street Address */}
                      <div className="sm:col-span-2 md:col-span-3">
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Pharmacy Physical Address *
                        </label>
                        <div className="relative">
                          <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                          <input
                            type="text"
                            required
                            value={storeDetails.address}
                            onChange={(e) => setStoreDetails({ ...storeDetails, address: e.target.value })}
                            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#00875a]"
                          />
                        </div>
                      </div>

                      {/* City */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">City</label>
                        <input
                          type="text"
                          required
                          value={storeDetails.city}
                          onChange={(e) => setStoreDetails({ ...storeDetails, city: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#00875a]"
                        />
                      </div>

                      {/* State */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">State</label>
                        <input
                          type="text"
                          required
                          value={storeDetails.state}
                          onChange={(e) => setStoreDetails({ ...storeDetails, state: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#00875a]"
                        />
                      </div>

                      {/* Pincode */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Delivery Pincode *</label>
                        <input
                          type="text"
                          required
                          value={storeDetails.pincode}
                          onChange={(e) => {
                            setStoreDetails({ ...storeDetails, pincode: e.target.value });
                            setDestinationPincode(e.target.value);
                          }}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#00875a]"
                        />
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
                      <button
                        type="submit"
                        disabled={isSavingStoreSettings}
                        className="px-6 py-2.5 bg-[#00875a] hover:bg-[#007048] disabled:bg-slate-300 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs"
                      >
                        {isSavingStoreSettings ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Saving to PostgreSQL...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Save Pharmacy Credentials</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* SECTION 2: PHYSICAL SHELF & DRAWER DIRECTORY */}
              {settingsActiveSection === 'shelves' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                  {/* Left: Add Shelf Form (5 cols) */}
                  <div className="lg:col-span-5 bg-white border border-slate-200/90 rounded-lg p-5 shadow-2xs flex flex-col">
                    <div className="flex items-center gap-2.5 pb-3.5 mb-3 border-b border-slate-100">
                      <div className="w-7 h-7 rounded-xl bg-emerald-50 text-[#00875a] flex items-center justify-center">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-extrabold text-slate-900">+ Add Physical Shelf / Drawer</h3>
                        <p className="text-[11px] text-slate-400">Configure new drawer in pharmacy shop</p>
                      </div>
                    </div>

                    <div className="mb-4 p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl text-xs text-emerald-900">
                      <p className="font-semibold text-emerald-950 flex items-center gap-1.5 mb-0.5">
                        <Boxes className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Strict Shelf Selection Enforcement</span>
                      </p>
                      <p className="text-[11px] text-emerald-800 leading-relaxed">
                        Only locations configured here will be available in the dropdown when adding medicines or adjusting physical drawer stock.
                      </p>
                    </div>

                    <form onSubmit={handleAddNewShelfLocation} className="space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Shelf / Rack Label *
                        </label>
                        <input
                          type="text"
                          required
                          value={newShelfName}
                          onChange={(e) => setNewShelfName(e.target.value)}
                          placeholder="e.g. Rack F · Drawer 1"
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#00875a]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Department / Section Label
                        </label>
                        <input
                          type="text"
                          value={newShelfSection}
                          onChange={(e) => setNewShelfSection(e.target.value)}
                          placeholder="e.g. Pediatrics &amp; Drops"
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#00875a]"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2.5 bg-[#00875a] hover:bg-[#007048] text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs mt-2"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Drawer to Physical Store Directory</span>
                      </button>
                    </form>
                  </div>

                  {/* Right: Shelf Locations Table (7 cols) */}
                  <div className="lg:col-span-7 bg-white border border-slate-200/90 rounded-lg p-5 shadow-2xs flex flex-col">
                    <div className="flex items-center justify-between pb-3.5 mb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <Boxes className="w-4 h-4 text-[#00875a]" />
                        <h3 className="text-sm font-extrabold text-slate-900">Configured Shop Shelves</h3>
                      </div>
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs font-mono font-extrabold px-2 py-0.5 rounded-lg">
                        {storeShelfLocations.length} Locations
                      </span>
                    </div>

                    <div className="flex-1 overflow-y-auto max-h-[460px] divide-y divide-slate-100 border border-slate-100 rounded-xl pr-1">
                      {storeShelfLocations.map((loc) => (
                        <div key={loc.id || loc.name} className="py-2.5 px-3 flex items-center justify-between hover:bg-slate-50/80 transition">
                          <div className="min-w-0 pr-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold font-mono text-slate-900">{loc.name}</span>
                              {loc.count > 0 && (
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-slate-100 text-slate-600">
                                  {loc.count} meds stocked
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-400 block truncate">{loc.section || 'General Shelf'}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteShelfLocation(loc.id, loc.name)}
                            className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer shrink-0"
                            title={`Remove ${loc.name}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION 3: MULTI-TERMINAL POS BILLING DESKS */}
              {settingsActiveSection === 'terminals' && (
                <div className="space-y-4">
                  {/* Explanatory Banner */}
                  <div className="p-4 bg-blue-50/80 border border-blue-200 rounded-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
                        <CreditCard className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-extrabold text-blue-950">
                          Multi-Terminal Synchronization &amp; Operator Access
                        </h4>
                        <p className="text-xs text-blue-800 mt-0.5 leading-relaxed">
                          All terminals share the same centralized PostgreSQL database (inventory stock, shelf locations, formulations and customer records). Terminal operators can issue bills, search medicines, inward manual stock, and adjust counts. Every transaction records the operator name and counter ID.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                    {/* Left: Add Terminal Form (5 cols) */}
                    <div className="lg:col-span-5 bg-white border border-slate-200/90 rounded-lg p-5 shadow-2xs">
                      <div className="flex items-center gap-2.5 pb-3.5 mb-3 border-b border-slate-100">
                        <div className="w-7 h-7 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                          <UserPlus className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-sm font-extrabold text-slate-900">+ Add New Billing Counter / Terminal</h3>
                          <p className="text-[11px] text-slate-400">Create login credentials for counter staff</p>
                        </div>
                      </div>

                      <form onSubmit={handleCreateTerminal} className="space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                              Counter Code *
                            </label>
                            <input
                              type="text"
                              required
                              value={newTerminalCode}
                              onChange={(e) => setNewTerminalCode(e.target.value)}
                              placeholder="e.g. COUNTER-02"
                              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#00875a]"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                              Counter Desk Name
                            </label>
                            <input
                              type="text"
                              value={newTerminalName}
                              onChange={(e) => setNewTerminalName(e.target.value)}
                              placeholder="e.g. Express Counter"
                              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#00875a]"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Staff / Operator Full Name *
                          </label>
                          <div className="relative">
                            <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                            <input
                              type="text"
                              required
                              value={newTerminalOperator}
                              onChange={(e) => setNewTerminalOperator(e.target.value)}
                              placeholder="e.g. Suresh Kadam (Cashier)"
                              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#00875a]"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Operator Login Email (Used for Terminal Sign-In) *
                          </label>
                          <div className="relative">
                            <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                            <input
                              type="email"
                              value={newTerminalEmail}
                              onChange={(e) => setNewTerminalEmail(e.target.value)}
                              placeholder="e.g. suresh.kadam@apollocare.com"
                              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#00875a]"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                              Login Username *
                            </label>
                            <input
                              type="text"
                              required
                              value={newTerminalUsername}
                              onChange={(e) => setNewTerminalUsername(e.target.value)}
                              placeholder="e.g. terminal2"
                              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#00875a]"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                              Login Password *
                            </label>
                            <input
                              type="text"
                              required
                              value={newTerminalPassword}
                              onChange={(e) => setNewTerminalPassword(e.target.value)}
                              placeholder="e.g. terminal123"
                              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#00875a]"
                            />
                          </div>
                        </div>

                        <button
                          type="submit"
                          disabled={isAddingTerminal}
                          className="w-full py-2.5 bg-[#00875a] hover:bg-[#007048] disabled:bg-slate-300 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs mt-2"
                        >
                          {isAddingTerminal ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>Creating Terminal in PostgreSQL...</span>
                            </>
                          ) : (
                            <>
                              <Plus className="w-3.5 h-3.5" />
                              <span>Create Terminal &amp; Grant Access</span>
                            </>
                          )}
                        </button>
                      </form>
                    </div>

                    {/* Right: Active Terminals Table (7 cols) */}
                    <div className="lg:col-span-7 bg-white border border-slate-200/90 rounded-lg p-5 shadow-2xs flex flex-col">
                      <div className="flex items-center justify-between pb-3.5 mb-3 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-blue-600" />
                          <h3 className="text-sm font-extrabold text-slate-900">Active Pharmacy Counters &amp; Terminals</h3>
                        </div>
                        <span className="bg-blue-50 text-blue-700 border border-blue-100 text-xs font-mono font-extrabold px-2 py-0.5 rounded-lg">
                          {storeTerminals.length + 1} Active Counters
                        </span>
                      </div>

                      <div className="flex-1 overflow-y-auto max-h-[460px] divide-y divide-slate-100 border border-slate-100 rounded-xl">
                        {/* Terminal 1: Store Owner */}
                        <div className="py-3 px-3.5 flex items-center justify-between bg-slate-50/60">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-extrabold font-mono text-[#006644] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                                COUNTER-01
                              </span>
                              <span className="font-extrabold text-slate-900 text-xs">
                                Main Chemist Desk (Owner)
                              </span>
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-[#00875a] text-white">
                                PRIMARY
                              </span>
                            </div>
                            <span className="text-xs text-slate-500 mt-0.5 block">
                              Operator: <strong>{storeDetails.pharmacistName}</strong> · Full Admin &amp; Wholesale Access
                            </span>
                          </div>
                          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg">
                            Owner Active
                          </span>
                        </div>

                        {/* Configured Staff Terminals */}
                        {storeTerminals.map((term) => (
                          <div key={term.id} className="py-3 px-3.5 flex items-center justify-between hover:bg-slate-50/80 transition">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-extrabold font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                                  {term.terminalCode}
                                </span>
                                <span className="font-extrabold text-slate-900 text-xs">
                                  {term.terminalName}
                                </span>
                              </div>
                              <span className="text-xs text-slate-600 mt-0.5 block">
                                Operator: <strong>{term.operatorName}</strong>
                              </span>
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-slate-400 font-mono mt-0.5">
                                <span>Email: <strong className="text-slate-700">{term.email || `${term.username}@apollocare.com`}</strong></span>
                                <span>User: <strong className="text-slate-700">@{term.username}</strong></span>
                                <span>Pass: <strong className="text-slate-700">{term.plainPassword || '••••••••'}</strong></span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleDeleteTerminal(term.id, term.operatorName)}
                                className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                title={`Delete ${term.operatorName}`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION 4: PROMOTIONAL DISCOUNTS & SEASONAL CAMPAIGNS */}
              {settingsActiveSection === 'discounts' && (
                <div className="space-y-4">
                  {/* Top Stats & Action Bar */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
                    <div className="bg-white border border-slate-200/90 rounded-lg p-4 shadow-2xs">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Active Campaign</span>
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      </div>
                      <div className="text-base font-extrabold text-slate-900 truncate">
                        {activePromoCampaign ? activePromoCampaign.name : 'No Active Campaign'}
                      </div>
                      <span className="text-xs font-bold text-[#00875a]">
                        {activePromoCampaign ? `${activePromoCampaign.discountPercent}% Store Discount Active` : 'Walk-in regular pricing'}
                      </span>
                    </div>

                    <div className="bg-white border border-slate-200/90 rounded-lg p-4 shadow-2xs">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Total Campaigns</span>
                        <Percent className="w-4 h-4 text-purple-600" />
                      </div>
                      <div className="text-2xl font-black text-slate-900">
                        {discountCampaigns.length}
                      </div>
                      <span className="text-xs text-slate-400 font-medium">Configured in PostgreSQL</span>
                    </div>

                    <div className="bg-white border border-slate-200/90 rounded-lg p-4 shadow-2xs">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Bills Generated</span>
                        <Receipt className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="text-2xl font-black text-slate-900">
                        {discountCampaigns.reduce((acc, c) => acc + (Number(c.usage_count) || 0), 0)}
                      </div>
                      <span className="text-xs text-slate-400 font-medium">Under promotional offers</span>
                    </div>

                    <div className="bg-white border border-slate-200/90 rounded-lg p-4 shadow-2xs">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Total Savings Given</span>
                        <TrendingUp className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div className="text-2xl font-black text-emerald-700">
                        ₹{discountCampaigns.reduce((acc, c) => acc + (Number(c.total_savings_given) || 0), 0).toFixed(2)}
                      </div>
                      <span className="text-xs text-slate-400 font-medium">Delighted patient savings</span>
                    </div>
                  </div>

                  {/* Campaign List Header & Add Button */}
                  <div className="bg-white border border-slate-200/90 rounded-lg p-5 shadow-2xs">
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-100">
                      <div>
                        <h3 className="text-sm font-extrabold text-slate-900">Promotional Discounts &amp; Seasonal Campaigns</h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                          When a campaign is marked Active, POS counter billing automatically applies this discount without manual calculation.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingDiscount(null);
                          setDiscountFormName('');
                          setDiscountFormPercent(10);
                          setDiscountFormCode('');
                          setDiscountFormDesc('');
                          setDiscountFormActive(true);
                          setIsDiscountModalOpen(true);
                        }}
                        className="px-4 py-2 bg-[#00875a] hover:bg-[#007048] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Create New Campaign</span>
                      </button>
                    </div>

                    {/* Campaigns Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                      {discountCampaigns.map((camp) => (
                        <div
                          key={camp.id}
                          className={`rounded-lg border p-4 transition relative flex flex-col justify-between ${
                            camp.isActive
                              ? 'bg-emerald-50/40 border-emerald-300 ring-2 ring-emerald-500/20 shadow-xs'
                              : 'bg-white border-slate-200/90 hover:border-slate-300 shadow-2xs'
                          }`}
                        >
                          <div>
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div>
                                <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-black mb-1.5 ${
                                  camp.isActive ? 'bg-[#00875a] text-white shadow-2xs' : 'bg-slate-100 text-slate-700'
                                }`}>
                                  {camp.discountPercent}% OFF
                                </span>
                                <h4 className="font-extrabold text-sm text-slate-900 leading-snug">
                                  {camp.name}
                                </h4>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleToggleDiscountCampaign(camp.id, camp.isActive)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition cursor-pointer shrink-0 ${
                                  camp.isActive
                                    ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                                title="Click to toggle Active / Inactive status"
                              >
                                {camp.isActive ? '● ACTIVE' : '○ INACTIVE'}
                              </button>
                            </div>

                            <p className="text-xs text-slate-600 line-clamp-2 mb-3">
                              {camp.description || 'General pharmacy discount campaign.'}
                            </p>

                            <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-xs grid grid-cols-2 gap-2 mb-3 font-mono">
                              <div>
                                <span className="text-[10px] text-slate-400 block uppercase font-bold">Promo Code</span>
                                <span className="font-bold text-slate-800">{camp.code || 'N/A'}</span>
                              </div>
                              <div>
                                <span className="text-[10px] text-slate-400 block uppercase font-bold">Bills Dispensed</span>
                                <span className="font-bold text-[#00875a]">{(camp.usageCount ?? camp.usage_count ?? 0)} bills</span>
                              </div>
                              <div className="col-span-2 border-t border-slate-200/60 pt-1.5 flex justify-between items-center">
                                <span className="text-[10px] text-slate-400 uppercase font-bold">Total Patient Savings</span>
                                <span className="font-extrabold text-emerald-700">₹{Number(camp.totalSavingsGiven ?? camp.total_savings_given ?? 0).toFixed(2)}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingDiscount(camp);
                                setDiscountFormName(camp.name);
                                setDiscountFormPercent(camp.discountPercent);
                                setDiscountFormCode(camp.code || '');
                                setDiscountFormDesc(camp.description || '');
                                setDiscountFormActive(camp.isActive);
                                setIsDiscountModalOpen(true);
                              }}
                              className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Edit Campaign</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteDiscountCampaign(camp.id, camp.name)}
                              className="text-xs font-bold text-rose-500 hover:text-rose-700 p-1 rounded-md hover:bg-rose-50 transition cursor-pointer"
                              title="Delete campaign"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: FORM 20 RETAIL TAX INVOICE RECEIPT (A4 OPTIMIZED, 15 PRODUCTS/PAGE) */}
      {/* ========================================================================= */}
      {(activeBillReceipt || viewingBillModal) && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto print-modal-overlay"
          onClick={() => {
            setActiveBillReceipt(null);
            setViewingBillModal(null);
          }}
        >
          

          <div
            className="bg-white border border-slate-200 rounded-lg shadow-2xl max-w-3xl w-full text-xs max-h-[94vh] flex flex-col overflow-hidden print-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            {(() => {
              const b = activeBillReceipt || viewingBillModal;
              const allItems = b.items || [];
              const itemsPerPage = 15;
              const totalPages = Math.max(1, Math.ceil(allItems.length / itemsPerPage));
              const pageChunks = Array.from({ length: totalPages }, (_, i) =>
                allItems.slice(i * itemsPerPage, (i + 1) * itemsPerPage)
              );

              const grossSubtotal = allItems.reduce(
                (acc: number, it: any) => acc + (Number(it.quantity || 1) * parseFloat(it.mrp || it.unitPrice || 0)),
                0
              ) || parseFloat(b.subtotal || 0);

              const discAmount = parseFloat(b.discountAmount || 0);
              const taxableVal = parseFloat(b.subtotal ?? Math.max(0, grossSubtotal - discAmount));
              const taxVal = parseFloat(b.taxAmount ?? (taxableVal * 0.12).toFixed(2));
              const totalVal = parseFloat(b.totalAmount ?? (taxableVal + taxVal).toFixed(2));
              const discountPctDisplay = b.discountPercent 
                ? `${parseFloat(b.discountPercent).toFixed(1)}%` 
                : (grossSubtotal > 0 && discAmount > 0 ? `${((discAmount / grossSubtotal) * 100).toFixed(1)}%` : '0%');

              const txnId = b.transactionId || ('TXN-' + (b.id ? b.id.replace('bill-', '') : (b.billNumber ? b.billNumber.replace(/[^0-9]/g, '') : Date.now())));
              const dateStr = new Date(b.createdAt || Date.now()).toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              });
              const timeStr = new Date(b.createdAt || Date.now()).toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true,
              });

              return (
                <div className="flex flex-col h-full">
                  {/* Top Header Toolbar (Screen Only) */}
                  <div className="screen-modal-chrome p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-[#00875a] text-white flex items-center justify-center font-bold">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-slate-900 text-sm">
                          Form 20 Statutory Retail Tax Invoice
                        </h3>
                        <p className="text-[11px] text-slate-500">
                          {totalPages} A4 Page{totalPages > 1 ? 's' : ''} · Standard 15 items per page limit
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveBillReceipt(null);
                          setViewingBillModal(null);
                        }}
                        className="px-3.5 py-1.5 border border-slate-200 hover:bg-white text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                      >
                        Close
                      </button>
                      <button
                        type="button"
                        onClick={handlePrintInvoice}
                        className="px-4 py-1.5 bg-[#00875a] hover:bg-[#007048] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Print / Save PDF (A4)</span>
                      </button>
                    </div>
                  </div>

                  {/* Printable & Scrollable Canvas */}
                  <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100/50 print-content-wrap">
                    <div id="form20-printable-invoice-portal" className="max-w-2xl mx-auto space-y-6">
                      {pageChunks.map((chunk, pageIdx) => {
                        const isLastPage = pageIdx === totalPages - 1;
                        return (
                          <div
                            key={pageIdx}
                            className={`print-a4-page bg-white border border-slate-200 p-5 rounded-lg shadow-sm ${
                              isLastPage ? 'print-no-break' : 'print-page-break'
                            }`}
                          >
                            <div>
                              {/* Store Identity & Compliance Header */}
                              <div className="border-b-2 border-slate-800 pb-3 mb-3">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-[10px] font-black tracking-widest uppercase bg-slate-900 text-white px-2 py-0.5 rounded">
                                        Form 20 / 21 Drug Retail
                                      </span>
                                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                                        Statutory Tax Invoice
                                      </span>
                                    </div>
                                    <h1 className="text-xl font-black text-slate-900 mt-1 tracking-tight">
                                      {b.storeName || storeDetails.name || user?.name || 'Apollo Care Pharmacy'}
                                    </h1>
                                    <p className="text-[11px] font-medium text-slate-600 mt-0.5">
                                      {b.storeAddress || (storeDetails.address ? `${storeDetails.address}, ${storeDetails.city || ''} ${storeDetails.pincode || ''}` : (user?.address || 'Shop No. 4, Sai Plaza, MG Road, Mumbai, Maharashtra - 400001'))}
                                    </p>
                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10px] text-slate-500 font-mono mt-1">
                                      <span>DL: <strong className="text-slate-800">{b.storeLicense || storeDetails.licenseNumber || user?.licenseNumber || 'DL-2024-MH-APO8821'}</strong></span>
                                      <span>GSTIN: <strong className="text-slate-800">{b.storeGstin || storeDetails.gstin || user?.gstin || '27AABCA1234F1Z8'}</strong></span>
                                      <span>Ph: <strong className="text-slate-800">{b.storePhone || storeDetails.phone || user?.phone || '+91 98200 44551'}</strong></span>
                                    </div>
                                  </div>

                                  <div className="text-right">
                                    <div className="inline-block bg-[#00875a]/10 border border-[#00875a]/30 text-[#006644] font-bold text-[11px] px-2.5 py-0.5 rounded-lg mb-1">
                                      {b.paymentMode || 'UPI'} · PAID
                                    </div>
                                    <div className="text-sm font-black font-mono text-slate-900">
                                      {b.billNumber}
                                    </div>
                                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                                      TXN: {txnId}
                                    </div>
                                    <div className="text-[10px] text-slate-600 font-mono mt-0.5">
                                      {dateStr} · {timeStr}
                                    </div>
                                    <div className="text-[10px] font-bold text-slate-500 mt-1">
                                      Page {pageIdx + 1} of {totalPages}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Customer, Prescriber & Operator Information Strip */}
                              <div className="grid grid-cols-2 gap-3 p-2.5 bg-slate-50 rounded-xl text-[11px] border border-slate-200/80 mb-3">
                                <div>
                                  <div className="flex items-center gap-1.5 text-slate-500 font-semibold mb-0.5">
                                    <span>PATIENT / CUSTOMER DETAILS</span>
                                  </div>
                                  <div className="font-extrabold text-slate-900 text-xs">
                                    {b.customerName || 'Walk-in Retail Customer'}
                                  </div>
                                  <div className="text-slate-600 font-mono text-[10px] mt-0.5">
                                    Contact: <strong>{b.customerPhone || 'N/A'}</strong>
                                  </div>
                                </div>

                                <div>
                                  <div className="flex items-center gap-1.5 text-slate-500 font-semibold mb-0.5">
                                    <span>PRESCRIPTION &amp; DISPENSED BY</span>
                                  </div>
                                  <div className="font-semibold text-slate-800 text-[11px] truncate">
                                    Dr: {b.doctorName || 'Self / General OPD'}
                                  </div>
                                  <div className="text-slate-600 text-[10px] mt-0.5 flex items-center gap-1.5 font-mono">
                                    <span className="bg-emerald-100 text-emerald-800 px-1 rounded font-bold">
                                      {b.terminalCode || 'COUNTER-01'}
                                    </span>
                                    <span className="truncate">
                                      {b.billedBy || 'Main Desk (Dr. Ramesh Patil)'}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Products Table (Max 15 items per page) */}
                              <div className="border border-slate-200 rounded-xl overflow-hidden mb-3">
                                <table className="print-table w-full text-left text-[11px]">
                                  <thead className="bg-slate-100/90 text-slate-700 font-bold border-b border-slate-200">
                                    <tr>
                                      <th className="p-2 text-center w-8">#</th>
                                      <th className="p-2">Medicine / Formulation</th>
                                      <th className="p-2 text-center">Batch</th>
                                      <th className="p-2 text-center">Exp.</th>
                                      <th className="p-2 text-center">GST</th>
                                      <th className="p-2 text-right">MRP</th>
                                      <th className="p-2 text-center font-bold">Qty</th>
                                      <th className="p-2 text-right">Rate</th>
                                      <th className="p-2 text-center">Disc%</th>
                                      <th className="p-2 text-right">Amount (₹)</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100">
                                    {chunk.map((it: any, itemIdx: number) => {
                                      const lineNo = pageIdx * itemsPerPage + itemIdx + 1;
                                      const unitRate = parseFloat(it.unitPrice || it.mrp || 0);
                                      const mrpVal = parseFloat(it.mrp || it.unitPrice || 0);
                                      const lineTotal = parseFloat(it.totalAmount || (it.quantity * unitRate));
                                      return (
                                        <tr key={itemIdx} className="border-b border-slate-100 text-[11px] hover:bg-slate-50/50">
                                          <td className="p-1.5 text-center font-mono text-slate-400 font-bold">{lineNo}</td>
                                          <td className="p-1.5">
                                            <span className="font-extrabold text-slate-900 block leading-tight">{it.brandName}</span>
                                            {it.genericName && (
                                              <span className="text-[10px] text-slate-500 block leading-none">{it.genericName}</span>
                                            )}
                                          </td>
                                          <td className="p-1.5 font-mono text-slate-700 font-bold text-center">{it.batchNumber || 'BTH-APO-8800'}</td>
                                          <td className="p-1.5 font-mono text-slate-600 text-center">
                                            {it.expiryDate ? it.expiryDate.substring(0, 7) : '2028-12'}
                                          </td>
                                          <td className="p-1.5 font-mono text-slate-500 text-center">12%</td>
                                          <td className="p-1.5 text-right font-mono text-slate-700">₹{mrpVal.toFixed(2)}</td>
                                          <td className="p-1.5 text-center font-mono font-bold text-slate-900 bg-slate-50/60">{it.quantity}</td>
                                          <td className="p-1.5 text-right font-mono text-slate-700">₹{unitRate.toFixed(2)}</td>
                                          <td className="p-1.5 text-center font-mono text-emerald-700 font-bold">
                                            {it.discountPercent ? `${it.discountPercent}%` : '-'}
                                          </td>
                                          <td className="p-1.5 text-right font-mono font-bold text-slate-900">
                                            ₹{lineTotal.toFixed(2)}
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            </div>

                            {/* Multi-Page Continuity Notice */}
                            {!isLastPage && (
                              <div className="py-2 text-center text-[10px] font-bold text-slate-500 border-t border-dashed border-slate-200">
                                Continued on Page {pageIdx + 2} of {totalPages} &#8594;
                              </div>
                            )}

                            {/* Final Page Financial Summary, Words, Stamp & Statutory Footer */}
                            {isLastPage && (
                              <div className="mt-2 pt-2 border-t border-slate-200 space-y-3">
                                <div className="grid grid-cols-2 gap-4">
                                  {/* Left: Words & Statutory Drug Disclaimer */}
                                  <div className="flex flex-col justify-between space-y-2">
                                    <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl">
                                      <span className="text-[10px] font-bold text-slate-500 uppercase block">
                                        Amount in Words (INR):
                                      </span>
                                      <span className="text-xs font-bold text-slate-900 block mt-0.5 leading-snug">
                                        {numberToWordsINR(totalVal)}
                                      </span>
                                    </div>

                                    <div className="text-[9px] text-slate-500 space-y-0.5 leading-tight pr-2">
                                      <p className="font-semibold text-slate-700">Drug Compliance Declarations:</p>
                                      <p>1. Schedule H/H1 warning: Sold by retail on prescription of a RMP only.</p>
                                      <p>2. Goods once sold cannot be returned without original cash memo &amp; seal intact.</p>
                                      <p>3. Store in cool, dry place. Protect from heat and direct sunlight.</p>
                                    </div>
                                  </div>

                                  {/* Right: Comprehensive Financial & Tax Breakdown */}
                                  <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1 text-xs">
                                    <div className="flex justify-between text-slate-600">
                                      <span>Gross Subtotal (MRP):</span>
                                      <span className="font-mono">₹{grossSubtotal.toFixed(2)}</span>
                                    </div>

                                    <div className="flex justify-between text-[#00875a] font-medium">
                                      <span className="flex items-center gap-1">
                                        <span>Discount Given:</span>
                                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1 rounded">
                                          {discountPctDisplay}
                                        </span>
                                      </span>
                                      <span className="font-mono font-bold">- ₹{discAmount.toFixed(2)}</span>
                                    </div>

                                    <div className="flex justify-between text-slate-600 pt-0.5 border-t border-slate-200/60">
                                      <span>Taxable Base Value:</span>
                                      <span className="font-mono">₹{taxableVal.toFixed(2)}</span>
                                    </div>

                                    <div className="flex justify-between text-slate-600 text-[11px]">
                                      <span>CGST (6.0%):</span>
                                      <span className="font-mono">₹{(taxVal / 2).toFixed(2)}</span>
                                    </div>

                                    <div className="flex justify-between text-slate-600 text-[11px]">
                                      <span>SGST (6.0%):</span>
                                      <span className="font-mono">₹{(taxVal / 2).toFixed(2)}</span>
                                    </div>

                                    <div className="flex justify-between text-slate-700 font-semibold pt-0.5 border-t border-slate-200/60">
                                      <span>Total GST (12.0%):</span>
                                      <span className="font-mono">₹{taxVal.toFixed(2)}</span>
                                    </div>

                                    <div className="flex justify-between items-center text-sm font-extrabold text-slate-900 pt-1.5 border-t-2 border-slate-800">
                                      <span>Net Grand Total:</span>
                                      <span className="font-mono text-base text-[#006644]">
                                        ₹{totalVal.toFixed(2)}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* Pharmacist Signature & Stamp Box */}
                                <div className="pt-2 border-t border-slate-200 flex items-end justify-between text-[10px]">
                                  <div>
                                    <span className="text-slate-400 font-mono block">
                                      Licensed Chemist: {b.storePharmacist || storeDetails.pharmacistName || user?.name || 'Dr. Ramesh Patil'} (Reg. No. {storeDetails.licenseNumber || 'MH-PH-44921'})
                                    </span>
                                    <span className="text-slate-400 font-mono block">
                                      Terminal: {b.terminalCode || 'COUNTER-01'} · Node: {txnId}
                                    </span>
                                  </div>

                                  <div className="text-center pr-4">
                                    <div className="w-40 border-b border-slate-400 mb-1"></div>
                                    <span className="font-bold text-slate-700 block">
                                      Registered Pharmacist Signature
                                    </span>
                                    <span className="text-[9px] text-slate-400 block">
                                      For {b.storeName || storeDetails.name || user?.name || 'Apollo Care Pharmacy'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Page Bottom Status Line */}
                            <div className="pt-2 mt-2 border-t border-slate-100 flex items-center justify-between text-[9px] text-slate-400 font-mono">
                              <span>Form 20 Statutory Retail Tax Invoice · Rule 65 Drugs &amp; Cosmetics Rules 1945</span>
                              <span>Page {pageIdx + 1} of {totalPages}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: UPDATE PHYSICAL SHELF STOCK COUNT                                  */}
      {/* ========================================================================= */}
      {updateStockModalItem && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
          onClick={() => {
            if (!isUpdatingStock) setUpdateStockModalItem(null);
          }}
        >
          <div
            className="bg-white border border-slate-200 rounded-xl shadow-2xl max-w-md w-full p-6 text-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                  Physical Stock Count
                </span>
                <h3 className="text-base font-extrabold text-slate-900 mt-0.5">{updateStockModalItem.brandName}</h3>
                <p className="text-xs text-slate-500">
                  Batch: {updateStockModalItem.batchNumber} · Current: <strong>{updateStockModalItem.onHandQuantity} units</strong>
                </p>
              </div>
              <button
                disabled={isUpdatingStock}
                onClick={() => setUpdateStockModalItem(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateStockSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  New Physical Shelf Stock Count (Units)
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setNewPhysicalStockCount(Math.max(0, newPhysicalStockCount - 10))}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-sm font-bold"
                  >
                    -10
                  </button>
                  <input
                    type="number"
                    min={0}
                    required
                    value={newPhysicalStockCount}
                    onChange={(e) => setNewPhysicalStockCount(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-xl text-center text-lg font-mono font-black text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#00875a]"
                  />
                  <button
                    type="button"
                    onClick={() => setNewPhysicalStockCount(newPhysicalStockCount + 10)}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-sm font-bold"
                  >
                    +10
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Reason for Stock Change
                </label>
                <select
                  value={updateReason}
                  onChange={(e) => setUpdateReason(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#00875a]"
                >
                  <option value="Physical shelf stock count audit">Physical shelf stock count audit</option>
                  <option value="Wholesale delivery inward received">Wholesale delivery inward received</option>
                  <option value="Damaged or expired blister pack return">Damaged or expired blister pack return</option>
                  <option value="Customer return / exchange adjustment">Customer return / exchange adjustment</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Store Shelf / Drawer Location 📍
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setUpdateStockModalItem(null);
                      setActiveTab('settings');
                    }}
                    className="text-[11px] text-[#00875a] hover:underline font-semibold"
                  >
                    + Manage Shelves in Settings
                  </button>
                </div>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-emerald-600 absolute left-3 top-3 pointer-events-none" />
                  <select
                    value={updateDrawerLocation}
                    onChange={(e) => setUpdateDrawerLocation(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#00875a] bg-white cursor-pointer"
                  >
                    {storeShelfLocations.map((loc) => (
                      <option key={loc.id || loc.name} value={loc.name}>
                        {loc.name} {loc.section ? `(${loc.section})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                {/* Quick Selection Pills strictly from storeShelfLocations */}
                <div className="flex flex-wrap gap-1.5 pt-2 max-h-24 overflow-y-auto">
                  {storeShelfLocations.slice(0, 12).map((loc) => (
                    <button
                      type="button"
                      key={loc.id || loc.name}
                      onClick={() => setUpdateDrawerLocation(loc.name)}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold transition cursor-pointer ${
                        updateDrawerLocation === loc.name
                          ? 'bg-[#00875a] text-white shadow-2xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {loc.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  disabled={isUpdatingStock}
                  onClick={() => setUpdateStockModalItem(null)}
                  className="flex-1 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingStock}
                  className="flex-1 py-2.5 bg-[#00875a] hover:bg-[#007048] disabled:bg-slate-300 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  {isUpdatingStock ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                      <span>Saving Count...</span>
                    </>
                  ) : (
                    <span>Save Count &amp; Location</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD MANUAL PRODUCT & STORE DRAWER LOCATOR                          */}
      {/* ========================================================================= */}
      {addManualProductModalOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => {
            if (!isSubmittingManualProduct) setAddManualProductModalOpen(false);
          }}
        >
          <div
            className="bg-white border border-slate-200 rounded-xl shadow-2xl max-w-2xl w-full p-6 text-sm my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-5 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 text-[#00875a] flex items-center justify-center shadow-xs">
                  <PackagePlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Add Manual Product &amp; Drawer Location
                  </h3>
                  <p className="text-xs text-slate-400">
                    Register medicine into store shelf stock and assign physical shop rack/drawer location
                  </p>
                </div>
              </div>
              <button
                disabled={isSubmittingManualProduct}
                onClick={() => setAddManualProductModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddManualProductSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Brand Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Medicine Brand Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={manualBrandName}
                    onChange={(e) => setManualBrandName(e.target.value)}
                    placeholder="e.g. Crocin Advance 500, Pan-D"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#00875a]"
                  />
                </div>

                {/* Generic Salt Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Generic Composition / Salt Name
                  </label>
                  <input
                    type="text"
                    value={manualGenericName}
                    onChange={(e) => setManualGenericName(e.target.value)}
                    placeholder="e.g. Paracetamol, Pantoprazole + Domperidone"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#00875a]"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Therapeutic Category
                  </label>
                  <select
                    value={manualCategory}
                    onChange={(e) => setManualCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#00875a]"
                  >
                    <option value="Analgesics / Fever">Analgesics / Fever / Pain</option>
                    <option value="Cardiovascular">Cardiovascular / Blood Pressure</option>
                    <option value="Antibiotic">Antibiotics / Anti-Infective</option>
                    <option value="Antidiabetic">Antidiabetic / Glycemic Care</option>
                    <option value="Antacid / Gastro">Antacids / Gastro Care</option>
                    <option value="Respiratory">Respiratory / Pulmonology</option>
                    <option value="Vitamins &amp; Minerals">Vitamins &amp; Supplements</option>
                    <option value="Dermatology">Dermatology / Topical</option>
                    <option value="General Medicine">General OTC Medicine</option>
                  </select>
                </div>

                {/* Dosage Form & Strength */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Form</label>
                    <select
                      value={manualDosageForm}
                      onChange={(e) => setManualDosageForm(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#00875a]"
                    >
                      <option value="TABLET">TABLET</option>
                      <option value="CAPSULE">CAPSULE</option>
                      <option value="SYRUP">SYRUP</option>
                      <option value="INJECTION">INJECTION</option>
                      <option value="INHALER">INHALER</option>
                      <option value="DROPS">DROPS</option>
                      <option value="OINTMENT">OINTMENT</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Strength</label>
                    <input
                      type="text"
                      value={manualStrength}
                      onChange={(e) => setManualStrength(e.target.value)}
                      placeholder="e.g. 500 mg"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#00875a]"
                    />
                  </div>
                </div>

                {/* Batch Number & Expiry */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Batch Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={manualBatchNumber}
                    onChange={(e) => setManualBatchNumber(e.target.value)}
                    placeholder="e.g. BTH-APO-9912"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#00875a]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Expiry Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={manualExpiryDate}
                    onChange={(e) => setManualExpiryDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-mono text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#00875a]"
                  />
                </div>
              </div>

              {/* Physical Shop Location / Drawer Section */}
              <div className="p-4 bg-emerald-50/60 border border-emerald-200/80 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-extrabold text-emerald-950 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-emerald-700" />
                    <span>Store Shelf / Drawer Storage Location *</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setAddManualProductModalOpen(false);
                      setActiveTab('settings');
                    }}
                    className="text-[11px] text-emerald-700 hover:underline font-bold cursor-pointer"
                  >
                    + Manage Shelves in Settings
                  </button>
                </div>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-emerald-600 absolute left-3 top-3.5 pointer-events-none" />
                  <select
                    value={manualDrawerLocation}
                    onChange={(e) => setManualDrawerLocation(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-emerald-300 rounded-xl text-sm font-bold font-mono text-emerald-950 focus:outline-none focus:ring-2 focus:ring-[#00875a] cursor-pointer"
                  >
                    {storeShelfLocations.map((loc) => (
                      <option key={loc.id || loc.name} value={loc.name}>
                        {loc.name} {loc.section ? `· ${loc.section}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                {/* Quick Presets - Strictly from configured storeShelfLocations */}
                <div className="flex flex-wrap gap-1.5 pt-1 max-h-28 overflow-y-auto">
                  {storeShelfLocations.map((loc) => (
                    <button
                      type="button"
                      key={loc.id || loc.name}
                      onClick={() => setManualDrawerLocation(loc.name)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold font-mono transition cursor-pointer ${
                        manualDrawerLocation === loc.name
                          ? 'bg-[#00875a] text-white shadow-2xs'
                          : 'bg-white hover:bg-emerald-100/70 border border-emerald-200 text-emerald-800'
                      }`}
                    >
                      {loc.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pricing & Stock Count */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Opening Stock (Units)
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={manualOnHandQty}
                    onChange={(e) => setManualOnHandQty(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#00875a]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Wholesale Cost (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    required
                    value={manualUnitCost}
                    onChange={(e) => setManualUnitCost(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-mono text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#00875a]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Retail MRP (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    required
                    value={manualMrp}
                    onChange={(e) => setManualMrp(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-mono text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#00875a]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Counter Price (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    required
                    value={manualSellingPrice}
                    onChange={(e) => setManualSellingPrice(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#00875a]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  disabled={isSubmittingManualProduct}
                  onClick={() => setAddManualProductModalOpen(false)}
                  className="px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingManualProduct}
                  className="px-5 py-2.5 bg-[#00875a] hover:bg-[#007048] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  {isSubmittingManualProduct ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Saving to Shelf...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Save &amp; Place on Shelf</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DRAWER: WHOLESALE SUPPLIER ALLOCATION & REAL-TIME DISTRIBUTOR COMPARISON */}
      {/* ========================================================================= */}
      {selectedMedicine && (() => {
        const destPin = (storeDetails.pincode || destinationPincode || '400001').trim();
        const destCity = (storeDetails.city || 'Mumbai').toLowerCase().trim();

        const computeLogisticsRoute = (dName: string) => {
          const isMedVantage = dName.includes('MedVantage');
          const isApex = dName.includes('Apex');
          let distanceKm = 36.2;
          let eta = '~3.5 hrs · Cold-Chain Express';

          if (destPin.startsWith('416') || destCity.includes('kolhapur')) {
            distanceKm = isMedVantage ? 386.4 : isApex ? 374.8 : 368.2;
            eta = isMedVantage ? '~7.5 hrs · Dedicated Cold-Chain Freight' : '~7.0 hrs · NH-48 Express Cargo';
          } else if (destPin.startsWith('411') || destCity.includes('pune')) {
            distanceKm = isMedVantage ? 152.0 : isApex ? 142.5 : 136.0;
            eta = isMedVantage ? '~3.2 hrs · Expressway Cold-Chain' : '~2.8 hrs · Expressway Cargo';
          } else if (destPin.startsWith('422') || destCity.includes('nashik')) {
            distanceKm = isMedVantage ? 140.2 : isApex ? 168.0 : 175.5;
            eta = '~3.5 hrs · Dedicated Pharma Van';
          } else if (destPin.startsWith('400') || destCity.includes('mumbai') || destCity.includes('thane') || destCity.includes('navi')) {
            if (destPin.startsWith('400001') || destCity.includes('fort') || destCity.includes('colaba')) {
              distanceKm = isMedVantage ? 36.2 : isApex ? 14.8 : 24.5;
              eta = isMedVantage ? '~3.5 hrs · Cold-Chain Express' : isApex ? '~1.5 hrs · Intra-City Courier' : '~2.2 hrs · Dedicated Van';
            } else if (destPin.startsWith('4007') || destCity.includes('vashi')) {
              distanceKm = isMedVantage ? 31.5 : isApex ? 18.2 : 4.5;
              eta = isMedVantage ? '~2.5 hrs' : isApex ? '~1.5 hrs' : '~45 mins · Local Hub Dispatch';
            } else {
              distanceKm = isMedVantage ? 34.0 : isApex ? 16.5 : 22.0;
              eta = '~2.0-3.0 hrs · Intra-City Logistics';
            }
          } else {
            const pinNum = parseInt(destPin, 10) || 400001;
            const delta = Math.abs(pinNum - 421302);
            distanceKm = Math.min(1850, Math.max(25, parseFloat((delta * 0.45 + 35).toFixed(1))));
            eta = distanceKm > 300 ? `~${Math.round(distanceKm / 50)} hrs · Dedicated Pharma Freight` : `~${Math.round(distanceKm / 35)} hrs · Regional Courier`;
          }
          return { distanceKm, eta };
        };

        // Build candidate offers strictly from real backend recommendations & active released inventory
        const candidateOffers: any[] = [];
        if (comparisonResults?.recommendations && comparisonResults.recommendations.length > 0) {
          comparisonResults.recommendations.forEach((rec: any, idx: number) => {
            const c = rec.candidate || {};
            const batchNo = c.batchNumber || '';
            // Quarantine & Recall check
            if (quarantinedBatches[batchNo] || c.qaQuarantineStatus === 'QUARANTINED' || c.isRecalled) {
              return;
            }
            if (c.availableQuantity !== undefined && c.availableQuantity <= 0) {
              return;
            }

            const dName = c.distributorName || 'MedVantage Pharma Logistics';
            const route = computeLogisticsRoute(dName);
            candidateOffers.push({
              id: c.distributorId || `dist-${idx}`,
              distributorId: c.distributorId || 'dist-01',
              distributorName: dName,
              licenseNumber: c.licenseNumber || 'WDL-2024-MVL-101',
              location: c.location || (dName.includes('MedVantage') 
                ? 'Bhiwandi Central Pharma Hub, Unit 14-18, Mankoli (Pin 421302)' 
                : dName.includes('Apex') 
                ? 'Kurla West Logistics Park, LBS Marg (Pin 400070)' 
                : 'Sector 19-C, APMC Market Complex, Vashi (Pin 400703)'),
              distanceKm: route.distanceKm,
              eta: route.eta,
              batchNumber: batchNo || `BTH-MVL-${1000 + idx * 4}`,
              expiryDate: c.expiryDate || '28 Feb 2028',
              availableQuantity: c.availableQuantity || 240,
              unitPrice: Number(c.unitPrice || selectedMedicine.basePrice || 48),
              mrp: Number(c.mrp || (Number(c.unitPrice || selectedMedicine.basePrice) * 1.25)),
              fulfillmentRating: c.fulfillmentRating || (98.5 - idx * 2.1),
              overallScore: rec.overallScore || 96.5,
              explanation: rec.explanation?.summary || 'Optimal lead-time and temperature-controlled stock availability.',
              isTopPick: candidateOffers.length === 0,
            });
          });
        } else if (comparisonResults?.offers && comparisonResults.offers.length > 0) {
          comparisonResults.offers.forEach((off: any, idx: number) => {
            const batchNo = off.batchNumber || '';
            if (quarantinedBatches[batchNo] || off.qaQuarantineStatus === 'QUARANTINED' || off.isRecalled) {
              return;
            }
            if (off.availableQuantity !== undefined && off.availableQuantity <= 0) {
              return;
            }
            const dName = off.distributorName || 'MedVantage Pharma Logistics';
            const route = computeLogisticsRoute(dName);
            candidateOffers.push({
              ...off,
              distanceKm: off.distanceKm || route.distanceKm,
              eta: off.eta || route.eta,
              isTopPick: candidateOffers.length === 0,
            });
          });
        }

        return (
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex justify-end animate-in fade-in duration-200"
            onClick={() => setSelectedMedicine(null)}
          >
            <div
              className="bg-white w-full max-w-xl h-full shadow-2xl flex flex-col justify-between overflow-y-auto p-5 sm:p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div>
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-50 text-[#00875a] flex items-center justify-center font-bold shadow-xs">
                      <Truck className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                        Wholesale Supplier Allocation Engine
                      </span>
                      <h3 className="text-lg font-black text-slate-900 leading-tight">
                        {selectedMedicine.brandName}
                      </h3>
                      <span className="text-xs text-slate-500 font-medium">
                        {selectedMedicine.genericName} · {selectedMedicine.strength}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedMedicine(null)}
                    className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Verified Store Physical Location Card */}
                <div className="my-3.5 p-3.5 bg-emerald-50/70 border border-emerald-200/90 rounded-xl text-xs shadow-2xs">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-[#00875a] text-white flex items-center justify-center shrink-0 mt-0.5">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-slate-900 text-xs">
                            {storeDetails.name || 'Apollo Care Pharmacy'}
                          </span>
                          <span className="bg-[#00875a]/10 text-[#006644] font-bold text-[10px] px-2 py-0.5 rounded-full border border-[#00875a]/25">
                            Receiving Chemist Store
                          </span>
                        </div>
                        <p className="text-slate-600 text-[11px] mt-1 font-medium flex items-center gap-1.5 flex-wrap">
                          <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                          <span>
                            {storeDetails.address ? `${storeDetails.address}, ${storeDetails.city || ''}` : 'Shop No. 4, Colaba Causeway, Near Regal Cinema, Mumbai'}
                          </span>
                          <strong className="text-slate-900 font-mono bg-white px-1.5 py-0.2 rounded border border-slate-200">
                            PIN: {destPin}
                          </strong>
                        </p>
                        <div className="text-[10px] text-slate-500 font-mono mt-1.5 flex items-center gap-3">
                          <span>DL: <strong className="text-slate-800">{storeDetails.licenseNumber || 'DL-2024-MH-APO8821'}</strong></span>
                          <span>Ph: <strong className="text-slate-800">{storeDetails.phone || '+91 98200 12345'}</strong></span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Requested Quantity Selector with Quick Presets */}
                <div className="mb-4 bg-slate-50 border border-slate-200/80 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-slate-700">
                      Procurement Order Quantity:
                    </label>
                    <span className="text-xs font-mono text-slate-600 font-bold flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-rose-500" />
                      <span>Destination: {storeDetails.city || 'Mumbai'} ({destPin})</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center bg-white border border-slate-300 rounded-xl overflow-hidden shadow-2xs">
                      <button
                        type="button"
                        onClick={() => setRequestedQty(Math.max(10, requestedQty - 10))}
                        className="px-3 py-2 text-slate-600 hover:bg-slate-100 font-bold transition cursor-pointer"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <input
                        type="number"
                        min={10}
                        step={10}
                        value={requestedQty}
                        onChange={(e) => setRequestedQty(Math.max(10, parseInt(e.target.value, 10) || 10))}
                        className="w-20 text-center font-black font-mono text-sm text-slate-900 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setRequestedQty(requestedQty + 10)}
                        className="px-3 py-2 text-slate-600 hover:bg-slate-100 font-bold transition cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      {[25, 50, 100, 250, 500].map((qty) => (
                        <button
                          key={qty}
                          type="button"
                          onClick={() => setRequestedQty(qty)}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
                            requestedQty === qty
                              ? 'bg-[#00875a] text-white shadow-2xs'
                              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {qty} u
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Loading state indicator */}
                {loadingComparison && (
                  <div className="py-8 text-center text-xs text-slate-500 bg-white border border-slate-100 rounded-lg mb-4">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#00875a]" />
                    Optimizing multi-factor supplier ranking (lead-time, distance, SLA)...
                  </div>
                )}

                {/* Verified Distributor Quotes */}
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                      Available Wholesale Quotes ({candidateOffers.length})
                    </span>
                    <span className="text-[11px] text-[#00875a] font-bold flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> CDSCO Verified
                    </span>
                  </div>

                  {candidateOffers.length === 0 ? (
                    <div className="p-6 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl text-center">
                      <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                      <h4 className="text-sm font-extrabold text-slate-800">No Wholesale Quotes Available</h4>
                      <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                        None of the verified wholesale distributors currently have released, non-quarantined stock for <strong className="text-slate-700">{selectedMedicine.brandName}</strong>.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setIndentForm({
                            medicineName: selectedMedicine.brandName,
                            genericName: selectedMedicine.genericName || '',
                            dosageForm: selectedMedicine.category?.toUpperCase() || 'TABLET',
                            strength: selectedMedicine.strength || '',
                            requiredQty: requestedQty || 50,
                            distributorId: 'ALL',
                            urgency: 'HIGH',
                            targetDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
                            notes: `Wholesale stock depleted or quarantined for ${selectedMedicine.brandName}. Chemist requesting immediate sourcing.`
                          });
                          setSelectedMedicine(null);
                          setIsIndentModalOpen(true);
                        }}
                        className="mt-4 px-4 py-2 bg-[#004733] hover:bg-[#003727] text-white text-xs font-bold rounded-xl transition cursor-pointer inline-flex items-center gap-1.5 shadow-2xs"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>Raise Chemist Indent to Wholesalers</span>
                      </button>
                    </div>
                  ) : (
                    candidateOffers.map((offer, idx) => {
                      const lineSubtotal = requestedQty * offer.unitPrice;
                      const gstAmount = lineSubtotal * 0.12;
                      const grandTotal = lineSubtotal + gstAmount;

                      return (
                        <div
                          key={offer.id || idx}
                          className={`rounded-lg border p-4 transition relative flex flex-col justify-between ${
                            offer.isTopPick
                              ? 'bg-emerald-50/30 border-[#00875a]/50 ring-2 ring-[#00875a]/15 shadow-sm'
                              : 'bg-white border-slate-200/90 hover:border-slate-300 shadow-2xs'
                          }`}
                        >
                        <div>
                          {/* Top Row: Rank, Distributor Name, Rating */}
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div>
                              <div className="flex items-center gap-1.5 mb-1">
                                {offer.isTopPick ? (
                                  <span className="bg-[#00875a] text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-2xs flex items-center gap-1">
                                    <Sparkles className="w-3 h-3" /> #1 RECOMMENDED
                                  </span>
                                ) : (
                                  <span className="bg-slate-100 text-slate-700 text-[10px] font-black px-2 py-0.5 rounded-full">
                                    QUOTE #{idx + 1}
                                  </span>
                                )}
                                <span className="text-[11px] font-mono text-slate-400">
                                  {offer.licenseNumber}
                                </span>
                              </div>
                              <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                                <span>{offer.distributorName}</span>
                                <CheckCircle2 className="w-3.5 h-3.5 text-[#00875a] shrink-0" />
                              </h4>
                            </div>

                            <div className="text-right shrink-0">
                              <span className="text-xs font-mono font-black text-slate-900 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg inline-block">
                                ★ {Number(offer.fulfillmentRating).toFixed(1)}% SLA
                              </span>
                            </div>
                          </div>

                          {/* Real-Life Physical Location & Distance to Store */}
                          <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs mb-3 space-y-1.5">
                            <div className="flex items-start gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                              <div className="min-w-0">
                                <span className="text-[10px] text-slate-400 font-bold uppercase block">Distributor Depot</span>
                                <span className="font-semibold text-slate-800 block truncate">{offer.location}</span>
                              </div>
                            </div>
                            <div className="pt-1.5 border-t border-slate-200/60 flex items-center justify-between text-[11px] flex-wrap gap-1">
                              <span className="text-slate-600 flex items-center gap-1">
                                <Truck className="w-3.5 h-3.5 text-[#00875a] shrink-0" />
                                <span>Direct distance to your store: <strong className="text-slate-900 font-mono">{offer.distanceKm} km</strong></span>
                              </span>
                              <span className="font-bold text-[#00875a] bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md text-[10px] shrink-0">
                                {offer.eta}
                              </span>
                            </div>
                          </div>

                          {/* Batch & Inventory Stats */}
                          <div className="bg-white border border-slate-200/80 rounded-xl p-2.5 text-xs grid grid-cols-3 gap-2 mb-3 font-mono">
                            <div>
                              <span className="text-[10px] text-slate-400 block uppercase font-bold">Batch #</span>
                              <span className="font-bold text-slate-800 truncate block">{offer.batchNumber}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 block uppercase font-bold">Expiry Date</span>
                              <span className="font-bold text-slate-800 truncate block">{offer.expiryDate}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] text-slate-400 block uppercase font-bold">Stock At Depot</span>
                              <span className="font-bold text-[#00875a]">{offer.availableQuantity} units</span>
                            </div>
                          </div>

                          {/* Pricing Matrix */}
                          <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 mb-3 text-xs">
                            <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/60 font-mono">
                              <span className="text-slate-500">Wholesale Unit Rate</span>
                              <div>
                                <span className="font-black text-slate-900 text-sm">₹{offer.unitPrice.toFixed(2)}</span>
                                <span className="text-[11px] text-slate-400 line-through ml-1.5">₹{offer.mrp.toFixed(2)} MRP</span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between pt-1.5 font-mono">
                              <span className="text-slate-600 font-semibold">
                                Total for {requestedQty} units (incl. 12% GST):
                              </span>
                              <span className="font-extrabold text-[#00875a] text-sm">
                                ₹{grandTotal.toFixed(2)}
                              </span>
                            </div>
                          </div>

                          <p className="text-[11px] text-slate-500 mb-3 italic">
                            💡 {offer.explanation}
                          </p>
                        </div>

                        {/* Order Placement CTA */}
                        <button
                          type="button"
                          disabled={isPlacingOrder}
                          onClick={() => handlePlaceWholesaleOrder(offer)}
                          className="w-full py-2.5 bg-[#00875a] hover:bg-[#007048] disabled:bg-slate-300 text-white rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:cursor-not-allowed"
                        >
                          {isPlacingOrder ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>Reserving Batch in PostgreSQL...</span>
                            </>
                          ) : (
                            <>
                              <Truck className="w-3.5 h-3.5" />
                              <span>Reserve Batch &amp; Place Wholesale Order (₹{grandTotal.toFixed(2)})</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ========================================================================= */}
      {/* MODAL: AI RESTOCK PROPOSAL REVIEW                                         */}
      {/* ========================================================================= */}
      {restockModalAlert && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
          onClick={() => {
            if (!isSubmittingRestock) setRestockModalAlert(null);
          }}
        >
          <div
            className="bg-white border border-slate-200 rounded-xl shadow-2xl max-w-lg w-full p-6 text-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <span className="text-[11px] font-bold tracking-wider text-[#ffab00] uppercase flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> Stockout Prevention PO
                </span>
                <h3 className="text-base font-extrabold text-slate-900 mt-0.5">{restockModalAlert.brandName}</h3>
                <p className="text-xs text-slate-500">
                  Current Shelf: {restockModalAlert.currentStock} units · Threshold: {restockModalAlert.reorderPoint}
                </p>
              </div>
              <button
                disabled={isSubmittingRestock}
                onClick={() => setRestockModalAlert(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 mb-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Restock Order Quantity</label>
                <input
                  type="number"
                  min={10}
                  value={restockAdjustedQty}
                  onChange={(e) => setRestockAdjustedQty(parseInt(e.target.value, 10) || 10)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#00875a]"
                />
              </div>

              {restockQuote?.recommendation && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs">
                  <span className="font-bold text-[#006644] block mb-1">Best Supplier Allocated:</span>
                  <div className="flex justify-between text-slate-700">
                    <span>{restockQuote.recommendation.distributorName}</span>
                    <span className="font-bold font-mono">₹{restockQuote.recommendation.unitPrice.toFixed(2)}/unit</span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2.5">
              <button
                type="button"
                disabled={isSubmittingRestock}
                onClick={() => setRestockModalAlert(null)}
                className="flex-1 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Dismiss
              </button>
              <button
                type="button"
                disabled={isSubmittingRestock || !restockQuote?.recommendation}
                onClick={handleConfirmRestockOrder}
                className="flex-1 py-2.5 bg-[#00875a] hover:bg-[#007048] disabled:bg-slate-300 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                {isSubmittingRestock ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                    <span>Placing PO...</span>
                  </>
                ) : (
                  <>
                    <Truck className="w-3.5 h-3.5" />
                    <span>Confirm Wholesale PO</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: PROFESSIONAL CDSCO FORM 20B/21B WHOLESALE TAX INVOICE               */}
      {/* ========================================================================= */}
      {invoiceModalOrder && (
        <WholesaleInvoiceModal
          order={invoiceModalOrder}
          invoiceData={invoiceData}
          storeDetails={storeDetails}
          onClose={() => setInvoiceModalOrder(null)}
        />
      )}

      {/* ========================================================================= */}
      {/* MODAL: WHOLESALE B2B PAYMENT GATEWAY (NEFT/RTGS, UPI QR, CREDIT LINE)     */}
      {/* ========================================================================= */}
      {paymentModalOrder && (
        <WholesalePaymentModal
          order={paymentModalOrder}
          onClose={() => setPaymentModalOrder(null)}
          onSuccess={async () => {
            await fetchOrders(true);
            setPaymentModalOrder(null);
          }}
        />
      )}

      {/* ========================================================================= */}
      {/* MODAL: RETAIL POS PAYMENT GATEWAY (UPI, TEST CARDS, CASH TENDER, WALLETS) */}
      {/* ========================================================================= */}
      <POSPaymentModal
        isOpen={isPosPaymentModalOpen}
        onClose={() => setIsPosPaymentModalOpen(false)}
        grandTotal={grandTotal}
        taxableAmount={taxableAmount}
        totalTax={totalTaxAmount}
        discountAmount={totalDiscount}
        customerName={customerName}
        customerPhone={customerPhone}
        onPaymentSuccess={handleCompletePOSCheckout}
      />

      {/* ========================================================================= */}
      {/* MODAL: LIVE GPS & COLD-CHAIN FLEET TRACKING MODAL                         */}
      {/* ========================================================================= */}
      {trackingOrderModal && (
        <LiveFleetTrackingModal
          order={trackingOrderModal}
          onClose={() => setTrackingOrderModal(null)}
        />
      )}

      {/* ========================================================================= */}
      {/* MODAL: RAISE CHEMIST INDENT / SPECIAL SOURCING REQUEST                    */}
      {/* ========================================================================= */}
      {isIndentModalOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4"
          onClick={() => setIsIndentModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#00875a] flex items-center justify-center font-bold">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">Raise Chemist Indent</h3>
                  <p className="text-xs text-slate-400">Request unlisted, out-of-stock, or specialty medicines</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsIndentModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitIndent} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Medicine / Brand Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Telma 40, Augmentin 625 Duo, Monocef 1g"
                  value={indentForm.medicineName}
                  onChange={(e) => setIndentForm({ ...indentForm, medicineName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#00875a]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Active Molecule / Generic
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Telmisartan 40mg"
                    value={indentForm.genericName}
                    onChange={(e) => setIndentForm({ ...indentForm, genericName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#00875a]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Dosage Form
                  </label>
                  <select
                    value={indentForm.dosageForm}
                    onChange={(e) => setIndentForm({ ...indentForm, dosageForm: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#00875a]"
                  >
                    <option value="TABLET">Tablet</option>
                    <option value="CAPSULE">Capsule</option>
                    <option value="SYRUP">Syrup</option>
                    <option value="INJECTION">Injection</option>
                    <option value="DROPS">Drops</option>
                    <option value="OINTMENT">Ointment / Gel</option>
                    <option value="INHALER">Inhaler</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Strength / Packing
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 40mg, 10x10 Strip"
                    value={indentForm.strength}
                    onChange={(e) => setIndentForm({ ...indentForm, strength: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#00875a]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Required Quantity (Units) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={indentForm.requiredQty}
                    onChange={(e) => setIndentForm({ ...indentForm, requiredQty: parseInt(e.target.value, 10) || 1 })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#00875a]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Target Wholesaler
                  </label>
                  <select
                    value={indentForm.distributorId}
                    onChange={(e) => setIndentForm({ ...indentForm, distributorId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#00875a]"
                  >
                    <option value="ALL">Any Authorized Wholesaler</option>
                    {distributorsList.map((d: any) => (
                      <option key={d.id} value={d.id}>{d.companyName || d.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Sourcing Urgency
                  </label>
                  <select
                    value={indentForm.urgency}
                    onChange={(e) => setIndentForm({ ...indentForm, urgency: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#00875a]"
                  >
                    <option value="STANDARD">Standard (3-5 Days)</option>
                    <option value="URGENT">Urgent (24-48 Hours)</option>
                    <option value="CRITICAL">Critical (Immediate Same-Day)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Pharmacist Clinical Notes / Specifications
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Specific brand preferred, patient waiting, cold-chain handling required"
                  value={indentForm.notes}
                  onChange={(e) => setIndentForm({ ...indentForm, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#00875a]"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsIndentModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingIndent}
                  className="px-5 py-2 bg-[#004733] hover:bg-[#003727] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  {isSubmittingIndent ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Notifying Wholesalers...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Dispatch Indent Request</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD / EDIT PROMOTIONAL DISCOUNT CAMPAIGN                           */}
      {/* ========================================================================= */}
      {isDiscountModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-lg p-5 sm:p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center font-black">
                  %
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">
                    {editingDiscount ? 'Edit Promotional Campaign' : 'Create New Promotional Campaign'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Configures store-wide seasonal discount automatically applied at counter POS
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDiscountModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDiscountCampaign} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Campaign Name *
                </label>
                <input
                  type="text"
                  required
                  value={discountFormName}
                  onChange={(e) => setDiscountFormName(e.target.value)}
                  placeholder="e.g. Diwali Festive Offer, Senior Citizen Healthcare"
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#00875a]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Discount Percentage (%) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min={1}
                      max={100}
                      step="0.5"
                      value={discountFormPercent}
                      onChange={(e) => setDiscountFormPercent(parseFloat(e.target.value) || 0)}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-bold font-mono text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#00875a]"
                    />
                    <span className="absolute right-3.5 top-2 text-xs font-bold text-slate-400">% OFF</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Promo Code (Optional)
                  </label>
                  <input
                    type="text"
                    value={discountFormCode}
                    onChange={(e) => setDiscountFormCode(e.target.value.toUpperCase())}
                    placeholder="e.g. DIWALI10"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#00875a]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Campaign Description
                </label>
                <textarea
                  rows={2}
                  value={discountFormDesc}
                  onChange={(e) => setDiscountFormDesc(e.target.value)}
                  placeholder="e.g. Special festive season 10% discount across all regular prescription and OTC orders."
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#00875a]"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="campaignActiveCheck"
                  checked={discountFormActive}
                  onChange={(e) => setDiscountFormActive(e.target.checked)}
                  className="w-4 h-4 text-[#00875a] rounded border-slate-300 focus:ring-[#00875a] cursor-pointer"
                />
                <label htmlFor="campaignActiveCheck" className="text-xs font-bold text-slate-700 cursor-pointer">
                  Activate this campaign immediately (applies to upcoming POS bills)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsDiscountModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingDiscount}
                  className="px-4 py-2 bg-[#00875a] hover:bg-[#007048] disabled:bg-slate-300 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  {isSavingDiscount ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving in DB...</span>
                    </>
                  ) : (
                    <span>{editingDiscount ? 'Update Campaign' : 'Save & Publish Campaign'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
