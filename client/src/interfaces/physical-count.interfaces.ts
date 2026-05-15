// ===== Stock Period (with active count info from getAvailablePeriods) =====
export interface IStockPeriod {
  period_code: string;
  period_start: string;
  period_end: string;
  period_status: string;
  created_by: string;
  created_at: string;
  active_count_id: number | null;
  active_count_status: 'DRAFT' | 'SUBMITTED' | null;
}

// ===== Physical Count Header (from SP03 result set 1) =====
export interface IPhysicalCountHeader {
  count_id: number;
  period_code: string;
  period_start: string;
  period_end: string;
  count_status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';
  note: string | null;
  created_by: string;
  created_by_name: string | null;
  created_at: string;
  submitted_by: string | null;
  submitted_by_name: string | null;
  submitted_at: string | null;
  approved_by: string | null;
  approved_by_name: string | null;
  approved_at: string | null;
  rejected_reason: string | null;
}

// ===== Physical Count Line (from SP03 result set 2) =====
export interface IPhysicalCountLine {
  line_id: number;
  item_id: number;
  item_code: string;
  item_name_th: string;
  item_name_en: string | null;
  unit_name_th: string | null;
  item_min: number | null;
  item_max: number | null;
  qty_system: number;
  qty_counted: number;
  diff_qty: number;
  diff_status: 'เกิน' | 'ขาด' | 'ตรง';
  note: string | null;
  snapshot_prev_qty: number;
  received_qty: number;
  issued_qty: number;
}

// ===== SP03 full response =====
export interface IPhysicalCountComparison {
  header: IPhysicalCountHeader;
  lines: IPhysicalCountLine[];
}

// ===== DTOs for API Requests =====

export interface IPhysicalCountCreateDto {
  PeriodCode: string;
  Note?: string;
}

// Line item for save (sent to SP02 as JSON array)
export interface IPhysicalCountLineEdit {
  item_id: number;
  qty_counted: number;
  note: string;
}

export interface IPhysicalCountSubmitDto {
  // No body — user identity comes from JWT
}

export interface IPhysicalCountApproveDto {
  // No body — user identity comes from JWT
}

export interface IPhysicalCountRejectDto {
  RejectedReason: string;
}
