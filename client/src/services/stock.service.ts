import { Api } from '@/services/api.service';

export interface IStockOnHand {
  item_id: number;
  item_code: string;
  item_name_en: string;
  item_name_th: string;
  qty_base: number | null;
  item_min: number | null;
  item_max: number | null;
}

export class StockService {
  static async getStockStatus(): Promise<IStockOnHand[]> {
    return Api.get<IStockOnHand[]>('/stock/stock-status');
  }
}
