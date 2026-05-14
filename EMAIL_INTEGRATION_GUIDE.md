// =====================================================
// Integration Guide - Adding Email Service to PO Workflow
// =====================================================

/**
 * ระบบส่ง mail จะทำงาน ณ 3 จุด:
 * 
 * 1. ✉️ เมื่อ User กดปุ่ม "ส่งอนุมัติ" (Submit for Approval)
 *    - ส่ง email ให้ approvers ของชั้นอนุมัติแรก
 *    - ใช้ role_code เพื่อหา approver_id จากตาราง approval_roles
 *    - ทำงานที่ endpoint: POST /po/:id/submit
 * 
 * 2. ✉️ เมื่อ Approver ปฏิเสธ (Rework Required)
 *    - ส่ง email ให้คนที่สร้าง PO (created_by)
 *    - บอกให้แก้ไขและส่งใหม่
 *    - ทำงานที่ endpoint: POST /po/:id/approve (with action='REJECTED')
 * 
 * 3. ✉️ เมื่อ Approver สุดท้ายอนุมัติ (Final Approval)
 *    - ส่ง email ให้คนที่สร้าง PO (created_by)
 *    - แจ้งว่า PO ได้รับการอนุมัติแล้ว
 *    - ทำงานที่ endpoint: POST /po/:id/approve (with action='APPROVED')
 */

// =====================================================
// Solution 1: Add Email Service to PoService
// =====================================================

// 📝 In: server/src/apis/po/po.service.ts

// Step 1: Import EmailService
import { EmailService } from '@/src/email/email.service';

// Step 2: Inject in constructor
@Injectable()
export class PoService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly emailService: EmailService,  // ← ADD THIS
  ) {}

  // Step 3: Add email trigger in submitPo()
  async submitPo(poId: string, submitBy: string) {
    // Call stored procedure
    const result = await this.databaseService.executeStoredProcedure(
      this.DATABASE_NAME,
      'sp_PO_03_SubmitPO',
      {
        PoId: poId,
        SubmitBy: submitBy,
      },
    );

    // Send approval notification email
    // ต้องหา PO ข้อมูล (po_no, po_id) ก่อน
    const poHeader = await this.getPoHeaderById(parseInt(poId, 10));
    
    if (poHeader) {
      try {
        // ส่ง email ไปให้ approvers ของชั้นแรก (role_code จะต้องระบุ)
        await this.emailService.sendApprovalRequestByRoleCode(
          'GROUP_LEAD',  // ← ที่ role_code ของชั้นอนุมัติแรก
          poHeader.po_no,
          'PO',
          poHeader.po_id,
          'PO Number ' + poHeader.po_no,
          poHeader.note || '',
        );
        console.log(`✅ Approval email sent for PO: ${poHeader.po_no}`);
      } catch (error) {
        console.error(`❌ Failed to send approval email: ${error.message}`);
        // อย่าให้ error ใน email ไปหยุด flow หลัก
      }
    }

    return result;
  }

  // Step 4: Add email trigger in approvePo()
  async approvePo(
    poId: string,
    action: string,
    actionedBy: string,
    remark: string | null,
  ) {
    // Get PO info
    const poHeader = await this.getPoHeaderById(parseInt(poId, 10));

    // Call stored procedure
    const result = await this.databaseService.executeStoredProcedure(
      this.DATABASE_NAME,
      'sp_PO_04_ApprovePO',
      {
        PoId: poId,
        Action: action,
        ActionedBy: actionedBy,
        Remark: remark,
      },
    );

    // Send email based on action
    if (poHeader) {
      if (action === 'REJECTED') {
        // ส่ง email แจ้ง Rework ให้คน created_by
        try {
          await this.emailService.sendApprovalEmail({
            notifyType: 'PO_REWORK',
            documentId: poHeader.po_id,
            documentNo: poHeader.po_no,
            documentType: 'PO',
            toEmployeeIds: [poHeader.created_by],  // Send to PO creator
            rejectedByName: actionedBy,
            additionalMessage: remark || 'Please revise and resubmit',
          });
          console.log(`✅ Rework notification sent for PO: ${poHeader.po_no}`);
        } catch (error) {
          console.error(`❌ Failed to send rework email: ${error.message}`);
        }
      } else if (action === 'APPROVED') {
        // Check if this is FINAL approval (all approvals done)
        const approvals = await this.getPoApprovals(poHeader.po_id);
        const allApproved = approvals.every(a => a.status === 'APPROVED');

        if (allApproved) {
          // ส่ง email แจ้ง Completion ให้คน created_by
          try {
            await this.emailService.sendApprovalEmail({
              notifyType: 'PO_COMPLETED',
              documentId: poHeader.po_id,
              documentNo: poHeader.po_no,
              documentType: 'PO',
              toEmployeeIds: [poHeader.created_by],  // Send to PO creator
              approvedByName: actionedBy,
              additionalMessage: 'Your PO has been approved and is ready for ordering',
            });
            console.log(`✅ Completion notification sent for PO: ${poHeader.po_no}`);
          } catch (error) {
            console.error(`❌ Failed to send completion email: ${error.message}`);
          }
        }
      }
    }

    return result;
  }

  // Helper method to get PO header by ID
  private async getPoHeaderById(poId: number): Promise<any> {
    const query = `
      SELECT TOP 1
        h.po_id,
        h.po_no,
        h.status,
        h.note,
        h.created_by,
        h.created_at
      FROM po_headers h
      WHERE h.po_id = @param0
    `;
    const result = await this.databaseService.query(this.DATABASE_NAME, query, [poId]);
    return result?.[0] || null;
  }
}

