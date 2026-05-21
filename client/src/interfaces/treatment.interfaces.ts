// ─── Lookup types ───────────────────────────────────────────────────
export interface ILookupItem {
  id: number;
  code: string;
  name_th: string;
  name_en: string;
  sort_order?: number;
  is_active?: boolean;
}

export interface IDiseaseSubGroup extends ILookupItem {
  group_id: number;
}

export interface IHospital {
  hospital_id: number;
  hospital_code: string;
  hospital_name_th: string;
  hospital_name_en: string;
  hospital_type: string;
  is_active: boolean;
}

export interface ITreatmentLookups {
  treatment_types: ILookupItem[];
  refer_types: ILookupItem[];
  severity_types: ILookupItem[];
  disease_groups: ILookupItem[];
  disease_sub_groups: IDiseaseSubGroup[];
  hospitals: IHospital[];
}

// ─── External Person ─────────────────────────────────────────────────
export interface IExternalPerson {
  external_person_id: number;
  full_name: string;
  company: string;
  national_id: string;
  passport_no: string;
  phone: string;
  created_at: string;
  visit_count: number;
}

export interface ICreateExternalPersonBody {
  full_name: string;
  company?: string;
  national_id?: string;
  passport_no?: string;
  phone?: string;
}

// ─── Visit List ───────────────────────────────────────────────────────
export interface IVisitListItem {
  visit_id: number;
  visit_datetime: string;
  shift_code: string;
  patient_type: string;
  employee_id: string;
  external_person_id: number;
  patient_id: number;
  patient_name: string;
  patient_company: string;
  symptoms: string;
  disease_group_name: string;
  disease_sub_group_name: string;
  treatment_type_name: string;
  treatment_code: string;
  accident_in_work_flag: boolean;
  work_related_flag: boolean;
  refer_flag: boolean;
  refer_type_name: string;
  created_by: string;
  created_at: string;
  usage_count: number;
  total_rows: number;
}

// ─── Visit Detail ─────────────────────────────────────────────────────
export interface IVisitDetail {
  visit_id: number;
  visit_datetime: string;
  shift_code: string;
  patient_type: string;
  employee_id: string;
  external_person_id: number;
  ext_patient_name: string;
  ext_patient_company: string;
  ext_national_id: string;
  ext_phone: string;
  symptoms: string;
  vitals_json: string;
  group_id: number;
  disease_group_name: string;
  disease_id: number;
  disease_sub_group_name: string;
  treatment_type_id: number;
  treatment_type_name: string;
  treatment_code: string;
  nursing_advice: string;
  accident_in_work_flag: boolean;
  work_related_flag: boolean;
  severity_id: number;
  severity_name: string;
  refer_flag: boolean;
  refer_type_id: number;
  refer_type_name: string;
  hospital_id: number;
  hospital_name_th: string;
  created_by: string;
  created_at: string;
}

export interface IVitals {
  bp_systolic?: number;
  bp_diastolic?: number;
  pulse?: number;
  temp?: number;
  weight?: number;
  height?: number;
  bmi?: number;
  o2_sat?: number;
  rr?: number;
}

// ─── Visit Usage ───────────────────────────────────────────────────────
export interface IVisitUsage {
  visit_usage_id: number;
  visit_id: number;
  item_id: number;
  item_name_en: string;
  item_code: string;
  unit_name: string;
  qty_base: number;
  created_by: string;
  created_at: string;
}

export interface IVisitUsageForm {
  item_id: number;
  item_code: string;
  item_name_en: string;
  unit_name: string;
  stock_qty: number;
  qty_base: number;
}

// ─── Create Visit ─────────────────────────────────────────────────────
export interface ICreateVisitBody {
  patient_type: 'EMP' | 'EXT';
  employee_id?: string;
  external_person_id?: number;
  visit_datetime: string;
  shift_code?: string;
  symptoms?: string;
  vitals_json?: string;
  group_id?: number;
  disease_id?: number;
  treatment_type_id?: number;
  nursing_advice?: string;
  accident_in_work_flag?: boolean;
  work_related_flag?: boolean;
  severity_id?: number;
  refer_flag?: boolean;
  refer_type_id?: number;
  hospital_id?: number;
  usages?: { item_id: number; qty_base: number }[];
}
