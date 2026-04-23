/**
 * GR (Goods Receipt) Interfaces
 */

// List view row
export interface IGrHeaderList {
  gr_id: number;
  gr_no: string;
  gr_date: string; // ISO date string
  supplier_name: string;
  po_no: string;
  status: 'DRAFT' | 'PARTIAL' | 'CONFIRMED' | 'CANCELLED';
  created_by: string;
}

// Detail view
export interface IGrHeader {
  gr_id: number;
  gr_no: string;
  gr_date: string;
  supplier_id: number;
  supplier_name?: string;
  po_id: number;
  po_no?: string;
  status: string;
  note: string | null;
  confirmed_at: string | null;
  confirmed_by: string | null;
  cancelled_at: string | null;
  cancelled_by: string | null;
  created_by: string;
  created_at: string;
  updated_by: string | null;
  updated_at: string | null;
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

// Create request
export interface ICreateGrRequest {
  po_id: number;
  supplier_id: number;
  gr_date: string;
  lines: Array<{ item_id: number; qty_receive: number; unit_price?: number }>;
  note: string | null;
  created_by: string;
}

// API Response
export interface IApiGrListResponse {
  data: IGrHeaderList[];
  total: number;
}

export interface IApiGrDetailResponse {
  data: IGrDetail;
}
