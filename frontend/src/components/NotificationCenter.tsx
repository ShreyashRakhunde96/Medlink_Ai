'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Bell,
  AlertTriangle,
  AlertCircle,
  Calendar,
  Package,
  Truck,
  CheckCircle2,
  X,
  ExternalLink,
  ArrowRight,
  Sparkles,
  ShoppingBag,
  Clock,
  ChevronRight,
  Check,
  ShieldAlert,
} from 'lucide-react';

export interface AppNotification {
  id: string;
  type: 'EXPIRY' | 'STOCK_LIMIT' | 'ORDER' | 'INDENT';
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  title: string;
  description: string;
  timestamp: string;
  metadata?: {
    medicineName?: string;
    medicineId?: string;
    batchNumber?: string;
    currentStock?: number;
    threshold?: number;
    expiryDate?: string;
    daysRemaining?: number;
    orderId?: string;
    orderNumber?: string;
    trackingNumber?: string;
    tab?: string;
    order?: any;
  };
  actionLabel?: string;
  actionType?: 'ORDER_MEDICINE' | 'DISCOUNT_EXPIRY' | 'TRACK_ORDER' | 'VIEW_INDENT' | 'NAVIGATE' | 'QUARANTINE_BATCH' | 'TRACK_FLEET';
}

interface NotificationCenterProps {
  role: 'store' | 'distributor';
  inventory?: any[];
  orders?: any[];
  indents?: any[];
  onAction?: (actionType: string, metadata?: any) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  role,
  inventory = [],
  orders = [],
  indents = [],
  onAction,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'EXPIRY' | 'STOCK' | 'ORDERS'>('ALL');
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Compute live notifications from authentic inventory, orders, and indents
  const notifications: AppNotification[] = useMemo(() => {
    const list: AppNotification[] = [];
    const today = new Date();

    // 1. Scan Inventory for Real Physical Stock Limits & Expiry Timelines
    if (inventory && Array.isArray(inventory)) {
      inventory.forEach((item, idx) => {
        const medName = item.brandName || item.medicineName || item.name || `Medicine #${idx + 1}`;
        const medId = item.medicineId || item.id || `med-${idx}`;
        const batchNo = item.batchNumber || item.batch || 'BTH-GEN-01';

        // Robust quantity extraction across retail store & distributor schemas
        const qty = Number(
          item.onHandQuantity ??
          item.currentStock ??
          item.quantity ??
          item.availableQuantity ??
          item.available_quantity ??
          0
        );
        const minThreshold = Number(
          item.minThreshold ??
          item.min_threshold ??
          item.threshold ??
          25
        );

        // A. Real Stock Limit Alerts
        if (qty === 0) {
          list.push({
            id: `stock-depleted-${medId}-${batchNo}`,
            type: 'STOCK_LIMIT',
            severity: 'CRITICAL',
            title: `Out of Stock: ${medName}`,
            description: `Physical shelf stock reached 0 units! Patients are unable to dispense this medicine.`,
            timestamp: 'Immediate Attention',
            metadata: { medicineName: medName, medicineId: medId, currentStock: 0, threshold: minThreshold, tab: 'inventory' },
            actionLabel: role === 'store' ? 'Reorder from Wholesaler' : 'Restock Manufacturing Lot',
            actionType: role === 'store' ? 'ORDER_MEDICINE' : 'NAVIGATE',
          });
        } else if (qty <= minThreshold) {
          list.push({
            id: `stock-low-${medId}-${batchNo}`,
            type: 'STOCK_LIMIT',
            severity: 'WARNING',
            title: `Low Stock Limit: ${medName}`,
            description: `Only ${qty} units remaining in shelf (safe reorder threshold is ${minThreshold} units).`,
            timestamp: 'Restock Required',
            metadata: { medicineName: medName, medicineId: medId, currentStock: qty, threshold: minThreshold, tab: 'inventory' },
            actionLabel: role === 'store' ? 'Draft Wholesale PO' : 'Inward Warehouse Batch',
            actionType: role === 'store' ? 'ORDER_MEDICINE' : 'NAVIGATE',
          });
        }

        // B. Real Expiry Alerts (Only genuine expiring batches)
        const expStr = item.expiryDate || item.expiry_date;
        if (expStr) {
          const expDate = new Date(expStr);
          if (!isNaN(expDate.getTime())) {
            const diffMs = expDate.getTime() - today.getTime();
            const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

            if (daysLeft <= 0) {
              list.push({
                id: `exp-expired-${medId}-${batchNo}`,
                type: 'EXPIRY',
                severity: 'CRITICAL',
                title: `Expired Batch: ${medName}`,
                description: `Batch ${batchNo} expired on ${expDate.toLocaleDateString('en-IN')}. Must be quarantined immediately!`,
                timestamp: 'Critical QA Alert',
                metadata: { medicineName: medName, medicineId: medId, batchNumber: batchNo, expiryDate: expStr, daysRemaining: daysLeft, tab: 'stock' },
                actionLabel: role === 'store' ? 'Quarantine / Return to Supplier' : 'Hold QA Quarantine',
                actionType: role === 'store' ? 'DISCOUNT_EXPIRY' : 'QUARANTINE_BATCH',
              });
            } else if (daysLeft <= 30) {
              list.push({
                id: `exp-urgent-${medId}-${batchNo}`,
                type: 'EXPIRY',
                severity: 'CRITICAL',
                title: `Urgent Expiry (${daysLeft}d left): ${medName}`,
                description: `Batch ${batchNo} expires on ${expDate.toLocaleDateString('en-IN')}. Apply promotional clearance discount.`,
                timestamp: `${daysLeft} days remaining`,
                metadata: { medicineName: medName, medicineId: medId, batchNumber: batchNo, expiryDate: expStr, daysRemaining: daysLeft, tab: 'stock' },
                actionLabel: role === 'store' ? 'Apply POS Promo Discount' : 'Clearance Lot Alert',
                actionType: role === 'store' ? 'DISCOUNT_EXPIRY' : 'NAVIGATE',
              });
            } else if (daysLeft <= 90) {
              list.push({
                id: `exp-warning-${medId}-${batchNo}`,
                type: 'EXPIRY',
                severity: 'WARNING',
                title: `Early Expiry Watch: ${medName}`,
                description: `Batch ${batchNo} expires in ~${Math.round(daysLeft / 30)} months (${daysLeft} days). First-to-expire batch priority.`,
                timestamp: `${daysLeft} days remaining`,
                metadata: { medicineName: medName, medicineId: medId, batchNumber: batchNo, expiryDate: expStr, daysRemaining: daysLeft, tab: 'stock' },
                actionLabel: role === 'store' ? 'View Batch Inventory' : 'Monitor Expiry Ageing',
                actionType: role === 'store' ? 'DISCOUNT_EXPIRY' : 'NAVIGATE',
              });
            }
          }
        }
      });
    }

    // 2. Scan Orders for Logistics & Dispatch Milestones
    if (orders && Array.isArray(orders)) {
      orders.forEach((ord) => {
        const ordNum = ord.orderNumber || ord.id;
        const distName = ord.distributorName || 'Wholesaler';
        const medName = ord.medicineName || 'Medicine Formulation';

        if (ord.status === 'DISPATCHED') {
          list.push({
            id: `ord-dispatched-${ord.id}`,
            type: 'ORDER',
            severity: 'INFO',
            title: `Order #${ordNum} Out for Delivery`,
            description: `${medName} (${ord.quantity} units) dispatched by ${distName}. Live GPS cold-chain tracking active.`,
            timestamp: 'In Transit',
            metadata: { orderId: ord.id, orderNumber: ordNum, trackingNumber: ord.trackingNumber, order: ord, tab: 'fulfillment' },
            actionLabel: role === 'store' ? 'Track Live GPS' : 'View Fleet Telematics',
            actionType: role === 'store' ? 'TRACK_ORDER' : 'TRACK_FLEET',
          });
        } else if (ord.status === 'CONFIRMED' && ord.paymentStatus !== 'PAID') {
          list.push({
            id: `ord-awaiting-pay-${ord.id}`,
            type: 'ORDER',
            severity: 'WARNING',
            title: `Order #${ordNum} Accepted - Payment Due`,
            description: `${distName} confirmed ${ord.quantity} units of ${medName}. Complete payment to release dispatch.`,
            timestamp: 'Payment Pending',
            metadata: { orderId: ord.id, orderNumber: ordNum, order: ord, tab: 'orders' },
            actionLabel: role === 'store' ? 'Pay Wholesaler Now' : 'Awaiting Chemist Settlement',
            actionType: role === 'store' ? 'TRACK_ORDER' : 'NAVIGATE',
          });
        }
      });
    }

    // 3. Scan Chemist Indents / Sourcing Requests
    if (indents && Array.isArray(indents)) {
      indents.forEach((ind) => {
        if (role === 'distributor' && ind.status === 'PENDING') {
          const med = ind.medicine_name || ind.medicineName || 'Medicine';
          const store = ind.store_name || ind.storeName || 'Apollo Pharmacy';
          const qty = ind.required_qty || ind.requiredQty || ind.quantityNeeded || 50;
          list.push({
            id: `ind-pending-${ind.id}`,
            type: 'INDENT',
            severity: 'WARNING',
            title: `New Chemist Indent: ${med}`,
            description: `${store} requested ${qty} units (${ind.urgency || 'MEDIUM'} urgency).`,
            timestamp: 'New Chemist Indent',
            metadata: { medicineName: med, tab: 'indents' },
            actionLabel: 'Review & Source Stock',
            actionType: 'NAVIGATE',
          });
        } else if (role === 'store' && ind.status === 'AVAILABLE') {
          const med = ind.medicine_name || ind.medicineName || 'Medicine';
          list.push({
            id: `ind-avail-${ind.id}`,
            type: 'INDENT',
            severity: 'INFO',
            title: `Requested Drug Inwarded: ${med}`,
            description: `Wholesalers have inwarded stock for your indent (${med}). Ready to order now!`,
            timestamp: 'Stock Ready',
            metadata: { medicineName: med },
            actionLabel: 'Order from Catalogue',
            actionType: 'ORDER_MEDICINE',
          });
        }
      });
    }

    return list;
  }, [inventory, orders, indents, role]);

