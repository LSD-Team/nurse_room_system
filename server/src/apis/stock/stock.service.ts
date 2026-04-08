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
    return this.databaseService.query<IStockOnHand[]>(
      this.DATABASE_NAME,
      query,
    );
  }
}
