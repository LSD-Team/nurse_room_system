import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@/src/database/database.service';
import type {
  ICreateReferCaseBody,
  IPatchReferCaseBody,
  ICreateFollowupBody,
  IPatchFollowupBody,
} from './refer.interface';

@Injectable()
export class ReferService {
  constructor(private readonly db: DatabaseService) {}

  private get DB(): string {
    return this.db.getDatabaseName();
  }

  // ─── GET /refer/cases/:visitId ────────────────────────────────────────────────
  async getCasesByVisit(visitId: number) {
    return this.db.query<any>(
      this.DB,
      `SELECT refer_case_id, visit_id, refer_no, refer_code, refer_name_en,
              status, opened_at, closed_at
       FROM vw_refer_cases_summary
       WHERE visit_id = @visitId
       ORDER BY refer_no`,
      { visitId },
    );
  }

  // ─── GET /refer/by-patient/:patientId ─────────────────────────────────────────
  async getByPatient(patientId: string) {
    return this.db.query<any>(
      this.DB,
      `-- Explicit refer cases (tracked in refer_cases table)
       SELECT rc.refer_case_id, rc.visit_id, rc.refer_no,
              rc.refer_type_id, rt.refer_code, rt.refer_name_en,
              rc.status, rc.opened_at, rc.closed_at, rc.refer_reason,
              v.visit_datetime,
              v.symptoms,
              dg.group_name_th   AS disease_group_name,
              ds.sub_group_name_th AS disease_sub_group_name
       FROM refer_cases rc
       JOIN refer_types rt      ON rt.refer_type_id  = rc.refer_type_id
       JOIN visits v            ON v.visit_id        = rc.visit_id
       LEFT JOIN disease_groups dg      ON dg.group_id      = v.group_id
       LEFT JOIN disease_sub_groups ds  ON ds.sub_group_id  = v.disease_id
       WHERE v.patient_id = @patientId
         AND rc.is_deleted = 0

       UNION ALL

       -- Implicit refer cases: visits with refer_flag=1 but no refer_cases entry yet
       SELECT CAST(NULL AS INT)            AS refer_case_id,
              v.visit_id,
              CAST(0 AS INT)               AS refer_no,
              v.refer_type_id,
              rt.refer_code,
              rt.refer_name_en,
              'OPEN'                       AS status,
              v.visit_datetime             AS opened_at,
              CAST(NULL AS DATETIME)       AS closed_at,
              CAST(NULL AS NVARCHAR(500))  AS refer_reason,
              v.visit_datetime,
              v.symptoms,
              dg.group_name_th             AS disease_group_name,
              ds.sub_group_name_th         AS disease_sub_group_name
       FROM visits v
       JOIN refer_types rt      ON rt.refer_type_id  = v.refer_type_id
       LEFT JOIN disease_groups dg      ON dg.group_id      = v.group_id
       LEFT JOIN disease_sub_groups ds  ON ds.sub_group_id  = v.disease_id
       WHERE v.patient_id = @patientId
         AND v.refer_flag = 1
         AND v.refer_type_id IS NOT NULL
         AND NOT EXISTS (
           SELECT 1 FROM refer_cases rc2
           WHERE rc2.visit_id = v.visit_id AND rc2.is_deleted = 0
         )

       ORDER BY opened_at DESC`,
      { patientId },
    );
  }

  // ─── POST /refer/cases ────────────────────────────────────────────────────────
  async createCase(body: ICreateReferCaseBody, createdBy: string) {
    return this.db.executeStoredProcedure(this.DB, 'sp_Refer_01_CreateCase', {
      VisitId: body.visit_id,
      ReferTypeId: body.refer_type_id,
      ReferReason: body.refer_reason ?? null,
      OpenedAt: body.opened_at ?? null,
      CreatedBy: createdBy,
    });
  }

  // ─── PATCH /refer/cases/:caseId ───────────────────────────────────────────────
  async patchCase(
    caseId: number,
    body: IPatchReferCaseBody,
    updatedBy: string,
  ) {
    const setClauses: string[] = [
      'updated_by = @updatedBy',
      'updated_at = GETDATE()',
    ];
    const params: Record<string, any> = { caseId, updatedBy };

    if (body.refer_type_id !== undefined) {
      setClauses.push('refer_type_id = @referTypeId');
      params.referTypeId = body.refer_type_id;
    }
    if (body.refer_reason !== undefined) {
      setClauses.push('refer_reason = @referReason');
      params.referReason = body.refer_reason;
    }
    if (body.status !== undefined) {
      setClauses.push('status = @status');
      params.status = body.status;
    }
    if (body.closed_at !== undefined) {
      setClauses.push('closed_at = @closedAt');
      params.closedAt = body.closed_at;
    }

    return this.db.query<any>(
      this.DB,
      `UPDATE refer_cases SET ${setClauses.join(', ')}
       WHERE refer_case_id = @caseId AND is_deleted = 0`,
      params,
    );
  }

