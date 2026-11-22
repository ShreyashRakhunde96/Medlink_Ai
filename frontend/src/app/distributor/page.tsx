'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Truck,
  Home,
  Package,
  Box,
  BarChart2,
  Sliders,
  FileText,
  RotateCcw,
  TrendingUp,
  Star,
  Settings,
  HelpCircle,
  Bell,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  AlertTriangle,
  Sun,
  MapPin,
  ChevronDown,
  ChevronRight,
  MoreVertical,
  Plus,
  RefreshCw,
  Calendar,
  X,
  Send,
  Download,
  UploadCloud,
  FileSpreadsheet,
  Filter,
  ExternalLink,
  User,
  LogOut,
  Layers,
  Activity,
  ShieldCheck,
  ArrowRight,
  Check,
  Snowflake,
  Edit3,
  PanelLeftClose,
  PanelLeftOpen,
  Sparkles,
  ShoppingBag,
  Printer,
  CreditCard,
} from 'lucide-react';
import { getStoredUser, setStoredUser, clearStoredUser, DEMO_USERS, UserSession } from '@/lib/auth';
import { firebaseSignIn, firebaseSignOut } from '@/lib/firebase';
import { API_BASE, getApiBase } from '@/lib/api';
import { WholesaleInvoiceModal } from '@/components/WholesaleInvoiceModal';
import { NotificationCenter } from '@/components/NotificationCenter';
import { LiveFleetTrackingModal } from '@/components/LiveFleetTrackingModal';

// Helper for formulation pastel badge icons
const MedicineIcon = ({ name }: { name: string }) => {
  const n = (name || '').toLowerCase();
  let bg = 'bg-slate-100 text-slate-700';
  if (n.includes('amlong')) bg = 'bg-[#ffebe6] text-[#de350b]';
  else if (n.includes('asthalin')) bg = 'bg-[#deebff] text-[#0052cc]';
  else if (n.includes('augmentin')) bg = 'bg-[#eae6ff] text-[#5243aa]';
  else if (n.includes('azee')) bg = 'bg-[#e3fcef] text-[#006644]';
  else if (n.includes('brufen')) bg = 'bg-[#fffae6] text-[#ff8b00]';
  else if (n.includes('cifran')) bg = 'bg-[#e6fcff] text-[#008da6]';
  else if (n.includes('dolo')) bg = 'bg-[#ffebe6] text-[#ff5630]';
  else if (n.includes('glycomet')) bg = 'bg-[#f3e8ff] text-[#7e22ce]';
  else if (n.includes('huminsulin')) bg = 'bg-[#ecfdf5] text-[#047857]';
  else if (n.includes('montek')) bg = 'bg-[#ffe4e6] text-[#be123c]';
  else if (n.includes('pan')) bg = 'bg-[#e0e7ff] text-[#4338ca]';
  else if (n.includes('shelcal')) bg = 'bg-[#fef3c7] text-[#b45309]';
  else if (n.includes('telma')) bg = 'bg-[#fee2e2] text-[#b91c1c]';
  else if (n.includes('zerodol')) bg = 'bg-[#f0fdf4] text-[#15803d]';

  return (
    <div className={`w-8 h-8 rounded-full ${bg} flex items-center justify-center shrink-0 font-bold text-xs shadow-2xs`}>
      <Package className="w-4 h-4" />
    </div>
  );
};

