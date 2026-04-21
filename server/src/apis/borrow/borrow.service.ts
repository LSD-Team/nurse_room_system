import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@/src/database/database.service';
import type {
  IBorrowHeader,
  IBorrowLine,
  ISupplier,
  ISupplierItemPrice,
} from './borrow.interface';

@Injectable()
export class BorrowService {
  constructor(private readonly databaseService: DatabaseService) {}

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
    return this.databaseService.executeStoredProcedure(
      this.DATABASE_NAME,
      'sp_BR_03_Submit',
      {
        BorrowId: borrowId,
        SubmitBy: submitBy,
      },
    );
  }

  // โ”€โ”€โ”€ POST: เธญเธเธธเธกเธฑเธ•เธด/เธเธเธดเน€เธชเธ/เธชเนเธเธเธฅเธฑเธ (sp_BR_04_Approve) โ”€โ”€โ”€
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
}
