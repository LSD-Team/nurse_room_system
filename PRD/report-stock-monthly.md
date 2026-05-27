# 📄 `report-stock-monthly.md`

````md
# Report: Stock Monthly Snapshot

## 1. Project Overview

### 1.1 Purpose
รายงานนี้มีวัตถุประสงค์เพื่อแสดงข้อมูล **Stock Snapshot รายงวด (Monthly / Period-based)**  
จากตาราง `stock_period_snapshot` โดยให้ผู้ใช้สามารถ:

- เลือกงวด (`period_code`)
- ตรวจสอบสถานะสต็อกของยาแต่ละรายการ
- ตรวจสอบความถูกต้องของยอด (Diff)
- Export ข้อมูลออกเป็นไฟล์ Excel

> ⚠️ รายงานนี้เป็น **Read-only Report เท่านั้น**
> ❌ ห้ามมีการแก้ไขข้อมูลใด ๆ ผ่านรายงานนี้

---

### 1.2 Target Users
- เจ้าหน้าที่คลังยา
- พยาบาล
- Supervisor / Auditor

---

## 2. System Scope & Safety Boundary (สำคัญมาก)

### ✅ สิ่งที่ระบบนี้ “ทำได้”
- อ่านข้อมูลจาก View เท่านั้น
- แสดงผลข้อมูลตาม `period_code`
- Export ข้อมูลออกเป็น Excel

### ❌ สิ่งที่ “ห้ามทำเด็ดขาด”
- ❌ ห้าม INSERT / UPDATE / DELETE ตารางใด ๆ
- ❌ ห้ามแก้ Business Logic ของระบบ Stock อื่น
- ❌ ห้ามสร้าง Trigger, Job, หรือ Background Process
- ❌ ห้ามเปลี่ยนโครงสร้าง Table เดิม

> ⚠️ AI ที่พัฒนาต่อ **ต้องทำงานเฉพาะในขอบเขตของ View และ UI นี้เท่านั้น**

---

## 3. Database Design (Read-only)

### 3.1 Source Tables (อ้างอิงเท่านั้น)

#### 3.1.1 stock_period_snapshot
ใช้เป็นแหล่งข้อมูล Snapshot รายงวด  
(ห้าม Query ตรงจาก UI)

Key Fields:
- period_code
- item_id
- opening_qty
- receipts
- issues
- adjustments
- net_movement
- expected_closing
- actual_closing
- diff_qty

---

#### 3.1.2 items
ใช้เพื่อแสดงชื่อยา

Key Fields:
- item_id (PK)
- item_code
- item_name_th
- item_name_en
- is_active

---

## 4. Reporting View (MANDATORY)

### 4.1 View Name
```sql
vw_report_stock_monthly
````

### 4.2 View Definition (Final & Locked)

> ✅ UI และ Export **ต้องใช้ View นี้เท่านั้น**

```sql
CREATE VIEW vw_report_stock_monthly AS
SELECT
    s.snapshot_id,
    s.period_code,

    -- Item information
    i.item_id,
    i.item_code,
    i.item_name_th,
    i.item_name_en,

    -- Stock movement
    s.opening_qty,
    s.receipts,
    s.issues,
    s.adjustments,
    s.net_movement,

    -- Closing balance
    s.expected_closing,
    s.actual_closing,
    s.diff_qty,

    -- Report status
    CASE
        WHEN s.diff_qty = 0 THEN 'OK'
        ELSE 'MISMATCH'
    END AS status,

    s.created_at,
    s.created_by
FROM stock_period_snapshot s
INNER JOIN items i
    ON s.item_id = i.item_id
