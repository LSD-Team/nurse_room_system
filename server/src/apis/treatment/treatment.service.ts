import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '@/src/database/database.service';
import type {
  ICreateVisitBody,
  ICreateExternalPersonBody,
  IGetVisitListQuery,
  IUpdateVisitUsageBody,
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
}
