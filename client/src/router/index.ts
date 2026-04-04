import AppLayout from '@/layout/AppLayout.vue';
import { type RouteRecordRaw, createRouter, createWebHashHistory } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'landing',
    component: () => import('@/views/LandingPage.vue'),
  },
  {
    path: '/dashboard',
    component: AppLayout,
    // TODO: เพิ่ม beforeEnter middleware สำหรับตรวจสอบ authentication & authorization
    children: [
      {
        path: '',
        name: 'dashboard',
        // TODO: เปลี่ยนเป็น NurseRoomDashboard.vue เมื่อสร้างเสร็จ
        component: () => import('@/views/Dashboard.vue'),
      },
      // ===== เมนูระบบหลัก =====
      // Dashboard ขึ้นมาแล้ว

      // ===== จ่ายการจัดการห้องพยาบาล =====
      {
        path: 'nurse-rooms',
        name: 'nurseRooms',
        // TODO: สร้าง NurseRoomsList.vue component
        component: () => import('@/views/pages/Empty.vue'),
      },
      {
        path: 'room-status',
        name: 'roomStatus',
        // TODO: สร้าง RoomStatusManagement.vue component
        component: () => import('@/views/pages/Empty.vue'),
      },
      {
        path: 'room-inspection',
        name: 'roomInspection',
        // TODO: สร้าง RoomInspection.vue component
        component: () => import('@/views/pages/Empty.vue'),
      },

      // ===== การจัดการพยาบาล =====
      {
        path: 'nurses',
        name: 'nurses',
        // TODO: สร้าง NursesList.vue component
        component: () => import('@/views/pages/Empty.vue'),
      },
      {
        path: 'nurse-schedule',
        name: 'nurseSchedule',
        // TODO: สร้าง NurseSchedule.vue component
        component: () => import('@/views/pages/Empty.vue'),
      },
      {
        path: 'nurse-history',
        name: 'nurseHistory',
        // TODO: สร้าง NurseHistory.vue component
        component: () => import('@/views/pages/Empty.vue'),
      },

      // ===== การจัดการผู้ป่วย =====
      {
        path: 'patient-registration',
        name: 'patientRegistration',
        // TODO: สร้าง PatientRegistration.vue component
        component: () => import('@/views/pages/Empty.vue'),
      },
      {
        path: 'patients',
        name: 'patients',
        // TODO: สร้าง PatientsList.vue component
        component: () => import('@/views/pages/Empty.vue'),
      },
      {
        path: 'patient-room-allocation',
        name: 'patientRoomAllocation',
        // TODO: สร้าง PatientRoomAllocation.vue component
        component: () => import('@/views/pages/Empty.vue'),
      },
      {
        path: 'patient-treatment-history',
        name: 'patientTreatmentHistory',
        // TODO: สร้าง PatientTreatmentHistory.vue component
        component: () => import('@/views/pages/Empty.vue'),
      },

      // ===== การจัดการอุปกรณ์ =====
      {
        path: 'items',
        name: 'items',
        // TODO: สร้าง ItemsList.vue component
        component: () => import('@/views/pages/Empty.vue'),
      },
      {
        path: 'inventory',
        name: 'inventory',
        // TODO: สร้าง InventoryManagement.vue component
        component: () => import('@/views/pages/Empty.vue'),
      },
      {
        path: 'equipment-borrow',
        name: 'equipmentBorrow',
        // TODO: สร้าง EquipmentBorrow.vue component
        component: () => import('@/views/pages/Empty.vue'),
      },
      {
        path: 'equipment-return',
        name: 'equipmentReturn',
        // TODO: สร้าง EquipmentReturn.vue component
        component: () => import('@/views/pages/Empty.vue'),
      },

      // ===== การจัดการซื้อ-ขาย =====
      {
        path: 'purchase-orders',
        name: 'purchaseOrders',
        // TODO: สร้าง PurchaseOrdersList.vue component
        component: () => import('@/views/pages/Empty.vue'),
      },
      {
        path: 'goods-receipt',
        name: 'goodsReceipt',
        // TODO: สร้าง GoodsReceipt.vue component
        component: () => import('@/views/pages/Empty.vue'),
      },
      {
        path: 'approvals',
        name: 'approvals',
        // TODO: สร้าง ApprovalsList.vue component และเพิ่ม authorization
        component: () => import('@/views/pages/Empty.vue'),
      },

      // ===== การจัดการโรค =====
      {
        path: 'disease-groups',
        name: 'diseaseGroups',
        // TODO: สร้าง DiseaseGroups.vue component
        component: () => import('@/views/pages/Empty.vue'),
      },
      {
        path: 'disease-sub-groups',
        name: 'diseaseSubGroups',
        // TODO: สร้าง DiseaseSubGroups.vue component
        component: () => import('@/views/pages/Empty.vue'),
      },
      {
        path: 'accident-severity',
        name: 'accidentSeverity',
        // TODO: สร้าง AccidentSeverity.vue component
        component: () => import('@/views/pages/Empty.vue'),
      },

      // ===== รายงานและวิเคราะห์ =====
      {
        path: 'reports/room-usage',
        name: 'reportRoomUsage',
        // TODO: สร้าง ReportRoomUsage.vue component
        component: () => import('@/views/pages/Empty.vue'),
      },
      {
        path: 'reports/inventory',
        name: 'reportInventory',
        // TODO: สร้าง ReportInventory.vue component
        component: () => import('@/views/pages/Empty.vue'),
      },
      {
        path: 'reports/budget',
        name: 'reportBudget',
        // TODO: สร้าง ReportBudget.vue component
        component: () => import('@/views/pages/Empty.vue'),
      },
      {
        path: 'analytics/performance',
        name: 'analyticsPerformance',
        // TODO: สร้าง AnalyticsPerformance.vue component
        component: () => import('@/views/pages/Empty.vue'),
      },

      // ===== ตั้งค่าระบบ =====
      {
        path: 'settings/hospital-info',
        name: 'settingsHospitalInfo',
        // TODO: สร้าง HospitalInfo.vue component และเพิ่ม authorization (Admin only)
        component: () => import('@/views/pages/Empty.vue'),
      },
      {
        path: 'settings/users',
        name: 'settingsUsers',
        // TODO: สร้าง UserManagement.vue component และเพิ่ม authorization (Admin only)
        component: () => import('@/views/pages/Empty.vue'),
      },
      {
        path: 'settings/roles-permissions',
        name: 'settingsRolesPermissions',
        // TODO: สร้าง RolesPermissions.vue component และเพิ่ม authorization (Admin only)
        component: () => import('@/views/pages/Empty.vue'),
      },
      {
        path: 'settings/general',
        name: 'settingsGeneral',
        // TODO: สร้าง GeneralSettings.vue component และเพิ่ม authorization (Admin only)
        component: () => import('@/views/pages/Empty.vue'),
      },

      // ===== ช่วยเหลือและสนับสนุน =====
      {
        path: 'help/guide',
        name: 'helpGuide',
        // TODO: สร้าง UserGuide.vue component
        component: () => import('@/views/pages/Empty.vue'),
      },
      {
        path: 'help/support',
        name: 'helpSupport',
        // TODO: สร้าง Support.vue component
        component: () => import('@/views/pages/Empty.vue'),
      },
      {
        path: 'help/about',
        name: 'helpAbout',
        // TODO: สร้าง AboutSystem.vue component
        component: () => import('@/views/pages/Empty.vue'),
      },
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
