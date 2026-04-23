/**
 * GR (Goods Receipt) Interfaces - Server Side
 */

// ───────────────────────────────────────────────────
// Responses
// ───────────────────────────────────────────────────

export interface IGrHeaderList {
  gr_id: number;
  gr_no: string;
  gr_date: Date;
  supplier_name: string;
  po_no: string;
  status: string;
  created_by: string;
}

export interface IAvailablePo {
  po_id: number;
  po_no: string;
  po_date: Date;
  supplier_id: number;
  supplier_name: string;
  status: string;
}

export interface IGrHeader {
  gr_id: number;
  gr_no: string;
  gr_date: Date;
  supplier_id: number;
  supplier_name?: string;
  po_id: number;
  po_no?: string;
  status: string;
  note: string | null;
  confirmed_at: Date | null;
  confirmed_by: string | null;
  cancelled_at: Date | null;
  cancelled_by: string | null;
  created_by: string;
  created_at: Date;
  updated_by: string | null;
  updated_at: Date | null;
}

export interface IGrLine {
  gr_line_id: number;
  gr_id: number;
  item_id: number;
  item_code?: string;
  item_name_th?: string;
  qty_receive: number;
  unit_price: number;
  total_price: number;
  po_line_id: number;
}

export interface IGrDetail {
  header: IGrHeader | null;
  lines: IGrLine[];
}

// ───────────────────────────────────────────────────
// Requests (DTOs)
// ───────────────────────────────────────────────────

export interface ICreateGrDto {
  po_id: number;
  supplier_id: number;
  gr_date: string;
  lines: Array<{
    item_id: number;
    qty_receive: number;
    unit_price?: number;
  }>;
  note: string | null;
  created_by: string;
}

export interface IUpdateGrDto {
  lines?: Array<{
    gr_line_id?: number;
    item_id: number;
    qty_receive: number;
    unit_price?: number;
  }>;
  note?: string | null;
  updated_by: string;
}

export interface IConfirmGrDto {
  gr_id: number;
  confirmed_by: string;
}

export interface ICancelGrDto {
  gr_id: number;
  cancelled_by: string;
}
