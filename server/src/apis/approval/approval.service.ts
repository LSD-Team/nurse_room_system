import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@/src/database/database.service';
import type {
  IPendingApprovalItem,
  IApprovalHistory,
  IBorrowApprovalLog,
} from './approval.interface';

@Injectable()
export class ApprovalService {
  constructor(private readonly databaseService: DatabaseService) {}

  private get DATABASE_NAME(): string {
    return this.databaseService.getDatabaseName();
  }

  // ─── GET: Combined pending approvals (PO + Borrow) ───
  async getPendingApprovals(): Promise<IPendingApprovalItem[]> {
    const query = `
      SELECT
        'PO' AS type,
        ph.po_id AS id,
        ph.po_no AS doc_no,
        CONVERT(VARCHAR(10), ph.po_date, 23) AS doc_date,
        ph.status,
        ph.supplier_id,
        s.supplier_name,
        ph.note,
        ph.created_by,
        ve_creator.eng_name AS created_by_name,
        ar.role_code AS current_approval_role,
        ar.approver_id AS current_approver_id,
        ve_approver.eng_name AS current_approver_name
      FROM po_headers ph
      JOIN suppliers s ON ph.supplier_id = s.supplier_id
      LEFT JOIN view_email ve_creator ON ph.created_by = ve_creator.employee_id
      JOIN po_approvals pa ON pa.po_id = ph.po_id AND pa.status = 'PENDING'
      JOIN approval_roles ar ON ar.role_code = pa.approval_role AND ar.is_active = 1
      LEFT JOIN view_email ve_approver ON ar.approver_id = ve_approver.employee_id
      WHERE ph.status IN ('PENDING_APPROVAL', 'APPROVED_L1', 'APPROVED_L2')
        AND pa.approval_level = (
          SELECT MIN(pa2.approval_level)
          FROM po_approvals pa2
          WHERE pa2.po_id = ph.po_id AND pa2.status = 'PENDING'
        )

      UNION ALL

      SELECT
        'BORROW' AS type,
        bh.borrow_id AS id,
        bh.borrow_no AS doc_no,
        CONVERT(VARCHAR(10), bh.borrow_date, 23) AS doc_date,
        bh.status,
        bh.supplier_id,
        s.supplier_name,
        bh.note,
        bh.created_by,
        ve_creator.eng_name AS created_by_name,
        ar.role_code AS current_approval_role,
        ar.approver_id AS current_approver_id,
        ve_approver.eng_name AS current_approver_name
      FROM borrow_headers bh
      JOIN suppliers s ON bh.supplier_id = s.supplier_id
      LEFT JOIN view_email ve_creator ON bh.created_by = ve_creator.employee_id
      JOIN borrow_approvals ba ON ba.borrow_id = bh.borrow_id AND ba.status = 'PENDING'
      JOIN approval_roles ar ON ar.role_code = ba.approval_role AND ar.is_active = 1
      LEFT JOIN view_email ve_approver ON ar.approver_id = ve_approver.employee_id
      WHERE bh.status IN ('PENDING_APPROVAL', 'APPROVED_L1', 'APPROVED_L2')
        AND ba.approval_level = (
          SELECT MIN(ba2.approval_level)
          FROM borrow_approvals ba2
          WHERE ba2.borrow_id = bh.borrow_id AND ba2.status = 'PENDING'
        )

      ORDER BY doc_date DESC, doc_no DESC
    `;
    return this.databaseService.query<IPendingApprovalItem>(
      this.DATABASE_NAME,
      query,
    );
  }

  // ─── GET: Approval history (all PO + Borrow regardless of status) ───
  async getApprovalHistory(): Promise<IPendingApprovalItem[]> {
    const query = `
      SELECT
        'PO' AS type,
        ph.po_id AS id,
        ph.po_no AS doc_no,
        CONVERT(VARCHAR(10), ph.po_date, 23) AS doc_date,
        ph.status,
        ph.supplier_id,
        s.supplier_name,
        ph.note,
        ph.created_by,
        ve_creator.eng_name AS created_by_name,
        ISNULL(ar.role_code, NULL) AS current_approval_role,
        ISNULL(ar.approver_id, NULL) AS current_approver_id,
        ISNULL(ve_approver.eng_name, NULL) AS current_approver_name
      FROM po_headers ph
      JOIN suppliers s ON ph.supplier_id = s.supplier_id
      LEFT JOIN view_email ve_creator ON ph.created_by = ve_creator.employee_id
      LEFT JOIN po_approvals pa ON pa.po_id = ph.po_id AND pa.status = 'PENDING'
      LEFT JOIN approval_roles ar ON ar.role_code = pa.approval_role AND ar.is_active = 1
      LEFT JOIN view_email ve_approver ON ar.approver_id = ve_approver.employee_id

      UNION ALL

      SELECT
        'BORROW' AS type,
        bh.borrow_id AS id,
        bh.borrow_no AS doc_no,
        CONVERT(VARCHAR(10), bh.borrow_date, 23) AS doc_date,
        bh.status,
        bh.supplier_id,
        s.supplier_name,
        bh.note,
        bh.created_by,
        ve_creator.eng_name AS created_by_name,
        ISNULL(ar.role_code, NULL) AS current_approval_role,
        ISNULL(ar.approver_id, NULL) AS current_approver_id,
        ISNULL(ve_approver.eng_name, NULL) AS current_approver_name
      FROM borrow_headers bh
      JOIN suppliers s ON bh.supplier_id = s.supplier_id
      LEFT JOIN view_email ve_creator ON bh.created_by = ve_creator.employee_id
      LEFT JOIN borrow_approvals ba ON ba.borrow_id = bh.borrow_id AND ba.status = 'PENDING'
      LEFT JOIN approval_roles ar ON ar.role_code = ba.approval_role AND ar.is_active = 1
      LEFT JOIN view_email ve_approver ON ar.approver_id = ve_approver.employee_id

      ORDER BY doc_date DESC, doc_no DESC
    `;
    return this.databaseService.query<IPendingApprovalItem>(
      this.DATABASE_NAME,
      query,
    );
  }

