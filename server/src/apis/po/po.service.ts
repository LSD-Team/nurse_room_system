import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@/src/database/database.service';
import type {
  IPoHeader,
  IPoLine,
  IPoApproval,
  ISupplier,
  ISupplierItemPrice,
} from './po.interface';

@Injectable()
export class PoService {
  constructor(private readonly databaseService: DatabaseService) {}

  private get DATABASE_NAME(): string {
    return this.databaseService.getDatabaseName();
  }

  // ─── GET: รายการ PO ทั้งหมด ───
  async getPoHeaders(): Promise<IPoHeader[]> {
    const query = `
      SELECT
        h.po_id,
        h.po_no,
        h.po_date,
        h.supplier_id,
        s.supplier_code,
        s.supplier_name,
        h.due_date,
        h.status AS po_status,
        h.note,
        h.created_by,
        ve.eng_name AS created_by_eng_name,
        h.created_at,
        ca.approval_level,
        ca.approval_role,
        ca.approval_status,
        ca.actioned_by,
        vea.eng_name AS actioned_by_eng_name,
        ca.actioned_at,
        ca.remark AS approval_remark
      FROM po_headers h
      LEFT JOIN suppliers s ON h.supplier_id = s.supplier_id
      LEFT JOIN view_email ve ON h.created_by = ve.employee_id
      OUTER APPLY (
        SELECT TOP 1
          a.approval_level,
          a.approval_role,
          a.status AS approval_status,
          a.actioned_by,
          a.actioned_at,
          a.remark
        FROM po_approvals a
        WHERE a.po_id = h.po_id AND a.status NOT IN ('CANCELLED')
        ORDER BY
          IIF(a.status = 'PENDING', 0, 1),
          IIF(a.status = 'PENDING', a.approval_level, 999 - a.approval_level)
      ) ca
      LEFT JOIN view_email vea ON ca.actioned_by = vea.employee_id
      ORDER BY h.po_id DESC
    `;
    return this.databaseService.query<IPoHeader>(this.DATABASE_NAME, query);
  }

  // ─── GET: รายละเอียด lines ของ PO ───
  async getPoLines(poId: number): Promise<IPoLine[]> {
    const query = `
      SELECT
        l.po_line_id,
        l.po_id,
        l.item_id,
        vi.item_code,
        vi.item_name_th,
        vi.item_name_en,
        vi.purchase_unit_code,
        vi.purchase_unit_name_th,
        l.qty_order,
        l.qty_received,
        l.unit_price,
        l.total_price,
        l.line_type,
        l.borrow_line_id,
        l.remark
      FROM po_lines l
      JOIN view_items vi ON l.item_id = vi.item_id
      WHERE l.po_id = @param0
      ORDER BY l.po_line_id
    `;
    return this.databaseService.query<IPoLine>(this.DATABASE_NAME, query, [
      poId,
    ]);
  }

  // ─── GET: ประวัติการอนุมัติ PO ───
  async getPoApprovals(poId: number): Promise<IPoApproval[]> {
    const query = `
      SELECT
        a.approval_id,
        a.po_id,
        a.approval_level,
        a.approval_role,
        a.status,
        a.actioned_by,
        ve.eng_name AS actioned_by_name,
        a.actioned_at,
        a.remark
      FROM po_approvals a
      LEFT JOIN view_email ve ON a.actioned_by = ve.employee_id
      WHERE a.po_id = @param0
      ORDER BY a.approval_level
    `;
    return this.databaseService.query<IPoApproval>(
      this.DATABASE_NAME,
      query,
      [poId],
    );
  }

  // ─── GET: Suppliers (for dropdown) ───
  async getSuppliers(): Promise<ISupplier[]> {
    const query = `
      SELECT supplier_id, supplier_code, supplier_name
      FROM suppliers
      WHERE is_active = 1
      ORDER BY supplier_code
    `;
    return this.databaseService.query<ISupplier>(this.DATABASE_NAME, query);
  }

  // ─── GET: ราคายาตาม supplier ───
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

