# Skills & Best Practices for Nurse Room System

เอกสารนี้สรุปเทคนิคการเขียนโค้ด สไตล์ และแนวปฏิบัติที่พบในระบบ (client: Vue 3/Vite, server: NestJS) เพื่อใช้เป็นแนวทางการทำงานแบบมืออาชีพ

## สรุปเทคโนโลยีหลัก
- Frontend: Vue 3 (Composition API, <script setup>), Vite, Pinia, Vue Router, PrimeVue, TailwindCSS, TypeScript
- Backend: NestJS (modules/controllers/services), JWT + Passport, MSSQL (mssql), Stored Procedures
- Tooling: pnpm, ESLint, Prettier, vue-tsc, jest, Swagger

## โครงสร้างและรูปแบบการจัดไฟล์
- Module-per-feature (server/src/apis/feature) — controller + service + interface + module
- Client: views/pages, services, stores, shared interfaces (path alias `@/` and `@/shared/*`)
- Entry points: client/src/main.ts, server/src/main.ts — centralised bootstrapping & global middleware

## การตั้งชื่อและคอนเวนชัน
- Interfaces: นำหน้าด้วย `I` (เช่น IViewEmployee, IBorrowHeader)
- Vue components: PascalCase.vue
- Routes: kebab-case (เช่น /borrow-medicines)
- Services: camelCase methods (getBorrowHeaders())
- Stored Procedures: sp_MODULE_##_Action (เช่น sp_BR_01_Create)
- Env variables: UPPER_SNAKE_CASE

## Frontend เทคนิคที่ควรยึดตาม
- ใช้ `<script setup lang="ts">` เป็นหลัก — สั้นชัดและใช้ TypeScript ง่ายขึ้น
- Pinia สำหรับ global state (store แบบ defineStore) — encapsulate action/state และใช้ getters เป็น accessor
- Api service (client/src/services/api.service.ts) เป็นจุดเดียวในการเรียก HTTP — มีการจัดการ loading, error, token injection ผ่าน AXIOS config → ห้ามเรียก Axios ตรงๆ
- PrimeVue auto-import resolver ถูกใช้ — หลีกเลี่ยงการ import component แบบแมนนวล
- ใช้ shared interfaces ระหว่าง client/server ผ่าน alias (`@/shared`) เพื่อให้ types ตรงกัน
- Loading UX: centralized loading handling (debounce/delay) ใน Api service เพื่อป้องกัน flicker
- Logging: console.info ถูกใช้อย่างจำกัดสำหรับ debugging ควรใช้ logger ที่ปรับได้สำหรับ production

## Backend เทคนิคที่ควรยึดตาม
- NestJS module pattern: แยก controller, service, interface, module ให้ชัดเจน
- Database access ผ่าน DatabaseService ที่ห่อ MSSQL connection pool และ executeStoredProcedure/ query — หลีกเลี่ยงการเขียน raw SQL ที่กระจัดกระจาย
- ใช้ Stored Procedures สำหรับธุรกิจสำคัญและ transaction-heavy logic เพื่อ performance และความปลอดภัย
- Validation & DTOs: ใช้ class-validator / class-transformer ใน DTOs เพื่อป้องกันข้อมูลไม่ถูกต้องก่อนเข้าธุรกิจ
- Auth & Guards: ใช้ JWT + Passport และ global AppGuard; แยก AdminGuard / UserGuard สำหรับสิทธิ์เฉพาะทาง
- Swagger: ใช้ @nestjs/swagger ในการสร้างเอกสาร API อัตโนมัติ
- Config: ใช้ @nestjs/config และโหลดไฟล์ .env ตาม NODE_ENV

## TypeScript & Typing
- รองรับ TS ทั้ง frontend/backend — แนะนำใส่ types ให้ครบใน public API และ service boundaries
- หลีกเลี่ยง any ที่ไม่จำเป็น โดยเฉพาะในชั้น service/controller

## Testing & CI
- มี jest config สำหรับ server (unit/e2e patterns) — เขียน unit tests สำหรับ services และ integration tests สำหรับ endpoint สำคัญ
- Linting + Formatting: ESLint + Prettier ถูกตั้งค่าในทั้งสองฝั่ง — รัน `pnpm lint` ก่อนส่ง PR

## Security & Operational Best Practices
- ห้าม commit secrets (.env) ลง repo — จัดการผ่าน secret store/CI
- ใช้ parameterized queries หรือ stored procedures เพื่อป้องกัน SQL injection
- Validate และ sanitize input ทั้งฝั่ง client และ server
- คืนค่า error ที่เหมาะสม (ไม่เผย stack trace ใน production)
- เปิด CORS อย่างระมัดระวังใน production — ปัจจุบันเป็น origin: '*' สำหรับ dev

## Performance & Maintainability
- Centralize HTTP logic (Api service) → ง่ายต่อการเพิ่ม retry, timeout, request/response transform
- ใช้ stored procedures เพื่อประหยัด round-trip และ leverage DB optimizations
- แยก concerns: UI, state, API, business logic (controller/service) เพื่อทดสอบและบำรุงรักษาง่าย

## Bullet Menu Summary (จาก view_bullet_list)
- สั่งซื้อ (po): 0
- รับเข้า (rec): 0
- ยืม (borrow): 2
- อนุมัติการสั่งซื้อยา (apv): 1
- จัดซื้อ & ยืม ยา/เวชภัณฑ์ (all): 2

## Recommended Practices / Checklist (quick)
- [ ] ใช้ Api service สำหรับทุกการเรียก HTTP
- [ ] สร้าง/ปรับ DTO + validation สำหรับทุก endpoint รับค่า
- [ ] เก็บ business logic ใน service ไม่ใช่ controller
- [ ] รัน `pnpm lint` และ `pnpm build` ก่อน PR
- [ ] อัปเดต PRD docs เมื่อมีการเปลี่ยนแปลง schema / stored procedure

## ตัวอย่างการใช้งานที่ดี
- Store action `getUserData()` เรียก AuthService -> setUserData() (encapsulation)
- Api class มี centralized loading management และ consistent method signatures (get/post/put/patch/delete)

---
เอกสารนี้เป็นจุดเริ่มต้นสำหรับแนวปฏิบัติภายในทีม ควรปรับเพิ่มเมื่อมีเครื่องมือ กระบวนการ CI/CD หรือนโยบายความปลอดภัยใหม่ๆ
