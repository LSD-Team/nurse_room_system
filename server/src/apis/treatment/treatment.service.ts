import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { DatabaseService } from '@/src/database/database.service';
import type {
  ICreateVisitBody,
  ICreateExternalPersonBody,
  IGetVisitListQuery,
  IUpdateVisitUsageBody,
  IUpdateVisitBody,
  IPatientProfileQuery,
  IUpsertAllergyBody,
  IUpsertDiseaseBody,
} from './treatment.interface';

@Injectable()
export class TreatmentService {
  private readonly logger = new Logger(TreatmentService.name);

  constructor(private readonly db: DatabaseService) {}

  private get DATABASE_NAME(): string {
    return this.db.getDatabaseName();
  }

  // ─── POST: บันทึก visit ใหม่ (sp_TR_01_CreateVisit) ───
  async createVisit(body: ICreateVisitBody, createdBy: string) {
    const usagesJson = body.usages?.length
      ? JSON.stringify(body.usages)
      : null;

    return this.db.executeStoredProcedure(this.DATABASE_NAME, 'sp_TR_01_CreateVisit', {
      PatientType:        body.patient_type,
      EmployeeId:         body.employee_id ?? null,
      ExternalPersonId:   body.external_person_id ?? null,
      VisitDatetime:      body.visit_datetime,
      ShiftCode:          body.shift_code ?? null,
      Symptoms:           body.symptoms ?? null,
      VitalsJson:         body.vitals_json ?? null,
      GroupId:            body.group_id ?? null,
      DiseaseId:          body.disease_id ?? null,
      TreatmentTypeId:    body.treatment_type_id ?? null,
      NursingAdvice:      body.nursing_advice ?? null,
      AccidentInWorkFlag: body.accident_in_work_flag ? 1 : 0,
      WorkRelatedFlag:    body.work_related_flag ? 1 : 0,
      SeverityId:         body.severity_id ?? null,
      ReferFlag:          body.refer_flag ? 1 : 0,
      ReferTypeId:        body.refer_type_id ?? null,
      UsagesJson:         usagesJson,
      CreatedBy:          createdBy,
    });
  }

  // ─── GET: รายการ visits (sp_TR_02_GetVisitList) ───
  async getVisitList(query: IGetVisitListQuery) {
    return this.db.executeStoredProcedure(this.DATABASE_NAME, 'sp_TR_02_GetVisitList', {
      DateFrom:        query.date_from ?? null,
      DateTo:          query.date_to ?? null,
      PatientType:     query.patient_type ?? null,
      EmployeeId:      query.employee_id ?? null,
      TreatmentTypeId: query.treatment_type_id ?? null,
      PageSize:        query.page_size ?? 50,
      PageNo:          query.page_no ?? 1,
    });
  }

  // ─── GET: รายละเอียด 1 visit + usages (sp_TR_03_GetVisitById) ───
  async getVisitById(visitId: number) {
    // SP returns 2 resultsets: [0] = visit header, [1] = usages list
    const results = await this.db.executeStoredProcedureMultiple<any>(
      this.DATABASE_NAME,
      'sp_TR_03_GetVisitById',
      { VisitId: visitId },
    );
    return {
      visit:  results[0]?.[0] ?? null,
      usages: results[1] ?? [],
    };
  }

  // ─── PUT: แก้ไขจำนวนยาใน visit (sp_TR_04_UpdateVisitUsage) ───
  async updateVisitUsage(
    usageId: number,
    body: IUpdateVisitUsageBody,
    editedBy: string,
  ) {
    return this.db.executeStoredProcedure(this.DATABASE_NAME, 'sp_TR_04_UpdateVisitUsage', {
      VisitUsageId: usageId,
      NewQtyBase:   body.new_qty_base,
      EditedBy:     editedBy,
      Reason:       body.reason,
    });
  }

  // ─── GET: ค้นหาบุคคลภายนอก (sp_EXT_01_SearchExternalPerson) ───
  async searchExternalPeople(searchText?: string) {
    return this.db.executeStoredProcedure(this.DATABASE_NAME, 'sp_EXT_01_SearchExternalPerson', {
      SearchText: searchText ?? null,
    });
  }

