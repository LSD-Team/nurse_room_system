// ===== Borrow Header (from view_borrowed_items_header) =====
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

// ===== Borrow Line (from view_borrowed_items) =====
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

// ===== Supplier (for dropdown) =====
export interface ISupplier {
  supplier_id: number;
  supplier_code: string;
  supplier_name: string;
}

// ===== Supplier Item Price =====
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

// ===== Borrow Line Form (for create/edit) =====
export interface IBorrowLineForm {
  item_id: number;
  qty: number;
  // display-only fields populated from supplier price
  item_code?: string;
  item_name_th?: string;
  item_name_en?: string;
  unit_name_th?: string;
  unit_price?: number;
  total_price?: number;
}
