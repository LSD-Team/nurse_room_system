// ===== Physical Count DTOs =====

// ===== Request DTOs for SPs =====

export interface IPhysicalCountCreateDto {
  PeriodCode: string;
  Note?: string;
}

export interface IPhysicalCountSaveLinesDto {
  CountId: number;
  JsonData: string; // JSON array: [{"item_id": int, "qty_counted": decimal, "note": string}]
}

export interface IPhysicalCountSubmitDto {
  CountId: number;
}

export interface IPhysicalCountApproveDto {
  CountId: number;
}

export interface IPhysicalCountRejectDto {
  CountId: number;
  RejectedReason: string;
}

// ===== Response DTOs from SPs =====

// Result from sp_PhysCount_01_Create
export interface IPhysicalCountCreateResponse {
  Status: number;
  Message: string;
  CountId?: number;
  PeriodCode?: string;
}

// Result from sp_PhysCount_02_SaveLines
export interface IPhysicalCountSaveLinesResponse {
  Status: number;
  Message: string;
  UpdatedRows?: number;
}

// Header result from sp_PhysCount_03_GetComparison (result set 1)
export interface IPhysicalCountHeader {
  count_id: number;
  period_code: string;
  period_start: string;
  period_end: string;
  count_status: string;
  note: string | null;
  created_by: string;
  created_at: string;
  submitted_by: string | null;
  submitted_at: string | null;
  approved_by: string | null;
  approved_at: string | null;
  rejected_reason: string | null;
}

// Line result from sp_PhysCount_03_GetComparison (result set 2)
export interface IPhysicalCountLine {
  line_id: number;
  item_id: number;
  item_code: string;
  item_name_th: string;
  unit_name_th: string | null;
  qty_system: number;
  qty_counted: number;
  diff_qty: number;
  diff_status: 'เกิน' | 'ขาด' | 'ตรง';
  note: string | null;
}

// Full comparison response with both header and lines
export interface IPhysicalCountComparison {
  header: IPhysicalCountHeader;
  lines: IPhysicalCountLine[];
}

// Result from sp_PhysCount_04_Submit
export interface IPhysicalCountSubmitResponse {
  Status: number;
  Message: string;
  CountId?: number;
  PeriodCode?: string;
}

// Result from sp_PhysCount_05_Approve
export interface IPhysicalCountApproveResponse {
  Status: number;
  Message: string;
  PeriodCode?: string;
  CountId?: number;
}

// Result from sp_PhysCount_06_Reject
export interface IPhysicalCountRejectResponse {
  Status: number;
  Message: string;
  CountId?: number;
  PeriodCode?: string;
}

// Common response type for SP status
export interface ISpResponse {
  Status: number;
  Message: string;
}
