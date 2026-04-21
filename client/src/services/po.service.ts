import { Api } from '@/services/api.service';
import type {
  IPoHeader,
  IPoLine,
  IPoApproval,
  IPendingBorrow,
} from '@/interfaces/po.interfaces';
import type {
  ISupplier,
  ISupplierItemPrice,
} from '@/interfaces/borrow.interfaces';

export class PoService {
  // ─── รายการ PO ทั้งหมด ───
  static async getPoHeaders(): Promise<IPoHeader[]> {
    return Api.get<IPoHeader[]>('/po');
  }

  // ─── รายละเอียด lines ของ PO ───
  static async getPoLines(poId: number): Promise<IPoLine[]> {
    return Api.get<IPoLine[]>(`/po/${poId}/lines`);
  }

  // ─── ประวัติการอนุมัติ PO ───
  static async getPoApprovals(poId: number): Promise<IPoApproval[]> {
    return Api.get<IPoApproval[]>(`/po/${poId}/approvals`);
  }

  // ─── Suppliers dropdown ───
  static async getSuppliers(): Promise<ISupplier[]> {
    return Api.get<ISupplier[]>('/po/suppliers');
  }

  // ─── ราคายาตาม supplier ───
  static async getSupplierPrices(
    supplierId: number
  ): Promise<ISupplierItemPrice[]> {
    return Api.get<ISupplierItemPrice[]>(
      `/po/supplier-prices/${supplierId}`
    );
  }

  // ─── การยืมที่รอ settle ───
  static async getPendingBorrows(
    supplierId?: number
  ): Promise<IPendingBorrow[]> {
    const params = supplierId ? `?supplierId=${supplierId}` : '';
    return Api.get<IPendingBorrow[]>(`/po/pending-borrows${params}`);
  }

  static async getSettledBorrows(poId: number): Promise<IPendingBorrow[]> {
    return Api.get<IPendingBorrow[]>(`/po/${poId}/settled-borrows`);
  }

  // ─── สร้าง PO ───
  static async createPo(data: {
    SupplierId: string;
    PoDate: string;
    DueDate?: string;
    JsonLines: string;
    BorrowIds?: string;
    Note?: string;
  }) {
    return Api.post('/po', data);
  }

  // ─── แก้ไข PO ───
  static async updatePo(
    poId: number,
    data: {
      DueDate?: string;
      JsonLines?: string;
      BorrowIds?: string;
      Note?: string;
    }
  ) {
    return Api.put(`/po/${poId}`, data);
  }

  // ─── ส่งอนุมัติ ───
  static async submitPo(poId: number) {
    return Api.post(`/po/${poId}/submit`);
  }

  // ─── อนุมัติ/ปฏิเสธ ───
  static async approvePo(
    poId: number,
    data: {
      Action: 'APPROVE' | 'REJECT';
      Remark?: string;
    }
  ) {
    return Api.post(`/po/${poId}/approve`, data);
  }

  // ─── ยกเลิก PO ───
  static async cancelPo(poId: number, reason?: string) {
    return Api.post(`/po/${poId}/cancel`, { Reason: reason });
  }

  // ─── รายการ PO รอ Receiving ───
  static async getPendingReceiving(): Promise<IPoHeader[]> {
    return Api.get<IPoHeader[]>('/po/receiving/pending');
  }

  // ─── อัปเดต qty_received (GRN) ───
  static async updateQtyReceived(
    poId: number,
    jsonLines: string
  ) {
    return Api.put(`/po/${poId}/receiving`, { JsonLines: jsonLines });
  }
}