  const unreadCount = notifications.filter((n) => !readIds.has(n.id)).length;

  const filteredNotifications = useMemo(() => {
    if (activeFilter === 'ALL') return notifications;
    if (activeFilter === 'EXPIRY') return notifications.filter((n) => n.type === 'EXPIRY');
    if (activeFilter === 'STOCK') return notifications.filter((n) => n.type === 'STOCK_LIMIT');
    if (activeFilter === 'ORDERS') return notifications.filter((n) => n.type === 'ORDER' || n.type === 'INDENT');
    return notifications;
  }, [notifications, activeFilter]);

  const handleMarkAllRead = () => {
    const allIds = new Set(notifications.map((n) => n.id));
    setReadIds(allIds);
  };

  const handleNotificationClick = (n: AppNotification) => {
    setReadIds((prev) => new Set(prev).add(n.id));
    if (n.actionType && onAction) {
      onAction(n.actionType, n.metadata);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative p-2 rounded-xl text-slate-600 hover:text-[#004733] hover:bg-emerald-50/70 border border-transparent hover:border-emerald-200/60 transition cursor-pointer"
        title="Real-Time Notifications & Stock Alerts"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-600 text-white text-[9.5px] font-bold items-center justify-center font-mono shadow-xs">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </span>
        )}
      </button>

      {/* Dropdown Panel - Clean MedLink Pharmacy Aesthetic */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-[420px] max-w-[92vw] bg-white border border-slate-200/90 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header with MedLink Forest Green Theme */}
          <div className="px-4 py-3 bg-[#004733] text-white flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-white leading-tight">Notifications &amp; Alerts</h3>
                <span className="text-[10px] text-emerald-200 font-medium">
                  {role === 'store' ? 'Retail Pharmacy Counter Sentinel' : 'Wholesale Logistics Radar'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 bg-emerald-500/25 text-emerald-200 border border-emerald-400/30 rounded-full font-mono text-[10px] font-bold">
                  {unreadCount} unread
                </span>
              )}
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="text-[11px] font-bold text-emerald-200 hover:text-white transition hover:underline cursor-pointer ml-1"
                >
                  Mark read
                </button>
              )}
            </div>
          </div>

          {/* Filter Navigation Tabs */}
          <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 flex items-center gap-1.5 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg font-bold text-xs transition cursor-pointer whitespace-nowrap ${
                activeFilter === 'ALL'
                  ? 'bg-[#004733] text-white shadow-2xs'
                  : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('EXPIRY')}
              className={`px-2.5 py-1 rounded-lg font-bold text-xs transition cursor-pointer whitespace-nowrap ${
                activeFilter === 'EXPIRY'
                  ? 'bg-[#004733] text-white shadow-2xs'
                  : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
              }`}
            >
              Expiry ({notifications.filter((n) => n.type === 'EXPIRY').length})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('STOCK')}
              className={`px-2.5 py-1 rounded-lg font-bold text-xs transition cursor-pointer whitespace-nowrap ${
                activeFilter === 'STOCK'
                  ? 'bg-[#004733] text-white shadow-2xs'
                  : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
              }`}
            >
              Stock Limits ({notifications.filter((n) => n.type === 'STOCK_LIMIT').length})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('ORDERS')}
              className={`px-2.5 py-1 rounded-lg font-bold text-xs transition cursor-pointer whitespace-nowrap ${
                activeFilter === 'ORDERS'
                  ? 'bg-[#004733] text-white shadow-2xs'
                  : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
              }`}
            >
              Orders ({notifications.filter((n) => n.type === 'ORDER' || n.type === 'INDENT').length})
            </button>
          </div>

          {/* Notifications List */}
          <div className="max-h-84 overflow-y-auto divide-y divide-slate-100 p-2 space-y-1">
            {filteredNotifications.length === 0 ? (
              <div className="py-10 text-center text-slate-400">
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-[#00875a] flex items-center justify-center mx-auto mb-2.5">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold text-slate-800">All clear! No pending alerts</p>
                <p className="text-xs text-slate-400 mt-0.5 max-w-xs mx-auto">
                  Physical stock levels and expiry schedules are operating within safe regulatory parameters.
                </p>
              </div>
            ) : (
              filteredNotifications.map((notif) => {
                const isRead = readIds.has(notif.id);
                return (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`p-3 rounded-xl transition cursor-pointer flex items-start gap-3 border ${
                      isRead
                        ? 'bg-white hover:bg-slate-50 border-slate-100 opacity-75'
                        : 'bg-slate-50/90 hover:bg-emerald-50/40 border-slate-200/90 shadow-2xs'
                    }`}
                  >
                    {/* Severity Icon Badge */}
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 border ${
                        notif.severity === 'CRITICAL'
                          ? 'bg-rose-50 text-rose-600 border-rose-200'
                          : notif.severity === 'WARNING'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-emerald-50 text-[#006644] border-emerald-200'
                      }`}
                    >
                      {notif.type === 'EXPIRY' ? (
                        <Calendar className="w-4 h-4" />
                      ) : notif.type === 'STOCK_LIMIT' ? (
                        <Package className="w-4 h-4" />
                      ) : (
                        <Truck className="w-4 h-4" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-extrabold text-slate-900 truncate block">
                          {notif.title}
                        </span>
                        <span className="text-[10px] font-mono font-bold text-slate-400 shrink-0">
                          {notif.timestamp}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5 leading-snug">
                        {notif.description}
                      </p>

                      {/* Action CTA */}
                      {notif.actionLabel && (
                        <div className="mt-2 flex items-center gap-1 text-[11px] font-bold text-[#00875a] hover:text-[#004733] transition">
                          <span>{notif.actionLabel}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>

                    {!isRead && (
                      <span className="w-2 h-2 rounded-full bg-[#00875a] shrink-0 self-center" />
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <span className="text-[10.5px] font-medium flex items-center gap-1.5 text-slate-500">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Live automated stock &amp; expiry scanning</span>
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