  // ─── POST: สร้างบุคคลภายนอกใหม่ (sp_EXT_02_CreateExternalPerson) ───
  async createExternalPerson(body: ICreateExternalPersonBody, createdBy: string) {
    return this.db.executeStoredProcedure(this.DATABASE_NAME, 'sp_EXT_02_CreateExternalPerson', {
      FullName:   body.full_name,
      Company:    body.company ?? null,
      NationalId: body.national_id ?? null,
      PassportNo: body.passport_no ?? null,
      Phone:      body.phone ?? null,
      CreatedBy:  createdBy,
    });
  }

  // ─── GET: Patient Profile + Allergies + Underlying Diseases ───
  async getPatientProfile(query: IPatientProfileQuery, createdBy: string) {
    const db = this.DATABASE_NAME;

    // 1. Get/create patient profile via SP
    const profileResult = await this.db.executeStoredProcedure<{ patient_id: number; action: string }>(
      db, 'sp_PP_01_GetOrCreatePatientProfile', {
        PatientType:      query.patient_type,
        EmployeeId:       query.employee_id ?? '',
        ExternalPersonId: query.external_person_id ?? 0,
        CreatedBy:        createdBy,
      },
    );

    const patientId = profileResult[0]?.patient_id;
    if (!patientId) {
      throw new InternalServerErrorException('ไม่สามารถดึงข้อมูล patient profile ได้');
    }

    // 2. Parallel queries
    const [profileData, allergies, diseases, visitCount, latestVitals] = await Promise.all([
      this.db.query<any>(db,
        `SELECT patient_id, patient_type, no_known_allergy FROM patient_profiles WHERE patient_id = @patientId`,
        { patientId }),
      this.db.query<any>(db,
        `SELECT allergy_id, drug_name, item_id, reaction, severity, allergy_type, source, noted_at
         FROM patient_allergies WHERE patient_id = @patientId AND is_active = 1 ORDER BY noted_at DESC`,
        { patientId }),
      this.db.query<any>(db,
        `SELECT condition_id, disease_name, sub_group_id, diagnosed_year, control_status
         FROM patient_underlying_diseases WHERE patient_id = @patientId AND is_active = 1 ORDER BY created_at DESC`,
        { patientId }),
      this.db.query<{ count: number }>(db,
        `SELECT COUNT(*) AS count FROM visits WHERE patient_id = @patientId`,
        { patientId }),
      this.db.query<{ weight_kg: number; height_cm: number; measured_at: string }>(db,
        `SELECT TOP 1 weight_kg, height_cm, measured_at FROM view_patient_latest_vitals WHERE patient_id = @patientId`,
        { patientId }),
    ]);

    const lv = latestVitals[0] ?? null;
    const latestPhysical = lv
      ? {
          weight_kg:   lv.weight_kg,
          height_cm:   lv.height_cm,
          bmi:         lv.weight_kg && lv.height_cm
                         ? Math.round((lv.weight_kg / Math.pow(lv.height_cm / 100, 2)) * 10) / 10
                         : null,
          measured_at: lv.measured_at,
        }
      : null;

    return {
      patient_id:          patientId,
      patient_type:        query.patient_type,
      no_known_allergy:    !!(profileData[0]?.no_known_allergy),
      total_visits:        visitCount[0]?.count ?? 0,
      allergies:           allergies ?? [],
      underlying_diseases: diseases ?? [],
      latest_physical:     latestPhysical,
    };
  }

  // ─── POST/PUT: Upsert patient allergy (sp_PP_02_UpsertPatientAllergy) ───
  async upsertAllergy(body: IUpsertAllergyBody, notedBy: string) {
    return this.db.executeStoredProcedure(this.DATABASE_NAME, 'sp_PP_02_UpsertPatientAllergy', {
      AllergyId:   body.allergy_id ?? 0,
      PatientId:   body.patient_id,
      AllergyType: body.allergy_type,
      AllergyName: body.allergy_name,
      ItemId:      body.item_id ?? null,
      Reaction:    body.reaction ?? null,
      Severity:    body.severity,
      Source:      body.source ?? 'SELF_REPORT',
      NotedAt:     body.noted_at ?? null,
      NotedBy:     notedBy,
      IsActive:    1,
    });
  }

