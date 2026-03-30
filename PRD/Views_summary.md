# สรุป Views ในระบบ (แปลงจาก Views.md)

ไฟล์นี้สรุปโครงสร้างและหน้าที่ของแต่ละ View ในระบบฐานข้อมูลให้อยู่ในรูปแบบ Markdown เพื่อให้อ่านง่ายและค้นหาได้สะดวก

---

## 1. view_borrowed_items
- **หน้าที่:** แสดงข้อมูลการยืมของ (Borrow) รายการสินค้า, supplier, และรายละเอียดแต่ละบรรทัด
- **ตารางที่เกี่ยวข้อง:** borrow_headers, borrow_lines, items, suppliers, view_items

---

## 2. view_check_all_item_on_hand
- **หน้าที่:** แสดงรายการสินค้าที่จำนวนคงเหลือ (stock) ต่ำกว่า MIN หรือสูงกว่า MAX
- **ตารางที่เกี่ยวข้อง:** view_items, stock_on_hand

---

## 3. view_disease_groups
- **หน้าที่:** แสดงกลุ่มโรคและกลุ่มย่อยที่ยัง active
- **ตารางที่เกี่ยวข้อง:** disease_groups, disease_sub_groups

---

## 4. view_email
- **หน้าที่:** แสดงอีเมลและชื่อพนักงาน (เชื่อมกับ view_employee_all)
- **ตารางที่เกี่ยวข้อง:** IT.dbo.email_address, view_employee_all

---

## 5. view_employee_all
- **หน้าที่:** แสดงข้อมูลพนักงานทั้งหมด (รหัส, ชื่อ, ตำแหน่ง, อีเมล ฯลฯ)
- **ตารางที่เกี่ยวข้อง:** HRM-ODBC-DB.dbo.uservw_employeedata, IT.dbo.email_address

---

## 6. view_item_stock_summary
- **หน้าที่:** สรุปสถานะ stock ของแต่ละ item (เช่น ต่ำกว่า min, เกิน max, ปกติ)
- **ตารางที่เกี่ยวข้อง:** view_items

---

## 7. view_items
- **หน้าที่:** แสดงรายละเอียดสินค้า (item) พร้อมข้อมูลหน่วย, ราคาล่าสุด, สถานะ stock ฯลฯ
- **ตารางที่เกี่ยวข้อง:** items, item_type, supplier_price_list, units, stock_on_hand

---

## 8. view_on_hand_out_of_range
- **หน้าที่:** แสดงรายการสินค้าที่ stock ต่ำกว่า min (และสามารถปรับให้แสดงเกิน max ได้)
- **ตารางที่เกี่ยวข้อง:** view_items, stock_on_hand

---

## 9. view_patient_allergy_drug_detail
- **หน้าที่:** แสดงรายละเอียดการแพ้ยา (Drug Allergy) ของผู้ป่วยแต่ละราย
- **ตารางที่เกี่ยวข้อง:** patient_allergies, patient_profiles, view_employee_all, external_people, items

---

## 10. view_patient_allergy_food_detail
- **หน้าที่:** แสดงรายละเอียดการแพ้อาหาร (Food Allergy) ของผู้ป่วยแต่ละราย
- **ตารางที่เกี่ยวข้อง:** patient_allergies, patient_profiles, view_employee_all, external_people, items

---

## 11. view_supplier_item_prices_current
- **หน้าที่:** แสดงราคาสินค้าปัจจุบันของแต่ละ supplier
- **ตารางที่เกี่ยวข้อง:** supplier_price_list, suppliers, items, units

---

> หมายเหตุ: สามารถดู SQL statement เต็มได้ในไฟล์ Views.md เดิม
