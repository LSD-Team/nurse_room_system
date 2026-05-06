<script lang="ts" setup>
  import { ref, onMounted, computed } from 'vue';
  import { FilterMatchMode } from '@primevue/core/api';
  import { GrService } from '@/services/gr.service';
  import type { IGrHeaderList, IGrDetail } from '@/interfaces/gr.interfaces';
  import type { IPoHeader } from '@/interfaces/po.interfaces';
  import { formatDate, formatNumber } from '@/utils/format.utils';
  import Swal from 'sweetalert2';

  // ─── State: Tab 1 - View Existing GRs ───
  const grHeaders = ref<IGrHeaderList[]>([]);
  const grLoading = ref(false);
  const grError = ref('');
  const selectedGrStatusFilter = ref<string>('DRAFT'); // Default to DRAFT

  const grFilters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    gr_no: { value: null, matchMode: FilterMatchMode.CONTAINS },
    supplier_name: { value: null, matchMode: FilterMatchMode.CONTAINS },
  });

  // Detail dialog
  const showDetailDialog = ref(false);
  const selectedGr = ref<IGrDetail | null>(null);
  const detailLoading = ref(false);
  const grQtyToReceive = ref<Record<number, number>>({}); // Map of line_id -> qty_to_receive

  // ─── State: Tab 2 - Create New GR ───
  const poHeaders = ref<IPoHeader[]>([]);
  const poLoading = ref(false);
  const poError = ref('');

  const poFilters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    po_no: { value: null, matchMode: FilterMatchMode.CONTAINS },
    supplier_name: { value: null, matchMode: FilterMatchMode.CONTAINS },
  });

  const showCreateDialog = ref(false);
  const selectedPo = ref<IPoHeader | null>(null);
  const poLines = ref<any[]>([]); // Changed to hold pending items
  const createDialogLoading = ref(false);
  const createFormNote = ref('');
  const qtyToReceive = ref<Record<number, number>>({}); // Map of item_id -> qty to receive

  onMounted(async () => {
    await loadGrList();
    await loadAvailablePos();
  });

  // ═══════════════════════════════════════════════════════════════
  // TAB 1: View Existing GRs
  // ═══════════════════════════════════════════════════════════════

  async function loadGrList(): Promise<void> {
    grLoading.value = true;
    grError.value = '';
    try {
      grHeaders.value = await GrService.getGrHeaders();
    } catch (err: unknown) {
      grError.value = getErrorMessage(err);
    } finally {
      grLoading.value = false;
    }
  }

  const numberedGrHeaders = computed(() =>
    grHeaders.value.map((item, index) => ({ ...item, rowNo: index + 1 }))
  );

  const filteredGrHeaders = computed(() => {
    if (!selectedGrStatusFilter.value) return numberedGrHeaders.value;
    return numberedGrHeaders.value.filter(
      item => item.status === selectedGrStatusFilter.value
    );
  });

  const countDraft = computed(
    () => numberedGrHeaders.value.filter(item => item.status === 'DRAFT').length
  );

  const countConfirmed = computed(
    () =>
      numberedGrHeaders.value.filter(item => item.status === 'CONFIRMED').length
  );

  const countCancelled = computed(
    () =>
      numberedGrHeaders.value.filter(item => item.status === 'CANCELLED').length
  );

  async function openGrDetailDialog(gr: IGrHeaderList): Promise<void> {
    detailLoading.value = true;
    grQtyToReceive.value = {}; // Reset
    try {
      selectedGr.value = await GrService.getGrDetail(gr.gr_id);
      // Initialize qty_to_receive with current qty_receive
      if (selectedGr.value?.lines) {
        selectedGr.value.lines.forEach(line => {
          grQtyToReceive.value[line.gr_line_id] = line.qty_receive || 0;
        });
      }
      showDetailDialog.value = true;
    } catch (err: unknown) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: getErrorMessage(err),
      });
    } finally {
      detailLoading.value = false;
    }
  }

  async function confirmGr(): Promise<void> {
    if (!selectedGr.value?.header) return;

    // Close dialog first so alert is visible
    showDetailDialog.value = false;

    const confirmed = await Swal.fire({
      icon: 'warning',
      title: 'Confirm GR',
      text: `ยืนยันการรับของ GR No. ${selectedGr.value.header.gr_no}?`,
      showCancelButton: true,
      confirmButtonText: 'ยืนยัน',
      cancelButtonText: 'ยกเลิก',
    });

    if (!confirmed.isConfirmed) {
      selectedGr.value = null;
      return;
    }

    detailLoading.value = true;
    try {
      await GrService.confirmGr(selectedGr.value.header.gr_id);

      await Swal.fire({
        icon: 'success',
        title: 'Success',
        text: 'GR confirmed successfully',
      });

      selectedGr.value = null;
      await loadGrList();
    } catch (err: unknown) {
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: getErrorMessage(err),
      });
    } finally {
      detailLoading.value = false;
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // TAB 2: Create New GR (from PO)
  // ═══════════════════════════════════════════════════════════════

  async function loadAvailablePos(): Promise<void> {
    poLoading.value = true;
    poError.value = '';
    try {
      poHeaders.value = await GrService.getAvailablePos();
    } catch (err: unknown) {
      poError.value = getErrorMessage(err);
    } finally {
      poLoading.value = false;
    }
  }

  const numberedPoHeaders = computed(() =>
    poHeaders.value.map((item, index) => ({ ...item, rowNo: index + 1 }))
  );

  async function openCreateDialog(po: IPoHeader): Promise<void> {
    selectedPo.value = po;
    createFormNote.value = '';
    qtyToReceive.value = {}; // Reset quantities
    createDialogLoading.value = true;
    try {
      // Fetch pending items from this specific PO
      poLines.value = await GrService.getPendingItems(po.po_id);
      // Initialize qty_to_receive with qty_remaining
      poLines.value.forEach(line => {
        qtyToReceive.value[line.item_id] = line.qty_remaining || 0;
      });
      showCreateDialog.value = true;
    } catch (err: unknown) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: getErrorMessage(err),
      });
    } finally {
      createDialogLoading.value = false;
    }
  }

  async function saveGr(): Promise<void> {
    if (!selectedPo.value) return;

    // Build jsonLines from qtyToReceive
    const jsonLines = poLines.value
      .filter(line => (qtyToReceive.value[line.item_id] || 0) > 0)
      .map(line => ({
        item_id: line.item_id,
        qty: qtyToReceive.value[line.item_id] || 0,
      }));

    if (jsonLines.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Warning',
        text: 'Please specify quantity to receive for at least one item',
      });
      return;
    }

    createDialogLoading.value = true;
    try {
      const result = await GrService.createGr(
        selectedPo.value.po_id,
        JSON.stringify(jsonLines),
        createFormNote.value
      );

      Swal.fire({
        icon: 'success',
        title: 'Success',
        text: `GR Created: ${result.gr_no}`,
      });

      showCreateDialog.value = false;
      selectedPo.value = null;
      poLines.value = [];
      createFormNote.value = '';
      qtyToReceive.value = {};
      await loadGrList();
      await loadAvailablePos();
    } catch (err: unknown) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: getErrorMessage(err),
      });
    } finally {
      createDialogLoading.value = false;
    }
  }

  function getGrStatusSeverity(status: string): string {
    const map: Record<string, string> = {
      DRAFT: 'warn',
      CONFIRMED: 'success',
      CANCELLED: 'danger',
    };
    return map[status] || 'secondary';
  }

  function getPoStatusSeverity(status: string): string {
    const map: Record<string, string> = {
      ORDERED: 'info',
      PARTIAL: 'warn',
    };
    return map[status] || 'secondary';
  }

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
</script>

