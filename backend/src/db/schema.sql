-- ============================================================================
-- MedLink AI: Enterprise PostgreSQL Relational Database Schema
-- Standardized under Indian Pharmaceutical Distribution & D&C Rules, 1945
-- ============================================================================

-- 1. USERS & RBAC
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('MEDICAL_STORE', 'DISTRIBUTOR', 'ADMIN')),
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'SUSPENDED', 'REJECTED')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- 2. MEDICAL STORES (Retail Chemists)
CREATE TABLE IF NOT EXISTS medical_stores (
    id TEXT PRIMARY KEY,
    user_id TEXT UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    store_name TEXT NOT NULL,
    license_number TEXT UNIQUE NOT NULL, -- Form 20 / Form 21
    gstin TEXT UNIQUE NOT NULL,
    phone TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    pincode VARCHAR(10) NOT NULL,
    verification_status TEXT NOT NULL DEFAULT 'PENDING' CHECK (verification_status IN ('PENDING', 'APPROVED', 'SUSPENDED', 'REJECTED')),
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_medical_stores_pincode ON medical_stores(pincode);
CREATE INDEX IF NOT EXISTS idx_medical_stores_status ON medical_stores(verification_status);

-- 3. DISTRIBUTORS (Wholesale Logistics)
CREATE TABLE IF NOT EXISTS distributors (
    id TEXT PRIMARY KEY,
    user_id TEXT UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    company_name TEXT NOT NULL,
    license_number TEXT UNIQUE NOT NULL, -- Form 20B / Form 21B
    gstin TEXT UNIQUE NOT NULL,
    phone TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    pincode VARCHAR(10) NOT NULL,
    coverage_pincodes TEXT[] NOT NULL DEFAULT '{}',
    fulfillment_rating NUMERIC(5,2) DEFAULT 95.0,
    on_time_delivery_rate NUMERIC(5,2) DEFAULT 92.0,
    avg_lead_time_hours INT DEFAULT 24,
    api_key_hash TEXT,
    verification_status TEXT NOT NULL DEFAULT 'PENDING' CHECK (verification_status IN ('PENDING', 'APPROVED', 'SUSPENDED', 'REJECTED')),
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_distributors_pincode ON distributors(pincode);
CREATE INDEX IF NOT EXISTS idx_distributors_status ON distributors(verification_status);

-- 4. BUSINESS VERIFICATION DOCUMENTS
CREATE TABLE IF NOT EXISTS business_verification_documents (
    id TEXT PRIMARY KEY,
    entity_type TEXT NOT NULL CHECK (entity_type IN ('MEDICAL_STORE', 'DISTRIBUTOR')),
    entity_id TEXT NOT NULL,
    document_type TEXT NOT NULL CHECK (document_type IN ('DRUG_LICENSE_FORM_20', 'DRUG_LICENSE_FORM_21', 'DRUG_LICENSE_FORM_20B', 'DRUG_LICENSE_FORM_21B', 'GST_CERTIFICATE')),
    document_number TEXT NOT NULL,
    file_url TEXT,
    valid_from DATE,
    valid_to DATE,
    verification_status TEXT NOT NULL DEFAULT 'PENDING' CHECK (verification_status IN ('PENDING', 'APPROVED', 'REJECTED')),
    reviewed_by TEXT REFERENCES users(id),
    review_notes TEXT,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. MEDICINE MASTER CATALOGUE
CREATE TABLE IF NOT EXISTS medicines (
    id TEXT PRIMARY KEY,
    brand_name TEXT NOT NULL,
    generic_name TEXT NOT NULL,
    composition TEXT NOT NULL,
    dosage_form TEXT NOT NULL CHECK (dosage_form IN ('TABLET', 'CAPSULE', 'SYRUP', 'INJECTION', 'OINTMENT', 'DROPS', 'INHALER', 'SUSPENSION')),
    strength TEXT NOT NULL,
    release_characteristics TEXT DEFAULT 'IMMEDIATE_RELEASE' CHECK (release_characteristics IN ('IMMEDIATE_RELEASE', 'EXTENDED_RELEASE', 'SUSTAINED_RELEASE', 'DELAYED_RELEASE')),
    pack_size TEXT NOT NULL,
    manufacturer TEXT NOT NULL,
    category TEXT NOT NULL,
    rx_type TEXT NOT NULL DEFAULT 'PRESCRIPTION_RX' CHECK (rx_type IN ('PRESCRIPTION_RX', 'SCHEDULE_H', 'SCHEDULE_H1', 'SCHEDULE_X', 'OTC')),
    storage_condition TEXT NOT NULL DEFAULT 'ROOM_TEMPERATURE' CHECK (storage_condition IN ('ROOM_TEMPERATURE', 'REFRIGERATED_2_8C', 'COOL_DRY', 'DEEP_FREEZE')),
    hsn_code VARCHAR(10) NOT NULL DEFAULT '300490',
    gst_rate NUMERIC(4,2) NOT NULL DEFAULT 12.0, -- Configurable GST Rate
    base_price NUMERIC(10,2) NOT NULL,
    atc_code TEXT,
    verification_status TEXT NOT NULL DEFAULT 'VERIFIED' CHECK (verification_status IN ('VERIFIED', 'PROVISIONAL')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_medicines_brand ON medicines(brand_name);
CREATE INDEX IF NOT EXISTS idx_medicines_generic ON medicines(generic_name);
CREATE INDEX IF NOT EXISTS idx_medicines_category ON medicines(category);

-- 6. MEDICINE IDENTIFIERS (Barcode, GTIN, NDC)
CREATE TABLE IF NOT EXISTS medicine_identifiers (
    id TEXT PRIMARY KEY,
    medicine_id TEXT NOT NULL REFERENCES medicines(id) ON DELETE CASCADE,
    code_type TEXT NOT NULL, -- BARCODE_EAN13, GTIN, NDC
    code_value TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_medicine_identifiers_val ON medicine_identifiers(code_value);

-- 7. DISTRIBUTOR INVENTORY
CREATE TABLE IF NOT EXISTS distributor_inventories (
    id TEXT PRIMARY KEY,
    distributor_id TEXT NOT NULL REFERENCES distributors(id) ON DELETE CASCADE,
    medicine_id TEXT NOT NULL REFERENCES medicines(id) ON DELETE CASCADE,
    on_hand_quantity INT NOT NULL DEFAULT 0 CHECK (on_hand_quantity >= 0),
    reserved_quantity INT NOT NULL DEFAULT 0 CHECK (reserved_quantity >= 0),
    available_quantity INT NOT NULL DEFAULT 0 CHECK (available_quantity >= 0),
    unit_cost NUMERIC(10,2) NOT NULL,
    selling_price NUMERIC(10,2) NOT NULL,
    mrp NUMERIC(10,2) NOT NULL,
    min_threshold INT NOT NULL DEFAULT 20,
    is_low_stock BOOLEAN DEFAULT FALSE,
    last_restocked_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(distributor_id, medicine_id)
);
CREATE INDEX IF NOT EXISTS idx_dist_inv_avail ON distributor_inventories(available_quantity);
CREATE INDEX IF NOT EXISTS idx_dist_inv_med ON distributor_inventories(medicine_id);

-- 8. BATCHES & EXPIRY RECORDS
CREATE TABLE IF NOT EXISTS batches (
    id TEXT PRIMARY KEY,
    inventory_id TEXT NOT NULL REFERENCES distributor_inventories(id) ON DELETE CASCADE,
    distributor_id TEXT NOT NULL REFERENCES distributors(id) ON DELETE CASCADE,
    medicine_id TEXT NOT NULL REFERENCES medicines(id) ON DELETE CASCADE,
    batch_number TEXT NOT NULL,
    manufacturing_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    on_hand_quantity INT NOT NULL DEFAULT 0 CHECK (on_hand_quantity >= 0),
    reserved_quantity INT NOT NULL DEFAULT 0 CHECK (reserved_quantity >= 0),
    available_quantity INT NOT NULL DEFAULT 0 CHECK (available_quantity >= 0),
    mrp NUMERIC(10,2) NOT NULL,
    unit_cost NUMERIC(10,2) NOT NULL,
    selling_price NUMERIC(10,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(distributor_id, medicine_id, batch_number)
);
CREATE INDEX IF NOT EXISTS idx_batches_expiry ON batches(expiry_date);
CREATE INDEX IF NOT EXISTS idx_batches_num ON batches(batch_number);

-- 9. STOCK MOVEMENTS (Immutable Ledger)
CREATE TABLE IF NOT EXISTS stock_movements (
    id TEXT PRIMARY KEY,
    distributor_id TEXT NOT NULL REFERENCES distributors(id) ON DELETE CASCADE,
    inventory_id TEXT NOT NULL REFERENCES distributor_inventories(id) ON DELETE CASCADE,
    batch_id TEXT REFERENCES batches(id) ON DELETE SET NULL,
    movement_type TEXT NOT NULL CHECK (movement_type IN ('INWARD_PURCHASE', 'RESERVATION_HOLD', 'RESERVATION_RELEASE', 'ORDER_DISPATCH', 'ADJUSTMENT', 'RETURN')),
    quantity INT NOT NULL,
    previous_stock INT NOT NULL,
    new_stock INT NOT NULL,
    reference_type TEXT, -- PURCHASE_REQUEST, SUPPLIER_ORDER, CSV_IMPORT, API_SYNC, MANUAL_ADJUSTMENT
    reference_id TEXT,
    notes TEXT,
    created_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_stock_movements_type ON stock_movements(movement_type);

-- 10. INVENTORY SYNCHRONIZATION LOGS
CREATE TABLE IF NOT EXISTS inventory_sync_logs (
    id TEXT PRIMARY KEY,
    distributor_id TEXT NOT NULL REFERENCES distributors(id) ON DELETE CASCADE,
    sync_type TEXT NOT NULL CHECK (sync_type IN ('MANUAL', 'CSV_IMPORT', 'API_SNAPSHOT', 'API_INCREMENTAL')),
    idempotency_key TEXT UNIQUE,
    records_processed INT DEFAULT 0,
    records_inserted INT DEFAULT 0,
    records_updated INT DEFAULT 0,
    records_failed INT DEFAULT 0,
    error_details JSONB DEFAULT '[]'::jsonb,
    status TEXT NOT NULL DEFAULT 'SUCCESS' CHECK (status IN ('SUCCESS', 'PARTIAL_FAILURE', 'FAILED')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. PURCHASE REQUESTS (Medical Store Inward Request)
CREATE TABLE IF NOT EXISTS purchase_requests (
    id TEXT PRIMARY KEY,
    request_number TEXT UNIQUE NOT NULL,
    medical_store_id TEXT NOT NULL REFERENCES medical_stores(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'CREATED' CHECK (status IN ('CREATED', 'ALLOCATED', 'SPLIT_APPROVED', 'FULFILLING', 'COMPLETED', 'CANCELLED')),
    total_estimated_amount NUMERIC(10,2) NOT NULL,
    destination_pincode VARCHAR(10) NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pr_status ON purchase_requests(status);
CREATE INDEX IF NOT EXISTS idx_pr_store ON purchase_requests(medical_store_id);

-- 12. PURCHASE REQUEST ITEMS
CREATE TABLE IF NOT EXISTS purchase_request_items (
    id TEXT PRIMARY KEY,
    purchase_request_id TEXT NOT NULL REFERENCES purchase_requests(id) ON DELETE CASCADE,
    medicine_id TEXT NOT NULL REFERENCES medicines(id) ON DELETE CASCADE,
    requested_quantity INT NOT NULL CHECK (requested_quantity > 0),
    unit_price_estimate NUMERIC(10,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. ALLOCATION PROPOSALS (Multi-Distributor Split Proposals)
CREATE TABLE IF NOT EXISTS allocation_proposals (
    id TEXT PRIMARY KEY,
    purchase_request_id TEXT NOT NULL REFERENCES purchase_requests(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'PROPOSED' CHECK (status IN ('PROPOSED', 'APPROVED', 'REJECTED')),
    allocations JSONB NOT NULL, -- Array of { distributorId, medicineId, batchId, allocatedQty, unitPrice, leadHours }
    is_split BOOLEAN DEFAULT FALSE,
    total_cost NUMERIC(10,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. SUPPLIER ORDERS (Full 14-State Lifecycle to Specific Distributor)
CREATE TABLE IF NOT EXISTS supplier_orders (
    id TEXT PRIMARY KEY,
    order_number TEXT UNIQUE NOT NULL,
    purchase_request_id TEXT REFERENCES purchase_requests(id) ON DELETE SET NULL,
    medical_store_id TEXT NOT NULL REFERENCES medical_stores(id) ON DELETE CASCADE,
    distributor_id TEXT NOT NULL REFERENCES distributors(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'CREATED' CHECK (status IN (
        'CREATED',
        'PENDING_CONFIRMATION',
        'CONFIRMED',
        'PROCESSING',
        'READY_FOR_DISPATCH',
        'DISPATCHED',
        'DELIVERED',
        'COMPLETED',
        'REJECTED',
        'CANCELLED',
        'PARTIALLY_FULFILLED',
        'DELIVERY_FAILED',
        'RETURN_REQUESTED',
        'RETURNED'
    )),
    subtotal NUMERIC(10,2) NOT NULL,
    tax_amount NUMERIC(10,2) NOT NULL,
    tax_type TEXT NOT NULL DEFAULT 'INTRA_STATE_CGST_SGST' CHECK (tax_type IN ('INTRA_STATE_CGST_SGST', 'INTER_STATE_IGST')),
    shipping_fee NUMERIC(10,2) DEFAULT 0.0,
    total_amount NUMERIC(10,2) NOT NULL,
    payment_terms TEXT DEFAULT 'CREDIT_30_DAYS',
    rejection_reason TEXT,
    dispatched_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    timeout_at TIMESTAMPTZ, -- Response timeout
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_so_status ON supplier_orders(status);
CREATE INDEX IF NOT EXISTS idx_so_distributor ON supplier_orders(distributor_id);
CREATE INDEX IF NOT EXISTS idx_so_store ON supplier_orders(medical_store_id);

-- 15. SUPPLIER ORDER ITEMS
CREATE TABLE IF NOT EXISTS supplier_order_items (
    id TEXT PRIMARY KEY,
    supplier_order_id TEXT NOT NULL REFERENCES supplier_orders(id) ON DELETE CASCADE,
    medicine_id TEXT NOT NULL REFERENCES medicines(id) ON DELETE CASCADE,
    batch_id TEXT REFERENCES batches(id) ON DELETE SET NULL,
    batch_number TEXT NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(10,2) NOT NULL,
    taxable_amount NUMERIC(10,2) NOT NULL,
    gst_rate NUMERIC(4,2) NOT NULL,
    tax_amount NUMERIC(10,2) NOT NULL,
    total_amount NUMERIC(10,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. STOCK RESERVATIONS (With Auto-Expiration Lock)
CREATE TABLE IF NOT EXISTS stock_reservations (
    id TEXT PRIMARY KEY,
    supplier_order_id TEXT NOT NULL REFERENCES supplier_orders(id) ON DELETE CASCADE,
    inventory_id TEXT NOT NULL REFERENCES distributor_inventories(id) ON DELETE CASCADE,
    batch_id TEXT REFERENCES batches(id) ON DELETE SET NULL,
    reserved_quantity INT NOT NULL CHECK (reserved_quantity > 0),
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'COMMITTED', 'RELEASED', 'EXPIRED')),
    expires_at TIMESTAMPTZ NOT NULL,
    released_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_res_status ON stock_reservations(status);
CREATE INDEX IF NOT EXISTS idx_res_expires ON stock_reservations(expires_at);

-- 17. DELIVERIES & PHARMACEUTICAL CARRIER MANAGEMENT
CREATE TABLE IF NOT EXISTS deliveries (
    id TEXT PRIMARY KEY,
    supplier_order_id TEXT UNIQUE NOT NULL REFERENCES supplier_orders(id) ON DELETE CASCADE,
    carrier_name TEXT NOT NULL,
    tracking_number TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED')),
    requires_cold_chain BOOLEAN DEFAULT FALSE,
    cold_chain_temp_logged NUMERIC(4,1),
    carrier_verified_for_pharma BOOLEAN DEFAULT TRUE,
    estimated_delivery_at TIMESTAMPTZ NOT NULL,
    actual_delivery_at TIMESTAMPTZ,
    delivery_signature TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_deliveries_tracking ON deliveries(tracking_number);

-- 18. RECOMMENDATION AUDIT LOGS
CREATE TABLE IF NOT EXISTS recommendations (
    id TEXT PRIMARY KEY,
    medical_store_id TEXT NOT NULL REFERENCES medical_stores(id) ON DELETE CASCADE,
    medicine_id TEXT NOT NULL REFERENCES medicines(id) ON DELETE CASCADE,
    requested_quantity INT NOT NULL,
    destination_pincode VARCHAR(10) NOT NULL,
    ranked_offers JSONB NOT NULL,
    weights_used JSONB NOT NULL,
    split_proposal JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 19. DEMAND HISTORIES (Segregated Retail Store vs Distributor Wholesale)
CREATE TABLE IF NOT EXISTS demand_histories (
    id TEXT PRIMARY KEY,
    demand_source TEXT NOT NULL CHECK (demand_source IN ('RETAIL_STORE_POS', 'DISTRIBUTOR_WHOLESALE_ORDER')),
    entity_id TEXT NOT NULL,
    medicine_id TEXT NOT NULL REFERENCES medicines(id) ON DELETE CASCADE,
    pincode VARCHAR(10) NOT NULL,
    date DATE NOT NULL,
    quantity_demanded INT NOT NULL,
    was_stockout BOOLEAN DEFAULT FALSE,
    selling_price NUMERIC(10,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(demand_source, entity_id, medicine_id, date)
);
CREATE INDEX IF NOT EXISTS idx_demand_med_date ON demand_histories(medicine_id, date);

-- 20. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('ORDER_STATUS', 'LOW_STOCK', 'EXPIRY_WARNING', 'APPROVAL_UPDATE', 'SYSTEM')),
    is_read BOOLEAN DEFAULT FALSE,
    reference_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 21. AUDIT LOGS
CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    actor_id TEXT,
    actor_role TEXT,
    action TEXT NOT NULL,
    entity_name TEXT NOT NULL,
    entity_id TEXT,
    previous_state JSONB,
    new_state JSONB,
    ip_address TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_time ON audit_logs(timestamp);

-- 22. SYSTEM SETTINGS (Configurable Formula Weights & Flags)
CREATE TABLE IF NOT EXISTS system_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- RETAIL PHARMACY POS, INVENTORY & CUSTOMER LEDGER (PHASE 4-5 ENHANCEMENT)
-- ============================================================================

-- 23. RETAIL CUSTOMERS
CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,
    medical_store_id TEXT NOT NULL REFERENCES medical_stores(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    doctor_name TEXT,
    address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_store ON customers(medical_store_id);

-- 24. RETAIL STORE INVENTORY
CREATE TABLE IF NOT EXISTS store_inventories (
    id TEXT PRIMARY KEY,
    medical_store_id TEXT NOT NULL REFERENCES medical_stores(id) ON DELETE CASCADE,
    medicine_id TEXT NOT NULL REFERENCES medicines(id) ON DELETE CASCADE,
    batch_number TEXT NOT NULL,
    expiry_date DATE NOT NULL,
    on_hand_quantity INT NOT NULL DEFAULT 0,
    unit_cost NUMERIC(10,2) NOT NULL,
    mrp NUMERIC(10,2) NOT NULL,
    selling_price NUMERIC(10,2) NOT NULL,
    min_threshold INT DEFAULT 20,
    drawer_location VARCHAR(120) DEFAULT 'Rack A · Drawer 1',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(medical_store_id, medicine_id, batch_number)
);
CREATE INDEX IF NOT EXISTS idx_store_inv_med ON store_inventories(medicine_id);
CREATE INDEX IF NOT EXISTS idx_store_inv_store ON store_inventories(medical_store_id);

-- 25. RETAIL BILLS / POS TRANSACTIONS
CREATE TABLE IF NOT EXISTS retail_bills (
    id TEXT PRIMARY KEY,
    bill_number TEXT UNIQUE NOT NULL,
    medical_store_id TEXT NOT NULL REFERENCES medical_stores(id) ON DELETE CASCADE,
    customer_id TEXT REFERENCES customers(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    doctor_name TEXT,
    payment_mode TEXT NOT NULL DEFAULT 'CASH' CHECK (payment_mode IN ('CASH', 'UPI', 'CARD', 'CREDIT')),
    subtotal NUMERIC(10,2) NOT NULL,
    discount_amount NUMERIC(10,2) DEFAULT 0.0,
    tax_amount NUMERIC(10,2) NOT NULL,
    total_amount NUMERIC(10,2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_bills_store ON retail_bills(medical_store_id);
CREATE INDEX IF NOT EXISTS idx_bills_created ON retail_bills(created_at);

-- 26. RETAIL BILL ITEMS
CREATE TABLE IF NOT EXISTS retail_bill_items (
    id TEXT PRIMARY KEY,
    bill_id TEXT NOT NULL REFERENCES retail_bills(id) ON DELETE CASCADE,
    medicine_id TEXT NOT NULL REFERENCES medicines(id) ON DELETE CASCADE,
    brand_name TEXT NOT NULL,
    batch_number TEXT NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(10,2) NOT NULL,
    mrp NUMERIC(10,2) NOT NULL,
    discount_percent NUMERIC(4,2) DEFAULT 0.0,
    gst_rate NUMERIC(4,2) DEFAULT 12.0,
    total_amount NUMERIC(10,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_bill_items_bill ON retail_bill_items(bill_id);

