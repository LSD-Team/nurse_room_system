import { Api } from '@/services/api.service';
import type {
  ITreatmentLookups,
  IVisitListItem,
  IVisitDetail,
  IVisitUsage,
  IExternalPerson,
  ICreateExternalPersonBody,
  ICreateVisitBody,
  IUpdateVisitBody,
  IPatientProfile,
  IUpsertAllergyBody,
  IUpsertDiseaseBody,
} from '@/interfaces/treatment.interfaces';

export class TreatmentService {
  // ─── Patient Profile ──────────────────────────────────────────────────
  static async getPatientProfile(params: {
    patient_type: 'EMP' | 'EXT';
    employee_id?: string;
    external_person_id?: number;
  }): Promise<IPatientProfile> {
    const qs = Object.entries(params)
      .filter(([, v]) => v != null && v !== '')
      .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
      .join('&');
    return Api.get<IPatientProfile>(`/treatment/patient-profile?${qs}`);
  }

  // ─── Lookups ───────────────────────────────────────────────────────────
  static async getLookups(): Promise<ITreatmentLookups> {
    return Api.get<ITreatmentLookups>('/treatment/lookups');
  }

  // ─── Allergies ────────────────────────────────────────────────────────
  static async upsertAllergy(body: IUpsertAllergyBody): Promise<{ allergy_id: number; action: string }> {
    return Api.post('/treatment/patient-profile/allergy', body);
  }

  static async deleteAllergy(allergyId: number, patientId: number): Promise<{ deleted: boolean }> {
    return Api.delete(`/treatment/patient-profile/allergy/${allergyId}?patient_id=${patientId}`);
  }

  // ─── Diseases ─────────────────────────────────────────────────────────
  static async upsertDisease(body: IUpsertDiseaseBody): Promise<{ condition_id: number; action: string }> {
    return Api.post('/treatment/patient-profile/disease', body);
  }

  static async deleteDisease(conditionId: number, patientId: number): Promise<{ deleted: boolean }> {
    return Api.delete(`/treatment/patient-profile/disease/${conditionId}?patient_id=${patientId}`);
  }

  static async getPatientVisitHistory(patientId: number): Promise<IVisitListItem[]> {
    return Api.get<IVisitListItem[]>(`/treatment/patient-profile/${patientId}/visits`);
  }

  // ─── External People ──────────────────────────────────────────────────
  static async searchExternalPeople(search?: string): Promise<IExternalPerson[]> {
    const params = search ? `?search=${encodeURIComponent(search)}` : '';
    return Api.get<IExternalPerson[]>(`/treatment/external-people${params}`);
  }

  static async createExternalPerson(body: ICreateExternalPersonBody): Promise<{ external_person_id: number }> {
    return Api.post('/treatment/external-people', body);
  }

  // ─── Visits ────────────────────────────────────────────────────────────
  static async getVisitList(params?: {
    date_from?: string;
    date_to?: string;
    patient_type?: string;
    page_size?: number;
    page_no?: number;
  }): Promise<IVisitListItem[]> {
    const qs = params
      ? '?' + Object.entries(params).filter(([, v]) => v != null).map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join('&')
      : '';
    return Api.get<IVisitListItem[]>(`/treatment/visits${qs}`);
  }

  static async getVisitById(visitId: number): Promise<{ visit: IVisitDetail; usages: IVisitUsage[] }> {
    return Api.get<{ visit: IVisitDetail; usages: IVisitUsage[] }>(`/treatment/visits/${visitId}`);
  }

  static async createVisit(body: ICreateVisitBody): Promise<{ visit_id: number }> {
    return Api.post('/treatment/visits', body);
  }

  static async getLastStockCountDate(): Promise<string | null> {
    const res = await Api.get<{ last_approved_date: string | null }>('/treatment/last-stock-count-date');
    return res.last_approved_date;
  }

  static async updateVisit(visitId: number, body: IUpdateVisitBody): Promise<{ message: string }> {
    return Api.put(`/treatment/visits/${visitId}`, body);
  }

  static async deleteVisit(visitId: number): Promise<{ message: string }> {
    return Api.delete(`/treatment/visits/${visitId}`);
  }
}
