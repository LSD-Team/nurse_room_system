import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '@/src/database/database.service';
import { EmailService } from '@/src/email/email.service';
import { EmailLogService } from '@/src/email/services/email-log.service';
import { ENotifyType } from '@/src/email/dto/send-approval-email.dto';
import type {
  IBorrowHeader,
  IBorrowLine,
  ISupplier,
  ISupplierItemPrice,
} from './borrow.interface';

@Injectable()
export class BorrowService {
  private readonly logger = new Logger(BorrowService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly emailService: EmailService,
    private readonly emailLogService: EmailLogService,
  ) {}

  private get DATABASE_NAME(): string {
    return this.databaseService.getDatabaseName();
  }

  // โ”€โ”€โ”€ GET: เธฃเธฒเธขเธเธฒเธฃเนเธเธขเธทเธกเธ—เธฑเนเธเธซเธกเธ” (view_borrowed_items_header) โ”€โ”€โ”€
  async getBorrowHeaders(): Promise<IBorrowHeader[]> {
    const query = `
      SELECT
        borrow_id, borrow_no, borrow_date, borrow_status,
        supplier_id, supplier_code, supplier_name,
        approval_level, approval_role, approval_status,
        actioned_by, actioned_by_eng_name, actioned_at,
        created_by_eng_name, remark
      FROM view_borrowed_items_header
      ORDER BY borrow_id DESC
    `;
    return this.databaseService.query<IBorrowHeader>(
      this.DATABASE_NAME,
      query,
    );
  }

  // โ”€โ”€โ”€ GET: เธฃเธฒเธขเธฅเธฐเน€เธญเธตเธขเธ” lines เธเธญเธเนเธเธขเธทเธก (view_borrowed_items) โ”€โ”€โ”€
  async getBorrowLines(borrowId: number): Promise<IBorrowLine[]> {
    const query = `
      SELECT
        borrow_id, borrow_no, borrow_line_id,
        item_id, item_code, item_name_th, item_name_en,
        usage_unit_code, usage_unit_name_th,
        purchase_unit_code, purchase_unit_name_th,
        qty_borrow, unit_price, total_price,
        po_line_id, note,
        ISNULL(conversion_factor, 1.0) AS conversion_factor,
        created_by, created_at, updated_by, updated_at
      FROM view_borrowed_items
      WHERE borrow_id = @param0
      ORDER BY borrow_line_id
    `;
    return this.databaseService.query<IBorrowLine>(
      this.DATABASE_NAME,
      query,
      [borrowId],
    );
  }

  // โ”€โ”€โ”€ GET: Suppliers (for dropdown) โ”€โ”€โ”€
  async getSuppliers(): Promise<ISupplier[]> {
    const query = `
      SELECT supplier_id, supplier_code, supplier_name
      FROM suppliers
      WHERE is_active = 1
      ORDER BY supplier_code
    `;
    return this.databaseService.query<ISupplier>(this.DATABASE_NAME, query);
  }

  // โ”€โ”€โ”€ GET: เธฃเธฒเธเธฒเธขเธฒเธ•เธฒเธก supplier (view_supplier_item_prices_current) โ”€โ”€โ”€
  async getSupplierPrices(supplierId: number): Promise<ISupplierItemPrice[]> {
    const query = `
      SELECT
        supplier_id, supplier_code, supplier_name,
        item_id, item_code, item_name_th, item_name_en,
        unit_id, unit_code, unit_name_th, unit_name_en,
        unit_price, conversion_factor, effective_date, expire_date
      FROM view_supplier_item_prices_current
      WHERE supplier_id = @param0
      ORDER BY item_code
    `;
    return this.databaseService.query<ISupplierItemPrice>(
      this.DATABASE_NAME,
      query,
      [supplierId],
    );
  }

  // โ”€โ”€โ”€ POST: เธชเธฃเนเธฒเธเนเธเธขเธทเธก (sp_BR_01_Create) โ”€โ”€โ”€
  async createBorrow(
    jsonLines: string,
    supplierId: string,
    note: string | null,
    createdBy: string,
  ) {
    return this.databaseService.executeStoredProcedure(
      this.DATABASE_NAME,
      'sp_BR_01_Create',
      {
        JsonLines: jsonLines,
        SupplierId: supplierId,
        Note: note,
        CreatedBy: createdBy,
      },
    );
  }

