import mongoose, { Schema, Document, Model } from 'mongoose';

// ============================================================================
// 1. USER MODEL
// ============================================================================
export interface IUser extends Document {
  email: string;
  passwordHash: string;
  role: 'MEDICAL_STORE' | 'DISTRIBUTOR' | 'ADMIN';
  status: 'PENDING' | 'APPROVED' | 'SUSPENDED' | 'REJECTED';
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['MEDICAL_STORE', 'DISTRIBUTOR', 'ADMIN'], required: true },
    status: { type: String, enum: ['PENDING', 'APPROVED', 'SUSPENDED', 'REJECTED'], default: 'PENDING' },
  },
  { timestamps: true }
);

// ============================================================================
// 2. MEDICAL STORE MODEL
// ============================================================================
export interface IMedicalStore extends Document {
  userId: mongoose.Types.ObjectId;
  storeName: string;
  licenseNumber: string;
  gstin: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  verificationStatus: 'PENDING' | 'APPROVED' | 'SUSPENDED' | 'REJECTED';
  verifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const MedicalStoreSchema = new Schema<IMedicalStore>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    storeName: { type: String, required: true, trim: true },
    licenseNumber: { type: String, required: true, unique: true, trim: true },
    gstin: { type: String, required: true, unique: true, trim: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true, index: true },
    verificationStatus: { type: String, enum: ['PENDING', 'APPROVED', 'SUSPENDED', 'REJECTED'], default: 'PENDING', index: true },
    verifiedAt: { type: Date },
  },
  { timestamps: true }
);

// ============================================================================
// 3. DISTRIBUTOR MODEL
// ============================================================================
export interface IDistributor extends Document {
  userId: mongoose.Types.ObjectId;
  companyName: string;
  licenseNumber: string;
  gstin: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  coveragePincodes: string[];
  fulfillmentRating: number;
  onTimeDeliveryRate: number;
  avgLeadTimeHours: number;
  verificationStatus: 'PENDING' | 'APPROVED' | 'SUSPENDED' | 'REJECTED';
  verifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const DistributorSchema = new Schema<IDistributor>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    companyName: { type: String, required: true, trim: true },
    licenseNumber: { type: String, required: true, unique: true, trim: true },
    gstin: { type: String, required: true, unique: true, trim: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true, index: true },
    coveragePincodes: [{ type: String }],
    fulfillmentRating: { type: Number, default: 95.0 },
    onTimeDeliveryRate: { type: Number, default: 92.0 },
    avgLeadTimeHours: { type: Number, default: 24 },
    verificationStatus: { type: String, enum: ['PENDING', 'APPROVED', 'SUSPENDED', 'REJECTED'], default: 'PENDING', index: true },
    verifiedAt: { type: Date },
  },
  { timestamps: true }
);

// ============================================================================
// 4. MEDICINE (MASTER CATALOGUE) MODEL
// ============================================================================
export interface IMedicine extends Document {
  brandName: string;
  genericName: string;
  composition: string;
  dosageForm: 'TABLET' | 'CAPSULE' | 'SYRUP' | 'INJECTION' | 'OINTMENT' | 'DROPS' | 'INHALER' | 'SUSPENSION';
  strength: string;
  packSize: string;
  manufacturer: string;
  category: string;
  rxType: 'PRESCRIPTION_RX' | 'OTC';
  storageCondition: 'ROOM_TEMPERATURE' | 'REFRIGERATED_2_8C' | 'COOL_DRY' | 'DEEP_FREEZE';
  atcCode?: string;
  createdAt: Date;
  updatedAt: Date;
}

const MedicineSchema = new Schema<IMedicine>(
  {
    brandName: { type: String, required: true, index: true, trim: true },
    genericName: { type: String, required: true, index: true, trim: true },
    composition: { type: String, required: true },
    dosageForm: {
      type: String,
      enum: ['TABLET', 'CAPSULE', 'SYRUP', 'INJECTION', 'OINTMENT', 'DROPS', 'INHALER', 'SUSPENSION'],
      required: true,
    },
    strength: { type: String, required: true },
    packSize: { type: String, required: true },
    manufacturer: { type: String, required: true, index: true },
    category: { type: String, required: true, index: true },
    rxType: { type: String, enum: ['PRESCRIPTION_RX', 'OTC'], default: 'PRESCRIPTION_RX' },
    storageCondition: {
      type: String,
      enum: ['ROOM_TEMPERATURE', 'REFRIGERATED_2_8C', 'COOL_DRY', 'DEEP_FREEZE'],
      default: 'ROOM_TEMPERATURE',
    },
    atcCode: { type: String },
  },
  { timestamps: true }
);

