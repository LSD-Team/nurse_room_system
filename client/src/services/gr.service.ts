import { Api } from '@/services/api.service';
import type { IGrHeaderList, IGrDetail } from '@/interfaces/gr.interfaces';

export class GrService {
  // ─── รายการ GR ทั้งหมด ───
  static async getGrHeaders(): Promise<IGrHeaderList[]> {
    return Api.get<IGrHeaderList[]>('/gr');
  }

  // ─── รายละเอียด GR ───
  static async getGrDetail(grId: number): Promise<IGrDetail> {
    return Api.get<IGrDetail>(`/gr/${grId}`);
  }

  // ─── PO ที่สามารถรับของได้ ───
  static async getAvailablePos(): Promise<any[]> {
    return Api.get<any[]>('/gr/available-po');
  }

  // ─── สร้าง GR ใหม่ (DRAFT) ───
  // หมายเหตุ: jsonLines สร้างภายใน SP จาก PO ที่มี line_type='ORDER' และ qty_received < qty_order
  static async createGr(
    poId: number,
    note?: string | null
  ): Promise<{ gr_id: number; gr_no: string }> {
    return Api.post<{ gr_id: number; gr_no: string }>('/gr/create', {
      po_id: poId,
      note: note || null,
    });
  }

  // ─── ยืนยัน GR (CONFIRMED) ───
  static async confirmGr(grId: number): Promise<{ status: string; message: string }> {
    return Api.post<{ status: string; message: string }>(`/gr/${grId}/confirm`, {});
  }
}
