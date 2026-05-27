<script lang="ts" setup>
  import { ref, onMounted, computed, watch } from 'vue';
  import { StockService } from '@/services/stock.service';
  import type { IStockMonthlyReport } from '@/interfaces/stock.interfaces';
  import { FilterMatchMode } from '@primevue/core/api';
  import * as XLSX from 'xlsx';
  import Swal from 'sweetalert2';

  // State
  const periods = ref<{ period_code: string }[]>([]);
  const selectedPeriod = ref<string | null>(null);
  const reportData = ref<IStockMonthlyReport[]>([]);
  const loading = ref(false);
  const showOnlyMismatches = ref(false);

  const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
  });

  // Summary metrics
  const totalItems = computed(() => reportData.value.length);
  const mismatchItems = computed(
    () => reportData.value.filter(i => i.status === 'MISMATCH').length
  );

  const displayedData = computed(() => {
    if (showOnlyMismatches.value) {
      return reportData.value.filter(i => i.status === 'MISMATCH');
    }
    return reportData.value;
  });

  function toggleMismatchFilter() {
    showOnlyMismatches.value = !showOnlyMismatches.value;
  }

  // Lifecycle
  onMounted(async () => {
    await loadPeriods();
  });

  // Watch period change
  watch(selectedPeriod, async newVal => {
    if (newVal) {
      await loadReport(newVal);
    } else {
      reportData.value = [];
    }
  });

  async function loadPeriods() {
    try {
      loading.value = true;
      periods.value = await StockService.getReportPeriods();
      if (periods.value.length > 0) {
        selectedPeriod.value = periods.value[0].period_code;
      }
    } catch (error: any) {
      Swal.fire('Error', error.message || 'Failed to load periods', 'error');
    } finally {
      loading.value = false;
    }
  }

  async function loadReport(periodCode: string) {
    try {
      loading.value = true;
      reportData.value = await StockService.getStockMonthlyReport(periodCode);
    } catch (error: any) {
      Swal.fire(
        'Error',
        error.message || 'Failed to load report data',
        'error'
      );
    } finally {
      loading.value = false;
    }
  }

  function exportExcel() {
    if (!reportData.value.length || !selectedPeriod.value) return;

    const data = reportData.value.map(item => ({
      'Item Code': item.item_code,
      'Item Name': `${item.item_name_en} (${item.item_name_th})`,
      'Opening Qty': item.opening_qty,
      Receipts: item.receipts,
      Issues: item.issues,
      Adjustments: item.adjustments,
      'Net Movement': item.net_movement,
      'Expected Closing': item.expected_closing,
      'Actual Closing': item.actual_closing,
      Diff: item.diff_qty,
      Status: item.status,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Stock Snapshot');
    XLSX.writeFile(wb, `stock_snapshot_${selectedPeriod.value}.xlsx`);
  }
</script>

<template>
  <div class="card p-3 md:p-4">
    <div
      class="flex flex-column md:flex-row md:justify-content-between md:align-items-center mb-3 gap-3"
    >
      <div class="flex align-items-center gap-2">
        <i class="pi pi-file-pdf text-primary text-2xl"></i>
        <h5 class="m-0 text-xl font-bold">Report : Stock Monthly Snapshot</h5>
      </div>
      <div class="flex flex-wrap align-items-center gap-3">
        <div class="flex align-items-center gap-2">
          <span class="font-bold text-700 mx-2">Period :</span>
          <Select
            v-model="selectedPeriod"
            :options="periods"
            optionLabel="period_code"
            optionValue="period_code"
            placeholder="Select Period"
            class="w-full md:w-12rem"
            :loading="loading"
          />
        </div>
        <Button
          label="Export Excel"
          icon="pi pi-file-excel"
          class="p-button-success"
          @click="exportExcel"
          :disabled="!reportData.length"
        />
      </div>
    </div>

    <div class="flex flex-wrap md:flex-nowrap gap-2 mb-3" v-if="selectedPeriod">
      <div class="flex-grow-1">
        <div
          class="surface-50 shadow-1 p-2 px-3 border-round border-1 border-gray-200 flex align-items-center justify-content-between"
        >
          <div>
            <span
              class="block text-500 font-medium uppercase text-xs tracking-wider"
            >
              Total Items
            </span>
            <div class="text-900 font-bold text-xl">
              {{ totalItems.toLocaleString() }}
            </div>
          </div>
          <div
            class="flex align-items-center justify-content-center bg-blue-100 border-round"
            style="width: 2rem; height: 2rem"
          >
            <i class="pi pi-box text-blue-500 text-lg"></i>
          </div>
        </div>
      </div>
      <div class="flex-grow-1 cursor-pointer" @click="toggleMismatchFilter">
        <div
          class="surface-50 shadow-1 p-2 px-3 border-round border-1 transition-all transition-duration-200 flex align-items-center justify-content-between"
          :class="
            showOnlyMismatches
              ? 'border-red-500 bg-red-50 shadow-3'
              : 'border-gray-200 hover:surface-100'
          "
        >
          <div>
            <span
              class="block text-500 font-medium uppercase text-xs tracking-wider"
            >
              Mismatch Items
            </span>
            <div
              class="text-xl font-bold"
              :class="mismatchItems > 0 ? 'text-red-600' : 'text-900'"
            >
              {{ mismatchItems.toLocaleString() }}
            </div>
          </div>
          <div
            class="flex align-items-center justify-content-center border-round"
            :class="
              showOnlyMismatches
                ? 'bg-red-200'
                : mismatchItems > 0
                  ? 'bg-red-100'
                  : 'bg-gray-100'
            "
            style="width: 2rem; height: 2rem"
          >
            <i
              class="pi pi-exclamation-triangle text-lg"
              :class="
                showOnlyMismatches
                  ? 'text-red-700'
                  : mismatchItems > 0
                    ? 'text-red-500'
                    : 'text-gray-500'
              "
            ></i>
          </div>
        </div>
      </div>
    </div>

    <DataTable
      v-model:filters="filters"
      :value="displayedData"
      :loading="loading"
      stripedRows
      scrollable
      scrollHeight="calc(100vh - 280px)"
      class="p-datatable-sm"
      dataKey="snapshot_id"
      emptyMessage="No data found."
      :globalFilterFields="['item_code', 'item_name_en', 'item_name_th']"
      :rowClass="data => (data.status === 'MISMATCH' ? 'mismatch-row' : '')"
    >
      <template #header>
        <div class="flex justify-content-end">
          <IconField iconPosition="left">
            <InputIcon class="pi pi-search" />
            <InputText
              v-model="filters['global'].value"
              placeholder="Search item code/name..."
              class="w-full md:w-20rem"
            />
          </IconField>
        </div>
      </template>
      <Column
        field="item_code"
        header="Item Code"
        sortable
        style="min-width: 100px"
      ></Column>
      <Column
        header="Item Name"
        sortable
        sortField="item_name_en"
        style="min-width: 300px"
      >
        <template #body="{ data }">
          <span class="font-medium">{{ data.item_name_en }}</span>
          <span class="text-500 ml-1">({{ data.item_name_th }})</span>
        </template>
      </Column>
      <Column
        field="opening_qty"
        header="Opening Qty"
        sortable
        class="text-right"
        style="min-width: 100px"
      >
        <template #body="{ data }">
          {{ data.opening_qty?.toLocaleString() }}
        </template>
      </Column>
      <Column
        field="receipts"
        header="Receipts"
        sortable
        class="text-right"
        style="min-width: 100px"
      >
        <template #body="{ data }">
          {{ data.receipts?.toLocaleString() }}
        </template>
      </Column>
      <Column
        field="issues"
        header="Issues"
        sortable
        class="text-right"
        style="min-width: 100px"
      >
        <template #body="{ data }">
          {{ data.issues?.toLocaleString() }}
        </template>
      </Column>
      <Column
        field="adjustments"
        header="Adjustments"
        sortable
        class="text-right"
        style="min-width: 100px"
      >
        <template #body="{ data }">
          {{ data.adjustments?.toLocaleString() }}
        </template>
      </Column>
      <Column
        field="net_movement"
        header="Net Movement"
        sortable
        class="text-right"
        style="min-width: 120px"
      >
        <template #body="{ data }">
          {{ data.net_movement?.toLocaleString() }}
        </template>
      </Column>
      <Column
        field="expected_closing"
        header="Expected Closing"
        sortable
        class="text-right"
        style="min-width: 120px"
      >
        <template #body="{ data }">
          {{ data.expected_closing?.toLocaleString() }}
        </template>
      </Column>
      <Column
        field="actual_closing"
        header="Actual Closing"
        sortable
        class="text-right font-bold"
        style="min-width: 120px"
      >
        <template #body="{ data }">
          {{ data.actual_closing?.toLocaleString() }}
        </template>
      </Column>
      <Column
        field="diff_qty"
        header="Diff"
        sortable
        class="text-right"
        style="min-width: 100px"
      >
        <template #body="{ data }">
          <span :class="data.diff_qty !== 0 ? 'text-red-600 font-bold' : ''">
            {{ data.diff_qty?.toLocaleString() }}
          </span>
        </template>
      </Column>

      <template #empty>
        <div
          class="flex flex-column align-items-center justify-content-center py-5"
        >
          <i class="pi pi-inbox text-4xl text-400 mb-2"></i>
          <p class="text-500">Please select a period to view the report.</p>
        </div>
      </template>
    </DataTable>
  </div>
</template>

<style scoped>
  .text-right {
    text-align: right !important;
  }

  .text-center {
    text-align: center !important;
  }

  :deep(.mismatch-row) {
    background-color: #fff1f2 !important;
  }

  :deep(.p-datatable-thead > tr > th) {
    position: sticky;
    top: 0;
    z-index: 1;
    background-color: var(--surface-0);
  }
</style>
