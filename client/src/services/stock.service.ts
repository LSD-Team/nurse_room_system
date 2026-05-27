import { Api } from '@/services/api.service';
import type {
  IStockMovement,
  IStockMonthlyReport,
} from '@/interfaces/stock.interfaces';

export interface IStockOnHand {
  item_id: number;
  item_code: string;
  item_name_en: string;
  item_name_th: string;
  qty_base: number | null;
  item_min: number | null;
  item_max: number | null;
  usage_unit_name_th?: string;
}

export class StockService {
  static async getStockStatus(): Promise<IStockOnHand[]> {
    return Api.get<IStockOnHand[]>('/stock/stock-status');
  }

  static async getMovementRecords(): Promise<IStockMovement[]> {
    return Api.get<IStockMovement[]>('/stock/movements');
  }

  static async getReportPeriods(): Promise<{ period_code: string }[]> {
    return Api.get<{ period_code: string }[]>('/stock/monthly-report/periods');
  }

  static async getStockMonthlyReport(
    periodCode: string
  ): Promise<IStockMonthlyReport[]> {
    return Api.get<IStockMonthlyReport[]>(
      `/stock/monthly-report/${periodCode}`
    );
  }
}