// ============================================================================
// 5. MEDICINE IDENTIFIER MODEL
// ============================================================================
export interface IMedicineIdentifier extends Document {
  medicineId: mongoose.Types.ObjectId;
  codeType: string; // BARCODE_EAN13, GTIN, NDC
  codeValue: string;
  createdAt: Date;
}

const MedicineIdentifierSchema = new Schema<IMedicineIdentifier>(
  {
    medicineId: { type: Schema.Types.ObjectId, ref: 'Medicine', required: true, index: true },
    codeType: { type: String, required: true },
    codeValue: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);

// ============================================================================
// 6. BATCH MODEL
// ============================================================================
export interface IBatch extends Document {
  medicineId: mongoose.Types.ObjectId;
  distributorId: mongoose.Types.ObjectId;
  batchNumber: string;
  manufacturingDate: Date;
  expiryDate: Date;
  mrp: number;
  createdAt: Date;
  updatedAt: Date;
}

const BatchSchema = new Schema<IBatch>(
  {
    medicineId: { type: Schema.Types.ObjectId, ref: 'Medicine', required: true, index: true },
    distributorId: { type: Schema.Types.ObjectId, ref: 'Distributor', required: true, index: true },
    batchNumber: { type: String, required: true, trim: true },
    manufacturingDate: { type: Date, required: true },
    expiryDate: { type: Date, required: true, index: true },
    mrp: { type: Number, required: true },
  },
  { timestamps: true }
);
BatchSchema.index({ distributorId: 1, medicineId: 1, batchNumber: 1 }, { unique: true });

// ============================================================================
// 7. INVENTORY MODEL
// ============================================================================
export interface IInventory extends Document {
  distributorId: mongoose.Types.ObjectId;
  medicineId: mongoose.Types.ObjectId;
  batchId: mongoose.Types.ObjectId;
  onHandQuantity: number;
  reservedQuantity: number;
  availableQuantity: number; // onHand - reserved
  unitCost: number;
  sellingPrice: number;
  minThreshold: number;
  lastRestockedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const InventorySchema = new Schema<IInventory>(
  {
    distributorId: { type: Schema.Types.ObjectId, ref: 'Distributor', required: true, index: true },
    medicineId: { type: Schema.Types.ObjectId, ref: 'Medicine', required: true, index: true },
    batchId: { type: Schema.Types.ObjectId, ref: 'Batch', required: true, unique: true },
    onHandQuantity: { type: Number, default: 0 },
    reservedQuantity: { type: Number, default: 0 },
    availableQuantity: { type: Number, default: 0, index: true },
    unitCost: { type: Number, required: true },
    sellingPrice: { type: Number, required: true },
    minThreshold: { type: Number, default: 20 },
    lastRestockedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);
InventorySchema.index({ distributorId: 1, medicineId: 1 });

// ============================================================================
// 8. STOCK MOVEMENT (AUDIT LEDGER) MODEL
// ============================================================================
export interface IStockMovement extends Document {
  inventoryId: mongoose.Types.ObjectId;
  batchId: mongoose.Types.ObjectId;
  movementType: 'INWARD_PURCHASE' | 'RESERVATION_HOLD' | 'RESERVATION_RELEASE' | 'ORDER_DISPATCH' | 'ADJUSTMENT' | 'RETURN';
  quantity: number;
  previousStock: number;
  newStock: number;
  referenceType?: string; // ORDER, INVOICE, MANUAL
  referenceId?: string;
  notes?: string;
  createdById?: string;
  createdAt: Date;
}

const StockMovementSchema = new Schema<IStockMovement>(
  {
    inventoryId: { type: Schema.Types.ObjectId, ref: 'Inventory', required: true, index: true },
    batchId: { type: Schema.Types.ObjectId, ref: 'Batch', required: true },
    movementType: {
      type: String,
      enum: ['INWARD_PURCHASE', 'RESERVATION_HOLD', 'RESERVATION_RELEASE', 'ORDER_DISPATCH', 'ADJUSTMENT', 'RETURN'],
      required: true,
      index: true,
    },
    quantity: { type: Number, required: true },
    previousStock: { type: Number, required: true },
    newStock: { type: Number, required: true },
    referenceType: { type: String },
    referenceId: { type: String },
    notes: { type: String },
    createdById: { type: String },
  },
  { timestamps: true }
);

// ============================================================================
// 9. ORDER MODEL
// ============================================================================
export interface IOrder extends Document {
  orderNumber: string;
  medicalStoreId: mongoose.Types.ObjectId;
  distributorId: mongoose.Types.ObjectId;
  status: 'PENDING_APPROVAL' | 'ACCEPTED' | 'REJECTED' | 'DISPATCHED' | 'DELIVERED' | 'CANCELLED';
  totalAmount: number;
  paymentStatus: 'PENDING' | 'PAID' | 'CREDIT_30_DAYS';
  idempotencyKey?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema = new Schema<IOrder>(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },
    medicalStoreId: { type: Schema.Types.ObjectId, ref: 'MedicalStore', required: true, index: true },
    distributorId: { type: Schema.Types.ObjectId, ref: 'Distributor', required: true, index: true },
    status: {
      type: String,
      enum: ['PENDING_APPROVAL', 'ACCEPTED', 'REJECTED', 'DISPATCHED', 'DELIVERED', 'CANCELLED'],
      default: 'PENDING_APPROVAL',
      index: true,
    },
    totalAmount: { type: Number, required: true },
    paymentStatus: { type: String, enum: ['PENDING', 'PAID', 'CREDIT_30_DAYS'], default: 'PENDING' },
    idempotencyKey: { type: String, unique: true, sparse: true },
    notes: { type: String },
  },
  { timestamps: true }
);

// ============================================================================
// 10. ORDER ITEM MODEL
// ============================================================================
export interface IOrderItem extends Document {
  orderId: mongoose.Types.ObjectId;
  medicineId: mongoose.Types.ObjectId;
  batchId: mongoose.Types.ObjectId;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  createdAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem>(
  {
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    medicineId: { type: Schema.Types.ObjectId, ref: 'Medicine', required: true },
    batchId: { type: Schema.Types.ObjectId, ref: 'Batch', required: true },
    quantity: { type: Number, required: true },
    unitPrice: { type: Number, required: true },
    totalPrice: { type: Number, required: true },
  },
  { timestamps: true }
);

// ============================================================================
// 11. DELIVERY MODEL
// ============================================================================
export interface IDelivery extends Document {
  orderId: mongoose.Types.ObjectId;
  trackingNumber: string;
  carrierName: string;
  status: 'SCHEDULED' | 'IN_TRANSIT' | 'DELIVERED' | 'FAILED';
  estimatedDeliveryDate: Date;
  actualDeliveryDate?: Date;
  deliveryNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DeliverySchema = new Schema<IDelivery>(
  {
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true, unique: true },
    trackingNumber: { type: String, required: true, unique: true, index: true },
    carrierName: { type: String, required: true },
    status: { type: String, enum: ['SCHEDULED', 'IN_TRANSIT', 'DELIVERED', 'FAILED'], default: 'SCHEDULED' },
    estimatedDeliveryDate: { type: Date, required: true },
    actualDeliveryDate: { type: Date },
    deliveryNotes: { type: String },
  },
  { timestamps: true }
);

// ============================================================================
// 12. RECOMMENDATION LOG MODEL
// ============================================================================
export interface IRecommendation extends Document {
  medicalStoreId: mongoose.Types.ObjectId;
  medicineId: mongoose.Types.ObjectId;
  requestedQuantity: number;
  distributorId: mongoose.Types.ObjectId;
  overallScore: number;
  stockScore: number;
  priceScore: number;
  reliabilityScore: number;
  speedScore: number;
  explanation: string;
  createdAt: Date;
}

const RecommendationSchema = new Schema<IRecommendation>(
  {
    medicalStoreId: { type: Schema.Types.ObjectId, ref: 'MedicalStore', required: true },
    medicineId: { type: Schema.Types.ObjectId, ref: 'Medicine', required: true },
    requestedQuantity: { type: Number, required: true },
    distributorId: { type: Schema.Types.ObjectId, ref: 'Distributor', required: true },
    overallScore: { type: Number, required: true },
    stockScore: { type: Number, required: true },
    priceScore: { type: Number, required: true },
    reliabilityScore: { type: Number, required: true },
    speedScore: { type: Number, required: true },
    explanation: { type: String, required: true },
  },
  { timestamps: true }
);

// ============================================================================
// 13. DEMAND HISTORY MODEL (FOR AI FORECASTING)
// ============================================================================
export interface IDemandHistory extends Document {
  medicineId: mongoose.Types.ObjectId;
  regionPincode: string;
  date: Date;
  quantityDemanded: number;
  stockoutReported: boolean;
  averageSellingPrice: number;
  createdAt: Date;
}

const DemandHistorySchema = new Schema<IDemandHistory>(
  {
    medicineId: { type: Schema.Types.ObjectId, ref: 'Medicine', required: true, index: true },
    regionPincode: { type: String, required: true, index: true },
    date: { type: Date, required: true, index: true },
    quantityDemanded: { type: Number, required: true },
    stockoutReported: { type: Boolean, default: false },
    averageSellingPrice: { type: Number, required: true },
  },
  { timestamps: true }
);
DemandHistorySchema.index({ medicineId: 1, regionPincode: 1, date: 1 }, { unique: true });

// ============================================================================
// 14. NOTIFICATION MODEL
// ============================================================================
export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  message: string;
  type: 'ORDER_STATUS' | 'LOW_STOCK' | 'EXPIRY_WARNING' | 'APPROVAL_UPDATE' | 'SYSTEM';
  isRead: boolean;
  referenceId?: string;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: ['ORDER_STATUS', 'LOW_STOCK', 'EXPIRY_WARNING', 'APPROVAL_UPDATE', 'SYSTEM'],
      required: true,
    },
    isRead: { type: Boolean, default: false, index: true },
    referenceId: { type: String },
  },
  { timestamps: true }
);

