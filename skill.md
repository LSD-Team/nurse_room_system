# Nurse Room System - Development Skills & Debugging Guide

## Auto Input MIN/MAX Buttons - Troubleshooting

### Scenario
ปุ่ม "Auto input MIN" และ "Auto input MAX" ในหน้า PurchaseOrders.vue ใช้งานไม่ได้

### Common Issues

#### ❌ Issue 1: ฟังก์ชัน onClick ไม่มี Parentheses
**สาเหตุ:** Vue template event binding ต้องเรียกใช้ฟังก์ชัน

**ผิด:**
```vue
<Button @click="autoInputMin" />
```

**ถูก:**
```vue
<Button @click="autoInputMin()" />
```

---

#### ❌ Issue 2: ข้อมูลที่ใช้ในฟังก์ชันไม่ได้มาจาก API
**สาเหตุ:** ลืมตรวจสอบว่า API จริงๆ ส่งข้อมูลออกมาหรือไม่

**วิธีตรวจสอบ:**

1. **เปิด Browser DevTools (F12) → Network Tab**
   - เลือก Supplier ในฟอร์ม
   - ดู API Call ไป `/po/supplier-prices/{supplierId}`
   - ตรวจสอบ Response payload มีฟิลด์ไหนบ้าง

2. **ใช้ console.log() ตรวจสอบข้อมูล**
   ```typescript
   async function onSupplierChange(): Promise<void> {
     // ... existing code ...
     supplierPrices.value = await PoService.getSupplierPrices(selectedSupplierId.value);
     console.log('Supplier Prices:', supplierPrices.value); // ← เพิ่มบรรทัดนี้
     // ... rest of code ...
   }
   ```

3. **เปิด Browser Console (F12 → Console)**
   - ค้นหา log ที่พิมพ์ออกมา
   - ตรวจสอบว่าข้อมูลมีฟิลด์ไหนบ้าง

**Example Output:**
```javascript
// ถ้ามี item_min_po, item_max_po ✅
[
  {
    item_id: 1,
    item_min_po: 20,
    item_max_po: 100,
    // ... other fields
  }
]

// ถ้าไม่มี ❌
[
  {
    item_id: 1,
    // item_min_po ไม่มี
    // item_max_po ไม่มี
    // ... other fields
  }
]
```

---

### Fix Checklist

#### ✅ ถ้าข้อมูล item_min/item_max มีจากตอนเริ่มต้น
ใช้ต่อไปตามปกติ (ข้อมูลมาจากตาราง items/stock)

```typescript
function autoInputMin(): void {
  for (const item of orderItems.value) {
    if (item.item_min != null && item.qty_base != null) {
      const calculated = item.item_min - item.qty_base;
      item.qty_order = calculated > 0 ? calculated : 0;
    }
  }
}
```

#### ✅ ถ้าต้องการใช้ item_min_po/item_max_po (จาก API)

**Step 1:** เพิ่มฟิลด์ใน Interface `ISupplierItemPrice` (client/src/interfaces/borrow.interfaces.ts)
```typescript
export interface ISupplierItemPrice {
  // ... existing fields
  item_min_po?: number | null;  // ← เพิ่มนี้
  item_max_po?: number | null;  // ← เพิ่มนี้
}
```

**Step 2:** เพิ่มฟิลด์ใน Interface `IOrderItem` (client/src/views/pages/PurchaseOrders.vue)
```typescript
interface IOrderItem {
  // ... existing fields
  item_min_po: number | null;   // ← เพิ่มนี้
  item_max_po: number | null;   // ← เพิ่มนี้
}
```

**Step 3:** ดึงค่า item_min_po/item_max_po จาก API response
```typescript
orderItems.value = supplierPrices.value.map(price => {
  const stock = stockOnHands.value.find(s => s.item_id === price.item_id);
  return {
    // ... existing fields
    item_min_po: price.item_min_po ?? null,  // ← แค่นี้ก็พอ (ไม่ต้อง as any)
    item_max_po: price.item_max_po ?? null,  // ← แค่นี้ก็พอ (ไม่ต้อง as any)
  };
});
```

**Step 4:** ใช้ item_min_po/item_max_po ในฟังก์ชัน
```typescript
function autoInputMin(): void {
  for (const item of orderItems.value) {
    if (item.item_min_po != null && item.qty_base != null) {  // ← เปลี่ยน item_min → item_min_po
      const calculated = item.item_min_po - item.qty_base;
      item.qty_order = calculated > 0 ? calculated : 0;
    }
  }
}
```

**Step 5:** แสดงค่า item_min_po/item_max_po ใน Template
```vue
<Column header="Min" style="min-width: 70px" bodyClass="text-right">
  <template #body="{ data }">
    {{ data.item_min_po != null ? formatNumber(data.item_min_po) : '-' }}
  </template>
</Column>
```

**Step 6:** ตรวจสอบ Backend API
- เปิด `/po/supplier-prices/{supplierId}` endpoint
- ตรวจสอบว่า response มี `item_min_po` และ `item_max_po` หรือไม่
- ถ้าไม่มี ต้องแก้ Backend query/view

---

## Quick Reference: Vue Event Binding

```vue
<!-- ❌ ผิด - ไม่มี parentheses -->
<Button @click="myFunction" />

<!-- ✅ ถูก - มี parentheses -->
<Button @click="myFunction()" />

<!-- ✅ ถูก - มี parameters -->
<Button @click="myFunction(item.id)" />

<!-- ✅ ถูก - inline function -->
<Button @click="() => myFunction()" />
```

---

