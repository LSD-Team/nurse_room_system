import { Api } from '@/services/api.service';
import type {
  IGrHeaderList,
  IGrDetail,
  IPendingItem,
} from '@/interfaces/gr.interfaces';

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

  // ─── Pending items จาก specific PO ───
  static async getPendingItems(poId: number): Promise<IPendingItem[]> {
    return Api.get<IPendingItem[]>(`/gr/pending-items/${poId}`);
  }

  // ─── สร้าง GR ใหม่ (DRAFT) ───
  static async createGr(
    poId: number,
    jsonLines?: string | null,
    note?: string | null
  ): Promise<{ gr_id: number; gr_no: string }> {
    return Api.post<{ gr_id: number; gr_no: string }>('/gr/create', {
      po_id: poId,
      json_lines: jsonLines || null,
      note: note || null,
    });
  }

  // ─── ยืนยัน GR (CONFIRMED) ───
  static async confirmGr(
    grId: number
  ): Promise<{ status: string; message: string }> {
    return Api.post<{ status: string; message: string }>(
      `/gr/${grId}/confirm`,
      {}
    );
  }
}