  // ─── DELETE: Soft-delete patient allergy ───
  async deleteAllergy(allergyId: number, patientId: number) {
    const db = this.DATABASE_NAME;
    const rows = await this.db.query<{ affected: number }>(db,
      `UPDATE patient_allergies SET is_active = 0 WHERE allergy_id = @allergyId AND patient_id = @patientId;
       SELECT @@ROWCOUNT AS affected`,
      { allergyId, patientId });
    const affected = rows[0]?.affected ?? 0;
    if (!affected) throw new Error('ไม่พบข้อมูล หรือไม่มีสิทธิ์ลบ');
    return { deleted: true };
  }

  // ─── POST/PUT: Upsert underlying disease (sp_PP_03_UpsertUnderlyingDisease) ───
  async upsertDisease(body: IUpsertDiseaseBody, createdBy: string) {
    return this.db.executeStoredProcedure(this.DATABASE_NAME, 'sp_PP_03_UpsertUnderlyingDisease', {
      ConditionId:   body.condition_id ?? 0,
      PatientId:     body.patient_id,
      DiseaseName:   body.disease_name,
      SubGroupId:    body.sub_group_id ?? null,
      DiagnosedYear: body.diagnosed_year ?? null,
      ControlStatus: body.control_status ?? null,
      Note:          body.note ?? null,
      IsActive:      1,
      CreatedBy:     createdBy,
    });
  }

  // ─── DELETE: Soft-delete underlying disease ───
  async deleteDisease(conditionId: number, patientId: number) {
    const db = this.DATABASE_NAME;
    const rows = await this.db.query<{ affected: number }>(db,
      `UPDATE patient_underlying_diseases SET is_active = 0 WHERE condition_id = @conditionId AND patient_id = @patientId;
       SELECT @@ROWCOUNT AS affected`,
      { conditionId, patientId });
    const affected = rows[0]?.affected ?? 0;
    if (!affected) throw new Error('ไม่พบข้อมูล หรือไม่มีสิทธิ์ลบ');
    return { deleted: true };
  }

  // ─── GET: Visit history for a specific patient (filtered by patient_id) ───
  async getPatientVisitHistory(patientId: number) {
    const db = this.DATABASE_NAME;
    return this.db.query<any>(db,
      `SELECT
         v.visit_id, v.visit_datetime, v.shift_code, v.patient_type,
         v.employee_id, v.external_person_id, v.patient_id,
         v.symptoms, v.nursing_advice, v.accident_in_work_flag, v.work_related_flag,
         v.refer_flag, v.created_by, v.created_at,
         dg.group_name_th  AS disease_group_name,
         ds.sub_group_name_th AS disease_sub_group_name,
         tt.treatment_name_th AS treatment_type_name,
         tt.treatment_code,
         rt.refer_name_th  AS refer_type_name,
         (SELECT COUNT(*) FROM visit_usages vu WHERE vu.visit_id = v.visit_id AND vu.is_active = 1) AS usage_count
       FROM visits v
       LEFT JOIN disease_groups      dg ON dg.group_id          = v.group_id
       LEFT JOIN disease_sub_groups  ds ON ds.sub_group_id       = v.disease_id
       LEFT JOIN treatment_types     tt ON tt.treatment_type_id  = v.treatment_type_id
       LEFT JOIN refer_types         rt ON rt.refer_type_id      = v.refer_type_id
       WHERE v.patient_id = @patientId AND v.is_active = 1
       ORDER BY v.visit_datetime DESC`,
      { patientId });
  }

