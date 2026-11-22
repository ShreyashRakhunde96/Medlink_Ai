import bcrypt from 'bcryptjs';
import { query, transaction, initPostgres } from './postgres';
import { MOCK_MEDICINES, MOCK_DISTRIBUTORS } from '../mockData';

export async function seedDatabase(): Promise<void> {
  const existingUsers = await query('SELECT count(*) FROM users;');
  if (parseInt(existingUsers.rows[0].count, 10) > 0) {
    console.log('ℹ️ Database already seeded. Skipping initial seed.');
    return;
  }

  console.log('🌱 Seeding MedLink AI PostgreSQL relational database...');

  await transaction(async (tx) => {
    // 1. SYSTEM SETTINGS
    await tx.query(
      `INSERT INTO system_settings (key, value) VALUES ($1, $2)
       ON CONFLICT (key) DO UPDATE SET value = $2;`,
      [
        'recommendation_weights',
        JSON.stringify({
          stockWeight: 0.40,
          priceWeight: 0.25,
          slaWeight: 0.20,
          speedWeight: 0.15,
        }),
      ]
    );

    // 2. USERS
    const passwordHash = await bcrypt.hash('Password@123', 10);
    const adminHash = await bcrypt.hash('Admin@123', 10);

    // Admin User
    await tx.query(
      `INSERT INTO users (id, email, password_hash, role, status)
       VALUES ($1, $2, $3, $4, $5);`,
      ['usr-admin-01', 'admin@medlink.io', adminHash, 'ADMIN', 'APPROVED']
    );

    // Medical Store User (Apollo Care Pharmacy)
    await tx.query(
      `INSERT INTO users (id, email, password_hash, role, status)
       VALUES ($1, $2, $3, $4, $5);`,
      ['usr-store-01', 'apollo.chemist@medlink.io', passwordHash, 'MEDICAL_STORE', 'APPROVED']
    );

    // Medical Store Record
    await tx.query(
      `INSERT INTO medical_stores (id, user_id, store_name, license_number, gstin, phone, address, city, state, pincode, verification_status, verified_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW());`,
      [
        'store-apollo-01',
        'usr-store-01',
        'Apollo Care Pharmacy',
        'DL-2024-MH-APO8821',
        '27AABCA1234F1Z8',
        '+91 98200 11223',
        'Shop 4, Colaba Causeway, Fort',
        'Mumbai',
        'Maharashtra',
        '400001',
        'APPROVED',
      ]
    );

    // Pending Medical Store User (LifeShield Chemist)
    await tx.query(
      `INSERT INTO users (id, email, password_hash, role, status)
       VALUES ($1, $2, $3, $4, $5);`,
      ['usr-store-02', 'lifeshield.chemist@medlink.io', passwordHash, 'MEDICAL_STORE', 'PENDING']
    );
    await tx.query(
      `INSERT INTO medical_stores (id, user_id, store_name, license_number, gstin, phone, address, city, state, pincode, verification_status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11);`,
      [
        'store-lifeshield-02',
        'usr-store-02',
        'LifeShield Chemist & Druggist',
        'DL-2024-MH-LFS5512',
        '27AABCL8899P1Z6',
        '+91 98200 44556',
        'Sector 17, Vashi',
        'Navi Mumbai',
        'Maharashtra',
        '400705',
        'PENDING',
      ]
    );

    // Distributors
    for (let i = 0; i < MOCK_DISTRIBUTORS.length; i++) {
      const d = MOCK_DISTRIBUTORS[i];
      const distUserId = `usr-dist-${i + 1}`;
      const email = i === 0 ? 'medvantage.logistics@medlink.io' : `dist${i + 1}@medlink.io`;

      await tx.query(
        `INSERT INTO users (id, email, password_hash, role, status)
         VALUES ($1, $2, $3, $4, $5);`,
        [distUserId, email, passwordHash, 'DISTRIBUTOR', 'APPROVED']
      );

      await tx.query(
        `INSERT INTO distributors (id, user_id, company_name, license_number, gstin, phone, address, city, state, pincode, coverage_pincodes, fulfillment_rating, on_time_delivery_rate, avg_lead_time_hours, verification_status, verified_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW());`,
        [
          d.id,
          distUserId,
          d.companyName,
          d.licenseNumber,
          `27AABC${d.id.replace('-', '').toUpperCase()}1Z${i + 1}`,
          d.phone,
          d.address,
          d.city,
          'Maharashtra',
          d.pincode,
          d.coveragePincodes,
          d.fulfillmentRating,
          d.onTimeDeliveryRate,
          d.avgLeadTimeHours,
          d.status,
        ]
      );
    }

    // 3. MEDICINES CATALOGUE
    for (const m of MOCK_MEDICINES) {
      const gstRate = m.category === 'Nutritional & Vitamins' ? 18.0 : m.category === 'Respiratory & Inhaler' ? 5.0 : 12.0;
      await tx.query(
        `INSERT INTO medicines (id, brand_name, generic_name, composition, dosage_form, strength, release_characteristics, pack_size, manufacturer, category, rx_type, storage_condition, hsn_code, gst_rate, base_price, atc_code, verification_status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17);`,
        [
          m.id,
          m.brandName,
          m.genericName,
          m.composition,
          m.dosageForm,
          m.strength,
          'IMMEDIATE_RELEASE',
          m.packSize,
          m.manufacturer,
          m.category,
          m.rxType,
          m.storageCondition,
          '300490',
          gstRate,
          m.basePrice,
          m.atcCode,
          'VERIFIED',
        ]
      );

      // Product Identifiers (EAN-13 Barcode)
      await tx.query(
        `INSERT INTO medicine_identifiers (id, medicine_id, code_type, code_value)
         VALUES ($1, $2, $3, $4);`,
        [`ident-${m.id}`, m.id, 'BARCODE_EAN13', `890${m.id.replace('med-', '').padStart(10, '0')}`]
      );
    }

    // 4. DISTRIBUTOR INVENTORY & BATCHES
    // Seed initial stock for primary distributor (MedVantage Logistics)
    const primaryDistId = 'dist-01';
    for (let idx = 0; idx < MOCK_MEDICINES.length; idx++) {
      const med = MOCK_MEDICINES[idx];
      const invId = `inv-mvl-${med.id}`;
      const batchId = `bth-mvl-${med.id}`;
      const onHand = 120 + idx * 30;
      const reserved = idx % 3 === 0 ? 20 : 0;
      const available = onHand - reserved;
      const unitCost = parseFloat((med.basePrice * 0.78).toFixed(2));
      const sellingPrice = med.basePrice;
      const mrp = parseFloat((med.basePrice * 1.25).toFixed(2));

      await tx.query(
        `INSERT INTO distributor_inventories (id, distributor_id, medicine_id, on_hand_quantity, reserved_quantity, available_quantity, unit_cost, selling_price, mrp, min_threshold, is_low_stock)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11);`,
        [
          invId,
          primaryDistId,
          med.id,
          onHand,
          reserved,
          available,
          unitCost,
          sellingPrice,
          mrp,
          40,
          available <= 40,
        ]
      );

      // Batch
      await tx.query(
        `INSERT INTO batches (id, inventory_id, distributor_id, medicine_id, batch_number, manufacturing_date, expiry_date, on_hand_quantity, reserved_quantity, available_quantity, mrp, unit_cost, selling_price)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13);`,
        [
          batchId,
          invId,
          primaryDistId,
          med.id,
          `BTH-MVL-${1000 + idx}`,
          '2025-01-15',
          new Date(Date.now() + (240 + idx * 30) * 86400000).toISOString().split('T')[0],
          onHand,
          reserved,
          available,
          mrp,
          unitCost,
          sellingPrice,
        ]
      );

      // Stock Movement (Initial Inward)
      await tx.query(
        `INSERT INTO stock_movements (id, distributor_id, inventory_id, batch_id, movement_type, quantity, previous_stock, new_stock, reference_type, reference_id, notes, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12);`,
        [
          `mov-seed-${idx + 1}`,
          primaryDistId,
          invId,
          batchId,
          'INWARD_PURCHASE',
          onHand,
          0,
          onHand,
          'MANUAL_ADJUSTMENT',
          'INITIAL_WAREHOUSE_SYNC',
          'Initial warehouse stocking',
          'SYSTEM',
        ]
      );
    }

    // Seed stock for secondary distributor (Apex Global Health) for split-order scenarios
    const secondaryDistId = 'dist-02';
    for (let idx = 0; idx < 6; idx++) {
      const med = MOCK_MEDICINES[idx];
      const invId = `inv-apx-${med.id}`;
      const batchId = `bth-apx-${med.id}`;
      const onHand = 45; // Moderate stock depth to trigger split orders when store orders 100+
      const available = 45;
      const unitCost = parseFloat((med.basePrice * 0.8).toFixed(2));
      const sellingPrice = parseFloat((med.basePrice * 1.02).toFixed(2));
      const mrp = parseFloat((med.basePrice * 1.25).toFixed(2));

      await tx.query(
        `INSERT INTO distributor_inventories (id, distributor_id, medicine_id, on_hand_quantity, reserved_quantity, available_quantity, unit_cost, selling_price, mrp, min_threshold, is_low_stock)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11);`,
        [
          invId,
          secondaryDistId,
          med.id,
          onHand,
          0,
          available,
          unitCost,
          sellingPrice,
          mrp,
          30,
          false,
        ]
      );

      await tx.query(
        `INSERT INTO batches (id, inventory_id, distributor_id, medicine_id, batch_number, manufacturing_date, expiry_date, on_hand_quantity, reserved_quantity, available_quantity, mrp, unit_cost, selling_price)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13);`,
        [
          batchId,
          invId,
          secondaryDistId,
          med.id,
          `BTH-APX-${2000 + idx}`,
          '2025-02-01',
          '2027-08-31',
          onHand,
          0,
          available,
          mrp,
          unitCost,
          sellingPrice,
        ]
      );
    }
  });

  console.log('✅ PostgreSQL seed completed successfully with verified entities, master medicines, and batches.');
  await seedRetailPOSData();
}

