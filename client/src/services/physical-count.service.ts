import { Api } from '@/services/api.service';
import type {
  IPhysicalCountHeader,
  IPhysicalCountLine,
  IPhysicalCountComparison,
  IPhysicalCountCreateDto,
  IPhysicalCountSaveLinesDto,
  IPhysicalCountSubmitDto,
  IPhysicalCountApproveDto,
  IPhysicalCountRejectDto,
} from '@/interfaces/physical-count.interfaces';

export class PhysicalCountService {
  // ─── ดึงรายการ periods ทั้งหมด ───
  static async getAvailablePeriods(): Promise<any[]> {
    return Api.get<any[]>('/physical-count/periods');
  }

  // ─── สร้าง Period ใหม่ ───
  static async createPeriod(
    periodEnd: string
  ): Promise<{ period_code: string; period_start: string; period_end: string; period_status: string }> {
    return Api.post('/physical-count/periods', { periodEnd });
  }

  // ─── แก้ไขวันสิ้นสุด Period (OPEN เท่านั้น) ───
  static async editPeriodEnd(
    periodCode: string,
    newPeriodEnd: string,
  ): Promise<{ result: { Status: string; Message: string; period_code?: string; old_period_end?: string; new_period_end?: string }; period?: any }> {
    return Api.put(`/physical-count/periods/${periodCode}`, { newPeriodEnd });
  }

  // ─── ลบ Period (OPEN เท่านั้น) ───
  static async deletePeriod(
    periodCode: string,
  ): Promise<{ Status: string; Message: string; period_code?: string; deleted_period_start?: string; deleted_period_end?: string }> {
    return Api.delete(`/physical-count/periods/${periodCode}`);
  }

  // โ"€โ"€โ"€ ดึงข้อมูลการนับสต็อก โ"€โ"€โ"€
  static async getPhysicalCounts(): Promise<IPhysicalCountHeader[]> {
    return Api.get<IPhysicalCountHeader[]>('/physical-count');
  }

  // โ"€โ"€โ"€ ดึงรายละเอียดการนับสต็อก โ"€โ"€โ"€
  static async getPhysicalCountDetail(
    countId: number
  ): Promise<IPhysicalCountHeader> {
    return Api.get<IPhysicalCountHeader>(`/physical-count/${countId}`);
  }

  // โ"€โ"€โ"€ ดึงรายการสินค้า (lines) ของการนับ โ"€โ"€โ"€
  static async getPhysicalCountLines(
    countId: number
  ): Promise<IPhysicalCountLine[]> {
    return Api.get<IPhysicalCountLine[]>(`/physical-count/${countId}/lines`);
  }

  // โ"€โ"€โ"€ สร้างการนับสต็อกใหม่ โ"€โ"€โ"€
  static async createPhysicalCount(
    data: IPhysicalCountCreateDto
  ): Promise<{ count_id: number; message: string }> {
    return Api.post('/physical-count', data);
  }

  // โ"€โ"€โ"€ บันทึก/แก้ไขยอดนับสินค้า โ"€โ"€โ"€
  static async saveCountLines(
    countId: number,
    data: IPhysicalCountSaveLinesDto
  ): Promise<{ message: string }> {
    return Api.post(`/physical-count/${countId}/save-lines`, data);
  }

  // โ"€โ"€โ"€ ดูรายงานเปรียบเทียบ (ระบบ vs นับ) โ"€โ"€โ"€
  static async getComparison(
    countId: number
  ): Promise<IPhysicalCountComparison[]> {
    return Api.get<IPhysicalCountComparison[]>(
      `/physical-count/${countId}/comparison`
    );
  }

  // โ"€โ"€โ"€ ส่งขออนุมัติ GROUP_LEAD โ"€โ"€โ"€
  static async submitCount(
    countId: number,
    data: IPhysicalCountSubmitDto
  ): Promise<{ message: string }> {
    return Api.post(`/physical-count/${countId}/submit`, data);
  }

  // โ"€โ"€โ"€ GROUP_LEAD อนุมัติ + ทำ snapshot โ"€โ"€โ"€
  static async approveCount(
    countId: number,
    data: IPhysicalCountApproveDto
  ): Promise<{ message: string }> {
    return Api.post(`/physical-count/${countId}/approve`, data);
  }

  // โ"€โ"€โ"€ GROUP_LEAD ปฏิเสธ โ"€โ"€โ"€
  static async rejectCount(
    countId: number,
    data: IPhysicalCountRejectDto
  ): Promise<{ message: string }> {
    return Api.post(`/physical-count/${countId}/reject`, data);
  }
}
