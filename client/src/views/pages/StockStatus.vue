<script lang="ts" setup>
import { ref, onMounted, computed } from 'vue';
import { FilterMatchMode } from '@primevue/core/api';
import * as XLSX from 'xlsx';
import { StockService, type IStockOnHand } from '@/services/stock.service';

const items = ref<IStockOnHand[]>([]);
const loading = ref(false);
const errorMsg = ref('');
const filters = ref({
  global: { value: null, matchMode: FilterMatchMode.CONTAINS },
  item_code: { value: null, matchMode: FilterMatchMode.CONTAINS },
  item_name_en: { value: null, matchMode: FilterMatchMode.CONTAINS },
  item_name_th: { value: null, matchMode: FilterMatchMode.CONTAINS },
});

onMounted(async () => {
  loading.value = true;
  errorMsg.value = '';
  try {
    items.value = await StockService.getStockStatus();
  } catch (err: any) {
    errorMsg.value = err?.response?.data?.message || err?.message || String(err);
    console.error('StockStatus error:', err);
  } finally {
    loading.value = false;
  }
});

const numberedItems = computed(() =>
  items.value.map((item, index) => ({ ...item, rowNo: index + 1 })),
);

function stockStatus(item: IStockOnHand): 'low' | 'high' | 'normal' {
  const qty = item.qty_base ?? 0;
  const min = item.item_min ?? 0;
  const max = item.item_max ?? Infinity;
  if (qty < min) return 'low';
  if (qty > max) return 'high';
  return 'normal';
}

function exportExcel() {
  const data = numberedItems.value.map((item) => ({
    '#': item.rowNo,
    'Item Code': item.item_code,
    'Item Name': item.item_name_en,
    'Item Name Thai': item.item_name_th,
    QTY: item.qty_base ?? 0,
    MIN: item.item_min ?? '-',
    MAX: item.item_max ?? '-',
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Stock Status');
  XLSX.writeFile(wb, 'stock-status.xlsx');
}
</script>

<template>
  <div class="card">
    <div class="flex items-center justify-between mb-4">
      <div>
        <h2 class="text-2xl font-bold text-surface-900 dark:text-surface-0">สถานะสต็อก</h2>
        <p class="text-surface-500 mt-1">ข้อมูลยอดคงเหลือยา/เวชภัณฑ์ทั้งหมด</p>
      </div>
      <Button
        label="Export Excel"
        icon="pi pi-file-excel"
        severity="success"
        @click="exportExcel"
        :disabled="loading || items.length === 0"
      />
    </div>

    <Message v-if="errorMsg" severity="error" class="mb-4">
      <span class="font-semibold">เกิดข้อผิดพลาด: </span>{{ errorMsg }}
    </Message>

    <DataTable
      v-model:filters="filters"
      :value="numberedItems"
      :loading="loading"
      dataKey="item_id"
      paginator
      :rows="20"
      :rowsPerPageOptions="[10, 20, 50, 100]"
      stateStorage="local"
      stateKey="dt-stock-status"
      sortMode="multiple"
      removableSort
      scrollable
      scrollHeight="600px"
      :globalFilterFields="['item_code', 'item_name_en', 'item_name_th']"
      :rowClass="
        (row) => ({
          'bg-red-50 dark:bg-red-950': stockStatus(row) === 'low',
          'bg-yellow-50 dark:bg-yellow-950': stockStatus(row) === 'high',
        })
      "
      class="p-datatable-sm"
    >
      <template #header>
        <div class="flex justify-end">
          <IconField>
            <InputIcon class="pi pi-search" />
            <InputText v-model="filters['global'].value" placeholder="ค้นหา..." />
          </IconField>
        </div>
      </template>

      <template #empty>ไม่พบข้อมูล</template>
      <template #loading>กำลังโหลดข้อมูล...</template>

      <Column field="rowNo" header="#" sortable style="min-width: 60px; max-width: 80px" frozen />

      <Column field="item_code" header="Item Code" sortable style="min-width: 120px" frozen />

      <Column field="item_name_en" header="Item Name" sortable style="min-width: 200px" />

      <Column field="item_name_th" header="Item Name Thai" sortable style="min-width: 200px" />

      <Column field="qty_base" header="QTY" sortable style="min-width: 90px" bodyClass="text-right">
        <template #body="{ data }">
          <span
            :class="{
              'font-bold text-red-600': stockStatus(data) === 'low',
              'font-bold text-yellow-600': stockStatus(data) === 'high',
              'text-green-600': stockStatus(data) === 'normal',
            }"
          >
            {{ data.qty_base ?? 0 }}
          </span>
        </template>
      </Column>

      <Column field="item_min" header="MIN" sortable style="min-width: 80px" bodyClass="text-right">
        <template #body="{ data }">
          {{ data.item_min ?? '-' }}
        </template>
      </Column>

      <Column field="item_max" header="MAX" sortable style="min-width: 80px" bodyClass="text-right">
        <template #body="{ data }">
          {{ data.item_max ?? '-' }}
        </template>
      </Column>

      <Column header="สถานะ" style="min-width: 110px">
        <template #body="{ data }">
          <Tag
            v-if="stockStatus(data) === 'low'"
            severity="danger"
            value="ต่ำกว่า MIN"
            icon="pi pi-arrow-down"
          />
          <Tag
            v-else-if="stockStatus(data) === 'high'"
            severity="warn"
            value="เกิน MAX"
            icon="pi pi-arrow-up"
          />
          <Tag v-else severity="success" value="ปกติ" icon="pi pi-check" />
        </template>
      </Column>
    </DataTable>
  </div>
</template>
