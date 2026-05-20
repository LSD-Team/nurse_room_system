import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '@/src/database/database.service';
import { EmailService } from '@/src/email/email.service';
import { EmailLogService } from '@/src/email/services/email-log.service';
import { ENotifyType } from '@/src/email/dto/send-approval-email.dto';
import type {
  IPhysicalCountCreateResponse,
  IPhysicalCountSaveLinesResponse,
  IPhysicalCountComparison,
  IPhysicalCountHeader,
  IPhysicalCountLine,
  IPhysicalCountSubmitResponse,
  IPhysicalCountApproveResponse,
  IPhysicalCountRejectResponse,
  IEditPeriodEndResult,
  IEditPeriodEndResponse,
  IStockPeriod,
  IDeletePeriodResponse,
} from './physical-count.interface';

@Injectable()
export class PhysicalCountService {
  private readonly logger = new Logger(PhysicalCountService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly emailService: EmailService,
    private readonly emailLogService: EmailLogService,
  ) {}

  private get DATABASE_NAME(): string {
    return this.databaseService.getDatabaseName();
  }

  // ────────────────────────────────────────────────────────────────
  // Get all available stock periods (with active count info)
  // ────────────────────────────────────────────────────────────────
  async getAvailablePeriods(): Promise<any[]> {
    const query = `
      SELECT 
        sp.period_code,
        sp.period_start,
        sp.period_end,
        sp.period_status,
        sp.created_by,
        sp.created_at,
        pch.count_id   AS active_count_id,
        pch.count_status AS active_count_status
      FROM stock_periods sp
      OUTER APPLY (
        SELECT TOP 1 count_id, count_status
        FROM physical_count_headers
        WHERE period_code = sp.period_code
          AND count_status IN ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED')
        ORDER BY count_id DESC
      ) pch
      ORDER BY sp.period_code DESC
    `;
    return this.databaseService.query<any>(this.DATABASE_NAME, query);
  }

  // ────────────────────────────────────────────────────────────────
  // Get active count (DRAFT/SUBMITTED) for a given period
  // ────────────────────────────────────────────────────────────────
  async getCountByPeriod(periodCode: string): Promise<any> {
    const query = `
      SELECT TOP 1
        count_id, period_code, count_status,
        note, created_by, created_at, submitted_by, submitted_at
      FROM physical_count_headers
      WHERE period_code = @param0
        AND count_status IN ('DRAFT', 'SUBMITTED')
      ORDER BY count_id DESC
    `;
    const results = await this.databaseService.query<any>(
      this.DATABASE_NAME,
      query,
      [periodCode],
    );
    return results && results.length > 0 ? results[0] : null;
  }

  // ────────────────────────────────────────────────────────────────
  // 0. sp_Snapshot_01_CreateStockPeriod — สร้าง period
  // ────────────────────────────────────────────────────────────────
  async createPeriod(
    periodEnd: Date,
    createdBy: string,
  ): Promise<any> {
    this.logger.debug(
      `createPeriod: periodEnd=${periodEnd.toISOString()}, createdBy=${createdBy}`,
    );

    const results = await this.databaseService.executeStoredProcedure<any>(
      this.DATABASE_NAME,
      'sp_Snapshot_01_CreateStockPeriod',
      {
        PeriodEnd: periodEnd,
        CreatedBy: createdBy,
      },
    );

    return results && results[0] ? results[0] : { Status: 0, Message: 'No response from SP' };
  }

  // ────────────────────────────────────────────────────────────────
  // 1. sp_PhysCount_01_Create — เริ่มนับ stock
  // ────────────────────────────────────────────────────────────────
  async createPhysicalCount(
    periodCode: string,
    createdBy: string,
    note?: string,
  ): Promise<IPhysicalCountCreateResponse> {
    this.logger.debug(
      `createPhysicalCount: periodCode=${periodCode}, createdBy=${createdBy}`,
    );

    const results = await this.databaseService.executeStoredProcedure<IPhysicalCountCreateResponse>(
      this.DATABASE_NAME,
      'sp_PhysCount_01_Create',
      {
        PeriodCode: periodCode,
        CreatedBy: createdBy,
        Note: note || null,
      },
    );

    return results && results[0] ? results[0] : { Status: 0, Message: 'No response from SP' };
  }

