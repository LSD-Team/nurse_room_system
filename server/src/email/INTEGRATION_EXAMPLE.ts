/**
 * INTEGRATION EXAMPLE: How to use EmailService in Approval Workflows
 *
 * This file demonstrates how to integrate the EmailService with
 * PO and Borrow approval workflows in the nurse_room_system.
 *
 * Copy the relevant code snippets into your service files.
 * NOTE: This file is for documentation purposes. Import statements
 * and type references may need adjustment based on your actual implementation.
 */

// ============================================================================
// EXAMPLE 1: Integrate into PO Module (in po.service.ts)
// ============================================================================

// import { Injectable } from '@nestjs/common';
// import { EmailService } from '@/src/email/email.service';
// import { ENotifyType } from '@/src/email/dto/send-approval-email.dto';

/*
@Injectable()
export class PoServiceWithEmailIntegration {
  constructor(
    // ... other dependencies
    private readonly emailService: EmailService,
  ) {}

  /**
   * When a new PO is created and needs approval
   * Call this after inserting PO into database
   */
  /*
  async createPoAndNotifyApprovers(
    poNo: string,
    poTitle: string,
    firstApprovalRoleCode: string,
  ): Promise<void> {
    // 1. Your PO creation logic here
    // await this.database.executeProcedure('sp_PO_01_Create', ...);

    // 2. Send approval notification to first approver
    try {
      await this.emailService.sendApprovalRequestByRoleCode(
        firstApprovalRoleCode,  // e.g., 'PO_APPROVER_L1'
        poNo,
        'PO',
        poTitle,
        'Please review and approve this purchase order',
      );
    } catch (error) {
      console.error(`Failed to send PO approval email for ${poNo}:`, error);
      // Don't throw - email failure shouldn't block PO creation
    }
  }

  /**
   * When PO approval is rejected and needs rework
   * Call this when approver rejects at any level
   */
  /*
  async rejectPoAndNotifyCreator(
    poId: number,
    poNo: string,
    createdByEmployeeId: number,
    rejectorName: string,
    rejectionReason: string,
  ): Promise<void> {
    // 1. Update PO status to REWORK
    // await this.database.query(`UPDATE po_headers SET status = 'REWORK' WHERE po_id = ${poId}`);

    // 2. Notify document creator about rework needed
    try {
      await this.emailService.sendApprovalEmail({
        notifyType: ENotifyType.PO_REWORK,
        documentId: poId,
        documentNo: poNo,
        documentType: 'PO',
        toEmployeeIds: [createdByEmployeeId],
        rejectedByName: rejectorName,
        additionalMessage: rejectionReason,
      });
    } catch (error) {
      console.error(`Failed to send PO rework notification for ${poNo}:`, error);
    }
  }

  /**
   * When PO final approval is completed (all levels approved)
   * Call this after last level approver approves
   */
  /*
  async completePOApprovalAndNotifyCreator(
    poId: number,
    poNo: string,
    createdByEmployeeId: number,
    finalApproverName: string,
  ): Promise<void> {
    // 1. Update PO status to APPROVED
    // await this.database.query(`UPDATE po_headers SET status = 'APPROVED' WHERE po_id = ${poId}`);

    // 2. Notify document creator about completion
    try {
      await this.emailService.sendApprovalEmail({
        notifyType: ENotifyType.PO_COMPLETED,
        documentId: poId,
        documentNo: poNo,
        documentType: 'PO',
        toEmployeeIds: [createdByEmployeeId],
        approvedByName: finalApproverName,
        additionalMessage: 'Your PO has been approved and is ready for processing',
      });
    } catch (error) {
      console.error(`Failed to send PO completion notification for ${poNo}:`, error);
    }
  }
}
*/

// ============================================================================
// EXAMPLE 2: Integrate into Borrow Module (in borrow.service.ts)
// ============================================================================