// =====================================================
// Step 5: Update PoModule to register EmailService
// =====================================================

// 📝 In: server/src/apis/po/po.module.ts

import { Module } from '@nestjs/common';
import { PoController } from './po.controller';
import { PoService } from './po.service';
import { DatabaseModule } from '@/src/database/database.module';
import { EmailModule } from '@/src/email/email.module';  // ← ADD THIS

@Module({
  imports: [
    DatabaseModule,
    EmailModule,  // ← ADD THIS (provides EmailService)
  ],
  controllers: [PoController],
  providers: [PoService],
})
export class PoModule {}

// =====================================================
// Step 6: Same for Borrow (if needed)
// =====================================================

// The same pattern applies to BorrowService:
// - submitBorrow() → send APPROVAL_BORROW email
// - approveBorrow() → send BORROW_REWORK or BORROW_COMPLETED email

// =====================================================
// Email Triggers Summary
// =====================================================

/**
 * Trigger Points:
 * 
 * 1. POST /po/:id/submit
 *    Action: User clicks "ส่งอนุมัติ"
 *    Email: APPROVAL_PO
 *    To: Approvers (via role_code)
 *    Message: "Please approve this PO"
 * 
 * 2. POST /po/:id/approve (action='REJECTED')
 *    Action: Approver clicks "ปฏิเสธ"
 *    Email: PO_REWORK
 *    To: PO Creator (created_by)
 *    Message: "Your PO was rejected, please revise"
 * 
 * 3. POST /po/:id/approve (action='APPROVED' && all approvals done)
 *    Action: Final approver clicks "อนุมัติ"
 *    Email: PO_COMPLETED
 *    To: PO Creator (created_by)
 *    Message: "Your PO has been fully approved"
 */

// =====================================================
// Role Codes to Use
// =====================================================

/**
 * ต้องสอบถาม Database เพื่อหา role_code ที่ถูกต้อง
 * 
 * SELECT DISTINCT role_code, role_name
 * FROM approval_roles
 * WHERE is_active = 1;
 * 
 * Common role codes:
 * - 'GROUP_LEAD' - หัวหน้ากลุ่ม
 * - 'MANAGER' - ผู้จัดการ
 * - 'DEPARTMENT' - หัวหน้าแผนก
 * 
 * ต้องหลัก approval_level ว่า:
 * - Level 1: GROUP_LEAD
 * - Level 2: MANAGER
 * - Level 3: DEPARTMENT
 */
