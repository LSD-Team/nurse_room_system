import { Api } from '@/services/api.service';
import type {
  ITreatmentLookups,
  IVisitListItem,
  IVisitDetail,
  IVisitUsage,
  IExternalPerson,
  ICreateExternalPersonBody,
  ICreateVisitBody,
} from '@/interfaces/treatment.interfaces';

export class TreatmentService {
  // ─── Lookups ───────────────────────────────────────────────────────────
  static async getLookups(): Promise<ITreatmentLookups> {
    return Api.get<ITreatmentLookups>('/treatment/lookups');
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
}
