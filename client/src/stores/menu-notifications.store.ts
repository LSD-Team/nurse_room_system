import { defineStore } from 'pinia';
import { ref } from 'vue';
import { MenuNotificationsService } from '@/services/menu-notifications.service';

export const useMenuNotificationsStore = defineStore('menuNotifications', () => {
  // ─── State ───
  const poDraftCount = ref(0);
  const grDraftCount = ref(0);
  const poPendingCount = ref(0);
  const borrowPendingCount = ref(0);
  const approvalPendingCount = ref(0);

  // ─── Methods ───
  async function loadAllCounts() {
    try {
      const counts = await MenuNotificationsService.getAllCounts();
      poDraftCount.value = counts.poDraftCount;
      grDraftCount.value = counts.grDraftCount;
      poPendingCount.value = counts.poPendingCount;
      borrowPendingCount.value = counts.borrowPendingCount;
      approvalPendingCount.value = counts.approvalPendingCount;
      console.log('[MenuNotifications Store] All counts loaded:', counts);
    } catch (error) {
      console.error('[MenuNotifications Store] Error loading counts:', error);
    }
  }

  // ─── Refresh specific counters (for performance) ───
  async function refreshPoDraftCount() {
    poDraftCount.value = await MenuNotificationsService.getPoDraftCount();
  }

  async function refreshGrDraftCount() {
    grDraftCount.value = await MenuNotificationsService.getGrDraftCount();
  }

  async function refreshPoPendingCount() {
    poPendingCount.value = await MenuNotificationsService.getPoPendingCount();
  }

  async function refreshBorrowPendingCount() {
    borrowPendingCount.value = await MenuNotificationsService.getBorrowPendingCount();
  }

  async function refreshApprovalPendingCount() {
    approvalPendingCount.value = await MenuNotificationsService.getApprovalPendingCount();
  }

  // ─── Refresh all counts ───
  async function refreshAll() {
    await loadAllCounts();
  }

  return {
    // State
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
