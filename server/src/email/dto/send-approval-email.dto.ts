export enum ENotifyType {
  APPROVAL_PO = 'APPROVAL_PO',
  APPROVAL_BORROW = 'APPROVAL_BORROW',
  PO_REWORK = 'PO_REWORK',
  BORROW_REWORK = 'BORROW_REWORK',
  PO_COMPLETED = 'PO_COMPLETED',
  BORROW_COMPLETED = 'BORROW_COMPLETED',
}

export interface ISendApprovalEmailPayload {
  notifyType: ENotifyType;
  documentId: number;
  documentNo: string;
  documentType: 'PO' | 'BORROW';
  toEmployeeIds: string[];
  ccEmployeeIds?: string[];
  documentTitle?: string;
  documentDescription?: string;
  createdByEmployeeId?: string;
  approvedByEmployeeId?: string;
  approvedByName?: string;
  rejectedByEmployeeId?: string;
  rejectedByName?: string;
  additionalMessage?: string;
}
