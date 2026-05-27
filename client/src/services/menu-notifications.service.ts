import { Api } from '@/services/api.service';

export interface MenuNotificationCounts {
  po: number;
  rec: number;
  borrow: number;
  apv: number;
  all: number;
  stock_count_apv: number;
}

export class MenuNotificationsService {
  // ─── Get All Bullet Counts from view_bullet_list ───
  static async getAllCounts(silent = false): Promise<MenuNotificationCounts> {
    try {
      const counts = await Api.get<MenuNotificationCounts>('/bullet/counts', {}, { silent } as any);
      console.log('[MenuNotifications] Bullet counts loaded:', counts);
      return counts;
    } catch (error) {
      console.error('[MenuNotifications] Error fetching bullet counts:', error);
      return {
        po: 0,
        rec: 0,
        borrow: 0,
        apv: 0,
        all: 0,
        stock_count_apv: 0,
      };
    }
  }

  // ─── Get PO Count (สั่งซื้อ) ───
  static async getPoDraftCount(): Promise<number> {
    try {
      const counts = await this.getAllCounts();
      return counts.po || 0;
    } catch (error) {
      console.error('[MenuNotifications] Error fetching PO count:', error);
      return 0;
    }
  }

  // ─── Get REC Count (รับเข้า) ───
  static async getGrDraftCount(): Promise<number> {
    try {
      const counts = await this.getAllCounts();
      return counts.rec || 0;
    } catch (error) {
      console.error('[MenuNotifications] Error fetching REC count:', error);
      return 0;
    }
  }

  // ─── Get PO Pending Count (for backward compatibility) ───
  static async getPoPendingCount(): Promise<number> {
    return 0; // ไม่ใช้อีกต่อไป
  }

  // ─── Get Borrow Pending Count (ยืม) ───
  static async getBorrowPendingCount(): Promise<number> {
    try {
      const counts = await this.getAllCounts();
      return counts.borrow || 0;
    } catch (error) {
      console.error('[MenuNotifications] Error fetching borrow count:', error);
      return 0;
    }
  }

  // ─── Get Approval Pending Count (อนุมัติการสั่งซื้อยา) ───
  static async getApprovalPendingCount(): Promise<number> {
    try {
      const counts = await this.getAllCounts();
      return counts.apv || 0;
    } catch (error) {
      console.error(
        '[MenuNotifications] Error fetching approval count:',
        error
      );
      return 0;
    }
  }

  // ─── Get All Count (จัดซื้อ & ยืม ยา/เวชภัณฑ์) ───
  static async getAllCount(): Promise<number> {
    try {
      const counts = await this.getAllCounts();
      return counts.all || 0;
    } catch (error) {
      console.error('[MenuNotifications] Error fetching all count:', error);
      return 0;
    }
  }
}
