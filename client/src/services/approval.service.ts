import { Api } from '@/services/api.service';
import type {
  IPendingApprovalItem,
  IApprovalHistory,
  IBorrowApprovalLog,
} from '@/interfaces/approval.interfaces';

export class ApprovalService {
  static async getPendingApprovals(): Promise<IPendingApprovalItem[]> {
    return Api.get<IPendingApprovalItem[]>('/approval/pending');
  }

  static async getApprovalHistory(): Promise<IPendingApprovalItem[]> {
    return Api.get<IPendingApprovalItem[]>('/approval/history');
  }

  static async getPoDetail(poId: number) {
    return Api.get<any>(`/approval/po/${poId}`);
  }

  static async getBorrowApprovalHistory(
    borrowId: number
  ): Promise<IApprovalHistory[]> {
    return Api.get<IApprovalHistory[]>(`/approval/borrow/${borrowId}/history`);
  }

  static async getBorrowApprovalLogs(
    borrowId: number
  ): Promise<IBorrowApprovalLog[]> {
    return Api.get<IBorrowApprovalLog[]>(`/approval/borrow/${borrowId}/logs`);
  }

  static async approvePo(
    poId: number,
    data: { Action: 'APPROVE' | 'REJECT'; Remark?: string; SimulateAs?: string }
  ) {
    return Api.post(`/approval/po/${poId}/approve`, data);
  }

  static async approveBorrow(
    borrowId: number,
    data: {
      Action: 'APPROVE' | 'REJECT' | 'REWORK';
      Remark?: string;
      SimulateAs?: string;
    }
  ) {
    return Api.post(`/approval/borrow/${borrowId}/approve`, data);
  }
}
