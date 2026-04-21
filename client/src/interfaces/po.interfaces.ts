// ===== PO Header (from listing query) =====
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

// ===== PO Line Form (for create/edit ORDER lines) =====
export interface IPoLineForm {
  item_id: number;
  qty: number;
  item_code?: string;
  item_name_th?: string;
  item_name_en?: string;
  unit_name_th?: string;
  unit_price?: number;
  total_price?: number;
}

// ===== Pending Borrow (for settlement selection) =====
export interface IPendingBorrow {
  borrow_id: number;
  borrow_no: string;
  borrow_date: string;
  supplier_id: number;
  supplier_name: string;
  [key: string]: any;
}
