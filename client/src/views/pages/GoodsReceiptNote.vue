<script lang="ts" setup>
  import { ref, onMounted, computed } from 'vue';
  import { FilterMatchMode } from '@primevue/core/api';
  import { PoService } from '@/services/po.service';
  import type { IPoHeader, IPoLine } from '@/interfaces/po.interfaces';
  import { formatDate, formatNumber } from '@/utils/format.utils';
  import Swal from 'sweetalert2';

  const poHeaders = ref<IPoHeader[]>([]);
  const loading = ref(false);
  const errorMsg = ref('');

  const showGrnDialog = ref(false);
  const selectedPo = ref<IPoHeader | null>(null);
  const poLines = ref<IPoLine[]>([]);
  const grnLoading = ref(false);

  const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    po_no: { value: null, matchMode: FilterMatchMode.CONTAINS },
    supplier_name: { value: null, matchMode: FilterMatchMode.CONTAINS },
  });

  onMounted(async () => {
    await loadPendingReceiving();
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

  async function loadPendingReceiving(): Promise<void> {
    loading.value = true;
    errorMsg.value = '';
    try {
      poHeaders.value = await PoService.getPendingReceiving();
    } catch (err: unknown) {
      errorMsg.value = getErrorMessage(err);
    } finally {
      loading.value = false;
    }
  }

  const numberedHeaders = computed(() =>
    poHeaders.value.map((item, index) => ({ ...item, rowNo: index + 1 }))
  );

  async function openGrnDialog(po: IPoHeader): Promise<void> {
    selectedPo.value = po;
    grnLoading.value = true;
    try {
      poLines.value = await PoService.getPoLines(po.po_id);
      showGrnDialog.value = true;
    } catch (err: unknown) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: getErrorMessage(err),
      });
    } finally {
      grnLoading.value = false;
    }
  }

  async function saveGrn(): Promise<void> {
    if (!selectedPo.value) return;

    const hasValidLines = poLines.value.some(l => (l.qty_received || 0) > 0);

    if (!hasValidLines) {
      Swal.fire({
        icon: 'warning',
        title: 'Validation',
        text: 'Please enter qty received for at least one item',
      });
      return;
    }

    grnLoading.value = true;
    try {
      const jsonLines = JSON.stringify(
        poLines.value
          .filter(l => (l.qty_received || 0) > 0)
          .map(l => ({
            po_line_id: l.po_line_id,
            qty_received: l.qty_received || 0,
          }))
      );

      await PoService.updateQtyReceived(selectedPo.value.po_id, jsonLines);

      Swal.fire({
        icon: 'success',
        title: 'Success',
        text: 'Goods Receipt Note saved',
      });

      showGrnDialog.value = false;
      selectedPo.value = null;
      poLines.value = [];
      await loadPendingReceiving();
    } catch (err: unknown) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: getErrorMessage(err),
      });
    } finally {
      grnLoading.value = false;
    }
  }

  function getStatusBadgeSeverity(status: string): string {
    const map: Record<string, string> = {
      ORDERED: 'info',
      PARTIAL: 'warn',
    };
    return map[status] || 'secondary';
  }

  function getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      ORDERED: 'Ordered',
      PARTIAL: 'Partial',
    };
    return map[status] || status;
  }

  function getReceivedPercentage(line: IPoLine): number {
    if (!line.qty_order) return 0;
    return Math.round(((line.qty_received || 0) / line.qty_order) * 100);
  }

  function updateQtyReceived(line: IPoLine, change: number): void {
    const newQty = (line.qty_received || 0) + change;
    line.qty_received = Math.max(0, Math.min(newQty, line.qty_order));
  }
</script>

