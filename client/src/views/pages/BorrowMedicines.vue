<script lang="ts" setup>
  import { ref, onMounted, computed } from 'vue';
  import { FilterMatchMode } from '@primevue/core/api';
  import { BorrowService } from '@/services/borrow.service';
  import { ApprovalService } from '@/services/approval.service';
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
  const borrowLines = ref<IBorrowLine[]>([]);
  const suppliers = ref<ISupplier[]>([]);
  const supplierPrices = ref<ISupplierItemPrice[]>([]);
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
  });

  async function loadBorrowHeaders() {
    loading.value = true;
    errorMsg.value = '';
    try {
      borrowHeaders.value = await BorrowService.getBorrowHeaders();
    } catch (err: any) {
      errorMsg.value =
        err?.response?.data?.message || err?.message || String(err);
    } finally {
      loading.value = false;
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

  async function openCreateDialog() {
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

  async function onSupplierChange() {
    if (!selectedSupplierId.value) {
      supplierPrices.value = [];
      return;
    }
    try {
      supplierPrices.value = await BorrowService.getSupplierPrices(
        selectedSupplierId.value
      );
    } catch (err: any) {
      errorMsg.value =
        err?.response?.data?.message || err?.message || String(err);
    }
  }

  function addLine() {
    if (!selectedItemId.value || selectedQty.value <= 0) return;
    const price = supplierPrices.value.find(
      p => p.item_id === selectedItemId.value
    );
    if (!price) return;

    formLines.value.push({
      item_id: price.item_id,
      qty: selectedQty.value,
      item_code: price.item_code,
      item_name_th: price.item_name_th,
      item_name_en: price.item_name_en,
      unit_name_th: price.unit_name_th,
      unit_price: price.unit_price,
      total_price: selectedQty.value * price.unit_price,
    });

    selectedItemId.value = null;
    selectedQty.value = 1;
  }

  function removeLine(index: number) {
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

  function roleLabel(role: string): string {
    const map: Record<string, string> = {
      GROUP_LEAD:
        '\u0E2B\u0E31\u0E27\u0E2B\u0E19\u0E49\u0E32\u0E01\u0E25\u0E38\u0E48\u0E21',
      MANAGER: '\u0E1C\u0E39\u0E49\u0E08\u0E31\u0E14\u0E01\u0E32\u0E23',
      DEPARTMENT:
        '\u0E2B\u0E31\u0E27\u0E2B\u0E19\u0E49\u0E32\u0E41\u0E1C\u0E19\u0E01',
    };
    return map[role] || role;
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
      title:
        '\u0E22\u0E37\u0E19\u0E22\u0E31\u0E19\u0E23\u0E31\u0E1A\u0E22\u0E37\u0E21\u0E40\u0E02\u0E49\u0E32\u0E2A\u0E15\u0E47\u0E2D\u0E01?',
      text: '\u0E43\u0E1A\u0E22\u0E37\u0E21 ' + row.borrow_no,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText:
        '\u0E23\u0E31\u0E1A\u0E40\u0E02\u0E49\u0E32\u0E2A\u0E15\u0E47\u0E2D\u0E01',
      cancelButtonText: '\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01',
    });
    if (!result.isConfirmed) return;

    try {
      await BorrowService.receiveBorrow(row.borrow_id);
      await Swal.fire(
        '\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08',
        '\u0E23\u0E31\u0E1A\u0E22\u0E37\u0E21\u0E40\u0E02\u0E49\u0E32\u0E2A\u0E15\u0E47\u0E2D\u0E01\u0E40\u0E23\u0E35\u0E22\u0E1A\u0E23\u0E49\u0E2D\u0E22',
        'success'
      );
      await loadBorrowHeaders();
    } catch (err: any) {
      // Error handled by axios interceptor
    }
  }

  async function cancelBorrow(row: IBorrowHeader) {
    const { value, isConfirmed } = await Swal.fire({
      title:
        '\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01\u0E43\u0E1A\u0E22\u0E37\u0E21 ' +
        row.borrow_no +
        '?',
      input: 'textarea',
      inputLabel:
        '\u0E40\u0E2B\u0E15\u0E38\u0E1C\u0E25 (\u0E16\u0E49\u0E32\u0E21\u0E35)',
      showCancelButton: true,
      confirmButtonText:
        '\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01\u0E43\u0E1A\u0E22\u0E37\u0E21',
      confirmButtonColor: '#dc3545',
      cancelButtonText: '\u0E1B\u0E34\u0E14',
    });
    if (!isConfirmed) return;

    try {
      await BorrowService.cancelBorrow(row.borrow_id, {
        Reason: value || undefined,
      });
      await Swal.fire(
        '\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08',
        '\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01\u0E43\u0E1A\u0E22\u0E37\u0E21\u0E40\u0E23\u0E35\u0E22\u0E1A\u0E23\u0E49\u0E2D\u0E22',
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
          {{
            '&#xe22;&#xe37;&#xe21;&#xe22;&#xe32;/&#xe40;&#xe27;&#xe0a;&#xe20;&#xe31;&#xe13;&#xe11;&#xe4c;'
          }}
        </h2>
        <p class="text-surface-500 mt-1">
          {{
            '&#xe23;&#xe32;&#xe22;&#xe01;&#xe32;&#xe23;&#xe43;&#xe1a;&#xe22;&#xe37;&#xe21;&#xe22;&#xe32;/&#xe40;&#xe27;&#xe0a;&#xe20;&#xe31;&#xe13;&#xe11;&#xe4c;&#xe17;&#xe31;&#xe49;&#xe07;&#xe2b;&#xe21;&#xe14;'
          }}
        </p>
      </div>
      <Button
        :label="'\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E43\u0E1A\u0E22\u0E37\u0E21'"
        icon="pi pi-plus"
        @click="openCreateDialog"
      />
    </div>

    <Message v-if="errorMsg" severity="error" class="mb-4">
      <span class="font-semibold">
        {{
          '&#xe40;&#xe01;&#xe34;&#xe14;&#xe02;&#xe49;&#xe2d;&#xe1c;&#xe34;&#xe14;&#xe1e;&#xe25;&#xe32;&#xe14;: '
        }}
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
          <SelectButton
            v-model="selectedStatusFilter"
            :options="statusFilterOptions"
            optionLabel="label"
            optionValue="value"
            class="flex-wrap"
          />
          <IconField>
            <InputIcon class="pi pi-search" />
            <InputText
              v-model="filters['global'].value"
              :placeholder="'\u0E04\u0E49\u0E19\u0E2B\u0E32...'"
            />
          </IconField>
        </div>
      </template>

      <template #empty>
        {{
          '&#xe44;&#xe21;&#xe48;&#xe1e;&#xe1a;&#xe02;&#xe49;&#xe2d;&#xe21;&#xe39;&#xe25;'
        }}
      </template>
      <template #loading>
        {{
          '&#xe01;&#xe33;&#xe25;&#xe31;&#xe07;&#xe42;&#xe2b;&#xe25;&#xe14;&#xe02;&#xe49;&#xe2d;&#xe21;&#xe39;&#xe25;...'
        }}
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
        :header="'\u0E40\u0E25\u0E02\u0E17\u0E35\u0E48\u0E43\u0E1A\u0E22\u0E37\u0E21'"
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
        :header="'\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48'"
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
        :header="'\u0E2A\u0E16\u0E32\u0E19\u0E30'"
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
        :header="'\u0E23\u0E30\u0E14\u0E31\u0E1A\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34'"
        style="min-width: 130px"
      >
        <template #body="{ data }">
          {{ data.approval_role || '-' }}
        </template>
      </Column>
      <Column
        field="approval_status"
        :header="'\u0E2A\u0E16\u0E32\u0E19\u0E30\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34'"
        style="min-width: 130px"
      >
        <template #body="{ data }">
          {{ data.approval_status || '-' }}
        </template>
      </Column>
      <Column
        :header="'\u0E08\u0E31\u0E14\u0E01\u0E32\u0E23'"
        style="min-width: 200px"
        frozen
        alignFrozen="right"
      >
        <template #body="{ data }">
          <div class="flex gap-1 flex-wrap">
            <template v-if="data.borrow_status === 'DRAFT'">
              <Button
                :label="'\u0E41\u0E01\u0E49\u0E44\u0E02'"
                icon="pi pi-pencil"
                severity="info"
                size="small"
                text
                @click="openEditDialog(data)"
              />
              <Button
                :label="'\u0E2A\u0E48\u0E07\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34'"
                icon="pi pi-send"
                severity="success"
                size="small"
                text
                @click="submitBorrow(data)"
              />
              <Button
                :label="'\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01'"
                icon="pi pi-times"
                severity="danger"
                size="small"
                text
                @click="cancelBorrow(data)"
              />
            </template>
            <template v-if="data.borrow_status === 'APPROVED'">
              <Button
                :label="'\u0E23\u0E31\u0E1A\u0E40\u0E02\u0E49\u0E32\u0E2A\u0E15\u0E47\u0E2D\u0E01'"
                icon="pi pi-download"
                severity="success"
                size="small"
                text
                @click="receiveBorrow(data)"
              />
            </template>
            <template v-if="data.borrow_status === 'PENDING_APPROVAL'">
              <Button
                :label="'\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01'"
                icon="pi pi-times"
                severity="danger"
                size="small"
                text
                @click="cancelBorrow(data)"
              />
            </template>
          </div>
        </template>
      </Column>
    </DataTable>

    <Dialog
      v-model:visible="showFormDialog"
      :header="
        isEditing
          ? '\u0E41\u0E01\u0E49\u0E44\u0E02\u0E43\u0E1A\u0E22\u0E37\u0E21'
          : '\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E43\u0E1A\u0E22\u0E37\u0E21\u0E43\u0E2B\u0E21\u0E48'
      "
      modal
      :style="{ width: '800px' }"
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
            :placeholder="'\u0E40\u0E25\u0E37\u0E2D\u0E01 Supplier'"
            :disabled="isEditing"
            filter
            @change="onSupplierChange"
          />
        </div>

        <div class="flex flex-col gap-2">
          <label class="font-semibold">
            {{ '&#xe2b;&#xe21;&#xe32;&#xe22;&#xe40;&#xe2b;&#xe15;&#xe38;' }}
          </label>
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
              :placeholder="'\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E22\u0E32'"
              filter
              :filterFields="['item_name_th', 'item_name_en']"
              class="flex-1"
            >
              <template #value="{ placeholder }">
                <span v-if="selectedItemInfo">
                  {{ selectedItemInfo.item_name_th }} ({{
                    selectedItemInfo.item_name_en
                  }}) - ฿{{ formatNumber(selectedItemInfo.unit_price) }}/{{
                    selectedItemInfo.unit_name_th
                  }}
                </span>
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
            <div class="flex flex-col gap-1">
              <label class="text-sm font-semibold">{{ 'จำนวน' }}</label>
              <InputNumber
                v-model="selectedQty"
                :min="1"
                showButtons
                style="width: 140px"
              />
            </div>
            <Button
              icon="pi pi-plus"
              severity="success"
              @click="addLine"
              :disabled="!selectedItemId || selectedQty <= 0"
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
            :header="'\u0E0A\u0E37\u0E48\u0E2D\u0E22\u0E32'"
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
            :header="'\u0E08\u0E33\u0E19\u0E27\u0E19'"
            style="min-width: 80px"
            bodyClass="text-right"
          />
          <Column
            field="unit_name_th"
            :header="'\u0E2B\u0E19\u0E48\u0E27\u0E22'"
            style="min-width: 100px"
          />
          <Column
            field="unit_price"
            :header="'\u0E23\u0E32\u0E04\u0E32/\u0E2B\u0E19\u0E48\u0E27\u0E22'"
            style="min-width: 110px"
            bodyClass="text-right"
          >
            <template #body="{ data }">
              ฿{{ formatNumber(data.unit_price ?? 0) }}
            </template>
          </Column>
          <Column
            field="total_price"
            :header="'\u0E23\u0E27\u0E21'"
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
          :label="'\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01'"
          icon="pi pi-times"
          severity="secondary"
          text
          @click="showFormDialog = false"
        />
        <Button
          :label="
            isEditing
              ? '\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01'
              : '\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E43\u0E1A\u0E22\u0E37\u0E21'
          "
          icon="pi pi-check"
          @click="saveBorrow"
        />
      </template>
    </Dialog>

    <Dialog
      v-model:visible="showDetailDialog"
      :header="'\u0E23\u0E32\u0E22\u0E25\u0E30\u0E40\u0E2D\u0E35\u0E22\u0E14\u0E43\u0E1A\u0E22\u0E37\u0E21'"
      modal
      :style="{ width: '850px' }"
      :closable="true"
    >
      <div v-if="detailBorrow" class="flex flex-col gap-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <span class="font-semibold text-surface-500">
              {{
                '&#xe40;&#xe25;&#xe02;&#xe17;&#xe35;&#xe48;&#xe43;&#xe1a;&#xe22;&#xe37;&#xe21;:'
              }}
            </span>
            <span class="ml-2">{{ detailBorrow.borrow_no }}</span>
          </div>
          <div>
            <span class="font-semibold text-surface-500">
              {{ '&#xe27;&#xe31;&#xe19;&#xe17;&#xe35;&#xe48;:' }}
            </span>
            <span class="ml-2">{{ formatDate(detailBorrow.borrow_date) }}</span>
          </div>
          <div>
            <span class="font-semibold text-surface-500">Supplier:</span>
            <span class="ml-2">{{ detailBorrow.supplier_name }}</span>
          </div>
          <div>
            <span class="font-semibold text-surface-500">
              {{ '&#xe2a;&#xe16;&#xe32;&#xe19;&#xe30;:' }}
            </span>
            <Tag
              class="ml-2"
              :value="statusLabel(detailBorrow.borrow_status)"
              :severity="statusSeverity(detailBorrow.borrow_status)"
            />
          </div>
          <div v-if="detailBorrow.approval_role">
            <span class="font-semibold text-surface-500">
              {{
                '&#xe23;&#xe30;&#xe14;&#xe31;&#xe1a;&#xe2d;&#xe19;&#xe38;&#xe21;&#xe31;&#xe15;&#xe34;:'
              }}
            </span>
            <span class="ml-2">
              {{ detailBorrow.approval_role }} (L{{
                detailBorrow.approval_level
              }})
            </span>
          </div>
          <div v-if="detailBorrow.remark">
            <span class="font-semibold text-surface-500">
              {{ '&#xe2b;&#xe21;&#xe32;&#xe22;&#xe40;&#xe2b;&#xe15;&#xe38;:' }}
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
            {{
              '&#xe44;&#xe21;&#xe48;&#xe1e;&#xe1a;&#xe23;&#xe32;&#xe22;&#xe01;&#xe32;&#xe23;'
            }}
          </template>
          <Column header="#" style="min-width: 50px">
            <template #body="{ index }">{{ index + 1 }}</template>
          </Column>
          <Column
            field="item_code"
            :header="'\u0E23\u0E2B\u0E31\u0E2A'"
            style="min-width: 100px"
          />
          <Column
            field="item_name_th"
            :header="'\u0E0A\u0E37\u0E48\u0E2D\u0E22\u0E32'"
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
            :header="'\u0E08\u0E33\u0E19\u0E27\u0E19'"
            style="min-width: 80px"
            bodyClass="text-right"
          />
          <Column
            field="purchase_unit_name_th"
            :header="'\u0E2B\u0E19\u0E48\u0E27\u0E22'"
            style="min-width: 100px"
          />
          <Column
            field="unit_price"
            :header="'\u0E23\u0E32\u0E04\u0E32/\u0E2B\u0E19\u0E48\u0E27\u0E22'"
            style="min-width: 110px"
            bodyClass="text-right"
          >
            <template #body="{ data }">
              ฿{{ formatNumber(data.unit_price) }}
            </template>
          </Column>
          <Column
            field="total_price"
            :header="'\u0E23\u0E27\u0E21'"
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
            Timeline
            &#x0E01;&#x0E32;&#x0E23;&#x0E2D;&#x0E19;&#x0E38;&#x0E21;&#x0E31;&#x0E15;&#x0E34;
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
