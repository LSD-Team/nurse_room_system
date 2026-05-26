import { Api } from '@/services/api.service';
import type {
  IStockPeriod,
  IPhysicalCountHeader,
  IPhysicalCountComparison,
  IPhysicalCountLineEdit,
  IPhysicalCountCreateDto,
} from '@/interfaces/physical-count.interfaces';

export class PhysicalCountService {
  // ─── ดึงรายการ periods ทั้งหมด (พร้อม active_count_id) ───
  static async getAvailablePeriods(): Promise<IStockPeriod[]> {
    return Api.get<IStockPeriod[]>('/physical-count/periods');
  }

  // ─── สร้าง Period ใหม่ ───
  static async createPeriod(periodEnd: string): Promise<{
    period_code: string;
    period_start: string;
    period_end: string;
    period_status: string;
  }> {
    return Api.post('/physical-count/periods', { periodEnd });
  }

  // ─── แก้ไขวันสิ้นสุด Period (OPEN เท่านั้น) ───
  static async editPeriodEnd(
    periodCode: string,
    newPeriodEnd: string
  ): Promise<{
    result: {
      Status: string;
      Message: string;
      period_code?: string;
      old_period_end?: string;
      new_period_end?: string;
    };
    period?: any;
  }> {
    return Api.put(`/physical-count/periods/${periodCode}`, { newPeriodEnd });
  }

  // ─── ลบ Period (OPEN เท่านั้น) ───
  static async deletePeriod(periodCode: string): Promise<{
    Status: string;
    Message: string;
    period_code?: string;
    deleted_period_start?: string;
    deleted_period_end?: string;
  }> {
    return Api.delete(`/physical-count/periods/${periodCode}`);
  }

  // ─── ดึง active count (DRAFT/SUBMITTED) ของ period ───
  static async getCountByPeriod(
    periodCode: string
  ): Promise<IPhysicalCountHeader | null> {
    return Api.get<IPhysicalCountHeader | null>(
      `/physical-count/by-period/${periodCode}`
    );
  }

  // ─── สร้างการนับสต็อกใหม่ (sp_PhysCount_01_Create) ───
  static async createPhysicalCount(data: IPhysicalCountCreateDto): Promise<{
    Status: number;
    Message: string;
    CountId?: number;
    PeriodCode?: string;
  }> {
    return Api.post('/physical-count/create', data);
  }

  // ─── ดึงข้อมูล header + lines เปรียบเทียบ (sp_PhysCount_03_GetComparison) ───
  static async getComparison(
    countId: number
  ): Promise<IPhysicalCountComparison> {
    return Api.get<IPhysicalCountComparison>(
      `/physical-count/${countId}/comparison`
    );
  }

  // ─── บันทึก/แก้ไขยอดนับ (sp_PhysCount_02_SaveLines) ───
  static async saveCountLines(
    countId: number,
    lines: IPhysicalCountLineEdit[]
  ): Promise<{ Status: number; Message: string; UpdatedRows?: number }> {
    return Api.post(`/physical-count/${countId}/save-lines`, {
      JsonData: JSON.stringify(lines),
    });
  }

  // ─── ส่งขออนุมัติ GROUP_LEAD (sp_PhysCount_04_Submit) ───
  static async submitCount(countId: number): Promise<{
    Status: number;
    Message: string;
    CountId?: number;
    PeriodCode?: string;
  }> {
    return Api.post(`/physical-count/${countId}/submit`, {});
  }

  // ─── GROUP_LEAD อนุมัติ (sp_PhysCount_05_Approve) ───
  static async approveCount(countId: number): Promise<{
    Status: number;
    Message: string;
    CountId?: number;
    PeriodCode?: string;
  }> {
    return Api.post(`/physical-count/${countId}/approve`, {});
  }

  // ─── GROUP_LEAD ปฏิเสธ (sp_PhysCount_06_Reject) ───
  static async rejectCount(
    countId: number,
    rejectedReason: string
  ): Promise<{
    Status: number;
    Message: string;
    CountId?: number;
    PeriodCode?: string;
  }> {
    return Api.post(`/physical-count/${countId}/reject`, {
      RejectedReason: rejectedReason,
    });
  }
}
