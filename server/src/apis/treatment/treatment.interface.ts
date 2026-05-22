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
  usages?: { item_id: number; qty_base: number }[];
}

export interface IGetVisitListQuery {
  date_from?: string;
  date_to?: string;
  patient_type?: string;
  employee_id?: string;
  treatment_type_id?: number;
  page_size?: number;
  page_no?: number;
}

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
  created_by: string;
  created_at: string;
  updated_by: string | null;
  updated_at: string | null;
}

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

export interface IUpdateVisitUsageBody {
  new_qty_base: number;
  reason: string;
}

export interface IUpdateUsageItem {
  action: 'ADD' | 'EDIT' | 'DELETE';
  visit_usage_id?: number;
  item_id?: number;
  qty_base?: number;
}

export interface IUpdateVisitBody {
  symptoms?: string | null;
  vitals_json?: string | null;
  nursing_advice?: string | null;
  group_id?: number | null;
  disease_id?: number | null;
  treatment_type_id?: number | null;
  accident_in_work_flag?: boolean;
  work_related_flag?: boolean;
  refer_flag?: boolean;
  refer_type_id?: number | null;
  severity_id?: number | null;
  reason: string;
  usages?: IUpdateUsageItem[];
}

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

export interface IPatientProfileQuery {
  patient_type: 'EMP' | 'EXT';
  employee_id?: string;
  external_person_id?: number;
}

export interface IUpsertAllergyBody {
  allergy_id?: number;
  patient_id: number;
  allergy_type: 'DRUG' | 'FOOD' | 'SUBSTANCE' | 'OTHER';
  allergy_name: string;
  item_id?: number;
  reaction?: string;
  severity: 'MILD' | 'MODERATE' | 'SEVERE' | 'LIFE_THREATENING';
  source?: string;
  noted_at?: string;
}

export interface IUpsertDiseaseBody {
  condition_id?: number;
  patient_id: number;
  disease_name: string;
  sub_group_id?: number;
  diagnosed_year?: number;
  control_status?: string;
  note?: string;
}

export interface IPatientAllergyRecord {
  allergy_id: number;
  drug_name: string;
  item_id: number | null;
  reaction: string;
  severity: 'MILD' | 'MODERATE' | 'SEVERE' | 'LIFE_THREATENING';
  allergy_type: 'DRUG' | 'FOOD' | 'SUBSTANCE' | 'OTHER';
  source: string;
  noted_at: string;
}

export interface IPatientUnderlyingDiseaseRecord {
  condition_id: number;
  disease_name: string;
  sub_group_id: number | null;
  diagnosed_year: number | null;
  control_status: string;
}

export interface IPatientPhysicalRecord {
  weight_kg: number;
  height_cm: number;
  bmi: number | null;
  measured_at: string;
}

export interface IPatientProfileResult {
  patient_id: number;
  patient_type: 'EMP' | 'EXT';
  no_known_allergy: boolean;
  total_visits: number;
  allergies: IPatientAllergyRecord[];
  underlying_diseases: IPatientUnderlyingDiseaseRecord[];
  latest_physical: IPatientPhysicalRecord | null;
}
