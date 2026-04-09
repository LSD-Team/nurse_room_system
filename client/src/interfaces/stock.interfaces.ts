// ===== Stock Movement Record =====
export interface IStockMovement {
  movement_id: number;
  movement_type: string;
  item_id: number;
  item_code: string;
  item_name_th: string;
  item_name_en: string;
  qty_base: number;
  ref_type: string;
  ref_id: string | null;
  created_by: string;
  created_by_name: string | null;
  created_at: string;
  reason: string | null;
}

// ===== Employee Info (for created_by display) =====
export interface IEmployee {
  emp_id: string;
  emp_code: string;
  emp_prefix: string;
  fname_th: string;
  lname_th: string;
  fname_en: string;
  lname_en: string;
  position_desc_th: string;
  cost_center_id: string;
  cost_center_th: string;
}
