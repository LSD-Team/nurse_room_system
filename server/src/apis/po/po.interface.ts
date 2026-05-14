// ===== PO Header (for listing) =====
export interface IPoHeader {
  po_id: number;
  po_no: string;
  po_date: string;
  supplier_id: number;
  supplier_code: string;
  supplier_name: string;
  due_date: string | null;
  po_status: string;
  note: string | null;
  created_by: string;
  created_by_eng_name: string | null;
  created_at: string;
  approval_level: number | null;
  approval_role: string | null;
  approval_status: string | null;
  actioned_by: string | null;
  actioned_by_eng_name: string | null;
  actioned_at: string | null;
  approval_remark: string | null;
}

// ===== PO Line (detail) =====
export interface IPoLine {
  po_line_id: number;
  po_id: number;
  item_id: number;
  item_code: string;
  item_name_th: string;
  item_name_en: string;
  purchase_unit_code: string;
  purchase_unit_name_th: string;
  qty_order: number;
  qty_received: number;
  unit_price: number;
  total_price: number;
  line_type: string;
  borrow_line_id: number | null;
  remark: string | null;
}

// ===== PO Approval =====
export interface IPoApproval {
  approval_id: number;
  po_id: number;
  approval_level: number;
  approval_role: string;
  status: string;
  actioned_by: string | null;
  actioned_by_name: string | null;
  actioned_at: string | null;
  remark: string | null;
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

// ===== SP Request DTOs =====
export interface ICreatePoDto {
  SupplierId: string;
  PoDate: string;
  DueDate?: string;
  JsonLines: string;
  BorrowIds?: string;
  Note?: string;
  CreatedBy: string;
}

export interface IUpdatePoDto {
  PoId: string;
  DueDate?: string;
  JsonLines?: string;
  Note?: string;
  UpdatedBy: string;
}

export interface ISubmitPoDto {
  PoId: string;
  SubmitBy: string;
}

export interface IApprovePoDto {
  PoId: string;
  Action: 'APPROVE' | 'REJECT';
  ActionedBy: string;
  Remark?: string;
}

export interface ICancelPoDto {
  PoId: string;
  CancelledBy: string;
  Reason?: string;
}