  // ─── GET: การยืมที่รอ settle ───
  async getPendingBorrows(supplierId: string | null) {
    const supplierIdInt = supplierId ? parseInt(supplierId, 10) : null;
    const whereClause = supplierIdInt
      ? `AND bh.supplier_id = @param0`
      : '';
    const query = `
      SELECT
        bh.borrow_id,
        bh.borrow_no,
        bh.borrow_date,
        bh.supplier_id,
        s.supplier_name,
        COUNT(bl.borrow_line_id)           AS item_count,
        SUM(bl.qty_borrow * bl.unit_price) AS total_amount
      FROM borrow_headers bh
      JOIN borrow_lines   bl ON bh.borrow_id  = bl.borrow_id
      JOIN suppliers       s ON bh.supplier_id = s.supplier_id
      WHERE bh.status = 'RECEIVED'
        ${whereClause}
      GROUP BY bh.borrow_id, bh.borrow_no, bh.borrow_date,
               bh.supplier_id, s.supplier_name
      ORDER BY bh.borrow_date, bh.borrow_id
    `;
    return this.databaseService.query(
      this.DATABASE_NAME,
      query,
      supplierIdInt ? [supplierIdInt] : [],
    );
  }

  // ─── GET: รายการยืมที่ settle ใน PO นี้แล้ว ───
  async getSettledBorrows(poId: number) {
    const query = `
      SELECT
        bh.borrow_id,
        bh.borrow_no,
        bh.borrow_date,
        bh.supplier_id,
        s.supplier_name,
        COUNT(bl.borrow_line_id)           AS item_count,
        SUM(bl.qty_borrow * bl.unit_price) AS total_amount
      FROM borrow_headers bh
      JOIN borrow_lines   bl ON bh.borrow_id  = bl.borrow_id
      JOIN suppliers       s ON bh.supplier_id = s.supplier_id
      WHERE bh.po_id = @param0 AND bh.status = 'SETTLED'
      GROUP BY bh.borrow_id, bh.borrow_no, bh.borrow_date,
               bh.supplier_id, s.supplier_name
      ORDER BY bh.borrow_date, bh.borrow_id
    `;
    return this.databaseService.query(this.DATABASE_NAME, query, [poId]);
  }

  // ─── POST: สร้าง PO (sp_PO_01_CreatePO) ───
  async createPo(
    supplierId: string,
    poDate: string,
    dueDate: string | null,
    jsonLines: string,
    borrowIds: string | null,
    note: string | null,
    createdBy: string,
  ) {
    return this.databaseService.executeStoredProcedure(
      this.DATABASE_NAME,
      'sp_PO_01_CreatePO',
      {
        SupplierId: supplierId,
        PoDate: poDate,
        DueDate: dueDate,
        JsonLines: jsonLines,
        BorrowIds: borrowIds,
        Note: note,
        CreatedBy: createdBy,
      },
    );
  }

  // ─── PUT: แก้ไข PO (sp_POUpdate, DRAFT only) ───
  async updatePo(
    poId: string,
    dueDate: string | null,
    jsonLines: string | null,
    borrowIds: string | null,
    note: string | null,
    updatedBy: string,
  ) {
    // 1. Update ORDER lines via SP
    const result = await this.databaseService.executeStoredProcedure(
      this.DATABASE_NAME,
      'sp_POUpdate',
      {
        PoId: poId,
        DueDate: dueDate,
        JsonLines: jsonLines,
        Note: note,
        UpdatedBy: updatedBy,
      },
    );

    // Check if SP returned error
    const spResult = result as any[];
    if (spResult?.[0]?.Status === 'Error') {
      return result;
    }

    // 2. Sync BORROW lines if BorrowIds provided (can be "[]" to clear all)
    if (borrowIds !== null) {
      await this.syncPoBorrows(poId, borrowIds, updatedBy);
    }

    return result;
  }