  // ─── DELETE /refer/cases/:caseId ─────────────────────────────────────────────
  async deleteCase(caseId: number, deletedBy: string) {
    return this.db.query<any>(
      this.DB,
      `UPDATE refer_cases
       SET is_deleted = 1, updated_by = @deletedBy, updated_at = GETDATE()
       WHERE refer_case_id = @caseId AND is_deleted = 0`,
      { caseId, deletedBy },
    );
  }

  // ─── GET /refer/followups/:caseId ─────────────────────────────────────────────
  async getFollowupsByCase(caseId: number) {
    return this.db.query<any>(
      this.DB,
      `SELECT rf.followup_id, rf.refer_case_id, rf.followup_no, rf.followup_at,
              rf.outcome, rf.back_to_work_date, rf.next_appointment_at,
              rf.room_no, rf.followup_note, rf.treatment_cost,
              rf.hospital_id,
              h.hospital_name_th, h.hospital_name_en, h.hospital_code
       FROM refer_followups rf
       LEFT JOIN hospitals h ON h.hospital_id = rf.hospital_id
       WHERE rf.refer_case_id = @caseId
         AND rf.is_deleted = 0
       ORDER BY rf.followup_no`,
      { caseId },
    );
  }

  // ─── POST /refer/followups ────────────────────────────────────────────────────
  async createFollowup(body: ICreateFollowupBody, createdBy: string) {
    return this.db.executeStoredProcedure(
      this.DB,
      'sp_Refer_02_CreateFollowup',
      {
        ReferCaseId: body.refer_case_id,
        FollowupAt: body.followup_at ?? null,
        HospitalId: body.hospital_id ?? null,
        RoomNo: body.room_no ?? null,
        Outcome: body.outcome,
        BackToWorkDate: body.back_to_work_date ?? null,
        FollowupNote: body.followup_note ?? null,
        NextAppointmentAt: body.next_appointment_at ?? null,
        TreatmentCost: body.treatment_cost ?? null,
        CreatedBy: createdBy,
      },
    );
  }

  // ─── PATCH /refer/followups/:followupId ───────────────────────────────────────
  async patchFollowup(
    followupId: number,
    body: IPatchFollowupBody,
    updatedBy: string,
  ) {
    const setClauses: string[] = [
      'updated_by = @updatedBy',
      'updated_at = GETDATE()',
    ];
    const params: Record<string, any> = { followupId, updatedBy };

    if (body.followup_at !== undefined) {
      setClauses.push('followup_at = @followupAt');
      params.followupAt = body.followup_at;
    }
    if (body.hospital_id !== undefined) {
      setClauses.push('hospital_id = @hospitalId');
      params.hospitalId = body.hospital_id;
    }
    if (body.room_no !== undefined) {
      setClauses.push('room_no = @roomNo');
      params.roomNo = body.room_no;
    }
    if (body.outcome !== undefined) {
      setClauses.push('outcome = @outcome');
      params.outcome = body.outcome;
    }
    if (body.back_to_work_date !== undefined) {
      setClauses.push('back_to_work_date = @backToWorkDate');
      params.backToWorkDate = body.back_to_work_date;
    }
    if (body.followup_note !== undefined) {
      setClauses.push('followup_note = @followupNote');
      params.followupNote = body.followup_note;
    }
    if (body.next_appointment_at !== undefined) {
      setClauses.push('next_appointment_at = @nextAppointmentAt');
      params.nextAppointmentAt = body.next_appointment_at;
    }
    if (body.treatment_cost !== undefined) {
      setClauses.push('treatment_cost = @treatmentCost');
      params.treatmentCost = body.treatment_cost;
    }

    return this.db.query<any>(
      this.DB,
      `UPDATE refer_followups SET ${setClauses.join(', ')}
       WHERE followup_id = @followupId AND is_deleted = 0`,
      params,
    );
  }

  // ─── DELETE /refer/followups/:followupId ──────────────────────────────────────
  async deleteFollowup(followupId: number, deletedBy: string) {
    return this.db.query<any>(
      this.DB,
      `UPDATE refer_followups
       SET is_deleted = 1, updated_by = @deletedBy, updated_at = GETDATE()
       WHERE followup_id = @followupId AND is_deleted = 0`,
      { followupId, deletedBy },
    );
  }
}