  // ─── GET: Lookup data ทั้งหมด (parallel queries) ───
  async getLookups() {
    const db = this.DATABASE_NAME;
    const [treatment_types, refer_types, severity_types, disease_groups, disease_sub_groups, hospitals] =
      await Promise.all([
        this.db.query<any>(db, `SELECT treatment_type_id AS id, treatment_code AS code, treatment_name_th AS name_th, treatment_name_en AS name_en, sort_order, is_active FROM treatment_types WHERE is_active = 1 ORDER BY sort_order`),
        this.db.query<any>(db, `SELECT refer_type_id AS id, refer_code AS code, refer_name_th AS name_th, refer_name_en AS name_en, sort_order, is_active FROM refer_types WHERE is_active = 1 ORDER BY sort_order`),
        this.db.query<any>(db, `SELECT severity_id AS id, severity_code AS code, severity_name_th AS name_th, severity_name_en AS name_en, sort_order, is_active FROM accident_severity_types WHERE is_active = 1 ORDER BY sort_order`),
        this.db.query<any>(db, `SELECT group_id AS id, group_code AS code, group_name_th AS name_th, group_name_en AS name_en, sort_order, is_active FROM disease_groups WHERE is_active = 1 ORDER BY sort_order`),
        this.db.query<any>(db, `SELECT sub_group_id AS id, group_id, sub_group_code AS code, sub_group_name_th AS name_th, sub_group_name_en AS name_en, sort_order, is_active FROM disease_sub_groups WHERE is_active = 1 ORDER BY group_id, sort_order`),
        this.db.query<any>(db, `SELECT hospital_id, hospital_code, hospital_name_th, hospital_name_en, hospital_type, is_active FROM hospitals WHERE is_active = 1 ORDER BY hospital_code`),
      ]);

    return { treatment_types, refer_types, severity_types, disease_groups, disease_sub_groups, hospitals };
  }

  // ─── GET: วันที่ stock count ที่ approved ล่าสุด (sp_TR_05) ───
  async getLastApprovedStockDate(): Promise<{ last_approved_date: string | null }> {
    const result = await this.db.executeStoredProcedure(this.DATABASE_NAME, 'sp_TR_05_GetLastApprovedStockDate', {});
    return { last_approved_date: (result[0] as any)?.last_approved_date ?? null };
  }

  // ─── PUT: แก้ไข visit header + usages (sp_TR_06_UpdateVisit) ───
  async updateVisit(visitId: number, body: IUpdateVisitBody, editedBy: string) {
    const usagesJson = body.usages?.length ? JSON.stringify(body.usages) : null;
    const result = await this.db.executeStoredProcedure(this.DATABASE_NAME, 'sp_TR_06_UpdateVisit', {
      VisitId:            visitId,
      EditedBy:           editedBy,
      Reason:             body.reason ?? null,
      Symptoms:           body.symptoms ?? null,
      VitalsJson:         body.vitals_json ?? null,
      NursingAdvice:      body.nursing_advice ?? null,
      GroupId:            body.group_id ?? null,
      DiseaseId:          body.disease_id ?? null,
      TreatmentTypeId:    body.treatment_type_id ?? null,
      AccidentInWorkFlag: body.accident_in_work_flag != null ? (body.accident_in_work_flag ? 1 : 0) : null,
      WorkRelatedFlag:    body.work_related_flag != null ? (body.work_related_flag ? 1 : 0) : null,
      ReferFlag:          body.refer_flag != null ? (body.refer_flag ? 1 : 0) : null,
      ReferTypeId:        body.refer_type_id ?? null,
      SeverityId:         body.severity_id ?? null,
      UsagesJson:         usagesJson,
    });
    const row = result[0] as any;
    if (!row?.Status) {
      throw new InternalServerErrorException(row?.Message || 'Update failed');
    }
    return { message: row.Message };
  }

  // ─── DELETE: soft-delete visit (sp_TR_07_DeleteVisit) ───
  async deleteVisit(visitId: number, deletedBy: string) {
    const result = await this.db.executeStoredProcedure(this.DATABASE_NAME, 'sp_TR_07_DeleteVisit', {
      VisitId:   visitId,
      DeletedBy: deletedBy,
    });
    const row = result[0] as any;
    if (!row?.Status) {
      throw new InternalServerErrorException(row?.Message || 'Delete failed');
    }
    return { message: row.Message };
  }
}
