export interface ISupplierMasterData {
  supplier_id: number;
  supplier_code: string;
  supplier_name: string;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  tax_id: string | null;
  note: string | null;
  is_active: boolean;
  created_by: string;
  created_at: string;
}

export interface ISupplierUpsertBody {
  supplier_code: string;
  supplier_name: string;
  contact_name?: string;
  phone?: string;
  email?: string;
  address?: string;
  tax_id?: string;
  note?: string;
}

export interface IUnitLookupOption {
  unit_id: number;
  unit_code: string;
  unit_name_th: string | null;
  unit_name_en: string | null;
}

export interface ISupplierPriceListItemRow {
  item_id: number;
  item_code: string;
  item_name_th: string;
  item_name_en: string | null;
  usage_unit_id: number;
  usage_unit_name_th: string | null;
  usage_unit_name_en: string | null;
  selected: boolean;
  price_id: number | null;
  unit_id: number | null;
  unit_price: number | null;
  conversion_factor: number | null;
  effective_date: string | null;
  expire_date: string | null;
  is_active: boolean | null;
}

export interface ISupplierPriceListItemsResponse {
  supplier_id: number;
  supplier_code: string;
  supplier_name: string;
  items: ISupplierPriceListItemRow[];
  units: IUnitLookupOption[];
}

export interface ISupplierPriceListBulkRow {
  item_id: number;
  selected: boolean;
  price_id?: number | null;
  unit_id?: number | null;
  unit_price?: number | null;
  conversion_factor?: number | null;
  effective_date?: string | null;
  expire_date?: string | null;
}

export interface ISupplierPriceListBulkBody {
  rows: ISupplierPriceListBulkRow[];
}

export interface ITreatmentTypeMasterData {
  treatment_type_id: number;
  treatment_code: string;
  treatment_name_th: string;
  treatment_name_en: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface ITreatmentTypeUpsertBody {
  treatment_code: string;
  treatment_name_th: string;
  treatment_name_en?: string;
  sort_order?: number;
}

export interface IReferTypeMasterData {
  refer_type_id: number;
  refer_code: string;
  refer_name_th: string;
  refer_name_en: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface IReferTypeUpsertBody {
  refer_code: string;
  refer_name_th: string;
  refer_name_en?: string;
  sort_order?: number;
}

export interface IDiseaseGroupMasterData {
  group_id: number;
  group_code: string;
  group_name_th: string;
  group_name_en: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
}

export interface IDiseaseGroupUpsertBody {
  group_code: string;
  group_name_th: string;
  group_name_en?: string;
  sort_order?: number;
}

export interface IDiseaseGroupLookup {
  group_id: number;
  group_code: string;
  group_name_th: string;
  group_name_en: string | null;
  sort_order: number;
}

export interface IDiseaseTypeMasterData {
  sub_group_id: number;
  group_id: number;
  group_code: string | null;
  group_name_th: string | null;
  group_name_en: string | null;
  sub_group_code: string;
  sub_group_name_th: string;
  sub_group_name_en: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
}

export interface IDiseaseTypeUpsertBody {
  group_id: number;
  sub_group_code: string;
  sub_group_name_th: string;
  sub_group_name_en?: string;
  sort_order?: number;
}

export interface IHospitalMasterData {
  hospital_id: number;
  hospital_code: string;
  hospital_name_th: string;
  hospital_name_en: string | null;
  hospital_type: string | null;
  address: string | null;
  phone: string | null;
  is_active: boolean;
  created_at: string;
}

export interface IHospitalTypeLookup {
  hospital_type: string;
  type_name_th: string;
  type_name_en: string | null;
}

export interface IHospitalUpsertBody {
  hospital_code: string;
  hospital_name_th: string;
  hospital_name_en?: string;
  hospital_type?: string;
  address?: string;
  phone?: string;
}

export interface IUnitMasterData {
  unit_id: number;
  unit_code: string;
  unit_name_th: string | null;
  unit_name_en: string | null;
  is_active: boolean;
  created_at: string;
}

export interface IUnitUpsertBody {
  unit_code: string;
  unit_name_th?: string;
  unit_name_en?: string;
}

export interface IItemTypeLookup {
  item_type_id: number;
  item_type_name: string | null;
}

export interface IItemMasterData {
  item_id: number;
  item_code: string;
  item_name_th: string;
  item_name_en: string;
  item_type_id: number;
  item_type_name: string | null;
  usage_unit_id: number;
  usage_unit_name_th: string | null;
  usage_unit_name_en: string | null;
  item_min: number | null;
  item_max: number | null;
  is_active: boolean;
  created_at: string;
  update_at: string | null;
}

export interface IItemUpsertBody {
  item_code: string;
  item_name_th: string;
  item_name_en: string;
  item_type_id: number;
  usage_unit_id: number;
  item_min?: number | null;
  item_max?: number | null;
}
