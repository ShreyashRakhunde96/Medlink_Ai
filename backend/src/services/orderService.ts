import { query, transaction, TransactionClient } from '../db/postgres';
import { RecommendationService, SplitAllocationItem } from './recommendationService';
import { ReservationService } from './reservationService';

export const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  'CREATED': ['PENDING_CONFIRMATION', 'PENDING_APPROVAL', 'CANCELLED'],
  'PENDING_CONFIRMATION': ['CONFIRMED', 'REJECTED', 'CANCELLED'],
  'PENDING_APPROVAL': ['CONFIRMED', 'REJECTED', 'CANCELLED'],
  'CONFIRMED': ['PROCESSING', 'READY_FOR_DISPATCH', 'DISPATCHED', 'CANCELLED'],
  'PROCESSING': ['READY_FOR_DISPATCH', 'DISPATCHED', 'CANCELLED'],
  'READY_FOR_DISPATCH': ['DISPATCHED', 'CANCELLED'],
  'DISPATCHED': ['DELIVERED', 'DELIVERY_FAILED', 'PARTIALLY_FULFILLED'],
  'PARTIALLY_FULFILLED': ['DELIVERED', 'RETURN_REQUESTED'],
  'DELIVERY_FAILED': ['READY_FOR_DISPATCH', 'CANCELLED', 'RETURNED'],
  'DELIVERED': ['COMPLETED', 'RETURN_REQUESTED'],
  'RETURN_REQUESTED': ['RETURNED', 'COMPLETED'],
  'RETURNED': [],
  'COMPLETED': [],
  'REJECTED': [],
  'CANCELLED': [],
};

export class OrderService {
  /**
   * 1. CREATE PURCHASE REQUEST
   * Created by retail medical store. Generates recommendation and allocation proposal.
   * Does NOT autonomously place orders without review.
   */
  static async createPurchaseRequest(
    medicalStoreId: string,
    medicineId: string,
    requestedQuantity: number,
    destinationPincode: string,
    notes?: string
  ): Promise<any> {
    const proposal = await RecommendationService.evaluateOffersAndSplit(
      medicineId,
      requestedQuantity,
      destinationPincode
    );

    if (proposal.allocations.length === 0) {
      throw new Error('No eligible distributors with available stock found for this medicine and pincode.');
    }

    return await transaction(async (tx: TransactionClient) => {
      const prId = `pr-${Date.now()}`;
      const prNumber = `PR-2026-${Math.floor(10000 + Math.random() * 90000)}`;

      // 1. Insert purchase request
      await tx.query(
        `INSERT INTO purchase_requests (id, request_number, medical_store_id, status, total_estimated_amount, destination_pincode, notes)
         VALUES ($1, $2, $3, 'CREATED', $4, $5, $6);`,
        [prId, prNumber, medicalStoreId, proposal.totalLandedCost, destinationPincode, notes || 'Standard procurement']
      );

      // 2. Insert purchase request item
      await tx.query(
        `INSERT INTO purchase_request_items (id, purchase_request_id, medicine_id, requested_quantity, unit_price_estimate)
         VALUES ($1, $2, $3, $4, $5);`,
        [`pri-${Date.now()}`, prId, medicineId, requestedQuantity, proposal.allocations[0].unitPrice]
      );

      // 3. Insert allocation proposal (Awaiting Store Review & Approval)
      const proposalId = `prop-${Date.now()}`;
      await tx.query(
        `INSERT INTO allocation_proposals (id, purchase_request_id, status, allocations, is_split, total_cost)
         VALUES ($1, $2, 'PROPOSED', $3, $4, $5);`,
        [proposalId, prId, JSON.stringify(proposal.allocations), proposal.isSplit, proposal.totalLandedCost]
      );

      return {
        purchaseRequestId: prId,
        requestNumber: prNumber,
        status: 'CREATED',
        isSplit: proposal.isSplit,
        totalLandedCost: proposal.totalLandedCost,
        allocations: proposal.allocations,
        proposalId,
      };
    });
  }

