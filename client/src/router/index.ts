import AppLayout from '@/layout/AppLayout.vue';
import { type RouteRecordRaw, createRouter, createWebHashHistory } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: AppLayout,
    children: [
      { path: '', name: 'dashboard', component: () => import('@/views/Dashboard.vue') },

      // ===== การรักษาพยาบาล =====
      { path: 'treatment-record', name: 'treatmentRecord', component: () => import('@/views/pages/Empty.vue') },
      { path: 'treatment-history', name: 'treatmentHistory', component: () => import('@/views/pages/Empty.vue') },
      { path: 'general-treatment-history', name: 'generalTreatmentHistory', component: () => import('@/views/pages/Empty.vue') },
      { path: 'refer-history', name: 'referHistory', component: () => import('@/views/pages/Empty.vue') },
      { path: 'occupational-disease-history', name: 'occupationalDiseaseHistory', component: () => import('@/views/pages/Empty.vue') },
      { path: 'chronic-disease-history', name: 'chronicDiseaseHistory', component: () => import('@/views/pages/Empty.vue') },
      { path: 'hospital-treatment-history', name: 'hospitalTreatmentHistory', component: () => import('@/views/pages/Empty.vue') },
      { path: 'work-accident-history', name: 'workAccidentHistory', component: () => import('@/views/pages/Empty.vue') },
      { path: 'health-check-new', name: 'healthCheckNew', component: () => import('@/views/pages/Empty.vue') },
      { path: 'health-check-annual', name: 'healthCheckAnnual', component: () => import('@/views/pages/Empty.vue') },
      { path: 'health-check-transfer', name: 'healthCheckTransfer', component: () => import('@/views/pages/Empty.vue') },
      { path: 'cervical-cancer-screening', name: 'cervicalCancerScreening', component: () => import('@/views/pages/Empty.vue') },
      { path: 'employee-external-people', name: 'employeeExternalPeople', component: () => import('@/views/pages/Empty.vue') },

      // ===== ข้อมูลพยาบาลและคลังยา =====
      { path: 'nurses-list', name: 'nursesList', component: () => import('@/views/pages/Empty.vue') },
      { path: 'nurse-teams', name: 'nurseTeams', component: () => import('@/views/pages/Empty.vue') },
      { path: 'nurse-contracts', name: 'nurseContracts', component: () => import('@/views/pages/Empty.vue') },
      { path: 'medicine-items', name: 'medicineItems', component: () => import('@/views/pages/Empty.vue') },
      { path: 'units', name: 'units', component: () => import('@/views/pages/Empty.vue') },
      { path: 'medicine-prices', name: 'medicinePrices', component: () => import('@/views/pages/Empty.vue') },
      { path: 'purchase-orders', name: 'purchaseOrders', component: () => import('@/views/pages/Empty.vue') },
      { path: 'goods-receipt', name: 'goodsReceipt', component: () => import('@/views/pages/Empty.vue') },
      { path: 'borrow-medicines', name: 'borrowMedicines', component: () => import('@/views/pages/Empty.vue') },
      { path: 'stock-status', name: 'stockStatus', component: () => import('@/views/pages/Empty.vue') },
      { path: 'movement-records', name: 'movementRecords', component: () => import('@/views/pages/Empty.vue') },
      { path: 'stock-adjustment', name: 'stockAdjustment', component: () => import('@/views/pages/Empty.vue') },

      // ===== ข้อมูลหลัก (Master Data) =====
      { path: 'suppliers', name: 'suppliers', component: () => import('@/views/pages/Empty.vue') },
      { path: 'treatment-types', name: 'treatmentTypes', component: () => import('@/views/pages/Empty.vue') },
      { path: 'refer-types', name: 'referTypes', component: () => import('@/views/pages/Empty.vue') },
      { path: 'disease-master-data', name: 'diseaseMasterData', component: () => import('@/views/pages/Empty.vue') },
      { path: 'medical-facilities', name: 'medicalFacilities', component: () => import('@/views/pages/Empty.vue') },

      // ===== สุขภาพประจำปี =====
      { path: 'annual-health-data', name: 'annualHealthData', component: () => import('@/views/pages/Empty.vue') },
      { path: 'import-excel-health', name: 'importExcelHealth', component: () => import('@/views/pages/Empty.vue') },

      // ===== ข้อมูลพนักงาน =====
      { path: 'employee-holiday-update', name: 'employeeHolidayUpdate', component: () => import('@/views/pages/Empty.vue') },
      { path: 'social-security-update', name: 'socialSecurityUpdate', component: () => import('@/views/pages/Empty.vue') },
      { path: 'cervical-cancer-update', name: 'cervicalCancerUpdate', component: () => import('@/views/pages/Empty.vue') },

      // ===== การเบิกยากรณีพิเศษ =====
      { path: 'special-medicine-request', name: 'specialMedicineRequest', component: () => import('@/views/pages/Empty.vue') },

      // ===== รายงาน =====
      { path: 'report-treatment', name: 'reportTreatment', component: () => import('@/views/pages/Empty.vue') },
      { path: 'report-refer', name: 'reportRefer', component: () => import('@/views/pages/Empty.vue') },
      { path: 'report-accident', name: 'reportAccident', component: () => import('@/views/pages/Empty.vue') },
      { path: 'report-occupational-disease', name: 'reportOccupationalDisease', component: () => import('@/views/pages/Empty.vue') },
      { path: 'report-hospital-treatment', name: 'reportHospitalTreatment', component: () => import('@/views/pages/Empty.vue') },
      { path: 'report-chronic-disease', name: 'reportChronicDisease', component: () => import('@/views/pages/Empty.vue') },
      { path: 'report-health-check-new', name: 'reportHealthCheckNew', component: () => import('@/views/pages/Empty.vue') },
      { path: 'report-health-check-annual', name: 'reportHealthCheckAnnual', component: () => import('@/views/pages/Empty.vue') },
      { path: 'report-health-check-transfer', name: 'reportHealthCheckTransfer', component: () => import('@/views/pages/Empty.vue') },
      { path: 'report-cervical-cancer', name: 'reportCervicalCancer', component: () => import('@/views/pages/Empty.vue') },
      { path: 'report-nurses', name: 'reportNurses', component: () => import('@/views/pages/Empty.vue') },
      { path: 'report-purchase', name: 'reportPurchase', component: () => import('@/views/pages/Empty.vue') },
      { path: 'report-borrow', name: 'reportBorrow', component: () => import('@/views/pages/Empty.vue') },
      { path: 'report-stock-monthly', name: 'reportStockMonthly', component: () => import('@/views/pages/Empty.vue') },
      { path: 'report-usage-daily', name: 'reportUsageDaily', component: () => import('@/views/pages/Empty.vue') },
      { path: 'report-treatment-by-disease', name: 'reportTreatmentByDisease', component: () => import('@/views/pages/Empty.vue') },
      { path: 'report-social-security', name: 'reportSocialSecurity', component: () => import('@/views/pages/Empty.vue') },
      { path: 'report-health-check-ops4', name: 'reportHealthCheckOps4', component: () => import('@/views/pages/Empty.vue') },
      { path: 'report-special-medicine', name: 'reportSpecialMedicine', component: () => import('@/views/pages/Empty.vue') },

      // ===== การอนุมัติ =====
      { path: 'approve-purchase', name: 'approvePurchase', component: () => import('@/views/pages/Empty.vue') },
    ],
  },
  {
    path: '/pages/notfound',
    name: 'notfound',
    component: () => import('@/views/pages/NotFound.vue'),
  },
  {
    path: '/auth/login',
    name: 'login',
    component: () => import('@/views/pages/auth/Login.vue'),
  },
  {
    path: '/auth/access',
    name: 'accessDenied',
    component: () => import('@/views/pages/auth/Access.vue'),
  },
  {
    path: '/auth/error',
    name: 'error',
    component: () => import('@/views/pages/auth/Error.vue'),
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/pages/notfound',
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

export default router;
