import { defineStore } from 'pinia';
import { ref } from 'vue';
import { MenuNotificationsService } from '@/services/menu-notifications.service';

export const useMenuNotificationsStore = defineStore('menuNotifications', () => {
  // ─── State - New names (for clarity) ───
  const po = ref(0); // สั่งซื้อ
  const rec = ref(0); // รับเข้า
  const borrow = ref(0); // ยืม
  const apv = ref(0); // อนุมัติการสั่งซื้อยา
  const all = ref(0); // จัดซื้อ & ยืม ยา/เวชภัณฑ์
  const stockCountApv = ref(0); // อนุมัติการนับ Stock

  // ─── State - Backward compatibility ───
  const poDraftCount = ref(0);
  const grDraftCount = ref(0);
  const poPendingCount = ref(0);
  const borrowPendingCount = ref(0);
  const approvalPendingCount = ref(0);

  // ─── Methods ───
  async function loadAllCounts() {
    try {
      const counts = await MenuNotificationsService.getAllCounts();
      po.value = counts.po;
      rec.value = counts.rec;
      borrow.value = counts.borrow;
      apv.value = counts.apv;
      all.value = counts.all;
      stockCountApv.value = counts.stock_count_apv;

      // Map to old state for backward compatibility
      poDraftCount.value = counts.po;
      grDraftCount.value = counts.rec;
      borrowPendingCount.value = counts.borrow;
      approvalPendingCount.value = counts.apv;

      console.log('[MenuNotifications Store] All counts loaded:', counts);
    } catch (error) {
      console.error('[MenuNotifications Store] Error loading counts:', error);
    }
  }

  // ─── Refresh specific counters (for performance) ───
  async function refreshPoDraftCount() {
    poDraftCount.value = await MenuNotificationsService.getPoDraftCount();
    po.value = poDraftCount.value;
  }

  async function refreshGrDraftCount() {
    grDraftCount.value = await MenuNotificationsService.getGrDraftCount();
    rec.value = grDraftCount.value;
  }

  async function refreshPoPendingCount() {
    poPendingCount.value = await MenuNotificationsService.getPoPendingCount();
  }

  async function refreshBorrowPendingCount() {
    borrowPendingCount.value = await MenuNotificationsService.getBorrowPendingCount();
    borrow.value = borrowPendingCount.value;
  }

  async function refreshApprovalPendingCount() {
    approvalPendingCount.value = await MenuNotificationsService.getApprovalPendingCount();
    apv.value = approvalPendingCount.value;
  }

  // ─── Refresh all counts ───
  async function refreshAll() {
    await loadAllCounts();
  }

  return {
    // State - New names (for clarity)
    po,
    rec,
    borrow,
    apv,
    all,
    stockCountApv,

    // State - Backward compatibility
    poDraftCount,
    grDraftCount,
    poPendingCount,
    borrowPendingCount,
    approvalPendingCount,

    // Methods
    loadAllCounts,
    refreshPoDraftCount,
    refreshGrDraftCount,
    refreshPoPendingCount,
    refreshBorrowPendingCount,
    refreshApprovalPendingCount,
    refreshAll,
  };
});