  // ────────────────────────────────────────────────────────────────
  // 2. sp_PhysCount_02_SaveLines — บันทึกยอดนับ
  // ────────────────────────────────────────────────────────────────
  async saveCountLines(
    countId: number,
    jsonData: string,
  ): Promise<IPhysicalCountSaveLinesResponse> {
    this.logger.debug(`saveCountLines: countId=${countId}`);

    const results = await this.databaseService.executeStoredProcedure<IPhysicalCountSaveLinesResponse>(
      this.DATABASE_NAME,
      'sp_PhysCount_02_SaveLines',
      {
        CountId: countId,
        JsonData: jsonData,
      },
    );

    return results && results[0] ? results[0] : { Status: 0, Message: 'No response from SP' };
  }

  // ────────────────────────────────────────────────────────────────
  // 3. sp_PhysCount_03_GetComparison — ดูรายงานเปรียบเทียบ
  // ────────────────────────────────────────────────────────────────
  async getComparison(countId: number): Promise<IPhysicalCountComparison> {
    this.logger.debug(`getComparison: countId=${countId}`);

    // SP03 returns 2 result sets: [0]=header row, [1]=lines[]
    const recordsets = await this.databaseService.executeStoredProcedureMultiple<any>(
      this.DATABASE_NAME,
      'sp_PhysCount_03_GetComparison',
      { CountId: countId },
    );

    this.logger.debug(`getComparison recordsets.length=${recordsets?.length}, set0.length=${recordsets?.[0]?.length}, set1.length=${recordsets?.[1]?.length}`);

    const header: IPhysicalCountHeader = recordsets?.[0]?.[0] ?? null;
    const lines: IPhysicalCountLine[] = recordsets?.[1] ?? [];

    // Enrich header with employee names from view_employee_all
    if (header) {
      const ids = [header.created_by, header.submitted_by, header.approved_by]
        .filter((id): id is string => !!id);

      if (ids.length > 0) {
        const placeholders = ids.map((_, i) => `@p${i}`).join(', ');
        const nameQuery = `SELECT ID, eng_name FROM view_employee_all WHERE ID IN (${placeholders})`;
        const nameParams: Record<string, string> = {};
        ids.forEach((id, i) => { nameParams[`p${i}`] = id; });

        const nameRows = await this.databaseService.query<{ ID: string; eng_name: string }>(
          this.DATABASE_NAME,
          nameQuery,
          nameParams,
        );

        const nameMap = new Map(nameRows.map((r) => [String(r.ID), r.eng_name]));
        header.created_by_name  = nameMap.get(String(header.created_by))  ?? null;
        header.submitted_by_name = header.submitted_by ? (nameMap.get(String(header.submitted_by)) ?? null) : null;
        header.approved_by_name  = header.approved_by  ? (nameMap.get(String(header.approved_by))  ?? null) : null;
      } else {
        header.created_by_name   = null;
        header.submitted_by_name = null;
        header.approved_by_name  = null;
      }
    }

    return { header, lines };
  }

  // ────────────────────────────────────────────────────────────────
  // 4. sp_PhysCount_04_Submit — ส่งขออนุมัติ
  // ────────────────────────────────────────────────────────────────
  async submitCount(
    countId: number,
    submittedBy: string,
  ): Promise<IPhysicalCountSubmitResponse> {
    this.logger.debug(`submitCount: countId=${countId}, submittedBy=${submittedBy}`);

    const results = await this.databaseService.executeStoredProcedure<IPhysicalCountSubmitResponse>(
      this.DATABASE_NAME,
      'sp_PhysCount_04_Submit',
      {
        CountId: countId,
        SubmittedBy: submittedBy,
      },
    );

    const response = results && results[0] ? results[0] : { Status: 0, Message: 'No response from SP' };

    // ✅ ส่งอนุมัติสำเร็จ ให้ส่ง email ให้ GROUP_LEAD
    if (response.Status === 1 && response.PeriodCode) {
      try {
        await this.sendApprovalEmailToGroupLead(
          response.CountId || countId,
          response.PeriodCode,
          submittedBy,
        );
      } catch (error) {
        this.logger.error(
          `Failed to send approval email for countId=${countId}:`,
          error,
        );
      }
    }

    return response;
  }

