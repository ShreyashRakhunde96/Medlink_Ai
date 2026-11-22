import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import {
  User,
  MedicalStore,
  Distributor,
  Medicine,
  MedicineIdentifier,
  Batch,
  Inventory,
  StockMovement,
  Order,
  OrderItem,
  Delivery,
  Recommendation,
  DemandHistory,
  Notification,
  AuditLog,
} from './models';

dotenv.config();

export async function seedDatabase() {
  const uri = process.env.MONGODB_URI;
  if (!uri || uri.includes('username:password')) {
    console.error('❌ MONGODB_URI is not set in backend/.env. Please configure your MongoDB Atlas or local URI first.');
    process.exit(1);
  }

  console.log('🌱 Connecting to MongoDB for seeding...');
  await mongoose.connect(uri);
  console.log('✅ Connected to MongoDB. Clearing existing data...');

  // Clean collections in order
  await AuditLog.deleteMany({});
  await Notification.deleteMany({});
  await Recommendation.deleteMany({});
  await DemandHistory.deleteMany({});
  await Delivery.deleteMany({});
  await OrderItem.deleteMany({});
  await Order.deleteMany({});
  await StockMovement.deleteMany({});
  await Inventory.deleteMany({});
  await Batch.deleteMany({});
  await MedicineIdentifier.deleteMany({});
  await Medicine.deleteMany({});
  await MedicalStore.deleteMany({});
  await Distributor.deleteMany({});
  await User.deleteMany({});

  const passwordHash = await bcrypt.hash('Password@123', 10);
  const adminPasswordHash = await bcrypt.hash('Admin@123', 10);

  // 1. Create Admin
  const adminUser = await User.create({
    email: 'admin@medlink.io',
    passwordHash: adminPasswordHash,
    role: 'ADMIN',
    status: 'APPROVED',
  });
  console.log('✅ Admin user created: admin@medlink.io');

  // 2. Create 3 Medical Stores
  const storeData = [
    {
      email: 'apollo.chemist@medlink.io',
      name: 'Apollo Care Pharmacy',
      license: 'DL-2024-MH-APO8821',
      gstin: '27AABCA1234F1Z8',
      phone: '+91 98201 12345',
      address: 'Shop 4, Ground Floor, Nariman Point',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
    },
    {
      email: 'cityhealth.pharmacy@medlink.io',
      name: 'CityHealth 24x7 Chemist & Druggist',
      license: 'DL-2024-MH-CTY4490',
      gstin: '27BABCZ5678G2Z1',
      phone: '+91 98202 23456',
      address: 'Plot 12, FC Road, Shivajinagar',
      city: 'Pune',
      state: 'Maharashtra',
      pincode: '411001',
    },
    {
      email: 'metrolife.meds@medlink.io',
      name: 'MetroLife Drug House',
      license: 'DL-2024-MH-MTR9912',
      gstin: '27CABCD9012H3Z4',
      phone: '+91 98203 34567',
      address: 'Sector 17, Vashi',
      city: 'Navi Mumbai',
      state: 'Maharashtra',
      pincode: '400703',
    },
  ];

  const stores = [];
  for (const s of storeData) {
    const user = await User.create({
      email: s.email,
      passwordHash,
      role: 'MEDICAL_STORE',
      status: 'APPROVED',
    });

    const store = await MedicalStore.create({
      userId: user._id,
      storeName: s.name,
      licenseNumber: s.license,
      gstin: s.gstin,
      phone: s.phone,
      address: s.address,
      city: s.city,
      state: s.state,
      pincode: s.pincode,
      verificationStatus: 'APPROVED',
      verifiedAt: new Date(),
    });
    stores.push({ store, user });
  }
  console.log(`✅ ${stores.length} Medical Stores created.`);

  // 3. Create 5 Distributors
  const distributorData = [
    {
      email: 'medvantage.logistics@medlink.io',
      company: 'MedVantage Pharma Logistics',
      license: 'WDL-2024-MVL-101',
      gstin: '27AABCM9988D1Z9',
      phone: '+91 98331 44556',
      address: 'Building B3, Logistics Park, Bhiwandi',
      city: 'Thane',
      state: 'Maharashtra',
      pincode: '421302',
      coverage: ['400001', '400703', '411001', '400050'],
      rating: 98.5,
      onTimeRate: 97.2,
      leadTimeHours: 18,
    },
    {
      email: 'apex.health@medlink.io',
      company: 'Apex Global Health Distributors',
      license: 'WDL-2024-APX-202',
      gstin: '27AABCA7766K1Z3',
      phone: '+91 98332 55667',
      address: 'Industrial Estate, Andheri East',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400069',
      coverage: ['400001', '400050', '400703'],
      rating: 94.2,
      onTimeRate: 91.8,
      leadTimeHours: 24,
    },
    {
      email: 'pulselife.dist@medlink.io',
      company: 'PulseLife Distribution Network',
      license: 'WDL-2024-PLS-303',
      gstin: '27AABCP5544N1Z5',
      phone: '+91 98333 66778',
      address: 'MIDC Phase II, Chakan',
      city: 'Pune',
      state: 'Maharashtra',
      pincode: '410501',
      coverage: ['411001', '400001', '400703'],
      rating: 96.0,
      onTimeRate: 95.0,
      leadTimeHours: 14,
    },
    {
      email: 'sunrise.pharma@medlink.io',
      company: 'SunRise Healthcare Wholesalers',
      license: 'WDL-2024-SRH-404',
      gstin: '27AABCS3322R1Z7',
      phone: '+91 98334 77889',
      address: 'Warehouse Hub, Rabale',
      city: 'Navi Mumbai',
      state: 'Maharashtra',
      pincode: '400701',
      coverage: ['400001', '400703', '411001'],
      rating: 89.5,
      onTimeRate: 88.0,
      leadTimeHours: 36,
    },
    {
      email: 'biopharma.supply@medlink.io',
      company: 'BioPharma Cold-Chain Supply',
      license: 'WDL-2024-BPS-505',
      gstin: '27AABCB1199T1Z2',
      phone: '+91 98335 88990',
      address: 'Bio Park, Hinjewadi Phase 1',
      city: 'Pune',
      state: 'Maharashtra',
      pincode: '411057',
      coverage: ['400001', '400703', '411001', '400050'],
      rating: 99.1,
      onTimeRate: 98.4,
      leadTimeHours: 12,
    },
  ];

  const distributors = [];
  for (const d of distributorData) {
    const user = await User.create({
      email: d.email,
      passwordHash,
      role: 'DISTRIBUTOR',
      status: 'APPROVED',
    });

    const dist = await Distributor.create({
      userId: user._id,
      companyName: d.company,
      licenseNumber: d.license,
      gstin: d.gstin,
      phone: d.phone,
      address: d.address,
      city: d.city,
      state: d.state,
      pincode: d.pincode,
      coveragePincodes: d.coverage,
      fulfillmentRating: d.rating,
      onTimeDeliveryRate: d.onTimeRate,
      avgLeadTimeHours: d.leadTimeHours,
      verificationStatus: 'APPROVED',
      verifiedAt: new Date(),
    });
    distributors.push({ dist, user });
  }
  console.log(`✅ ${distributors.length} Distributors created.`);

  // 4. Create 32 Master Medicine Catalogue Entries
  const medicineCatalogue = [
    // Antibiotics
    {
      brandName: 'Augmentin 625 Duo',
      genericName: 'Amoxicillin + Potassium Clavulanate',
      composition: 'Amoxicillin 500mg + Clavulanic Acid 125mg',
      dosageForm: 'TABLET',
      strength: '625 mg',
      packSize: '10 Tablets Strip',
      manufacturer: 'GlaxoSmithKline Pharmaceuticals Ltd',
      category: 'Antibiotics',
      rxType: 'PRESCRIPTION_RX',
      storageCondition: 'ROOM_TEMPERATURE',
      atcCode: 'J01CR02',
    },
    {
      brandName: 'Azee 500',
      genericName: 'Azithromycin',
      composition: 'Azithromycin 500mg',
      dosageForm: 'TABLET',
      strength: '500 mg',
      packSize: '5 Tablets Strip',
      manufacturer: 'Cipla Ltd',
      category: 'Antibiotics',
      rxType: 'PRESCRIPTION_RX',
      storageCondition: 'ROOM_TEMPERATURE',
      atcCode: 'J01FA10',
    },
    {
      brandName: 'Zifi 200',
      genericName: 'Cefixime',
      composition: 'Cefixime 200mg',
      dosageForm: 'TABLET',
      strength: '200 mg',
      packSize: '10 Tablets Strip',
      manufacturer: 'FDC Ltd',
      category: 'Antibiotics',
      rxType: 'PRESCRIPTION_RX',
      storageCondition: 'ROOM_TEMPERATURE',
      atcCode: 'J01DD08',
    },
    {
      brandName: 'Cifran 500',
      genericName: 'Ciprofloxacin',
      composition: 'Ciprofloxacin Hydrochloride 500mg',
      dosageForm: 'TABLET',
      strength: '500 mg',
      packSize: '10 Tablets Strip',
      manufacturer: 'Sun Pharmaceutical Industries Ltd',
      category: 'Antibiotics',
      rxType: 'PRESCRIPTION_RX',
      storageCondition: 'ROOM_TEMPERATURE',
      atcCode: 'J01MA02',
    },
    {
      brandName: 'Doxicip 100',
      genericName: 'Doxycycline',
      composition: 'Doxycycline 100mg',
      dosageForm: 'CAPSULE',
      strength: '100 mg',
      packSize: '10 Capsules Strip',
      manufacturer: 'Cipla Ltd',
      category: 'Antibiotics',
      rxType: 'PRESCRIPTION_RX',
      storageCondition: 'ROOM_TEMPERATURE',
      atcCode: 'J01AA02',
    },

    // Analgesics & Antipyretics
    {
      brandName: 'Dolo 650',
      genericName: 'Paracetamol',
      composition: 'Paracetamol 650mg',
      dosageForm: 'TABLET',
      strength: '650 mg',
      packSize: '15 Tablets Strip',
      manufacturer: 'Micro Labs Ltd',
      category: 'Analgesics & Antipyretics',
      rxType: 'OTC',
      storageCondition: 'ROOM_TEMPERATURE',
      atcCode: 'N02BE01',
    },
    {
      brandName: 'Zerodol-P',
      genericName: 'Aceclofenac + Paracetamol',
      composition: 'Aceclofenac 100mg + Paracetamol 325mg',
      dosageForm: 'TABLET',
      strength: '100mg + 325mg',
      packSize: '10 Tablets Strip',
      manufacturer: 'Ipca Laboratories Ltd',
      category: 'Analgesics & Antipyretics',
      rxType: 'PRESCRIPTION_RX',
      storageCondition: 'ROOM_TEMPERATURE',
      atcCode: 'M01BC',
    },
    {
      brandName: 'Brufen 400',
      genericName: 'Ibuprofen',
      composition: 'Ibuprofen 400mg',
      dosageForm: 'TABLET',
      strength: '400 mg',
      packSize: '15 Tablets Strip',
      manufacturer: 'Abbott India Ltd',
      category: 'Analgesics & Antipyretics',
      rxType: 'OTC',
      storageCondition: 'ROOM_TEMPERATURE',
      atcCode: 'M01AE01',
    },
    {
      brandName: 'Ultracet',
      genericName: 'Tramadol + Paracetamol',
      composition: 'Tramadol Hydrochloride 37.5mg + Paracetamol 325mg',
      dosageForm: 'TABLET',
      strength: '37.5mg + 325mg',
      packSize: '15 Tablets Strip',
      manufacturer: 'Janssen Pharmaceuticals',
      category: 'Analgesics & Antipyretics',
      rxType: 'PRESCRIPTION_RX',
      storageCondition: 'ROOM_TEMPERATURE',
      atcCode: 'N02AJ13',
    },
    {
      brandName: 'Volini Gel',
      genericName: 'Diclofenac Diethylamine Gel',
      composition: 'Diclofenac Diethylamine 1.16% w/w',
      dosageForm: 'OINTMENT',
      strength: '1.16% w/w',
      packSize: '30g Tube',
      manufacturer: 'Sun Pharmaceutical Industries Ltd',
      category: 'Pain Relief Topical',
      rxType: 'OTC',
      storageCondition: 'COOL_DRY',
      atcCode: 'M02AA15',
    },

    // Cardiovascular
    {
      brandName: 'Telma 40',
      genericName: 'Telmisartan',
      composition: 'Telmisartan 40mg',
      dosageForm: 'TABLET',
      strength: '40 mg',
      packSize: '15 Tablets Strip',
      manufacturer: 'Glenmark Pharmaceuticals Ltd',
      category: 'Cardiovascular',
      rxType: 'PRESCRIPTION_RX',
      storageCondition: 'ROOM_TEMPERATURE',
      atcCode: 'C09CA07',
    },
    {
      brandName: 'Amlong 5',
      genericName: 'Amlodipine Besylate',
      composition: 'Amlodipine 5mg',
      dosageForm: 'TABLET',
      strength: '5 mg',
      packSize: '15 Tablets Strip',
      manufacturer: 'Micro Labs Ltd',
      category: 'Cardiovascular',
      rxType: 'PRESCRIPTION_RX',
      storageCondition: 'ROOM_TEMPERATURE',
      atcCode: 'C08CA01',
    },
    {
      brandName: 'Atorva 20',
      genericName: 'Atorvastatin',
      composition: 'Atorvastatin Calcium 20mg',
      dosageForm: 'TABLET',
      strength: '20 mg',
      packSize: '15 Tablets Strip',
      manufacturer: 'Zydus Cadila',
      category: 'Cardiovascular',
      rxType: 'PRESCRIPTION_RX',
      storageCondition: 'ROOM_TEMPERATURE',
      atcCode: 'C10AA05',
    },
    {
      brandName: 'Rosuvas 10',
      genericName: 'Rosuvastatin Calcium',
      composition: 'Rosuvastatin 10mg',
      dosageForm: 'TABLET',
      strength: '10 mg',
      packSize: '10 Tablets Strip',
      manufacturer: 'Sun Pharmaceutical Industries Ltd',
      category: 'Cardiovascular',
      rxType: 'PRESCRIPTION_RX',
      storageCondition: 'ROOM_TEMPERATURE',
      atcCode: 'C10AA07',
    },
    {
      brandName: 'Betaloc 25',
      genericName: 'Metoprolol Succinate',
      composition: 'Metoprolol Succinate Prolonged Release 25mg',
      dosageForm: 'TABLET',
      strength: '25 mg',
      packSize: '10 Tablets Strip',
      manufacturer: 'AstraZeneca Pharma India Ltd',
      category: 'Cardiovascular',
      rxType: 'PRESCRIPTION_RX',
      storageCondition: 'ROOM_TEMPERATURE',
      atcCode: 'C07AB02',
    },

    // Antidiabetics
    {
      brandName: 'Glycomet 500 SR',
      genericName: 'Metformin Hydrochloride',
      composition: 'Metformin Hydrochloride Prolonged Release 500mg',
      dosageForm: 'TABLET',
      strength: '500 mg',
      packSize: '20 Tablets Strip',
      manufacturer: 'USV Pvt Ltd',
      category: 'Antidiabetic',
      rxType: 'PRESCRIPTION_RX',
      storageCondition: 'ROOM_TEMPERATURE',
      atcCode: 'A10BA02',
    },
    {
      brandName: 'Amaryl M2',
      genericName: 'Glimepiride + Metformin',
      composition: 'Glimepiride 2mg + Metformin 500mg SR',
      dosageForm: 'TABLET',
      strength: '2mg + 500mg',
      packSize: '15 Tablets Strip',
      manufacturer: 'Sanofi India Ltd',
      category: 'Antidiabetic',
      rxType: 'PRESCRIPTION_RX',
      storageCondition: 'ROOM_TEMPERATURE',
      atcCode: 'A10BD02',
    },
    {
      brandName: 'Galvus 50',
      genericName: 'Vildagliptin',
      composition: 'Vildagliptin 50mg',
      dosageForm: 'TABLET',
      strength: '50 mg',
      packSize: '14 Tablets Strip',
      manufacturer: 'Novartis Healthcare Pvt Ltd',
      category: 'Antidiabetic',
      rxType: 'PRESCRIPTION_RX',
      storageCondition: 'ROOM_TEMPERATURE',
      atcCode: 'A10BH02',
    },
    {
      brandName: 'Forxiga 10',
      genericName: 'Dapagliflozin',
      composition: 'Dapagliflozin Propanediol 10mg',
      dosageForm: 'TABLET',
      strength: '10 mg',
      packSize: '14 Tablets Strip',
      manufacturer: 'AstraZeneca Pharma India Ltd',
      category: 'Antidiabetic',
      rxType: 'PRESCRIPTION_RX',
      storageCondition: 'ROOM_TEMPERATURE',
      atcCode: 'A10BK01',
    },
    {
      brandName: 'Huminsulin R 100IU',
      genericName: 'Human Insulin Regular (rDNA origin)',
      composition: 'Human Insulin 100 IU/ml',
      dosageForm: 'INJECTION',
      strength: '100 IU/ml',
      packSize: '10 ml Vial',
      manufacturer: 'Eli Lilly and Company',
      category: 'Antidiabetic Cold Chain',
      rxType: 'PRESCRIPTION_RX',
      storageCondition: 'REFRIGERATED_2_8C',
      atcCode: 'A10AB01',
    },

    // Gastrointestinal
    {
      brandName: 'Pan 40',
      genericName: 'Pantoprazole Sodium',
      composition: 'Pantoprazole Gastro-resistant 40mg',
      dosageForm: 'TABLET',
      strength: '40 mg',
      packSize: '15 Tablets Strip',
      manufacturer: 'Alkem Laboratories Ltd',
      category: 'Gastrointestinal',
      rxType: 'PRESCRIPTION_RX',
      storageCondition: 'ROOM_TEMPERATURE',
      atcCode: 'A02BC02',
    },
    {
      brandName: 'Razo-D',
      genericName: 'Rabeprazole + Domperidone',
      composition: 'Rabeprazole Sodium 20mg + Domperidone 30mg SR',
      dosageForm: 'CAPSULE',
      strength: '20mg + 30mg',
      packSize: '10 Capsules Strip',
      manufacturer: 'Dr Reddy’s Laboratories Ltd',
      category: 'Gastrointestinal',
      rxType: 'PRESCRIPTION_RX',
      storageCondition: 'ROOM_TEMPERATURE',
      atcCode: 'A02BC04',
    },
    {
      brandName: 'Omez 20',
      genericName: 'Omeprazole',
      composition: 'Omeprazole Gastro-resistant 20mg',
      dosageForm: 'CAPSULE',
      strength: '20 mg',
      packSize: '20 Capsules Strip',
      manufacturer: 'Dr Reddy’s Laboratories Ltd',
      category: 'Gastrointestinal',
      rxType: 'OTC',
      storageCondition: 'ROOM_TEMPERATURE',
      atcCode: 'A02BC01',
    },
    {
      brandName: 'Emeset 4',
      genericName: 'Ondansetron Hydrochloride',
      composition: 'Ondansetron 4mg',
      dosageForm: 'TABLET',
      strength: '4 mg',
      packSize: '10 Tablets Strip',
      manufacturer: 'Cipla Ltd',
      category: 'Gastrointestinal Antiemetic',
      rxType: 'PRESCRIPTION_RX',
      storageCondition: 'ROOM_TEMPERATURE',
      atcCode: 'A04AA01',
    },
    {
      brandName: 'Sucrafil Suspension',
      genericName: 'Sucralfate',
      composition: 'Sucralfate 1000mg per 5ml',
      dosageForm: 'SUSPENSION',
      strength: '1000mg/5ml',
      packSize: '200 ml Bottle',
      manufacturer: 'Fourrts India Laboratories Pvt Ltd',
      category: 'Gastrointestinal',
      rxType: 'PRESCRIPTION_RX',
      storageCondition: 'ROOM_TEMPERATURE',
      atcCode: 'A02BX02',
    },

    // Respiratory & Antiallergic
    {
      brandName: 'Montair-LC',
      genericName: 'Montelukast Sodium + Levocetirizine',
      composition: 'Montelukast 10mg + Levocetirizine Dihydrochloride 5mg',
      dosageForm: 'TABLET',
      strength: '10mg + 5mg',
      packSize: '10 Tablets Strip',
      manufacturer: 'Cipla Ltd',
      category: 'Respiratory & Antiallergic',
      rxType: 'PRESCRIPTION_RX',
      storageCondition: 'ROOM_TEMPERATURE',
      atcCode: 'R03DC',
    },
    {
      brandName: 'Levocet 5',
      genericName: 'Levocetirizine',
      composition: 'Levocetirizine Hydrochloride 5mg',
      dosageForm: 'TABLET',
      strength: '5 mg',
      packSize: '10 Tablets Strip',
      manufacturer: 'Hetero Healthcare Ltd',
      category: 'Respiratory & Antiallergic',
      rxType: 'OTC',
      storageCondition: 'ROOM_TEMPERATURE',
      atcCode: 'R06AE09',
    },
    {
      brandName: 'Budecort 200 Inhaler',
      genericName: 'Budesonide',
      composition: 'Budesonide 200mcg per actuation',
      dosageForm: 'INHALER',
      strength: '200 mcg',
      packSize: '200 Metered Doses Canister',
      manufacturer: 'Cipla Ltd',
      category: 'Respiratory & Inhaler',
      rxType: 'PRESCRIPTION_RX',
      storageCondition: 'ROOM_TEMPERATURE',
      atcCode: 'R03BA02',
    },
    {
      brandName: 'Asthalin Inhaler',
      genericName: 'Salbutamol (Albuterol)',
      composition: 'Salbutamol 100mcg per actuation',
      dosageForm: 'INHALER',
      strength: '100 mcg',
      packSize: '200 Metered Doses Canister',
      manufacturer: 'Cipla Ltd',
      category: 'Respiratory & Inhaler',
      rxType: 'PRESCRIPTION_RX',
      storageCondition: 'ROOM_TEMPERATURE',
      atcCode: 'R03CC02',
    },
    {
      brandName: 'Ascoril LS Syrup',
      genericName: 'Levosalbutamol + Ambroxol + Guaiphenesin',
      composition: 'Levosalbutamol 1mg + Ambroxol 30mg + Guaiphenesin 50mg/5ml',
      dosageForm: 'SYRUP',
      strength: '1mg+30mg+50mg/5ml',
      packSize: '100 ml Bottle',
      manufacturer: 'Glenmark Pharmaceuticals Ltd',
      category: 'Cough & Cold',
      rxType: 'PRESCRIPTION_RX',
      storageCondition: 'ROOM_TEMPERATURE',
      atcCode: 'R05CA',
    },

    // Vitamins & Minerals
    {
      brandName: 'Shelcal 500',
      genericName: 'Calcium Carbonate + Vitamin D3',
      composition: 'Elemental Calcium 500mg + Vitamin D3 250 IU',
      dosageForm: 'TABLET',
      strength: '500 mg + 250 IU',
      packSize: '15 Tablets Strip',
      manufacturer: 'Torrent Pharmaceuticals Ltd',
      category: 'Nutritional & Vitamins',
      rxType: 'OTC',
      storageCondition: 'ROOM_TEMPERATURE',
      atcCode: 'A12AX',
    },
    {
      brandName: 'Neurobion Forte',
      genericName: 'Vitamin B-Complex with B12',
      composition: 'Thiamine, Riboflavin, Pyridoxine, Cyanocobalamin, Nicotinamide',
      dosageForm: 'TABLET',
      strength: 'Multivitamin Complex',
      packSize: '30 Tablets Strip',
      manufacturer: 'Procter & Gamble Health Ltd',
      category: 'Nutritional & Vitamins',
      rxType: 'OTC',
      storageCondition: 'ROOM_TEMPERATURE',
      atcCode: 'A11EA',
    },
  ];

  const createdMedicines = [];
  for (const m of medicineCatalogue) {
    const med = await Medicine.create(m as any);
    const barcode = `890${Math.floor(1000000000 + Math.random() * 9000000000)}`;
    await MedicineIdentifier.create({
      medicineId: med._id,
      codeType: 'BARCODE_EAN13',
      codeValue: barcode,
    });
    createdMedicines.push(med);
  }
  console.log(`✅ ${createdMedicines.length} Standardized Medicines created.`);

  // 5. Seed Batches and Inventories across the 5 Distributors
  const basePrices: Record<string, number> = {
    'Augmentin 625 Duo': 185.0,
    'Azee 500': 112.0,
    'Zifi 200': 105.0,
    'Cifran 500': 42.0,
    'Doxicip 100': 68.0,
    'Dolo 650': 31.5,
    'Zerodol-P': 55.0,
    'Brufen 400': 18.0,
    'Ultracet': 195.0,
    'Volini Gel': 120.0,
    'Telma 40': 140.0,
    'Amlong 5': 48.0,
    'Atorva 20': 210.0,
    'Rosuvas 10': 175.0,
    'Betaloc 25': 92.0,
    'Glycomet 500 SR': 45.0,
    'Amaryl M2': 188.0,
    'Galvus 50': 240.0,
    'Forxiga 10': 690.0,
    'Huminsulin R 100IU': 380.0,
    'Pan 40': 130.0,
    'Razo-D': 165.0,
    'Omez 20': 52.0,
    'Emeset 4': 38.0,
    'Sucrafil Suspension': 195.0,
    'Montair-LC': 160.0,
    'Levocet 5': 42.0,
    'Budecort 200 Inhaler': 340.0,
    'Asthalin Inhaler': 165.0,
    'Ascoril LS Syrup': 115.0,
    'Shelcal 500': 118.0,
    'Neurobion Forte': 38.5,
  };

  const batches = [];
  const inventories = [];
  let batchSeq = 1000;

  for (const { dist } of distributors) {
    for (const med of createdMedicines) {
      if (Math.random() < 0.15 && med.brandName !== 'Augmentin 625 Duo' && med.brandName !== 'Dolo 650') {
        continue;
      }

      batchSeq++;
      const batchNum = `BTH-${dist.companyName.substring(0, 3).toUpperCase()}-${batchSeq}`;

      const expiryMonths = 6 + Math.floor(Math.random() * 18);
      const expiryDate = new Date();
      expiryDate.setMonth(expiryDate.getMonth() + expiryMonths);

      const mfgDate = new Date();
      mfgDate.setMonth(mfgDate.getMonth() - (4 + Math.floor(Math.random() * 8)));

      const basePrice = basePrices[med.brandName] || 100.0;
      const variance = (Math.random() * 0.14) - 0.07;
      const sellingPrice = parseFloat((basePrice * (1 + variance)).toFixed(2));
      const unitCost = parseFloat((sellingPrice * 0.82).toFixed(2));
      const mrp = parseFloat((sellingPrice * 1.25).toFixed(2));

      const onHand = 150 + Math.floor(Math.random() * 850);
      const reserved = Math.floor(Math.random() * 25);
      const available = onHand - reserved;

      const batch = await Batch.create({
        medicineId: med._id,
        distributorId: dist._id,
        batchNumber: batchNum,
        manufacturingDate: mfgDate,
        expiryDate: expiryDate,
        mrp: mrp,
      });
      batches.push(batch);

      const inv = await Inventory.create({
        distributorId: dist._id,
        medicineId: med._id,
        batchId: batch._id,
        onHandQuantity: onHand,
        reservedQuantity: reserved,
        availableQuantity: available,
        unitCost: unitCost,
        sellingPrice: sellingPrice,
        minThreshold: 50,
      });
      inventories.push(inv);

      await StockMovement.create({
        inventoryId: inv._id,
        batchId: batch._id,
        movementType: 'INWARD_PURCHASE',
        quantity: onHand,
        previousStock: 0,
        newStock: onHand,
        referenceType: 'MANUFACTURER_INVOICE',
        referenceId: `INV-MFR-${batchSeq}`,
        notes: 'Initial warehouse intake',
      });
    }
  }

  console.log(`✅ ${batches.length} Batches and ${inventories.length} Inventory records created.`);

  // 6. Seed Sample Orders in different lifecycle states
  const orderStates: Array<'DELIVERED' | 'ACCEPTED' | 'DISPATCHED' | 'PENDING_APPROVAL' | 'CANCELLED'> = [
    'DELIVERED',
    'ACCEPTED',
    'DISPATCHED',
    'PENDING_APPROVAL',
    'CANCELLED',
  ];

  let orderCount = 0;
  for (const { store } of stores) {
    for (let i = 0; i < 3; i++) {
      orderCount++;
      const assignedDistributor = distributors[(orderCount - 1) % distributors.length].dist;
      const status = orderStates[(orderCount - 1) % orderStates.length];
      const orderNumber = `ORD-2026-${String(orderCount).padStart(5, '0')}`;

      const distInvs = inventories.filter((inv) => inv.distributorId.toString() === assignedDistributor._id.toString());
      if (distInvs.length === 0) continue;

      const selectedInvs = distInvs.slice(0, 2);
      let totalAmount = 0;

      const order = await Order.create({
        orderNumber,
        medicalStoreId: store._id,
        distributorId: assignedDistributor._id,
        status: status,
        totalAmount: 0,
        paymentStatus: status === 'DELIVERED' ? 'PAID' : 'CREDIT_30_DAYS',
        idempotencyKey: `IDEMP-${orderNumber}`,
        notes: `Routine pharmacy stock order #${orderCount}`,
      });

      for (const inv of selectedInvs) {
        const qty = 20 + Math.floor(Math.random() * 30);
        const lineTotal = parseFloat((qty * inv.sellingPrice).toFixed(2));
        totalAmount += lineTotal;

        await OrderItem.create({
          orderId: order._id,
          medicineId: inv.medicineId,
          batchId: inv.batchId,
          quantity: qty,
          unitPrice: inv.sellingPrice,
          totalPrice: lineTotal,
        });
      }

      order.totalAmount = parseFloat(totalAmount.toFixed(2));
      await order.save();

      if (status === 'DISPATCHED' || status === 'DELIVERED') {
        const estDelivery = new Date();
        estDelivery.setDate(estDelivery.getDate() + 1);

        await Delivery.create({
          orderId: order._id,
          trackingNumber: `TRK-MED-${orderCount}${Math.floor(1000 + Math.random() * 9000)}`,
          carrierName: 'SwiftMed Cold-Chain Logistics',
          status: status === 'DELIVERED' ? 'DELIVERED' : 'IN_TRANSIT',
          estimatedDeliveryDate: estDelivery,
          actualDeliveryDate: status === 'DELIVERED' ? new Date() : undefined,
          deliveryNotes: 'Temperature verified (15°C - 25°C pharma standard)',
        });
      }
    }
  }

  console.log(`✅ ${orderCount} Sample orders created across multiple states.`);

  // 7. Seed Synthetic Demand History (Past 60 Days)
  const sampleMedicines = createdMedicines.slice(0, 6);
  const samplePincodes = ['400001', '411001', '400703'];
  let demandCount = 0;

  for (const med of sampleMedicines) {
    for (const pincode of samplePincodes) {
      for (let day = 60; day >= 1; day--) {
        const date = new Date();
        date.setDate(date.getDate() - day);
        date.setHours(0, 0, 0, 0);

        const dayOfWeek = date.getDay();
        const weekendFactor = dayOfWeek === 0 || dayOfWeek === 6 ? 0.7 : 1.2;
        const randomFactor = 0.8 + Math.random() * 0.4;
        const baseQty = med.category === 'Antibiotics' ? 50 : 80;
        const qtyDemanded = Math.round(baseQty * weekendFactor * randomFactor);

        await DemandHistory.create({
          medicineId: med._id,
          regionPincode: pincode,
          date: date,
          quantityDemanded: qtyDemanded,
          stockoutReported: Math.random() < 0.05,
          averageSellingPrice: basePrices[med.brandName] || 100.0,
        });
        demandCount++;
      }
    }
  }

  console.log(`✅ ${demandCount} Synthetic Demand History entries created.`);

  // 8. Seed Notifications & Audit Log
  await Notification.create({
    userId: stores[0].user._id,
    title: 'Order ORD-2026-00001 Delivered',
    message: 'Your medicine supply shipment has arrived at Apollo Care Pharmacy.',
    type: 'ORDER_STATUS',
    isRead: false,
  });

  await Notification.create({
    userId: distributors[0].user._id,
    title: 'New Purchase Order Received',
    message: 'Apollo Care Pharmacy has placed order ORD-2026-00004 awaiting acceptance.',
    type: 'ORDER_STATUS',
    isRead: false,
  });

  await AuditLog.create({
    actorId: adminUser._id,
    actorRole: 'ADMIN',
    action: 'SYSTEM_SEEDED',
    entityName: 'Database',
    entityId: 'ALL',
    newState: JSON.stringify({ stores: stores.length, distributors: distributors.length, medicines: createdMedicines.length }),
    ipAddress: '127.0.0.1',
    userAgent: 'MedLink Seeding Engine (MongoDB)',
  });

  console.log('🎉 MongoDB Database Seeding Finished Successfully!');
  await mongoose.disconnect();
}

if (require.main === module) {
  seedDatabase().catch((err) => {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  });
}