/*
@Injectable()
export class BorrowServiceWithEmailIntegration {
  constructor(
    // ... other dependencies
    private readonly emailService: EmailService,
  ) {}

  /**
   * When a new Borrow document is created
   */
  /*
  async createBorrowAndNotifyApprovers(
    borrowNo: string,
    borrowTitle: string,
    firstApprovalRoleCode: string,
  ): Promise<void> {
    // 1. Your Borrow creation logic
    // await this.database.executeProcedure('sp_BR_01_Create', ...);

    // 2. Send approval notification
    try {
      await this.emailService.sendApprovalRequestByRoleCode(
        firstApprovalRoleCode,
        borrowNo,
        'BORROW',
        borrowTitle,
        'Please review and approve this borrow request',
      );
    } catch (error) {
      console.error(`Failed to send Borrow approval email for ${borrowNo}:`, error);
    }
  }

  /**
   * When Borrow is rejected and needs rework
   */
  /*
  async rejectBorrowAndNotifyCreator(
    borrowId: number,
    borrowNo: string,
    createdByEmployeeId: number,
    rejectorName: string,
    rejectionReason: string,
  ): Promise<void> {
    // 1. Update Borrow status
    // await this.database.query(`UPDATE borrow_headers SET status = 'REWORK' WHERE borrow_id = ${borrowId}`);

    // 2. Notify creator
    try {
      await this.emailService.sendApprovalEmail({
        notifyType: ENotifyType.BORROW_REWORK,
        documentId: borrowId,
        documentNo: borrowNo,
        documentType: 'BORROW',
        toEmployeeIds: [createdByEmployeeId],
        rejectedByName: rejectorName,
        additionalMessage: rejectionReason,
      });
    } catch (error) {
      console.error(`Failed to send Borrow rework notification for ${borrowNo}:`, error);
    }
  }

  /**
   * When Borrow final approval is completed
   */
  /*
  async completeBorrowApprovalAndNotifyCreator(
    borrowId: number,
    borrowNo: string,
    createdByEmployeeId: number,
    finalApproverName: string,
  ): Promise<void> {
    // 1. Update status
    // await this.database.query(`UPDATE borrow_headers SET status = 'APPROVED' WHERE borrow_id = ${borrowId}`);

    // 2. Notify creator
    try {
      await this.emailService.sendApprovalEmail({
        notifyType: ENotifyType.BORROW_COMPLETED,
        documentId: borrowId,
        documentNo: borrowNo,
        documentType: 'BORROW',
        toEmployeeIds: [createdByEmployeeId],
        approvedByName: finalApproverName,
        additionalMessage: 'Your borrow request has been approved',
      });
    } catch (error) {
      console.error(`Failed to send Borrow completion notification for ${borrowNo}:`, error);
    }
  }
}
*/

// ============================================================================
// EXAMPLE 3: Integrate into Approval Module (in approval.controller.ts)
// ============================================================================

/*
import { Controller, Post, Body } from '@nestjs/common';

@Controller('api/approvals')
export class ApprovalControllerWithEmail {
  constructor(
    // ... other dependencies
    private readonly emailService: EmailService,
  ) {}

  /**
   * Endpoint: POST /api/approvals/approve-po/:id
   */
  /*
  @Post('approve-po/:id')
  async approvePo(@Body() payload: any): Promise<void> {
    const { poId, approverName, approverEmployeeId } = payload;

    // 1. Your approval logic
    // await this.approvalService.approvePo(poId, ...);

    // 2. Check if this is final approval
    // const pendingApprovals = await this.database.query(
    //   `SELECT COUNT(*) as count FROM po_approvals WHERE po_id = ${poId} AND status = 'PENDING'`
    // );

    // 3. If final approval, notify creator
    // if (pendingApprovals[0].count === 0) {
    //   const poHeader = await this.database.query(
    //     `SELECT po_no, created_by FROM po_headers WHERE po_id = ${poId}`
    //   );
    //   await this.emailService.sendApprovalEmail({
    //     notifyType: ENotifyType.PO_COMPLETED,
    //     documentId: poId,
    //     documentNo: poHeader[0].po_no,
    //     documentType: 'PO',
    //     toEmployeeIds: [poHeader[0].created_by],
    //     approvedByName: approverName,
    //   });
    // }
  }

  /**
   * Endpoint: POST /api/approvals/reject-po/:id
   */
  /*
  @Post('reject-po/:id')
  async rejectPo(@Body() payload: any): Promise<void> {
    const { poId, rejectorName, rejectorEmployeeId, reason } = payload;

    // 1. Your rejection logic
    // await this.approvalService.rejectPo(poId, ...);

    // 2. Get PO details
    // const poHeader = await this.database.query(
    //   `SELECT po_no, created_by FROM po_headers WHERE po_id = ${poId}`
    // );

    // 3. Notify creator
    // await this.emailService.sendApprovalEmail({
    //   notifyType: ENotifyType.PO_REWORK,
    //   documentId: poId,
    //   documentNo: poHeader[0].po_no,
    //   documentType: 'PO',
    //   toEmployeeIds: [poHeader[0].created_by],
    //   rejectedByName: rejectorName,
    //   additionalMessage: reason,
    // });
  }
}
*/