  // โ”€โ”€โ”€ PUT: เนเธเนเนเธเนเธเธขเธทเธก (sp_BR_02_Update) โ”€โ”€โ”€
  async updateBorrow(
    borrowId: string,
    jsonLines: string | null,
    note: string | null,
    updatedBy: string,
  ) {
    return this.databaseService.executeStoredProcedure(
      this.DATABASE_NAME,
      'sp_BR_02_Update',
      {
        BorrowId: borrowId,
        JsonLines: jsonLines,
        Note: note,
        UpdatedBy: updatedBy,
      },
    );
  }

  // โ”€โ”€โ”€ POST: เธชเนเธเธญเธเธธเธกเธฑเธ•เธด (sp_BR_03_Submit) โ”€โ”€โ”€
  async submitBorrow(borrowId: string, submitBy: string) {
    // Call stored procedure
    const result = await this.databaseService.executeStoredProcedure(
      this.DATABASE_NAME,
      'sp_BR_03_Submit',
      {
        BorrowId: borrowId,
        SubmitBy: submitBy,
      },
    );

    // Send approval notification email
    try {
      const borrowHeader = await this.getBorrowHeaderById(parseInt(borrowId, 10));

      if (borrowHeader) {
        // Send email to approvers of the first approval level
        await this.emailService.sendApprovalRequestByRoleCode(
          'GROUP_LEAD',
          borrowHeader.borrow_no,
          'BORROW',
          borrowHeader.borrow_id,
          `Borrow Request ${borrowHeader.borrow_no}`,
          borrowHeader.note || '',
        );
        console.log(
          `โœ… [BorrowService] Approval email sent for Borrow: ${borrowHeader.borrow_no}`,
        );
      }
    } catch (error) {
      console.error(
        `โŒ [BorrowService] Failed to send approval email: ${error.message}`,
      );
    }

    return result;
  }

  // โ”€โ”€โ”€ POST: เธญเธเธธเธกเธฑเธ•เธด/เธเธเธดเน€เธชเธ/เธชเนเธเธเธฅเธฑเธ (sp_BR_04_Approve) โ”€โ”€โ”€
  async approveBorrow(
    borrowId: string,
    action: string,
    actionedBy: string,
    remark: string | null,
  ) {
    // Get Borrow info before approval
    const borrowHeader = await this.getBorrowHeaderById(parseInt(borrowId, 10));

    // Call stored procedure
    const result = await this.databaseService.executeStoredProcedure(
      this.DATABASE_NAME,
      'sp_BR_04_Approve',
      {
        BorrowId: borrowId,
        Action: action,
        ActionedBy: actionedBy,
        Remark: remark,
      },
    );

    // Send email based on action
    if (borrowHeader) {
      // Both REJECT and REWORK trigger rework notification
      if (action === 'REJECT' || action === 'REJECTED' || action === 'REWORK') {
        // Send rework notification to Borrow creator
        try {
          await this.emailService.sendApprovalEmail({
            notifyType: ENotifyType.BORROW_REWORK,
            documentId: borrowHeader.borrow_id,
            documentNo: borrowHeader.borrow_no,
            documentType: 'BORROW',
            toEmployeeIds: [parseInt(borrowHeader.created_by, 10)],
            rejectedByName: actionedBy,
            additionalMessage: remark || 'Please revise and resubmit your borrow request',
          });

          // Log email
          try {
            await this.emailLogService.create({
              document_type: 'BORROW',
              document_id: borrowHeader.borrow_id,
              document_no: borrowHeader.borrow_no,
              notify_type: 'BORROW_REWORK',
              recipient_emails: `${borrowHeader.created_by}`,
              subject: `[Nurse Room System] ${borrowHeader.borrow_no} : Rework Required - BORROW`,
              sent_status: 'SUCCESS',
              is_test_override: false,
              sent_by_employee_id: parseInt(actionedBy, 10) || undefined,
            });
          } catch (logError) {
            this.logger.warn(`Failed to log email: ${logError.message}`);
          }

          this.logger.log(
            `โœ… [BorrowService] Rework notification sent for Borrow: ${borrowHeader.borrow_no}`,
          );
        } catch (error: any) {
          this.logger.error(
            `โŒ [BorrowService] Failed to send rework email: ${error.message}`,
            error.stack,
          );
        }
      } else if (action === 'APPROVE' || action === 'APPROVED') {
        // Check if this is final approval
        try {
          const pendingApprovals = await this.getPendingApprovals(
            borrowHeader.borrow_id,
          );

          // If no more pending approvals, this was the final approval
          if (pendingApprovals.length === 0) {
            await this.emailService.sendApprovalEmail({
              notifyType: ENotifyType.BORROW_COMPLETED,
              documentId: borrowHeader.borrow_id,
              documentNo: borrowHeader.borrow_no,
              documentType: 'BORROW',
              toEmployeeIds: [parseInt(borrowHeader.created_by, 10)],
              approvedByName: actionedBy,
              additionalMessage:
                'Your borrow request has been fully approved',
            });

            // Log email
            try {
              await this.emailLogService.create({
                document_type: 'BORROW',
                document_id: borrowHeader.borrow_id,
                document_no: borrowHeader.borrow_no,
                notify_type: 'BORROW_COMPLETED',
                recipient_emails: `${borrowHeader.created_by}`,
                subject: `[Nurse Room System] ${borrowHeader.borrow_no} : Approved - BORROW`,
                sent_status: 'SUCCESS',
                is_test_override: false,
                sent_by_employee_id: parseInt(actionedBy, 10) || undefined,
              });
            } catch (logError) {
              this.logger.warn(`Failed to log email: ${logError.message}`);
            }

            this.logger.log(
              `โœ… [BorrowService] Completion notification sent for Borrow: ${borrowHeader.borrow_no}`,
            );
          }
        } catch (error: any) {
          this.logger.error(
            `โŒ [BorrowService] Failed to send completion email: ${error.message}`,
            error.stack,
          );
        }
      }
    }

    return result;
  }