/**
 * Seed Retail Pharmacy POS, Store Inventory, and Customers for Apollo Care Pharmacy
 */
export async function seedRetailPOSData(): Promise<void> {
  const storeId = 'store-apollo-01';

  // Check if store inventory already seeded
  const existingInv = await query(`SELECT count(*) FROM store_inventories WHERE medical_store_id = $1;`, [storeId]);
  if (parseInt(existingInv.rows[0].count, 10) > 0) {
    return;
  }

  console.log('🌱 Seeding Retail Store POS Inventory & Customers for Apollo Care Pharmacy...');

  await transaction(async (tx) => {
    // 1. Seed Customers
    const sampleCustomers = [
      { id: 'cust-01', name: 'Rajesh Sharma', phone: '9820112345', doctor: 'Dr. V. Mehta (Cardiologist)', address: 'Flat 12, Fort, Mumbai' },
      { id: 'cust-02', name: 'Priya Kulkarni', phone: '9820223456', doctor: 'Dr. S. Kulkarni (General Physician)', address: 'B-4, Colaba, Mumbai' },
      { id: 'cust-03', name: 'Amit Verma', phone: '9820334567', doctor: 'Dr. R. Singhania (Pulmonologist)', address: 'Marine Lines, Mumbai' },
      { id: 'cust-04', name: 'Sunita Patil', phone: '9820445678', doctor: 'Dr. N. Joshi (Diabetologist)', address: 'Churchgate, Mumbai' },
      { id: 'cust-05', name: 'Farhan Merchant', phone: '9820556789', doctor: 'Dr. K. Patel (Pediatrician)', address: 'Nariman Point, Mumbai' },
    ];

    for (const c of sampleCustomers) {
      await tx.query(
        `INSERT INTO customers (id, medical_store_id, name, phone, doctor_name, address)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (id) DO NOTHING;`,
        [c.id, storeId, c.name, c.phone, c.doctor, c.address]
      );
    }

    // 2. Seed Retail Store Inventory
    const medsRes = await tx.query(`SELECT * FROM medicines LIMIT 15;`);
    for (let i = 0; i < medsRes.rows.length; i++) {
      const m = medsRes.rows[i];
      const base = parseFloat(m.base_price);
      let onHand = 45 + (i * 15);
      let minThreshold = 25;
      let expDate = '2028-12-31';

      // Seed 2-3 genuine operational alerts
      if (m.brand_name.toLowerCase().includes('asthalin')) {
        onHand = 6; // Low stock
      } else if (m.brand_name.toLowerCase().includes('zifi')) {
        onHand = 0; // Out of stock
      } else if (m.brand_name.toLowerCase().includes('glycomet')) {
        expDate = new Date(Date.now() + 22 * 86400000).toISOString().split('T')[0]; // Urgent expiry
      } else if (m.brand_name.toLowerCase().includes('dolo')) {
        expDate = new Date(Date.now() + 65 * 86400000).toISOString().split('T')[0]; // Early expiry watch
      }

      const mrp = Math.round(base * 1.25);
      const unitCost = Math.round(base * 0.85);
      const sellingPrice = Math.round(base * 1.15);

      await tx.query(
        `INSERT INTO store_inventories (id, medical_store_id, medicine_id, batch_number, expiry_date, on_hand_quantity, unit_cost, mrp, selling_price, min_threshold)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (medical_store_id, medicine_id, batch_number) DO NOTHING;`,
        [
          `st-inv-${m.id}`,
          storeId,
          m.id,
          `BTH-APO-${8800 + i}`,
          expDate,
          onHand,
          unitCost,
          mrp,
          sellingPrice,
          minThreshold,
        ]
      );
    }

    // 3. Seed Initial Retail Bills for Sales Statistics
    const initialBills = [
      {
        id: 'bill-init-01',
        billNumber: 'RET-2026-8801',
        customer: sampleCustomers[0],
        paymentMode: 'UPI',
        subtotal: 1111.60,
        discount: 0,
        tax: 133.40,
        total: 1245.00,
        items: [
          { medId: 'med-01', name: 'Augmentin 625 Duo', batch: 'BTH-APO-8800', qty: 2, price: 212.75, mrp: 231.25, total: 476.56 },
          { medId: 'med-05', name: 'Dolo 650', batch: 'BTH-APO-8804', qty: 3, price: 34.50, mrp: 37.50, total: 115.92 },
          { medId: 'med-07', name: 'Pan 40', batch: 'BTH-APO-8806', qty: 3, price: 172.50, mrp: 187.50, total: 579.60 },
        ],
      },
      {
        id: 'bill-init-02',
        billNumber: 'RET-2026-8802',
        customer: sampleCustomers[1],
        paymentMode: 'CASH',
        subtotal: 607.14,
        discount: 25.00,
        tax: 72.86,
        total: 680.00,
        items: [
          { medId: 'med-02', name: 'Azee 500', batch: 'BTH-APO-8801', qty: 4, price: 128.80, mrp: 140.00, total: 577.02 },
          { medId: 'med-05', name: 'Dolo 650', batch: 'BTH-APO-8804', qty: 2, price: 34.50, mrp: 37.50, total: 77.28 },
        ],
      },
      {
        id: 'bill-init-03',
        billNumber: 'RET-2026-8803',
        customer: sampleCustomers[2],
        paymentMode: 'CARD',
        subtotal: 1919.64,
        discount: 50.00,
        tax: 230.36,
        total: 2150.00,
        items: [
          { medId: 'med-10', name: 'Huminsulin R 100IU', batch: 'BTH-APO-8809', qty: 5, price: 215.00, mrp: 235.00, total: 1204.00 },
          { medId: 'med-08', name: 'Glycomet 500 SR', batch: 'BTH-APO-8807', qty: 6, price: 42.00, mrp: 46.00, total: 282.24 },
          { medId: 'med-11', name: 'Shelcal 500', batch: 'BTH-APO-8810', qty: 4, price: 135.00, mrp: 148.00, total: 604.80 },
        ],
      },
    ];

    for (const b of initialBills) {
      await tx.query(
        `INSERT INTO retail_bills (id, bill_number, medical_store_id, customer_id, customer_name, customer_phone, doctor_name, payment_mode, subtotal, discount_amount, tax_amount, total_amount, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW() - interval '2 days')
         ON CONFLICT (id) DO NOTHING;`,
        [
          b.id,
          b.billNumber,
          storeId,
          b.customer.id,
          b.customer.name,
          b.customer.phone,
          b.customer.doctor,
          b.paymentMode,
          b.subtotal,
          b.discount,
          b.tax,
          b.total,
        ]
      );

      for (const item of b.items) {
        await tx.query(
          `INSERT INTO retail_bill_items (id, bill_id, medicine_id, brand_name, batch_number, quantity, unit_price, mrp, total_amount)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9);`,
          [
            `rbi-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
            b.id,
            item.medId,
            item.name,
            item.batch,
            item.qty,
            item.price,
            item.mrp,
            item.total,
          ]
        );
      }
    }
  });

  console.log('✅ Retail POS seed completed with verified customers, store stock, and sales bills.');
}

// Standalone execution helper
if (require.main === module) {
  initPostgres()
    .then(() => seedDatabase())
    .then(() => {
      console.log('Seeding script finished.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Seeding error:', err);
      process.exit(1);
    });
}

