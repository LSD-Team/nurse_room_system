// ===== Physical Count Header (master record) =====
export interface IPhysicalCountHeader {
  count_id: number;
  count_no: string;
  period_code: string;
  period_name: string;
  count_status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
  submitted_at: string | null;
  submitted_by: string | null;
  approved_at: string | null;
  approved_by: string | null;
  rejected_at: string | null;
  rejected_by: string | null;
  rejection_reason: string | null;
  created_at: string;
  created_by: string;
  updated_at: string | null;
  updated_by: string | null;
}

// ===== Physical Count Line (item detail) =====
export interface IPhysicalCountLine {
  count_line_id: number;
  count_id: number;
  item_id: number;
  item_code: string;
  item_name_th: string;
  item_name_en: string;
  qty_system: number; // ยอดระบบ (frozen at create time)
  qty_counted: number; // ยอดนับ
  unit_code: string;
  unit_name_th: string;
  remark: string | null;
  created_at: string;
  created_by: string;
  updated_at: string | null;
  updated_by: string | null;
}

// ===== Physical Count Comparison (for reporting) =====
export interface IPhysicalCountComparison {
  item_id: number;
  item_code: string;
  item_name_th: string;
  qty_system: number;
  qty_counted: number;
  diff_qty: number;
  unit_code: string;
  unit_name_th: string;
  remark: string | null;
}

// ===== DTOs for API Requests =====

export interface IPhysicalCountCreateDto {
  period_code: string;
}

export interface IPhysicalCountLineDetail {
  item_id: number;
  qty_counted: number;
  remark?: string;
}

export interface IPhysicalCountSaveLinesDto {
  lines: IPhysicalCountLineDetail[];
}

export interface IPhysicalCountSubmitDto {
  note?: string;
}

export interface IPhysicalCountApproveDto {
  note?: string;
}

export interface IPhysicalCountRejectDto {
  rejection_reason: string;
}
