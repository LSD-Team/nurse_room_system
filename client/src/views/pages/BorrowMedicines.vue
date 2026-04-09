<script lang="ts" setup>
  import { ref, onMounted, computed } from 'vue';
  import { FilterMatchMode } from '@primevue/core/api';
  import { BorrowService } from '@/services/borrow.service';
  import { ApprovalService } from '@/services/approval.service';
  import { StockService, type IStockOnHand } from '@/services/stock.service';
  import type {
    IBorrowHeader,
    IBorrowLine,
    ISupplier,
    ISupplierItemPrice,
    IBorrowLineForm,
  } from '@/interfaces/borrow.interfaces';
  import type { IBorrowApprovalLog } from '@/interfaces/approval.interfaces';
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
  const detailLoading = ref(false);

  const selectedStatusFilter = ref<string>('PENDING_APPROVAL');

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

  function formatDate(dateStr: string | null): string {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  function formatNumber(num: number | null): string {
    if (num === null || num === undefined) return '-';
    return num.toLocaleString('th-TH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
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
        '\u0E41\u0E08\u0E49\u0E07\u0E40\u0E15\u0E37\u0E2D\u0E19',
        '\u0E01\u0E23\u0E38\u0E13\u0E32\u0E40\u0E25\u0E37\u0E2D\u0E01 Supplier \u0E41\u0E25\u0E30\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E22\u0E32\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E19\u0E49\u0E2D\u0E22 1 \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23',
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
          '\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08',
          '\u0E41\u0E01\u0E49\u0E44\u0E02\u0E43\u0E1A\u0E22\u0E37\u0E21\u0E40\u0E23\u0E35\u0E22\u0E1A\u0E23\u0E49\u0E2D\u0E22',
          'success'
        );
      } else {
        await BorrowService.createBorrow({
          JsonLines: jsonLines,
          SupplierId: String(selectedSupplierId.value),
          Note: formNote.value || undefined,
        });
        showFormDialog.value = false;
        await loadBorrowHeaders();
        await Swal.fire(
          '\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08',
          '\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E43\u0E1A\u0E22\u0E37\u0E21\u0E40\u0E23\u0E35\u0E22\u0E1A\u0E23\u0E49\u0E2D\u0E22',
          'success'
        );
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
      SUBMIT: '\u0E2A\u0E48\u0E07\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34',
      APPROVE: '\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34',
      REJECT: '\u0E1B\u0E0F\u0E34\u0E40\u0E2A\u0E18',
      REWORK:
        '\u0E2A\u0E48\u0E07\u0E01\u0E25\u0E31\u0E1A\u0E41\u0E01\u0E49\u0E44\u0E02',
    };
    return map[action] || action;
  }

  async function viewDetail(row: IBorrowHeader) {
    detailBorrow.value = row;
    detailLoading.value = true;
    detailLogs.value = [];
    showDetailDialog.value = true;
    try {
      const promises: Promise<any>[] = [
        BorrowService.getBorrowLines(row.borrow_id),
      ];
      if (row.borrow_status !== 'DRAFT') {
        promises.push(ApprovalService.getBorrowApprovalLogs(row.borrow_id));
      }
      const results = await Promise.all(promises);
      detailLines.value = results[0];
      if (results[1]) detailLogs.value = results[1];
    } catch (err: any) {
      errorMsg.value =
        err?.response?.data?.message || err?.message || String(err);
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
        '\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08',
        '\u0E2A\u0E48\u0E07\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34\u0E40\u0E23\u0E35\u0E22\u0E1A\u0E23\u0E49\u0E2D\u0E22',
        'success'
      );
      await loadBorrowHeaders();
    } catch (err: any) {
      // Error handled by axios interceptor
    }
  }

  async function receiveBorrow(row: IBorrowHeader) {
    const result = await Swal.fire({
      title: 'ยืนยันการรับยาเข้าคลัง?',
      text: 'เลขที่ใบยืม ' + row.borrow_no,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'รับยาเข้าคลัง',
      cancelButtonText: 'ยกเลิก',
    });
    if (!result.isConfirmed) return;

    try {
      await BorrowService.receiveBorrow(row.borrow_id);
      await Swal.fire('สำเร็จ', 'รับยาเข้าคลังสำเร็จ', 'success');
      await loadBorrowHeaders();
    } catch (err: any) {
      // Error handled by axios interceptor
    }
  }

  async function cancelBorrow(row: IBorrowHeader) {
    const { value, isConfirmed } = await Swal.fire({
      title: 'ยกเลิกใบยืม ' + row.borrow_no + '?',
      input: 'textarea',
      inputLabel: 'เหตุผล (ถ้ามี)',
      showCancelButton: true,
      confirmButtonText: 'ยกเลิกใบยืม',
      confirmButtonColor: '#dc3545',
      cancelButtonText: 'ยกเลิก',
    });
    if (!isConfirmed) return;

    try {
      await BorrowService.cancelBorrow(row.borrow_id, {
        Reason: value || undefined,
      });
      await Swal.fire(
        'สำเร็จ',
        'ยกเลิกใบยืม ' + row.borrow_no + ' สำเร็จ',
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
          {{ 'ยืมยา/เวชภัณฑ์' }}
        </h2>
        <p class="text-surface-500 mt-1">
          {{ 'รายละเอียดการยืมยา/เวชภัณฑ์' }}
        </p>
      </div>
      <Button
        :label="'สร้างใบยืม'"
        icon="pi pi-plus"
        @click="openCreateDialog"
      />
    </div>

    <Message v-if="errorMsg" severity="error" class="mb-4">
      <span class="font-semibold">
        {{ 'ข้อผิดพลาด: ' }}
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
              label="APPROVED"
              :variant="
                selectedStatusFilter === 'APPROVED' ? 'contained' : 'outlined'
              "
              @click="selectedStatusFilter = 'APPROVED'"
              class="text-sm"
            />
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
              :placeholder="'ค้นหา...'"
            />
          </IconField>
        </div>
      </template>

      <template #empty>
        {{ 'ไม่พบข้อมูล' }}
      </template>
      <template #loading>
        {{ 'กำลังโหลดข้อมูล...' }}
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
        :header="'เลขที่ใบยืม'"
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
        :header="'วันที่ยืม'"
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
        :header="'สถานะใบยืม'"
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
        :header="'บทบาทผู้อนุมัติ'"
        style="min-width: 130px"
      >
        <template #body="{ data }">
          {{ data.approval_role || '-' }}
        </template>
      </Column>
      <Column
        field="approval_status"
        :header="'สถานะการอนุมัติ'"
        style="min-width: 130px"
      >
        <template #body="{ data }">
          {{ data.approval_status || '-' }}
        </template>
      </Column>
      <Column field="created_by" :header="'ผู้สร้าง'" style="min-width: 130px">
        <template #body="{ data }">
          {{ data.created_by || '-' }}
        </template>
      </Column>
      <Column
        :header="'จัดการ'"
        style="min-width: 200px"
        frozen
        alignFrozen="right"
      >
        <template #body="{ data }">
          <div class="flex gap-1 flex-wrap">
            <template v-if="data.borrow_status === 'DRAFT'">
              <Button
                :label="'แก้ไข'"
                icon="pi pi-pencil"
                severity="info"
                size="small"
                text
                @click="openEditDialog(data)"
              />
              <Button
                :label="'ส่งอนุมัติ'"
                icon="pi pi-send"
                severity="success"
                size="small"
                text
                @click="submitBorrow(data)"
              />
              <Button
                :label="'ยกเลิก'"
                icon="pi pi-times"
                severity="danger"
                size="small"
                text
                @click="cancelBorrow(data)"
              />
            </template>
            <template v-else-if="data.borrow_status === 'APPROVED'">
              <Button
                :label="'รับยาเข้าคลัง'"
                icon="pi pi-download"
                severity="success"
                size="small"
                text
                @click="receiveBorrow(data)"
              />
            </template>
            <template v-else-if="data.borrow_status === 'PENDING_APPROVAL'">
              <Badge value="รอการอนุมัติ" severity="warn" />
            </template>
            <template v-else-if="['RECEIVED', 'SETTLED', 'CANCELLED'].includes(data.borrow_status)">
              <Badge value="สำเร็จ" severity="success" />
            </template>
          </div>
        </template>
      </Column>
    </DataTable>

    <Dialog
      v-model:visible="showFormDialog"
      :header="isEditing ? 'แก้ไข' : 'สร้างรายการยืมยา'"
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
            :placeholder="'เลือก Supplier'"
            :disabled="isEditing"
            filter
            @change="onSupplierChange"
          />
        </div>

        <div class="flex flex-col gap-2">
          <label class="font-semibold">หมายเหตุ (optional)</label>
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
              :placeholder="'เลือกรายการยา'"
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
                    Onhand: {{ 'ไม่มีข้อมูล' }}
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
            :header="'ชื่อยา'"
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
            :header="'จำนวนยืม'"
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
            :header="'หน่วย'"
            style="min-width: 100px"
          />
          <Column
            :header="'คงเหลือ'"
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
            :header="'ราคา/หน่วย'"
            style="min-width: 110px"
            bodyClass="text-right"
          >
            <template #body="{ data }">
              ฿{{ formatNumber(data.unit_price ?? 0) }}
            </template>
          </Column>
          <Column
            field="total_price"
            :header="'รวม'"
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
            '&#xe23;&#xe27;&#xe21;&#xe17;&#xe31;&#xe49;&#xe07;&#xe2b;&#xe21;&#xe14;: '
          }}฿{{ formatNumber(formTotalAmount) }}
        </div>
      </div>

      <template #footer>
        <Button
          :label="'ยกเลิก'"
          icon="pi pi-times"
          severity="secondary"
          text
          @click="showFormDialog = false"
        />
        <Button
          :label="isEditing ? 'บันทึก' : 'สร้างใหม่'"
          icon="pi pi-check"
          @click="saveBorrow"
        />
      </template>
    </Dialog>

    <Dialog
      v-model:visible="showDetailDialog"
      :header="'รายละเอียดการยืม'"
      modal
      :style="{ width: '850px' }"
      :closable="true"
    >
      <div v-if="detailBorrow" class="flex flex-col gap-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <span class="font-semibold text-surface-500">
              {{ 'เลขที่เอกสาร:' }}
            </span>
            <span class="ml-2">{{ detailBorrow.borrow_no }}</span>
          </div>
          <div>
            <span class="font-semibold text-surface-500">
              {{ 'วันที่ยืม:' }}
            </span>
            <span class="ml-2">{{ formatDate(detailBorrow.borrow_date) }}</span>
          </div>
          <div>
            <span class="font-semibold text-surface-500">Supplier:</span>
            <span class="ml-2">{{ detailBorrow.supplier_name }}</span>
          </div>
          <div>
            <span class="font-semibold text-surface-500">
              {{ 'สถานะใบยืม:' }}
            </span>
            <Tag
              class="ml-2"
              :value="statusLabel(detailBorrow.borrow_status)"
              :severity="statusSeverity(detailBorrow.borrow_status)"
            />
          </div>
          <div v-if="detailBorrow.approval_role">
            <span class="font-semibold text-surface-500">
              {{ 'บทบาทผู้อนุมัติ:' }}
            </span>
            <span class="ml-2">
              {{ detailBorrow.approval_role }} (L{{
                detailBorrow.approval_level
              }})
            </span>
          </div>
          <div v-if="detailBorrow.remark">
            <span class="font-semibold text-surface-500">
              {{ 'หมายเหตุ:' }}
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
            {{ 'ไม่พบข้อมูล' }}
          </template>
          <Column header="#" style="min-width: 50px">
            <template #body="{ index }">{{ index + 1 }}</template>
          </Column>
          <Column
            field="item_code"
            :header="'รหัสยา'"
            style="min-width: 100px"
          />
          <Column
            field="item_name_th"
            :header="'ชื่อยา'"
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
            :header="'จำนวน'"
            style="min-width: 80px"
            bodyClass="text-right"
          />
          <Column
            field="purchase_unit_name_th"
            :header="'หน่วยซื้อ'"
            style="min-width: 100px"
          />
          <Column
            field="unit_price"
            :header="'ราคา/หน่วย'"
            style="min-width: 110px"
            bodyClass="text-right"
          >
            <template #body="{ data }">
              ฿{{ formatNumber(data.unit_price) }}
            </template>
          </Column>
          <Column
            field="total_price"
            :header="'รวม'"
            style="min-width: 110px"
            bodyClass="text-right"
          >
            <template #body="{ data }">
              ฿{{ formatNumber(data.total_price) }}
            </template>
          </Column>
        </DataTable>

        <!-- Approval Timeline -->
        <div v-if="detailLogs.length > 0" class="mt-4">
          <div class="font-semibold text-surface-500 mb-2">
            Timeline การอนุมัติ
          </div>
          <Timeline :value="detailLogs" align="left" class="pl-2">
            <template #marker="{ item }">
              <span
                class="flex items-center justify-center rounded-full border-2 w-8 h-8"
                :style="{
                  borderColor: logActionColor(item.action),
                  backgroundColor: logActionColor(item.action) + '1A',
                }"
              >
                <i
                  :class="logActionIcon(item.action)"
                  :style="{ color: logActionColor(item.action) }"
                />
              </span>
            </template>
            <template #content="{ item }">
              <div class="mb-3">
                <div class="flex items-center gap-2 mb-1">
                  <Tag
                    :value="logActionLabel(item.action)"
                    :style="{
                      backgroundColor: logActionColor(item.action),
                      color: '#fff',
                    }"
                  />
                  <span
                    v-if="item.approval_role !== 'SUBMITTER'"
                    class="text-sm text-surface-500"
                  >
                    {{ item.approval_role }}
                  </span>
                </div>
                <div class="text-sm">
                  <span class="font-medium">
                    {{ item.actioned_by_name || item.actioned_by }}
                  </span>
                  <span class="text-surface-400 ml-2">
                    {{ new Date(item.actioned_at).toLocaleString('th-TH') }}
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
  </div>
</template>