  /**
   * 2. APPROVE ALLOCATION & GENERATE SUPPLIER ORDERS
   * Store reviews and authorizes the allocation proposal.
   * Generates parent-child supplier_orders for each allocated distributor and locks reservations.
   */
  static async approveAllocationAndCreateOrders(purchaseRequestId: string, proposalId: string): Promise<any> {
    const propRes = await query(
      `SELECT p.id, p.purchase_request_id, p.allocations, p.is_split, pr.medical_store_id
       FROM allocation_proposals p
       JOIN purchase_requests pr ON p.purchase_request_id = pr.id
       WHERE p.id = $1 AND p.purchase_request_id = $2;`,
      [proposalId, purchaseRequestId]
    );

    if (propRes.rows.length === 0) {
      throw new Error('Allocation proposal not found for this purchase request.');
    }

    const prop = propRes.rows[0];
    const allocations: SplitAllocationItem[] = typeof prop.allocations === 'string' ? JSON.parse(prop.allocations) : prop.allocations;
    const storeId = prop.medical_store_id;

    const createdOrders: any[] = [];

    // Generate independent supplier orders for each distributor in the split
    for (const alloc of allocations) {
      const orderId = `so-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const orderNum = `SO-2026-${Math.floor(10000 + Math.random() * 90000)}`;
      const subtotal = alloc.allocatedQuantity * alloc.unitPrice;
      const tax = alloc.taxAmount;
      const total = alloc.totalCost;

      await transaction(async (tx: TransactionClient) => {
        // 1. Create Supplier Order
        await tx.query(
          `INSERT INTO supplier_orders (id, order_number, purchase_request_id, medical_store_id, distributor_id, status, subtotal, tax_amount, total_amount, timeout_at)
           VALUES ($1, $2, $3, $4, $5, 'PENDING_CONFIRMATION', $6, $7, $8, NOW() + INTERVAL '24 hours');`,
          [orderId, orderNum, purchaseRequestId, storeId, alloc.distributorId, subtotal, tax, total]
        );

        // 2. Create Supplier Order Item
        await tx.query(
          `INSERT INTO supplier_order_items (id, supplier_order_id, medicine_id, batch_number, quantity, unit_price, taxable_amount, gst_rate, tax_amount, total_amount)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10);`,
          [
            `soi-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            orderId,
            alloc.medicineId,
            alloc.batchNumber,
            alloc.allocatedQuantity,
            alloc.unitPrice,
            subtotal,
            alloc.gstRate,
            tax,
            total,
          ]
        );
      });

      // 3. Atomically reserve inventory stock
      const reserveRes = await ReservationService.reserveStock(
        orderId,
        alloc.distributorId,
        alloc.medicineId,
        null,
        alloc.allocatedQuantity
      );

      if (!reserveRes.success) {
        throw new Error(`Stock reservation failed for distributor ${alloc.distributorName}: ${reserveRes.error}`);
      }

      createdOrders.push({
        supplierOrderId: orderId,
        orderNumber: orderNum,
        distributorId: alloc.distributorId,
        distributorName: alloc.distributorName,
        allocatedQuantity: alloc.allocatedQuantity,
        totalAmount: total,
        status: 'PENDING_CONFIRMATION',
      });
    }

    // Update parent purchase request and proposal
    await query(
      `UPDATE allocation_proposals SET status = 'APPROVED' WHERE id = $1;`,
      [proposalId]
    );

    await query(
      `UPDATE purchase_requests SET status = $1, updated_at = NOW() WHERE id = $2;`,
      [prop.is_split ? 'SPLIT_APPROVED' : 'ALLOCATED', purchaseRequestId]
    );

    return {
      purchaseRequestId,
      isSplit: prop.is_split,
      supplierOrders: createdOrders,
    };
  }

  /**
   * 3. 14-STATE LIFECYCLE TRANSITION MACHINE
   * Enforces valid status transitions, reservation releases, and dispatch inventory deductions.
   */
  static async transitionStatus(
    supplierOrderId: string,
    newStatus: string,
    payload: {
      courierName?: string;
      trackingNumber?: string;
      estimatedDeliveryAt?: string;
      rejectionReason?: string;
      deliverySignature?: string;
      notes?: string;
    } = {}
  ): Promise<any> {
    const orderRes = await query(
      `SELECT so.*, pr.request_number, m.store_name, d.company_name as distributor_name
       FROM supplier_orders so
       LEFT JOIN purchase_requests pr ON so.purchase_request_id = pr.id
       JOIN medical_stores m ON so.medical_store_id = m.id
       JOIN distributors d ON so.distributor_id = d.id
       WHERE so.id = $1;`,
      [supplierOrderId]
    );

    if (orderRes.rows.length === 0) {
      throw new Error(`Supplier order ${supplierOrderId} not found.`);
    }

    const order = orderRes.rows[0];
    const currentStatus = order.status;

    // Validate Transition
    const allowed = ALLOWED_TRANSITIONS[currentStatus] || [];
    if (!allowed.includes(newStatus)) {
      throw new Error(
        `Invalid status transition from "${currentStatus}" to "${newStatus}". Allowed: [${allowed.join(', ')}].`
      );
    }

    // 1. REJECTED or CANCELLED: Release Stock Reservation
    if (newStatus === 'REJECTED' || newStatus === 'CANCELLED') {
      const reason = payload.rejectionReason || payload.notes || `Order ${newStatus.toLowerCase()}`;
      await ReservationService.releaseReservation(supplierOrderId, reason);

      await query(
        `UPDATE supplier_orders
         SET status = $1, rejection_reason = $2, updated_at = NOW()
         WHERE id = $3;`,
        [newStatus, reason, supplierOrderId]
      );
    }
    // 2. DISPATCHED: Deduct physical on-hand warehouse stock, generate delivery record
    else if (newStatus === 'DISPATCHED') {
      const carrier = payload.courierName || 'Blue Dart Medical Express';
      const tracking = payload.trackingNumber || `AWB-MED-${Math.floor(100000 + Math.random() * 900000)}`;
      
      // Robust date parsing for PostgreSQL timestamptz
      let estDeliveryDate = new Date(Date.now() + 24 * 3600000);
      if (payload.estimatedDeliveryAt) {
        const parsed = new Date(payload.estimatedDeliveryAt);
        if (!isNaN(parsed.getTime())) {
          estDeliveryDate = parsed;
        }
      }
      const estDelivery = estDeliveryDate.toISOString();

      // Deduct physical on-hand stock and commit reservation
      const commitRes = await ReservationService.commitReservationOnDispatch(supplierOrderId);
      if (!commitRes.success) {
        throw new Error(`Dispatch stock deduction failed: ${commitRes.error}`);
      }

      await query(
        `UPDATE supplier_orders
         SET status = 'DISPATCHED', dispatched_at = NOW(), updated_at = NOW()
         WHERE id = $1;`,
        [supplierOrderId]
      );

      // Create delivery record
      await query(
        `INSERT INTO deliveries (id, supplier_order_id, carrier_name, tracking_number, status, estimated_delivery_at)
         VALUES ($1, $2, $3, $4, 'IN_TRANSIT', $5)
         ON CONFLICT (supplier_order_id) DO UPDATE
         SET carrier_name = $3, tracking_number = $4, status = 'IN_TRANSIT', updated_at = NOW();`,
        [`del-${Date.now()}`, supplierOrderId, carrier, tracking, estDelivery]
      );
    }
    // 3. DELIVERED
    else if (newStatus === 'DELIVERED') {
      await query(
        `UPDATE supplier_orders
         SET status = 'DELIVERED', delivered_at = NOW(), updated_at = NOW()
         WHERE id = $1;`,
        [supplierOrderId]
      );

      await query(
        `UPDATE deliveries
         SET status = 'DELIVERED', actual_delivery_at = NOW(), delivery_signature = $1, updated_at = NOW()
         WHERE supplier_order_id = $2;`,
        [payload.deliverySignature || 'Pharmacist Verified Stamp', supplierOrderId]
      );

      // Check if all sibling orders of parent purchase request are delivered
      if (order.purchase_request_id) {
        const siblings = await query(
          `SELECT status FROM supplier_orders WHERE purchase_request_id = $1;`,
          [order.purchase_request_id]
        );
        const allCompletedOrDelivered = siblings.rows.every(
          (s) => s.status === 'DELIVERED' || s.status === 'COMPLETED'
        );
        if (allCompletedOrDelivered) {
          await query(
            `UPDATE purchase_requests SET status = 'COMPLETED', updated_at = NOW() WHERE id = $1;`,
            [order.purchase_request_id]
          );
        }
      }
    }
    // 4. Other Statuses (CONFIRMED, PROCESSING, READY_FOR_DISPATCH, COMPLETED, etc.)
    else {
      await query(
        `UPDATE supplier_orders
         SET status = $1, updated_at = NOW()
         WHERE id = $2;`,
        [newStatus, supplierOrderId]
      );
    }

    // Log to immutable audit ledger
    await query(
      `INSERT INTO audit_logs (id, actor_role, action, entity_name, entity_id, previous_state, new_state)
       VALUES ($1, 'SYSTEM', 'ORDER_STATUS_TRANSITION', 'supplier_orders', $2, $3, $4);`,
      [
        `audit-${Date.now()}`,
        supplierOrderId,
        JSON.stringify({ status: currentStatus }),
        JSON.stringify({ status: newStatus, ...payload }),
      ]
    );

    return {
      supplierOrderId,
      orderNumber: order.order_number,
      previousStatus: currentStatus,
      newStatus,
    };
  }

  /**
   * Generates Form 20B/21B Tax Invoice for a specific Supplier Order
   */
  static async getTaxInvoice(supplierOrderId: string): Promise<any> {
    const res = await query(
      `SELECT so.*, m.store_name, m.license_number as store_license, m.gstin as store_gstin, m.address as store_address, m.pincode as store_pincode,
              d.company_name as distributor_name, d.license_number as dist_license, d.gstin as dist_gstin, d.address as dist_address, d.pincode as dist_pincode,
              del.carrier_name, del.tracking_number, del.status as delivery_status
       FROM supplier_orders so
       JOIN medical_stores m ON so.medical_store_id = m.id
       JOIN distributors d ON so.distributor_id = d.id
       LEFT JOIN deliveries del ON so.id = del.supplier_order_id
       WHERE so.id = $1;`,
      [supplierOrderId]
    );

    if (res.rows.length === 0) {
      throw new Error(`Order ${supplierOrderId} not found.`);
    }

    const order = res.rows[0];

    const itemsRes = await query(
      `SELECT soi.*, m.brand_name, m.generic_name, m.hsn_code
       FROM supplier_order_items soi
       JOIN medicines m ON soi.medicine_id = m.id
       WHERE soi.supplier_order_id = $1;`,
      [supplierOrderId]
    );

    // Intra-state vs Inter-state Tax logic
    const isIntraState = order.store_gstin.substring(0, 2) === order.dist_gstin.substring(0, 2);
    const subtotal = parseFloat(order.subtotal);
    const taxTotal = parseFloat(order.tax_amount);

    return {
      invoiceNumber: `INV-2026-${order.order_number.replace('SO-2026-', '')}`,
      invoiceDate: order.created_at,
      orderNumber: order.order_number,
      paymentTerms: order.payment_terms || 'Credit 30 Days',
      seller: {
        name: order.distributor_name,
        licenseNumber: order.dist_license,
        gstin: order.dist_gstin,
        address: order.dist_address,
        pincode: order.dist_pincode,
      },
      buyer: {
        name: order.store_name,
        licenseNumber: order.store_license,
        gstin: order.store_gstin,
        address: order.store_address,
        pincode: order.store_pincode,
      },
      taxType: isIntraState ? 'INTRA_STATE (CGST + SGST)' : 'INTER_STATE (IGST)',
      lineItems: itemsRes.rows.map((it: any) => ({
        hsnCode: it.hsn_code || '300490',
        medicineName: it.brand_name,
        genericName: it.generic_name,
        batchNumber: it.batch_number,
        quantity: it.quantity,
        unitRate: parseFloat(it.unit_price),
        taxableAmount: parseFloat(it.taxable_amount),
        gstRate: `${it.gst_rate}%`,
        cgstAmount: isIntraState ? parseFloat((it.tax_amount / 2).toFixed(2)) : 0,
        sgstAmount: isIntraState ? parseFloat((it.tax_amount / 2).toFixed(2)) : 0,
        igstAmount: isIntraState ? 0 : parseFloat(it.tax_amount),
        totalItemAmount: parseFloat(it.total_amount),
      })),
      taxSummary: {
        subtotal,
        cgstTotal: isIntraState ? parseFloat((taxTotal / 2).toFixed(2)) : 0,
        sgstTotal: isIntraState ? parseFloat((taxTotal / 2).toFixed(2)) : 0,
        igstTotal: isIntraState ? 0 : taxTotal,
        shippingFee: parseFloat(order.shipping_fee || '0'),
        grandTotal: parseFloat(order.total_amount),
      },
      dispatchDetails: {
        carrierName: order.carrier_name || 'Pending Allocation',
        trackingNumber: order.tracking_number || 'Pending Allocation',
        status: order.delivery_status || order.status,
      },
      complianceDeclaration: 'Supplied under Drugs and Cosmetics Rules, 1945. Verified for Form 20B/21B statutory compliance.',
    };
  }
}

