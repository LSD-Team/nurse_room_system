// ─── Request Bodies ───────────────────────────────────────────────────────────

export interface ICreateReferCaseBody {
  visit_id: number;
  refer_type_id: number;
  refer_reason?: string;
  opened_at?: string;
}

export interface IPatchReferCaseBody {
  refer_type_id?: number;
  refer_reason?: string;
  status?: 'OPEN' | 'CLOSED' | 'CANCELLED';
  closed_at?: string;
}

export interface ICreateFollowupBody {
  refer_case_id: number;
  followup_at?: string;
  hospital_id?: number;
  room_no?: string;
  outcome: 'ADMISSION' | 'BACK_TO_COMPANY' | 'BACK_TO_HOME' | 'FOLLOWUP_ONLY';
  back_to_work_date?: string;
  followup_note?: string;
  next_appointment_at?: string;
  treatment_cost?: number;
}

export interface IPatchFollowupBody {
  followup_at?: string;
  hospital_id?: number;
  room_no?: string;
  outcome?: 'ADMISSION' | 'BACK_TO_COMPANY' | 'BACK_TO_HOME' | 'FOLLOWUP_ONLY';
  back_to_work_date?: string;
  followup_note?: string;
  next_appointment_at?: string;
  treatment_cost?: number;
}

// ─── Response Shapes ──────────────────────────────────────────────────────────

export interface IReferCaseSummary {
  refer_case_id: number;
  visit_id: number;
  refer_no: number;
  refer_type_id: number;
  refer_code: string;
  refer_name_en: string;
  status: 'OPEN' | 'CLOSED' | 'CANCELLED';
  opened_at: string;
  closed_at: string | null;
  visit_datetime?: string;
}

export interface IReferFollowupTimeline {
  followup_id: number;
  refer_case_id: number;
  followup_no: number;
  followup_at: string;
  outcome: 'ADMISSION' | 'BACK_TO_COMPANY' | 'BACK_TO_HOME' | 'FOLLOWUP_ONLY';
  back_to_work_date: string | null;
  next_appointment_at: string | null;
  room_no: string | null;
  followup_note: string | null;
  hospital_id: number | null;
  hospital_name_th: string | null;
  hospital_name_en: string | null;
  hospital_code: string | null;
  treatment_cost: number | null;
}