  // ────────────────────────────────────────────────────────────────
  // 5. sp_PhysCount_05_Approve — GROUP_LEAD อนุมัติ
  // ────────────────────────────────────────────────────────────────
  async approveCount(
    countId: number,
    approvedBy: string,
  ): Promise<IPhysicalCountApproveResponse> {
    this.logger.debug(`approveCount: countId=${countId}, approvedBy=${approvedBy}`);

    const results = await this.databaseService.executeStoredProcedure<IPhysicalCountApproveResponse>(
      this.DATABASE_NAME,
      'sp_PhysCount_05_Approve',
      {
        CountId: countId,
        ApprovedBy: approvedBy,
      },
    );

    const response = results && results[0] ? results[0] : { Status: 0, Message: 'No response from SP' };

    // ✅ อนุมัติสำเร็จ ให้ส่ง email ให้ผู้ที่ส่ง
    if (response.Status === 1 && response.CountId) {
      try {
        await this.sendApprovedEmailToSubmitter(response.CountId, response.PeriodCode || '');
      } catch (error) {
        this.logger.error(`Failed to send approved email for countId=${countId}:`, error);
      }
    }

    return response;
  }

  // ────────────────────────────────────────────────────────────────
  // 6. sp_PhysCount_06_Reject — GROUP_LEAD ปฏิเสธ
  // ────────────────────────────────────────────────────────────────
  async rejectCount(
    countId: number,
    rejectedBy: string,
    rejectedReason: string,
  ): Promise<IPhysicalCountRejectResponse> {
    this.logger.debug(
      `rejectCount: countId=${countId}, rejectedBy=${rejectedBy}, reason=${rejectedReason}`,
    );

    const results = await this.databaseService.executeStoredProcedure<IPhysicalCountRejectResponse>(
      this.DATABASE_NAME,
      'sp_PhysCount_06_Reject',
      {
        CountId: countId,
        RejectedBy: rejectedBy,
        RejectedReason: rejectedReason,
      },
    );

    const response = results && results[0] ? results[0] : { Status: 0, Message: 'No response from SP' };

    // ✅ ปฏิเสธสำเร็จ ให้ส่ง email ให้ผู้ที่ส่ง พร้อมเหตุผล
    if (response.Status === 1 && response.CountId) {
      try {
        await this.sendRejectedEmailToSubmitter(
          response.CountId,
          response.PeriodCode || '',
          rejectedReason,
        );
      } catch (error) {
        this.logger.error(`Failed to send rejection email for countId=${countId}:`, error);
      }
    }

    return response;
  }

  // ────────────────────────────────────────────────────────────────
  // 7. sp_Snapshot_04_editPeriodEnd — แก้ไขวันสิ้นสุด period (OPEN เท่านั้น)
  // ────────────────────────────────────────────────────────────────
  async editPeriodEnd(
    periodCode: string,
    newPeriodEnd: Date,
  ): Promise<IEditPeriodEndResult> {
    this.logger.debug(
      `editPeriodEnd: periodCode=${periodCode}, newPeriodEnd=${newPeriodEnd.toISOString()}`,
    );

    const results = await this.databaseService.executeStoredProcedure<any>(
      this.DATABASE_NAME,
      'sp_Snapshot_04_editPeriodEnd',
      {
        PeriodCode: periodCode,
        NewPeriodEnd: newPeriodEnd,
      },
    );

    // SP returns 2 result sets: [0] status/message, [1] updated period record
    const result: IEditPeriodEndResponse =
      results && results.length > 0 ? results[0] : { Status: 'Error', Message: 'No response from SP' };
    const period: IStockPeriod | undefined =
      results && results.length > 1 ? results[1] : undefined;

    return { result, period };
  }

  // ────────────────────────────────────────────────────────────────
  // 8. sp_Snapshot_05_deletePeriod — ลบ period (OPEN เท่านั้น)
  // ────────────────────────────────────────────────────────────────
  async deletePeriod(periodCode: string): Promise<IDeletePeriodResponse> {
    this.logger.debug(`deletePeriod: periodCode=${periodCode}`);

    const results = await this.databaseService.executeStoredProcedure<IDeletePeriodResponse>(
      this.DATABASE_NAME,
      'sp_Snapshot_05_deletePeriod',
      {
        PeriodCode: periodCode,
      },
    );

    return results && results[0]
      ? results[0]
      : { Status: 'Error', Message: 'No response from SP' };
  }

  // ────────────────────────────────────────────────────────────────
  // Email Helper Methods
  // ────────────────────────────────────────────────────────────────