  // โ”€โ”€โ”€ POST: เธฃเธฑเธเธขเธทเธกเน€เธเนเธฒเธชเธ•เนเธญเธ (sp_BR_05_Receive) โ”€โ”€โ”€
  async receiveBorrow(borrowId: string, receivedBy: string) {
    return this.databaseService.executeStoredProcedure(
      this.DATABASE_NAME,
      'sp_BR_05_Receive',
      {
        BorrowId: borrowId,
        ReceivedBy: receivedBy,
      },
    );
  }

  // โ”€โ”€โ”€ GET: เนเธเธขเธทเธกเธ—เธตเนเธฃเธญ settle (sp_BR_06_GetPending) โ”€โ”€โ”€
  async getPendingBorrows(supplierId: string | null) {
    return this.databaseService.executeStoredProcedure(
      this.DATABASE_NAME,
      'sp_BR_06_GetPending',
      {
        SupplierId: supplierId,
      },
    );
  }

  // โ”€โ”€โ”€ POST: เธขเธเน€เธฅเธดเธเนเธเธขเธทเธก (sp_BR_07_Cancel) โ”€โ”€โ”€
  async cancelBorrow(
    borrowId: string,
    cancelledBy: string,
    reason: string | null,
  ) {
    return this.databaseService.executeStoredProcedure(
      this.DATABASE_NAME,
      'sp_BR_07_Cancel',
      {
        BorrowId: borrowId,
        CancelledBy: cancelledBy,
        Reason: reason,
      },
    );
  }

  // GET: Count borrows with DRAFT or APPROVED status
  async getBorrowPendingCount(): Promise<number> {
    try {
      const DATABASE_NAME = this.databaseService.getDatabaseName();
      const query = `
        SELECT COUNT(*) as count
        FROM [${DATABASE_NAME}].dbo.borrow_headers
        WHERE borrow_status IN ('DRAFT', 'APPROVED')
      `;
      const result = await this.databaseService.query<{ count: number }>(
        DATABASE_NAME,
        query,
      );
      return result?.[0]?.count || 0;
    } catch (error) {
      console.error('[BorrowService] Error getting borrow pending count:', error);
      return 0;
    }
  }

  // โ"€โ"€โ"€ HELPER: Get Borrow header by ID (for email service) โ"€โ"€โ"€
  private async getBorrowHeaderById(borrowId: number): Promise<any> {
    const query = `
      SELECT TOP 1
        b.borrow_id,
        b.borrow_no,
        b.borrow_status,
        b.note,
        b.created_by,
        b.created_at
      FROM borrow_headers b
      WHERE b.borrow_id = @param0
    `;
    const result = await this.databaseService.query(this.DATABASE_NAME, query, [
      borrowId,
    ]);
    return result?.[0] || null;
  }

  // โ"€โ"€โ"€ HELPER: Get pending approvals for a Borrow โ"€โ"€โ"€
  private async getPendingApprovals(borrowId: number): Promise<any[]> {
    const query = `
      SELECT
        a.approval_id,
        a.borrow_id,
        a.approval_level,
        a.approval_role,
        a.status
      FROM borrow_approvals a
      WHERE a.borrow_id = @param0 AND a.status = 'PENDING'
      ORDER BY a.approval_level
    `;
    return this.databaseService.query(this.DATABASE_NAME, query, [borrowId]);
  }
}
