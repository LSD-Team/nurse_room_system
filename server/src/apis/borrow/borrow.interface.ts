// ===== View: view_borrowed_items_header =====
export interface IBorrowHeader {
  borrow_id: number;
  borrow_no: string;
  borrow_date: string;
  borrow_status: string;
  supplier_id: number;
  supplier_code: string;
  supplier_name: string;
  approval_level: number | null;
  approval_role: string | null;
  approval_status: string | null;
  actioned_by: string | null;
  actioned_by_eng_name: string | null;
  actioned_at: string | null;
  created_by_eng_name: string | null;
  remark: string | null;
}

// ===== View: view_borrowed_items (line detail) =====
export interface IBorrowLine {
  borrow_id: number;
  borrow_no: string;
  borrow_line_id: number;
  item_id: number;
  item_code: string;
  item_name_th: string;
  item_name_en: string;
  usage_unit_code: string;
  usage_unit_name_th: string;
  purchase_unit_code: string;
  purchase_unit_name_th: string;
  qty_borrow: number;
  unit_price: number;
  total_price: number;
  po_line_id: number | null;
  note: string | null;
  created_by: string;
  created_at: string;
  updated_by: string | null;
  updated_at: string | null;
}

// ===== View: view_supplier_item_prices_current =====
export interface ISupplierItemPrice {
  supplier_id: number;
  supplier_code: string;
  supplier_name: string;
  item_id: number;
  item_code: string;
  item_name_th: string;
  item_name_en: string;
  unit_id: number;
  unit_code: string;
  unit_name_th: string;
  unit_name_en: string;
  unit_price: number;
  conversion_factor: number;
  effective_date: string;
  expire_date: string | null;
}

// ===== Supplier (for dropdown) =====
export interface ISupplier {
  supplier_id: number;
  supplier_code: string;
  supplier_name: string;
}

// ===== SP Request DTOs =====
export interface ICreateBorrowDto {
  JsonLines: string; // JSON array: [{item_id, qty}]
  SupplierId: string;
  Note?: string;
  CreatedBy: string;
}

export interface IUpdateBorrowDto {
  BorrowId: string;
  JsonLines?: string;
  Note?: string;
  UpdatedBy: string;
}

export interface ISubmitBorrowDto {
  BorrowId: string;
  SubmitBy: string;
}

export interface IApproveBorrowDto {
  BorrowId: string;
  Action: 'APPROVE' | 'REJECT' | 'REWORK';
  ActionedBy: string;
  Remark?: string;
}

export interface IReceiveBorrowDto {
  BorrowId: string;
  ReceivedBy: string;
}

export interface ICancelBorrowDto {
  BorrowId: string;
  CancelledBy: string;
  Reason?: string;
}
