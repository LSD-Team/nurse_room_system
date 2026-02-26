# Nurse Room System — Functional Specification (Draft for Repo/Wiki)

> **Last updated:** 2026-02-26  
> **Tech stack:** MS SQL Server (MSSQL) + Node.js (Express, TypeScript) + PrimeVue v4  
> **Source context:** `system.txt`, `DFD_Level0.txt`, `sitemap.txt` (attached in conversation)

---

## 1. Purpose & Scope

This document defines functional requirements and core policies for the **Nurse Room System**, focusing on:
- People search (Employee + External)
- Clinical visit recording and medication/supply usage
- Inventory (stock on hand + movements)
- Procurement, Borrowing, Monthly Settlement (Monthly PO)
- Price versioning (Price List)
- Units & conversion (purchase unit vs usage unit)
- Period close (month lock) + stock adjustment (monthly cut)
- Approval workflow (L1/L2/L3)
- Reports & exports (Excel + PDF)

---

## 2. Roles (High-level)

> Exact permission matrix to be implemented in RBAC.

- **Nurse**: record visits, issue/dispense items, edit visit usage (with reason) *subject to period lock*
- **Admin Nurse**: all Nurse permissions + receiving/GR + stock adjustment + reverse documents + period close (as allowed)
- **HR**: view/report + stock adjustment + reverse + period close (as allowed)
- **HR GL / HR Manager / HR Department**: approval roles for PO workflow (L1/L2/L3)

---

## 3. People Search & Patient Selection

### 3.1 Employee (Internal)
- Search via **HR/ERP Real-time API**
- Search keys:
  - `EmpID`
  - `Name`

**Resigned policy**
- If employee status = **Resigned**: **view-only**
  - Allowed: view history/reports
  - Not allowed: create new visit

### 3.2 External Person (Non-employee)
Stored in Nurse Room System database.

Search keys:
- Name
- Company
- National ID card no.
- Phone
- Passport

### 3.3 Unified “Select Patient” UI
- Toggle: Employee / External
- Search + select -> create visit (if allowed)
- Employee resigned -> disable create visit

---

## 4. Clinical Visit (Treatment Record)

### 4.1 Visit Data (summary)
Visit captures (per sitemap):
- Visit datetime
- Work shift
- Symptoms/complaints
- Disease group/type
- Treatment type
- Accident in work (stop work/rest/continue/send hospital)
- Refer type (Emergency/Rest&Refer/Accident in work&Refer/Dressing&Refer)
- Vitals (temp/PR/RR/BP/weight/BMI optional)
- Nursing advice

### 4.2 Medication / Supply Usage in Visit
- Nurse selects items used/dispensed during visit.
- **Usage quantity must be integer.**
- Usage unit should be the item’s **Usage Unit** (base unit) (see Units section).

**Inventory impact**
- Each usage creates stock movement `OUT_VISIT` (base unit).

### 4.3 Edit Visit Usage (critical)
- **Nurse can edit usage quantity** (integer only).
- Must **require Reason** on every edit.
- Must write **audit log** (who/when/old/new/reason).
- Stock must be adjusted by delta (do not silently overwrite).

**Delta rule**
- `delta = new_qty_base - old_qty_base`
  - If `delta > 0`: create extra `OUT_VISIT` movement = delta
  - If `delta < 0`: create compensating `IN` movement (or reversal movement) = abs(delta)

**Period close restriction (see section 10)**
- After month is closed:
  - Nurse cannot edit
  - Only Admin Nurse / HR can edit (still requires reason)

---

## 5. Inventory Model (No lot/batch/expiry)

### 5.1 Stock On Hand
- Stock tracked as **total quantity** per item
- Stock stored in **Base Unit = Usage Unit** (`qty_base`)

### 5.2 Stock Movements (Ledger)
Movement types (minimum):
- `IN_GR` (receiving from PO)
- `IN_BORROW` (borrowing receipt)
- `OUT_VISIT` (usage/dispense from visit)
- `ADJUST` (stock adjustment)
- (Optional) `REVERSAL`/linkage for reverse documents

Each movement must store:
- item_id
- qty_base (+/-)
- reference document type + id
- created_by/created_at
- reason (when required)

---

## 6. Units & Conversion (Purchase Unit ≠ Usage Unit)

### 6.1 Item has two units
For each item:
- **Purchase Unit** (e.g., bottle, jar)
- **Usage Unit** (e.g., tablet, time/use)
- **Default Conversion Factor**: `usage_per_purchase` (integer)
  - Example: Paracetamol: 1 jar = 100 tablets
  - Alcohol: 1 bottle = 50 uses (usage unit = “time/use”, not ml)

### 6.2 Stock base unit
- Store stock in **Usage Unit** only.

### 6.3 Receiving can override conversion
- Default conversion is known and fixed “usually”.
- But during receiving (GR), user must be able to **verify and override** actual conversion per line.

**Reason required**
- If `actual_conversion_factor != default_conversion_factor`, system must **require Reason** (per GR line).

---

## 7. Price Management (Price Lists)

### 7.1 Price source
- Borrow uses **price from master item price list**
- Price must support versioning:
  - Create new **Price List**
  - Activate new list
  - Keep old list history

### 7.2 Snapshot prices into documents
- Borrow lines and PO lines must snapshot `unit_price` at creation time
- Reports must remain correct historically even after price changes

---

## 8. Procurement, Borrowing, Monthly Settlement (Monthly PO)

### 8.1 Borrow
- Borrow records receiving items from supplier before monthly settlement.
- Borrow is tied to supplier; month may have multiple suppliers in special cases.