  private async sendApprovalEmailToGroupLead(
    countId: number,
    periodCode: string,
    submittedBy: string,
  ): Promise<void> {
    this.logger.debug(
      `sendApprovalEmailToGroupLead: countId=${countId}, periodCode=${periodCode}`,
    );

    try {
      // Get GROUP_LEAD emails
      const groupLeadQuery = `
        SELECT approver_id FROM approval_roles
        WHERE role_code = 'GROUP_LEAD' AND is_active = 1
      `;

      const groupLeads = await this.databaseService.query<{ approver_id: string }>(
        this.DATABASE_NAME,
        groupLeadQuery,
      );

      if (!groupLeads || groupLeads.length === 0) {
        this.logger.warn('No active GROUP_LEAD found');
        return;
      }

      const toEmployeeIds = groupLeads.map((g) => g.approver_id);

      const payload = {
        notifyType: ENotifyType.APPROVAL_PHYSICAL_COUNT,
        documentId: countId,
        documentNo: periodCode,
        documentType: 'PO' as const,
        toEmployeeIds,
        sentByEmployeeId: submittedBy,
        documentTitle: `Physical Count Session - ${periodCode}`,
        additionalMessage: `Physical count for period ${periodCode} requires your approval.`,
      };

      await this.emailService.sendApprovalEmail(payload);

      this.logger.log(`✅ Approval email sent to GROUP_LEAD for countId=${countId}`);
    } catch (error) {
      this.logger.error(`❌ Failed to send approval email:`, error);
      throw error;
    }
  }

  private async sendApprovedEmailToSubmitter(
    countId: number,
    periodCode: string,
  ): Promise<void> {
    this.logger.debug(
      `sendApprovedEmailToSubmitter: countId=${countId}, periodCode=${periodCode}`,
    );

    try {
      // Get submitter info from physical_count_headers
      const query = `
        SELECT submitted_by, created_by FROM physical_count_headers
        WHERE count_id = @param0
      `;

      const results = await this.databaseService.query<{
        submitted_by: string;
        created_by: string;
      }>(this.DATABASE_NAME, query, [countId]);

      const submittedBy = results && results[0] ? results[0].submitted_by || results[0].created_by : null;

      if (!submittedBy) {
        this.logger.warn(`No submitter found for countId=${countId}`);
        return;
      }

      const payload = {
        notifyType: ENotifyType.PHYSICAL_COUNT_APPROVED,
        documentId: countId,
        documentNo: periodCode,
        documentType: 'PO' as const,
        toEmployeeIds: [submittedBy],
        sentByEmployeeId: submittedBy,
        documentTitle: `Physical Count Approved - ${periodCode}`,
        additionalMessage: `Your physical count submission for period ${periodCode} has been approved and snapshot created.`,
      };

      await this.emailService.sendApprovalEmail(payload);

      this.logger.log(
        `✅ Approved email sent to ${submittedBy} for countId=${countId}`,
      );
    } catch (error) {
      this.logger.error(`❌ Failed to send approved email:`, error);
      throw error;
    }
  }

  private async sendRejectedEmailToSubmitter(
    countId: number,
    periodCode: string,
    rejectedReason: string,
  ): Promise<void> {
    this.logger.debug(
      `sendRejectedEmailToSubmitter: countId=${countId}, periodCode=${periodCode}`,
    );

    try {
      // Get submitter info from physical_count_headers
      const query = `
        SELECT submitted_by, created_by FROM physical_count_headers
        WHERE count_id = @param0
      `;

      const results = await this.databaseService.query<{
        submitted_by: string;
        created_by: string;
      }>(this.DATABASE_NAME, query, [countId]);

      const submittedBy = results && results[0] ? results[0].submitted_by || results[0].created_by : null;

      if (!submittedBy) {
        this.logger.warn(`No submitter found for countId=${countId}`);
        return;
      }

      const payload = {
        notifyType: ENotifyType.PHYSICAL_COUNT_REJECTED,
        documentId: countId,
        documentNo: periodCode,
        documentType: 'PO' as const,
        toEmployeeIds: [submittedBy],
        sentByEmployeeId: submittedBy,
        documentTitle: `Physical Count Rejected - ${periodCode}`,
        additionalMessage: `Your physical count submission for period ${periodCode} has been rejected.\nReason: ${rejectedReason}\n\nPlease recount and resubmit.`,
      };

      await this.emailService.sendApprovalEmail(payload);

      this.logger.log(
        `✅ Rejection email sent to ${submittedBy} for countId=${countId}`,
      );
    } catch (error) {
      this.logger.error(`❌ Failed to send rejection email:`, error);
      throw error;
    }
  }
}
