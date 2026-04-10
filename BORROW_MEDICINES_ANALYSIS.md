# รายงานศึกษาโปรเจค Nurse Room System - BorrowMedicines.vue

**วัน: 9 เมษายน 2026**

---

## 📋 สารบัญ
1. [Utility Functions](#utility-functions)
2. [Interface & Type Definitions](#interface--type-definitions)
3. [Dialog Templates](#dialog-templates)
4. [Print Button Implementation](#print-button-implementation)
5. [ปัญหาและข้อแนะนำ](#ปัญหาและข้อแนะนำ)

---

## 🔧 Utility Functions

### 1. ❌ **formatDate()** - ⚠️ ไม่ได้ define ในไฟล์
**ตำแหน่งใช้งาน:**
- Line 224: `${formatDate(detailBorrow.value.borrow_date)}`
- Line 754: `{{ formatDate(data.borrow_date) }}`
- Line 1082: `{{ formatDate(detailBorrow.borrow_date) }}`

**ใช้เพื่อ:** แปลง ISO date string เป็นรูปแบบที่อ่านง่าย

**ผลที่ควรได้:**
```
"2024-04-09" → "09/04/2024" หรือ "09 เมษายน 2567"
```

---

### 2. ❌ **formatNumber()** - ⚠️ ไม่ได้ define ในไฟล์
**ตำแหน่งใช้งาน (12 locations):**
- Line 170: `฿${formatNumber(line.unit_price)}`
- Line 171: `฿${formatNumber(line.total_price)}`
- Line 246: `฿${formatNumber(grandTotal)}`
- Line 902: `{{ formatNumber(selectedItemInfo.unit_price) }}`
- Line 910: `{{ formatNumber(selectedItemOnHand.qty_base) }}`
- Line 922: `{{ formatNumber(option.unit_price) }}`
- Line 985-986: Onhand calculation
- Line 1000: `฿{{ formatNumber(data.unit_price ?? 0) }}`
- Line 1010: `฿{{ formatNumber(data.total_price ?? 0) }}`
- Line 1032: `฿{{ formatNumber(formTotalAmount) }}`
- Line 1163: `฿{{ formatNumber(data.unit_price) }}`
- Line 1173: `฿{{ formatNumber(data.total_price) }}`

**ใช้เพื่อ:** Format เลขทศนิยมให้เอาท์พุตหรือรูปแบบเงิน

**ผลที่ควรได้:**
```
1234.5678 → "1,234.57" หรือ "1,234.58"
0 → "0.00"
```

---

### 3. ✅ **statusSeverity()** - Line 350
```typescript
function statusSeverity(status: string): string {
  const map: Record<string, string> = {
    DRAFT: 'secondary',
    PENDING_APPROVAL: 'warn',
    APPROVED_L1: 'info',
    APPROVED_L2: 'info',
    APPROVED: 'success',
    RECEIVED: 'success',
    SETTLED: 'contrast',
    CANCELLED: 'danger',
  };
  return map[status] || 'secondary';
}
```
**ใช้:** ส่งคืน severity level สำหรับ Tag component

---

### 4. ✅ **statusLabel()** - Line 366
```typescript
function statusLabel(status: string): string {
  const map: Record<string, string> = {
    DRAFT: 'DRAFT',
    PENDING_APPROVAL: 'PENDING_APPROVAL',
    APPROVED_L1: 'APPROVED_L1',
    APPROVED_L2: 'APPROVED_L2',
    APPROVED: 'APPROVED',
    RECEIVED: 'RECEIVED',
    SETTLED: 'SETTLED',
    CANCELLED: 'CANCELLED',
  };
  return map[status] || status;
}
```
**ใช้:** ส่งคืน label สำหรับแสดงสถานะ

---

### 5. ✅ **logActionIcon()** - Line 596
```typescript
function logActionIcon(action: string): string {
  const map: Record<string, string> = {
    SUBMIT: 'pi pi-send',
    APPROVE: 'pi pi-check',
    REJECT: 'pi pi-times',
    REWORK: 'pi pi-replay',
  };
  return map[action] || 'pi pi-circle';
}
```
**ใช้:** ส่งคืน PrimeVue icon class สำหรับ approval timeline

---

### 6. ✅ **logActionColor()** - Line 603
```typescript
function logActionColor(action: string): string {
  const map: Record<string, string> = {
    SUBMIT: '#3B82F6',     // Blue
    APPROVE: '#22C55E',    // Green
    REJECT: '#EF4444',     // Red
    REWORK: '#F59E0B',     // Amber
  };
  return map[action] || '#6B7280';
}
```
**ใช้:** ส่งคืน hex color code

---

### 7. ✅ **logActionLabel()** - Line 611
```typescript
function logActionLabel(action: string): string {
  const map: Record<string, string> = {
    SUBMIT: 'ส่งอนุมัติ',
    APPROVE: 'อนุมัติ',
    REJECT: 'ปฏิเสธ',
    REWORK: 'ส่งกลับแก้ไข',
  };
  return map[action] || action;
}
```

---

### 8. ✅ **getErrorMessage()** - Line 65
```typescript
function getErrorMessage(err: unknown): string {
  if (err instanceof Error) {
    return err.message;
  }
  if (typeof err === 'object' && err !== null && 'response' in err) {
    const apiError = err as { response?: { data?: { message?: string } } };
    return apiError.response?.data?.message || String(err);
  }
  return String(err);
}
```
**ใช้:** Extract error message จาก various error types

---

## 📊 Interface & Type Definitions

### ตำแหน่ง: `src/interfaces/borrow.interfaces.ts`

#### **IBorrowHeader** (Borrow Document Header)
```typescript
{
  borrow_id: number;              // Primary Key
  borrow_no: string;              // เลขที่เอกสาร
  borrow_date: string;            // ISO 8601 date
  borrow_status: string;          // DRAFT | PENDING_APPROVAL | APPROVED | RECEIVED | SETTLED | CANCELLED
  
  supplier_id: number;
  supplier_code: string;
  supplier_name: string;
  
  approval_level: number | null;  // 1, 2, etc.
  approval_role: string | null;   // ชื่อบทบาท
  approval_status: string | null;
  
  actioned_by: string | null;
  actioned_by_eng_name: string | null;
  actioned_at: string | null;     // ISO 8601 timestamp
  
  created_by_eng_name: string | null;
  remark: string | null;
}
```

#### **IBorrowLine** (Borrow Item Line)
```typescript
{
  borrow_id: number;
  borrow_no: string;
  borrow_line_id: number;
  
  item_id: number;
  item_code: string;
  item_name_th: string;           // ชื่อไทย
  item_name_en: string;           // ชื่ออังกฤษ
  
  usage_unit_code: string;
  usage_unit_name_th: string;
  
  purchase_unit_code: string;     // หน่วยการซื้อ
  purchase_unit_name_th: string;
  
  qty_borrow: number;             // จำนวนที่ยืม
  unit_price: number;             // ราคาต่อหน่วย
  total_price: number;            // รวม = qty * price
  
  po_line_id: number | null;      // PO reference
  note: string | null;
  
  // Metadata
  created_by: string;
  created_at: string;
  updated_by: string | null;
  updated_at: string | null;
}
```

#### **ISupplier** (Dropdown Options)
```typescript
{
  supplier_id: number;
  supplier_code: string;
  supplier_name: string;
}
```

#### **ISupplierItemPrice** (Item Price per Supplier)
```typescript
{
  supplier_id: number;
  supplier_code: string;
  supplier_name: string;
  
  item_id: number;
  item_code: string;
  item_name_th: string;
  item_name_en: string;
  
  unit_id: number;
  unit_code: string;
  unit_name_th: string;
  unit_name_en: string;
  
  unit_price: number;
  conversion_factor: number;
  
  effective_date: string;         // วันที่มีผล
  expire_date: string | null;     // วันสิ้นสุด (null = ไม่มีกำหนด)
}
```

#### **IBorrowLineForm** (Form Data Model)
```typescript
{
  item_id: number;
  qty: number;
  
  // Display only fields
  item_code?: string;
  item_name_th?: string;
  item_name_en?: string;
  unit_name_th?: string;
  unit_price?: number;
  total_price?: number;
}
```

#### **IBorrowApprovalLog** (Approval Timeline)
```typescript
{
  action: string;                 // SUBMIT | APPROVE | REJECT | REWORK
  approval_role: string;          // บทบาท
  actioned_by: string;
  actioned_by_name: string;
  actioned_at: string;            // ISO 8601
  remark: string | null;
}
```

---

## 🎨 Dialog Templates

### Dialog 1: สร้าง/แก้ไข Borrow (`showFormDialog`)

**ตำแหน่ง:** Line 873-1040

**Props:**
```vue
<Dialog
  v-model:visible="showFormDialog"
  :header="isEditing ? 'แก้ไข' : 'สร้างรายการยืมยา'"
  modal
  :style="{ width: '1000px' }"
  :closable="true"
/>
```

**Sections:**
1. **Supplier Selection** (Required *)
   - Select component
   - Options from `suppliers` array
   - Disabled when editing
   - onChange → `onSupplierChange()`

2. **Note (Optional)**
   - Textarea (2 rows)
   - Bound to `formNote`

3. **Add Item Section** (ถ้าเลือก supplier)
   - Select: Available items (filtered)
   - Display: Item info with price & onhand stock
   - Button: Add (+) ไปที่ formLines

4. **Items DataTable** (ถ้า formLines.length > 0)
   - Columns: Item Name (TH+EN) | Qty | Unit | Onhand | Price/Unit | Total
   - Editable Qty with InputNumber
   - Action: Remove button

5. **Total Summary**
   - Display: รวมทั้งหมด: ฿{formTotalAmount}

**Footer:**
- Cancel button
- Save button (label เปลี่ยน เมื่อ isEditing)

---

### Dialog 2: ดูรายละเอียด (`showDetailDialog`)

**ตำแหน่ง:** Line 1042-1195

**Props:**
```vue
<Dialog
  v-model:visible="showDetailDialog"
  modal
  :style="{ width: '850px' }"
  :closable="true"
/>
```

**Header:**
```vue
<template #header>
  <div class="flex justify-between items-center w-full gap-4">
    <span>รายละเอียดการยืมยา</span>
    <Button
      icon="pi pi-print"
      label="Print"
      severity="info"
      size="small"
      @click="printBorrow"
    />
  </div>
</template>
```

**Sections:**

1. **Header Info** (Grid 2 columns)
   - Document No. | Borrow Date
   - Supplier | Status (Tag)
   - Approval Role + Level
   - Remark (if exists)

2. **Items DataTable**
   - Columns: # | Code | Name (TH+EN) | Qty | Unit | Price/Unit | Total
   - Display only (read-only)

3. **Approval Timeline** (ถ้า borrow_status !== 'DRAFT')
   - Timeline component with:
     - Action marker (icon + color)
     - Action label (tag)
     - Approval role
     - Actioned by + timestamp
     - Remark comment (if exists)

---

## 🖨️ Print Button Implementation

### ✅ Status: Already Implemented

**ฟังก์ชัน:** `printBorrow()` - Line 131-270

**อัลกอริทม:**
1. Validate data exists
2. Open new browser window
3. Generate HTML template:
   - Header: "ใบสั่งซื้อยา" + "Pharmaceutical Purchase Order"
   - Company info
   - Items table with formatting
   - Grand total
   - Signature boxes (2 columns)
4. Trigger native print dialog
5. Window closes after printing

**Template Features:**
```html
<!-- Header -->
<h1>ใบสั่งซื้อยา</h1>
<p>Pharmaceutical Purchase Order</p>

<!-- Info Grid (2 cols) -->
Document No. | Supplier | Date | Created by | ...

<!-- Items Table -->
# | Code | Name (TH/EN) | Qty | Unit | Price/Unit | Total

<!-- Grand Total Row -->
<tr class="total-row">
  <td colspan="6">Grand Total / รวมทั้งสิ้น</td>
  <td>฿${formatNumber(grandTotal)}</td>
</tr>

<!-- Signature Section -->
Requestor | Pharmacy (2 signature boxes with date fields)
```

**CSS Styling:**
- Print media queries: `@media print { body { padding: 0; } }`
- Table borders: `1px solid #999`
- Clean typography: Trebuchet MS / Arial
- Professional layout with proper spacing

---

## ⚠️ ปัญหาและข้อแนะนำ

### 🔴 **ปัญหา #1: Missing formatDate() & formatNumber() Functions**

**ความเสีย:** 
- ฟังก์ชันไม่ได้ define แต่ใช้งานอยู่ 12 ที่
- ผลลัพธ์: TypeError at runtime

**แนวทางแก้:**

#### ตัวเลือก A: Define ในไฟล์เดียวกัน (Simple)
```typescript
// Add after imports, before state definitions
function formatDate(dateString: string): string {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

function formatNumber(value: number | undefined): string {
  if (value == null) return '0.00';
  return new Intl.NumberFormat('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}
```

**ผลลัพธ์:**
```
formatDate('2024-04-09') 
→ "09 เมษายน 2567"

formatNumber(1234.5) 
→ "1,234.50"
```

---

#### ตัวเลือก B: Create Utils File (Best Practice) ✅ แนะนำ
```typescript
// src/utils/format.utils.ts
export function formatDate(dateString: string): string {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

export function formatNumber(value?: number | null): string {
  if (value == null) return '0.00';
  return new Intl.NumberFormat('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

export function formatCurrency(value?: number | null): string {
  if (value == null) return '฿0.00';
  return `฿${formatNumber(value)}`;
}
```

**Usage in BorrowMedicines.vue:**
```typescript
import { formatDate, formatNumber, formatCurrency } from '@/utils/format.utils';
```

---

#### ตัวเลือก C: Create Composable (Vue 3 Style) ✅ Best
```typescript
// src/composables/useFormatting.ts
export function useFormatting() {
  const formatDate = (dateString: string): string => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatNumber = (value?: number | null): string => {
    if (value == null) return '0.00';
    return new Intl.NumberFormat('th-TH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const formatCurrency = (value?: number | null): string => {
    if (value == null) return '฿0.00';
    return `฿${formatNumber(value)}`;
  };

  return { formatDate, formatNumber, formatCurrency };
}
```

**Usage in BorrowMedicines.vue:**
```typescript
import { useFormatting } from '@/composables/useFormatting';

export default {
  setup() {
    const { formatDate, formatNumber, formatCurrency } = useFormatting();
    return { formatDate, formatNumber, formatCurrency };
  }
}
```

---

### 🟡 **ปัญหา #2: Print Function Uses Undefined Formatters**

**ที่ตั้ง:** Lines 170, 171, 224, 246 (inside printBorrow)

**แนวทางแก้:** หลังจาก implement formatDate/formatNumber ฟังก์ชัน printBorrow จะทำงานได้

---

### 🟢 **ข้อแนะนำ #1: Add เพิ่มเติม Formatting Options**

```typescript
// Additional format functions
export function formatPhoneNumber(phone: string): string {
  return phone.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
}

export function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function formatItemDisplay(itemCode: string, itemNameTh: string): string {
  return `${itemCode} - ${itemNameTh}`;
}
```

---

### 🟢 **ข้อแนะนำ #2: Add Print Preview Before Printing**

**ตัวเลือก:** Add dialog ให้ preview ก่อนพิมพ์

```typescript
const showPrintPreview = ref(false);
const printContent = ref('');

function preparePrint(): void {
  if (!detailBorrow.value) return;
  // Generate HTML → printContent.value
  showPrintPreview.value = true;
}

function executePrint(): void {
  const printWindow = window.open('', '', 'width=900,height=1200');
  if (!printWindow) return;
  printWindow.document.write(printContent.value);
  printWindow.document.close();
  printWindow.print();
}
```

---

### 🟢 **ข้อแนะนำ #3: Export to PDF**

เพิ่ม button export PDF ด้านข้าง Print button:

```typescript
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

async function exportToPDF(): Promise<void> {
  if (!detailBorrow.value) return;
  
  const element = document.getElementById('print-container');
  const canvas = await html2canvas(element);
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });
  
  const imgData = canvas.toDataURL('image/png');
  pdf.addImage(imgData, 'PNG', 10, 10, 190, 277);
  pdf.save(`borrow-${detailBorrow.value.borrow_no}.pdf`);
}
```

---

## 📝 สรุปการใช้งาน Print Button

| ลำดับ | ขั้นตอน | รายละเอียด |
|------|-------|----------|
| 1 | เปิด Detail Dialog | Click ชื่อเอกสาร ในตาราง |
| 2 | ดูข้อมูลเอกสาร | Tab รายละเอียดการยืมยา |
| 3 | Click Print Button | ที่หัว Dialog (icon pi pi-print) |
| 4 | ตรวจสอบ Browser Print Dialog | ตรวจสอบ printer + settings |
| 5 | Click Print | ส่งงานพิมพ์ไปยัง printer |

---

## 📁 File Structure Summary

```
src/
├── views/pages/
│   └── BorrowMedicines.vue          ← Main component
├── interfaces/
│   └── borrow.interfaces.ts         ← IBorrowHeader, IBorrowLine, etc.
├── services/
│   ├── borrow.service.ts
│   ├── approval.service.ts
│   └── stock.service.ts
├── utils/
│   ├── employee-image.utils.ts      ← Existing utility
│   └── format.utils.ts              ← ✅ Should create
└── composables/
    └── useFormatting.ts              ← ✅ Alternative approach
```

---

## 📌 Next Steps

1. **เลือก approach** สำหรับ formatDate/formatNumber
   - ☐ Define inline (ง่ายสุด)
   - ☐ Create utils file (recommended)
   - ☐ Create composable (best practice)

2. **Implement** format functions

3. **Test** print functionality
   - Test with various date formats
   - Test with various price values
   - Test print layout สำหรับ A4 paper

4. **Consider** การเพิ่มเติม (PDF export, preview)

---

**ผู้จัดทำรายงาน:** GitHub Copilot  
**วันสร้าง:** 9 เมษายน 2566  
**Status:** ✅ สมบูรณ์