WHERE i.is_active = 1;
```

***

### 4.3 View Usage Rule

* ✅ SELECT ได้อย่างเดียว
* ❌ ห้ามเขียน WHERE ซับซ้อนใน UI (ยกเว้น period\_code)
* ❌ ห้าม JOIN table อื่นเพิ่มจาก UI

***

## 5. User Interface Specification

### 5.1 Page Name

```
report-stock-monthly
```

***

### 5.2 Page Layout

```
------------------------------------------------
| Report : Stock Monthly Snapshot              |
------------------------------------------------
| Period : [ 202605-001 ▼ ]   [ Export Excel ] |
------------------------------------------------
| Summary                                     |
| - Total Items      : XX                     |
| - Mismatch Items  : XX                     |
------------------------------------------------
| Table : Stock Snapshot Detail               |
------------------------------------------------
```

***

### 5.3 Period Dropdown

**Data Source**

```sql
SELECT DISTINCT period_code
FROM vw_report_stock_monthly
ORDER BY period_code DESC;
```

Rules:

* Default = period ล่าสุด
* เปลี่ยนค่าแล้ว reload ตารางทันที
* ไม่มี period = แสดง Empty State

***

## 6. Summary Section Logic

| Metric         | Logic                        |
| -------------- | ---------------------------- |
| Total Items    | COUNT(\*)                    |
| Mismatch Items | COUNT(status = 'MISMATCH')   |
| Period Status  | ถ้าไม่มี MISMATCH → ✅ Normal |

***

## 7. Table Specification

### 7.1 Columns (Order Locked)

| No | Column           | Source            |
| -- | ---------------- | ----------------- |
| 1  | Item Code        | item\_code        |
| 2  | Item Name (TH)   | item\_name\_th    |
| 3  | Opening Qty      | opening\_qty      |
| 4  | Receipts         | receipts          |
| 5  | Issues           | issues            |
| 6  | Adjustments      | adjustments       |
| 7  | Net Movement     | net\_movement     |
| 8  | Expected Closing | expected\_closing |
| 9  | Actual Closing   | actual\_closing   |
| 10 | Diff             | diff\_qty         |
| 11 | Status           | status            |

***

### 7.2 UX Rules

* ตัวเลขทั้งหมด align ขวา
* status = MISMATCH → background สีแดงอ่อน
* ห้ามแก้ไข cell ใด ๆ
* Table header ต้อง sticky

***

## 8. Excel Export Specification

### 8.1 File Name

```
stock_snapshot_{period_code}.xlsx
```

***

### 8.2 Export Rules

* Export เฉพาะข้อมูลที่แสดงบนหน้าจอ
* Header ต้องเป็นภาษาเข้าใจง่าย
* Auto filter เปิดไว้
* Status = MISMATCH → cell สีแดงอ่อน

***

## 9. Security & Permission

* UI user → SELECT VIEW เท่านั้น
* ❌ ไม่มีสิทธิ์เข้าถึง table ตรง
* ❌ ไม่มีสิทธิ์เขียน DB

ตัวอย่าง:

```sql
GRANT SELECT ON vw_report_stock_monthly TO report_user;
```

***

## 10. Coding Constraints (สำคัญสำหรับ AI)

### ✅ Do

* ใช้ View เท่านั้น
* เขียนโค้ดแบบ Read-only
* เขียน SQL สั้นและตรง

### ❌ Don't

* ❌ อย่า ALTER table
* ❌ อย่าเพิ่ม index
* ❌ อย่า refactor ระบบ stock อื่น
* ❌ อย่า assume business logic เพิ่มเอง

***

## 11. Definition of Done (DoD)

* [ ] เลือก period ได้
* [ ] ตารางแสดงข้อมูลถูกต้อง
* [ ] Status แสดงถูกต้อง
* [ ] Export Excel ใช้งานได้
* [ ] ไม่มีผลกระทบกับระบบอื่น
* [ ] ไม่มี query เขียนข้อมูล DB

***

## 12. Final Warning to AI Developer

> ⚠️ ระบบนี้เป็น **Report เท่านั้น**
>
> หากมีการแก้ไขหรือกระทบระบบ Stock อื่น  
> ถือว่า **ผิด Spec ทันที**

```