## Testing Auto Input Buttons

### Manual Test Steps
1. เปิดหน้า PurchaseOrders.vue
2. กดปุ่ม "สร้าง PO"
3. เลือก Supplier
4. ตรวจสอบว่าตาราง item แสดงค่า Min/Max
5. กดปุ่ม "Auto input MIN" → ตรวจสอบว่า qty_order เปลี่ยนหรือไม่
6. กดปุ่ม "Auto input MAX" → ตรวจสอบว่า qty_order เปลี่ยนหรือไม่

### Expected Behavior
- ปุ่ม Auto input MIN: `qty_order = max(0, MIN - qty_base)`
- ปุ่ม Auto input MAX: `qty_order = max(0, MAX - qty_base)`

### Debug Console
```javascript
// ใน Browser Console (F12), สามารถเรียกฟังก์ชัน Vue ได้
// เพื่อดูค่า orderItems ว่ามีข้อมูลอะไรบ้าง
```

---

## 2. Approval Reload Stuck - API Timeout Handling

### Scenario
หลังจากกดปุ่มอนุมัติ หน้าแสดง "Loading..." ค้างตลอดเวลา ไม่มี response

### Root Cause
ฟังก์ชัน `loadPendingApprovals()` ไม่มี timeout หรือ error handling ที่ดี ถ้า API ติดค้าง (slow query, database lock, network issue) จะทำให้หน้าค้างตลอด

### Solution: Add Timeout & Better Error Handling

**วิธีแก้ไข:**

```typescript
async function loadPendingApprovals() {
  try {
    console.log('[loadPendingApprovals] starting...');
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('API request timeout after 30s')), 30000)
    );
    
    const data = await Promise.race([
      ApprovalService.getPendingApprovals(),
      timeoutPromise,
    ]) as IPendingApprovalItem[];
    
    console.log('[loadPendingApprovals] success, data:', data);
    pendingItems.value = data;
  } catch (error) {
    console.error('[loadPendingApprovals] error:', error);
    throw error; // Re-throw for axios interceptor
  }
}
```

**Key Changes:**
1. **Promise.race()** - เปรียบเทียบ API call กับ timeout promise
2. **30 second timeout** - ถ้าเกิน 30 วินาย จะ reject แทนที่ติดค้าง
3. **Better error logging** - ดู Browser Console เพื่อรู้ว่าเกิดข้อ error อะไร

### Testing & Debugging

**How to Check in Browser:**

1. เปิด DevTools: **F12**
2. ไปที่ **Console** Tab
3. ดู logs ที่มี `[loadPendingApprovals]`
4. ถ้าเกิด timeout จะเห็น:
   ```
   ❌ [loadPendingApprovals] error: Error: API request timeout after 30s
   ```

**If API is Slow (Backend Issue):**

1. เปิด **Network** Tab
2. กดปุ่มอนุมัติ
3. ดู request `/api/approvals/pending` ว่าใช้เวลากี่วินาที
4. ถ้า > 30 วินาที ต้องปรับ query ใน Backend

**API Endpoint ที่ต้องตรวจสอบ:**
- `GET /api/approvals/pending` - Backend: `server/src/apis/approval/approval.service.ts::getPendingApprovals()`
- Query: UNION ของ PO approvals + Borrow approvals
- ลอง run query บน SQL Server Mgmt Studio เพื่อดูว่า slow ไหม

### Better Error Handling in handleApprove()

```typescript
try {
  // ... do approval action ...
  
  try {
    await loadPendingApprovals();
  } catch (loadError) {
    console.error('[handleApprove] Error reloading:', loadError);
    // Still continue to refresh badges even if reload fails
  }
  
  // Refresh badges
  const menuNotificationsStore = useMenuNotificationsStore();
  try {
    await Promise.all([
      menuNotificationsStore.refreshApprovalPendingCount(),
      menuNotificationsStore.refreshPoPendingCount(),
      menuNotificationsStore.refreshBorrowPendingCount(),
    ]);
  } catch (badgeError) {
    console.error('[handleApprove] Error refreshing badges:', badgeError);
  }
} catch (error) {
  console.error('[handleApprove] Error:', error);
}
```

**ประโยชน์:**
- ถ้า loadPendingApprovals() ล้มเหลว ยังคงทำการ refresh badges
- Error logging ชัดเจน
- UX ไม่ติดค้าง

---

## Common Patterns

### Pattern 1: Adding a new field from API
```typescript
// 1. Add to interface
export interface IItem {
  id: number;
  name: string;
  new_field?: string;  // ← NEW
}

// 2. Map when fetching data
items.value = apiResponse.map(item => ({
  ...item,
  new_field: item.new_field ?? null,  // ← NEW
}));

// 3. Use in template
{{ item.new_field }}
```

### Pattern 2: Toggle button action
```vue
<Button @click="toggleAction()" />  <!-- ✓ with () -->

<script setup>
function toggleAction() {
  // do something
}
</script>
```

---

## Files Related to These Features

### Auto Input MIN/MAX
- `client/src/views/pages/PurchaseOrders.vue` - Main component with auto input buttons
- `client/src/services/po.service.ts` - API calls
- `client/src/interfaces/borrow.interfaces.ts` - ISupplierItemPrice interface

### Approval Reload Timeout
- `client/src/views/pages/ApprovePurchase.vue` - Approval page with loadPendingApprovals()
- `client/src/services/approval.service.ts` - API calls
- Backend API: `GET /api/approvals/pending` - Data source
- Backend Query: `server/src/apis/approval/approval.service.ts::getPendingApprovals()`
