// ===== Bullet Counts (Menu Notifications) =====
export interface IBulletCounts {
  po: number; // สั่งซื้อ
  rec: number; // รับเข้า
  borrow: number; // ยืม
  apv: number; // อนุมัติการสั่งซื้อยา
  all: number; // จัดซื้อ & ยืม ยา/เวชภัณฑ์
  stock_count_apv: number; // อนุมัติการนับ Stock
}