  // ─── SYNC: จัดการรายการยืมใน PO (DRAFT only) ───
  private async syncPoBorrows(
    poId: string,
    borrowIdsJson: string,
    updatedBy: string,
  ) {
    const query = `
      DECLARE @PoId INT = @param0;
      DECLARE @BorrowIdsJson NVARCHAR(MAX) = @param1;
      DECLARE @UpdatedBy NVARCHAR(100) = @param2;

      -- Verify PO exists and is DRAFT
      DECLARE @Status VARCHAR(30), @SupplierId INT;
      SELECT @Status = status, @SupplierId = supplier_id
      FROM po_headers WHERE po_id = @PoId;

      IF @Status IS NULL OR @Status <> 'DRAFT'
      BEGIN
        SELECT 'Error' AS Status, 'PO ไม่ใช่สถานะ DRAFT' AS Message;
        RETURN;
      END;

      BEGIN TRY
        BEGIN TRANSACTION;

        -- 1. Collect current borrow_ids settled to this PO
        SELECT borrow_id INTO #CurrentBorrows
        FROM borrow_headers WHERE po_id = @PoId AND status = 'SETTLED';

        -- 2. Parse new borrow IDs
        SELECT CAST(value AS INT) AS borrow_id INTO #NewBorrows
        FROM OPENJSON(ISNULL(@BorrowIdsJson, '[]'));

        -- 3. Borrows to remove
        SELECT borrow_id INTO #ToRemove
        FROM #CurrentBorrows
        WHERE borrow_id NOT IN (SELECT borrow_id FROM #NewBorrows);

        -- 4. Borrows to add
        SELECT borrow_id INTO #ToAdd
        FROM #NewBorrows
        WHERE borrow_id NOT IN (SELECT borrow_id FROM #CurrentBorrows);

        -- 5. Un-settle removed borrows
        IF EXISTS (SELECT 1 FROM #ToRemove)
        BEGIN
          UPDATE bl SET bl.po_line_id = NULL
          FROM borrow_lines bl
          WHERE bl.borrow_id IN (SELECT borrow_id FROM #ToRemove);

          DELETE pl FROM po_lines pl
          JOIN borrow_lines bl ON pl.borrow_line_id = bl.borrow_line_id
          WHERE pl.po_id = @PoId AND pl.line_type = 'BORROW'
            AND bl.borrow_id IN (SELECT borrow_id FROM #ToRemove);

          UPDATE borrow_headers
          SET status = 'RECEIVED', po_id = NULL, settled_at = NULL, settled_by = NULL
          WHERE borrow_id IN (SELECT borrow_id FROM #ToRemove);
        END;

        -- 6. Settle new borrows
        IF EXISTS (SELECT 1 FROM #ToAdd)
        BEGIN
          -- Validate: must exist and be RECEIVED
          IF EXISTS (
            SELECT 1 FROM #ToAdd ta
            LEFT JOIN borrow_headers bh ON ta.borrow_id = bh.borrow_id
            WHERE bh.borrow_id IS NULL OR bh.status <> 'RECEIVED'
          )
          BEGIN
            ROLLBACK TRANSACTION;
            SELECT 'Error' AS Status, N'รายการยืมบางรายการไม่อยู่ในสถานะ RECEIVED' AS Message;
            RETURN;
          END;

          -- Validate: same supplier
          IF EXISTS (
            SELECT 1 FROM #ToAdd ta
            JOIN borrow_headers bh ON ta.borrow_id = bh.borrow_id
            WHERE bh.supplier_id <> @SupplierId
          )
          BEGIN
            ROLLBACK TRANSACTION;
            SELECT 'Error' AS Status, N'รายการยืมต้องเป็น Supplier เดียวกับ PO' AS Message;
            RETURN;
          END;

          -- Insert BORROW lines into po_lines
          INSERT INTO po_lines (po_id, item_id, qty_order, unit_price, line_type, borrow_line_id)
          SELECT @PoId, bl.item_id, bl.qty_borrow, bl.unit_price, 'BORROW', bl.borrow_line_id
          FROM borrow_lines bl
          WHERE bl.borrow_id IN (SELECT borrow_id FROM #ToAdd);

          -- Link borrow_lines.po_line_id
          UPDATE bl SET bl.po_line_id = pl.po_line_id
          FROM borrow_lines bl
          JOIN po_lines pl ON pl.borrow_line_id = bl.borrow_line_id
          WHERE bl.borrow_id IN (SELECT borrow_id FROM #ToAdd)
            AND pl.po_id = @PoId;

          -- Settle borrow_headers
          UPDATE borrow_headers
          SET status = 'SETTLED', po_id = @PoId,
              settled_at = GETDATE(), settled_by = @UpdatedBy
          WHERE borrow_id IN (SELECT borrow_id FROM #ToAdd);
        END;

        COMMIT TRANSACTION;
      END TRY
      BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        SELECT 'Error' AS Status, ERROR_MESSAGE() AS Message;
      END CATCH;
    `;
    return this.databaseService.query(
      this.DATABASE_NAME,
      query,
      [parseInt(poId, 10), borrowIdsJson, updatedBy],
    );
  }