  // ─── GET: PO detail with lines + approval history ───
  async getPoDetail(poId: number) {
    const linesQuery = `
      SELECT
        pl.po_line_id,
        vi.item_code,
        vi.item_name_th,
        vi.item_name_en,
        vi.purchase_unit_name_th,
        pl.qty_order,
        pl.qty_received,
        pl.unit_price,
        pl.total_price
      FROM po_lines pl
      LEFT JOIN view_items vi ON pl.item_id = vi.item_id
      WHERE pl.po_id = @param0
      ORDER BY pl.po_line_id
    `;
    const approvalsQuery = `
      SELECT
        pa.approval_id,
        pa.approval_level,
        pa.approval_role,
        pa.status,
        pa.actioned_by,
        ve.eng_name AS actioned_by_name,
        pa.actioned_at,
        pa.remark
      FROM po_approvals pa
      LEFT JOIN view_email ve ON pa.actioned_by = ve.employee_id
      WHERE pa.po_id = @param0
      ORDER BY pa.approval_level
    `;
    const [lines, approvals] = await Promise.all([
      this.databaseService.query(this.DATABASE_NAME, linesQuery, [poId]),
      this.databaseService.query(this.DATABASE_NAME, approvalsQuery, [poId]),
    ]);
    return { lines, approvals };
  }

  // ─── GET: Borrow approval history ───
  async getBorrowApprovalHistory(
    borrowId: number,
  ): Promise<IApprovalHistory[]> {
    const query = `
      SELECT
        ba.approval_id,
        ba.approval_level,
        ba.approval_role,
        ba.status,
        ba.actioned_by,
        ve.eng_name AS actioned_by_name,
        ve.email AS actioned_by_email,
        ba.actioned_at,
        ba.remark
      FROM borrow_approvals ba
      LEFT JOIN view_email ve ON ba.actioned_by = ve.employee_id
      WHERE ba.borrow_id = @param0
      ORDER BY ba.approval_level
    `;
    return this.databaseService.query<IApprovalHistory>(
      this.DATABASE_NAME,
      query,
      [borrowId],
    );
  }

  // ─── GET: Borrow approval logs (persistent timeline) ───
  async getBorrowApprovalLogs(borrowId: number): Promise<IBorrowApprovalLog[]> {
    const query = `
      SELECT
        bal.log_id,
        bal.borrow_id,
        bal.approval_level,
        bal.approval_role,
        bal.action,
        bal.actioned_by,
        ve.eng_name AS actioned_by_name,
        bal.actioned_at,
        bal.remark
      FROM borrow_approval_logs bal
      LEFT JOIN view_email ve ON bal.actioned_by = ve.employee_id
      WHERE bal.borrow_id = @param0
      ORDER BY bal.actioned_at ASC, bal.log_id ASC
    `;
    return this.databaseService.query<IBorrowApprovalLog>(
      this.DATABASE_NAME,
      query,
      [borrowId],
    );
  }

  // ─── POST: Approve PO (sp_PO_04_ApprovePO) ───
  async approvePo(
    poId: string,
    action: string,
    actionedBy: string,
    remark: string | null,
  ) {
    return this.databaseService.executeStoredProcedure(
      this.DATABASE_NAME,
      'sp_PO_04_ApprovePO',
      {
        PoId: poId,
        Action: action,
        ActionedBy: actionedBy,
        Remark: remark,
      },
    );
  }

  // ─── POST: Approve Borrow (sp_BR_04_Approve) ───
  async approveBorrow(
    borrowId: string,
    action: string,
    actionedBy: string,
    remark: string | null,
  ) {
    return this.databaseService.executeStoredProcedure(
      this.DATABASE_NAME,
      'sp_BR_04_Approve',
      {
        BorrowId: borrowId,
        Action: action,
        ActionedBy: actionedBy,
        Remark: remark,
      },
    );
  }
}
