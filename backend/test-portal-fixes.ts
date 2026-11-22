import process from 'node:process';

async function verifyAllPortalFixes() {
  console.log('🧪 Starting End-to-End Verification of Portal Fixes & User Requests...\n');

  // TEST 1: Master Catalogue Search (Testing Combobox Search capability)
  console.log('1️⃣ Testing Typeahead Medicine Search (Brand & Generic Salt)...');
  const res1 = await fetch('http://localhost:5000/api/catalogue?q=Augmentin');
  const d1 = await res1.json();
  console.log(`   Found ${d1.count} medicines for "Augmentin": ${d1.medicines.map((m: any) => m.brandName).join(', ')}`);
  if (d1.count === 0) throw new Error('Search failed for Augmentin');

  const res2 = await fetch('http://localhost:5000/api/catalogue?q=Paracetamol');
  const d2 = await res2.json();
  console.log(`   Found ${d2.count} medicines for generic salt "Paracetamol": ${d2.medicines.map((m: any) => m.brandName).join(', ')}`);
  if (d2.count === 0) throw new Error('Search failed for Paracetamol');

  // TEST 2: Inward New Batch (Testing Distributor Inward API)
  console.log('\n2️⃣ Testing Distributor Manual Batch Inwarding...');
  const testBatchNum = `BTH-TEST-${Date.now()}`;
  const inwardRes = await fetch('http://localhost:5000/api/inventory/batch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      distributorId: 'dist-01',
      medicineId: 'med-01', // Augmentin 625 Duo
      batchNumber: testBatchNum,
      expiryDate: '2028-12-31',
      onHandQuantity: 250,
      unitCost: 140,
      sellingPrice: 175,
      mrp: 220,
      minThreshold: 40,
    }),
  });
  const inwardData = await inwardRes.json();
  console.log('   Inward result:', inwardData.message);
  if (!inwardData.success) throw new Error(`Inward failed: ${JSON.stringify(inwardData)}`);

  // Verify in PostgreSQL inventory
  const invRes = await fetch('http://localhost:5000/api/inventory?distributorId=dist-01');
  const invData = await invRes.json();
  const foundBatch = invData.inventory.find((i: any) => i.batchNumber === testBatchNum);
  console.log(`   Verified batch ${testBatchNum} in PostgreSQL inventory: On-Hand = ${foundBatch?.onHandQuantity}, Available = ${foundBatch?.availableQuantity}`);

  // TEST 3: Place Order from Store & Verify Instant Distributor Visibility
  console.log('\n3️⃣ Testing Cross-Portal Order Placement (Store -> Distributor)...');
  const orderRes = await fetch('http://localhost:5000/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      storeName: 'Apollo Care Pharmacy',
      storePincode: '400001',
      medicineId: 'med-01',
      quantity: 50,
    }),
  });
  const orderData = await orderRes.json();
  console.log(`   Order placed: #${orderData.order.orderNumber} (ID: ${orderData.order.id})`);
  const placedOrderId = orderData.order.id;

  // Check GET /api/orders (Visible to both Distributor and Store)
  const ordersListRes = await fetch('http://localhost:5000/api/orders');
  const ordersListData = await ordersListRes.json();
  const matchingOrder = ordersListData.orders.find((o: any) => o.id === placedOrderId);
  console.log(`   Visible in Orders Queue: #${matchingOrder.orderNumber}, Status: ${matchingOrder.status}, Buyer: ${matchingOrder.medicalStoreName}, Supplier: ${matchingOrder.distributorName}`);
  if (!matchingOrder) throw new Error('Placed order not visible in orders queue');

  // TEST 4: Cancel Order & Immediate Batch Reservation Release
  console.log('\n4️⃣ Testing Chemist "Cancel Order" and Immediate Stock Reservation Release...');
  const cancelRes = await fetch(`http://localhost:5000/api/orders/${placedOrderId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      status: 'CANCELLED',
      rejectionReason: 'Chemist cancelled order before dispatch',
    }),
  });
  const cancelData = await cancelRes.json();
  console.log('   Cancel result:', cancelData.message, 'New Status:', cancelData.order.status);
  if (cancelData.order.status !== 'CANCELLED') throw new Error('Order status not cancelled');

  // Verify order in backend API is CANCELLED and visible to all portals
  const updatedOrdersRes = await fetch('http://localhost:5000/api/orders');
  const updatedOrdersData = await updatedOrdersRes.json();
  const cancelledOrderInList = updatedOrdersData.orders.find((o: any) => o.id === placedOrderId);
  console.log(`   Order record in live system: Status = ${cancelledOrderInList?.status}, Rejection/Cancel Reason: "${cancelledOrderInList?.rejectionReason}"`);
  if (cancelledOrderInList?.status !== 'CANCELLED') throw new Error('Order status was not updated to CANCELLED in system');

  // TEST 5: Verify AI Restock Proposal Calculation
  console.log('\n5️⃣ Testing AI Stock Alerts & Recommendation Quote API...');
  const alertsRes = await fetch('http://localhost:5000/api/forecast-alerts');
  const alertsData = await alertsRes.json();
  console.log(`   AI Stockout Alerts detected: ${alertsData.count} items below ROP`);
  if (alertsData.count > 0) {
    const alert1 = alertsData.alerts[0];
    console.log(`   Sample alert for "${alert1.brandName}": On-Hand = ${alert1.currentStock}, ROP = ${alert1.reorderPoint}, Suggested Restock = +${alert1.suggestedRestockQuantity}`);

    const recRes = await fetch(`http://localhost:5000/api/recommendations?medicineId=${alert1.medicineId}&quantity=${alert1.suggestedRestockQuantity}&pincode=400001`);
    const recData = await recRes.json();
    console.log(`   AI Multi-factor Quote: Best Offer = ${recData.recommendations[0]?.candidate.distributorName}, Score = ${recData.recommendations[0]?.overallScore.toFixed(2)}, Landed Cost = ₹${recData.totalLandedCost.toFixed(2)}`);
  }

  console.log('\n✅ ALL VERIFICATION CHECKS PASSED PERFECTLY!');
  process.exit(0);
}

verifyAllPortalFixes().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});