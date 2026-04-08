import { Api } from '@/services/api.service';
import type {
  IBorrowHeader,
  IBorrowLine,
  ISupplier,
  ISupplierItemPrice,
} from '@/interfaces/borrow.interfaces';

export class BorrowService {
  // โ”€โ”€โ”€ เธฃเธฒเธขเธเธฒเธฃเนเธเธขเธทเธกเธ—เธฑเนเธเธซเธกเธ” โ”€โ”€โ”€
  static async getBorrowHeaders(): Promise<IBorrowHeader[]> {
    return Api.get<IBorrowHeader[]>('/borrow');
  }

  // โ”€โ”€โ”€ เธฃเธฒเธขเธฅเธฐเน€เธญเธตเธขเธ” lines เธเธญเธเนเธเธขเธทเธก โ”€โ”€โ”€
  static async getBorrowLines(borrowId: number): Promise<IBorrowLine[]> {
    return Api.get<IBorrowLine[]>(`/borrow/${borrowId}/lines`);
  }

  // โ”€โ”€โ”€ Suppliers dropdown โ”€โ”€โ”€
  static async getSuppliers(): Promise<ISupplier[]> {
    return Api.get<ISupplier[]>('/borrow/suppliers');
  }

  // โ”€โ”€โ”€ เธฃเธฒเธเธฒเธขเธฒเธ•เธฒเธก supplier โ”€โ”€โ”€
  static async getSupplierPrices(
    supplierId: number
  ): Promise<ISupplierItemPrice[]> {
    return Api.get<ISupplierItemPrice[]>(
      `/borrow/supplier-prices/${supplierId}`
    );
  }

  // โ”€โ”€โ”€ เธชเธฃเนเธฒเธเนเธเธขเธทเธก โ”€โ”€โ”€
  static async createBorrow(data: {
    JsonLines: string;
    SupplierId: string;
    Note?: string;
  }) {
    return Api.post('/borrow', data);
  }

  // โ”€โ”€โ”€ เนเธเนเนเธเนเธเธขเธทเธก โ”€โ”€โ”€
  static async updateBorrow(
    borrowId: number,
    data: {
      JsonLines?: string;
      Note?: string;
    }
  ) {
    return Api.put(`/borrow/${borrowId}`, data);
  }

  // โ”€โ”€โ”€ เธชเนเธเธญเธเธธเธกเธฑเธ•เธด โ”€โ”€โ”€
  static async submitBorrow(borrowId: number) {
    return Api.post(`/borrow/${borrowId}/submit`);
  }

  // โ”€โ”€โ”€ เธญเธเธธเธกเธฑเธ•เธด/เธเธเธดเน€เธชเธ/เธชเนเธเธเธฅเธฑเธ โ”€โ”€โ”€
  static async approveBorrow(
    borrowId: number,
    data: {
      Action: 'APPROVE' | 'REJECT' | 'REWORK';
      Remark?: string;
    }
  ) {
    return Api.post(`/borrow/${borrowId}/approve`, data);
  }

  // โ”€โ”€โ”€ เธฃเธฑเธเน€เธเนเธฒเธชเธ•เนเธญเธ โ”€โ”€โ”€
  static async receiveBorrow(borrowId: number) {
    return Api.post(`/borrow/${borrowId}/receive`);
  }

  // โ”€โ”€โ”€ เธขเธเน€เธฅเธดเธ โ”€โ”€โ”€
  static async cancelBorrow(borrowId: number, data?: { Reason?: string }) {
    return Api.post(`/borrow/${borrowId}/cancel`, data);
  }

  // โ”€โ”€โ”€ เนเธเธขเธทเธกเธฃเธญ settle โ”€โ”€โ”€
  static async getPendingBorrows(supplierId?: number) {
    const params = supplierId ? `?supplierId=${supplierId}` : '';
    return Api.get(`/borrow/pending${params}`);
  }
}
