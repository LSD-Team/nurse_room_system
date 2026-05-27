<script lang="ts" setup>
  // v3: Added printBorrow function and Print button
  import { ref, onMounted, computed } from 'vue';
  import { FilterMatchMode } from '@primevue/core/api';
  import { BorrowService } from '@/services/borrow.service';
  import { ApprovalService } from '@/services/approval.service';
  import { StockService, type IStockOnHand } from '@/services/stock.service';
  import { useMenuNotificationsStore } from '@/stores/menu-notifications.store';
  import { formatSysdatetimeoffset } from '@/utils/format.utils';
  import type {
    IBorrowHeader,
    IBorrowLine,
    ISupplier,
    ISupplierItemPrice,
    IBorrowLineForm,
  } from '@/interfaces/borrow.interfaces';
  import type {
    IBorrowApprovalLog,
    IApprovalHistory,
  } from '@/interfaces/approval.interfaces';
  import {
    formatDate,
    formatNumber,
    formatCurrency,
  } from '@/utils/format.utils';
  import Swal from 'sweetalert2';

  const borrowHeaders = ref<IBorrowHeader[]>([]);
  const suppliers = ref<ISupplier[]>([]);
  const supplierPrices = ref<ISupplierItemPrice[]>([]);
  const stockOnHands = ref<IStockOnHand[]>([]);
  const loading = ref(false);
  const errorMsg = ref('');

  const showFormDialog = ref(false);
  const showDetailDialog = ref(false);
  const isEditing = ref(false);
  const editingBorrowId = ref<number | null>(null);

  const selectedSupplierId = ref<number | null>(null);
  const formNote = ref('');
  const formLines = ref<IBorrowLineForm[]>([]);
  const selectedItemId = ref<number | null>(null);
  const selectedQty = ref<number>(1);

  const detailBorrow = ref<IBorrowHeader | null>(null);
  const detailLines = ref<IBorrowLine[]>([]);
  const detailLogs = ref<IBorrowApprovalLog[]>([]);
  const detailApprovals = ref<IApprovalHistory[]>([]);
  const detailLoading = ref(false);
  const showDetailTimeline = ref(false);

  const showReceiveDialog = ref(false);
  const receiveConfirmBorrow = ref<IBorrowHeader | null>(null);
  const receiveConfirmLines = ref<IBorrowLine[]>([]);

  const selectedStatusFilter = ref<string>('DRAFT');

  const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    borrow_no: { value: null, matchMode: FilterMatchMode.CONTAINS },
    borrow_status: { value: null, matchMode: FilterMatchMode.CONTAINS },
    supplier_name: { value: null, matchMode: FilterMatchMode.CONTAINS },
  });

  onMounted(async () => {
    await loadBorrowHeaders();
    await loadStockOnHands();
  });

  function getErrorMessage(err: unknown): string {
    if (err instanceof Error) {
      return err.message;
    }
    if (typeof err === 'object' && err !== null && 'response' in err) {
      const apiError = err as { response?: { data?: { message?: string } } };
      return apiError.response?.data?.message || String(err);
    }
    return String(err);
  }

  async function loadBorrowHeaders(): Promise<void> {
    loading.value = true;
    errorMsg.value = '';
    try {
      borrowHeaders.value = await BorrowService.getBorrowHeaders();
    } catch (err: unknown) {
      errorMsg.value = getErrorMessage(err);
    } finally {
      loading.value = false;
    }
  }

  async function loadStockOnHands(): Promise<void> {
    try {
      const data = await StockService.getStockStatus();
      stockOnHands.value = data;
      console.log('Stock on hands loaded:', stockOnHands.value.length, 'items');
    } catch (err: unknown) {
      const error = err instanceof Error ? err.message : String(err);
      console.error('Error loading stock on hands:', error);
    }
  }

  const numberedHeaders = computed(() =>
    borrowHeaders.value.map((item, index) => ({ ...item, rowNo: index + 1 }))
  );

  const filteredHeaders = computed(() => {
    if (!selectedStatusFilter.value) return numberedHeaders.value;
    return numberedHeaders.value.filter(
      item => item.borrow_status === selectedStatusFilter.value
    );
  });

  const statusFilterOptions = [
    { label: 'All', value: '' },
    { label: 'DRAFT', value: 'DRAFT' },
    { label: 'PENDING_APPROVAL', value: 'PENDING_APPROVAL' },
    { label: 'APPROVED', value: 'APPROVED' },
    { label: 'RECEIVED', value: 'RECEIVED' },
    { label: 'SETTLED', value: 'SETTLED' },
    { label: 'CANCELLED', value: 'CANCELLED' },
  ];

  const availableItems = computed(() => {
    const usedItemIds = formLines.value.map(l => l.item_id);
    return supplierPrices.value.filter(p => !usedItemIds.includes(p.item_id));
  });

  const formTotalAmount = computed(() =>
    formLines.value.reduce((sum, l) => sum + (l.total_price || 0), 0)
  );

  const selectedItemInfo = computed(() => {
    if (!selectedItemId.value) return null;
    return (
      supplierPrices.value.find(p => p.item_id === selectedItemId.value) || null
    );
  });

  const selectedItemOnHand = computed(() => {
    if (!selectedItemId.value) return null;
    return (
      stockOnHands.value.find(s => s.item_id === selectedItemId.value) || null
    );
  });

  const countDraft = computed(
    () =>
      numberedHeaders.value.filter(item => item.borrow_status === 'DRAFT')
        .length
  );

  const countPendingApproval = computed(
    () =>
      numberedHeaders.value.filter(
        item => item.borrow_status === 'PENDING_APPROVAL'
      ).length
  );

  const countApproved = computed(
    () =>
      numberedHeaders.value.filter(item => item.borrow_status === 'APPROVED')
        .length
  );

  const uniqueDetailLogs = computed(() => {
    // Remove duplicate logs by keeping only the last occurrence of each (level, role, action, actor)
    const seen = new Map<string, IBorrowApprovalLog>();
    for (const log of detailLogs.value) {
      const key = `${log.approval_level}|${log.approval_role}|${log.action}|${log.actioned_by}`;
      seen.set(key, log);
    }
    return Array.from(seen.values()).sort(
      (a, b) =>
        new Date(a.actioned_at).getTime() - new Date(b.actioned_at).getTime()
    );
  });

  function printBorrow(): void {
    if (!detailBorrow.value || !detailLines.value) return;

    const printWindow = window.open('', '', 'width=900,height=1200');
    if (!printWindow) return;

    const tableRows = detailLines.value
      .map(
        (line, idx) => `
        <tr>
          <td style="text-align: center; padding: 8px; border: 1px solid #999;">${idx + 1}</td>
          <td style="padding: 8px; border: 1px solid #999;">${line.item_code}</td>
          <td style="padding: 8px; border: 1px solid #999;">
            <div><strong>${line.item_name_th}</strong></div>
            <div style="font-size: 12px; color: #666;">${line.item_name_en}</div>
          </td>
          <td style="text-align: right; padding: 8px; border: 1px solid #999;">${line.qty_borrow}</td>
          <td style="text-align: center; padding: 8px; border: 1px solid #999;">${line.purchase_unit_name_th}</td>
          <td style="text-align: right; padding: 8px; border: 1px solid #999;">฿${formatNumber(line.unit_price)}</td>
          <td style="text-align: right; padding: 8px; border: 1px solid #999;">฿${formatNumber(line.total_price)}</td>
        </tr>
      `
      )
      .join('');

    const grandTotal = detailLines.value.reduce(
      (sum, line) => sum + (line.total_price || 0),
      0
    );

    // Get creator name and today's date
    const creatorName = detailBorrow.value.created_by_eng_name || '-';
    const today = new Date();
    const todayDate = today.toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'Asia/Bangkok',
    });

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>ใบสั่งซื้อยา - ${detailBorrow.value.borrow_no}</title>
        <style>
          * { margin: 0; padding: 0; }
          body { font-family: 'Trebuchet MS', Arial, sans-serif; padding: 30px; line-height: 1.4; }
          .container { max-width: 900px; margin: 0 auto; }
          .header { text-align: center; margin-bottom: 25px; }
          .header h1 { font-size: 22px; margin-bottom: 5px; font-weight: bold; }
          .header p { font-size: 13px; color: #666; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; font-size: 13px; }
          .info-item { }
          .info-label { font-weight: bold; color: #333; display: inline-block; width: 120px; }
          .info-value { display: inline; }
          .section-title { font-weight: bold; font-size: 14px; margin-top: 15px; margin-bottom: 10px; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 20px; }
          th { background-color: #e8e8e8; padding: 10px; border: 1px solid #999; text-align: left; font-weight: bold; }
          td { padding: 8px; border: 1px solid #999; }
          .total-row { font-weight: bold; background-color: #f5f5f5; }
          .total-row td { text-align: right; }
          .signature-section { display: grid; grid-template-columns: 1fr 1fr; gap: 50px; margin-top: 50px; }
          .signature-box { text-align: center; font-size: 12px; }
          .signature-line { border-top: 1px solid #000; margin-top: 50px; padding-top: 10px; }
          @media print {
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>ใบสั่งซื้อยา</h1>
            <p>Pharmaceutical Purchase Order</p>
          </div>

          <div class="info-grid">
            <div class="info-item">
              <div><span class="info-label">Document No.:</span><span class="info-value">${detailBorrow.value.borrow_no}</span></div>
              <div><span class="info-label">Supplier:</span><span class="info-value">${detailBorrow.value.supplier_name}</span></div>
              <div style="margin-top: 8px;"><span class="info-label">ผู้จำหน่ายยา:</span></div>
            </div>
            <div class="info-item">
              <div><span class="info-label">Date/วันที่:</span><span class="info-value">${formatDate(detailBorrow.value.borrow_date)}</span></div>
              <div><span class="info-label">Created by:</span><span class="info-value">${detailBorrow.value.created_by_eng_name || '-'}</span></div>
            </div>
          </div>

          <div class="section-title">รายละเอียดสินค้า / Item Details:</div>
          <table>
            <thead>
              <tr>
                <th style="width: 5%">#</th>
                <th style="width: 8%">Code</th>
                <th style="width: 35%">Name / ชื่อยา</th>
                <th style="width: 8%">Qty</th>
                <th style="width: 10%">Unit</th>
                <th style="width: 12%">Price/Unit</th>
                <th style="width: 12%">Total</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
              <tr class="total-row">
                <td colspan="6">Grand Total / รวมทั้งสิ้น</td>
                <td>฿${formatNumber(grandTotal)}</td>
              </tr>
            </tbody>
          </table>

          <div class="signature-section">
            <div class="signature-box">
              <div>ผู้สั่งซื้อ / Requestor</div>
              <div style="font-size: 11px; color: #999;">Staff Signature</div>
              <div class="signature-line"></div>
              <div style="font-size: 11px;">${creatorName}</div>
              <div style="font-size: 11px;">${todayDate}</div>
            </div>
            <div class="signature-box">
              <div>ผู้จำหน่ายยา / Pharmacy</div>
              <div style="font-size: 11px; color: #999;">Pharmacy Signature</div>
              <div class="signature-line"></div>
              <br>
              <div style="font-size: 11px;">(.......................................................)</div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
  }

  function statusSeverity(status: string): string {
    const map: Record<string, string> = {
      DRAFT: 'secondary',
      PENDING_APPROVAL: 'warn',
      APPROVED_L1: 'info',
      APPROVED_L2: 'info',
      APPROVED: 'success',
      RECEIVED: 'success',
      SETTLED: 'contrast',
      CANCELLED: 'danger',
    };
    return map[status] || 'secondary';
  }

  function statusLabel(status: string): string {
    const map: Record<string, string> = {
      DRAFT: 'DRAFT',
      PENDING_APPROVAL: 'PENDING_APPROVAL',
      APPROVED_L1: 'APPROVED_L1',
      APPROVED_L2: 'APPROVED_L2',
      APPROVED: 'APPROVED',
      RECEIVED: 'RECEIVED',
      SETTLED: 'SETTLED',
      CANCELLED: 'CANCELLED',
    };
    return map[status] || status;
  }

  async function openCreateDialog(): Promise<void> {
    isEditing.value = false;
    editingBorrowId.value = null;
    selectedSupplierId.value = null;
    formNote.value = '';
    formLines.value = [];
    supplierPrices.value = [];
    selectedItemId.value = null;
    selectedQty.value = 1;

    try {
      suppliers.value = await BorrowService.getSuppliers();
    } catch (err: any) {
      errorMsg.value =
        err?.response?.data?.message || err?.message || String(err);
      return;
    }
    showFormDialog.value = true;
  }

  async function openEditDialog(row: IBorrowHeader) {
    isEditing.value = true;
    editingBorrowId.value = row.borrow_id;
    selectedSupplierId.value = row.supplier_id;
    formNote.value = '';
    formLines.value = [];
    selectedItemId.value = null;
    selectedQty.value = 1;

    try {
      suppliers.value = await BorrowService.getSuppliers();
      await onSupplierChange();
      const lines = await BorrowService.getBorrowLines(row.borrow_id);
      formNote.value = lines.length > 0 ? lines[0].note || '' : '';
      formLines.value = lines.map(l => ({
        item_id: l.item_id,
        qty: l.qty_borrow,
        item_code: l.item_code,
        item_name_th: l.item_name_th,
        item_name_en: l.item_name_en,
        unit_name_th: l.purchase_unit_name_th,
        unit_price: l.unit_price,
        total_price: l.total_price,
      }));
    } catch (err: any) {
      errorMsg.value =
        err?.response?.data?.message || err?.message || String(err);
      return;
    }
    showFormDialog.value = true;
  }

  async function onSupplierChange(): Promise<void> {
    if (!selectedSupplierId.value) {
      supplierPrices.value = [];
      return;
    }
    try {
      supplierPrices.value = await BorrowService.getSupplierPrices(
        selectedSupplierId.value
      );
    } catch (err: unknown) {
      errorMsg.value = getErrorMessage(err);
    }
  }

  function addLine(): void {
    if (!selectedItemId.value) return;
    const price = supplierPrices.value.find(
      p => p.item_id === selectedItemId.value
    );
    if (!price) return;

    formLines.value.push({
      item_id: price.item_id,
      qty: 1,
      item_code: price.item_code,
      item_name_th: price.item_name_th,
      item_name_en: price.item_name_en,
      unit_name_th: price.unit_name_th,
      unit_price: price.unit_price,
      total_price: 1 * price.unit_price,
    });

    selectedItemId.value = null;
    selectedQty.value = 1;
  }

  function updateLineQuantity(index: number, newQty: number): void {
    if (newQty <= 0) return;
    const line = formLines.value[index];
    if (!line) return;
    line.qty = newQty;
    line.total_price = newQty * line.unit_price;
  }

  function removeLine(index: number): void {
    formLines.value.splice(index, 1);
  }

  async function saveBorrow() {
    if (!selectedSupplierId.value || formLines.value.length === 0) {
      await Swal.fire(
        'Warning',
        'Please select a Supplier and add at least one item',
        'warning'
      );
      return;
    }

    const jsonLines = JSON.stringify(
      formLines.value.map(l => ({ item_id: l.item_id, qty: l.qty }))
    );

    try {
      if (isEditing.value && editingBorrowId.value) {
        await BorrowService.updateBorrow(editingBorrowId.value, {
          JsonLines: jsonLines,
          Note: formNote.value || undefined,
        });
        showFormDialog.value = false;
        await loadBorrowHeaders();
        await Swal.fire(
          'Success',
          'Borrowing document updated successfully',
          'success'
        );

        // Refresh badge
        const menuNotificationsStore = useMenuNotificationsStore();
        await menuNotificationsStore.refreshBorrowPendingCount();
      } else {
        await BorrowService.createBorrow({
          JsonLines: jsonLines,
          SupplierId: String(selectedSupplierId.value),
          Note: formNote.value || undefined,
        });
        showFormDialog.value = false;
        await loadBorrowHeaders();
        await Swal.fire(
          'Success',
          'Borrowing document created successfully',
          'success'
        );

        // Refresh badge
        const menuNotificationsStore = useMenuNotificationsStore();
        await menuNotificationsStore.refreshBorrowPendingCount();
      }
    } catch (err: any) {
      // Error handled by axios interceptor
    }
  }

  function logActionIcon(action: string): string {
    const map: Record<string, string> = {
      SUBMIT: 'pi pi-send',
      APPROVE: 'pi pi-check',
      REJECT: 'pi pi-times',
      REWORK: 'pi pi-replay',
    };
    return map[action] || 'pi pi-circle';
  }

  function logActionColor(action: string): string {
    const map: Record<string, string> = {
      SUBMIT: '#3B82F6',
      APPROVE: '#22C55E',
      REJECT: '#EF4444',
      REWORK: '#F59E0B',
    };
    return map[action] || '#6B7280';
  }

  function logActionLabel(action: string): string {
    const map: Record<string, string> = {
      SUBMIT: 'Submitted',
      APPROVE: 'Approved',
      REJECT: 'Rejected',
      REWORK: 'Rework Required',
    };
    return map[action] || action;
  }

  function formatRole(role: string): string {
    const map: Record<string, string> = {
      GROUP_LEAD: 'Group Leader',
      MANAGER: 'Manager',
      DEPARTMENT: 'Department Head',
    };
    return map[role] || role;
  }

  function getStepStatusLabel(item: IApprovalHistory, borrowStatus: string): string {
    if (item.status === 'APPROVE') return 'Approved';
    if (item.status === 'REJECT') return 'Rejected';
    if (item.status === 'REWORK') return 'Rework Required';
    if (item.status === 'CANCELLED') return 'Cancelled';

    const currentLevelMap: Record<string, number> = {
      PENDING_APPROVAL: 1,
      APPROVED_L1: 2,
      APPROVED_L2: 3,
    };
    const currentLevel = currentLevelMap[borrowStatus] || 0;

    if (item.approval_level === currentLevel) return 'Waiting for Approval';
    if (item.approval_level > currentLevel) return 'Upcoming Step';

    return 'Pending';
  }

  function getStepSeverity(item: IApprovalHistory, borrowStatus: string): string {
    if (item.status === 'APPROVE') return 'success';
    if (item.status === 'REJECT') return 'danger';
    if (item.status === 'REWORK' || item.status === 'CANCELLED') return 'secondary';

    const currentLevelMap: Record<string, number> = {
      PENDING_APPROVAL: 1,
      APPROVED_L1: 2,
      APPROVED_L2: 3,
    };
    const currentLevel = currentLevelMap[borrowStatus] || 0;

    if (item.approval_level === currentLevel) return 'warn';
    return 'secondary';
  }

  function getStepIcon(item: IApprovalHistory, borrowStatus: string): string {
    if (item.status === 'APPROVE') return 'pi pi-check';
    if (item.status === 'REJECT') return 'pi pi-times';
    if (item.status === 'CANCELLED') return 'pi pi-ban';

    const currentLevelMap: Record<string, number> = {
      PENDING_APPROVAL: 1,
      APPROVED_L1: 2,
      APPROVED_L2: 3,
    };
    const currentLevel = currentLevelMap[borrowStatus] || 0;

    if (item.approval_level === currentLevel) return 'pi pi-clock';
    if (item.approval_level > currentLevel) return 'pi pi-calendar-plus';

    return 'pi pi-circle';
  }

  async function viewDetail(row: IBorrowHeader) {
    detailBorrow.value = row;
    detailLoading.value = true;
    detailLines.value = [];
    detailApprovals.value = [];
    showDetailTimeline.value = false;
    
    // Auto-show timeline for REWORK status
    if (row.approval_status === 'REWORK') {
      showDetailTimeline.value = true;
    }
    
    showDetailDialog.value = true;
    
    try {
      // 1. Load Lines (Crucial)
      const lines = await BorrowService.getBorrowLines(row.borrow_id);
      detailLines.value = lines || [];
      
      // 2. Load Approval History (Secondary, don't crash if fails)
      try {
        const history = await ApprovalService.getBorrowApprovalHistory(row.borrow_id);
        detailApprovals.value = history || [];
      } catch (historyErr) {
        console.warn('Failed to load borrow approval history:', historyErr);
      }
    } catch (err: any) {
      errorMsg.value = getErrorMessage(err);
      console.error('Error loading borrow detail:', err);
    } finally {
      detailLoading.value = false;
    }
  }

  async function submitBorrow(row: IBorrowHeader) {
    const result = await Swal.fire({
      title:
        '\u0E22\u0E37\u0E19\u0E22\u0E31\u0E19\u0E2A\u0E48\u0E07\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34?',
      text: '\u0E43\u0E1A\u0E22\u0E37\u0E21 ' + row.borrow_no,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText:
        '\u0E2A\u0E48\u0E07\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34',
      cancelButtonText: '\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01',
    });
    if (!result.isConfirmed) return;

    try {
      await BorrowService.submitBorrow(row.borrow_id);
      await Swal.fire(
        'Success',
        'Submitted for approval successfully',
        'success'
      );
      await loadBorrowHeaders();

      // Refresh badge
      const menuNotificationsStore = useMenuNotificationsStore();
      await menuNotificationsStore.refreshBorrowPendingCount();
    } catch (err: any) {
      // Error handled by axios interceptor
    }
  }

  async function receiveBorrow(row: IBorrowHeader) {
    receiveConfirmBorrow.value = row;
    receiveConfirmLines.value = [];
    showReceiveDialog.value = true;
    try {
      const lines = await BorrowService.getBorrowLines(row.borrow_id);
      receiveConfirmLines.value = lines;
    } catch (err: any) {
      errorMsg.value =
        err?.response?.data?.message || err?.message || String(err);
    }
  }

  async function confirmReceiveBorrow() {
    if (!receiveConfirmBorrow.value) return;

    try {
      await BorrowService.receiveBorrow(receiveConfirmBorrow.value.borrow_id);
      showReceiveDialog.value = false;
      receiveConfirmBorrow.value = null;
      receiveConfirmLines.value = [];
      await Swal.fire('Success', 'Medicines received successfully', 'success');
      await loadBorrowHeaders();

      // Refresh badge
      const menuNotificationsStore = useMenuNotificationsStore();
      await menuNotificationsStore.refreshBorrowPendingCount();
    } catch (err: any) {
      // Error handled by axios interceptor
    }
  }

  async function cancelBorrow(row: IBorrowHeader) {
    const { value, isConfirmed } = await Swal.fire({
      title: 'Cancel Borrowing ' + row.borrow_no + '?',
      input: 'textarea',
      inputLabel: 'Reason (if any)',
      showCancelButton: true,
      confirmButtonText: 'Cancel Document',
      confirmButtonColor: '#dc3545',
      cancelButtonText: 'Cancel',
    });
    if (!isConfirmed) return;

    try {
      await BorrowService.cancelBorrow(row.borrow_id, {
        Reason: value || undefined,
      });
      await Swal.fire(
        'Success',
        'Borrowing document ' + row.borrow_no + ' cancelled successfully',
        'success'
      );
      await loadBorrowHeaders();
    } catch (err: any) {
      // Error handled by axios interceptor
    }
  }
</script>

<template>
  <div class="card">
    <div class="flex items-center justify-between mb-4">
      <div>
        <h2 class="text-2xl font-bold text-surface-900 dark:text-surface-0">
          {{ 'Borrow Medicines' }}
        </h2>
        <p class="text-surface-500 mt-1">
          {{ 'Details of Borrowed Medicines/Supplies' }}
        </p>
      </div>
      <Button
        :label="'Create Borrow'"
        icon="pi pi-plus"
        @click="openCreateDialog"
      />
    </div>

    <Message v-if="errorMsg" severity="error" class="mb-4">
      <span class="font-semibold">
        {{ 'Error: ' }}
      </span>
      {{ errorMsg }}
    </Message>

    <DataTable
      v-model:filters="filters"
      :value="filteredHeaders"
      :loading="loading"
      dataKey="borrow_id"
      paginator
      :rows="20"
      :rowsPerPageOptions="[10, 20, 50, 100]"
      stateStorage="local"
      stateKey="dt-borrow-headers"
      sortMode="multiple"
      removableSort
      scrollable
      scrollHeight="600px"
      :globalFilterFields="['borrow_no', 'supplier_name', 'borrow_status']"
      class="p-datatable-sm"
    >
      <template #header>
        <div class="flex justify-between items-center gap-2">
          <div class="flex gap-2 flex-wrap">
            <Button
              :label="'All'"
              :variant="selectedStatusFilter === '' ? 'contained' : 'outlined'"
              @click="selectedStatusFilter = ''"
              class="text-sm"
            />
            <Button
              :variant="
                selectedStatusFilter === 'DRAFT' ? 'contained' : 'outlined'
              "
              @click="selectedStatusFilter = 'DRAFT'"
              class="text-sm"
            >
              <template #default>
                <span>DRAFT</span>
                <Badge
                  v-if="countDraft > 0"
                  :value="countDraft"
                  severity="warning"
                  class="ml-2"
                />
              </template>
            </Button>
            <Button
              :variant="
                selectedStatusFilter === 'PENDING_APPROVAL'
                  ? 'contained'
                  : 'outlined'
              "
              @click="selectedStatusFilter = 'PENDING_APPROVAL'"
              class="text-sm"
            >
              <template #default>
                <span>PENDING_APPROVAL</span>
                <Badge
                  v-if="countPendingApproval > 0"
                  :value="countPendingApproval"
                  severity="warning"
                  class="ml-2"
                />
              </template>
            </Button>
            <Button
              :variant="
                selectedStatusFilter === 'APPROVED' ? 'contained' : 'outlined'
              "
              @click="selectedStatusFilter = 'APPROVED'"
              class="text-sm"
            >
              <template #default>
                <span>APPROVED</span>
                <Badge
                  v-if="countApproved > 0"
                  :value="countApproved"
                  severity="success"
                  class="ml-2"
                />
              </template>
            </Button>
            <Button
              label="RECEIVED"
              :variant="
                selectedStatusFilter === 'RECEIVED' ? 'contained' : 'outlined'
              "
              @click="selectedStatusFilter = 'RECEIVED'"
              class="text-sm"
            />
            <Button
              label="SETTLED"
              :variant="
                selectedStatusFilter === 'SETTLED' ? 'contained' : 'outlined'
              "
              @click="selectedStatusFilter = 'SETTLED'"
              class="text-sm"
            />
            <Button
              label="CANCELLED"
              :variant="
                selectedStatusFilter === 'CANCELLED' ? 'contained' : 'outlined'
              "
              @click="selectedStatusFilter = 'CANCELLED'"
              class="text-sm"
            />
          </div>
          <IconField>
            <InputIcon class="pi pi-search" />
            <InputText
              v-model="filters['global'].value"
              :placeholder="'Search...'"
            />
          </IconField>
        </div>
      </template>

      <template #empty>
        {{ 'No data found' }}
      </template>
      <template #loading>
        {{ 'Loading data...' }}
      </template>

      <Column
        field="rowNo"
        header="#"
        sortable
        style="min-width: 60px; max-width: 80px"
        frozen
      />
      <Column
        field="borrow_no"
        :header="'Borrow No.'"
        sortable
        style="min-width: 150px"
        frozen
      >
        <template #body="{ data }">
          <a
            class="text-primary cursor-pointer font-semibold hover:underline"
            @click="viewDetail(data)"
          >
            {{ data.borrow_no }}
          </a>
        </template>
      </Column>
      <Column
        field="borrow_date"
        :header="'Borrow Date'"
        sortable
        style="min-width: 120px"
      >
        <template #body="{ data }">{{ formatDate(data.borrow_date) }}</template>
      </Column>
      <Column
        field="supplier_name"
        header="Supplier"
        sortable
        style="min-width: 200px"
      />
      <Column
        field="borrow_status"
        :header="'Borrow Status'"
        sortable
        style="min-width: 140px"
      >
        <template #body="{ data }">
          <Tag
            :value="statusLabel(data.borrow_status)"
            :severity="statusSeverity(data.borrow_status)"
          />
        </template>
      </Column>
      <Column
        field="approval_role"
        :header="'Approval Role'"
        style="min-width: 130px"
      >
        <template #body="{ data }">
          {{ data.approval_role || '-' }}
        </template>
      </Column>
      <Column
        field="approval_status"
        :header="'Approval Status'"
        style="min-width: 130px"
      >
        <template #body="{ data }">
          {{ data.approval_status || '-' }}
        </template>
      </Column>
      <Column
        field="created_by_eng_name"
        :header="'Created By'"
        style="min-width: 130px"
      >
        <template #body="{ data }">
          {{ data.created_by_eng_name || '-' }}
        </template>
      </Column>
      <Column
        :header="'Actions'"
        style="min-width: 200px"
        frozen
        alignFrozen="right"
      >
        <template #body="{ data }">
          <div class="flex gap-1 flex-wrap">
            <template v-if="data.borrow_status === 'DRAFT'">
              <Button
                :label="'Edit'"
                icon="pi pi-pencil"
                severity="info"
                size="small"
                text
                @click="openEditDialog(data)"
              />
              <Button
                :label="'Submit for Approval'"
                icon="pi pi-send"
                severity="success"
                size="small"
                text
                @click="submitBorrow(data)"
              />
              <Button
                :label="'Cancel'"
                icon="pi pi-times"
                severity="danger"
                size="small"
                text
                @click="cancelBorrow(data)"
              />
            </template>
            <template v-else-if="data.borrow_status === 'APPROVED'">
              <Button
                :label="'Receive Medicine'"
                icon="pi pi-download"
                severity="success"
                size="small"
                text
                @click="receiveBorrow(data)"
              />
            </template>
            <template v-else-if="data.borrow_status === 'PENDING_APPROVAL'">
              <Badge value="Pending Approval" severity="warn" />
            </template>
            <template
              v-else-if="
                ['RECEIVED', 'SETTLED', 'CANCELLED'].includes(
                  data.borrow_status
                )
              "
            >
              <Badge value="Success" severity="success" />
            </template>
          </div>
        </template>
      </Column>
    </DataTable>

    <Dialog
      v-model:visible="showFormDialog"
      :header="isEditing ? 'Edit' : 'Create Borrow Record'"
      modal
      :style="{ width: '1000px' }"
      :closable="true"
    >
      <div class="flex flex-col gap-4">
        <div class="flex flex-col gap-2">
          <label class="font-semibold">Supplier *</label>
          <Select
            v-model="selectedSupplierId"
            :options="suppliers"
            optionLabel="supplier_name"
            optionValue="supplier_id"
            :placeholder="'Select Supplier'"
            :disabled="isEditing"
            filter
            @change="onSupplierChange"
          />
        </div>

        <div class="flex flex-col gap-2">
          <label class="font-semibold">Note (optional)</label>
          <Textarea v-model="formNote" rows="2" />
        </div>

        <div v-if="selectedSupplierId" class="flex flex-col gap-2">
          <label class="font-semibold">
            {{
              '&#xe40;&#xe1e;&#xe34;&#xe48;&#xe21;&#xe23;&#xe32;&#xe22;&#xe01;&#xe32;&#xe23;&#xe22;&#xe32;'
            }}
          </label>
          <div class="flex gap-2 items-end">
            <Select
              v-model="selectedItemId"
              :options="availableItems"
              optionLabel="item_name_th"
              optionValue="item_id"
              :placeholder="'Select Medicine'"
              filter
              :filterFields="['item_name_th', 'item_name_en']"
              class="flex-1"
            >
              <template #value="{ placeholder }">
                <div v-if="selectedItemInfo" class="flex flex-col gap-1">
                  <span class="text-sm">
                    {{ selectedItemInfo.item_name_th }} ({{
                      selectedItemInfo.item_name_en
                    }}) - ฿{{ formatNumber(selectedItemInfo.unit_price) }}/{{
                      selectedItemInfo.unit_name_th
                    }}
                  </span>
                  <span
                    v-if="selectedItemOnHand"
                    class="text-xs text-blue-600 font-semibold"
                  >
                    Onhand: {{ formatNumber(selectedItemOnHand.qty_base) }}
                    {{ selectedItemInfo.unit_name_th }}
                  </span>
                  <span v-else class="text-xs text-red-500 font-semibold">
                    Onhand: {{ 'No Data' }}
                  </span>
                </div>
                <span v-else class="text-surface-400">{{ placeholder }}</span>
              </template>
              <template #option="{ option }">
                <span>
                  {{ option.item_name_th }} ({{ option.item_name_en }}) - ฿{{
                    formatNumber(option.unit_price)
                  }}/{{ option.unit_name_th }}
                </span>
              </template>
            </Select>
            <Button
              icon="pi pi-plus"
              severity="success"
              @click="addLine"
              :disabled="!selectedItemId"
              class="mt-5"
            />
          </div>
        </div>

        <DataTable
          :value="formLines"
          dataKey="item_id"
          class="p-datatable-sm"
          v-if="formLines.length > 0"
        >
          <Column
            field="item_name_th"
            :header="'Medicine Name'"
            style="min-width: 250px"
          >
            <template #body="{ data }">
              <div>{{ data.item_name_th }}</div>
              <div class="text-sm text-surface-400">
                {{ data.item_name_en }}
              </div>
            </template>
          </Column>
          <Column
            field="qty"
            :header="'Quantity Borrowed'"
            style="min-width: 60px"
            bodyClass="text-right"
          >
            <template #body="{ data, index }">
              <InputNumber
                :model-value="data.qty"
                :min="1"
                @update:model-value="updateLineQuantity(index, $event)"
                showButtons
                size="small"
                class="w-full"
              />
            </template>
          </Column>
          <Column
            field="unit_name_th"
            :header="'Unit'"
            style="min-width: 100px"
          />
          <Column
            :header="'Onhand Qty'"
            style="min-width: 100px"
            bodyClass="text-right font-semibold text-blue-600"
          >
            <template #body="{ data }">
              {{
                stockOnHands.find(s => s.item_id === data.item_id)?.qty_base
                  ? formatNumber(
                      stockOnHands.find(s => s.item_id === data.item_id)
                        ?.qty_base
                    )
                  : '-'
              }}
            </template>
          </Column>
          <Column
            field="unit_price"
            :header="'Price/Unit'"
            style="min-width: 110px"
            bodyClass="text-right"
          >
            <template #body="{ data }">
              ฿{{ formatNumber(data.unit_price ?? 0) }}
            </template>
          </Column>
          <Column
            field="total_price"
            :header="'Total'"
            style="min-width: 110px"
            bodyClass="text-right"
          >
            <template #body="{ data }">
              ฿{{ formatNumber(data.total_price ?? 0) }}
            </template>
          </Column>
          <Column header="" style="min-width: 60px">
            <template #body="{ index }">
              <Button
                icon="pi pi-trash"
                severity="danger"
                size="small"
                text
                @click="removeLine(index)"
              />
            </template>
          </Column>
        </DataTable>

        <div
          v-if="formLines.length > 0"
          class="flex justify-end text-lg font-bold"
        >
          {{
            'Total Amount: '
          }}฿{{ formatNumber(formTotalAmount) }}
        </div>
      </div>

      <template #footer>
        <Button
          :label="'Cancel'"
          icon="pi pi-times"
          severity="secondary"
          text
          @click="showFormDialog = false"
        />
        <Button
          :label="isEditing ? 'Save' : 'Create New'"
          icon="pi pi-check"
          @click="saveBorrow"
        />
      </template>
    </Dialog>

    <Dialog
      v-model:visible="showDetailDialog"
      modal
      :style="{ width: '850px' }"
      :closable="true"
    >
      <template #header>
        <div class="flex justify-between items-center w-full">
          <span>Borrow Details</span>
          <div class="flex gap-2 mr-8">
            <Button
              v-if="detailApprovals.length > 0"
              :icon="
                showDetailTimeline ? 'pi pi-chevron-up' : 'pi pi-chevron-down'
              "
              :label="'Timeline'"
              :severity="
                detailBorrow?.approval_status === 'REWORK'
                  ? 'warning'
                  : 'secondary'
              "
              size="small"
              @click="showDetailTimeline = !showDetailTimeline"
            />
            <Button
              v-if="
                ['APPROVED', 'RECEIVED', 'SETTLED'].includes(
                  detailBorrow?.borrow_status
                )
              "
              icon="pi pi-print"
              label="Print"
              severity="info"
              size="small"
              @click="printBorrow"
            />
          </div>
        </div>
      </template>
      <div v-if="detailBorrow" class="flex flex-col gap-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <span class="font-semibold text-surface-500">
              {{ 'Document No:' }}
            </span>
            <span class="ml-2">{{ detailBorrow.borrow_no }}</span>
          </div>
          <div>
            <span class="font-semibold text-surface-500">
              {{ 'Borrow Date:' }}
            </span>
            <span class="ml-2">{{ formatDate(detailBorrow.borrow_date) }}</span>
          </div>
          <div>
            <span class="font-semibold text-surface-500">Supplier:</span>
            <span class="ml-2">{{ detailBorrow.supplier_name }}</span>
          </div>
          <div>
            <span class="font-semibold text-surface-500">
              {{ 'Status:' }}
            </span>
            <Tag
              class="ml-2"
              :value="statusLabel(detailBorrow.borrow_status)"
              :severity="statusSeverity(detailBorrow.borrow_status)"
            />
          </div>
          <div v-if="detailBorrow.approval_role">
            <span class="font-semibold text-surface-500">
              {{ 'Approval Role:' }}
            </span>
            <span class="ml-2">
              {{ detailBorrow.approval_role }} (L{{
                detailBorrow.approval_level
              }})
            </span>
          </div>
          <div v-if="detailBorrow.remark">
            <span class="font-semibold text-surface-500">
              {{ 'Remark:' }}
            </span>
            <span class="ml-2">{{ detailBorrow.remark }}</span>
          </div>
        </div>

        <DataTable
          :value="detailLines"
          :loading="detailLoading"
          dataKey="borrow_line_id"
          class="p-datatable-sm"
        >
          <template #empty>
            {{ 'No data found' }}
          </template>
          <Column header="#" style="min-width: 50px">
            <template #body="{ index }">{{ index + 1 }}</template>
          </Column>
          <Column
            field="item_code"
            :header="'Item Code'"
            style="min-width: 100px"
          />
          <Column
            field="item_name_th"
            :header="'Item Name'"
            style="min-width: 250px"
          >
            <template #body="{ data }">
              <div>{{ data.item_name_th }}</div>
              <div class="text-sm text-surface-400">
                {{ data.item_name_en }}
              </div>
            </template>
          </Column>
          <Column
            field="qty_borrow"
            :header="'Quantity'"
            style="min-width: 80px"
            bodyClass="text-right"
          />
          <Column
            field="purchase_unit_name_th"
            :header="'Purchase Unit '"
            style="min-width: 100px"
          />
          <Column
            field="unit_price"
            :header="'Unit Price'"
            style="min-width: 110px"
            bodyClass="text-right"
          >
            <template #body="{ data }">
              ฿{{ formatNumber(data.unit_price) }}
            </template>
          </Column>
          <Column
            field="total_price"
            :header="'Total Price'"
            style="min-width: 110px"
            bodyClass="text-right"
          >
            <template #body="{ data }">
              ฿{{ formatNumber(data.total_price) }}
            </template>
          </Column>
        </DataTable>

        <!-- Approval Timeline -->
        <div
          v-if="detailApprovals.length > 0 && showDetailTimeline"
          class="mt-4 border-t pt-4"
        >
          <div class="font-semibold text-surface-500 mb-2">
            Approval Timeline
          </div>
          <Timeline :value="detailApprovals" align="left" class="pl-2">
            <template #marker="{ item }">
              <span
                class="flex items-center justify-center rounded-full border-2 w-8 h-8"
                :style="{
                  borderColor:
                    getStepSeverity(item, detailBorrow?.borrow_status || '') ===
                    'success'
                      ? '#22C55E'
                      : getStepSeverity(
                            item,
                            detailBorrow?.borrow_status || ''
                          ) === 'danger'
                        ? '#EF4444'
                        : getStepSeverity(
                              item,
                              detailBorrow?.borrow_status || ''
                            ) === 'warn'
                          ? '#F59E0B'
                          : '#6B7280',
                  backgroundColor:
                    (getStepSeverity(item, detailBorrow?.borrow_status || '') ===
                    'success'
                      ? '#22C55E'
                      : getStepSeverity(
                            item,
                            detailBorrow?.borrow_status || ''
                          ) === 'danger'
                        ? '#EF4444'
                        : getStepSeverity(
                              item,
                              detailBorrow?.borrow_status || ''
                            ) === 'warn'
                          ? '#F59E0B'
                          : '#6B7280') + '1A',
                }"
              >
                <i
                  :class="getStepIcon(item, detailBorrow?.borrow_status || '')"
                  :style="{
                    color:
                      getStepSeverity(
                        item,
                        detailBorrow?.borrow_status || ''
                      ) === 'success'
                        ? '#22C55E'
                        : getStepSeverity(
                              item,
                              detailBorrow?.borrow_status || ''
                            ) === 'danger'
                          ? '#EF4444'
                          : getStepSeverity(
                                item,
                                detailBorrow?.borrow_status || ''
                              ) === 'warn'
                            ? '#F59E0B'
                            : '#6B7280',
                  }"
                />
              </span>
            </template>
            <template #content="{ item }">
              <div class="mb-3">
                <div class="flex items-center gap-2 mb-1">
                  <Tag
                    :value="
                      getStepStatusLabel(item, detailBorrow?.borrow_status || '')
                    "
                    :severity="
                      getStepSeverity(item, detailBorrow?.borrow_status || '')
                    "
                  />
                  <span class="text-sm text-surface-500">
                    {{ formatRole(item.approval_role) }}
                    (L{{ item.approval_level }})
                  </span>
                </div>
                <div v-if="item.actioned_by" class="text-sm">
                  <span class="font-medium">
                    {{ item.actioned_by_name || item.actioned_by }}
                  </span>
                  <span class="text-surface-400 ml-2">
                    {{ formatSysdatetimeoffset(item.actioned_at) }}
                  </span>
                </div>
                <div v-if="item.remark" class="text-sm text-surface-500 mt-1">
                  <i class="pi pi-comment mr-1" />
                  {{ item.remark }}
                </div>
              </div>
            </template>
          </Timeline>
        </div>
      </div>
    </Dialog>

    <!-- Receive Confirmation Dialog -->
    <Dialog
      v-model:visible="showReceiveDialog"
      modal
      :style="{ width: '900px' }"
      :closable="true"
      header="Confirm Receive Medicines"
    >
      <div v-if="receiveConfirmBorrow" class="flex flex-col gap-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <span class="font-semibold text-surface-500">Borrow No:</span>
            <span class="ml-2">{{ receiveConfirmBorrow.borrow_no }}</span>
          </div>
          <div>
            <span class="font-semibold text-surface-500">Supplier:</span>
            <span class="ml-2">{{ receiveConfirmBorrow.supplier_name }}</span>
          </div>
        </div>

        <div class="font-semibold mb-2">Items to Receive</div>
        <DataTable :value="receiveConfirmLines" size="small" stripedRows>
          <Column header="#" style="min-width: 50px">
            <template #body="{ index }">{{ index + 1 }}</template>
          </Column>
          <Column
            field="item_code"
            :header="'Item Code'"
            style="min-width: 100px"
          />
          <Column
            field="item_name_th"
            :header="'Item Name'"
            style="min-width: 250px"
          >
            <template #body="{ data }">
              <div>{{ data.item_name_th }}</div>
              <div class="text-sm text-surface-400">
                {{ data.item_name_en }}
              </div>
            </template>
          </Column>
          <Column
            field="qty_borrow"
            :header="'Quantity Ordered'"
            style="min-width: 100px"
            bodyClass="text-center"
          />
          <Column
            field="purchase_unit_name_th"
            :header="'Purchase Unit'"
            style="min-width: 100px"
            bodyClass="text-center"
          />
          <Column
            field="conversion_factor"
            :header="'Conversion Factor'"
            style="min-width: 80px"
            bodyClass="text-center"
          >
            <template #body="{ data }">
              {{ formatNumber(data.conversion_factor) }}
            </template>
          </Column>
          <Column
            :header="'Quantity Received'"
            style="min-width: 120px"
            bodyClass="text-center font-semibold"
          >
            <template #body="{ data }">
              <span class="text-primary">
                {{ formatNumber(data.qty_borrow * data.conversion_factor) }}
              </span>
            </template>
          </Column>
          <Column
            field="usage_unit_name_th"
            :header="'Usage Unit'"
            style="min-width: 100px"
            bodyClass="text-center"
          />
        </DataTable>

        <div class="border-t pt-4 flex gap-2 justify-end">
          <Button
            :label="'Cancel '"
            icon="pi pi-times"
            severity="secondary"
            @click="showReceiveDialog = false"
          />
          <Button
            :label="'Confirm Receive'"
            icon="pi pi-check"
            severity="success"
            @click="confirmReceiveBorrow"
          />
        </div>
      </div>
    </Dialog>
  </div>
</template>
