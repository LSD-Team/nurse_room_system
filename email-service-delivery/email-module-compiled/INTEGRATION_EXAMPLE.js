"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailIntegrationQueries = void 0;
exports.EmailIntegrationQueries = {
    getFirstApproverByRoleCode: (roleCode) => `
    SELECT TOP 1 ar.approver_id, ve.email, ve.eng_name
    FROM approval_roles ar
    JOIN view_email ve ON ar.approver_id = ve.employee_id
    WHERE ar.role_code = '${roleCode}'
    AND ar.is_active = 1
  `,
    getPoCreatorInfo: (poId) => `
    SELECT ph.po_no, ph.created_by, ve.email, ve.eng_name
    FROM po_headers ph
    LEFT JOIN view_email ve ON ph.created_by = ve.employee_id
    WHERE ph.po_id = ${poId}
  `,
    getBorrowCreatorInfo: (borrowId) => `
    SELECT bh.borrow_no, bh.created_by, ve.email, ve.eng_name
    FROM borrow_headers bh
    LEFT JOIN view_email ve ON bh.created_by = ve.employee_id
    WHERE bh.borrow_id = ${borrowId}
  `,
    getPendingApprovals: (poId) => `
    SELECT COUNT(*) as count
    FROM po_approvals
    WHERE po_id = ${poId}
    AND status = 'PENDING'
  `,
    getEmployeeInfo: (employeeId) => `
    SELECT ve.employee_id, ve.email, ve.eng_name
    FROM view_email ve
    WHERE ve.employee_id = ${employeeId}
  `,
};
//# sourceMappingURL=INTEGRATION_EXAMPLE.js.map