  // ─── POST: ส่งอนุมัติ (sp_PO_03_SubmitPO) ───
  async submitPo(poId: string, submitBy: string) {
    return this.databaseService.executeStoredProcedure(
      this.DATABASE_NAME,
      'sp_PO_03_SubmitPO',
      {
        PoId: poId,
        SubmitBy: submitBy,
      },
    );
  }

  // ─── POST: อนุมัติ/ปฏิเสธ (sp_PO_04_ApprovePO) ───
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

  // ─── POST: ยกเลิก PO (sp_POCancel) ───
  async cancelPo(
    poId: string,
    cancelledBy: string,
    reason: string | null,
  ) {
    return this.databaseService.executeStoredProcedure(
      this.DATABASE_NAME,
      'sp_POCancel',
      {
        PoId: poId,
        CancelledBy: cancelledBy,
        Reason: reason,
      },
    );
  }

  // ─── GET: รายการ PO ที่รอ Receiving (ORDERED/PARTIAL) ───
  async getPendingReceiving() {
    const query = `
      SELECT
        h.po_id,
        h.po_no,
        h.po_date,
        h.supplier_id,
        s.supplier_code,
        s.supplier_name,
        h.due_date,
        h.status AS po_status,
        h.note,
        h.created_by,
        ve.eng_name AS created_by_eng_name,
        h.created_at,
        COUNT(DISTINCT l.po_line_id) AS total_lines,
        SUM(CASE WHEN l.qty_received >= l.qty_order THEN 1 ELSE 0 END) AS received_lines
      FROM po_headers h
      LEFT JOIN suppliers s ON h.supplier_id = s.supplier_id
      LEFT JOIN view_email ve ON h.created_by = ve.employee_id
      LEFT JOIN po_lines l ON h.po_id = l.po_id
      WHERE h.status IN ('ORDERED', 'PARTIAL')
      GROUP BY h.po_id, h.po_no, h.po_date, h.supplier_id, s.supplier_code,
               s.supplier_name, h.due_date, h.status, h.note, h.created_by,
               ve.eng_name, h.created_at
      ORDER BY h.po_date DESC
    `;
    return this.databaseService.query(this.DATABASE_NAME, query);
  }

  // ─── PUT: อัปเดต qty_received ของ PO lines ───
  async updateQtyReceived(
    poId: string,
    receivedBy: string,
    jsonLines: string,
  ) {
    // jsonLines format: [{ po_line_id, qty_received }, ...]
    const lines = JSON.parse(jsonLines);

    // Update each line and get current values
    for (const line of lines) {
      const query = `
        UPDATE po_lines
        SET qty_received = @QtyReceived
        WHERE po_line_id = @PoLineId;
        
        SELECT
          po_line_id,
          po_id,
          qty_order,
          qty_received,
          (SELECT po_id FROM po_headers WHERE po_id = po_lines.po_id) AS current_po_id
        FROM po_lines
        WHERE po_line_id = @PoLineId
      `;

      await this.databaseService.query(this.DATABASE_NAME, query, {
        PoLineId: line.po_line_id,
        QtyReceived: line.qty_received,
      });
    }

    // Check if all lines are fully received to update PO status
    const checkQuery = `
      SELECT
        po_id,
        SUM(qty_order) AS total_order,
        SUM(qty_received) AS total_received
      FROM po_lines
      WHERE po_id = @PoId
      GROUP BY po_id
    `;

    const result = await this.databaseService.query(
      this.DATABASE_NAME,
      checkQuery,
      { PoId: poId },
    );

    if (result && result.length > 0) {
      const { total_order, total_received } = result[0] as { total_order: number; total_received: number };

      // Determine new status
      let newStatus = 'PARTIAL';
      if (total_received >= total_order) {
        newStatus = 'CLOSED';
      } else if (total_received > 0) {
        newStatus = 'PARTIAL';
      }

      // Update PO header status
      const updateStatusQuery = `
        UPDATE po_headers
        SET status = @Status, updated_by = @UpdatedBy, updated_at = GETDATE()
        WHERE po_id = @PoId
      `;

      await this.databaseService.query(
        this.DATABASE_NAME,
        updateStatusQuery,
        {
          PoId: poId,
          Status: newStatus,
          UpdatedBy: receivedBy,
        },
      );
    }

    return { success: true, message: 'Qty received updated successfully' };
  }
}