<template>
  <div class="card">
    <div class="mb-4">
      <h2 class="text-2xl font-bold text-surface-900 dark:text-surface-0">
        Goods Receipt Note (GRN)
      </h2>
      <p class="text-surface-500 mt-1">Record goods received from purchase orders</p>
    </div>

    <Message v-if="errorMsg" severity="error" class="mb-4">
      {{ errorMsg }}
    </Message>

    <template v-if="loading">
      <Skeleton height="400px" />
    </template>
    <template v-else>
      <DataTable
        :value="numberedHeaders"
        :paginator="true"
        :rows="10"
        :rowsPerPageOptions="[5, 10, 20]"
        responsiveLayout="scroll"
        :globalFilterFields="['po_no', 'supplier_name', 'po_status']"
        stateStorage="session"
        stateKey="grn-table-state"
        class="p-datatable-striped"
      >
        <template #header>
          <div class="flex justify-end">
            <IconField>
              <InputIcon class="pi pi-search" />
              <InputText
                v-model="filters['global'].value"
                placeholder="Search..."
              />
            </IconField>
          </div>
        </template>

        <template #empty>No pending POs for receiving</template>
        <template #loading>Loading...</template>

        <Column field="rowNo" header="#" sortable style="min-width: 60px" frozen />
        <Column field="po_no" header="PO No" sortable style="min-width: 120px" frozen />
        <Column field="po_date" header="PO Date" style="min-width: 120px">
          <template #body="{ data }">
            {{ formatDate(data.po_date) }}
          </template>
        </Column>
        <Column field="supplier_name" header="Supplier" sortable style="min-width: 200px" />
        <Column field="due_date" header="Due Date" style="min-width: 120px">
          <template #body="{ data }">
            {{ formatDate(data.due_date) }}
          </template>
        </Column>
        <Column field="po_status" header="Status" sortable style="min-width: 100px">
          <template #body="{ data }">
            <Tag
              :value="getStatusLabel(data.po_status)"
              :severity="getStatusBadgeSeverity(data.po_status)"
            />
          </template>
        </Column>
        <Column header="Action" style="min-width: 100px" frozen alignFrozen="right">
          <template #body="{ data }">
            <Button
              icon="pi pi-file-check"
              rounded
              outlined
              severity="success"
              size="small"
              @click="openGrnDialog(data)"
              title="Record GRN"
            />
          </template>
        </Column>
      </DataTable>
    </template>
  </div>

  <Dialog
    v-model:visible="showGrnDialog"
    header="Record Goods Receipt"
    :modal="true"
    :closable="true"
    class="w-full md:w-4/5"
  >
    <div v-if="grnLoading" class="text-center py-8">
      <ProgressSpinner />
    </div>
    <div v-else-if="selectedPo">
      <div class="mb-6 pb-4 border-b border-surface">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <span class="text-sm text-muted-color">PO No</span>
            <div class="text-lg font-semibold">{{ selectedPo.po_no }}</div>
          </div>
          <div>
            <span class="text-sm text-muted-color">Date</span>
            <div class="text-lg font-semibold">{{ formatDate(selectedPo.po_date) }}</div>
          </div>
          <div>
            <span class="text-sm text-muted-color">Supplier</span>
            <div class="text-lg font-semibold">{{ selectedPo.supplier_name }}</div>
          </div>
          <div>
            <span class="text-sm text-muted-color">Status</span>
            <div class="mt-1">
              <Tag
                :value="getStatusLabel(selectedPo.po_status)"
                :severity="getStatusBadgeSeverity(selectedPo.po_status)"
              />
            </div>
          </div>
        </div>
      </div>

      <div class="mb-4">
        <h3 class="text-lg font-semibold mb-3">Line Items</h3>
        <DataTable :value="poLines" class="p-datatable-sm">
          <Column field="item_code" header="Item Code" style="min-width: 100px" />
          <Column header="Item Name" style="min-width: 200px">
            <template #body="{ data }">
              <div class="text-sm">
                <div class="font-semibold">{{ data.item_name_th }}</div>
                <div class="text-surface-500">{{ data.item_name_en }}</div>
              </div>
            </template>
          </Column>
          <Column field="qty_order" header="Qty Order" bodyClass="text-right" style="min-width: 100px">
            <template #body="{ data }">
              {{ formatNumber(data.qty_order || 0, 0) }}
            </template>
          </Column>
          <Column header="Qty Received" style="min-width: 150px">
            <template #body="{ data }">
              <div class="flex items-center gap-2">
                <Button
                  icon="pi pi-minus"
                  rounded
                  text
                  severity="danger"
                  size="small"
                  @click="updateQtyReceived(data, -1)"
                />
                <InputNumber
                  v-model="data.qty_received"
                  :min="0"
                  :max="data.qty_order"
                  style="width: 80px"
                />
                <Button
                  icon="pi pi-plus"
                  rounded
                  text
                  severity="success"
                  size="small"
                  @click="updateQtyReceived(data, 1)"
                />
              </div>
            </template>
          </Column>
          <Column header="Progress" style="min-width: 120px">
            <template #body="{ data }">
              <ProgressBar
                :value="getReceivedPercentage(data)"
                :showValue="true"
              />
            </template>
          </Column>
          <Column field="unit_price" header="Unit Price" bodyClass="text-right" style="min-width: 100px">
            <template #body="{ data }">
              {{ formatNumber(data.unit_price || 0) }}
            </template>
          </Column>
        </DataTable>
      </div>
    </div>

    <template #footer>
      <Button
        label="Cancel"
        severity="secondary"
        @click="showGrnDialog = false"
      />
      <Button
        label="Save GRN"
        icon="pi pi-check"
        :loading="grnLoading"
        @click="saveGrn"
      />
    </template>
  </Dialog>
</template>