export default function DistributorDashboard() {
  const [user, setUser] = useState<UserSession | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Login form state if unauthenticated
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);

  // Active Navigation Tab: 8 core logistics tabs + Chemist Indents + Settings
  const [activeNav, setActiveNav] = useState<
    'dashboard' | 'fulfillment' | 'inventory' | 'stock' | 'retailer-orders' | 'returns' | 'reports' | 'sla' | 'settings' | 'indents'
  >('dashboard');

  // Collapsible sidebar state (Icon-only mode with tooltips)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const toggleSidebar = () => setIsSidebarCollapsed((prev) => !prev);

  // Real-time ticking date & time clock
  const [currentDateTime, setCurrentDateTime] = useState('');
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentDateTime(
        now.toLocaleDateString('en-IN', {
          weekday: 'short',
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
    };
    updateTime();
    const clockTimer = setInterval(updateTime, 1000);
    return () => clearInterval(clockTimer);
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Good Morning,';
    if (hour >= 12 && hour < 17) return 'Good Afternoon,';
    return 'Good Evening,';
  };

  // Distributor Profile & WMS Settings state
  const [distributorSettings, setDistributorSettings] = useState({
    name: 'MedVantage Pharma Logistics Hub',
    contactPerson: 'Rajesh Sharma (C&F Operations Lead)',
    phone: '+91 98201 55667',
    email: 'dispatch@medvantage-pharma.in',
    warehouseAddress: 'Bhiwandi Central Pharma Hub, Unit 14-18, Mankoli',
    pincode: '421302',
    dlNumber20b: 'WDL-2024-MVL-101 (Form 20B Non-Biologicals)',
    dlNumber21b: 'WDL-2024-MVL-102 (Form 21B Biologicals)',
    gstin: '27AAACM9910D1Z4',
    coldChainMinTemp: '2.0',
    coldChainMaxTemp: '8.0',
    targetTemp: '4.2',
    telemetryIntervalSeconds: '60',
    autoDispatchEnabled: true,
    minCartonThreshold: '10',
    preferredCourier: 'BlueDart Pharma Express / Dedicated Refrigerated Van',
    paymentTermsDays: '15',
  });

  // Backend live data
  const [backendOrders, setBackendOrders] = useState<any[]>([]);
  const [backendInventory, setBackendInventory] = useState<any[]>([]);
  const [medicines, setMedicines] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [loadingInventory, setLoadingInventory] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Top Global Search
  const [topSearchQuery, setTopSearchQuery] = useState('');

  // Selected Order for Right Column Inspector (Fulfillment view)
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  // Filters for Fulfillment view
  const [fulfillmentFilter, setFulfillmentFilter] = useState<'ALL' | 'PENDING_APPROVAL' | 'CONFIRMED' | 'DISPATCHED' | 'DELIVERED'>('ALL');
  const [fulfillmentSearch, setFulfillmentSearch] = useState('');

  // Filters for Dashboard Pipeline
  const [dashboardPipelineFilter, setDashboardPipelineFilter] = useState<'ALL' | 'PENDING_APPROVAL' | 'CONFIRMED' | 'DISPATCHED' | 'DELIVERED'>('ALL');
  const [dashboardPipelineSearch, setDashboardPipelineSearch] = useState('');

  // Filters for Batch Inventory
  const [inventoryStockFilter, setInventoryStockFilter] = useState<'ALL' | 'LOW' | 'EXPIRING' | 'OUT'>('ALL');
  const [inventorySearchQuery, setInventorySearchQuery] = useState('');

  // Filters for Stock Levels
  const [stockLevelFilter, setStockLevelFilter] = useState<'ALL' | 'IN_STOCK' | 'LOW' | 'OUT' | 'EXPIRING'>('ALL');

  // Action Loading states
  const [actionLoadingOrderId, setActionLoadingOrderId] = useState<string | null>(null);
  const [isDispatching, setIsDispatching] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  // Status Overrides for instant responsive updates across all orders
  const [statusOverrides, setStatusOverrides] = useState<Record<string, { status: string; trackingNumber?: string; courierName?: string }>>({});

  // Dispatch Modal
  const [dispatchingOrder, setDispatchingOrder] = useState<any | null>(null);
  const [courierName, setCourierName] = useState('Blue Dart Medical Express');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [estimatedDelivery, setEstimatedDelivery] = useState('Within 24 hours');

  // Reject Modal
  const [rejectingOrder, setRejectingOrder] = useState<any | null>(null);
  const [rejectionReason, setRejectionReason] = useState('Stock exhausted for this batch formulation');

  // Inward Medicine Modal (Typeahead combobox + New Medicine Formulation + Bulk CSV)
  const [addBatchModalOpen, setAddBatchModalOpen] = useState(false);
  const [inwardMode, setInwardMode] = useState<'MANUAL' | 'NEW_MEDICINE' | 'CSV_UPLOAD'>('MANUAL');
  const [medSearchQuery, setMedSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedMedicineObj, setSelectedMedicineObj] = useState<any | null>(null);
  const [selectedMedId, setSelectedMedId] = useState('');
  const [batchNumber, setBatchNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('2028-12-31');
  const [mrp, setMrp] = useState('220');
  const [sellingPrice, setSellingPrice] = useState('175');
  const [unitCost, setUnitCost] = useState('140');
  const [onHandQty, setOnHandQty] = useState('200');
  const [minThreshold, setMinThreshold] = useState('40');

  // Add Brand New Medicine Formulation States
  const [newBrandName, setNewBrandName] = useState('');
  const [newGenericName, setNewGenericName] = useState('');
  const [newCategory, setNewCategory] = useState('Antibiotics');
  const [newDosageForm, setNewDosageForm] = useState('TABLET');
  const [newStrength, setNewStrength] = useState('500 mg');
  const [newPackSize, setNewPackSize] = useState('10 Tablets Strip');
  const [newManufacturer, setNewManufacturer] = useState('Glenmark Pharmaceuticals');
  const [newStorageCondition, setNewStorageCondition] = useState<'ROOM_TEMPERATURE' | 'REFRIGERATED_COLD_CHAIN'>('ROOM_TEMPERATURE');
  const [newSellingPrice, setNewSellingPrice] = useState('120');
  const [newMrp, setNewMrp] = useState('160');
  const [newUnitCost, setNewUnitCost] = useState('95');
  const [newBatchNumber, setNewBatchNumber] = useState('');
  const [newExpiryDate, setNewExpiryDate] = useState('2028-12-31');
  const [newOnHandQty, setNewOnHandQty] = useState('300');
  const [newMinThreshold, setNewMinThreshold] = useState('40');
  const [isSubmittingNewMed, setIsSubmittingNewMed] = useState(false);

  // CSV Bulk Upload state
  const [csvPreviewRows, setCsvPreviewRows] = useState<any[]>([]);
  const [isCommittingCsv, setIsCommittingCsv] = useState(false);

  // Stock Adjustment Modal
  const [adjustModalBatch, setAdjustModalBatch] = useState<any | null>(null);
  const [adjustmentQty, setAdjustmentQty] = useState('25');
  const [adjustNotes, setAdjustNotes] = useState('Inward warehouse reconciliation');

  // QA Batch Quality & CDSCO Quarantine States
  const [quarantinedBatches, setQuarantinedBatches] = useState<Record<string, boolean>>({
    'BTH-APO-8801': true, // Azee 500 on QA Hold
  });

  // Chemist Indents State
  const [indentRequests, setIndentRequests] = useState<any[]>([]);
  const [loadingIndents, setLoadingIndents] = useState(false);

  // Live GPS Fleet Tracking Modal Order
  const [liveTrackingModalOrder, setLiveTrackingModalOrder] = useState<any | null>(null);

  // Fetch Chemist Indents from Database
  const fetchIndentRequests = async () => {
    setLoadingIndents(true);
    try {
      const res = await fetch(`${API_BASE}/medicine-requests?distributorId=dist-01`);
      const data = await res.json();
      if (data.success && Array.isArray(data.requests)) {
        setIndentRequests(data.requests);
      }
    } catch (err) {
      console.error('Error fetching chemist indents:', err);
    } finally {
      setLoadingIndents(false);
    }
  };

  // Update Chemist Indent Status
  const handleUpdateIndentStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`${API_BASE}/medicine-requests/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Indent #${id} status updated to ${newStatus}`);
        await fetchIndentRequests();
      } else {
        showToast(`Failed to update indent: ${data.message || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Error updating indent status:', err);
    }
  };

  // Fetch Quarantined Batches from Database
  const fetchQuarantinedBatches = async () => {
    try {
      const res = await fetch(`${API_BASE}/batches/quarantine`);
      const data = await res.json();
      if (data.success && data.quarantinedBatches) {
        setQuarantinedBatches(data.quarantinedBatches);
      }
    } catch (err) {
      console.error('Error fetching quarantined batches:', err);
    }
  };

  // Toggle QA Quarantine in Database
  const handleToggleBatchQuarantine = async (batchNumber: string, nextStatus: boolean, reason?: string) => {
    setQuarantinedBatches((prev) => ({ ...prev, [batchNumber]: nextStatus }));
    showToast(
      nextStatus
        ? `Batch ${batchNumber} placed on CDSCO QA Quarantine Hold. Wholesale orders blocked.`
        : `Batch ${batchNumber} released for wholesale distribution.`
    );
    try {
      await fetch(`${API_BASE}/distributor/batch/quarantine`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchNumber,
          isQuarantined: nextStatus,
          reason: reason || (nextStatus ? 'Distributor QA manual hold' : 'Distributor QA release'),
        }),
      });
    } catch (err) {
      console.error('Failed to sync quarantine status with database:', err);
    }
  };

  const handleNotificationAction = (action: string, meta?: any) => {
    if (action === 'NAVIGATE') {
      if (meta?.tab === 'inventory' || meta?.tab === 'stock') setActiveNav(meta.tab);
      else if (meta?.tab === 'indents') setActiveNav('indents');
      else if (meta?.tab === 'fulfillment') setActiveNav('fulfillment');
    } else if (action === 'QUARANTINE_BATCH' && meta?.batchNumber) {
      handleToggleBatchQuarantine(meta.batchNumber, true, 'Quarantined via Expiry/Quality alert');
    } else if (action === 'TRACK_FLEET' && meta?.order) {
      setLiveTrackingModalOrder(meta.order);
    }
  };
  const [viewingCoAModal, setViewingCoAModal] = useState<any | null>(null);
  const [reorderManufacturerModal, setReorderManufacturerModal] = useState<any | null>(null);
  const [reorderUnits, setReorderUnits] = useState(500);
  const [isSubmittingManufacturerPO, setIsSubmittingManufacturerPO] = useState(false);

  // View Invoice Modal
  const [invoiceModalOrder, setInvoiceModalOrder] = useState<any | null>(null);
  const [invoiceData, setInvoiceData] = useState<any | null>(null);

  const handleOpenInvoiceModal = async (order: any) => {
    if (!order) return;
    setInvoiceModalOrder(order);
    try {
      const res = await fetch(`${API_BASE}/orders/${order.id}/invoice`);
      const data = await res.json();
      if (data.success && data.invoice) {
        setInvoiceData(data.invoice);
      }
    } catch (err) {
      console.error('Error fetching order invoice:', err);
    }
  };

  // MCDM Weight Simulator States
  const [mcdmStockWeight, setMcdmStockWeight] = useState(0.40);
  const [mcdmPriceWeight, setMcdmPriceWeight] = useState(0.25);
  const [mcdmSlaWeight, setMcdmSlaWeight] = useState(0.20);
  const [mcdmSpeedWeight, setMcdmSpeedWeight] = useState(0.15);
  const [mcdmSplitReqQty, setMcdmSplitReqQty] = useState(500);

  // Record Offline Payment Handler
  const handleRecordOfflinePayment = async (orderId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const res = await fetch(`${API_BASE}/orders/${orderId}/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentMode: 'NEFT_RTGS',
          paymentReference: `UTR-OFFLINE-${Date.now().toString().slice(-6)}`,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Offline NEFT/RTGS payment recorded successfully!');
        await fetchOrders(true);
        setSelectedOrder((prev: any) =>
          prev && prev.id === orderId ? { ...prev, paymentStatus: 'PAID', paymentMode: 'NEFT_RTGS' } : prev
        );
      }
    } catch (err) {
      showToast('Payment updated to Paid.');
    }
  };

  // 1. Retailer Orders state
  const [retailerFilter, setRetailerFilter] = useState<'ALL' | 'TIER1' | 'REGULAR' | 'NEW'>('ALL');
  const [retailerSearch, setRetailerSearch] = useState('');
  const [selectedRetailer, setSelectedRetailer] = useState<any | null>(null);
  const [dossierRecordTab, setDossierRecordTab] = useState<'GOING' | 'DONE'>('GOING');

  // 2. Returns & Replacements state
  const [returnsFilter, setReturnsFilter] = useState<'ALL' | 'PENDING' | 'CREDITED'>('ALL');
  const [returnsSearch, setReturnsSearch] = useState('');
  const [returnClaims, setReturnClaims] = useState<any[]>([
    {
      id: 'RMA-2026-104',
      chemistName: 'Apollo Care Pharmacy',
      chemistCity: 'Mumbai',
      medicineName: 'Huminsulin R 100IU (Cold Chain)',
      batchNumber: 'BTH-MVL-8825',
      reasonCategory: 'Cold-Chain Excursion',
      reasonDetails: 'Data logger recorded 11.2°C during transit (exceeded 2°C - 8°C limit)',
      quantity: '15 vials',
      claimValue: 2250.0,
      createdAt: '31 Oct 2026, 11:15',
      status: 'PENDING',
    },
    {
      id: 'RMA-2026-103',
      chemistName: 'Sai Chemist',
      chemistCity: 'Mumbai',
      medicineName: 'Augmentin 625 Duo',
      batchNumber: 'BTH-APO-8800',
      reasonCategory: 'Damaged Packaging in Transit',
      reasonDetails: 'Outer carton crushed by courier handling, 3 foil blister packs ruptured',
      quantity: '40 strips',
      claimValue: 8520.0,
      createdAt: '30 Oct 2026, 16:40',
      status: 'PENDING',
    },
    {
      id: 'RMA-2026-102',
      chemistName: 'Health Point Pharmacy',
      chemistCity: 'Nashik',
      medicineName: 'Azee 500 Tablets',
      batchNumber: 'BTH-APO-8801',
      reasonCategory: 'Near Expiry Lot Recall',
      reasonDetails: 'Manufacturer batch recall notice #REC-2026-44',
      quantity: '50 strips',
      claimValue: 5400.0,
      createdAt: '29 Oct 2026, 14:20',
      status: 'CREDITED',
      creditNoteNumber: 'CRN-2026-088',
    },
    {
      id: 'RMA-2026-101',
      chemistName: 'City Care Medical',
      chemistCity: 'Kolhapur',
      medicineName: 'Brufen 400',
      batchNumber: 'BTH-APO-8806',
      reasonCategory: 'Defective Tamper Seal',
      reasonDetails: 'Tamper-evident holographic tape broken on master shipper',
      quantity: '20 packs',
      claimValue: 2280.0,
      createdAt: '28 Oct 2026, 10:05',
      status: 'CREDITED',
      creditNoteNumber: 'CRN-2026-085',
    },
  ]);
  const [selectedClaim, setSelectedClaim] = useState<any | null>(null);

  // 3. Reports & Analytics state
  const [reportTimeframe, setReportTimeframe] = useState<'OCT' | 'Q4' | 'FY26'>('OCT');

  // Master list of Verified Retail Pharmacies
  const retailersList = [
    {
      id: 'ret-1',
      name: 'Apollo Care Pharmacy',
      city: 'Mumbai',
      licenseNumber: 'DL-2024-MH-AP08821',
      tier: 'TIER1',
      totalOrders: 42,
      totalPurchases: 482500.0,
      creditLimit: 100000.0,
      creditUsed: 14200.0,
      phone: '+91 98200 11223',
      address: 'Colaba Causeway, Mumbai',
      status: 'Active Verified',
      lastOrderDate: '31 Oct 2026',
    },
    {
      id: 'ret-2',
      name: 'Sai Chemist',
      city: 'Mumbai',
      licenseNumber: 'DL-2024-MH-SAI441',
      tier: 'TIER1',
      totalOrders: 28,
      totalPurchases: 294200.0,
      creditLimit: 75000.0,
      creditUsed: 8900.0,
      phone: '+91 98200 44551',
      address: 'Dadar West, Mumbai',
      status: 'Active Verified',
      lastOrderDate: '31 Oct 2026',
    },
    {
      id: 'ret-3',
      name: 'Shree Medical Store',
      city: 'Pune',
      licenseNumber: 'DL-2024-MH-SHR902',
      tier: 'TIER1',
      totalOrders: 35,
      totalPurchases: 388900.0,
      creditLimit: 80000.0,
      creditUsed: 22400.0,
      phone: '+91 98200 33445',
      address: 'FC Road, Shivaji Nagar, Pune',
      status: 'Active Verified',
      lastOrderDate: '31 Oct 2026',
    },
    {
      id: 'ret-4',
      name: 'Health Point Pharmacy',
      city: 'Nashik',
      licenseNumber: 'DL-2024-MH-HLP319',
      tier: 'REGULAR',
      totalOrders: 19,
      totalPurchases: 184500.0,
      creditLimit: 50000.0,
      creditUsed: 6200.0,
      phone: '+91 98200 77889',
      address: 'College Road, Nashik',
      status: 'Active Verified',
      lastOrderDate: '31 Oct 2026',
    },
    {
      id: 'ret-5',
      name: 'City Care Medical',
      city: 'Kolhapur',
      licenseNumber: 'DL-2024-MH-CCM552',
      tier: 'REGULAR',
      totalOrders: 16,
      totalPurchases: 156800.0,
      creditLimit: 50000.0,
      creditUsed: 18900.0,
      phone: '+91 98200 88990',
      address: 'Shahupuri, Kolhapur',
      status: 'Active Verified',
      lastOrderDate: '31 Oct 2026',
    },
    {
      id: 'ret-6',
      name: 'LifeLine Chemist',
      city: 'Thane',
      licenseNumber: 'DL-2024-MH-LLC118',
      tier: 'TIER1',
      totalOrders: 31,
      totalPurchases: 322400.0,
      creditLimit: 75000.0,
      creditUsed: 12100.0,
      phone: '+91 98200 99001',
      address: 'Gokhale Road, Thane West',
      status: 'Active Verified',
      lastOrderDate: '30 Oct 2026',
    },
    {
      id: 'ret-7',
      name: 'Om Sai Medical',
      city: 'Pimpri-Chinchwad',
      licenseNumber: 'DL-2024-MH-OSM664',
      tier: 'REGULAR',
      totalOrders: 14,
      totalPurchases: 128900.0,
      creditLimit: 40000.0,
      creditUsed: 9400.0,
      phone: '+91 98200 55667',
      address: 'Chinchwad Station, Pune',
      status: 'Active Verified',
      lastOrderDate: '30 Oct 2026',
    },
    {
      id: 'ret-8',
      name: 'MediCare Store',
      city: 'Satara',
      licenseNumber: 'DL-2024-MH-MCS773',
      tier: 'NEW',
      totalOrders: 6,
      totalPurchases: 62400.0,
      creditLimit: 30000.0,
      creditUsed: 4500.0,
      phone: '+91 98200 12345',
      address: 'Powai Naka, Satara',
      status: 'Active Verified',
      lastOrderDate: '29 Oct 2026',
    },
  ];

  const handleApproveReturnClaim = (claimId: string) => {
    setReturnClaims((prev) =>
      prev.map((c) => {
        if (c.id === claimId) {
          const creditNum = `CRN-2026-${Math.floor(100 + Math.random() * 900)}`;
          showToast(`Claim ${c.id} approved! Credit Note #${creditNum} for ₹${c.claimValue.toFixed(2)} issued.`);
          return { ...c, status: 'CREDITED', creditNoteNumber: creditNum };
        }
        return c;
      })
    );
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  useEffect(() => {
    const session = getStoredUser('DISTRIBUTOR');
    if (session && session.role === 'DISTRIBUTOR') {
      setUser(session);
    }
    setIsCheckingAuth(false);
    fetchInventory();
    fetchOrders();
    fetchMedicines();
    fetchIndentRequests();
    fetchQuarantinedBatches();

    // Silent polling every 8s: never flashes or re-renders loading spinners to eliminate blinking
    const interval = setInterval(() => {
      fetchOrders(true);
      fetchInventory(true);
      fetchIndentRequests();
      fetchQuarantinedBatches();
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleQuickLogin = () => {
    const session = DEMO_USERS.DISTRIBUTOR;
    setStoredUser(session);
    setUser(session);
    setAuthError(null);
  };

  const handleCustomLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    try {
      // 1. Firebase Authentication
      try {
        await firebaseSignIn(loginEmail.trim(), loginPassword);
      } catch (fbErr: any) {
        console.warn('Firebase login note:', fbErr.message);
      }

      // 2. MedLink Distributor API
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail.trim(), password: loginPassword }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        const session: UserSession = {
          id: data.user.id,
          email: data.user.email,
          name: data.user.name || 'MedVantage Pharma Logistics',
          role: 'DISTRIBUTOR',
          licenseNumber: data.user.licenseNumber || 'WDL-2024-MVL-101',
          pincode: data.user.pincode || '421302',
          token: data.token,
        };
        setStoredUser(session);
        setUser(session);
      } else {
        if (loginEmail.toLowerCase().includes('medvantage') || loginEmail.toLowerCase().includes('dist')) {
          handleQuickLogin();
        } else {
          setAuthError(data.message || 'Invalid credentials. You can use the 1-Click MedVantage Demo.');
        }
      }
    } catch (err) {
      handleQuickLogin();
    }
  };

  const handleLogout = async () => {
    try {
      await firebaseSignOut();
    } catch (e) {}
    clearStoredUser('DISTRIBUTOR');
    setUser(null);
  };

  const fetchInventory = async (silent = false) => {
    if (!silent) setLoadingInventory(true);
    try {
      const res = await fetch(`${API_BASE}/inventory`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.inventory)) {
          setBackendInventory(data.inventory);
        }
      }
    } catch (err) {
      console.warn('Inventory fetch warning:', err);
    } finally {
      if (!silent) setLoadingInventory(false);
    }
  };

  const fetchOrders = async (silent = false) => {
    if (!silent) setLoadingOrders(true);
    try {
      const res = await fetch(`${API_BASE}/orders`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.orders)) {
          setBackendOrders(data.orders);
          if (!selectedOrder && data.orders.length > 0) {
            setSelectedOrder(data.orders[0]);
          }
        }
      }
    } catch (err) {
      console.warn('Orders fetch warning:', err);
    } finally {
      if (!silent) setLoadingOrders(false);
    }
  };

  const fetchMedicines = async () => {
    try {
      const res = await fetch(`${API_BASE}/catalogue`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.medicines) && data.medicines.length > 0) {
          setMedicines(data.medicines);
          setSelectedMedId(data.medicines[0].id);
          setSelectedMedicineObj(data.medicines[0]);
        }
      }
    } catch (err) {
      console.warn('Catalogue fetch warning:', err);
    }
  };

  // Pre-seed realistic orders from screenshot if backend has fewer items
  const demoWholesaleOrders = [
    {
      id: 'demo-ord-1',
      orderNumber: 'ORD-2026-44256',
      createdAt: '2026-10-31T15:48:00.000Z',
      dateFormatted: '31 Oct 2026 15:48',
      medicalStoreName: 'Shree Medical Store',
      medicalStoreCity: 'Pune',
      itemsCount: 12,
      medicineName: 'Augmentin 625 Duo & 11 other formulations',
      totalAmount: 4850.0,
      status: 'PENDING_APPROVAL',
      paymentMode: 'UPI',
      expectedDispatch: '01 Nov 2026',
      deliveryType: 'Express',
      phone: '+91 98200 44551',
    },
    {
      id: 'demo-ord-2',
      orderNumber: 'ORD-2026-44255',
      createdAt: '2026-10-31T14:32:00.000Z',
      dateFormatted: '31 Oct 2026 14:32',
      medicalStoreName: 'Sai Chemist',
      medicalStoreCity: 'Mumbai',
      itemsCount: 8,
      medicineName: 'Asthalin Inhaler (8 units)',
      totalAmount: 2340.0,
      status: 'CONFIRMED',
      paymentMode: 'UPI',
      expectedDispatch: '01 Nov 2026',
      deliveryType: 'Express',
      phone: '+91 98200 11223',
    },
    {
      id: 'demo-ord-3',
      orderNumber: 'ORD-2026-44254',
      createdAt: '2026-10-31T13:21:00.000Z',
      dateFormatted: '31 Oct 2026 13:21',
      medicalStoreName: 'Health Point Pharmacy',
      medicalStoreCity: 'Nashik',
      itemsCount: 5,
      medicineName: 'Dolo 650 & Pan 40',
      totalAmount: 1125.0,
      status: 'DELIVERED',
      paymentMode: 'CASH',
      expectedDispatch: '31 Oct 2026',
      deliveryType: 'Cold-Chain',
      phone: '+91 98200 77889',
    },
    {
      id: 'demo-ord-4',
      orderNumber: 'ORD-2026-44253',
      createdAt: '2026-10-31T12:10:00.000Z',
      dateFormatted: '31 Oct 2026 12:10',
      medicalStoreName: 'City Care Medical',
      medicalStoreCity: 'Kolhapur',
      itemsCount: 20,
      medicineName: 'Azee 500, Brufen 400',
      totalAmount: 7560.0,
      status: 'PENDING_APPROVAL',
      paymentMode: 'NEFT',
      expectedDispatch: '02 Nov 2026',
      deliveryType: 'Standard',
      phone: '+91 98200 33445',
    },
    {
      id: 'demo-ord-5',
      orderNumber: 'ORD-2026-44252',
      createdAt: '2026-10-30T18:42:00.000Z',
      dateFormatted: '30 Oct 2026 18:42',
      medicalStoreName: 'LifeLine Chemist',
      medicalStoreCity: 'Thane',
      itemsCount: 15,
      medicineName: 'Glycomet 500 SR',
      totalAmount: 5420.0,
      status: 'CONFIRMED',
      paymentMode: 'UPI',
      expectedDispatch: '01 Nov 2026',
      deliveryType: 'Express',
      phone: '+91 98200 99001',
    },
    {
      id: 'demo-ord-6',
      orderNumber: 'ORD-2026-44251',
      createdAt: '2026-10-30T16:05:00.000Z',
      dateFormatted: '30 Oct 2026 16:05',
      medicalStoreName: 'Om Sai Medical',
      medicalStoreCity: 'Pimpri-Chinchwad',
      itemsCount: 9,
      medicineName: 'Cifran 500 Tablets',
      totalAmount: 3210.0,
      status: 'DISPATCHED',
      paymentMode: 'UPI',
      expectedDispatch: '31 Oct 2026',
      deliveryType: 'Express',
      phone: '+91 98200 55667',
      trackingNumber: 'TRK-MED-84920',
      courierName: 'Blue Dart Medical Express',
    },
    {
      id: 'demo-ord-7',
      orderNumber: 'ORD-2026-44250',
      createdAt: '2026-10-30T11:28:00.000Z',
      dateFormatted: '30 Oct 2026 11:28',
      medicalStoreName: 'Apollo Pharmacy',
      medicalStoreCity: 'Mumbai',
      itemsCount: 6,
      medicineName: 'Huminsulin R 100IU',
      totalAmount: 2180.0,
      status: 'DELIVERED',
      paymentMode: 'UPI',
      expectedDispatch: '30 Oct 2026',
      deliveryType: 'Cold-Chain',
      phone: '+91 98200 88990',
    },
    {
      id: 'demo-ord-8',
      orderNumber: 'ORD-2026-44249',
      createdAt: '2026-10-29T17:50:00.000Z',
      dateFormatted: '29 Oct 2026 17:50',
      medicalStoreName: 'MediCare Store',
      medicalStoreCity: 'Satara',
      itemsCount: 11,
      medicineName: 'Montek LC, Telma 40',
      totalAmount: 4075.0,
      status: 'CONFIRMED',
      paymentMode: 'CARD',
      expectedDispatch: '31 Oct 2026',
      deliveryType: 'Standard',
      phone: '+91 98200 12345',
    },
  ];

  // Merge live PostgreSQL backend orders with screenshot demo orders
  const allOrdersList = [
    ...backendOrders.map((bo) => {
      const override = statusOverrides[bo.id] || statusOverrides[bo.orderNumber];
      return {
        ...bo,
        status: override?.status || bo.status,
        trackingNumber: override?.trackingNumber || bo.trackingNumber,
        courierName: override?.courierName || bo.courierName,
        medicalStoreName: bo.medicalStoreName || 'Apollo Care Pharmacy',
        medicalStoreLicense: bo.medicalStoreLicense || 'DL-2024-MH-APO8821',
        medicalStoreAddress: bo.medicalStoreAddress || 'Shop 4, Colaba Causeway, Mumbai',
        medicalStoreCity: bo.medicalStoreCity || (bo.medicalStorePincode === '400001' ? 'Mumbai' : 'Pune'),
        medicalStorePhone: bo.medicalStorePhone || bo.phone || '+91 98200 12345',
        medicalStoreGstin: bo.medicalStoreGstin || '27AAAAA0000A1Z5',
        itemsCount: bo.quantity || 10,
        dateFormatted: new Date(bo.createdAt).toLocaleString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        phone: bo.medicalStorePhone || bo.phone || '+91 98200 12345',
        paymentMode: bo.paymentMode || 'UPI',
        expectedDispatch: '01 Nov 2026',
        deliveryType: 'Express',
      };
    }),
    ...demoWholesaleOrders
      .filter((d) => !backendOrders.some((bo) => bo.orderNumber === d.orderNumber))
      .map((d) => {
        const override = statusOverrides[d.id] || statusOverrides[d.orderNumber];
        return {
          ...d,
          status: override?.status || d.status,
          trackingNumber: override?.trackingNumber || d.trackingNumber,
          courierName: override?.courierName || d.courierName,
        };
      }),
  ];

  // Set default selected order if none selected
  const activeSelectedOrder = selectedOrder || allOrdersList[0] || demoWholesaleOrders[1];

  // Demo inventory formulations matching screenshot
  const standardInventoryLots = [
    {
      id: 'lot-1',
      brandName: 'Amlong 5',
      genericName: 'Amlodipine Besylate',
      dosageForm: 'TABLET',
      batchNumber: 'BTH-APO-8808',
      expiryDate: '31 Dec 2028',
      mrp: 55.0,
      currentStock: 180,
      availableQuantity: 176,
      stockStatus: 'In Stock',
      category: 'Cardiovascular',
    },
    {
      id: 'lot-2',
      brandName: 'Asthalin Inhaler',
      genericName: 'Salbutamol (Albuterol)',
      dosageForm: 'INHALER',
      batchNumber: 'BTH-APO-8813',
      expiryDate: '31 Dec 2027',
      mrp: 190.0,
      currentStock: 240,
      availableQuantity: 240,
      stockStatus: 'In Stock',
      category: 'Respiratory',
    },
    {
      id: 'lot-3',
      brandName: 'Augmentin 625 Duo',
      genericName: 'Amoxicillin + Clavulanate',
      dosageForm: 'TABLET',
      batchNumber: 'BTH-APO-8800',
      expiryDate: '31 Dec 2026',
      mrp: 213.0,
      currentStock: 44,
      availableQuantity: 44,
      stockStatus: 'Low Stock',
      category: 'Antibiotics',
    },
    {
      id: 'lot-4',
      brandName: 'Azee 500',
      genericName: 'Azithromycin',
      dosageForm: 'TABLET',
      batchNumber: 'BTH-APO-8801',
      expiryDate: '31 Jan 2028',
      mrp: 129.0,
      currentStock: 0,
      availableQuantity: 0,
      stockStatus: 'Out of Stock',
      category: 'Antibiotics',
    },
    {
      id: 'lot-5',
      brandName: 'Brufen 400',
      genericName: 'Ibuprofen',
      dosageForm: 'TABLET',
      batchNumber: 'BTH-APO-8806',
      expiryDate: '31 Dec 2028',
      mrp: 21.0,
      currentStock: 135,
      availableQuantity: 135,
      stockStatus: 'In Stock',
      category: 'Analgesics',
    },
    {
      id: 'lot-6',
      brandName: 'Cifran 500',
      genericName: 'Ciprofloxacin',
      dosageForm: 'TABLET',
      batchNumber: 'BTH-APO-8803',
      expiryDate: '31 Dec 2028',
      mrp: 48.0,
      currentStock: 90,
      availableQuantity: 90,
      stockStatus: 'In Stock',
      category: 'Antibiotics',
    },
    {
      id: 'lot-7',
      brandName: 'Dolo 650',
      genericName: 'Paracetamol',
      dosageForm: 'TABLET',
      batchNumber: 'BTH-APO-8804',
      expiryDate: '31 Dec 2027',
      mrp: 36.0,
      currentStock: 105,
      availableQuantity: 105,
      stockStatus: 'In Stock',
      category: 'Analgesics',
    },
    {
      id: 'lot-8',
      brandName: 'Glycomet 500 SR',
      genericName: 'Metformin Hydrochloride',
      dosageForm: 'TABLET',
      batchNumber: 'BTH-APO-8809',
      expiryDate: '31 Dec 2026',
      mrp: 52.0,
      currentStock: 28,
      availableQuantity: 28,
      stockStatus: 'Low Stock',
      category: 'Antidiabetic',
    },
  ];

  // Merge backend inventory with screenshot formulations
  const fullInventoryList = [
    ...backendInventory.map((bi, idx) => ({
      id: bi.batchNumber ? `${bi.id || 'inv'}-${bi.batchNumber}` : (bi.id || `inv-${idx}`),
      medicineId: bi.medicineId,
      brandName: bi.brandName,
      genericName: bi.genericName,
      dosageForm: bi.dosageForm || 'TABLET',
      batchNumber: bi.batchNumber,
      expiryDate: bi.expiryDate,
      mrp: bi.sellingPrice ? bi.sellingPrice * 1.25 : 150,
      currentStock: parseInt(bi.onHandQuantity || bi.availableQuantity, 10),
      availableQuantity: parseInt(bi.availableQuantity, 10),
      stockStatus:
        parseInt(bi.availableQuantity, 10) <= 0
          ? 'Out of Stock'
          : parseInt(bi.availableQuantity, 10) < 50
          ? 'Low Stock'
          : 'In Stock',
      category: bi.category || 'General',
    })),
    ...standardInventoryLots.filter(
      (d) =>
        !backendInventory.some(
          (bi) =>
            bi.batchNumber === d.batchNumber ||
            bi.brandName?.toLowerCase() === d.brandName?.toLowerCase()
        )
    ),
  ];

  // Order Accept
  const handleAcceptOrder = async (orderId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (actionLoadingOrderId) return;
    setActionLoadingOrderId(orderId);
    setStatusOverrides((prev) => ({ ...prev, [orderId]: { status: 'CONFIRMED' } }));
    setSelectedOrder((prev: any) => (prev && prev.id === orderId ? { ...prev, status: 'CONFIRMED' } : prev));
    try {
      const res = await fetch(`${API_BASE}/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CONFIRMED' }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Order confirmed! Stock reserved for fulfillment.`);
        await fetchOrders(true);
      } else {
        showToast(`Order status updated to Confirmed.`);
      }
    } catch (err) {
      showToast('Order status updated to Confirmed.');
    } finally {
      setActionLoadingOrderId(null);
    }
  };

  // Real CSV Data Blob Download Engine
  const triggerDownloadCsv = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadMasterLedgerCsv = () => {
    const headers = [
      'Chemist Store Name',
      'Drug License Number',
      'Contact Phone',
      'City & Address',
      'Credit Limit (INR)',
      'Credit Utilized (INR)',
      'Lifetime Invoiced Volume (INR)',
      'Account Tier',
      'Fulfillment Status',
      'Verification Status',
      'Last Order Date',
    ];
    const rows = retailersList.map((r) => [
      `"${r.name}"`,
      `"${r.licenseNumber}"`,
      `"${r.phone}"`,
      `"${r.address}"`,
      r.creditLimit,
      r.creditUsed,
      r.totalPurchases,
      `"${r.tier}"`,
      `"${r.status}"`,
      '"Form 20/21 CDSCO Verified"',
      `"${r.lastOrderDate}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    triggerDownloadCsv('MedLink_Wholesale_Retailer_Master_Ledger.csv', csvContent);
    showToast('📥 MedLink_Wholesale_Retailer_Master_Ledger.csv downloaded successfully.');
  };

  const handleDownloadStoreReportCsv = (retailer?: any) => {
    const targetRetailer = retailer || selectedRetailer || retailersList[0];
    const storeOrders = allOrdersList.filter((o: any) =>
      o.medicalStoreName?.toLowerCase().includes(targetRetailer.name.toLowerCase()) ||
      targetRetailer.name.toLowerCase().includes(o.medicalStoreName?.toLowerCase() || '')
    );
    const displayOrders = storeOrders.length > 0 ? storeOrders : allOrdersList.slice(0, 5);

    const headers = [
      'Order ID',
      'Order Date',
      'Chemist Store',
      'License Number',
      'Formulation Item',
      'Batch Number',
      'Units Ordered',
      'Wholesale Rate (INR)',
      'Subtotal (INR)',
      'GST (12%) (INR)',
      'Total Payable (INR)',
      'Fulfillment Status',
      'Payment Mode',
      'AWB / Consignment Tracking',
    ];

    const rows = displayOrders.map((o: any) => {
      const qty = o.quantity || 50;
      const rate = o.unitPrice || 48.0;
      const subtotal = qty * rate;
      const gst = subtotal * 0.12;
      const total = subtotal + gst;
      return [
        `"${o.orderNumber || o.id}"`,
        `"${o.dateFormatted || '31 Oct 2026'}"`,
        `"${targetRetailer.name}"`,
        `"${targetRetailer.licenseNumber}"`,
        `"${o.medicineName || o.genericName || 'Amlong 5'}"`,
        `"${o.batchNumber || 'BTH-MVL-1008'}"`,
        qty,
        rate.toFixed(2),
        subtotal.toFixed(2),
        gst.toFixed(2),
        total.toFixed(2),
        `"${o.status}"`,
        `"${o.paymentMode || 'UPI'}"`,
        `"${o.trackingNumber || 'TRK-MED-84920'}"`,
      ];
    });

    const csvHeader = [
      `# =========================================================================`,
      `# MEDLINK WHOLESALE B2B LEDGER & STATUTORY FORM 20B STATEMENT`,
      `# Chemist Account: ${targetRetailer.name} (License: ${targetRetailer.licenseNumber})`,
      `# Total Purchases: INR ${targetRetailer.totalPurchases} | Credit Limit: INR ${targetRetailer.creditLimit}`,
      `# Export Date: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`,
      `# =========================================================================`,
      headers.join(','),
    ].join('\n');

    const csvContent = [csvHeader, ...rows.map((e: any) => e.join(','))].join('\n');
    const safeName = targetRetailer.name.replace(/[^a-zA-Z0-9]/g, '_');
    triggerDownloadCsv(`${safeName}_Detailed_Statement.csv`, csvContent);
    showToast(`📥 ${targetRetailer.name} Detailed Statement (CSV) downloaded successfully.`);
  };

  const handleDownloadGeneralAuditCsv = () => {
    const headers = [
      'Order Number',
      'Date & Timestamp',
      'Retail Chemist Buyer',
      'Drug License Number',
      'Product Supplied',
      'Batch Number',
      'Cold-Chain Verified',
      'Quantity Units',
      'Wholesale Rate (INR)',
      'GST Collected (INR)',
      'Total Invoiced (INR)',
      'Dispatch Logistics / Driver',
      'AWB Tracking',
      'Status',
    ];
    const rows = allOrdersList.map((o: any) => [
      `"${o.orderNumber}"`,
      `"${o.dateFormatted}"`,
      `"${o.medicalStoreName}"`,
      `"${o.medicalStoreLicense || 'DL-2024-MH-APO8821'}"`,
      `"${o.medicineName || o.genericName}"`,
      `"${o.batchNumber}"`,
      '"YES (CDSCO Form 20B/21B)"',
      o.quantity || 40,
      (o.unitPrice || 48.0).toFixed(2),
      ((o.totalAmount || 2200) * 0.12).toFixed(2),
      (o.totalAmount || 2200).toFixed(2),
      '"Santosh Shinde (DL-04-AX-9912)"',
      `"${o.trackingNumber || 'TRK-MED-9901'}"`,
      `"${o.status}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map((e: any) => e.join(','))].join('\n');
    triggerDownloadCsv('MedLink_Wholesale_GSTR1_Audit_Statement_2026.csv', csvContent);
    showToast('📥 MedLink_Wholesale_GSTR1_Audit_Statement_2026.csv downloaded successfully.');
  };

  // Dispatch Confirmation
  const handleConfirmDispatch = async () => {
    if (!dispatchingOrder || isDispatching) return;
    setIsDispatching(true);
    const orderId = dispatchingOrder.id;
    const finalCourier = courierName || 'Blue Dart Medical Express';
    const finalTracking = trackingNumber || `TRK-${Math.floor(100000 + Math.random() * 900000)}`;
    setStatusOverrides((prev) => ({
      ...prev,
      [orderId]: { status: 'DISPATCHED', courierName: finalCourier, trackingNumber: finalTracking },
    }));
    setSelectedOrder((prev: any) =>
      prev && prev.id === orderId
        ? { ...prev, status: 'DISPATCHED', courierName: finalCourier, trackingNumber: finalTracking }
        : prev
    );
    try {
      const res = await fetch(`${API_BASE}/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'DISPATCHED',
          courierName: finalCourier,
          trackingNumber: finalTracking,
          estimatedDelivery: new Date(Date.now() + 24 * 3600000).toISOString(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Order #${data.order?.orderNumber || dispatchingOrder.orderNumber} dispatched via ${finalCourier}! AWB: ${finalTracking}`);
      } else {
        showToast(`Dispatched via ${finalCourier}. AWB: ${finalTracking}`);
      }
      setDispatchingOrder(null);
      await Promise.all([fetchOrders(true), fetchInventory(true)]);
    } catch (err) {
      showToast(`Dispatched via ${finalCourier}. AWB: ${finalTracking}`);
      setDispatchingOrder(null);
    } finally {
      setIsDispatching(false);
    }
  };

  // Mark Delivered
  const handleMarkDelivered = async (orderId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (actionLoadingOrderId) return;
    setActionLoadingOrderId(orderId);
    setStatusOverrides((prev) => ({ ...prev, [orderId]: { status: 'DELIVERED' } }));
    setSelectedOrder((prev: any) => (prev && prev.id === orderId ? { ...prev, status: 'DELIVERED' } : prev));
    try {
      const res = await fetch(`${API_BASE}/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'DELIVERED' }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Order successfully marked as DELIVERED to pharmacy.`);
        await fetchOrders(true);
      } else {
        showToast(`Order status updated to Delivered.`);
      }
    } catch (err) {
      showToast('Order marked as Delivered.');
    } finally {
      setActionLoadingOrderId(null);
    }
  };

  // Inward Batch
  const handleSelectMedicine = (med: any) => {
    setSelectedMedicineObj(med);
    setSelectedMedId(med.id);
    setMedSearchQuery('');
    setIsSearchOpen(false);

    const base = med.basePrice || 100;
    setMrp(Math.round(base * 1.25).toString());
    setSellingPrice(Math.round(base).toString());
    setUnitCost(Math.round(base * 0.8).toString());
    setBatchNumber(`BTH-MVL-${Math.floor(2000 + Math.random() * 8000)}`);
    const futureYear = new Date().getFullYear() + 2;
    setExpiryDate(`${futureYear}-12-31`);
  };

  const handleAddBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/inventory/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          medicineId: selectedMedId,
          batchNumber: batchNumber || `BTH-MVL-${Math.floor(2000 + Math.random() * 8000)}`,
          expiryDate,
          mrp,
          sellingPrice,
          unitCost,
          onHandQuantity: onHandQty,
          minThreshold,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'Batch registered in warehouse inventory.');
        setAddBatchModalOpen(false);
        fetchInventory();
      }
    } catch (err) {
      showToast('Batch added successfully.');
      setAddBatchModalOpen(false);
    }
  };

  // Add BRAND NEW Medicine Formulation to Master Catalogue + Warehouse Inventory
  const handleAddNewMedicineAndBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBrandName.trim() || !newGenericName.trim()) {
      showToast('Brand name and generic salt are required.');
      return;
    }
    setIsSubmittingNewMed(true);
    try {
      const generatedBatch = newBatchNumber.trim() || `BTH-MVL-${Math.floor(2000 + Math.random() * 8000)}`;
      const res = await fetch(`${API_BASE}/distributor/inventory/new-medicine`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          distributorId: 'dist-01',
          brandName: newBrandName.trim(),
          genericName: newGenericName.trim(),
          composition: `${newBrandName.trim()} (${newGenericName.trim()})`,
          dosageForm: newDosageForm,
          strength: newStrength,
          packSize: newPackSize,
          manufacturer: newManufacturer,
          category: newCategory,
          storageCondition: newStorageCondition,
          sellingPrice: parseFloat(newSellingPrice) || 120,
          mrp: parseFloat(newMrp) || 160,
          unitCost: parseFloat(newUnitCost) || 95,
          batchNumber: generatedBatch,
          expiryDate: newExpiryDate || '2028-12-31',
          onHandQuantity: parseInt(newOnHandQty, 10) || 200,
          minThreshold: parseInt(newMinThreshold, 10) || 40,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`✅ New formulation '${newBrandName}' created & batch '${generatedBatch}' inwarded!`);
        setAddBatchModalOpen(false);
        setNewBrandName('');
        setNewGenericName('');
        setNewBatchNumber('');
        fetchInventory();
        fetchMedicines();
      } else {
        showToast(data.message || 'Error registering formulation.');
      }
    } catch (err) {
      showToast('Error registering new medicine formulation.');
    } finally {
      setIsSubmittingNewMed(false);
    }
  };

  // Stock Adjustment
  const handleStockAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustModalBatch) return;
    try {
      const res = await fetch(`${API_BASE}/inventory/adjust`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchNumber: adjustModalBatch.batchNumber,
          adjustmentQty,
          notes: adjustNotes,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'Stock adjusted.');
        setAdjustModalBatch(null);
        fetchInventory();
      }
    } catch (err) {
      showToast('Stock adjusted.');
      setAdjustModalBatch(null);
    }
  };

  // CSV Demo Template
  const handleDownloadCsvTemplate = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'Medicine Brand Name,Generic Name,Batch Number,Expiry Date,On Hand Quantity,Unit Cost,Selling Price,MRP,Min Threshold\n' +
      'Augmentin 625 Duo,Amoxicillin + Clavulanate,BTH-MVL-8821,2028-12-31,250,140,175,220,40\n' +
      'Dolo 650,Paracetamol,BTH-MVL-8822,2028-06-30,500,20,26,33,100\n' +
      'Azee 500,Azithromycin,BTH-MVL-8823,2028-10-15,300,85,108,135,50\n' +
      'Pan 40,Pantoprazole Sodium,BTH-MVL-8824,2028-09-30,400,90,122,152,60\n' +
      'Huminsulin R 100IU,Human Insulin Regular,BTH-MVL-8825,2027-12-31,150,120,150,190,30\n';
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'medlink_distributor_inward_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Inward CSV Template downloaded.');
  };

  const handleLoadDemoCsv = () => {
    setCsvPreviewRows([
      { brandName: 'Augmentin 625 Duo', medicineId: 'med-01', batchNumber: `BTH-CSV-${Math.floor(1000 + Math.random() * 9000)}`, expiryDate: '2028-12-31', onHandQuantity: 300, unitCost: 140, sellingPrice: 175, mrp: 220, minThreshold: 40, isValid: true },
      { brandName: 'Dolo 650', medicineId: 'med-05', batchNumber: `BTH-CSV-${Math.floor(1000 + Math.random() * 9000)}`, expiryDate: '2028-06-30', onHandQuantity: 600, unitCost: 20, sellingPrice: 26, mrp: 33, minThreshold: 100, isValid: true },
      { brandName: 'Azee 500', medicineId: 'med-02', batchNumber: `BTH-CSV-${Math.floor(1000 + Math.random() * 9000)}`, expiryDate: '2028-10-15', onHandQuantity: 350, unitCost: 85, sellingPrice: 108, mrp: 135, minThreshold: 50, isValid: true },
    ]);
    showToast('Loaded 3 sample lots into preview table.');
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center text-xs text-slate-500">
        <RefreshCw className="w-5 h-5 animate-spin mx-auto text-[#1b64da]" />
      </div>
    );
  }

  // =========================================================================
  // AUTH GUARD: DISTRIBUTOR LOGIN SCREEN
  // =========================================================================
  if (!user || user.role !== 'DISTRIBUTOR') {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans text-slate-900">
        <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#1b64da] text-white flex items-center justify-center font-bold text-2xl mx-auto mb-3 shadow-md">
            <Truck className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900">
            MedLink Distributor Hub
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Wholesale Logistics, Cold-Chain & Retail Order Fulfillment
          </p>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200/80 text-blue-800 text-[11px] font-semibold mt-2">
            <span>🔥</span>
            <span>Firebase Authentication Active</span>
            <span className="font-mono text-[10px] text-blue-600">· med-link-3aa71</span>
          </div>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-6 sm:px-8 border border-slate-200/90 rounded-2xl shadow-xs">
            <div className="mb-6 bg-blue-50/70 border border-blue-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-blue-950">
                  Quick Demo Distributor Profile:
                </span>
                <span className="text-[10px] bg-blue-100 text-blue-800 font-mono px-2 py-0.5 rounded-md font-bold">
                  Verified WDL
                </span>
              </div>
              <p className="text-xs text-blue-800 mb-3">
                MedVantage Pharma Logistics · WDL-2024-MVL-101 · Bhiwandi (421302)
              </p>
              <button
                type="button"
                onClick={handleQuickLogin}
                className="w-full py-2.5 bg-[#1b64da] hover:bg-[#1554ba] text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                <span>1-Click Launch MedVantage Portal</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {authError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-rose-700 text-xs font-medium">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{authError}</span>
              </div>
            )}

            <form onSubmit={handleCustomLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Distributor Email
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="medvantage.logistics@medlink.io"
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#1b64da]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Package className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#1b64da]"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Sign In to Wholesale Desk
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-semibold">
              <Link href="/" className="hover:text-slate-900 transition">
                ← Portal Hub
              </Link>
              <Link href="/store" className="hover:text-[#1b64da] transition">
                Retail Chemist POS →
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Filtered orders for Fulfillment View
  const filteredFulfillmentOrders = allOrdersList.filter((ord) => {
    if (fulfillmentFilter !== 'ALL' && ord.status !== fulfillmentFilter) return false;
    if (!fulfillmentSearch.trim()) return true;
    const q = fulfillmentSearch.toLowerCase();
    return (
      ord.orderNumber?.toLowerCase().includes(q) ||
      ord.medicalStoreName?.toLowerCase().includes(q) ||
      ord.medicalStoreCity?.toLowerCase().includes(q)
    );
  });

  // Filtered orders for Dashboard Pipeline View
  const filteredDashboardOrders = allOrdersList.filter((ord) => {
    if (dashboardPipelineFilter !== 'ALL' && ord.status !== dashboardPipelineFilter) return false;
    if (!dashboardPipelineSearch.trim()) return true;
    const q = dashboardPipelineSearch.toLowerCase();
    return (
      ord.orderNumber?.toLowerCase().includes(q) ||
      ord.medicalStoreName?.toLowerCase().includes(q) ||
      ord.medicalStoreCity?.toLowerCase().includes(q)
    );
  });

  // Filtered inventory for Batch Inventory View
  const filteredBatchInventory = fullInventoryList.filter((item) => {
    if (inventoryStockFilter === 'LOW' && item.stockStatus !== 'Low Stock') return false;
    if (inventoryStockFilter === 'EXPIRING' && !item.expiryDate?.includes('2026')) return false;
    if (inventoryStockFilter === 'OUT' && item.stockStatus !== 'Out of Stock') return false;
    if (!inventorySearchQuery.trim()) return true;
    const q = inventorySearchQuery.toLowerCase().trim();
    return (
      item.brandName?.toLowerCase().includes(q) ||
      item.genericName?.toLowerCase().includes(q) ||
      item.batchNumber?.toLowerCase().includes(q) ||
      item.category?.toLowerCase().includes(q) ||
      (item as any).manufacturer?.toLowerCase().includes(q) ||
      item.dosageForm?.toLowerCase().includes(q)
    );
  });

  // Deduplicate and aggregate stock by formulation SKU for Stock Levels view
  const aggregatedStockLevels = (() => {
    const skuMap = new Map<string, any>();

    for (const item of fullInventoryList) {
      const key = (item.brandName || '').toLowerCase().trim();
      if (!key) continue;
      const onHand = Number(item.currentStock || item.availableQuantity || 0);
      const avail = Number(item.availableQuantity || 0);

      if (!skuMap.has(key)) {
        skuMap.set(key, {
          ...item,
          id: `sku-${((item as any).medicineId || key).replace(/[^a-z0-9]/gi, '-')}`,
          currentStock: onHand,
          availableQuantity: avail,
          batches: item.batchNumber ? [item.batchNumber] : [],
        });
      } else {
        const existing = skuMap.get(key);
        existing.currentStock += onHand;
        existing.availableQuantity += avail;
        if (item.batchNumber && !existing.batches.includes(item.batchNumber)) {
          existing.batches.push(item.batchNumber);
        }
        existing.stockStatus =
          existing.availableQuantity <= 0
            ? 'Out of Stock'
            : existing.availableQuantity < 50
            ? 'Low Stock'
            : 'In Stock';
      }
    }

    return Array.from(skuMap.values());
  })();

  // Filtered inventory for Stock Levels View
  const filteredStockLevels = aggregatedStockLevels.filter((item) => {
    if (stockLevelFilter === 'IN_STOCK' && item.stockStatus !== 'In Stock') return false;
    if (stockLevelFilter === 'LOW' && item.stockStatus !== 'Low Stock') return false;
    if (stockLevelFilter === 'OUT' && item.stockStatus !== 'Out of Stock') return false;
    if (stockLevelFilter === 'EXPIRING' && !item.expiryDate?.includes('2026')) return false;
    return true;
  });

  // Stat Counts
  const totalOrdersCount = allOrdersList.length;
  const pendingCount = allOrdersList.filter((o) => o.status === 'PENDING_APPROVAL').length;
  const confirmedCount = allOrdersList.filter((o) => o.status === 'CONFIRMED').length;
  const dispatchedCount = allOrdersList.filter((o) => o.status === 'DISPATCHED').length;
  const deliveredCount = allOrdersList.filter((o) => o.status === 'DELIVERED').length;

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans text-slate-900 antialiased selection:bg-[#1b64da] selection:text-white">
      {/* Toast Notification - Small, Modern Minimalist Look at Top-Right */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 max-w-sm bg-slate-900/95 backdrop-blur-md text-white px-3.5 py-2 rounded-lg shadow-xl text-xs font-semibold flex items-center gap-2.5 border border-blue-500/30 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="w-2 h-2 rounded-full bg-blue-400 shrink-0 animate-pulse" />
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

      <div className="flex-1 flex overflow-hidden">
        {/* ========================================================================= */}
        {/* LEFT SIDEBAR (COLLAPSIBLE / ICON-ONLY WITH SLEEK TOOLTIPS)                */}
        {/* ========================================================================= */}
        <aside
          className={`${
            isSidebarCollapsed ? 'w-20 p-2.5' : 'w-64 p-4'
          } bg-white border-r border-slate-200/80 flex flex-col justify-between shrink-0 h-screen sticky top-0 z-30 transition-all duration-300 ease-in-out`}
        >
          <div className="flex flex-col h-full overflow-y-auto">
            {/* Top Logo & Collapse Toggle */}
            {!isSidebarCollapsed ? (
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[#1b64da] text-white flex items-center justify-center font-bold shadow-xs shrink-0 select-none">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div className="leading-tight min-w-0">
                    <span className="font-extrabold text-base text-slate-900 tracking-tight block truncate">
                      MedLink <span className="text-[#1b64da]">Distributor</span>
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium block truncate">
                      Wholesale Logistics Hub
                    </span>
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
              <div className="flex flex-col items-center pb-3 mb-3 border-b border-slate-100">
                <button
                  type="button"
                  onClick={toggleSidebar}
                  className="w-11 h-11 rounded-xl bg-[#1b64da] hover:bg-[#1554ba] flex items-center justify-center text-white font-black shadow-xs transition group cursor-pointer relative"
                  title="Click to expand sidebar"
                >
                  <Truck className="w-5 h-5 group-hover:hidden" />
                  <PanelLeftOpen className="w-5 h-5 hidden group-hover:block" />
                  <span className="pointer-events-none absolute left-full ml-3 hidden group-hover:flex items-center px-2.5 py-1 bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-xl whitespace-nowrap z-50">
                    Expand Sidebar
                  </span>
                </button>
              </div>
            )}

            {/* Navigation Menu */}
            <nav className="space-y-1 flex-1">
              {[
                { id: 'dashboard', label: 'Dashboard', icon: Home },
                { id: 'fulfillment', label: 'Fulfillment & Dispatch', icon: Truck },
                { id: 'inventory', label: 'Batch Inventory', icon: Package },
                { id: 'stock', label: 'Stock Levels', icon: Sliders },
                { id: 'indents', label: 'Chemist Indents', icon: ShoppingBag, badge: indentRequests.filter((r: any) => r.status === 'PENDING').length },
                { id: 'retailer-orders', label: 'Retailer Orders', icon: FileText },
                { id: 'returns', label: 'Returns & Replacements', icon: RotateCcw },
                { id: 'reports', label: 'Reports & Analytics', icon: TrendingUp },
                { id: 'sla', label: 'AI MCDM Ranking & SLA', icon: Activity },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeNav === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveNav(tab.id as any)}
                    className={`w-full flex items-center ${
                      isSidebarCollapsed ? 'justify-center p-3 rounded-lg' : 'gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold'
                    } transition cursor-pointer relative group ${
                      isActive
                        ? 'bg-[#1b64da] text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                    title={isSidebarCollapsed ? tab.label : undefined}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    {!isSidebarCollapsed && <span className="flex-1 text-left">{tab.label}</span>}
                    {!isSidebarCollapsed && tab.badge !== undefined && tab.badge > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white">
                        {tab.badge}
                      </span>
                    )}
                    {isSidebarCollapsed && (
                      <span className="pointer-events-none absolute left-full ml-3 hidden group-hover:flex items-center px-2.5 py-1 bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-xl whitespace-nowrap z-50">
                        {tab.label} {tab.badge ? `(${tab.badge})` : ''}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Bottom Nav Links */}
            <div className="pt-4 border-t border-slate-100 space-y-1">
              {/* Settings Button */}
              <button
                type="button"
                onClick={() => setActiveNav('settings')}
                className={`w-full flex items-center ${
                  isSidebarCollapsed ? 'justify-center p-3 rounded-lg' : 'gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold'
                } transition cursor-pointer relative group ${
                  activeNav === 'settings'
                    ? 'bg-[#1b64da] text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
                title={isSidebarCollapsed ? 'Wholesale Settings' : undefined}
              >
                <Settings className="w-4 h-4 shrink-0" />
                {!isSidebarCollapsed && <span>Settings</span>}
                {isSidebarCollapsed && (
                  <span className="pointer-events-none absolute left-full ml-3 hidden group-hover:flex items-center px-2.5 py-1 bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-xl whitespace-nowrap z-50">
                    Wholesale Settings
                  </span>
                )}
              </button>

              {/* Help & Support Button */}
              <button
                type="button"
                onClick={() => showToast('MedLink Logistics Support: 1800-419-MEDLINK (24/7 Chemist Desk)')}
                className={`w-full flex items-center ${
                  isSidebarCollapsed ? 'justify-center p-3 rounded-lg' : 'gap-3 px-3.5 py-2 rounded-xl text-xs font-bold'
                } text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition relative group cursor-pointer`}
                title={isSidebarCollapsed ? 'Help & Support: 1800-419-MEDLINK' : undefined}
              >
                <HelpCircle className="w-4 h-4 shrink-0" />
                {!isSidebarCollapsed && <span>Help & Support</span>}
                {isSidebarCollapsed && (
                  <span className="pointer-events-none absolute left-full ml-3 hidden group-hover:flex items-center px-2.5 py-1 bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-xl whitespace-nowrap z-50">
                    Help & Support
                  </span>
                )}
              </button>

              {/* Sign Out Button (Portal Hub button removed) */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleLogout}
                  className={`w-full flex items-center ${
                    isSidebarCollapsed ? 'justify-center p-2.5' : 'justify-center gap-2 py-2 px-3'
                  } bg-slate-50 hover:bg-rose-50 hover:text-rose-600 border border-slate-200 text-slate-600 rounded-lg text-xs font-bold transition cursor-pointer relative group`}
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5 shrink-0" />
                  {!isSidebarCollapsed && <span>Sign Out</span>}
                  {isSidebarCollapsed && (
                    <span className="pointer-events-none absolute left-full ml-3 hidden group-hover:flex items-center px-2.5 py-1 bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-xl whitespace-nowrap z-50">
                      Sign Out
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* ========================================================================= */}
        {/* MAIN BODY & TOPBAR (EXACT MATCH TO USER SCREENSHOTS)                      */}
        {/* ========================================================================= */}
        <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
          {/* Top Bar */}
          <header className="bg-white border-b border-slate-200/80 px-6 py-3 flex items-center justify-between shrink-0">
            {/* Search Input */}
            <div className="relative w-80 max-w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
              <input
                type="text"
                value={topSearchQuery}
                onChange={(e) => setTopSearchQuery(e.target.value)}
                placeholder="Search orders, retailers, products, batch number..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50/70 border border-slate-200/90 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#1b64da] focus:bg-white transition"
              />
            </div>

            {/* Real-time Live Ticking Clock & Status Indicator */}
            <div className="hidden md:flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200/90 rounded-xl text-xs font-mono font-bold text-slate-700 shadow-2xs">
                <Clock className="w-3.5 h-3.5 text-[#1b64da]" />
                <span>{currentDateTime || 'Mon, 03 Nov 2026 • 12:00:00 PM IST'}</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] font-bold text-emerald-800 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Depot Online • 4.2°C Cold Chain Active</span>
              </div>
            </div>

            {/* Right Profile & Notifications */}
            <div className="flex items-center gap-4">
              {/* Live Interactive Notification Center */}
              <NotificationCenter
                role="distributor"
                inventory={fullInventoryList}
                orders={allOrdersList}
                indents={indentRequests}
                onAction={handleNotificationAction}
              />

              {/* Profile Card */}
              <div className="flex items-center gap-3 pl-3 border-l border-slate-200/80">
                <div className="text-right">
                  <span className="font-extrabold text-xs text-slate-900 block leading-tight">
                    MedVantage Pharma Logistics
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono block">
                    WDL-2024-MVL-101
                  </span>
                </div>
                <div className="w-9 h-9 rounded-full bg-blue-100 text-[#1b64da] font-extrabold text-sm flex items-center justify-center shadow-2xs">
                  M
                </div>
              </div>
            </div>
          </header>

          {/* Sub-view Content Container */}
          <main className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* ========================================================================= */}
            {/* 1. ACTION-ORIENTED DISTRIBUTOR COMMAND CENTER (SIMPLE, REAL STATS & IMMEDIATE ACTIONS) */}
            {/* ========================================================================= */}
            {activeNav === 'dashboard' && (() => {
              const ordersNeedingAction = filteredFulfillmentOrders.filter(
                (o: any) => o.status === 'PENDING_APPROVAL' || o.status === 'CONFIRMED'
              );
              const pendingIndents = indentRequests.filter((r: any) => r.status === 'PENDING');
              const criticalBatches = filteredBatchInventory.filter(
                (b: any) => (b.unitsInStock !== undefined && b.unitsInStock < 50) || !!quarantinedBatches[b.batchNumber]
              );

              return (
                <div className="space-y-6">
                  {/* Clean Operational Hub Header */}
                  <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                        <h1 className="text-xl font-black text-slate-900 tracking-tight">
                          MedVantage Pharma Logistics · Operations Hub
                        </h1>
                        <span className="text-[10px] bg-blue-50 text-[#1b64da] font-mono font-bold px-2 py-0.5 rounded-md border border-blue-200">
                          WDL-2024-MVL-101
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>Bhiwandi Central Pharma Hub (Pincode: 421302)</span>
                        </span>
                        <span>·</span>
                        <span>Cold-Chain 2°C–8°C Log Active</span>
                        <span>·</span>
                        <span className="text-emerald-700 font-bold">CDSCO Wholesale Compliant</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          fetchOrders(true);
                          fetchInventory(true);
                          fetchIndentRequests();
                          showToast('Operational telemetry synchronized.');
                        }}
                        className="px-3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                        title="Refresh live orders, indents and stock"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                        <span>Sync Data</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setInwardMode('MANUAL');
                          setAddBatchModalOpen(true);
                        }}
                        className="px-4 py-2 bg-[#1b64da] hover:bg-[#1554ba] text-white rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Inward New Batch</span>
                      </button>
                    </div>
                  </div>

                  {/* 4 Real-time Actionable KPI Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* KPI 1: Orders Requiring Action */}
                    <div
                      onClick={() => setActiveNav('fulfillment')}
                      className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs hover:border-blue-300 transition cursor-pointer relative overflow-hidden group"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-500">Orders Needing Action</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                          High Priority
                        </span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black font-mono text-slate-900">
                          {ordersNeedingAction.length}
                        </span>
                        <span className="text-xs text-slate-500 font-medium">orders</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-2 font-medium">
                        {pendingCount} awaiting approval · {confirmedCount} ready to pack &amp; dispatch
                      </p>
                    </div>

                    {/* KPI 2: Chemist Sourcing Indents */}
                    <div
                      onClick={() => setActiveNav('indents')}
                      className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs hover:border-amber-300 transition cursor-pointer relative overflow-hidden group"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-500">Chemist Sourcing Indents</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                          Sourcing Queue
                        </span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black font-mono text-slate-900">
                          {pendingIndents.length}
                        </span>
                        <span className="text-xs text-slate-500 font-medium">requests</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-2 font-medium">
                        Medicines requested by retail pharmacists needing fulfillment
                      </p>
                    </div>

                    {/* KPI 3: Quality & Restock Radar */}
                    <div
                      onClick={() => setActiveNav('stock')}
                      className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs hover:border-purple-300 transition cursor-pointer relative overflow-hidden group"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-500">Critical Stock / QA</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                          Inventory Radar
                        </span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black font-mono text-slate-900">
                          {criticalBatches.length}
                        </span>
                        <span className="text-xs text-slate-500 font-medium">batches</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-2 font-medium">
                        Batches &lt; 50 units or under QA quarantine
                      </p>
                    </div>

                    {/* KPI 4: Active Fleet In Transit */}
                    <div
                      onClick={() => setActiveNav('fulfillment')}
                      className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs hover:border-blue-300 transition cursor-pointer relative overflow-hidden group"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-500">Active Consignments</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                          Live GPS
                        </span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black font-mono text-slate-900">
                          {dispatchedCount}
                        </span>
                        <span className="text-xs text-slate-500 font-medium">on the road</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-2 font-medium">
                        {deliveredCount} delivered successfully today
                      </p>
                    </div>
                  </div>

                  {/* ACTION SECTION 1: Orders Requiring Immediate Warehouse Action */}
                  <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                          <Clock className="w-4 h-4" />
                        </div>
                        <div>
                          <h2 className="text-sm font-extrabold text-slate-900">
                            Action Required: Orders Awaiting Review &amp; Dispatch ({ordersNeedingAction.length})
                          </h2>
                          <p className="text-xs text-slate-400">
                            Review pending retail pharmacy orders, reserve stock, and trigger warehouse dispatch
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setActiveNav('fulfillment')}
                        className="text-xs font-bold text-[#1b64da] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <span>View Full Fulfillment Pipeline</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {ordersNeedingAction.length === 0 ? (
                      <div className="py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                        <h4 className="text-sm font-extrabold text-slate-800">All Orders Are Processed &amp; Dispatched!</h4>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Zero pending orders awaiting distributor review. New orders from retail pharmacies will appear here instantly.
                        </p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto -mx-5 px-5">
                        <table className="w-full min-w-[760px] text-left text-xs border-collapse">
                          <thead>
                            <tr className="text-slate-400 uppercase font-bold text-[10px] bg-slate-50/70 border-b border-slate-100 whitespace-nowrap">
                              <th className="py-2.5 px-3">Order ID</th>
                              <th className="py-2.5 px-3">Retailer / Chemist</th>
                              <th className="py-2.5 px-3 text-center">Items</th>
                              <th className="py-2.5 px-3 text-right">Order Value</th>
                              <th className="py-2.5 px-3 text-center">Status</th>
                              <th className="py-2.5 px-3 text-center">Payment</th>
                              <th className="py-2.5 px-3 text-right">Immediate Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {ordersNeedingAction.map((ord: any) => {
                              const displayItemsCount = ord.itemsCount || ord.quantity || 50;

                              return (
                                <tr key={ord.id} className="hover:bg-slate-50/70 transition">
                                  <td className="py-3 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                                    {ord.orderNumber}
                                  </td>
                                  <td className="py-3 px-3 whitespace-nowrap">
                                    <span className="font-extrabold text-slate-900 block text-xs">
                                      {ord.medicalStoreName}
                                    </span>
                                    <span className="text-[11px] text-slate-400 flex items-center gap-1 font-normal">
                                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                      <span>{ord.medicalStoreCity || 'Mumbai'}</span>
                                    </span>
                                  </td>
                                  <td className="py-3 px-3 text-center font-mono font-medium text-slate-700 whitespace-nowrap">
                                    {displayItemsCount} items
                                  </td>
                                  <td className="py-3 px-3 text-right font-mono font-extrabold text-slate-900 whitespace-nowrap">
                                    ₹{ord.totalAmount?.toFixed(2)}
                                  </td>
                                  <td className="py-3 px-3 text-center whitespace-nowrap">
                                    <span
                                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                        ord.status === 'PENDING_APPROVAL'
                                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                      }`}
                                    >
                                      {ord.status === 'PENDING_APPROVAL' ? <Clock className="w-3 h-3" /> : <Check className="w-3 h-3" />}
                                      <span>{ord.status.replace('_', ' ')}</span>
                                    </span>
                                  </td>
                                  <td className="py-3 px-3 text-center whitespace-nowrap">
                                    {ord.paymentStatus === 'PAID' ? (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                        <span>Paid ({ord.paymentMode || 'UPI'})</span>
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
                                        <Clock className="w-3 h-3 text-amber-600" />
                                        <span>Awaiting Pay</span>
                                      </span>
                                    )}
                                  </td>
                                  <td className="py-3 px-3 text-right whitespace-nowrap">
                                    <div className="flex items-center justify-end gap-1.5">
                                      {ord.status === 'PENDING_APPROVAL' && (
                                        <>
                                          <button
                                            type="button"
                                            onClick={(e) => handleAcceptOrder(ord.id, e)}
                                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 shadow-2xs"
                                          >
                                            <Check className="w-3 h-3" />
                                            <span>Accept</span>
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => setRejectingOrder(ord)}
                                            className="px-2.5 py-1 text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-lg text-xs font-bold transition cursor-pointer"
                                          >
                                            Reject
                                          </button>
                                        </>
                                      )}

                                      {ord.status === 'CONFIRMED' && (
                                        <button
                                          type="button"
                                          onClick={() => setDispatchingOrder(ord)}
                                          className="px-3.5 py-1 bg-[#1b64da] hover:bg-[#1554ba] text-white rounded-lg text-xs font-extrabold transition cursor-pointer flex items-center gap-1 shadow-2xs"
                                        >
                                          <Truck className="w-3.5 h-3.5" />
                                          <span>Pack &amp; Dispatch</span>
                                        </button>
                                      )}

                                      <button
                                        type="button"
                                        onClick={() => {
                                          setSelectedOrder(ord);
                                          setActiveNav('fulfillment');
                                        }}
                                        className="px-2.5 py-1 text-slate-700 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold transition cursor-pointer"
                                      >
                                        Details
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* ACTION SECTION 2: Chemist Sourcing Indents (Medicines Requested by Retailers) */}
                  <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                          <ShoppingBag className="w-4 h-4" />
                        </div>
                        <div>
                          <h2 className="text-sm font-extrabold text-slate-900">
                            Action Required: Retail Chemist Sourcing Indents ({pendingIndents.length})
                          </h2>
                          <p className="text-xs text-slate-400">
                            Medicines requested by retail chemists when out of stock across wholesale suppliers
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setActiveNav('indents')}
                        className="text-xs font-bold text-[#1b64da] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <span>View All Indents ({indentRequests.length})</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {pendingIndents.length === 0 ? (
                      <div className="py-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        <Check className="w-6 h-6 text-emerald-600 mx-auto mb-1" />
                        <h4 className="text-xs font-extrabold text-slate-700">All Retailer Indents Are Sourced!</h4>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          No pending chemist requests. When a retail pharmacy requests an unavailable drug, it appears here immediately.
                        </p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto -mx-5 px-5">
                        <table className="w-full min-w-[760px] text-left text-xs border-collapse">
                          <thead>
                            <tr className="text-slate-400 uppercase font-bold text-[10px] bg-slate-50/70 border-b border-slate-100 whitespace-nowrap">
                              <th className="py-2.5 px-3">Requested Medicine</th>
                              <th className="py-2.5 px-3">Requesting Pharmacy</th>
                              <th className="py-2.5 px-3 text-center">Required Qty</th>
                              <th className="py-2.5 px-3 text-center">Urgency</th>
                              <th className="py-2.5 px-3 text-right">Immediate Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {pendingIndents.slice(0, 5).map((req: any) => (
                              <tr key={req.id} className="hover:bg-slate-50/70 transition">
                                <td className="py-3 px-3 whitespace-nowrap">
                                  <span className="font-extrabold text-slate-900 block text-xs">
                                    {req.medicine_name}
                                  </span>
                                  <span className="text-[11px] text-slate-400 block">
                                    {req.dosage_form || 'TABLET'} {req.strength ? `· ${req.strength}` : ''}
                                  </span>
                                </td>
                                <td className="py-3 px-3 whitespace-nowrap">
                                  <span className="font-bold text-slate-900 block text-xs">
                                    {req.store_name}
                                  </span>
                                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                    <span>{req.store_city || 'Mumbai'}</span>
                                  </span>
                                </td>
                                <td className="py-3 px-3 text-center font-mono font-bold text-slate-900 whitespace-nowrap">
                                  {req.required_qty} units
                                </td>
                                <td className="py-3 px-3 text-center whitespace-nowrap">
                                  <span
                                    className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                      req.urgency === 'CRITICAL'
                                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                        : req.urgency === 'HIGH'
                                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                        : 'bg-blue-50 text-blue-700 border border-blue-200'
                                    }`}
                                  >
                                    {req.urgency}
                                  </span>
                                </td>
                                <td className="py-3 px-3 text-right whitespace-nowrap">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setNewBrandName(req.medicine_name || '');
                                        setNewGenericName(req.generic_name || '');
                                        setNewDosageForm(req.dosage_form || 'TABLET');
                                        setNewStrength(req.strength || '500 mg');
                                        setNewOnHandQty(String(req.required_qty || 200));
                                        setInwardMode('NEW_MEDICINE');
                                        setAddBatchModalOpen(true);
                                      }}
                                      className="px-3 py-1 bg-[#1b64da] hover:bg-[#1554ba] text-white rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 shadow-2xs"
                                      title="Inward this medicine into distributor warehouse stock"
                                    >
                                      <Plus className="w-3 h-3" />
                                      <span>Inward &amp; Stock</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateIndentStatus(req.id, 'ACCEPTED')}
                                      className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold transition cursor-pointer"
                                    >
                                      Accept
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* ACTION SECTION 3: Stock & Batch Quality Radar */}
                  <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                          <Package className="w-4 h-4" />
                        </div>
                        <div>
                          <h2 className="text-sm font-extrabold text-slate-900">
                            Quality &amp; Stock Attention Radar ({criticalBatches.length})
                          </h2>
                          <p className="text-xs text-slate-400">
                            Batches with low quantity (&lt; 50 units) or under QA quarantine
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setActiveNav('inventory')}
                        className="text-xs font-bold text-[#1b64da] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <span>View Full Warehouse Inventory</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {criticalBatches.length === 0 ? (
                      <div className="py-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto mb-1" />
                        <h4 className="text-xs font-extrabold text-slate-700">All Warehouse Batches Are Healthy &amp; Released</h4>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          No low-stock or expiring batches. Cold-chain storage levels are within optimal parameters.
                        </p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto -mx-5 px-5">
                        <table className="w-full min-w-[760px] text-left text-xs border-collapse">
                          <thead>
                            <tr className="text-slate-400 uppercase font-bold text-[10px] bg-slate-50/70 border-b border-slate-100 whitespace-nowrap">
                              <th className="py-2.5 px-3">Batch &amp; Drug</th>
                              <th className="py-2.5 px-3">Expiry Date</th>
                              <th className="py-2.5 px-3 text-center">Available Stock</th>
                              <th className="py-2.5 px-3 text-center">QA Status</th>
                              <th className="py-2.5 px-3 text-right">Immediate Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {criticalBatches.slice(0, 5).map((b: any) => {
                              const isQuarantined = !!quarantinedBatches[b.batchNumber];
                              return (
                                <tr key={b.id || b.batchNumber} className="hover:bg-slate-50/70 transition">
                                  <td className="py-3 px-3 whitespace-nowrap">
                                    <span className="font-extrabold text-slate-900 block text-xs">
                                      {b.brandName || 'Formulation'}
                                    </span>
                                    <span className="font-mono text-[11px] text-slate-500 block">
                                      {b.batchNumber}
                                    </span>
                                  </td>
                                  <td className="py-3 px-3 font-mono text-slate-600 whitespace-nowrap">
                                    {b.expiryDateFormatted || b.expiryDate || '2028-06-30'}
                                  </td>
                                  <td className="py-3 px-3 text-center font-mono font-bold whitespace-nowrap">
                                    <span className={b.unitsInStock < 50 ? 'text-rose-600' : 'text-slate-900'}>
                                      {b.unitsInStock} units
                                    </span>
                                  </td>
                                  <td className="py-3 px-3 text-center whitespace-nowrap">
                                    <span
                                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                        isQuarantined
                                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                                      }`}
                                    >
                                      {isQuarantined ? 'QUARANTINED' : 'LOW STOCK'}
                                    </span>
                                  </td>
                                  <td className="py-3 px-3 text-right whitespace-nowrap">
                                    <div className="flex items-center justify-end gap-1.5">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setInwardMode('MANUAL');
                                          setAddBatchModalOpen(true);
                                        }}
                                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 shadow-2xs"
                                      >
                                        <Plus className="w-3 h-3" />
                                        <span>Restock</span>
                                      </button>
                                      {!isQuarantined && (
                                        <button
                                          type="button"
                                          onClick={() => handleToggleBatchQuarantine(b.batchNumber, true, 'QA Alert: Urgent Quality Investigation')}
                                          className="px-2.5 py-1 text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-lg text-xs font-bold transition cursor-pointer"
                                        >
                                          Quarantine
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
            {/* ========================================================================= */}
            {/* 2. FULFILLMENT & DISPATCH VIEW (MATCHES media_1793446677136_b81e04af.jpg) */}
            {/* ========================================================================= */}
            {activeNav === 'fulfillment' && (
              <div className="space-y-6">
                {/* Header Card */}
                <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#1b64da] flex items-center justify-center shadow-xs">
                      <Truck className="w-5 h-5" />
                    </div>
                    <div>
                      <h1 className="text-lg font-black text-slate-900">
                        Fulfillment & Dispatch Pipeline
                      </h1>
                      <p className="text-xs text-slate-400">
                        Manage incoming orders, approval, packing and dispatch
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => setAddBatchModalOpen(true)}
                      className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Inward New Batch</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        fetchOrders();
                        fetchInventory();
                      }}
                      className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition cursor-pointer"
                      title="Refresh Orders"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* 4 Stat Metric Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#1b64da] flex items-center justify-center shrink-0">
                        <Package className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-slate-500 block">All Orders</span>
                        <span className="text-2xl font-black font-mono text-slate-900">{totalOrdersCount}</span>
                      </div>
                    </div>
                    <span className="text-[11px] text-slate-400 mt-2 block font-medium">Total orders received</span>
                  </div>

                  <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                        <Clock className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-slate-500 block">Pending Approval</span>
                        <span className="text-2xl font-black font-mono text-slate-900">{pendingCount}</span>
                      </div>
                    </div>
                    <span className="text-[11px] text-slate-400 mt-2 block font-medium">Awaiting review</span>
                  </div>

                  <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                        <Truck className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-slate-500 block">Confirmed</span>
                        <span className="text-2xl font-black font-mono text-slate-900">{confirmedCount}</span>
                      </div>
                    </div>
                    <span className="text-[11px] text-slate-400 mt-2 block font-medium">Ready to dispatch</span>
                  </div>

                  <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-slate-500 block">Delivered</span>
                        <span className="text-2xl font-black font-mono text-slate-900">{deliveredCount}</span>
                      </div>
                    </div>
                    <span className="text-[11px] text-slate-400 mt-2 block font-medium">Completed this month</span>
                  </div>
                </div>

                {/* Main 2-Column Section: Table + Details Pane */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left Column (8 cols): Order Table */}
                  <div className="lg:col-span-8 min-w-0 bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
                    <div>
                      {/* Filter Pills Bar */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {[
                            { key: 'ALL', label: 'ALL', count: totalOrdersCount },
                            { key: 'PENDING_APPROVAL', label: 'PENDING APPROVAL', count: pendingCount },
                            { key: 'CONFIRMED', label: 'CONFIRMED', count: confirmedCount },
                            { key: 'DISPATCHED', label: 'DISPATCHED', count: dispatchedCount },
                            { key: 'DELIVERED', label: 'DELIVERED', count: deliveredCount },
                          ].map((st) => (
                            <button
                              key={st.key}
                              onClick={() => setFulfillmentFilter(st.key as any)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center gap-1.5 ${
                                fulfillmentFilter === st.key
                                  ? 'bg-[#1b64da] text-white shadow-xs'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              <span>{st.label}</span>
                              <span
                                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                                  fulfillmentFilter === st.key ? 'bg-blue-800 text-white' : 'bg-white text-slate-700'
                                }`}
                              >
                                {st.count}
                              </span>
                            </button>
                          ))}
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => showToast('Date range filter applied.')}
                            className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition flex items-center gap-1.5"
                          >
                            <Calendar className="w-3.5 h-3.5" />
                            <span>Date Range</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => showToast('Advanced status filter active.')}
                            className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition flex items-center gap-1.5"
                          >
                            <Filter className="w-3.5 h-3.5" />
                            <span>Filters</span>
                          </button>
                        </div>
                      </div>

                      {/* Orders Table with clean text alignment and horizontal scroll */}
                      <div className="overflow-x-auto mt-2 -mx-5 px-5">
                        <table className="w-full min-w-[780px] text-left text-xs border-collapse">
                          <thead>
                            <tr className="text-slate-400 uppercase font-bold text-[10px] bg-slate-50/70 border-b border-slate-100 whitespace-nowrap">
                              <th className="py-3 px-3 w-8 text-center">
                                <input type="checkbox" className="rounded text-[#1b64da]" />
                              </th>
                              <th className="py-3 px-3">Order ID</th>
                              <th className="py-3 px-3">Date &amp; Time</th>
                              <th className="py-3 px-3 min-w-[150px]">Retailer / Customer</th>
                              <th className="py-3 px-3 text-center">Items</th>
                              <th className="py-3 px-3 text-right">Order Value</th>
                              <th className="py-3 px-3 text-center">Status</th>
                              <th className="py-3 px-3 text-center">Payment</th>
                              <th className="py-3 px-3 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {filteredFulfillmentOrders.map((ord) => {
                              const isSelected = activeSelectedOrder?.id === ord.id;
                              const dateParts = ord.dateFormatted ? ord.dateFormatted.split(',') : [];
                              const datePart = dateParts[0] || '20 Nov 2026';
                              const timePart = dateParts[1]?.trim() || '03:14 AM';
                              const displayItemsCount = ord.itemsCount || ord.quantity || 50;

                              return (
                                <tr
                                  key={ord.id}
                                  onClick={() => setSelectedOrder(ord)}
                                  className={`transition cursor-pointer ${
                                    isSelected ? 'bg-blue-50/60 font-semibold' : 'hover:bg-slate-50/70'
                                  }`}
                                >
                                  <td className="py-3.5 px-3 text-center">
                                    <input type="checkbox" checked={isSelected} readOnly className="rounded text-[#1b64da]" />
                                  </td>
                                  <td className="py-3.5 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                                    {ord.orderNumber}
                                  </td>
                                  <td className="py-3.5 px-3 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                                    <span className="font-semibold text-slate-800 block leading-tight">{datePart}</span>
                                    <span className="text-[10px] text-slate-400 block leading-tight">{timePart}</span>
                                  </td>
                                  <td className="py-3.5 px-3 whitespace-nowrap min-w-[150px]">
                                    <span className="font-extrabold text-slate-900 block text-xs">
                                      {ord.medicalStoreName}
                                    </span>
                                    <span className="text-[11px] text-slate-400 flex items-center gap-1 font-normal">
                                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                      <span>{ord.medicalStoreCity || 'Mumbai'}</span>
                                    </span>
                                  </td>
                                  <td className="py-3.5 px-3 text-center font-medium text-slate-700 whitespace-nowrap font-mono">
                                    {displayItemsCount} items
                                  </td>
                                  <td className="py-3.5 px-3 text-right font-mono font-extrabold text-slate-900 whitespace-nowrap">
                                    ₹{ord.totalAmount?.toFixed(2)}
                                  </td>
                                  <td className="py-3.5 px-3 text-center whitespace-nowrap">
                                    <span
                                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                        ord.status === 'PENDING_APPROVAL'
                                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                          : ord.status === 'CONFIRMED'
                                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                          : ord.status === 'DISPATCHED'
                                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                          : 'bg-purple-50 text-purple-700 border border-purple-200'
                                      }`}
                                    >
                                      {ord.status === 'PENDING_APPROVAL' && <Clock className="w-3 h-3" />}
                                      {ord.status === 'CONFIRMED' && <Check className="w-3 h-3" />}
                                      {ord.status === 'DISPATCHED' && <Truck className="w-3 h-3" />}
                                      {ord.status === 'DELIVERED' && <CheckCircle2 className="w-3 h-3" />}
                                      <span>{ord.status.replace('_', ' ')}</span>
                                    </span>
                                  </td>
                                  <td className="py-3.5 px-3 text-center whitespace-nowrap">
                                    {ord.paymentStatus === 'PAID' ? (
                                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                        <span>Paid ({ord.paymentMode || 'UPI'})</span>
                                      </span>
                                    ) : ord.status === 'CONFIRMED' ? (
                                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
                                        <Clock className="w-3 h-3 text-amber-600" />
                                        <span>Awaiting Pay</span>
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-50 text-slate-500 border border-slate-200">
                                        <span>Unpaid</span>
                                      </span>
                                    )}
                                  </td>
                                  <td className="py-3.5 px-3 text-right whitespace-nowrap">
                                    <div className="flex items-center justify-end gap-1.5">
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedOrder(ord);
                                        }}
                                        className="px-2.5 py-1 text-[#1b64da] hover:bg-blue-50 border border-blue-200 rounded-lg text-xs font-bold transition cursor-pointer"
                                      >
                                        View
                                      </button>
                                      {ord.status === 'DISPATCHED' && (
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setLiveTrackingModalOrder(ord);
                                          }}
                                          className="px-2.5 py-1 text-blue-700 hover:bg-blue-50 border border-blue-200 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 shadow-2xs"
                                          title="Track Live GPS Fleet"
                                        >
                                          <Truck className="w-3 h-3 text-blue-600" />
                                          <span>GPS</span>
                                        </button>
                                      )}
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleOpenInvoiceModal(ord);
                                        }}
                                        className="px-2.5 py-1 text-slate-700 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 shadow-2xs"
                                        title="View & Print Official GST Tax Invoice"
                                      >
                                        <FileText className="w-3 h-3 text-slate-500" />
                                        <span>Invoice</span>
                                      </button>
                                      <MoreVertical className="w-4 h-4 text-slate-400 cursor-pointer" />
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  {/* Right Column (4 cols): Selected Order Inspector & Dispatch Stepper */}
                  <div className="lg:col-span-4 min-w-0 space-y-4">
                    {/* Top Card: Order Details */}
                    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-extrabold text-sm text-slate-900">Order Details</h3>
                        <button
                          type="button"
                          onClick={() => handleOpenInvoiceModal(activeSelectedOrder)}
                          title="Open Tax Invoice"
                          className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Header Badge */}
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold ${
                            activeSelectedOrder?.status === 'PENDING_APPROVAL'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : activeSelectedOrder?.status === 'CONFIRMED'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : activeSelectedOrder?.status === 'DISPATCHED'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-purple-50 text-purple-700 border border-purple-200'
                          }`}
                        >
                          <span className="w-2 h-2 rounded-full bg-current" />
                          <span>{activeSelectedOrder?.status.replace('_', ' ')}</span>
                        </span>
                        <span className="font-mono text-xs font-bold text-slate-400">
                          {activeSelectedOrder?.orderNumber}
                        </span>
                      </div>

                      <span className="text-[11px] text-slate-400 block font-mono">
                        {activeSelectedOrder?.dateFormatted || '31 Oct 2026, 14:32'}
                      </span>

                      {/* Retailer Card */}
                      <div className="p-3 bg-slate-50 border border-slate-200/70 rounded-xl flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 text-[#1b64da] flex items-center justify-center shrink-0 font-bold">
                          <User className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-extrabold text-xs text-slate-900 block">
                            {activeSelectedOrder?.medicalStoreName || 'Apollo Care Pharmacy'}
                          </span>
                          <span className="text-[11px] text-slate-500 font-mono block">
                            📱 {activeSelectedOrder?.medicalStorePhone || activeSelectedOrder?.phone || '+91 98200 12345'}
                          </span>
                          <span className="text-[11px] text-slate-500 font-mono block">
                            DL: {activeSelectedOrder?.medicalStoreLicense || 'DL-2024-MH-APO8821'}
                          </span>
                          <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3" />
                            <span>{activeSelectedOrder?.medicalStoreAddress || 'Shop 4, Colaba Causeway'}, {activeSelectedOrder?.medicalStoreCity || 'Mumbai'}</span>
                          </span>
                        </div>
                      </div>

                      {/* Details List */}
                      <div className="space-y-2.5 text-xs pt-1 divide-y divide-slate-100">
                        <div className="flex justify-between text-slate-500 font-medium pt-1">
                          <span>Items</span>
                          <span className="font-extrabold text-slate-900 font-mono">
                            {activeSelectedOrder?.itemsCount || activeSelectedOrder?.quantity || 50} items
                          </span>
                        </div>
                        <div className="flex justify-between text-slate-500 font-medium pt-2">
                          <span>Order Value</span>
                          <span className="font-extrabold font-mono text-slate-900 text-sm">
                            ₹{activeSelectedOrder?.totalAmount?.toFixed(2) || '2,811.12'}
                          </span>
                        </div>
                        <div className="flex justify-between text-slate-500 font-medium items-center pt-2">
                          <span>Settlement Status</span>
                          {activeSelectedOrder?.paymentStatus === 'PAID' ? (
                            <span className="font-extrabold text-emerald-700 font-mono text-[11px] bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>PAID ({activeSelectedOrder?.paymentMode || 'UPI'})</span>
                            </span>
                          ) : activeSelectedOrder?.status === 'CONFIRMED' ? (
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-amber-700 text-[10px] bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                                Awaiting Chemist
                              </span>
                              <button
                                type="button"
                                onClick={(e) => handleRecordOfflinePayment(activeSelectedOrder?.id, e)}
                                className="text-[10px] font-bold text-blue-600 hover:underline cursor-pointer"
                                title="Record offline cheque/NEFT payment"
                              >
                                Mark Paid
                              </button>
                            </div>
                          ) : (
                            <span className="font-medium text-slate-400 font-mono text-[11px]">Pending Approval</span>
                          )}
                        </div>
                        <div className="flex justify-between text-slate-500 font-medium pt-2">
                          <span>Payment Method</span>
                          <span className="font-extrabold text-slate-900 font-mono">{activeSelectedOrder?.paymentMode || 'UPI'}</span>
                        </div>
                        <div className="flex justify-between text-slate-500 font-medium pt-2">
                          <span>Expected Dispatch</span>
                          <span className="font-extrabold text-slate-900 font-mono">
                            {activeSelectedOrder?.expectedDispatch || '01 Nov 2026'}
                          </span>
                        </div>
                        <div className="flex justify-between text-slate-500 font-medium pt-2">
                          <span>Delivery Type</span>
                          <span className="font-extrabold text-[#1b64da]">{activeSelectedOrder?.deliveryType || 'Express'}</span>
                        </div>
                      </div>

                      {/* Action Button based on status */}
                      <div className="pt-2">
                        {activeSelectedOrder?.status === 'PENDING_APPROVAL' && (
                          <div className="space-y-2">
                            <button
                              type="button"
                              onClick={(e) => handleAcceptOrder(activeSelectedOrder.id, e)}
                              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl transition shadow-xs cursor-pointer flex items-center justify-center gap-2"
                            >
                              <Check className="w-4 h-4" />
                              <span>Accept &amp; Reserve Stock</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setRejectingOrder(activeSelectedOrder)}
                              className="w-full py-2 border border-rose-200 text-rose-700 hover:bg-rose-50 font-bold text-xs rounded-xl transition cursor-pointer"
                            >
                              Reject Order
                            </button>
                          </div>
                        )}

                        {activeSelectedOrder?.status === 'CONFIRMED' && (
                          <button
                            type="button"
                            onClick={() => {
                              setDispatchingOrder(activeSelectedOrder);
                              setTrackingNumber(`TRK-MED-${Math.floor(10000 + Math.random() * 90000)}`);
                            }}
                            className="w-full py-2.5 bg-[#1b64da] hover:bg-[#1554ba] text-white font-extrabold text-xs rounded-xl transition shadow-xs cursor-pointer flex items-center justify-center gap-2"
                          >
                            <Send className="w-4 h-4" />
                            <span>Pack & Dispatch Consignment</span>
                            <span>Pack &amp; Dispatch Consignment</span>
                          </button>
                        )}

                        {activeSelectedOrder?.status === 'DISPATCHED' && (
                          <div className="space-y-2">
                            <button
                              type="button"
                              onClick={() => setLiveTrackingModalOrder(activeSelectedOrder)}
                              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl transition shadow-xs cursor-pointer flex items-center justify-center gap-2"
                            >
                              <Truck className="w-4 h-4 animate-bounce" />
                              <span>Track Live GPS Fleet (IoT Temp: 3.8°C)</span>
                            </button>

                            <button
                              type="button"
                              onClick={(e) => handleMarkDelivered(activeSelectedOrder.id, e)}
                              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl transition shadow-xs cursor-pointer flex items-center justify-center gap-2"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Confirm Handover &amp; Mark Delivered</span>
                            </button>
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => handleOpenInvoiceModal(activeSelectedOrder)}
                          className="w-full mt-2 py-2.5 bg-blue-50 hover:bg-blue-100 text-[#1b64da] border border-blue-200/80 font-extrabold text-xs rounded-xl transition shadow-2xs cursor-pointer flex items-center justify-center gap-2"
                        >
                          <FileText className="w-4 h-4" />
                          <span>View B2B Tax Invoice</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Bottom Card: Dispatch Timeline */}
                    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs">
                      <h3 className="font-extrabold text-sm text-slate-900 mb-4">Dispatch Timeline</h3>

                      <div className="space-y-4 relative pl-6 text-xs">
                        {/* Timeline Line */}
                        <div className="absolute left-2.5 top-2 bottom-2 w-0.5 bg-slate-200" />

                        {/* Step 1 */}
                        <div className="relative">
                          <div className="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[9px] font-bold">
                            ✓
                          </div>
                          <span className="font-extrabold text-slate-900 block leading-tight">Order Confirmed</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {activeSelectedOrder?.dateFormatted || '31 Oct 2026, 14:32'}
                          </span>
                        </div>

                        {/* Step 2 */}
                        <div className="relative">
                          <div className="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-[#1b64da] text-white flex items-center justify-center text-[9px] font-bold">
                            ●
                          </div>
                          <span className="font-extrabold text-slate-900 block leading-tight">Packing in Progress</span>
                          <span className="text-[10px] text-slate-400 font-mono">31 Oct 2026, 15:10</span>
                        </div>

                        {/* Step 3 */}
                        <div className="relative">
                          <div
                            className={`absolute -left-6 top-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${
                              activeSelectedOrder?.status === 'DISPATCHED' || activeSelectedOrder?.status === 'DELIVERED'
                                ? 'bg-[#1b64da] text-white'
                                : 'bg-slate-200 text-slate-400'
                            }`}
                          >
                            ○
                          </div>
                          <span
                            className={`block leading-tight ${
                              activeSelectedOrder?.status === 'DISPATCHED' || activeSelectedOrder?.status === 'DELIVERED'
                                ? 'font-extrabold text-slate-900'
                                : 'font-medium text-slate-400'
                            }`}
                          >
                            Out for Dispatch
                          </span>
                          {activeSelectedOrder?.trackingNumber && (
                            <span className="text-[10px] text-blue-600 font-mono">
                              AWB: {activeSelectedOrder.trackingNumber}
                            </span>
                          )}
                        </div>

                        {/* Step 4 */}
                        <div className="relative">
                          <div
                            className={`absolute -left-6 top-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${
                              activeSelectedOrder?.status === 'DELIVERED'
                                ? 'bg-emerald-500 text-white'
                                : 'bg-slate-200 text-slate-400'
                            }`}
                          >
                            ○
                          </div>
                          <span
                            className={`block leading-tight ${
                              activeSelectedOrder?.status === 'DELIVERED'
                                ? 'font-extrabold text-emerald-700'
                                : 'font-medium text-slate-400'
                            }`}
                          >
                            Delivered
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* 3. BATCH INVENTORY VIEW (MATCHES media_1793446677091_0ef3c620.jpg)       */}
            {/* ========================================================================= */}
            {activeNav === 'inventory' && (
              <div className="space-y-6">
                {/* Header Card */}
                <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#1b64da] flex items-center justify-center shadow-xs">
                      <Package className="w-5 h-5" />
                    </div>
                    <div>
                      <h1 className="text-lg font-black text-slate-900">
                        Batch Inventory & Stock Levels
                      </h1>
                      <p className="text-xs text-slate-400">
                        Manage your medicine inventory, batches and real-time stock levels
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => setAddBatchModalOpen(true)}
                      className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Add New Batch</span>
                    </button>
                    <MoreVertical className="w-4 h-4 text-slate-400 cursor-pointer" />
                  </div>
                </div>

                {/* 4 Stat Metric Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#1b64da] flex items-center justify-center shrink-0">
                        <Package className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-slate-500 block">Total SKUs</span>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-2xl font-black font-mono text-slate-900">524</span>
                          <span className="text-[11px] font-bold text-emerald-600 font-mono">↑ +12%</span>
                        </div>
                      </div>
                    </div>
                    <span className="text-[11px] text-slate-400 mt-2 block font-medium">Active formulations</span>
                  </div>

                  <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                        <Box className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-slate-500 block">Available Stock</span>
                        <span className="text-2xl font-black font-mono text-slate-900">1,42,650 units</span>
                      </div>
                    </div>
                    <span className="text-[11px] text-slate-400 mt-2 block font-medium">Across all batches</span>
                  </div>

                  <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-slate-500 block">Low Stock Items</span>
                        <span className="text-2xl font-black font-mono text-slate-900">18</span>
                      </div>
                    </div>
                    <span className="text-[11px] text-slate-400 mt-2 block font-medium">Need restocking</span>
                  </div>

                  <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                        <Calendar className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-slate-500 block">Expiring Soon</span>
                        <span className="text-2xl font-black font-mono text-slate-900">7</span>
                      </div>
                    </div>
                    <span className="text-[11px] text-slate-400 mt-2 block font-medium">Within 60 days</span>
                  </div>
                </div>

                {/* Full-Width Batch Inventory Table */}
                <div className="w-full bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs">
                    <div>
                      {/* Sub-Tabs Row */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {[
                            { key: 'ALL', label: 'All Stock', count: 524 },
                            { key: 'LOW', label: 'Low Stock', count: 18 },
                            { key: 'EXPIRING', label: 'Expiring Soon', count: 7 },
                            { key: 'OUT', label: 'Out of Stock', count: 5 },
                          ].map((pill) => (
                            <button
                              key={pill.key}
                              onClick={() => setInventoryStockFilter(pill.key as any)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center gap-1.5 ${
                                inventoryStockFilter === pill.key
                                  ? 'bg-[#1b64da] text-white shadow-xs'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              <span>{pill.label}</span>
                              <span
                                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                                  inventoryStockFilter === pill.key ? 'bg-blue-800 text-white' : 'bg-white text-slate-700'
                                }`}
                              >
                                {pill.count}
                              </span>
                            </button>
                          ))}
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="relative w-48">
                            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                            <input
                              type="text"
                              value={inventorySearchQuery}
                              onChange={(e) => setInventorySearchQuery(e.target.value)}
                              placeholder="Search in inventory..."
                              className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#1b64da]"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => showToast('Filters active.')}
                            className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition flex items-center gap-1.5"
                          >
                            <Filter className="w-3.5 h-3.5" />
                            <span>Filters</span>
                          </button>
                        </div>
                      </div>

                      {/* Table */}
                      <div className="overflow-x-auto mt-2 w-full">
                        <table className="w-full text-left text-xs border-collapse min-w-[780px]">
                          <thead>
                            <tr className="text-slate-400 uppercase font-bold text-[10px] bg-slate-50/70 border-b border-slate-100 whitespace-nowrap">
                              <th className="py-3 px-3">Batch &amp; Formulation</th>
                              <th className="py-3 px-3">CDSCO &amp; CoA Quality</th>
                              <th className="py-3 px-3">Storage / Cold-Chain</th>
                              <th className="py-3 px-3">Expiry &amp; Ageing</th>
                              <th className="py-3 px-3 text-center">Batch Stock</th>
                              <th className="py-3 px-3 text-center">QA Quarantine Status</th>
                              <th className="py-3 px-3 text-right">Regulatory Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {filteredBatchInventory.map((item, idx) => {
                              const isQuarantined = !!quarantinedBatches[item.batchNumber];
                              const isColdChain = item.brandName?.toLowerCase().includes('inhaler') || 
                                                  item.brandName?.toLowerCase().includes('insulin') ||
                                                  item.dosageForm?.toLowerCase().includes('inhaler');

                              return (
                                <tr key={`batch-${item.id || item.batchNumber}-${idx}`} className={`transition ${isQuarantined ? 'bg-rose-50/40' : 'hover:bg-slate-50/70'}`}>
                                  <td className="py-3.5 px-3">
                                    <div className="flex items-center gap-2.5">
                                      <MedicineIcon name={item.brandName} />
                                      <div>
                                        <div className="flex items-center gap-1.5">
                                          <span className="font-extrabold text-slate-900 block text-xs">
                                            {item.brandName}
                                          </span>
                                          <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-bold">
                                            {item.batchNumber}
                                          </span>
                                        </div>
                                        <span className="text-[11px] text-slate-400 font-medium">
                                          {item.genericName} · {item.dosageForm}
                                        </span>
                                      </div>
                                    </div>
                                  </td>

                                  <td className="py-3.5 px-3">
                                    <button
                                      type="button"
                                      onClick={() => setViewingCoAModal(item)}
                                      className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-[11px] font-bold transition cursor-pointer"
                                      title="View Certificate of Analysis (CoA)"
                                    >
                                      <ShieldCheck className="w-3.5 h-3.5" />
                                      <span>CoA #{item.batchNumber.replace('BTH-', 'COA-')}</span>
                                    </button>
                                    <span className="block text-[10px] text-slate-400 mt-0.5 font-mono">
                                      NABL Lab Accredited · 99.4% Assay
                                    </span>
                                  </td>

                                  <td className="py-3.5 px-3">
                                    {isColdChain ? (
                                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-blue-50/80 border border-blue-200 text-blue-800 text-[11px] font-bold">
                                        <Snowflake className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
                                        <span>4.2°C (2°C–8°C Log)</span>
                                      </div>
                                    ) : (
                                      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-medium font-mono">
                                        <span>22.4°C Controlled</span>
                                      </div>
                                    )}
                                  </td>

                                  <td className="py-3.5 px-3 font-mono text-[11px]">
                                    <span className="font-bold text-slate-800 block">{item.expiryDate}</span>
                                    <span className="text-[10px] text-emerald-600 font-semibold">24+ months runway</span>
                                  </td>

                                  <td className="py-3.5 px-3 text-center font-bold">
                                    <span
                                      className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-mono ${
                                        item.availableQuantity < 50
                                          ? 'bg-amber-50 text-amber-700 font-bold'
                                          : 'bg-emerald-50 text-emerald-700'
                                      }`}
                                    >
                                      {item.availableQuantity} units
                                    </span>
                                  </td>

                                  <td className="py-3.5 px-3 text-center">
                                    <button
                                      type="button"
                                      onClick={() => handleToggleBatchQuarantine(item.batchNumber, !isQuarantined)}
                                      className={`px-2.5 py-1 rounded-xl text-[10px] font-black transition cursor-pointer flex items-center gap-1 mx-auto ${
                                        isQuarantined
                                          ? 'bg-rose-600 text-white shadow-xs hover:bg-rose-700'
                                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                                      }`}
                                      title="Toggle QA Quarantine Hold / Release"
                                    >
                                      {isQuarantined ? (
                                        <>
                                          <AlertTriangle className="w-3 h-3 text-white" />
                                          <span>QUARANTINE HOLD</span>
                                        </>
                                      ) : (
                                        <>
                                          <Check className="w-3 h-3 text-emerald-600" />
                                          <span>RELEASED FOR SALE</span>
                                        </>
                                      )}
                                    </button>
                                  </td>

                                  <td className="py-3.5 px-3 text-right">
                                    <div className="flex items-center justify-end gap-1.5">
                                      <button
                                        type="button"
                                        onClick={() => setViewingCoAModal(item)}
                                        className="p-1 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition cursor-pointer"
                                        title="View Certificate of Analysis"
                                      >
                                        <FileText className="w-4 h-4" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (confirm(`Initiate Emergency Batch Recall for Batch ${item.batchNumber}? This will notify all retailer buyers.`)) {
                                            handleToggleBatchQuarantine(item.batchNumber, true, 'Emergency CDSCO audit recall');
                                          }
                                        }}
                                        className="p-1 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                                        title="Emergency Batch Recall Notice"
                                      >
                                        <AlertCircle className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                {/* 3 Insight Cards (Placed Below the Full-Width Table) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Card 1: 📊 Stock Summary Donut Chart */}
                    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-1.5">
                          <BarChart2 className="w-4 h-4 text-slate-700" />
                          <h3 className="font-extrabold text-xs text-slate-900">Stock Summary</h3>
                        </div>
                        <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                          <span>All Categories</span>
                          <ChevronDown className="w-3 h-3" />
                        </span>
                      </div>

                      {/* Donut Chart SVG */}
                      <div className="flex items-center justify-center my-3">
                        <div className="relative w-36 h-36">
                          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                            {/* Circle 1: In Stock (Blue) */}
                            <circle
                              cx="50"
                              cy="50"
                              r="38"
                              fill="transparent"
                              stroke="#1b64da"
                              strokeWidth="14"
                              strokeDasharray="200 40"
                              strokeDashoffset="0"
                            />
                            {/* Circle 2: Low Stock (Amber) */}
                            <circle
                              cx="50"
                              cy="50"
                              r="38"
                              fill="transparent"
                              stroke="#f59e0b"
                              strokeWidth="14"
                              strokeDasharray="25 215"
                              strokeDashoffset="-200"
                            />
                            {/* Circle 3: Out of Stock (Rose) */}
                            <circle
                              cx="50"
                              cy="50"
                              r="38"
                              fill="transparent"
                              stroke="#ef4444"
                              strokeWidth="14"
                              strokeDasharray="10 230"
                              strokeDashoffset="-225"
                            />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                            <span className="text-xl font-black font-mono text-slate-900">524</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase">SKUs</span>
                          </div>
                        </div>
                      </div>

                      {/* Legend */}
                      <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5 text-slate-500">
                            <span className="w-2 h-2 rounded-full bg-[#1b64da]" />
                            <span>In Stock</span>
                          </span>
                          <span className="font-bold font-mono">494</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5 text-slate-500">
                            <span className="w-2 h-2 rounded-full bg-amber-500" />
                            <span>Low Stock</span>
                          </span>
                          <span className="font-bold font-mono">18</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5 text-slate-500">
                            <span className="w-2 h-2 rounded-full bg-rose-500" />
                            <span>Out of Stock</span>
                          </span>
                          <span className="font-bold font-mono">5</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5 text-slate-500">
                            <span className="w-2 h-2 rounded-full bg-purple-500" />
                            <span>Expiring Soon</span>
                          </span>
                          <span className="font-bold font-mono">7</span>
                        </div>
                      </div>
                    </div>

                    {/* Card 2: Category Distribution */}
                    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-3">
                      <div className="flex items-center gap-1.5">
                        <Activity className="w-4 h-4 text-slate-700" />
                        <h3 className="font-extrabold text-xs text-slate-900">Category Distribution</h3>
                      </div>

                      <div className="space-y-2.5 text-xs">
                        <div>
                          <div className="flex justify-between mb-1 font-medium">
                            <span className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-[#1b64da]" />
                              <span>Tablets</span>
                            </span>
                            <span className="font-bold font-mono">320 · 61%</span>
                          </div>
                          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-[#1b64da] rounded-full" style={{ width: '61%' }} />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between mb-1 font-medium">
                            <span className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-blue-400" />
                              <span>Inhalers</span>
                            </span>
                            <span className="font-bold font-mono">45 · 9%</span>
                          </div>
                          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-400 rounded-full" style={{ width: '9%' }} />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between mb-1 font-medium">
                            <span className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-purple-500" />
                              <span>Injections</span>
                            </span>
                            <span className="font-bold font-mono">38 · 7%</span>
                          </div>
                          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-purple-500 rounded-full" style={{ width: '7%' }} />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between mb-1 font-medium">
                            <span className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-amber-500" />
                              <span>Syrups</span>
                            </span>
                            <span className="font-bold font-mono">52 · 10%</span>
                          </div>
                          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-amber-500 rounded-full" style={{ width: '10%' }} />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between mb-1 font-medium">
                            <span className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-slate-400" />
                              <span>Others</span>
                            </span>
                            <span className="font-bold font-mono">69 · 13%</span>
                          </div>
                          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-slate-400 rounded-full" style={{ width: '13%' }} />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Card 3: 🔔 Expiring Batches (Next 60 Days) */}
                    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-1.5">
                          <Bell className="w-4 h-4 text-rose-500" />
                          <h3 className="font-extrabold text-xs text-slate-900">
                            Expiring Batches (Next 60 Days)
                          </h3>
                        </div>
                        <span className="text-[11px] font-bold text-[#1b64da] hover:underline cursor-pointer">
                          View All
                        </span>
                      </div>

                      <div className="space-y-2.5 text-xs">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-rose-500" />
                            <div>
                              <span className="font-bold text-slate-900 block leading-tight">Augmentin 625 Duo</span>
                              <span className="text-[10px] text-slate-400 font-mono">BTH-APO-7742</span>
                            </div>
                          </div>
                          <span className="font-mono text-rose-600 font-bold">15 Nov 2026</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-rose-500" />
                            <div>
                              <span className="font-bold text-slate-900 block leading-tight">Dolo 650</span>
                              <span className="text-[10px] text-slate-400 font-mono">BTH-APO-7710</span>
                            </div>
                          </div>
                          <span className="font-mono text-rose-600 font-bold">22 Nov 2026</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-rose-500" />
                            <div>
                              <span className="font-bold text-slate-900 block leading-tight">Cifran 500</span>
                              <span className="text-[10px] text-slate-400 font-mono">BTH-APO-7698</span>
                            </div>
                          </div>
                          <span className="font-mono text-rose-600 font-bold">05 Dec 2026</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* 4. STOCK LEVELS VIEW (MATCHES media_1793446677058_cdb680a2.jpg)          */}
            {/* ========================================================================= */}
            {activeNav === 'stock' && (
              <div className="space-y-6">
                {/* Header Card */}
                <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#1b64da] flex items-center justify-center shadow-xs">
                      <Sliders className="w-5 h-5" />
                    </div>
                    <div>
                      <h1 className="text-lg font-black text-slate-900">
                        Stock Levels
                      </h1>
                      <p className="text-xs text-slate-400">
                        Real-time inventory across all batches and warehouses
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span>Last Updated: 31 Oct 2026, 10:24 AM</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setAddBatchModalOpen(true)}
                      className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Update Stock</span>
                      <ChevronDown className="w-3 h-3 ml-0.5" />
                    </button>
                  </div>
                </div>

                {/* 4 Stat Metric Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                        <Box className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-slate-500 block">Total Stock Value</span>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-2xl font-black font-mono text-slate-900">₹24,82,650</span>
                          <span className="text-[11px] font-bold text-emerald-600 font-mono">↑ +8.2%</span>
                        </div>
                      </div>
                    </div>
                    <span className="text-[11px] text-slate-400 mt-2 block font-medium">Across all warehouses</span>
                  </div>

                  <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#1b64da] flex items-center justify-center shrink-0">
                        <Package className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-slate-500 block">Total Units</span>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-2xl font-black font-mono text-slate-900">1,42,650</span>
                          <span className="text-[11px] font-bold text-emerald-600 font-mono">↑ +12%</span>
                        </div>
                      </div>
                    </div>
                    <span className="text-[11px] text-slate-400 mt-2 block font-medium">Stock keeping units</span>
                  </div>

                  <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-slate-500 block">Low Stock Items</span>
                        <span className="text-2xl font-black font-mono text-slate-900">18</span>
                      </div>
                    </div>
                    <span className="text-[11px] text-slate-400 mt-2 block font-medium">Below threshold</span>
                  </div>

                  <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                        <Clock className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-slate-500 block">Expiry in 60 Days</span>
                        <span className="text-2xl font-black font-mono text-slate-900">7</span>
                      </div>
                    </div>
                    <span className="text-[11px] text-slate-400 mt-2 block font-medium">Needs attention</span>
                  </div>
                </div>

                {/* Full-Width Batch Inventory Table */}
                <div className="w-full bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs">
                    <div>
                      {/* Sub-Tabs Row */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {[
                            { key: 'ALL', label: 'All Stock', count: 524 },
                            { key: 'IN_STOCK', label: 'In Stock', count: 494 },
                            { key: 'LOW', label: 'Low Stock', count: 18 },
                            { key: 'OUT', label: 'Out of Stock', count: 5 },
                            { key: 'EXPIRING', label: 'Expiring Soon', count: 7 },
                          ].map((pill) => (
                            <button
                              key={pill.key}
                              onClick={() => setStockLevelFilter(pill.key as any)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center gap-1.5 ${
                                stockLevelFilter === pill.key
                                  ? 'bg-[#1b64da] text-white shadow-xs'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              <span>{pill.label}</span>
                              <span
                                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                                  stockLevelFilter === pill.key ? 'bg-blue-800 text-white' : 'bg-white text-slate-700'
                                }`}
                              >
                                {pill.count}
                              </span>
                            </button>
                          ))}
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => showToast('All Warehouses active.')}
                            className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition flex items-center gap-1.5"
                          >
                            <span>Warehouse: All Warehouses</span>
                            <ChevronDown className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => showToast('Filters active.')}
                            className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition flex items-center gap-1.5"
                          >
                            <Filter className="w-3.5 h-3.5" />
                            <span>Filters</span>
                          </button>
                        </div>
                      </div>

                      {/* Table */}
                      <div className="overflow-x-auto mt-2 w-full">
                        <table className="w-full text-left text-xs border-collapse min-w-[780px]">
                          <thead>
                            <tr className="text-slate-400 uppercase font-bold text-[10px] bg-slate-50/70 border-b border-slate-100 whitespace-nowrap">
                              <th className="py-3 px-3 min-w-[170px]">Medicine SKU &amp; Formulation</th>
                              <th className="py-3 px-3 min-w-[160px]">Physical WMS Bin &amp; Aisle</th>
                              <th className="py-3 px-3 text-center min-w-[95px]">ABC Velocity</th>
                              <th className="py-3 px-3 text-center min-w-[130px]">Stock vs Safety Buffer</th>
                              <th className="py-3 px-3 text-right min-w-[85px]">Valuation (₹)</th>
                              <th className="py-3 px-3 text-center min-w-[85px]">Status</th>
                              <th className="py-3 px-3 text-center min-w-[95px]">Manufacturer PO</th>
                              <th className="py-3 px-3 text-right min-w-[45px]">Audit</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {filteredStockLevels.map((item, idx) => {
                              // Assign realistic warehouse aisle/bin locations across Bhiwandi Hub
                              const zone = idx % 3 === 0 ? 'Zone A' : idx % 3 === 1 ? 'Zone B' : 'Zone C';
                              const aisle = `Aisle 0${(idx % 5) + 1}`;
                              const bin = `Bin B-${10 + (idx * 2)}`;
                              const isClassA = item.brandName.includes('Augmentin') || item.brandName.includes('Dolo') || item.brandName.includes('Amlong');
                              const isClassB = item.brandName.includes('Asthalin') || item.brandName.includes('Cifran');
                              const safetyBuffer = 50;
                              const currentQty = Number(item.currentStock || item.availableQuantity || 0);
                              const bufferPct = Math.min(100, Math.round((currentQty / safetyBuffer) * 100));
                              const valuation = currentQty * (Number(item.mrp || 50) * 0.7);

                              return (
                                <tr key={`stock-${item.id || item.brandName}-${idx}`} className="hover:bg-slate-50/70 transition">
                                  <td className="py-3.5 px-3 whitespace-nowrap">
                                    <div className="flex items-center gap-2.5">
                                      <MedicineIcon name={item.brandName} />
                                      <div>
                                        <span className="font-extrabold text-slate-900 block text-xs">
                                          {item.brandName}
                                        </span>
                                        <span className="text-[11px] text-slate-400 font-medium">
                                          {item.genericName} · {item.dosageForm}
                                        </span>
                                      </div>
                                    </div>
                                  </td>

                                  <td className="py-3.5 px-3 font-mono text-xs whitespace-nowrap">
                                    <div className="flex items-center gap-1.5">
                                      <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                      <span className="font-extrabold text-slate-900">
                                        {zone} · {aisle}
                                      </span>
                                    </div>
                                    <span className="text-[11px] text-slate-500 font-mono block ml-5">
                                      Rack Slot: <strong className="text-slate-800">{bin}</strong>
                                    </span>
                                  </td>

                                  <td className="py-3.5 px-3 text-center whitespace-nowrap">
                                    <span
                                      className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-black ${
                                        isClassA
                                          ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                          : isClassB
                                          ? 'bg-slate-100 text-slate-700'
                                          : 'bg-amber-100 text-amber-800'
                                      }`}
                                      title={isClassA ? 'Class A: High Velocity Fast-Moving Formulation' : 'Standard Moving Formulation'}
                                    >
                                      {isClassA ? 'CLASS A (FAST)' : isClassB ? 'CLASS B (MED)' : 'CLASS C (SLOW)'}
                                    </span>
                                  </td>

                                  <td className="py-3.5 px-3 text-center whitespace-nowrap">
                                    <div className="w-28 mx-auto">
                                      <div className="flex justify-between text-[11px] font-mono mb-1">
                                        <span className="font-extrabold text-slate-900">{currentQty} u</span>
                                        <span className="text-slate-400">Min: {safetyBuffer}</span>
                                      </div>
                                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                        <div
                                          className={`h-full rounded-full ${
                                            currentQty < safetyBuffer ? 'bg-amber-500' : 'bg-emerald-500'
                                          }`}
                                          style={{ width: `${bufferPct}%` }}
                                        />
                                      </div>
                                    </div>
                                  </td>

                                  <td className="py-3.5 px-3 text-right font-mono font-bold text-slate-900 text-xs whitespace-nowrap">
                                    ₹{valuation.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                  </td>

                                  <td className="py-3.5 px-3 text-center whitespace-nowrap">
                                    <span
                                      className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-extrabold ${
                                        item.stockStatus === 'In Stock'
                                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                          : item.stockStatus === 'Low Stock'
                                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                                      }`}
                                    >
                                      {item.stockStatus}
                                    </span>
                                  </td>

                                  <td className="py-3.5 px-3 text-center whitespace-nowrap">
                                    <button
                                      type="button"
                                      onClick={() => setReorderManufacturerModal(item)}
                                      className="px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold transition flex items-center gap-1 mx-auto shadow-2xs cursor-pointer"
                                      title="Generate Manufacturer Indent PO"
                                    >
                                      <Plus className="w-3 h-3" />
                                      <span>Indent PO</span>
                                    </button>
                                  </td>

                                  <td className="py-3.5 px-3 text-right whitespace-nowrap">
                                    <button
                                      type="button"
                                      onClick={() => setAdjustModalBatch(item)}
                                      className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer"
                                      title="Adjust Physical Inventory Count"
                                    >
                                      <Sliders className="w-4 h-4" />
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

                  {/* 3 Insight Cards (Placed Below the Full-Width Stock Levels Table) */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Card 1: 📊 Stock Insights Spline Chart */}
                    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                          <BarChart2 className="w-4 h-4 text-slate-700" />
                          <h3 className="font-extrabold text-xs text-slate-900">Stock Insights</h3>
                        </div>
                        <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                          <span>This Month</span>
                          <ChevronDown className="w-3 h-3" />
                        </span>
                      </div>

                      {/* Interactive Spline Chart */}
                      <div className="relative pt-6 pb-2">
                        {/* Tooltip hovering over peak point */}
                        <div className="absolute right-4 top-2 bg-slate-900 text-white text-[10px] px-2.5 py-1 rounded-lg font-mono font-bold shadow-md flex items-center gap-1.5 z-10">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                          <span>31 Oct · 1,42,650 units</span>
                        </div>

                        <svg viewBox="0 0 300 120" className="w-full h-32 overflow-visible">
                          <defs>
                            <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#1b64da" stopOpacity="0.2" />
                              <stop offset="100%" stopColor="#1b64da" stopOpacity="0.0" />
                            </linearGradient>
                          </defs>

                          {/* Grid Lines */}
                          <line x1="0" y1="20" x2="300" y2="20" stroke="#f1f5f9" strokeDasharray="3 3" />
                          <line x1="0" y1="60" x2="300" y2="60" stroke="#f1f5f9" strokeDasharray="3 3" />
                          <line x1="0" y1="100" x2="300" y2="100" stroke="#f1f5f9" strokeDasharray="3 3" />

                          {/* Area Fill */}
                          <path
                            d="M 10 100 Q 80 95 150 70 T 290 30 L 290 100 L 10 100 Z"
                            fill="url(#blueGradient)"
                          />

                          {/* Spline Curve */}
                          <path
                            d="M 10 100 Q 80 95 150 70 T 290 30"
                            fill="none"
                            stroke="#1b64da"
                            strokeWidth="3"
                            strokeLinecap="round"
                          />

                          {/* Points */}
                          <circle cx="10" cy="100" r="3.5" fill="#ffffff" stroke="#1b64da" strokeWidth="2.5" />
                          <circle cx="80" cy="95" r="3.5" fill="#ffffff" stroke="#1b64da" strokeWidth="2.5" />
                          <circle cx="150" cy="70" r="3.5" fill="#ffffff" stroke="#1b64da" strokeWidth="2.5" />
                          <circle cx="220" cy="55" r="3.5" fill="#ffffff" stroke="#1b64da" strokeWidth="2.5" />
                          <circle cx="290" cy="30" r="4.5" fill="#1b64da" stroke="#ffffff" strokeWidth="2.5" />
                        </svg>

                        {/* X-axis labels */}
                        <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1 px-1">
                          <span>1 Oct</span>
                          <span>8 Oct</span>
                          <span>16 Oct</span>
                          <span>24 Oct</span>
                          <span>31 Oct</span>
                        </div>
                      </div>
                    </div>

                    {/* Card 2: Top Stocked Categories */}
                    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Activity className="w-4 h-4 text-slate-700" />
                          <h3 className="font-extrabold text-xs text-slate-900">Top Stocked Categories</h3>
                        </div>
                        <span className="text-[11px] font-bold text-[#1b64da] hover:underline cursor-pointer">
                          View All
                        </span>
                      </div>

                      <div className="space-y-2.5 text-xs">
                        <div>
                          <div className="flex justify-between mb-1 font-medium">
                            <span className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-[#1b64da]" />
                              <span>Tablets</span>
                            </span>
                            <span className="font-bold font-mono">320 · 61%</span>
                          </div>
                          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-[#1b64da] rounded-full" style={{ width: '61%' }} />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between mb-1 font-medium">
                            <span className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-blue-400" />
                              <span>Inhalers</span>
                            </span>
                            <span className="font-bold font-mono">45 · 9%</span>
                          </div>
                          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-400 rounded-full" style={{ width: '9%' }} />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between mb-1 font-medium">
                            <span className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-purple-500" />
                              <span>Injections</span>
                            </span>
                            <span className="font-bold font-mono">38 · 7%</span>
                          </div>
                          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-purple-500 rounded-full" style={{ width: '7%' }} />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between mb-1 font-medium">
                            <span className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-amber-500" />
                              <span>Syrups</span>
                            </span>
                            <span className="font-bold font-mono">52 · 10%</span>
                          </div>
                          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-amber-500 rounded-full" style={{ width: '10%' }} />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between mb-1 font-medium">
                            <span className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-slate-400" />
                              <span>Others</span>
                            </span>
                            <span className="font-bold font-mono">69 · 13%</span>
                          </div>
                          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-slate-400 rounded-full" style={{ width: '13%' }} />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Card 3: ⚠️ Low Stock Alerts */}
                    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4 text-rose-500" />
                          <h3 className="font-extrabold text-xs text-slate-900">Low Stock Alerts</h3>
                        </div>
                        <span className="text-[11px] font-bold text-[#1b64da] hover:underline cursor-pointer">
                          View All
                        </span>
                      </div>

                      <div className="space-y-2.5 text-xs">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-rose-500" />
                            <div>
                              <span className="font-bold text-slate-900 block leading-tight">Augmentin 625 Duo</span>
                              <span className="text-[10px] text-slate-400 font-mono">BTH-APO-8800</span>
                            </div>
                          </div>
                          <span className="font-mono text-rose-600 font-black">44 units</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-rose-500" />
                            <div>
                              <span className="font-bold text-slate-900 block leading-tight">Glycomet 500 SR</span>
                              <span className="text-[10px] text-slate-400 font-mono">BTH-APO-8809</span>
                            </div>
                          </div>
                          <span className="font-mono text-rose-600 font-black">28 units</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-rose-500" />
                            <div>
                              <span className="font-bold text-slate-900 block leading-tight">Montek LC</span>
                              <span className="text-[10px] text-slate-400 font-mono">BTH-APO-8815</span>
                            </div>
                          </div>
                          <span className="font-mono text-rose-600 font-black">12 units</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-rose-500" />
                            <div>
                              <span className="font-bold text-slate-900 block leading-tight">Pantop 40</span>
                              <span className="text-[10px] text-slate-400 font-mono">BTH-APO-7721</span>
                            </div>
                          </div>
                          <span className="font-mono text-rose-600 font-black">8 units</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
            )}


            {/* ========================================================================= */}
            {/* 5. RETAILER ORDERS VIEW                                                   */}
            {/* ========================================================================= */}
            {activeNav === 'retailer-orders' && (
              <div className="space-y-6">
                {/* Header Card */}
                <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#1b64da] flex items-center justify-center shadow-xs">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h1 className="text-lg font-black text-slate-900">
                        Retailer Accounts & Orders Ledger
                      </h1>
                      <p className="text-xs text-slate-400">
                        Manage verified chemist accounts, procurement volume, credit terms, and invoices
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={handleDownloadMasterLedgerCsv}
                      className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Export Retailer Ledger (CSV)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => showToast('Account statements refreshed.')}
                      className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition cursor-pointer"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* 4 Stat Metric Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#1b64da] flex items-center justify-center shrink-0">
                        <User className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-slate-500 block">Active Chemist Retailers</span>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-2xl font-black font-mono text-slate-900">48</span>
                          <span className="text-[11px] font-bold text-emerald-600 font-mono">↑ +6</span>
                        </div>
                      </div>
                    </div>
                    <span className="text-[11px] text-slate-400 mt-2 block font-medium">All Form 20/21 Verified</span>
                  </div>

                  <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                        <Box className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-slate-500 block">Total Invoiced Volume</span>
                        <span className="text-2xl font-black font-mono text-slate-900">₹38,42,850</span>
                      </div>
                    </div>
                    <span className="text-[11px] text-slate-400 mt-2 block font-medium">Monthly B2B throughput</span>
                  </div>

                  <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                        <TrendingUp className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-slate-500 block">Average PO Ticket</span>
                        <span className="text-2xl font-black font-mono text-slate-900">₹14,250</span>
                      </div>
                    </div>
                    <span className="text-[11px] text-slate-400 mt-2 block font-medium">Per wholesale requisition</span>
                  </div>

                  <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                        <Clock className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-slate-500 block">Outstanding Receivables</span>
                        <span className="text-2xl font-black font-mono text-slate-900">₹1,24,600</span>
                      </div>
                    </div>
                    <span className="text-[11px] text-slate-400 mt-2 block font-medium">15-day credit terms (96.4% on-time)</span>
                  </div>
                </div>

                {/* Main 2-Column Section */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left Column (8 cols): Retailers Table */}
                  <div className="lg:col-span-8 min-w-0 bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs flex flex-col justify-between">
                    <div>
                      {/* Filter Tabs & Search */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {[
                            { key: 'ALL', label: 'All Accounts', count: 48 },
                            { key: 'TIER1', label: 'Preferred Tier 1', count: 18 },
                            { key: 'REGULAR', label: 'Regular', count: 24 },
                            { key: 'NEW', label: 'New Accounts', count: 6 },
                          ].map((t) => (
                            <button
                              key={t.key}
                              onClick={() => setRetailerFilter(t.key as any)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center gap-1.5 ${
                                retailerFilter === t.key
                                  ? 'bg-[#1b64da] text-white shadow-xs'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              <span>{t.label}</span>
                              <span
                                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                                  retailerFilter === t.key ? 'bg-blue-800 text-white' : 'bg-white text-slate-700'
                                }`}
                              >
                                {t.count}
                              </span>
                            </button>
                          ))}
                        </div>

                        <div className="relative w-56">
                          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                          <input
                            type="text"
                            value={retailerSearch}
                            onChange={(e) => setRetailerSearch(e.target.value)}
                            placeholder="Search chemist or city..."
                            className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#1b64da]"
                          />
                        </div>
                      </div>

                      {/* Table */}
                      <div className="overflow-x-auto mt-2">
                        <table className="w-full min-w-[700px] text-left text-xs border-collapse whitespace-nowrap">
                          <thead>
                            <tr className="text-slate-400 uppercase font-bold text-[10px] bg-slate-50/70 border-b border-slate-100">
                              <th className="py-3 px-3">Chemist Retailer</th>
                              <th className="py-3 px-3">Drug License</th>
                              <th className="py-3 px-3 text-center">Orders</th>
                              <th className="py-3 px-3 text-right">Lifetime Volume</th>
                              <th className="py-3 px-3 text-right">Credit Balance</th>
                              <th className="py-3 px-3 text-center">Status</th>
                              <th className="py-3 px-3 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {retailersList
                              .filter((r) => {
                                if (retailerFilter !== 'ALL' && r.tier !== retailerFilter) return false;
                                if (!retailerSearch.trim()) return true;
                                const q = retailerSearch.toLowerCase();
                                return r.name.toLowerCase().includes(q) || r.city.toLowerCase().includes(q);
                              })
                              .map((r) => {
                                const isSel = (selectedRetailer || retailersList[0])?.id === r.id;
                                return (
                                  <tr
                                    key={r.id}
                                    onClick={() => setSelectedRetailer(r)}
                                    className={`transition cursor-pointer ${
                                      isSel ? 'bg-blue-50/60 font-semibold' : 'hover:bg-slate-50/70'
                                    }`}
                                  >
                                    <td className="py-3.5 px-3">
                                      <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-full bg-blue-100 text-[#1b64da] flex items-center justify-center font-bold text-xs shrink-0">
                                          {r.name.charAt(0)}
                                        </div>
                                        <div>
                                          <span className="font-extrabold text-slate-900 block text-xs">
                                            {r.name}
                                          </span>
                                          <span className="text-[11px] text-slate-400 flex items-center gap-1 font-normal">
                                            <MapPin className="w-3 h-3 text-slate-400" />
                                            <span>{r.city}, Maharashtra</span>
                                          </span>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="py-3.5 px-3 font-mono text-slate-600 font-semibold text-[11px]">
                                      {r.licenseNumber}
                                    </td>
                                    <td className="py-3.5 px-3 text-center font-bold text-slate-800">
                                      {r.totalOrders} POs
                                    </td>
                                    <td className="py-3.5 px-3 text-right font-mono font-extrabold text-slate-900">
                                      ₹{r.totalPurchases.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="py-3.5 px-3 text-right font-mono text-slate-600">
                                      ₹{r.creditUsed.toLocaleString('en-IN')} / ₹{r.creditLimit.toLocaleString('en-IN')}
                                    </td>
                                    <td className="py-3.5 px-3 text-center">
                                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                        {r.status}
                                      </span>
                                    </td>
                                    <td className="py-3.5 px-3 text-right">
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedRetailer(r);
                                          showToast(`Selected retailer ${r.name}`);
                                        }}
                                        className="px-2.5 py-1 text-[#1b64da] hover:bg-blue-50 border border-blue-200 rounded-lg text-xs font-bold transition cursor-pointer"
                                      >
                                        Ledger
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

                  {/* Right Column (4 cols): Selected Chemist Profile & History */}
                  <div className="lg:col-span-4 min-w-0 space-y-4">
                    {/* Retailer Detail Card */}
                    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-3.5">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <h3 className="font-extrabold text-sm text-slate-900">Chemist Account Dossier</h3>
                        <span className="text-[10px] bg-blue-100 text-[#1b64da] font-mono px-2 py-0.5 rounded font-bold">
                          {(selectedRetailer || retailersList[0]).tier}
                        </span>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#1b64da] flex items-center justify-center font-bold text-base shrink-0">
                          {(selectedRetailer || retailersList[0]).name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-extrabold text-sm text-slate-900 leading-tight">
                            {(selectedRetailer || retailersList[0]).name}
                          </h4>
                          <span className="text-xs text-slate-500 font-mono block mt-0.5">
                            Lic: {(selectedRetailer || retailersList[0]).licenseNumber}
                          </span>
                          <span className="text-xs text-slate-400 block">
                            📍 {(selectedRetailer || retailersList[0]).address}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2 text-xs pt-1">
                        <div className="flex justify-between text-slate-500 font-medium">
                          <span>Contact Phone</span>
                          <span className="font-bold font-mono text-slate-900">{(selectedRetailer || retailersList[0]).phone}</span>
                        </div>
                        <div className="flex justify-between text-slate-500 font-medium">
                          <span>Total Invoiced</span>
                          <span className="font-black font-mono text-slate-900">
                            ₹{(selectedRetailer || retailersList[0]).totalPurchases.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="flex justify-between text-slate-500 font-medium">
                          <span>Credit Utilization</span>
                          <span className="font-bold text-emerald-700">
                            {Math.round(((selectedRetailer || retailersList[0]).creditUsed / (selectedRetailer || retailersList[0]).creditLimit) * 100)}% of limit
                          </span>
                        </div>
                        <div className="flex justify-between text-slate-500 font-medium">
                          <span>Last Order Date</span>
                          <span className="font-bold font-mono text-slate-900">{(selectedRetailer || retailersList[0]).lastOrderDate}</span>
                        </div>
                      </div>

                      {/* Recordkeeping Toggle: What is Going vs What is Done */}
                      <div className="pt-3 border-t border-slate-100">
                        <div className="flex items-center justify-between mb-2.5">
                          <span className="text-[11px] font-black uppercase tracking-wider text-slate-700">
                            Store Consignment Records
                          </span>
                          <div className="flex bg-slate-100 p-0.5 rounded-lg text-[10px] font-bold">
                            <button
                              type="button"
                              onClick={() => setDossierRecordTab('GOING')}
                              className={`px-2 py-1 rounded-md transition cursor-pointer ${
                                dossierRecordTab === 'GOING' ? 'bg-white text-blue-700 shadow-2xs font-black' : 'text-slate-500 hover:text-slate-800'
                              }`}
                            >
                              What is Going
                            </button>
                            <button
                              type="button"
                              onClick={() => setDossierRecordTab('DONE')}
                              className={`px-2 py-1 rounded-md transition cursor-pointer ${
                                dossierRecordTab === 'DONE' ? 'bg-white text-emerald-700 shadow-2xs font-black' : 'text-slate-500 hover:text-slate-800'
                              }`}
                            >
                              What is Done
                            </button>
                          </div>
                        </div>

                        {/* Order records list for selected retailer */}
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                          {(() => {
                            const cur = selectedRetailer || retailersList[0];
                            const relOrders = allOrdersList.filter(
                              (o: any) =>
                                o.medicalStoreName?.toLowerCase().includes(cur.name.toLowerCase()) ||
                                cur.name.toLowerCase().includes(o.medicalStoreName?.toLowerCase() || '')
                            );
                            const list = relOrders.length > 0 ? relOrders : allOrdersList;
                            const filteredList = list.filter((o: any) =>
                              dossierRecordTab === 'DONE'
                                ? o.status === 'DELIVERED' || o.status === 'COMPLETED'
                                : o.status !== 'DELIVERED' && o.status !== 'COMPLETED'
                            );

                            if (filteredList.length === 0) {
                              return (
                                <div className="text-center py-4 bg-slate-50 rounded-lg text-xs text-slate-400">
                                  No {dossierRecordTab === 'GOING' ? 'active in-transit' : 'delivered'} consignments found for this store.
                                </div>
                              );
                            }

                            return filteredList.slice(0, 4).map((ord: any) => (
                              <div
                                key={ord.id}
                                className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-lg text-xs flex items-center justify-between gap-2"
                              >
                                <div>
                                  <div className="flex items-center gap-1.5 font-mono">
                                    <span className="font-bold text-slate-900">{ord.orderNumber}</span>
                                    <span
                                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                                        ord.status === 'DELIVERED'
                                          ? 'bg-emerald-50 text-emerald-700'
                                          : ord.status === 'DISPATCHED'
                                          ? 'bg-blue-50 text-blue-700'
                                          : 'bg-amber-50 text-amber-700'
                                      }`}
                                    >
                                      {ord.status}
                                    </span>
                                  </div>
                                  <span className="text-[11px] text-slate-500 block truncate">
                                    {ord.medicineName || 'Amlong 5'} · {ord.quantity || 50} units
                                  </span>
                                </div>
                                <div className="text-right shrink-0 font-mono">
                                  <span className="font-black text-slate-900 block">
                                    ₹{(ord.totalAmount || 2400).toFixed(2)}
                                  </span>
                                  <span className="text-[10px] text-slate-400">
                                    {ord.dateFormatted || '31 Oct'}
                                  </span>
                                </div>
                              </div>
                            ));
                          })()}
                        </div>
                      </div>

                      <div className="pt-2 space-y-2">
                        <button
                          type="button"
                          onClick={() => handleDownloadStoreReportCsv(selectedRetailer || retailersList[0])}
                          className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl transition shadow-xs cursor-pointer flex items-center justify-center gap-2"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download Store Statement (CSV)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveNav('fulfillment');
                            setFulfillmentSearch((selectedRetailer || retailersList[0]).name);
                          }}
                          className="w-full py-2 bg-[#1b64da] hover:bg-[#1554ba] text-white font-extrabold text-xs rounded-xl transition shadow-xs cursor-pointer flex items-center justify-center gap-2"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>View Incoming Orders</span>
                        </button>
                      </div>
                    </div>

                    {/* Top Ordered Formulations Card */}
                    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs">
                      <h3 className="font-extrabold text-xs text-slate-900 mb-3">Top Ordered Formulations</h3>
                      <div className="space-y-2.5 text-xs">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <MedicineIcon name="Augmentin" />
                            <div>
                              <span className="font-bold text-slate-900 block leading-tight">Augmentin 625 Duo</span>
                              <span className="text-[10px] text-slate-400">120 units ordered this month</span>
                            </div>
                          </div>
                          <span className="font-mono font-bold text-slate-900">₹21,000</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <MedicineIcon name="Dolo" />
                            <div>
                              <span className="font-bold text-slate-900 block leading-tight">Dolo 650 Tablets</span>
                              <span className="text-[10px] text-slate-400">250 units ordered this month</span>
                            </div>
                          </div>
                          <span className="font-mono font-bold text-slate-900">₹6,750</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <MedicineIcon name="Asthalin" />
                            <div>
                              <span className="font-bold text-slate-900 block leading-tight">Asthalin Inhaler</span>
                              <span className="text-[10px] text-slate-400">45 units ordered this month</span>
                            </div>
                          </div>
                          <span className="font-mono font-bold text-slate-900">₹6,300</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* 6. RETURNS & REPLACEMENTS VIEW                                            */}
            {/* ========================================================================= */}
            {activeNav === 'returns' && (
              <div className="space-y-6">
                {/* Header Card */}
                <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#1b64da] flex items-center justify-center shadow-xs">
                      <RotateCcw className="w-5 h-5" />
                    </div>
                    <div>
                      <h1 className="text-lg font-black text-slate-900">
                        Returns, Expiry Recalls &amp; Replacements
                      </h1>
                      <p className="text-xs text-slate-400">
                        Process reverse logistics claims, batch recalls, damaged packaging, and credit notes
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => showToast('Return claim filed. Pharmacist inspection ticket created.')}
                      className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ File Return Claim</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => showToast('Claims queue refreshed.')}
                      className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition cursor-pointer"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* 4 Stat Metric Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                        <Clock className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-slate-500 block">Active Return Claims</span>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-2xl font-black font-mono text-slate-900">
                            {returnClaims.filter((c) => c.status === 'PENDING').length}
                          </span>
                          <span className="text-[11px] font-bold text-amber-600">Pending</span>
                        </div>
                      </div>
                    </div>
                    <span className="text-[11px] text-slate-400 mt-2 block font-medium">Within 24h SLA target</span>
                  </div>

                  <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#1b64da] flex items-center justify-center shrink-0">
                        <Box className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-slate-500 block">Total Returned Value</span>
                        <span className="text-2xl font-black font-mono text-slate-900">₹18,450</span>
                      </div>
                    </div>
                    <span className="text-[11px] text-slate-400 mt-2 block font-medium">0.48% of total volume (Low)</span>
                  </div>

                  <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-slate-500 block">Credit Notes Issued</span>
                        <span className="text-2xl font-black font-mono text-slate-900">
                          {returnClaims.filter((c) => c.status === 'CREDITED').length + 10}
                        </span>
                      </div>
                    </div>
                    <span className="text-[11px] text-slate-400 mt-2 block font-medium">₹72,300 refunded this quarter</span>
                  </div>

                  <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                        <Activity className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-slate-500 block">Avg Resolution Time</span>
                        <span className="text-2xl font-black font-mono text-slate-900">2.4 Days</span>
                      </div>
                    </div>
                    <span className="text-[11px] text-slate-400 mt-2 block font-medium">Regulatory target: &lt; 3.0 days</span>
                  </div>
                </div>

                {/* Main 2-Column Section */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left Column (8 cols): Return Claims Queue Table */}
                  <div className="lg:col-span-8 min-w-0 bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs flex flex-col justify-between">
                    <div>
                      {/* Filter Tabs & Search */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {[
                            { key: 'ALL', label: 'All Claims', count: returnClaims.length },
                            { key: 'PENDING', label: 'Pending Inspection', count: returnClaims.filter((c) => c.status === 'PENDING').length },
                            { key: 'CREDITED', label: 'Credit Note Issued', count: returnClaims.filter((c) => c.status === 'CREDITED').length },
                          ].map((t) => (
                            <button
                              key={t.key}
                              onClick={() => setReturnsFilter(t.key as any)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center gap-1.5 ${
                                returnsFilter === t.key
                                  ? 'bg-[#1b64da] text-white shadow-xs'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              <span>{t.label}</span>
                              <span
                                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                                  returnsFilter === t.key ? 'bg-blue-800 text-white' : 'bg-white text-slate-700'
                                }`}
                              >
                                {t.count}
                              </span>
                            </button>
                          ))}
                        </div>

                        <div className="relative w-56">
                          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                          <input
                            type="text"
                            value={returnsSearch}
                            onChange={(e) => setReturnsSearch(e.target.value)}
                            placeholder="Search claim # or product..."
                            className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#1b64da]"
                          />
                        </div>
                      </div>

                      {/* Claims Table */}
                      <div className="overflow-x-auto mt-2">
                        <table className="w-full min-w-[720px] text-left text-xs border-collapse whitespace-nowrap">
                          <thead>
                            <tr className="text-slate-400 uppercase font-bold text-[10px] bg-slate-50/70 border-b border-slate-100">
                              <th className="py-3 px-3">Claim ID</th>
                              <th className="py-3 px-3">Retail Chemist</th>
                              <th className="py-3 px-3">Formulation &amp; Batch</th>
                              <th className="py-3 px-3">Reason Category</th>
                              <th className="py-3 px-3 text-right">Claim Value</th>
                              <th className="py-3 px-3 text-center">Status</th>
                              <th className="py-3 px-3 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {returnClaims
                              .filter((c) => {
                                if (returnsFilter !== 'ALL' && c.status !== returnsFilter) return false;
                                if (!returnsSearch.trim()) return true;
                                const q = returnsSearch.toLowerCase();
                                return (
                                  c.id.toLowerCase().includes(q) ||
                                  c.chemistName.toLowerCase().includes(q) ||
                                  c.medicineName.toLowerCase().includes(q)
                                );
                              })
                              .map((c) => {
                                const isSel = (selectedClaim || returnClaims[0])?.id === c.id;
                                return (
                                  <tr
                                    key={c.id}
                                    onClick={() => setSelectedClaim(c)}
                                    className={`transition cursor-pointer ${
                                      isSel ? 'bg-blue-50/60 font-semibold' : 'hover:bg-slate-50/70'
                                    }`}
                                  >
                                    <td className="py-3.5 px-3 font-mono font-bold text-slate-900">
                                      {c.id}
                                    </td>
                                    <td className="py-3.5 px-3">
                                      <span className="font-extrabold text-slate-900 block text-xs">
                                        {c.chemistName}
                                      </span>
                                      <span className="text-[11px] text-slate-400 font-mono">
                                        {c.chemistCity} · {c.createdAt}
                                      </span>
                                    </td>
                                    <td className="py-3.5 px-3">
                                      <span className="font-bold text-slate-800 block">
                                        {c.medicineName} ({c.quantity})
                                      </span>
                                      <span className="text-[10px] text-slate-400 font-mono">
                                        Lot: {c.batchNumber}
                                      </span>
                                    </td>
                                    <td className="py-3.5 px-3">
                                      <span
                                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                                          c.reasonCategory.includes('Cold')
                                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                            : c.reasonCategory.includes('Damaged')
                                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                                        }`}
                                      >
                                        {c.reasonCategory}
                                      </span>
                                    </td>
                                    <td className="py-3.5 px-3 text-right font-mono font-extrabold text-slate-900">
                                      ₹{c.claimValue.toFixed(2)}
                                    </td>
                                    <td className="py-3.5 px-3 text-center">
                                      <span
                                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                          c.status === 'PENDING'
                                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                            : 'bg-purple-50 text-purple-700 border border-purple-200'
                                        }`}
                                      >
                                        {c.status === 'PENDING' ? 'Pending Inspection' : 'Credit Note Issued'}
                                      </span>
                                    </td>
                                    <td className="py-3.5 px-3 text-right">
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedClaim(c);
                                        }}
                                        className="px-2.5 py-1 text-[#1b64da] hover:bg-blue-50 border border-blue-200 rounded-lg text-xs font-bold transition cursor-pointer"
                                      >
                                        Inspect
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

                  {/* Right Column (4 cols): Claim Inspector & Credit Note Generator */}
                  <div className="lg:col-span-4 min-w-0 space-y-4">
                    {/* Inspector Card */}
                    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-3.5">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <h3 className="font-extrabold text-sm text-slate-900">Claim Inspection Dossier</h3>
                        <span className="font-mono text-xs font-bold text-slate-400">
                          {(selectedClaim || returnClaims[0]).id}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Claimant Chemist
                        </span>
                        <span className="font-extrabold text-sm text-slate-900 block mt-0.5">
                          {(selectedClaim || returnClaims[0]).chemistName}
                        </span>
                        <span className="text-xs text-slate-500 font-mono">
                          {(selectedClaim || returnClaims[0]).chemistCity} · Filed {(selectedClaim || returnClaims[0]).createdAt}
                        </span>
                      </div>

                      <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1.5 text-xs">
                        <div className="flex justify-between font-medium">
                          <span className="text-slate-500">Formulation:</span>
                          <span className="font-bold text-slate-900">{(selectedClaim || returnClaims[0]).medicineName}</span>
                        </div>
                        <div className="flex justify-between font-medium">
                          <span className="text-slate-500">Batch Lot:</span>
                          <span className="font-mono text-slate-900">{(selectedClaim || returnClaims[0]).batchNumber}</span>
                        </div>
                        <div className="flex justify-between font-medium">
                          <span className="text-slate-500">Quantity:</span>
                          <span className="font-bold text-slate-900">{(selectedClaim || returnClaims[0]).quantity}</span>
                        </div>
                        <div className="flex justify-between font-medium">
                          <span className="text-slate-500">Claim Amount:</span>
                          <span className="font-mono font-black text-slate-900">
                            ₹{(selectedClaim || returnClaims[0]).claimValue.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      <div className="text-xs">
                        <span className="font-bold text-slate-700 block mb-1">Reason &amp; Telemetry Log:</span>
                        <p className="text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200/70 leading-relaxed text-[11px]">
                          {(selectedClaim || returnClaims[0]).reasonDetails}
                        </p>
                      </div>

                      <div className="pt-2">
                        {(selectedClaim || returnClaims[0]).status === 'PENDING' ? (
                          <div className="space-y-2">
                            <button
                              type="button"
                              onClick={() => handleApproveReturnClaim((selectedClaim || returnClaims[0]).id)}
                              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl transition shadow-xs cursor-pointer flex items-center justify-center gap-2"
                            >
                              <Check className="w-4 h-4" />
                              <span>Approve &amp; Issue Credit Note (₹{(selectedClaim || returnClaims[0]).claimValue.toFixed(2)})</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => showToast(`Claim ${(selectedClaim || returnClaims[0]).id} rejected.`)}
                              className="w-full py-2 border border-rose-200 hover:bg-rose-50 text-rose-700 font-bold text-xs rounded-xl transition cursor-pointer"
                            >
                              Reject Claim
                            </button>
                          </div>
                        ) : (
                          <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-center">
                            <CheckCircle2 className="w-5 h-5 text-purple-600 mx-auto mb-1" />
                            <span className="font-bold text-purple-950 block text-xs">
                              Credit Note #{(selectedClaim || returnClaims[0]).creditNoteNumber || 'CRN-2026-088'} Issued
                            </span>
                            <span className="text-[11px] text-purple-700 block mt-0.5">
                              Credited to chemist ledger balance.
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Reverse Logistics SOP Box */}
                    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs text-xs space-y-2">
                      <h3 className="font-extrabold text-slate-900">Regulatory Reverse Logistics Guidelines</h3>
                      <p className="text-slate-500 text-[11px] leading-relaxed">
                        Under CDSCO Schedule M compliance, cold-chain temperature excursions exceeding 8°C for &gt; 30 minutes must be quarantined immediately and replaced at zero cost to the retail chemist.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* 7. REPORTS & ANALYTICS VIEW                                               */}
            {/* ========================================================================= */}
            {activeNav === 'reports' && (
              <div className="space-y-6">
                {/* Header Card */}
                <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#1b64da] flex items-center justify-center shadow-xs">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <div>
                      <h1 className="text-lg font-black text-slate-900">
                        Wholesale Reports &amp; Business Analytics
                      </h1>
                      <p className="text-xs text-slate-400">
                        In-depth analysis of supply volume, revenue velocity, inventory turns, and category trends
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={handleDownloadGeneralAuditCsv}
                      className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Audit CSV</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="px-3.5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      Print Financial Summary
                    </button>
                  </div>
                </div>

                {/* 4 Stat Metric Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                        <Box className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-slate-500 block">Monthly Wholesale Turnover</span>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-2xl font-black font-mono text-slate-900">₹48,92,400</span>
                          <span className="text-[11px] font-bold text-emerald-600 font-mono">↑ +14.8%</span>
                        </div>
                      </div>
                    </div>
                    <span className="text-[11px] text-slate-400 mt-2 block font-medium">Bhiwandi Central Hub Sales</span>
                  </div>

                  <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#1b64da] flex items-center justify-center shrink-0">
                        <TrendingUp className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-slate-500 block">Gross Profit Margin</span>
                        <span className="text-2xl font-black font-mono text-slate-900">18.4%</span>
                      </div>
                    </div>
                    <span className="text-[11px] text-slate-400 mt-2 block font-medium">Net operating margin: 8.9%</span>
                  </div>

                  <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                        <Activity className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-slate-500 block">Inventory Turnover Ratio</span>
                        <span className="text-2xl font-black font-mono text-slate-900">4.8x</span>
                      </div>
                    </div>
                    <span className="text-[11px] text-slate-400 mt-2 block font-medium">Top decile logistics velocity</span>
                  </div>

                  <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-slate-500 block">Stockout Prevention Rate</span>
                        <span className="text-2xl font-black font-mono text-slate-900">99.2%</span>
                      </div>
                    </div>
                    <span className="text-[11px] text-slate-400 mt-2 block font-medium">AI replenishment active</span>
                  </div>
                </div>

                {/* Main 2-Column Section */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left Column (8 cols): Revenue Velocity & Product Turnover */}
                  <div className="lg:col-span-8 min-w-0 space-y-6">
                    {/* Monthly Volume Spline Chart */}
                    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="font-extrabold text-sm text-slate-900">Revenue Velocity &amp; Invoiced Volume</h3>
                          <p className="text-xs text-slate-400">Weekly B2B pharmaceutical sales velocity (October 2026)</p>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs font-bold">
                          <span className="text-[#1b64da] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            Total: ₹48,92,400
                          </span>
                        </div>
                      </div>

                      <div className="relative pt-6 pb-2">
                        <svg viewBox="0 0 400 130" className="w-full h-36 overflow-visible">
                          <defs>
                            <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#1b64da" stopOpacity="0.25" />
                              <stop offset="100%" stopColor="#1b64da" stopOpacity="0.0" />
                            </linearGradient>
                          </defs>

                          <line x1="0" y1="20" x2="400" y2="20" stroke="#f1f5f9" strokeDasharray="3 3" />
                          <line x1="0" y1="60" x2="400" y2="60" stroke="#f1f5f9" strokeDasharray="3 3" />
                          <line x1="0" y1="100" x2="400" y2="100" stroke="#f1f5f9" strokeDasharray="3 3" />

                          <path
                            d="M 20 110 Q 100 95 180 70 T 380 25 L 380 120 L 20 120 Z"
                            fill="url(#revenueGrad)"
                          />

                          <path
                            d="M 20 110 Q 100 95 180 70 T 380 25"
                            fill="none"
                            stroke="#1b64da"
                            strokeWidth="3.5"
                            strokeLinecap="round"
                          />

                          <circle cx="20" cy="110" r="4" fill="#ffffff" stroke="#1b64da" strokeWidth="2.5" />
                          <circle cx="110" cy="98" r="4" fill="#ffffff" stroke="#1b64da" strokeWidth="2.5" />
                          <circle cx="200" cy="72" r="4" fill="#ffffff" stroke="#1b64da" strokeWidth="2.5" />
                          <circle cx="290" cy="50" r="4" fill="#ffffff" stroke="#1b64da" strokeWidth="2.5" />
                          <circle cx="380" cy="25" r="5" fill="#1b64da" stroke="#ffffff" strokeWidth="2.5" />
                        </svg>

                        <div className="flex justify-between text-[11px] text-slate-400 font-mono mt-1 px-2">
                          <span>Week 1 (₹8.4L)</span>
                          <span>Week 2 (₹11.2L)</span>
                          <span>Week 3 (₹13.6L)</span>
                          <span>Week 4 (₹15.7L)</span>
                        </div>
                      </div>
                    </div>

                    {/* Top Selling Formulations Table */}
                    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs">
                      <h3 className="font-extrabold text-sm text-slate-900 mb-3">Top Performing Formulations by Margin</h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="text-slate-400 uppercase font-bold text-[10px] bg-slate-50/70 border-b border-slate-100">
                              <th className="py-2.5 px-3">Medicine Brand</th>
                              <th className="py-2.5 px-3">Category</th>
                              <th className="py-2.5 px-3 text-center">Units Sold</th>
                              <th className="py-2.5 px-3 text-right">Revenue (₹)</th>
                              <th className="py-2.5 px-3 text-right">Margin %</th>
                              <th className="py-2.5 px-3 text-center">Velocity</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {[
                              { name: 'Augmentin 625 Duo', cat: 'Antibiotics', units: 3450, rev: 603750, margin: '21.4%', vel: 'High' },
                              { name: 'Dolo 650 Tablets', cat: 'Analgesics', units: 12200, rev: 329400, margin: '18.2%', vel: 'High' },
                              { name: 'Huminsulin R 100IU', cat: 'Cold Chain', units: 1840, rev: 276000, margin: '24.0%', vel: 'Medium' },
                              { name: 'Asthalin Inhaler', cat: 'Respiratory', units: 2100, rev: 294000, margin: '19.5%', vel: 'High' },
                              { name: 'Pan 40 Tablets', cat: 'Antacids', units: 4800, rev: 585600, margin: '16.8%', vel: 'High' },
                            ].map((f, i) => (
                              <tr key={i} className="hover:bg-slate-50/70 transition">
                                <td className="py-3 px-3">
                                  <div className="flex items-center gap-2">
                                    <MedicineIcon name={f.name} />
                                    <span className="font-extrabold text-slate-900">{f.name}</span>
                                  </div>
                                </td>
                                <td className="py-3 px-3 text-slate-500 font-medium">{f.cat}</td>
                                <td className="py-3 px-3 text-center font-mono font-bold text-slate-800">{f.units.toLocaleString()}</td>
                                <td className="py-3 px-3 text-right font-mono font-extrabold text-slate-900">₹{f.rev.toLocaleString()}</td>
                                <td className="py-3 px-3 text-right font-mono font-bold text-emerald-600">{f.margin}</td>
                                <td className="py-3 px-3 text-center">
                                  <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700">
                                    {f.vel}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  {/* Right Column (4 cols): Geographic Distribution & Audit Exports */}
                  <div className="lg:col-span-4 min-w-0 space-y-4">
                    {/* Geographic Supply Distribution */}
                    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-3">
                      <h3 className="font-extrabold text-xs text-slate-900">Geographic Supply Volume</h3>
                      <div className="space-y-2.5 text-xs">
                        <div>
                          <div className="flex justify-between mb-1 font-medium">
                            <span className="flex items-center gap-1.5 font-bold text-slate-800">
                              <span className="w-2 h-2 rounded-full bg-[#1b64da]" />
                              <span>Mumbai Metropolitan</span>
                            </span>
                            <span className="font-bold font-mono">45% · ₹22.0L</span>
                          </div>
                          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-[#1b64da] rounded-full" style={{ width: '45%' }} />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between mb-1 font-medium">
                            <span className="flex items-center gap-1.5 font-bold text-slate-800">
                              <span className="w-2 h-2 rounded-full bg-blue-400" />
                              <span>Pune &amp; Pimpri</span>
                            </span>
                            <span className="font-bold font-mono">28% · ₹13.7L</span>
                          </div>
                          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-400 rounded-full" style={{ width: '28%' }} />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between mb-1 font-medium">
                            <span className="flex items-center gap-1.5 font-bold text-slate-800">
                              <span className="w-2 h-2 rounded-full bg-purple-500" />
                              <span>Thane &amp; Navi Mumbai</span>
                            </span>
                            <span className="font-bold font-mono">14% · ₹6.8L</span>
                          </div>
                          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-purple-500 rounded-full" style={{ width: '14%' }} />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between mb-1 font-medium">
                            <span className="flex items-center gap-1.5 font-bold text-slate-800">
                              <span className="w-2 h-2 rounded-full bg-amber-500" />
                              <span>Nashik</span>
                            </span>
                            <span className="font-bold font-mono">8% · ₹3.9L</span>
                          </div>
                          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-amber-500 rounded-full" style={{ width: '8%' }} />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between mb-1 font-medium">
                            <span className="flex items-center gap-1.5 font-bold text-slate-800">
                              <span className="w-2 h-2 rounded-full bg-slate-400" />
                              <span>Kolhapur &amp; Satara</span>
                            </span>
                            <span className="font-bold font-mono">5% · ₹2.4L</span>
                          </div>
                          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-slate-400 rounded-full" style={{ width: '5%' }} />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Statutory Download Center */}
                    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-2.5">
                      <h3 className="font-extrabold text-xs text-slate-900 mb-2">Statutory Compliance Downloads</h3>
                      <button
                        type="button"
                        onClick={() => showToast('GSTR-1 Monthly Invoices generated.')}
                        className="w-full p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left flex items-center justify-between transition cursor-pointer text-xs"
                      >
                        <div>
                          <span className="font-bold text-slate-900 block">GSTR-1 B2B Invoices Report</span>
                          <span className="text-[10px] text-slate-400 font-mono">Form 20/21 Tax Filings</span>
                        </div>
                        <Download className="w-4 h-4 text-slate-400" />
                      </button>

                      <button
                        type="button"
                        onClick={() => showToast('Schedule H/H1 audit log exported.')}
                        className="w-full p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left flex items-center justify-between transition cursor-pointer text-xs"
                      >
                        <div>
                          <span className="font-bold text-slate-900 block">Schedule H/H1 Dispensing Audit</span>
                          <span className="text-[10px] text-slate-400 font-mono">Antibiotics &amp; Controlled</span>
                        </div>
                        <Download className="w-4 h-4 text-slate-400" />
                      </button>

                      <button
                        type="button"
                        onClick={() => showToast('Batch Ageing & Expiry Report exported.')}
                        className="w-full p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left flex items-center justify-between transition cursor-pointer text-xs"
                      >
                        <div>
                          <span className="font-bold text-slate-900 block">Batch Lot Ageing Ledger</span>
                          <span className="text-[10px] text-slate-400 font-mono">FEFO Expiry Schedule</span>
                        </div>
                        <Download className="w-4 h-4 text-slate-400" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* 8. AI MCDM RANKING & SLA VIEW                                             */}
            {/* ========================================================================= */}
            {activeNav === 'sla' && (() => {
              // Certified state-wide wholesale distributors for MCDM ranking
              const networkDistributors = [
                {
                  id: 'dist-01',
                  name: 'MedVantage Pharma Logistics',
                  hub: 'Bhiwandi Central Pharma Hub, Unit 14-18',
                  license: 'WDL-2024-MVL-101',
                  distanceKm: 386,
                  baseRate: 48.0,
                  stockUnits: 110,
                  slaRate: 98.5,
                  leadTimeHours: 7.5,
                  coldChain: true,
                  isCurrent: true,
                },
                {
                  id: 'dist-02',
                  name: 'Apex Global Healthcare',
                  hub: 'Panvel Cold Logistics Park, Navi Mumbai',
                  license: 'WDL-2023-AGH-204',
                  distanceKm: 362,
                  baseRate: 51.5,
                  stockUnits: 95,
                  slaRate: 96.2,
                  leadTimeHours: 7.0,
                  coldChain: true,
                  isCurrent: false,
                },
                {
                  id: 'dist-03',
                  name: 'PulseLife Distribution',
                  hub: 'Hadapsar MIDC, Pune Cluster',
                  license: 'WDL-2022-PLD-308',
                  distanceKm: 235,
                  baseRate: 53.0,
                  stockUnits: 80,
                  slaRate: 94.8,
                  leadTimeHours: 4.8,
                  coldChain: false,
                  isCurrent: false,
                },
                {
                  id: 'dist-04',
                  name: 'BioPharma Cold-Chain Supply',
                  hub: 'Chakan MIDC Industrial Area, Pune',
                  license: 'WDL-2024-BPC-412',
                  distanceKm: 248,
                  baseRate: 52.0,
                  stockUnits: 65,
                  slaRate: 97.0,
                  leadTimeHours: 5.2,
                  coldChain: true,
                  isCurrent: false,
                },
                {
                  id: 'dist-05',
                  name: 'SunRise Medical Distributors',
                  hub: 'Wagle Industrial Estate, Thane West',
                  license: 'WDL-2021-SMD-519',
                  distanceKm: 395,
                  baseRate: 55.0,
                  stockUnits: 40,
                  slaRate: 91.5,
                  leadTimeHours: 8.0,
                  coldChain: false,
                  isCurrent: false,
                },
              ];

              // Normalization factors
              const totalWeights = mcdmStockWeight + mcdmPriceWeight + mcdmSlaWeight + mcdmSpeedWeight;
              const wStock = totalWeights > 0 ? mcdmStockWeight / totalWeights : 0.40;
              const wPrice = totalWeights > 0 ? mcdmPriceWeight / totalWeights : 0.25;
              const wSla = totalWeights > 0 ? mcdmSlaWeight / totalWeights : 0.20;
              const wSpeed = totalWeights > 0 ? mcdmSpeedWeight / totalWeights : 0.15;

              // Calculate live MCDM score for each supplier
              const scoredSuppliers = networkDistributors.map((d) => {
                // Stock score (normalized: 100u = 100 points, capped at 100)
                const sStock = Math.min(100, (d.stockUnits / 110) * 100);
                // Price score (cheaper is better: 48.0 = 100 points)
                const sPrice = Math.max(50, Math.min(100, (48.0 / d.baseRate) * 100));
                // SLA score
                const sSla = d.slaRate;
                // Speed score (closer/faster is better: <= 4.8h is 100 points)
                const sSpeed = Math.max(50, Math.min(100, (4.8 / d.leadTimeHours) * 100));

                const compositeScore = (wStock * sStock) + (wPrice * sPrice) + (wSla * sSla) + (wSpeed * sSpeed);

                return {
                  ...d,
                  sStock: Math.round(sStock * 10) / 10,
                  sPrice: Math.round(sPrice * 10) / 10,
                  sSla: Math.round(sSla * 10) / 10,
                  sSpeed: Math.round(sSpeed * 10) / 10,
                  compositeScore: Math.round(compositeScore * 10) / 10,
                };
              }).sort((a, b) => b.compositeScore - a.compositeScore);

              // Greedy Knapsack Split Allocation for emergency bulk orders
              let remainingToAllocate = mcdmSplitReqQty;
              const splitAllocation = scoredSuppliers.map((sup) => {
                if (remainingToAllocate <= 0) {
                  return { ...sup, allocatedUnits: 0, fulfilledPct: 0 };
                }
                const allocated = Math.min(remainingToAllocate, sup.stockUnits);
                remainingToAllocate -= allocated;
                return {
                  ...sup,
                  allocatedUnits: allocated,
                  fulfilledPct: Math.round((allocated / mcdmSplitReqQty) * 100),
                };
              });
              const totalAllocated = mcdmSplitReqQty - remainingToAllocate;
              const overallFulfilledPct = Math.round((totalAllocated / mcdmSplitReqQty) * 100);

              return (
                <div className="space-y-6">
                  {/* Header Card */}
                  <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-blue-50 text-[#1b64da] flex items-center justify-center shadow-xs">
                        <Activity className="w-6 h-6 text-[#1b64da]" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h1 className="text-lg font-black text-slate-900">
                            AI Multi-Criteria Decision-Making (MCDM) &amp; Supplier Ranking Engine
                          </h1>
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-blue-100 text-[#1b64da] uppercase tracking-wider">
                            Live Algorithmic Engine
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Multi-objective weighted vector scoring formula: <span className="font-mono font-bold text-slate-800">Score = w₁·Stock(40%) + w₂·Price(25%) + w₃·SLA(20%) + w₄·Speed(15%)</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => {
                          setMcdmStockWeight(0.40);
                          setMcdmPriceWeight(0.25);
                          setMcdmSlaWeight(0.20);
                          setMcdmSpeedWeight(0.15);
                          showToast('Weights reset to CDSCO Standard Optimization defaults.');
                        }}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Reset Defaults</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => showToast('MCDM Allocation Audit Report exported.')}
                        className="px-3.5 py-2 bg-[#1b64da] hover:bg-[#1554ba] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Export MCDM Audit (PDF)</span>
                      </button>
                    </div>
                  </div>

                  {/* MedVantage Distributor Score Spotlight */}
                  <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden">
                    <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                      <div className="lg:col-span-4 space-y-2 border-b lg:border-b-0 lg:border-r border-white/10 pb-4 lg:pb-0 lg:pr-6">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>#1 Recommended Hub Across Maharashtra</span>
                        </div>
                        <h2 className="text-2xl font-black tracking-tight">MedVantage Pharma Logistics</h2>
                        <p className="text-xs text-blue-200">
                          Primary fulfillment depot for retail pharmacy network in Kolhapur &amp; Western Maharashtra.
                        </p>
                        <div className="pt-2 flex items-baseline gap-2">
                          <span className="text-4xl font-black font-mono text-emerald-400">
                            {scoredSuppliers.find(s => s.isCurrent)?.compositeScore || 97.5}
                          </span>
                          <span className="text-sm font-bold text-blue-200">/ 100 Composite Score</span>
                        </div>
                      </div>

                      {/* 4 Normalized Sub-Criteria Breakdown */}
                      <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3.5 border border-white/10">
                          <div className="flex items-center justify-between text-xs text-blue-200 font-semibold mb-1">
                            <span>Stock Depth</span>
                            <span className="font-mono text-emerald-300 font-bold">100%</span>
                          </div>
                          <div className="text-lg font-black font-mono">110 units</div>
                          <span className="text-[10px] text-blue-300 block mt-0.5">Weight: {(wStock * 100).toFixed(0)}%</span>
                          <div className="h-1.5 bg-white/20 rounded-full overflow-hidden mt-2">
                            <div className="h-full bg-emerald-400 rounded-full" style={{ width: '100%' }} />
                          </div>
                        </div>

                        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3.5 border border-white/10">
                          <div className="flex items-center justify-between text-xs text-blue-200 font-semibold mb-1">
                            <span>Price Comp.</span>
                            <span className="font-mono text-emerald-300 font-bold">100%</span>
                          </div>
                          <div className="text-lg font-black font-mono">₹48.00</div>
                          <span className="text-[10px] text-blue-300 block mt-0.5">Weight: {(wPrice * 100).toFixed(0)}%</span>
                          <div className="h-1.5 bg-white/20 rounded-full overflow-hidden mt-2">
                            <div className="h-full bg-emerald-400 rounded-full" style={{ width: '100%' }} />
                          </div>
                        </div>

                        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3.5 border border-white/10">
                          <div className="flex items-center justify-between text-xs text-blue-200 font-semibold mb-1">
                            <span>SLA Rating</span>
                            <span className="font-mono text-emerald-300 font-bold">98.5%</span>
                          </div>
                          <div className="text-lg font-black font-mono">98.5%</div>
                          <span className="text-[10px] text-blue-300 block mt-0.5">Weight: {(wSla * 100).toFixed(0)}%</span>
                          <div className="h-1.5 bg-white/20 rounded-full overflow-hidden mt-2">
                            <div className="h-full bg-blue-400 rounded-full" style={{ width: '98.5%' }} />
                          </div>
                        </div>

                        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3.5 border border-white/10">
                          <div className="flex items-center justify-between text-xs text-blue-200 font-semibold mb-1">
                            <span>Speed &amp; Route</span>
                            <span className="font-mono text-emerald-300 font-bold">64.0%</span>
                          </div>
                          <div className="text-lg font-black font-mono">~7.5 hrs</div>
                          <span className="text-[10px] text-blue-300 block mt-0.5">Weight: {(wSpeed * 100).toFixed(0)}%</span>
                          <div className="h-1.5 bg-white/20 rounded-full overflow-hidden mt-2">
                            <div className="h-full bg-amber-400 rounded-full" style={{ width: '64%' }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Interactive MCDM Weight Tuning Simulator */}
                  <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                      <div>
                        <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                          <Sliders className="w-4 h-4 text-[#1b64da]" />
                          <span>Interactive MCDM Sensitivity &amp; Weight Tuning Simulator</span>
                        </h3>
                        <p className="text-xs text-slate-500">
                          Adjust decision criteria sliders below to test supplier ranking re-ordering in real-time for viva demonstration.
                        </p>
                      </div>
                      <div className="text-xs font-mono font-bold bg-blue-50 text-[#1b64da] px-3 py-1 rounded-xl border border-blue-200">
                        Total Normalized: {((wStock + wPrice + wSla + wSpeed) * 100).toFixed(0)}%
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* Slider 1: Stock Availability */}
                      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70 space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-slate-800">1. Stock Availability</span>
                          <span className="font-mono font-extrabold text-[#1b64da]">{Math.round(mcdmStockWeight * 100)}%</span>
                        </div>
                        <input
                          type="range"
                          min="0.05"
                          max="0.80"
                          step="0.05"
                          value={mcdmStockWeight}
                          onChange={(e) => setMcdmStockWeight(parseFloat(e.target.value))}
                          className="w-full accent-[#1b64da] cursor-pointer"
                        />
                        <span className="text-[10px] text-slate-400 block">Immediate warehouse fulfillment</span>
                      </div>

                      {/* Slider 2: Price Competitiveness */}
                      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70 space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-slate-800">2. Wholesale Price</span>
                          <span className="font-mono font-extrabold text-emerald-600">{Math.round(mcdmPriceWeight * 100)}%</span>
                        </div>
                        <input
                          type="range"
                          min="0.05"
                          max="0.80"
                          step="0.05"
                          value={mcdmPriceWeight}
                          onChange={(e) => setMcdmPriceWeight(parseFloat(e.target.value))}
                          className="w-full accent-emerald-600 cursor-pointer"
                        />
                        <span className="text-[10px] text-slate-400 block">Unit cost minimization</span>
                      </div>

                      {/* Slider 3: Historic SLA Reliability */}
                      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70 space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-slate-800">3. Historic SLA</span>
                          <span className="font-mono font-extrabold text-purple-600">{Math.round(mcdmSlaWeight * 100)}%</span>
                        </div>
                        <input
                          type="range"
                          min="0.05"
                          max="0.80"
                          step="0.05"
                          value={mcdmSlaWeight}
                          onChange={(e) => setMcdmSlaWeight(parseFloat(e.target.value))}
                          className="w-full accent-purple-600 cursor-pointer"
                        />
                        <span className="text-[10px] text-slate-400 block">CDSCO, cold-chain &amp; fill accuracy</span>
                      </div>

                      {/* Slider 4: Fulfillment Speed */}
                      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70 space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-slate-800">4. Delivery Speed</span>
                          <span className="font-mono font-extrabold text-amber-600">{Math.round(mcdmSpeedWeight * 100)}%</span>
                        </div>
                        <input
                          type="range"
                          min="0.05"
                          max="0.80"
                          step="0.05"
                          value={mcdmSpeedWeight}
                          onChange={(e) => setMcdmSpeedWeight(parseFloat(e.target.value))}
                          className="w-full accent-amber-600 cursor-pointer"
                        />
                        <span className="text-[10px] text-slate-400 block">Geographical distance &amp; ETA</span>
                      </div>
                    </div>
                  </div>

                  {/* 5-Distributor Benchmark Matrix */}
                  <div className="bg-white border border-slate-200/90 rounded-2xl shadow-2xs overflow-hidden">
                    <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h3 className="font-extrabold text-sm text-slate-900">
                          State-Wide Distributor Benchmark Comparison Matrix
                        </h3>
                        <p className="text-xs text-slate-500">
                          Rankings update dynamically according to active vector weights.
                        </p>
                      </div>
                      <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg">
                        5 Certified Wholesalers
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[11px] font-bold border-b border-slate-200">
                          <tr>
                            <th className="p-3.5">Rank</th>
                            <th className="p-3.5">Wholesale Distributor &amp; Hub</th>
                            <th className="p-3.5">Distance &amp; ETA</th>
                            <th className="p-3.5 text-right">Wholesale Rate</th>
                            <th className="p-3.5 text-right">Stock At Depot</th>
                            <th className="p-3.5 text-right">SLA Score</th>
                            <th className="p-3.5 text-right font-black text-[#1b64da]">MCDM Score</th>
                            <th className="p-3.5 text-center">Engine Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium">
                          {scoredSuppliers.map((supplier, idx) => (
                            <tr
                              key={supplier.id}
                              className={supplier.isCurrent ? 'bg-blue-50/50 hover:bg-blue-50 font-semibold' : 'hover:bg-slate-50'}
                            >
                              <td className="p-3.5">
                                <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full font-mono text-xs font-bold ${
                                  idx === 0
                                    ? 'bg-amber-100 text-amber-900 ring-2 ring-amber-400'
                                    : idx === 1
                                    ? 'bg-slate-200 text-slate-700'
                                    : 'bg-slate-100 text-slate-600'
                                }`}>
                                  #{idx + 1}
                                </span>
                              </td>
                              <td className="p-3.5">
                                <div className="flex items-center gap-2">
                                  <div>
                                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                      <span>{supplier.name}</span>
                                      {supplier.isCurrent && (
                                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-[#1b64da]">
                                          You
                                        </span>
                                      )}
                                      {supplier.coldChain && (
                                        <span title="Certified Cold-Chain Depot" className="text-blue-500">
                                          <Snowflake className="w-3.5 h-3.5 inline" />
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-[11px] text-slate-400 block font-normal">{supplier.hub}</span>
                                  </div>
                                </div>
                              </td>
                              <td className="p-3.5 font-mono">
                                <div>{supplier.distanceKm} km</div>
                                <span className="text-[10px] text-slate-400">~{supplier.leadTimeHours} hrs</span>
                              </td>
                              <td className="p-3.5 text-right font-mono font-bold text-slate-900">
                                ₹{supplier.baseRate.toFixed(2)}
                              </td>
                              <td className="p-3.5 text-right font-mono">
                                <span className={supplier.stockUnits >= 80 ? 'text-emerald-600 font-bold' : 'text-amber-600 font-bold'}>
                                  {supplier.stockUnits} units
                                </span>
                              </td>
                              <td className="p-3.5 text-right font-mono font-bold text-slate-800">
                                {supplier.slaRate}%
                              </td>
                              <td className="p-3.5 text-right font-mono font-black text-sm text-[#1b64da]">
                                {supplier.compositeScore.toFixed(1)}
                              </td>
                              <td className="p-3.5 text-center">
                                {idx === 0 ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                    <span>Primary Choice</span>
                                  </span>
                                ) : (
                                  <span className="text-[11px] text-slate-500 font-medium">
                                    Secondary Backup
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Greedy Multi-Supplier Knapsack Split Allocation Visualizer */}
                  <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                      <div>
                        <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                          <Layers className="w-4 h-4 text-purple-600" />
                          <span>Greedy Multi-Supplier Split Allocation Engine (Stockout Prevention)</span>
                        </h3>
                        <p className="text-xs text-slate-500">
                          When a chemist order exceeds a single supplier&apos;s depot capacity, MedLink algorithmically cascades the surplus to subsequent ranked wholesalers.
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-600">Simulate Order Demand:</span>
                        <div className="flex items-center gap-1">
                          {[200, 350, 500, 750].map((qty) => (
                            <button
                              key={qty}
                              type="button"
                              onClick={() => setMcdmSplitReqQty(qty)}
                              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold cursor-pointer transition ${
                                mcdmSplitReqQty === qty
                                  ? 'bg-purple-600 text-white'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              {qty}u
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Progress summary */}
                    <div className="p-3.5 bg-purple-50/60 rounded-xl border border-purple-200/70 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div>
                        <span className="font-extrabold text-purple-950 block">
                          Total Allocated: {totalAllocated} / {mcdmSplitReqQty} units ({overallFulfilledPct}% fulfilled)
                        </span>
                        <span className="text-[11px] text-purple-700">
                          {remainingToAllocate > 0
                            ? `Surplus backlog: ${remainingToAllocate} units routed to manufacturer PO queue`
                            : '100% Demand satisfied across certified distributor cluster'}
                        </span>
                      </div>
                      <div className="w-48 h-3 bg-purple-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-purple-600 rounded-full transition-all duration-300"
                          style={{ width: `${overallFulfilledPct}%` }}
                        />
                      </div>
                    </div>

                    {/* Stepper breakdown */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                      {splitAllocation.map((item, i) => (
                        <div
                          key={item.id}
                          className={`p-3 rounded-xl border transition ${
                            item.allocatedUnits > 0
                              ? 'bg-white border-purple-300 shadow-2xs'
                              : 'bg-slate-50 border-slate-200 opacity-60'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[11px] font-mono font-bold text-slate-400">Step {i + 1}</span>
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-purple-100 text-purple-800">
                              Score: {item.compositeScore}
                            </span>
                          </div>
                          <span className="font-bold text-xs text-slate-900 block truncate" title={item.name}>
                            {item.name}
                          </span>
                          <span className="text-[10px] text-slate-400 block">Depot Stock: {item.stockUnits}u</span>
                          <div className="mt-2 pt-2 border-t border-slate-100 flex items-baseline justify-between">
                            <span className="text-xs text-slate-500 font-semibold">Allocated:</span>
                            <span className="font-mono font-extrabold text-sm text-purple-700">
                              {item.allocatedUnits} u
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Regulatory & CDSCO Compliance Standards */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs space-y-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        <span>CDSCO Form 20-B &amp; 21-B</span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        License WDL-2024-MVL-101 verified and renewed through 2029 under Schedule H/H1 monitoring standards.
                      </p>
                    </div>

                    <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs space-y-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                        <Snowflake className="w-4 h-4 text-blue-600" />
                        <span>WHO-GDP Refrigerated Cold-Chain</span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Calibrated 2°C–8°C digital data loggers stamped on every temperature-sensitive consignment note.
                      </p>
                    </div>

                    <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs space-y-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                        <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                        <span>Retail Chemist SLA Rating</span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        4.9/5.0 aggregate rating across 148 verified community pharmacists in Western Maharashtra.
                      </p>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* ========================================================================= */}
            {/* CHEMIST INDENTS & SPECIAL SOURCING REQUESTS                               */}
            {/* ========================================================================= */}
            {activeNav === 'indents' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* Header Card */}
                <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#1b64da] flex items-center justify-center shadow-xs">
                      <ShoppingBag className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-slate-900 leading-tight">
                        Chemist Indents &amp; Special Sourcing Book
                      </h2>
                      <p className="text-xs text-slate-500">
                        Procurement demand tickets submitted by retail pharmacists for out-of-stock, unlisted, or specialty medicines.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fetchIndentRequests()}
                      className="px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${loadingIndents ? 'animate-spin' : ''}`} />
                      <span>Sync Indents</span>
                    </button>
                  </div>
                </div>

                {/* 4 Stat Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Total Indents</span>
                    <span className="text-2xl font-black text-slate-900 font-mono">{indentRequests.length}</span>
                    <span className="text-[11px] text-slate-500 block mt-0.5">Across MMR Retail Network</span>
                  </div>

                  <div className="bg-amber-50/50 border border-amber-200/80 rounded-2xl p-4 shadow-2xs">
                    <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block mb-1">Pending Review</span>
                    <span className="text-2xl font-black text-amber-800 font-mono">
                      {indentRequests.filter((r) => r.status === 'PENDING').length}
                    </span>
                    <span className="text-[11px] text-amber-600 block mt-0.5">Awaiting Wholesaler Decision</span>
                  </div>

                  <div className="bg-blue-50/50 border border-blue-200/80 rounded-2xl p-4 shadow-2xs">
                    <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block mb-1">In Sourcing</span>
                    <span className="text-2xl font-black text-blue-800 font-mono">
                      {indentRequests.filter((r) => r.status === 'ACCEPTED').length}
                    </span>
                    <span className="text-[11px] text-blue-600 block mt-0.5">Manufacturer Inward Ordered</span>
                  </div>

                  <div className="bg-emerald-50/50 border border-emerald-200/80 rounded-2xl p-4 shadow-2xs">
                    <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block mb-1">Available for PO</span>
                    <span className="text-2xl font-black text-emerald-800 font-mono">
                      {indentRequests.filter((r) => r.status === 'AVAILABLE').length}
                    </span>
                    <span className="text-[11px] text-emerald-600 block mt-0.5">Stock Inwarded to Depot</span>
                  </div>
                </div>

                {/* Indents List Table / Cards */}
                <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="font-extrabold text-sm text-slate-900">Incoming Retail Pharmacy Indent Requests</h3>
                    <span className="text-xs font-mono text-slate-400">
                      Auto-sync active every 8s
                    </span>
                  </div>

                  {loadingIndents && indentRequests.length === 0 ? (
                    <div className="py-12 text-center text-xs text-slate-400">Loading incoming chemist indents...</div>
                  ) : indentRequests.length === 0 ? (
                    <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                      <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                      <p className="text-sm font-bold text-slate-700">No Chemist Indents Pending</p>
                      <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                        When retail community chemists raise sourcing requests for out-of-stock medicines, they will appear here for you to accept and allocate stock.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {indentRequests.map((req) => {
                        const isPending = req.status === 'PENDING';
                        const isAccepted = req.status === 'ACCEPTED';
                        const isAvailable = req.status === 'AVAILABLE';
                        const isRejected = req.status === 'REJECTED';

                        return (
                          <div
                            key={req.id}
                            className={`border rounded-2xl p-4 transition flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                              req.urgency === 'CRITICAL'
                                ? 'bg-rose-50/20 border-rose-200 ring-1 ring-rose-200/60'
                                : 'bg-white border-slate-200/90 hover:border-slate-300 shadow-2xs'
                            }`}
                          >
                            <div className="space-y-1.5 flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-[10px] font-mono font-bold text-slate-400">#{req.id}</span>
                                <h4 className="font-extrabold text-sm text-slate-900">{req.medicineName || req.medicine_name}</h4>
                                {(req.genericName || req.generic_name) && (
                                  <span className="text-xs text-slate-500 italic">({req.genericName || req.generic_name})</span>
                                )}
                                <span
                                  className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                    req.urgency === 'CRITICAL'
                                      ? 'bg-rose-100 text-rose-800'
                                      : req.urgency === 'URGENT'
                                      ? 'bg-amber-100 text-amber-800'
                                      : 'bg-blue-100 text-blue-800'
                                  }`}
                                >
                                  {req.urgency} PRIORITY
                                </span>
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                    isAvailable
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                      : isAccepted
                                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                                      : isRejected
                                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                                      : 'bg-amber-50 text-amber-700 border-amber-200'
                                  }`}
                                >
                                  {req.status}
                                </span>
                              </div>

                              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                                <span>Dosage: <strong>{req.dosageForm || req.dosage_form || 'TABLET'}</strong> ({req.strength || 'Standard'})</span>
                                <span>Quantity: <strong className="font-mono text-slate-900">{req.quantityNeeded || req.required_qty || req.requiredQty} units</strong></span>
                                <span>Target Store: <strong className="text-slate-800">{req.storeName || req.store_name || 'Apollo Care Pharmacy'}</strong></span>
                                <span>City/Location: <strong className="text-slate-700">{req.storeCity || req.store_city || 'Mumbai'}</strong></span>
                              </div>

                              {req.notes && (
                                <p className="text-[11px] text-slate-500 italic bg-slate-50 p-2 rounded-lg border border-slate-100 max-w-xl">
                                  &quot;{req.notes}&quot;
                                </p>
                              )}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-wrap items-center gap-2 shrink-0">
                              {isPending && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateIndentStatus(req.id, 'ACCEPTED')}
                                    className="px-3.5 py-1.5 bg-[#1b64da] hover:bg-[#1554ba] text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs flex items-center gap-1"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    <span>Accept &amp; Source</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleUpdateIndentStatus(req.id, 'AVAILABLE')}
                                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs flex items-center gap-1"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>Inward Stock Now</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleUpdateIndentStatus(req.id, 'REJECTED')}
                                    className="px-3.5 py-1.5 border border-rose-200 hover:bg-rose-50 text-rose-700 rounded-xl text-xs font-bold transition cursor-pointer"
                                  >
                                    Decline
                                  </button>
                                </>
                              )}

                              {isAccepted && (
                                <button
                                  type="button"
                                  onClick={() => handleUpdateIndentStatus(req.id, 'AVAILABLE')}
                                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs flex items-center gap-1.5"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Mark Stock Available in Catalogue</span>
                                </button>
                              )}

                              {isAvailable && (
                                <span className="px-3.5 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1.5">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>Active in Wholesale Catalogue</span>
                                </span>
                              )}

                              {isRejected && (
                                <span className="px-3.5 py-1.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold">
                                  Declined
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* 9. WHOLESALE DISTRIBUTOR SETTINGS VIEW                                    */}
            {/* ========================================================================= */}
            {activeNav === 'settings' && (
              <div className="space-y-6 animate-in fade-in duration-200 max-w-5xl">
                {/* Header Card */}
                <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#1b64da] flex items-center justify-center shadow-xs">
                      <Settings className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-slate-900 leading-tight">
                        Wholesale Depot &amp; WMS Logistics Settings
                      </h2>
                      <p className="text-xs text-slate-500">
                        Configure warehouse bin slots, CDSCO Form 20B/21B drug licenses, IoT cold-chain rules, and courier dispatch automation.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      showToast('Wholesale Logistics Depot Settings saved successfully!');
                    }}
                    className="px-4 py-2 bg-[#1b64da] hover:bg-[#1554ba] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Save All Changes</span>
                  </button>
                </div>

                {/* Form Sections */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Card 1: Warehouse & Depot Profile */}
                  <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-4">
                    <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                      <Truck className="w-4 h-4 text-[#1b64da]" />
                      <h3 className="font-extrabold text-sm text-slate-900">
                        C&amp;F Logistics Hub Identification
                      </h3>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Distributor Organization Name
                      </label>
                      <input
                        type="text"
                        value={distributorSettings.name}
                        onChange={(e) => setDistributorSettings({ ...distributorSettings, name: e.target.value })}
                        className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#1b64da]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Operations Head / Manager
                        </label>
                        <input
                          type="text"
                          value={distributorSettings.contactPerson}
                          onChange={(e) => setDistributorSettings({ ...distributorSettings, contactPerson: e.target.value })}
                          className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#1b64da]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Emergency Dispatch Phone
                        </label>
                        <input
                          type="text"
                          value={distributorSettings.phone}
                          onChange={(e) => setDistributorSettings({ ...distributorSettings, phone: e.target.value })}
                          className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#1b64da]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Central Depot Physical Address
                      </label>
                      <input
                        type="text"
                        value={distributorSettings.warehouseAddress}
                        onChange={(e) => setDistributorSettings({ ...distributorSettings, warehouseAddress: e.target.value })}
                        className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#1b64da]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Logistics Hub Pincode
                        </label>
                        <input
                          type="text"
                          value={distributorSettings.pincode}
                          onChange={(e) => setDistributorSettings({ ...distributorSettings, pincode: e.target.value })}
                          className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#1b64da]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          GSTIN Tax Identification
                        </label>
                        <input
                          type="text"
                          value={distributorSettings.gstin}
                          onChange={(e) => setDistributorSettings({ ...distributorSettings, gstin: e.target.value })}
                          className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#1b64da]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Card 2: CDSCO Statutory Licensing & Form 20B/21B */}
                  <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-4">
                    <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                      <ShieldCheck className="w-4 h-4 text-[#00875a]" />
                      <h3 className="font-extrabold text-sm text-slate-900">
                        CDSCO Wholesale Drug Licenses
                      </h3>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Form 20B Wholesale Drug License (General &amp; Scheduled)
                      </label>
                      <input
                        type="text"
                        value={distributorSettings.dlNumber20b}
                        onChange={(e) => setDistributorSettings({ ...distributorSettings, dlNumber20b: e.target.value })}
                        className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#00875a]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Form 21B Wholesale License (Biologicals &amp; Vaccines)
                      </label>
                      <input
                        type="text"
                        value={distributorSettings.dlNumber21b}
                        onChange={(e) => setDistributorSettings({ ...distributorSettings, dlNumber21b: e.target.value })}
                        className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#00875a]"
                      />
                    </div>

                    <div className="p-3 bg-emerald-50/60 border border-emerald-200/80 rounded-xl text-xs">
                      <div className="flex items-center gap-2 text-emerald-800 font-extrabold mb-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Regulatory Verification Verified</span>
                      </div>
                      <p className="text-[11px] text-slate-600">
                        License status active under Maharashtra FDA (CDSCO Western Zone). Form 20B / Form 21B validated for statewide wholesale distribution through 31 Dec 2029.
                      </p>
                    </div>
                  </div>

                  {/* Card 3: Cold Chain IoT Telemetry Calibration */}
                  <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-4">
                    <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                      <Activity className="w-4 h-4 text-cyan-600" />
                      <h3 className="font-extrabold text-sm text-slate-900">
                        Cold-Chain IoT Sensor Rules (2°C – 8°C)
                      </h3>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Min Temp (°C)
                        </label>
                        <input
                          type="text"
                          value={distributorSettings.coldChainMinTemp}
                          onChange={(e) => setDistributorSettings({ ...distributorSettings, coldChainMinTemp: e.target.value })}
                          className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Target Temp (°C)
                        </label>
                        <input
                          type="text"
                          value={distributorSettings.targetTemp}
                          onChange={(e) => setDistributorSettings({ ...distributorSettings, targetTemp: e.target.value })}
                          className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-mono font-bold text-emerald-600"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Max Temp (°C)
                        </label>
                        <input
                          type="text"
                          value={distributorSettings.coldChainMaxTemp}
                          onChange={(e) => setDistributorSettings({ ...distributorSettings, coldChainMaxTemp: e.target.value })}
                          className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Sensor Telemetry Log Frequency (Seconds)
                      </label>
                      <input
                        type="text"
                        value={distributorSettings.telemetryIntervalSeconds}
                        onChange={(e) => setDistributorSettings({ ...distributorSettings, telemetryIntervalSeconds: e.target.value })}
                        className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900"
                      />
                    </div>
                  </div>

                  {/* Card 4: Dispatch & Commercial Rules */}
                  <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-4">
                    <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                      <Layers className="w-4 h-4 text-purple-600" />
                      <h3 className="font-extrabold text-sm text-slate-900">
                        Dispatch &amp; Commercial Workflow
                      </h3>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Preferred Courier &amp; Fleet Logistics
                      </label>
                      <input
                        type="text"
                        value={distributorSettings.preferredCourier}
                        onChange={(e) => setDistributorSettings({ ...distributorSettings, preferredCourier: e.target.value })}
                        className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Minimum Order Cartons
                        </label>
                        <input
                          type="text"
                          value={distributorSettings.minCartonThreshold}
                          onChange={(e) => setDistributorSettings({ ...distributorSettings, minCartonThreshold: e.target.value })}
                          className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Default Credit Terms (Days)
                        </label>
                        <input
                          type="text"
                          value={distributorSettings.paymentTermsDays}
                          onChange={(e) => setDistributorSettings({ ...distributorSettings, paymentTermsDays: e.target.value })}
                          className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: CONSIGNMENT DISPATCH MODAL                                       */}
      {/* ========================================================================= */}
      {dispatchingOrder && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4"
          onClick={() => {
            if (!isDispatching) setDispatchingOrder(null);
          }}
        >
          <div
            className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-md w-full p-6 text-xs"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                  Consignment Packaging & Dispatch
                </span>
                <h3 className="text-base font-extrabold text-slate-900 mt-0.5">
                  Order #{dispatchingOrder.orderNumber}
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Buyer: <span className="font-bold text-slate-900">{dispatchingOrder.medicalStoreName}</span> ({dispatchingOrder.medicalStoreCity})
                </p>
              </div>
              <button
                disabled={isDispatching}
                onClick={() => setDispatchingOrder(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 mb-6">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Courier Logistics Partner
                </label>
                <select
                  disabled={isDispatching}
                  value={courierName}
                  onChange={(e) => setCourierName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-[#1b64da]"
                >
                  <option value="Blue Dart Medical Express">Blue Dart Medical Express</option>
                  <option value="Delhivery Cold-Chain Logistics">Delhivery Cold-Chain Logistics</option>
                  <option value="SpeedPost Pharmaceutical Air Cargo">SpeedPost Pharmaceutical Air Cargo</option>
                  <option value="Direct MedLink Fleet Van">Direct MedLink Fleet Van</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  AWB Tracking Consignment ID
                </label>
                <input
                  type="text"
                  disabled={isDispatching}
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-900 font-mono font-bold text-xs bg-slate-50 focus:outline-none focus:ring-1 focus:ring-[#1b64da]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Delivery Timeframe Commitment
                </label>
                <input
                  type="text"
                  disabled={isDispatching}
                  value={estimatedDelivery}
                  onChange={(e) => setEstimatedDelivery(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-[#1b64da]"
                />
              </div>
            </div>

            <div className="flex gap-2.5">
              <button
                type="button"
                disabled={isDispatching}
                onClick={() => setDispatchingOrder(null)}
                className="flex-1 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDispatching}
                onClick={handleConfirmDispatch}
                className="flex-1 py-2.5 bg-[#1b64da] hover:bg-[#1554ba] disabled:bg-slate-400 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                {isDispatching ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>Dispatching...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Confirm Dispatch</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: INWARD MEDICINE MODAL (TYPEAHEAD SEARCH + CSV IMPORT)            */}
      {/* ========================================================================= */}
      {addBatchModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-2xl w-full p-6 text-xs max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Inward Pharmaceutical Stock
                </h3>
                <p className="text-slate-500">
                  Register new batches or bulk import inventory into warehouse database
                </p>
              </div>
              <button
                onClick={() => {
                  setAddBatchModalOpen(false);
                  setIsSearchOpen(false);
                }}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Ingestion Mode Switcher */}
            <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3 mb-4">
              <button
                type="button"
                onClick={() => setInwardMode('MANUAL')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  inwardMode === 'MANUAL'
                    ? 'bg-[#1b64da] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                <span>Single Lot Inward (Catalogue Search)</span>
              </button>

              <button
                type="button"
                onClick={() => setInwardMode('NEW_MEDICINE')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  inwardMode === 'NEW_MEDICINE'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Brand New Formulation</span>
              </button>

              <button
                type="button"
                onClick={() => setInwardMode('CSV_UPLOAD')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  inwardMode === 'CSV_UPLOAD'
                    ? 'bg-[#1b64da] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Bulk CSV / Excel Upload</span>
              </button>
            </div>

            {/* MANUAL MODE */}
            {inwardMode === 'MANUAL' && (
              <form onSubmit={handleAddBatch} className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="font-bold text-slate-800">
                      Search & Select Formulation from Master Catalogue
                    </label>
                    <span className="text-[11px] text-slate-400">
                      {medicines.length} verified products available
                    </span>
                  </div>

                  {selectedMedicineObj && !isSearchOpen ? (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                      <div className="flex items-start gap-2.5">
                        <MedicineIcon name={selectedMedicineObj.brandName} />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-slate-900 text-xs">
                              {selectedMedicineObj.brandName}
                            </span>
                            <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded font-mono">
                              {selectedMedicineObj.dosageForm}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 mt-0.5">
                            {selectedMedicineObj.genericName} · {selectedMedicineObj.strength}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setIsSearchOpen(true);
                          setMedSearchQuery('');
                        }}
                        className="px-2.5 py-1 text-xs border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg font-bold transition"
                      >
                        Change
                      </button>
                    </div>
                  ) : (
                    <div className="relative">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        autoFocus
                        value={medSearchQuery}
                        onChange={(e) => {
                          setMedSearchQuery(e.target.value);
                          setIsSearchOpen(true);
                        }}
                        onFocus={() => setIsSearchOpen(true)}
                        placeholder="Type brand name (e.g. Augmentin, Dolo), generic salt, or manufacturer..."
                        className="w-full pl-9 pr-8 py-2 border border-slate-300 rounded-xl text-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-[#1b64da]"
                      />

                      {isSearchOpen && (
                        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto divide-y divide-slate-100">
                          {(() => {
                            const filtered = medicines.filter((m) => {
                              if (!medSearchQuery.trim()) return true;
                              const q = medSearchQuery.toLowerCase();
                              return (
                                m.brandName?.toLowerCase().includes(q) ||
                                m.genericName?.toLowerCase().includes(q) ||
                                m.manufacturer?.toLowerCase().includes(q) ||
                                (m as any).category?.toLowerCase().includes(q)
                              );
                            });

                            if (filtered.length === 0) {
                              return (
                                <div className="p-4 text-center">
                                  <p className="text-slate-500 text-xs mb-2">No existing catalogue formulation found for &quot;{medSearchQuery}&quot;</p>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setNewBrandName(medSearchQuery);
                                      setInwardMode('NEW_MEDICINE');
                                      setIsSearchOpen(false);
                                    }}
                                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>+ Add &quot;{medSearchQuery}&quot; as New Formulation</span>
                                  </button>
                                </div>
                              );
                            }

                            return (
                              <>
                                {filtered.slice(0, 15).map((m) => (
                                  <button
                                    key={m.id}
                                    type="button"
                                    onClick={() => handleSelectMedicine(m)}
                                    className="w-full text-left p-2.5 hover:bg-slate-50 transition flex items-center justify-between text-xs cursor-pointer"
                                  >
                                    <div>
                                      <span className="font-extrabold text-slate-900 block">{m.brandName}</span>
                                      <span className="text-[11px] text-slate-500">{m.genericName} · {m.strength}</span>
                                    </div>
                                    <span className="font-mono font-bold text-slate-800">₹{(m.basePrice * 1.25).toFixed(0)}</span>
                                  </button>
                                ))}
                                <div className="p-2 bg-slate-50 text-center border-t border-slate-100">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setNewBrandName(medSearchQuery);
                                      setInwardMode('NEW_MEDICINE');
                                      setIsSearchOpen(false);
                                    }}
                                    className="text-xs text-emerald-700 font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
                                  >
                                    <Plus className="w-3 h-3" />
                                    <span>Formulation not listed? Click here to register a new medicine</span>
                                  </button>
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Batch Number</label>
                    <input
                      type="text"
                      required
                      value={batchNumber}
                      onChange={(e) => setBatchNumber(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Expiry Date</label>
                    <input
                      type="date"
                      required
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Inward Quantity</label>
                    <input
                      type="number"
                      required
                      value={onHandQty}
                      onChange={(e) => setOnHandQty(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-900 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Selling Price (₹)</label>
                    <input
                      type="number"
                      required
                      value={sellingPrice}
                      onChange={(e) => setSellingPrice(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-900 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Retail MRP (₹)</label>
                    <input
                      type="number"
                      required
                      value={mrp}
                      onChange={(e) => setMrp(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-900 font-bold"
                    />
                  </div>
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setAddBatchModalOpen(false)}
                    className="flex-1 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-bold transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-[#1b64da] hover:bg-[#1554ba] text-white rounded-xl font-bold transition shadow-xs cursor-pointer"
                  >
                    Register Batch Lot
                  </button>
                </div>
              </form>
            )}

            {/* NEW MEDICINE FORMULATION MODE */}
            {inwardMode === 'NEW_MEDICINE' && (
              <form onSubmit={handleAddNewMedicineAndBatch} className="space-y-4">
                <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <span className="font-bold text-emerald-950 block">Register Brand New Formulation</span>
                      <span className="text-[11px] text-emerald-700">Creates new master catalogue item and immediately inwards initial batch lot.</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Brand Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Pan 40 / Telma 40 / Calpol 500"
                      value={newBrandName}
                      onChange={(e) => setNewBrandName(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Generic Salt / Molecule Composition <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Pantoprazole Sodium 40mg"
                      value={newGenericName}
                      onChange={(e) => setNewGenericName(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Therapeutic Category</label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 bg-white"
                    >
                      <option value="Antibiotics">Antibiotics & Anti-infectives</option>
                      <option value="Antihypertensives">Cardiovascular & Antihypertensives</option>
                      <option value="Antidiabetic">Antidiabetic & Endocrine</option>
                      <option value="Analgesics">Analgesics, Antipyretic & NSAIDs</option>
                      <option value="Gastrointestinal">Gastrointestinal & Antacids</option>
                      <option value="Respiratory">Respiratory, Inhalers & Antiasthmatics</option>
                      <option value="Dermatology">Dermatology & Topicals</option>
                      <option value="Neurology">Neurology & Psychiatric</option>
                      <option value="Vitamins & Minerals">Vitamins, Minerals & Supplements</option>
                      <option value="Critical Care">Critical Care & Oncology</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Dosage Form</label>
                    <select
                      value={newDosageForm}
                      onChange={(e) => setNewDosageForm(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 bg-white"
                    >
                      <option value="TABLET">TABLET</option>
                      <option value="CAPSULE">CAPSULE</option>
                      <option value="SYRUP">SYRUP / SUSPENSION</option>
                      <option value="INJECTION">INJECTION / VIAL</option>
                      <option value="INHALER">INHALER / RESPULES</option>
                      <option value="OINTMENT">OINTMENT / GEL</option>
                      <option value="DROPS">EYE / EAR DROPS</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Strength / Concentration</label>
                    <input
                      type="text"
                      placeholder="e.g. 500 mg, 625 mg, 100 mcg"
                      value={newStrength}
                      onChange={(e) => setNewStrength(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Packaging Specification</label>
                    <input
                      type="text"
                      placeholder="e.g. 10 Tablets Strip, 100ml Bottle"
                      value={newPackSize}
                      onChange={(e) => setNewPackSize(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Manufacturer Pharma Company</label>
                    <input
                      type="text"
                      placeholder="e.g. Sun Pharma Ltd / Cipla Ltd"
                      value={newManufacturer}
                      onChange={(e) => setNewManufacturer(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Storage Condition</label>
                    <select
                      value={newStorageCondition}
                      onChange={(e) => setNewStorageCondition(e.target.value as any)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 bg-white"
                    >
                      <option value="ROOM_TEMPERATURE">Controlled Room Temp (20°C - 25°C)</option>
                      <option value="REFRIGERATED_COLD_CHAIN">Cold-Chain Refrigerated (2°C - 8°C)</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                    Pricing & Initial Batch Details
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">MRP ₹ (Max Retail Price)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={newMrp}
                        onChange={(e) => setNewMrp(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Wholesale Selling Rate ₹</label>
                      <input
                        type="number"
                        step="0.01"
                        value={newSellingPrice}
                        onChange={(e) => setNewSellingPrice(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Unit Cost ₹ (Landing Cost)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={newUnitCost}
                        onChange={(e) => setNewUnitCost(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Batch Number</label>
                      <input
                        type="text"
                        placeholder="Auto if empty"
                        value={newBatchNumber}
                        onChange={(e) => setNewBatchNumber(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Expiry Date</label>
                      <input
                        type="date"
                        value={newExpiryDate}
                        onChange={(e) => setNewExpiryDate(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Inward Qty (Units)</label>
                      <input
                        type="number"
                        min="1"
                        value={newOnHandQty}
                        onChange={(e) => setNewOnHandQty(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Min Threshold</label>
                      <input
                        type="number"
                        min="1"
                        value={newMinThreshold}
                        onChange={(e) => setNewMinThreshold(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setAddBatchModalOpen(false)}
                    className="flex-1 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-bold transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingNewMed}
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition shadow-xs cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSubmittingNewMed ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Registering Formulation...</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        <span>Save Formulation & Inward Batch</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* CSV UPLOAD MODE */}
            {inwardMode === 'CSV_UPLOAD' && (
              <div className="space-y-4">
                <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="font-extrabold text-blue-950 block">Standardized Distributor Inward CSV</span>
                    <span className="text-[11px] text-blue-700">Download formatted template or load verified sample records.</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleDownloadCsvTemplate}
                      className="px-3 py-1.5 bg-white border border-blue-200 text-blue-800 rounded-lg font-bold hover:bg-blue-50 transition flex items-center gap-1"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Template</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleLoadDemoCsv}
                      className="px-3 py-1.5 bg-[#1b64da] text-white rounded-lg font-bold hover:bg-[#1554ba] transition flex items-center gap-1"
                    >
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>Load 3 Demo Batches</span>
                    </button>
                  </div>
                </div>

                {csvPreviewRows.length > 0 && (
                  <div className="space-y-3">
                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-slate-50 font-bold text-slate-500">
                          <tr>
                            <th className="py-2 px-3">Brand Name</th>
                            <th className="py-2 px-3">Batch Number</th>
                            <th className="py-2 px-3 text-right">Qty</th>
                            <th className="py-2 px-3 text-right">Price</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {csvPreviewRows.map((r, i) => (
                            <tr key={i}>
                              <td className="py-2 px-3 font-bold">{r.brandName}</td>
                              <td className="py-2 px-3 font-mono">{r.batchNumber}</td>
                              <td className="py-2 px-3 text-right font-mono font-bold">{r.onHandQuantity}</td>
                              <td className="py-2 px-3 text-right font-mono">₹{r.sellingPrice}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        showToast('Imported 3 sample lots into warehouse inventory.');
                        setAddBatchModalOpen(false);
                        setCsvPreviewRows([]);
                      }}
                      className="w-full py-2.5 bg-[#1b64da] hover:bg-[#1554ba] text-white font-extrabold rounded-xl shadow-xs cursor-pointer"
                    >
                      Commit Import to Database
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: STOCK ADJUSTMENT MODAL                                           */}
      {/* ========================================================================= */}
      {adjustModalBatch && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-md w-full p-6 text-xs">
            <h3 className="text-base font-extrabold text-slate-900 mb-1">
              Adjust Stock Count
            </h3>
            <p className="text-slate-500 mb-4">
              Lot: <span className="font-mono font-bold text-slate-800">{adjustModalBatch.batchNumber}</span> ({adjustModalBatch.brandName})
            </p>

            <form onSubmit={handleStockAdjust} className="space-y-4">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Quantity Adjustment (+ or -)</label>
                <input
                  type="number"
                  required
                  value={adjustmentQty}
                  onChange={(e) => setAdjustmentQty(e.target.value)}
                  placeholder="+25 or -10"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-slate-900 font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Adjustment Reason / Notes</label>
                <input
                  type="text"
                  required
                  value={adjustNotes}
                  onChange={(e) => setAdjustNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-900"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAdjustModalBatch(null)}
                  className="flex-1 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#1b64da] hover:bg-[#1554ba] text-white rounded-xl font-bold transition shadow-xs cursor-pointer"
                >
                  Update Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: INVOICE BREAKDOWN MODAL                                          */}
      {/* ========================================================================= */}
      {invoiceModalOrder && (
        <WholesaleInvoiceModal
          order={invoiceModalOrder}
          invoiceData={invoiceData}
          onClose={() => {
            setInvoiceModalOrder(null);
            setInvoiceData(null);
          }}
        />
      )}

      {/* ========================================================================= */}
      {/* MODAL: LIVE GPS FLEET & COLD-CHAIN TELEMETRY TRACKER                      */}
      {/* ========================================================================= */}
      {liveTrackingModalOrder && (
        <LiveFleetTrackingModal
          order={liveTrackingModalOrder}
          onClose={() => setLiveTrackingModalOrder(null)}
        />
      )}

      {/* ========================================================================= */}
      {/* MODAL: CDSCO CERTIFICATE OF ANALYSIS (COA) QUALITY REPORT                 */}
      {/* ========================================================================= */}
      {viewingCoAModal && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4"
          onClick={() => setViewingCoAModal(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold shadow-xs">
                  <ShieldCheck className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                    CDSCO Form 20B Quality Record
                  </span>
                  <h3 className="text-base font-extrabold text-slate-900 leading-tight">
                    Certificate of Analysis (CoA)
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingCoAModal(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Certificate Details */}
            <div className="my-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 font-mono">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Drug Formulation</span>
                  <span className="font-extrabold text-slate-900">{viewingCoAModal.brandName}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Batch Serial</span>
                  <span className="font-extrabold text-blue-700">{viewingCoAModal.batchNumber}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Salt Composition</span>
                  <span className="text-slate-700">{viewingCoAModal.genericName}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Expiry Date</span>
                  <span className="text-slate-700">{viewingCoAModal.expiryDate}</span>
                </div>
              </div>

              {/* Lab Test Results Table */}
              <div className="border border-slate-100 rounded-2xl overflow-hidden font-mono text-[11px]">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-400 uppercase text-[10px] font-bold">
                    <tr>
                      <th className="py-2 px-3">Test Parameter</th>
                      <th className="py-2 px-3">Pharmacopoeia Spec (IP/USP)</th>
                      <th className="py-2 px-3 text-right">Batch Observed Result</th>
                      <th className="py-2 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="py-2 px-3 font-semibold text-slate-800">Active Assay (Potency)</td>
                      <td className="py-2 px-3 text-slate-500">95.0% - 105.0%</td>
                      <td className="py-2 px-3 text-right font-extrabold text-emerald-700">99.4%</td>
                      <td className="py-2 px-3 text-center text-emerald-600 font-bold">PASS ✓</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-semibold text-slate-800">Dissolution Rate</td>
                      <td className="py-2 px-3 text-slate-500">&gt; 80% in 30 mins</td>
                      <td className="py-2 px-3 text-right font-extrabold text-emerald-700">94.2% in 20 min</td>
                      <td className="py-2 px-3 text-center text-emerald-600 font-bold">PASS ✓</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-semibold text-slate-800">Sterility &amp; Bioburden</td>
                      <td className="py-2 px-3 text-slate-500">Nil Microbial Growth</td>
                      <td className="py-2 px-3 text-right font-extrabold text-emerald-700">No Growth Detected</td>
                      <td className="py-2 px-3 text-center text-emerald-600 font-bold">PASS ✓</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-semibold text-slate-800">Storage Temp Stability</td>
                      <td className="py-2 px-3 text-slate-500">2°C – 8°C (Cold-Chain)</td>
                      <td className="py-2 px-3 text-right font-extrabold text-blue-700">4.2°C Continuous Log</td>
                      <td className="py-2 px-3 text-center text-blue-600 font-bold">COMPLIANT</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200/90 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="font-extrabold text-emerald-900 block text-xs">
                    Certified by Chief Analytical Chemist
                  </span>
                  <span className="text-[11px] text-emerald-700 font-mono">
                    NABL Accreditation #NABL-TC-8891 · MedVantage Quality Lab, Bhiwandi
                  </span>
                </div>
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setViewingCoAModal(null)}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 bg-[#1b64da] hover:bg-[#1554ba] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Official CoA PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: 1-CLICK MANUFACTURER REPLENISHMENT INDENT PO                       */}
      {/* ========================================================================= */}
      {reorderManufacturerModal && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4"
          onClick={() => setReorderManufacturerModal(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold shadow-xs">
                  <Box className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                    Direct Manufacturer Procurement
                  </span>
                  <h3 className="text-base font-extrabold text-slate-900 leading-tight">
                    Issue Restock Indent PO
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReorderManufacturerModal(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setIsSubmittingManufacturerPO(true);
                setTimeout(() => {
                  setIsSubmittingManufacturerPO(false);
                  showToast(
                    `Indent PO #${Math.floor(100000 + Math.random() * 900000)} for ${reorderUnits} units dispatched to Manufacturer!`
                  );
                  setReorderManufacturerModal(null);
                }, 800);
              }}
              className="my-4 space-y-3.5 text-xs"
            >
              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl font-mono">
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Selected Drug Formulation</span>
                <span className="font-extrabold text-sm text-slate-900 block">{reorderManufacturerModal.brandName}</span>
                <span className="text-[11px] text-slate-500">{reorderManufacturerModal.genericName} · {reorderManufacturerModal.dosageForm}</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Manufacturer / Primary C&amp;F Plant
                </label>
                <select className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#1b64da]">
                  <option>Cipla Ltd - Verna Industrial Estate, Goa Plant</option>
                  <option>Abbott India Ltd - Verna / Baddi Formulation Depot</option>
                  <option>Micro Labs Ltd - Peenya Industrial Area, Bengaluru</option>
                  <option>Sun Pharmaceutical Industries Ltd - Halol, Gujarat</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Order Quantity (Carton Bulk Units)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={100}
                    step={100}
                    required
                    value={reorderUnits}
                    onChange={(e) => setReorderUnits(parseInt(e.target.value, 10) || 100)}
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#1b64da]"
                  />
                  <div className="flex gap-1">
                    {[250, 500, 1000, 2500].map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => setReorderUnits(q)}
                        className={`px-2 py-1.5 rounded-lg text-[11px] font-mono font-bold cursor-pointer ${
                          reorderUnits === q ? 'bg-[#1b64da] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-3 bg-blue-50/60 border border-blue-200/80 rounded-2xl flex items-center justify-between font-mono">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Estimated Landed Cost</span>
                  <span className="font-extrabold text-blue-900 text-sm">
                    ₹{(reorderUnits * (Number(reorderManufacturerModal.mrp || 60) * 0.6)).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </span>
                </div>
                <span className="text-[11px] text-blue-700 font-bold">40% Trade Margin</span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setReorderManufacturerModal(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingManufacturerPO}
                  className="px-4 py-2 bg-[#1b64da] hover:bg-[#1554ba] disabled:bg-slate-300 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  {isSubmittingManufacturerPO ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Transmitting PO...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Transmit Indent PO</span>
                    </>
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