// ============================================================================
// 15. AUDIT LOG MODEL
// ============================================================================
export interface IAuditLog extends Document {
  actorId?: mongoose.Types.ObjectId;
  actorRole?: string;
  action: string;
  entityName: string;
  entityId?: string;
  previousState?: string;
  newState?: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    actorId: { type: Schema.Types.ObjectId, ref: 'User' },
    actorRole: { type: String },
    action: { type: String, required: true, index: true },
    entityName: { type: String, required: true },
    entityId: { type: String },
    previousState: { type: String },
    newState: { type: String },
    ipAddress: { type: String },
    userAgent: { type: String },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

// ============================================================================
// MODEL EXPORTS
// ============================================================================
export const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
export const MedicalStore: Model<IMedicalStore> = mongoose.models.MedicalStore || mongoose.model<IMedicalStore>('MedicalStore', MedicalStoreSchema);
export const Distributor: Model<IDistributor> = mongoose.models.Distributor || mongoose.model<IDistributor>('Distributor', DistributorSchema);
export const Medicine: Model<IMedicine> = mongoose.models.Medicine || mongoose.model<IMedicine>('Medicine', MedicineSchema);
export const MedicineIdentifier: Model<IMedicineIdentifier> = mongoose.models.MedicineIdentifier || mongoose.model<IMedicineIdentifier>('MedicineIdentifier', MedicineIdentifierSchema);
export const Batch: Model<IBatch> = mongoose.models.Batch || mongoose.model<IBatch>('Batch', BatchSchema);
export const Inventory: Model<IInventory> = mongoose.models.Inventory || mongoose.model<IInventory>('Inventory', InventorySchema);
export const StockMovement: Model<IStockMovement> = mongoose.models.StockMovement || mongoose.model<IStockMovement>('StockMovement', StockMovementSchema);
export const Order: Model<IOrder> = mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);
export const OrderItem: Model<IOrderItem> = mongoose.models.OrderItem || mongoose.model<IOrderItem>('OrderItem', OrderItemSchema);
export const Delivery: Model<IDelivery> = mongoose.models.Delivery || mongoose.model<IDelivery>('Delivery', DeliverySchema);
export const Recommendation: Model<IRecommendation> = mongoose.models.Recommendation || mongoose.model<IRecommendation>('Recommendation', RecommendationSchema);
export const DemandHistory: Model<IDemandHistory> = mongoose.models.DemandHistory || mongoose.model<IDemandHistory>('DemandHistory', DemandHistorySchema);
export const Notification: Model<INotification> = mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema);
export const AuditLog: Model<IAuditLog> = mongoose.models.AuditLog || mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
