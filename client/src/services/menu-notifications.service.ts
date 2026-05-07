import { Api } from '@/services/api.service';

export interface MenuNotificationCounts {
  poDraftCount: number;
  grDraftCount: number;
  poPendingCount: number;
  borrowPendingCount: number;
  approvalPendingCount: number;
}

export class MenuNotificationsService {
  // ─── Get PO Draft Count (สั่งซื้อ) ───
  static async getPoDraftCount(): Promise<number> {
    try {
      const result = await Api.get<{ count: number }>('/po/draft-count');
      return result.count || 0;
    } catch (error) {
      console.error('[MenuNotifications] Error fetching PO draft count:', error);
      return 0;
    }
  }

  // ─── Get GR Draft Count (รับเข้า - View GRs) ───
  static async getGrDraftCount(): Promise<number> {
    try {
      const result = await Api.get<{ count: number }>('/gr/draft-count');
      return result.count || 0;
    } catch (error) {
      console.error('[MenuNotifications] Error fetching GR draft count:', error);
      return 0;
    }
  }

  // ─── Get PO Pending Count (รับเข้า - Create GR: ORDERED, PARTIAL) ───
  static async getPoPendingCount(): Promise<number> {
    try {
      const result = await Api.get<{ count: number }>('/po/pending-count');
      return result.count || 0;
    } catch (error) {
      console.error('[MenuNotifications] Error fetching PO pending count:', error);
      return 0;
    }
  }

  // ─── Get Borrow Pending Count (ยืม: DRAFT, APPROVED) ───
  static async getBorrowPendingCount(): Promise<number> {
    try {
      const result = await Api.get<{ count: number }>('/borrow/pending-count');
      return result.count || 0;
    } catch (error) {
      console.error('[MenuNotifications] Error fetching borrow pending count:', error);
      return 0;
    }
  }

  // ─── Get PO Approval Pending Count (อนุมัติการสั่งซื้อยา) ───
  static async getApprovalPendingCount(): Promise<number> {
    try {
      const result = await Api.get<{ count: number }>('/po/approval-pending-count');
      return result.count || 0;
    } catch (error) {
      console.error('[MenuNotifications] Error fetching approval pending count:', error);
      return 0;
    }
  }

  // ─── Get All Counts (สำหรับการโหลดครั้งแรก) ───
  static async getAllCounts(): Promise<MenuNotificationCounts> {
    try {
      const [
        poDraftCount,
        grDraftCount,
        poPendingCount,
        borrowPendingCount,
        approvalPendingCount,
      ] = await Promise.all([
        this.getPoDraftCount(),
        this.getGrDraftCount(),
        this.getPoPendingCount(),
        this.getBorrowPendingCount(),
        this.getApprovalPendingCount(),
      ]);

      return {
        poDraftCount,
        grDraftCount,
        poPendingCount,
        borrowPendingCount,
        approvalPendingCount,
      };
    } catch (error) {
      console.error('[MenuNotifications] Error fetching all counts:', error);
      return {
        poDraftCount: 0,
        grDraftCount: 0,
        poPendingCount: 0,
        borrowPendingCount: 0,
        approvalPendingCount: 0,
      };
    }
  }
}