### 8.2 Supplier policy (monthly)
- Currently usually 1 supplier per month.
- If special case: borrow/purchase from multiple suppliers in a month -> **system must split into separate Monthly PO per supplier.**

### 8.3 Monthly Settlement -> Monthly PO (Auto-split)
User selected approach: **Auto-split**

**Generate flow**
1. Select month/year
2. Preview un-settled borrows in that period
3. Click **Generate**
4. System auto-groups by supplier and creates **1 Monthly PO per supplier**
5. **PO status after generation = DRAFT**
6. User reviews PO, then clicks **Submit** to start approvals

**Line aggregation**
- Monthly PO must **aggregate by item**:
  - 1 line per item
  - `qty = SUM(qty)` from eligible borrow lines
  - price from snapshot (borrow) or consistent rule (recommended: use borrow snapshot)

**Linkage**
- Borrow lines included in settlement must be marked settled and linked to Monthly PO (for traceability).

---

## 9. PO Approval Workflow (L1/L2/L3)

- PO (normal and monthly) approval levels:
  - Level 1: HR GL
  - Level 2: HR Manager
  - Level 3: HR Department
- Approval must be auditable:
  - who, when, approve/reject, reason

---

## 10. Period Close (Month Lock) & Edit Restrictions

### 10.1 Period close concept
System must support **closing a month** to lock edits.

- Entity: `inventory_period_closings`
  - month/year
  - status CLOSED
  - closed_by, closed_at

### 10.2 Visit usage edit policy with closed period
- If visit date is within a **closed month**:
  - **Nurse cannot edit usage**
  - Only **Admin Nurse / HR** can edit (still requires reason + audit + stock delta)

---

## 11. Monthly Stock Adjustment (Stock Cut)

### 11.1 Who can adjust
- Only **Admin Nurse** and **HR**

### 11.2 Document states
- `DRAFT -> POSTED`

### 11.3 Posting behavior
- Posting creates `ADJUST` movements for diff lines
- Updates stock_on_hand to counted quantity (base unit)
- Must require reason (header; line reason optional)

### 11.4 PDF output
- Must be able to print PDF “count/adjust report”
- Report should show:
  - system qty (base)
  - counted qty (base)
  - diff (base)
  - **display both units**:
    - Usage/base unit
    - Purchase unit as **split remainder** (see 11.5)

### 11.5 Display purchase unit with remainder (Format B)
Given:
- `qty_base`
- `default_conversion_factor` (usage_per_purchase)

Compute:
- `whole = FLOOR(qty_base / factor)`
- `remainder = qty_base % factor`

Display as:
- `{whole} {purchase_unit} {remainder} {usage_unit}`
Examples:
- 125 tablets, factor 100 -> `1 jar 25 tablets`

---

## 12. Reverse Documents Policy

### 12.1 No Unpost
- Documents that are **POSTED** must not be unposted/edited to remove effect.

### 12.2 Reverse by creating a reversal document
- To cancel/undo a posted document:
  - Create a **Reverse document** referencing the original
  - Generate opposite stock movements to neutralize original impact
  - Require reason + audit trail
  - Mark original as reversed (link to reversal doc)

Applies at least to:
- Stock Adjustment (monthly)
- (Optionally) other posted stock-impact documents (GR, etc.) per implementation scope

---

## 13. Reports & Export

### 13.1 Export formats
- Must support **Excel** and **PDF** for required reports.
- PDF must support Thai fonts and standard header/footer.

### 13.2 Go-live report list (minimum)
1. Monthly stock report (shows both units)
2. Purchase/Borrow report (trace Borrow -> Monthly PO)
3. General treatment report (employee/external)
4. Daily medication/supply usage report
5. Accident in work report

---

## 14. Suggested Key Entities (Logical Data Dictionary)

> This is a logical model to guide MSSQL schema design.

### Master
- `units`
- `items` (purchase_unit_id, usage_unit_id, default_conversion_factor)
- `suppliers`

### Price versioning
- `price_lists`
- `price_list_lines`

### Clinical
- `visits`
- `visit_usages` (item_id, qty_base)
- `visit_usage_edit_logs` (old/new qty + reason + who/when)

### Inventory
- `stock_on_hand` (item_id, qty_base)
- `stock_movements` (movement_type, ref_type/ref_id, qty_base, reason)

### Procurement / Borrow / Settlement
- `borrows`, `borrow_lines` (qty_purchase, actual_conversion_factor, qty_base, unit_price snapshot)
- `purchase_orders`, `purchase_order_lines`
- `po_approvals`
- Settlement mapping (choose one):
  - `borrow_lines.monthly_po_id` (simple)
  - or `borrow_settlement_map(borrow_line_id, po_id, po_line_id)` (strong trace)

### Receiving
- `goods_receipts`, `goods_receipt_lines`
  - `actual_conversion_factor`
  - `conversion_change_reason` (required if differs from default)

### Period close
- `inventory_period_closings`

### Stock adjustment docs
- `stock_adjustments`, `stock_adjustment_lines`
- Reversal linkage fields:
  - `reversal_of_id`, `reversed_by_id`, `status`

---

## 15. Validation Summary (Must-have)

- Employee resigned -> cannot create new visit
- Visit usage qty integer only
- Visit usage edit -> reason required + audit + stock delta
- GR conversion changed -> reason required (per line)
- Month closed -> nurse cannot edit usage; only Admin Nurse/HR
- Stock adjustment -> only Admin Nurse/HR; Draft->Posted; PDF printable
- Posted docs changes -> reverse doc only

---

## 16. Open Items (Optional to lock later)
- Period close scope for other actions (e.g., receiving backdated, borrow backdated)
- Whether to allow stock negative or block (needs explicit policy)
- Whether reverse is allowed for GR/PO receiving in MVP

---