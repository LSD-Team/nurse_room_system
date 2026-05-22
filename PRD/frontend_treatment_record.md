Act as an Expert Frontend Developer using React, Tailwind CSS, and a modern UI library like Shadcn/ui or Ant Design. 
Please build a "Medical Treatment Record" (บันทึกการรักษาพยาบาล) page based on the following detailed layout and requirements.

### General Design & Theme
- Clean, minimal, and professional medical dashboard interface.
- Background: White. Text: Dark Gray/Black.
- Key colors: Primary Blue (buttons, active tabs), Success Green (active search tab), Danger Red (allergies, medical conditions), Gray (borders, placeholders).
- Layout should be contained within a centered maximum width container with standard padding.

### Section 1: Header & Patient Search
- Title: "❤️ บันทึกการรักษาพยาบาล" (Bold, prominent).
- Below the title, a search/filter row:
  - Toggle Group: "พนักงาน" (Employee) [Active state: Green background, white text] and "บุคคลภายนอก" (External) [Inactive state: White background, gray text].
  - Label: "ค้นหาพนักงาน (ชื่อ / รหัส)"
  - Input Field: "พิมพ์ชื่อหรือรหัสพนักงาน..."

### Section 2: Patient Profile & Medical Alerts
- Displayed below the search bar in a Flex or Grid container.
- Left column: Patient Avatar (circular or rounded square), Name ("นาย เวโรจน์ พงษ์บุพศิริกุล" - Bold), Department ("2130 IT Sect. IT Sect."), and Visit count ("ครั้งที่มารักษา: 12 ครั้ง").
- Middle column: "ยาที่แพ้" (Allergies) label. Below it, display red warning badges: "ยาแก้ท้องอืดชนิดเม็ด", "ยาแก้ปวด".
- Middle-Right column: "BMI" label with a large "0" below it.
- Right column: "โรคประจำตัว" (Chronic Diseases) label. Below it, display red warning badges: "ง่วงนอนตลอดเวลา", "แพ้อาหารทะเล".

### Section 3: Visit Info & Navigation Tabs
- Grid layout with 3 inputs:
  1. วันที่รักษา (Date): Input field with value "21-05-2026".
  2. เวลารักษา (Time): Input field with value "09:09".
  3. กะทำงาน (Shift): Toggle switch between "Day" (Active: Blue) and "Night".
- Below this, a standard Tabs navigation bar with 4 tabs:
  1. "ข้อมูลการรักษาพยาบาล" (Active Tab, highlighted with an icon).
  2. "ประวัติการรักษา"
  3. "ประวัติการ Refer"
  4. "ประกันสังคม"

### Section 4: Vital Signs (Grid Layout)
- 4-column grid for the first row:
  - อุณหภูมิ (Temp)
  - อัตราการเต้นของหัวใจ (Heart Rate) - Placeholder "Ex. 175"
  - อัตราการหายใจ (Respiratory Rate) - Placeholder "Ex. 175"
  - ความดัน สูง/ต่ำ (Blood Pressure) - Placeholder "Ex. 100/100"
- 2-column grid for the second row (aligned left):
  - ส่วนสูง (Height)
  - น้ำหนัก (Weight)

### Section 5: Treatment Record (บันทึกการรักษา)
- Section Title: "บันทึกการรักษา" (Bold).
- อาการ (Symptoms): A large, full-width textarea.
- 3-column grid for Dropdowns:
  1. กลุ่มโรค (Disease Group) - Required field (* red asterisk).
  2. ประเภทโรค (Disease Type) - Required field (* red asterisk).
  3. ประเภทของการรักษา (Treatment Type).
- 3-column grid for Yes/No Toggles (Blue for 'Yes', White for 'No'):
  1. โรคที่คาดว่าเกิดจากการทำงาน (Work-related disease)
  2. Accident in Work
  3. Refer Case
- คำแนะนำจากพยาบาล (Nurse Advice): A large, full-width textarea - Required field (* red asterisk).

### Section 6: Medication & Supplies Disbursement
- Label: "ในเคสนี้ต้องจ่ายยาหรือเวชภัณฑ์ ใช่หรือไม่? *" with Yes/No toggle buttons.
- Assume 'Yes' is selected and display the disbursement section:
  - 2-column grid (Left for Medicines, Right for Supplies).
  - Left Side (ยาที่ใช้): Dropdown to select medicine. Next to it, custom quantity controls: `[-] [ 1 ] [+]`, a "[N/A]" button, and an "[+]" icon button (outlined in green) to add a new row.
  - Right Side (เวชภัณฑ์ที่ใช้): Same layout as the left side, but for medical supplies.

### Section 7: Footer
- A full-width, primary Blue "Submit" button at the very bottom.