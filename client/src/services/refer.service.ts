import { Api } from '@/services/api.service';
import type {
  IReferCase,
  IReferFollowup,
} from '@/interfaces/treatment.interfaces';

export class ReferService {
  static async getCasesByPatient(patientId: string): Promise<IReferCase[]> {
    return Api.get(`/refer/by-patient/${patientId}`);
  }

  static async createCase(body: {
    visit_id: number;
    refer_type_id: number;
    refer_reason?: string;
    opened_at?: string;
  }): Promise<any> {
    return Api.post('/refer/cases', body);
  }

  static async patchCase(
    caseId: number,
    body: {
      refer_type_id?: number;
      refer_reason?: string;
      status?: string;
      closed_at?: string;
    }
  ): Promise<any> {
    return Api.patch(`/refer/cases/${caseId}`, body);
  }

  static async deleteCase(caseId: number): Promise<any> {
    return Api.delete(`/refer/cases/${caseId}`);
  }

  static async getFollowupsByCase(caseId: number): Promise<IReferFollowup[]> {
    return Api.get(`/refer/followups/${caseId}`);
  }

  static async createFollowup(body: {
    refer_case_id: number;
    followup_at?: string;
    hospital_id?: number;
    room_no?: string;
    outcome: string;
    back_to_work_date?: string;
    followup_note?: string;
    next_appointment_at?: string;
    treatment_cost?: number;
  }): Promise<any> {
    return Api.post('/refer/followups', body);
  }

  static async patchFollowup(
    followupId: number,
    body: {
      followup_at?: string;
      hospital_id?: number;
      room_no?: string;
      outcome?: string;
      back_to_work_date?: string;
      followup_note?: string;
      next_appointment_at?: string;
      treatment_cost?: number;
    }
  ): Promise<any> {
    return Api.patch(`/refer/followups/${followupId}`, body);
  }

  static async deleteFollowup(followupId: number): Promise<any> {
    return Api.delete(`/refer/followups/${followupId}`);
  }
}