<template>
  <div class="card">
    <div class="mb-4">
      <h2 class="text-2xl font-bold text-surface-900 dark:text-surface-0">
        Goods Receipt Note (GRN)
      </h2>
      <p class="text-surface-500 mt-1">
        Manage goods receiving with real GR workflow
      </p>
    </div>

    <!-- Tabs -->
    <TabView>
      <!-- TAB 1: View Existing GRs -->
      <TabPanel header="View GRs" leftIcon="pi pi-list" value="0">
        <Message v-if="grError" severity="error" class="mb-4">
          {{ grError }}
        </Message>

        <template v-if="grLoading">
          <Skeleton height="400px" />
        </template>
        <template v-else>
          <!-- Status Filter Buttons -->
          <div class="mb-4 flex gap-2 flex-wrap items-center">
            <span class="text-sm font-semibold">Filter by Status:</span>
            <Button
              label="ALL"
              :variant="
                selectedGrStatusFilter === '' ? 'contained' : 'outlined'
              "
              size="small"
              @click="selectedGrStatusFilter = ''"
            />
            <Button
              label="DRAFT"
              :variant="
                selectedGrStatusFilter === 'DRAFT' ? 'contained' : 'outlined'
              "
              size="small"
              @click="selectedGrStatusFilter = 'DRAFT'"
            >
              <template #icon>
                <span class="mr-1">{{ countDraft }}</span>
              </template>
            </Button>
            <Button
              label="CONFIRMED"
              :variant="
                selectedGrStatusFilter === 'CONFIRMED'
                  ? 'contained'
                  : 'outlined'
              "
              size="small"
              @click="selectedGrStatusFilter = 'CONFIRMED'"
            >
              <template #icon>
                <span class="mr-1">{{ countConfirmed }}</span>
              </template>
            </Button>
            <Button
              label="CANCELLED"
              :variant="
                selectedGrStatusFilter === 'CANCELLED'
                  ? 'contained'
                  : 'outlined'
              "
              size="small"
              @click="selectedGrStatusFilter = 'CANCELLED'"
            >
              <template #icon>
                <span class="mr-1">{{ countCancelled }}</span>
              </template>
            </Button>
          </div>

          <DataTable
            :value="filteredGrHeaders"
            :paginator="true"
            :rows="10"
            :rowsPerPageOptions="[5, 10, 20]"
            responsiveLayout="scroll"
            :globalFilterFields="['gr_no', 'supplier_name', 'status']"
            stateStorage="session"
            stateKey="gr-list-table"
            class="p-datatable-striped"
          >
            <template #header>
              <div class="flex justify-end">
                <IconField>
                  <InputIcon class="pi pi-search" />
                  <InputText
                    v-model="grFilters['global'].value"
                    placeholder="Search..."
                  />
                </IconField>
              </div>
            </template>

            <template #empty>No GRs found</template>
            <template #loading>Loading...</template>

            <Column
              field="rowNo"
              header="#"
              sortable
              style="min-width: 60px"
              frozen
            />
            <Column
              field="gr_no"
              header="GR No"
              sortable
              style="min-width: 120px"
              frozen
            />
            <Column field="gr_date" header="Date" style="min-width: 120px">
              <template #body="{ data }">
                {{ formatDate(data.gr_date) }}
              </template>
            </Column>
            <Column
              field="supplier_name"
              header="Supplier"
              sortable
              style="min-width: 200px"
            />
            <Column
              field="po_no"
              header="PO No"
              sortable
              style="min-width: 100px"
            />
            <Column
              field="status"
              header="Status"
              sortable
              style="min-width: 100px"
            >
              <template #body="{ data }">
                <Tag
                  :value="data.status"
                  :severity="getGrStatusSeverity(data.status)"
                />
              </template>
            </Column>
            <Column
              field="created_by"
              header="Created By"
              style="min-width: 120px"
            />
            <Column
              header="Action"
              style="min-width: 100px"
              frozen
              alignFrozen="right"
            >
              <template #body="{ data }">
                <Button
                  icon="pi pi-eye"
                  rounded
                  outlined
                  size="small"
                  @click="openGrDetailDialog(data)"
                  title="View Detail"
                />
              </template>
            </Column>
          </DataTable>
        </template>
      </TabPanel>

      <!-- TAB 2: Create New GR -->
      <TabPanel header="Create GR" leftIcon="pi pi-plus" value="1">
        <Message v-if="poError" severity="error" class="mb-4">
          {{ poError }}
        </Message>

        <template v-if="poLoading">
          <Skeleton height="400px" />
        </template>
        <template v-else>
          <DataTable
            :value="numberedPoHeaders"
            :paginator="true"
            :rows="10"
            :rowsPerPageOptions="[5, 10, 20]"
            responsiveLayout="scroll"
            :globalFilterFields="['po_no', 'supplier_name']"
            stateStorage="session"
            stateKey="po-list-table"
            class="p-datatable-striped"
          >
            <template #header>
              <div class="flex justify-end">
                <IconField>
                  <InputIcon class="pi pi-search" />
                  <InputText
                    v-model="poFilters['global'].value"
                    placeholder="Search..."
                  />
                </IconField>
              </div>
            </template>

            <template #empty>No pending POs for receiving</template>
            <template #loading>Loading...</template>

            <Column
              field="rowNo"
              header="#"
              sortable
              style="min-width: 60px"
              frozen
            />
            <Column
              field="po_no"
              header="PO No"
              sortable
              style="min-width: 120px"
              frozen
            />
            <Column field="po_date" header="PO Date" style="min-width: 120px">
              <template #body="{ data }">
                {{ formatDate(data.po_date) }}
              </template>
            </Column>
            <Column
              field="supplier_name"
              header="Supplier"
              sortable
              style="min-width: 200px"
            />
            <Column field="due_date" header="Due Date" style="min-width: 120px">
              <template #body="{ data }">
                {{ formatDate(data.due_date) }}
              </template>
            </Column>
            <Column
              field="po_status"
              header="Status"
              sortable
              style="min-width: 100px"
            >
              <template #body="{ data }">
                <Tag
                  :value="data.po_status"
                  :severity="getPoStatusSeverity(data.po_status)"
                />
              </template>
            </Column>
            <Column
              header="Action"
              style="min-width: 100px"
              frozen
              alignFrozen="right"
            >
              <template #body="{ data }">
                <Button
                  icon="pi pi-arrow-right"
                  rounded
                  outlined
                  severity="info"
                  size="small"
                  @click="openCreateDialog(data)"
                  title="Create GR"
                />
              </template>
            </Column>
          </DataTable>
        </template>
      </TabPanel>
    </TabView>
  </div>

  <!-- Create GR Dialog -->
  <Dialog
    v-model:visible="showCreateDialog"
    header="Create Goods Receipt"
    :modal="true"
    :closable="true"
    class="w-full md:w-4/5"
  >
    <div v-if="createDialogLoading" class="text-center py-8">
      <ProgressSpinner />
    </div>
    <template v-else-if="selectedPo">
      <div class="mb-6 pb-4 border-b border-surface">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <span class="text-sm text-muted-color">PO No</span>
            <div class="text-lg font-semibold">{{ selectedPo.po_no }}</div>
          </div>
          <div>
            <span class="text-sm text-muted-color">Date</span>
            <div class="text-lg font-semibold">
              {{ formatDate(selectedPo.po_date) }}
            </div>
          </div>
          <div>
            <span class="text-sm text-muted-color">Supplier</span>
            <div class="text-lg font-semibold">
              {{ selectedPo.supplier_name }}
            </div>
          </div>
          <div>
            <span class="text-sm text-muted-color">Status</span>
            <Tag
              :value="selectedPo.status"
              :severity="getPoStatusSeverity(selectedPo.status)"
            />
          </div>
        </div>
      </div>

      <!-- Note -->
      <div class="mb-4">
        <label class="block font-semibold mb-2">Remark (Optional)</label>
        <Textarea
          v-model="createFormNote"
          rows="3"
          placeholder="Add any remarks about this GR..."
          class="w-full"
        />
      </div>

      <!-- Lines Table with Quantity Input -->
      <div class="mb-4">
        <h4 class="font-semibold mb-3">
          Items to Receive - Specify Quantities
        </h4>
        <p class="text-sm text-surface-500 mb-2">
          Enter the quantity you want to receive for each item
        </p>
        <DataTable :value="poLines" class="p-datatable-sm">
          <Column
            field="item_code"
            header="Item Code"
            style="min-width: 100px"
          />
          <Column
            field="item_name_th"
            header="Name (TH)"
            style="min-width: 150px"
          />
          <Column
            field="qty_remaining"
            header="Pending Qty"
            style="min-width: 100px"
          >
            <template #body="{ data }">
              {{ formatNumber(data.qty_remaining || 0, 2) }}
            </template>
          </Column>
          <Column field="unit_name_th" header="Unit" style="min-width: 100px">
            <template #body="{ data }">
              {{ data.unit_name_th || '-' }}
            </template>
          </Column>
          <Column header="Qty to Receive" style="min-width: 120px">
            <template #body="{ data }">
              <InputNumber
                v-model="qtyToReceive[data.item_id]"
                :min="0"
                :max="data.qty_remaining || 0"
                :maxFractionDigits="4"
                class="w-full"
              />
            </template>
          </Column>
          <Column
            field="unit_price"
            header="Unit Price"
            style="min-width: 100px"
          >
            <template #body="{ data }">
              ฿{{ formatNumber(data.unit_price || 0) }}
            </template>
          </Column>
        </DataTable>
      </div>
    </template>

    <template #footer>
      <div
        v-if="!createDialogLoading && selectedPo"
        class="flex gap-2 justify-end"
      >
        <Button
          label="Cancel"
          icon="pi pi-times"
          @click="showCreateDialog = false"
        />
        <Button
          label="Create GR"
          icon="pi pi-check"
          severity="success"
          @click="saveGr"
          :loading="createDialogLoading"
        />
      </div>
    </template>
  </Dialog>

  <!-- GR Detail Dialog -->
  <Dialog
    v-model:visible="showDetailDialog"
    header="GR Detail"
    :modal="true"
    :closable="true"
    class="w-full md:w-4/5"
  >
    <div v-if="detailLoading" class="text-center py-8">
      <ProgressSpinner />
    </div>
    <template v-else-if="selectedGr?.header">
      <!-- Header Info -->
      <div class="mb-6 pb-4 border-b border-surface">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <span class="text-sm text-muted-color">GR No</span>
            <div class="text-lg font-semibold">
              {{ selectedGr.header.gr_no }}
            </div>
          </div>
          <div>
            <span class="text-sm text-muted-color">Date</span>
            <div class="text-lg font-semibold">
              {{ formatDate(selectedGr.header.gr_date) }}
            </div>
          </div>
          <div>
            <span class="text-sm text-muted-color">Supplier</span>
            <div class="text-lg font-semibold">
              {{ selectedGr.header.supplier_name }}
            </div>
          </div>
          <div>
            <span class="text-sm text-muted-color">PO No</span>
            <div class="text-lg font-semibold">
              {{ selectedGr.header.po_no }}
            </div>
          </div>
          <div>
            <span class="text-sm text-muted-color">Status</span>
            <Tag
              :value="selectedGr.header.status"
              :severity="getGrStatusSeverity(selectedGr.header.status)"
            />
          </div>
          <div>
            <span class="text-sm text-muted-color">Created By</span>
            <div class="text-lg font-semibold">
              {{ selectedGr.header.created_by }}
            </div>
          </div>
        </div>
        <div v-if="selectedGr.header.note" class="mt-4">
          <span class="text-sm text-muted-color">Note</span>
          <div class="text-base">{{ selectedGr.header.note }}</div>
        </div>
      </div>

      <!-- Lines -->
      <div class="mb-4">
        <h4 class="font-semibold mb-3">Items Received</h4>
        <DataTable :value="selectedGr.lines" class="p-datatable-sm">
          <Column field="item_code" header="Code" style="min-width: 100px" />
          <Column
            field="item_name_th"
            header="Name (TH)"
            style="min-width: 150px"
          />
          <Column
            field="item_name_en"
            header="Name (EN)"
            style="min-width: 150px"
          />
          <Column field="qty_receive" header="Qty" style="min-width: 80px">
            <template #body="{ data }">
              {{ formatNumber(data.qty_receive || 0, 2) }}
            </template>
          </Column>
          <Column header="Qty to Receive" style="min-width: 140px">
            <template #body="{ data }">
              <!-- Show as read-only in confirm dialog (cannot edit) -->
              {{ formatNumber(grQtyToReceive[data.gr_line_id] || 0, 2) }}
            </template>
          </Column>
          <Column
            field="unit_price"
            header="Unit Price"
            style="min-width: 100px"
          >
            <template #body="{ data }">
              ฿{{ formatNumber(data.unit_price || 0) }}
            </template>
          </Column>
          <Column field="total_price" header="Total" style="min-width: 100px">
            <template #body="{ data }">
              ฿{{ formatNumber(data.total_price || 0) }}
            </template>
          </Column>
        </DataTable>
      </div>
    </template>

    <template #footer>
      <div
        v-if="!detailLoading && selectedGr?.header"
        class="flex gap-2 justify-end items-center"
      >
        <Button
          label="Close"
          icon="pi pi-times"
          @click="showDetailDialog = false"
        />
        <template v-if="selectedGr.header.status === 'DRAFT'">
          <Button
            label="Confirm GR"
            icon="pi pi-check"
            severity="success"
            @click="confirmGr"
            :loading="detailLoading"
          />
        </template>
        <template v-else>
          <span class="text-sm text-muted-color">
            (Cannot confirm: GR is in {{ selectedGr.header.status }} status)
          </span>
        </template>
      </div>
    </template>
  </Dialog>
</template>
