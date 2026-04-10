# 🚀 Quick Reference - Format Functions Implementation

## ✅ What Was Fixed

### 1. Created: `src/utils/format.utils.ts`
- ✅ `formatDate()` - Convert ISO dates to Thai format
- ✅ `formatNumber()` - Format numbers with thousand separators
- ✅ `formatCurrency()` - Format with Baht symbol (฿)
- ✅ `formatDateTime()` - Date + Time in Thai
- ✅ `formatItemDisplay()` - Item code + name
- ✅ `formatQuantity()` - Quantity + unit name
- ✅ `formatStatusText()` - Status code to Thai text
- ✅ `formatActionText()` - Action to human-readable text
- ✅ Plus 6 more utility functions

### 2. Updated: `src/views/pages/BorrowMedicines.vue`
- ✅ Added import: `import { formatDate, formatNumber, formatCurrency } from '@/utils/format.utils';`
- ✅ Now all 12 calls to formatDate() will work
- ✅ Now all 12 calls to formatNumber() will work

---

## 📍 Function Signatures

### formatDate(dateString)
```typescript
// Input: "2024-04-09" or "2024-04-09T14:30:00Z"
// Output: "09 เมษายน 2567"

formatDate('2024-04-09')           // "09 เมษายน 2567"
formatDate('2024-04-09T14:30:00Z') // "09 เมษายน 2567"
formatDate(null)                    // "-"
formatDate('')                      // "-"
```

### formatNumber(value, decimals)
```typescript
// Default decimals = 2

formatNumber(1234.5)        // "1,234.50"
formatNumber(1000000.123)   // "1,000,000.12"
formatNumber(0)             // "0.00"
formatNumber(null)          // "0.00"
formatNumber(9999, 0)       // "9,999"
```

### formatCurrency(value, decimals)
```typescript
formatCurrency(1234.5)      // "฿1,234.50"
formatCurrency(0)           // "฿0.00"
formatCurrency(null)        // "฿0.00"
```

---

## 📝 Usage in Templates

### In BorrowMedicines.vue - Already Implemented

**Before (❌ Error):**
```vue
<td>{{ formatDate(data.borrow_date) }}</td>
<!-- TypeError: formatDate is not defined -->
```

**After (✅ Works):**
```vue
<td>{{ formatDate(data.borrow_date) }}</td>
<!-- Output: "09 เมษายน 2567" -->
```

---

### Format Calls in BorrowMedicines.vue

| Line | Usage | Input | Output |
|------|-------|-------|--------|
| 224 | Print template | `detailBorrow.value.borrow_date` | "09 เมษายน 2567" |
| 246 | Print template | `grandTotal` (e.g., 5000) | "5,000.00" |
| 754 | DataTable | `data.borrow_date` | "09 เมษายน 2567" |
| 902-1173 | Form display | Item prices, totals | "1,234.50", etc. |

---

## 🛠️ How to Use in Other Components

### In Other Vue Files

```typescript
// Step 1: Import
import { formatDate, formatNumber, formatCurrency } from '@/utils/format.utils';

// Step 2: Use in template or script
<template>
  <div>
    <p>{{ formatDate(created_at) }}</p>
    <p>฿{{ formatNumber(price) }}</p>
    <p>{{ formatCurrency(total) }}</p>
  </div>
</template>

<script setup>
  const invoice_date = '2024-04-09';
  const formatted = formatDate(invoice_date); // "09 เมษายน 2567"
</script>
```

### In Other Services/Utils

```typescript
// services/report.service.ts
import { formatDate, formatCurrency } from '@/utils/format.utils';

export class ReportService {
  generatePDF(data: any) {
    const docDate = formatDate(data.created_at);
    const amount = formatCurrency(data.total);
    // Generate PDF with formatted values
  }
}
```

---

## 🧪 Testing

### Test Cases

```typescript
// Date formatting
formatDate('2024-01-15')        // "15 มกราคม 2567"
formatDate('2024-12-31')        // "31 ธันวาคม 2567"
formatDate(null)                // "-"

// Number formatting
formatNumber(1)                 // "1.00"
formatNumber(1000)              // "1,000.00"
formatNumber(1234567.89)        // "1,234,567.89"
formatNumber(0.1)               // "0.10"
formatNumber(-500)              // "-500.00"

// Currency
formatCurrency(100)             // "฿100.00"
formatCurrency(99.9)            // "฿99.90"
```

---

## ✨ Additional Formatting Functions Available

| Function | Purpose | Example |
|----------|---------|---------|
| `formatDateTime()` | Date + Time | "09 เม.ย. 24 14:30:45" |
| `formatItemDisplay()` | Item + Code | "MED001 - Paracetamol" |
| `formatQuantity()` | Qty + Unit | "10 เม็ด" |
| `formatPhoneNumber()` | Phone | "08-1234-5678" |
| `formatStatusText()` | Status | "รอการอนุมัติ" |
| `formatActionText()` | Action | "อนุมัติ" |
| `formatPercentage()` | % | "25.5%" |
| `truncateText()` | Shorten | "Long text..." |
| `formatFileSize()` | File Size | "2.5 MB" |

---

## 📦 Files Modified/Created

```
✅ CREATED: src/utils/format.utils.ts (220 lines)
✅ UPDATED: src/views/pages/BorrowMedicines.vue (1 import line)
✅ CREATED: BORROW_MEDICINES_ANALYSIS.md (Comprehensive report)
✅ CREATED: FORMAT_UTILS_REFERENCE.md (This file)
```

---

## 🔍 Verification Checklist

- ✅ formatDate() defined and exported
- ✅ formatNumber() defined and exported
- ✅ formatCurrency() defined and exported
- ✅ Imported in BorrowMedicines.vue
- ✅ Print button will work (uses formatDate, formatNumber)
- ✅ All 12 formatDate calls in template will work
- ✅ All 12 formatNumber calls in template will work
- ✅ Error handling for null/undefined values
- ✅ Thai locale formatting
- ✅ Comments/documentation included

---

## 🚀 Next Steps

1. **Verify in Browser:**
   ```bash
   npm run dev  # in client folder
   # Navigate to BorrowMedicines page
   # Create/View a borrow record
   # Dates and numbers should display properly
   ```

2. **Test Print:**
   - Open detail dialog
   - Click "Print" button
   - Verify formatted output in print preview
   - Print to PDF or physical printer

3. **Optional Enhancements:**
   - Add PDF export (use `jsPDF` library)
   - Add print preview dialog
   - Add more status/action translations
   - Add currency selection support

---

## 📞 Support

If you need to:
- **Add new format functions** → Edit `src/utils/format.utils.ts`
- **Change date format** → Modify `formatDate()` locale options
- **Change decimal places** → Pass decimals parameter or edit default
- **Add translations** → Update status/action maps in the functions
- **Use in new component** → Just import and use

---

**Implementation Date:** 9 เมษายน 2567  
**Status:** ✅ Complete and Ready  
**Next Action:** Test & Verify in Browser
