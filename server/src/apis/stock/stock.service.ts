import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@/src/database/database.service';

export interface IStockOnHand {
  item_id: number;
  item_code: string;
  item_name_en: string;
  item_name_th: string;
  qty_base: number | null;
  item_min: number | null;
  item_max: number | null;
}

export interface IStockMovement {
  movement_id: number;
  movement_type: string;
  item_id: number;
  item_code: string;
  item_name_th: string;
  item_name_en: string;
  qty_base: number;
  ref_type: string;
  ref_id: string | null;
  created_by: string;
  created_by_name: string | null;
  created_at: string;
  reason: string | null;
}

@Injectable()
export class StockService {
  constructor(private readonly databaseService: DatabaseService) {}

  private get DATABASE_NAME(): string {
    return this.databaseService.getDatabaseName();
  }

  async getStockStatus(): Promise<IStockOnHand[]> {
    const query = `
      SELECT
        item_id,
        item_code,
        item_name_en,
        item_name_th,
        qty_base,
        item_min,
        item_max
      FROM view_items
      ORDER BY item_code
    `;
    return this.databaseService.query<IStockOnHand>(
      this.DATABASE_NAME,
      query,
    );
  }

  async getMovementRecords(): Promise<IStockMovement[]> {
    const query = `
      SELECT
        sm.movement_id,
        sm.movement_type,
        sm.item_id,
        i.item_code,
        i.item_name_th,
        i.item_name_en,
        sm.qty_base,
        sm.ref_type,
        sm.ref_id,
        sm.created_by,
        ISNULL(e.eng_name, sm.created_by) AS created_by_name,
        sm.created_at,
        sm.reason
      FROM stock_movements sm
      LEFT JOIN view_items i ON sm.item_id = i.item_id
      LEFT JOIN view_employee_all e ON sm.created_by = e.ID
      ORDER BY sm.created_at DESC
    `;
    return this.databaseService.query<IStockMovement>(
      this.DATABASE_NAME,
      query,
    );
  }
}
