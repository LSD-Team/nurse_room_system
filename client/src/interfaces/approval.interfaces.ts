// ===== Combined Pending Approval Item =====
export interface IPendingApprovalItem {
  type: 'PO' | 'BORROW';
  id: number;
  doc_no: string;
  doc_date: string;
  status: string;
  supplier_id: number;
  supplier_name: string;
  note: string | null;
  created_by: string;
  created_by_name: string | null;
  current_approval_role: string;
  current_approver_id: string;
  current_approver_name: string | null;
}

// ===== PO Header =====
export interface IPoHeader {
  po_id: number;
  po_no: string;
  po_date: string;
  supplier_id: number;
  due_date: string | null;
  status: string;
  note: string | null;
  created_by: string;
  created_by_name: string | null;
  created_by_email: string | null;
  created_at: string;
}

// ===== PO Line =====
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
}

// ===== Approval History Row =====
export interface IApprovalHistory {
  approval_id: number;
  approval_level: number;
  approval_role: string;
  status: string;
  actioned_by: string | null;
  actioned_by_name: string | null;
  actioned_by_email: string | null;
  actioned_at: string | null;
  remark: string | null;
}

// ===== Borrow Approval Log =====
export interface IBorrowApprovalLog {
  log_id: number;
  borrow_id: number;
  approval_level: number;
  approval_role: string;
  action: string;
  actioned_by: string;
  actioned_by_name: string | null;
  actioned_at: string;
  remark: string | null;
}

// ===== Borrow Line (reuse from borrow) =====
export type { IBorrowLine } from './borrow.interfaces';
