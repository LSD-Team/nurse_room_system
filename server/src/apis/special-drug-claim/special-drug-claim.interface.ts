export interface ISpecialDrugClaimItemInput {
  item_id: number;
  qty_base: number;
  base_unit_id?: number | null;
}

export interface ICreateSpecialDrugClaimBody {
  visit_id?: number | null;
  claim_datetime?: string | null;
  reason?: string | null;
  items: ISpecialDrugClaimItemInput[];
}

export interface IUpdateSpecialDrugClaimItemInput {
  claim_item_id: number;
  new_qty_issued_base: number;
}

export interface IUpdateSpecialDrugClaimBody {
  claim_datetime?: string | null;
  reason?: string | null;
  adjustments?: IUpdateSpecialDrugClaimItemInput[];
}

export interface IReturnSpecialDrugBody {
  claim_item_id: number;
  qty_return_base: number;
  return_datetime?: string | null;
  reason?: string | null;
}

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
