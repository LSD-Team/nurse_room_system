export interface ISpecialDrugClaimHeader {
  claim_id: number;
  visit_id: number | null;
  claim_datetime: string;
  reason: string | null;
  status: string; // Add this
  created_by: string;
  created_at: string;
}

export interface ISpecialDrugClaimItem {
  claim_item_id: number;
  claim_id: number;
  item_id: number;
  item_code: string | null;
  item_name_th: string | null;
  item_name_en: string | null;
  qty_issued_base: number;
  base_unit_id: number | null;
  base_unit_name_th: string | null;
  created_at: string;
}

export interface ISpecialDrugClaimMovementSummary {
  item_id: number;
  qty_withdrawn: number;
  qty_returned: number;
}

export interface ISpecialDrugClaimDetail {
  header: ISpecialDrugClaimHeader | null;
  items: ISpecialDrugClaimItem[];
  movement_summary: ISpecialDrugClaimMovementSummary[];
}

export interface ICreateSpecialDrugClaimItemInput {
  item_id: number;
  qty_base: number;
  base_unit_id?: number | null;
}

export interface ICreateSpecialDrugClaimBody {
  visit_id?: number | null;
  claim_datetime?: string | null;
  reason?: string | null;
  items: ICreateSpecialDrugClaimItemInput[];
}

export interface IUpdateSpecialDrugClaimAdjustment {
  claim_item_id: number;
  new_qty_issued_base: number;
}

export interface IUpdateSpecialDrugClaimBody {
  claim_datetime?: string | null;
  reason?: string | null;
  adjustments?: IUpdateSpecialDrugClaimAdjustment[];
}

export interface IReturnSpecialDrugBody {
  claim_item_id: number;
  qty_return_base: number;
  return_datetime?: string | null;
  reason?: string | null;
}