// ============================================================================
// EXAMPLE 4: Query Database to Get Required Data
// ============================================================================

/**
 * Helper queries to fetch data needed for email notifications
 */

export const EmailIntegrationQueries = {
  /**
   * Get first level approver for a role
   */
  getFirstApproverByRoleCode: (roleCode: string) => `
    SELECT TOP 1 ar.approver_id, ve.email, ve.eng_name
    FROM approval_roles ar
    JOIN view_email ve ON ar.approver_id = ve.employee_id
    WHERE ar.role_code = '${roleCode}'
    AND ar.is_active = 1
  `,

  /**
   * Get PO creator info
   */
  getPoCreatorInfo: (poId: number) => `
    SELECT ph.po_no, ph.created_by, ve.email, ve.eng_name
    FROM po_headers ph
    LEFT JOIN view_email ve ON ph.created_by = ve.employee_id
    WHERE ph.po_id = ${poId}
  `,

  /**
   * Get Borrow creator info
   */
  getBorrowCreatorInfo: (borrowId: number) => `
    SELECT bh.borrow_no, bh.created_by, ve.email, ve.eng_name
    FROM borrow_headers bh
    LEFT JOIN view_email ve ON bh.created_by = ve.employee_id
    WHERE bh.borrow_id = ${borrowId}
  `,

  /**
   * Get all pending approvals for a PO
   */
  getPendingApprovals: (poId: number) => `
    SELECT COUNT(*) as count
    FROM po_approvals
    WHERE po_id = ${poId}
    AND status = 'PENDING'
  `,

  /**
   * Get approver info by employee ID
   */
  getEmployeeInfo: (employeeId: number) => `
    SELECT ve.employee_id, ve.email, ve.eng_name
    FROM view_email ve
    WHERE ve.employee_id = ${employeeId}
  `,
};

// ============================================================================
// EXAMPLE 5: Complete Workflow in Approval Service
// ============================================================================

/*
@Injectable()
export class CompleteApprovalWorkflow {
  constructor(
    private readonly emailService: EmailService,
    private readonly database: DatabaseService,
  ) {}

  /**
   * Complete workflow: Create PO -> Send approval request -> Handle approval/rejection
   */
  /*
  async handlePOApprovalWorkflow(action: 'APPROVE' | 'REJECT', poId: number) {
    // Get PO details
    const poHeader = await this.database.query(
      `SELECT po_id, po_no, created_by FROM po_headers WHERE po_id = ${poId}`,
    );

    if (!poHeader || poHeader.length === 0) {
      throw new Error(`PO not found: ${poId}`);
    }

    const { po_no, created_by } = poHeader[0];

    if (action === 'APPROVE') {
      // Check if final approval
      const pending = await this.database.query(
        `SELECT COUNT(*) as count FROM po_approvals WHERE po_id = ${poId} AND status = 'PENDING'`,
      );

      if (pending[0].count === 0) {
        // Final approval - notify creator
        await this.emailService.sendApprovalEmail({
          notifyType: ENotifyType.PO_COMPLETED,
          documentId: poId,
          documentNo: po_no,
          documentType: 'PO',
          toEmployeeIds: [created_by],
          approvedByName: 'Approver Name', // Get from token
        });
      } else {
        // More approvals needed - send to next approver
        const nextRole = await this.getNextApprovalRole(poId);
        if (nextRole) {
          await this.emailService.sendApprovalRequestByRoleCode(
            nextRole,
            po_no,
            'PO',
          );
        }
      }
    } else if (action === 'REJECT') {
      // Notify creator about rework
      await this.emailService.sendApprovalEmail({
        notifyType: ENotifyType.PO_REWORK,
        documentId: poId,
        documentNo: po_no,
        documentType: 'PO',
        toEmployeeIds: [created_by],
        rejectedByName: 'Approver Name', // Get from token
        additionalMessage: 'Please review and resubmit',
      });
    }
  }

  private async getNextApprovalRole(poId: number): Promise<string | null> {
    // Your logic to get next approval role
    return null;
  }
}
*/
