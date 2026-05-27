<script lang="ts" setup>
  import { computed, onMounted, ref } from 'vue';
  import { FilterMatchMode } from '@primevue/core/api';
  import Swal from 'sweetalert2';
  import { StockService, type IStockOnHand } from '@/services/stock.service';
  import { SpecialDrugClaimService } from '@/services/special-drug-claim.service';
  import { formatNumber, formatSysdatetimeoffset } from '@/utils/format.utils';
  import type {
    ICreateSpecialDrugClaimItemInput,
    ISpecialDrugClaimDetail,
    ISpecialDrugClaimHeader,
    ISpecialDrugClaimItem,
  } from '@/interfaces/special-drug-claim.interfaces';

  interface ICreateLine extends ICreateSpecialDrugClaimItemInput {
    item_code: string;
    item_name_th: string;
    item_name_en: string; // Add this
    usage_unit_name_th?: string;
  }

  const loading = ref(false);
  const claims = ref<ISpecialDrugClaimHeader[]>([]);
  const stockItems = ref<IStockOnHand[]>([]);

  const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    claim_id: { value: null, matchMode: FilterMatchMode.CONTAINS },
    created_by: { value: null, matchMode: FilterMatchMode.CONTAINS },
  });

  const statusFilter = ref('OPEN');
  const statusOptions = ref(['All', 'OPEN', 'CLOSED']);

  const showCreateDialog = ref(false);
  const createReason = ref('');
  const createLines = ref<ICreateLine[]>([]);
  const selectedItemId = ref<number | null>(null);
  const selectedQty = ref<number>(1);

  const showDetailDialog = ref(false);
  const detail = ref<ISpecialDrugClaimDetail | null>(null);
  const detailLoading = ref(false);

  const showReturnDialog = ref(false);
  const returnClaimItemId = ref<number | null>(null);
  const returnItemLabel = ref('');
  const returnRemainingQty = ref(0);
  const returnQty = ref<number>(1);
  const returnReason = ref('');

  const showEditDialog = ref(false);
  const editClaimId = ref<number | null>(null);
  const editReason = ref('');
  const editDatetime = ref<Date | null>(null);
  const editItems = ref<
    {
      claim_item_id: number;
      item_id: number;
      item_code: string | null;
      item_name_th: string | null;
      qty_issued_base: number;
      new_qty_issued_base: number;
      base_unit_name_th: string | null;
    }[]
  >([]);

  const numberedClaims = computed(() => {
    let filtered = claims.value;
    if (statusFilter.value !== 'All') {
      filtered = filtered.filter(c => c.status === statusFilter.value);
    }
    return filtered.map((c, i) => ({ ...c, rowNo: i + 1 }));
  });

  const selectableItems = computed(() => {
    const usedIds = new Set(createLines.value.map(x => x.item_id));
    return stockItems.value
      .filter(s => (s.qty_base ?? 0) > 0 && !usedIds.has(s.item_id))
      .sort((a, b) => a.item_code.localeCompare(b.item_code));
  });

  const selectedStockItem = computed(() => {
    if (!selectedItemId.value) return null;
    return (
      stockItems.value.find(s => s.item_id === selectedItemId.value) || null
    );
  });

  const movementSummaryByItem = computed(() => {
    const map = new Map<number, { withdrawn: number; returned: number }>();
    for (const s of detail.value?.movement_summary || []) {
      map.set(s.item_id, {
        withdrawn: s.qty_withdrawn ?? 0,
        returned: s.qty_returned ?? 0,
      });
    }
    return map;
  });

  const isEditable = computed(() => {
    if (!detail.value || !detail.value.header) return false;
    // Rules:
    // 1. Must be OPEN
    // 2. Lock after return
    if (detail.value.header.status === 'CLOSED') return false;
    return !detail.value.movement_summary.some(m => (m.qty_returned ?? 0) > 0);
  });

  const isClosed = computed(() => {
    return detail.value?.header?.status === 'CLOSED';
  });

  function getRemainingQty(item: ISpecialDrugClaimItem): number {
    if (isClosed.value) return 0; // Cannot return from closed claim
    const summary = movementSummaryByItem.value.get(item.item_id);
    if (!summary) return item.qty_issued_base;
    return Math.max(summary.withdrawn - summary.returned, 0);
  }

  async function loadInitial() {
    loading.value = true;
    try {
      const [claimData, stockData] = await Promise.all([
        SpecialDrugClaimService.getClaims(),
        StockService.getStockStatus(),
      ]);
      claims.value = claimData;
      stockItems.value = stockData;
    } finally {
      loading.value = false;
    }
  }

  onMounted(async () => {
    await loadInitial();
  });

  function resetCreateForm() {
    createReason.value = '';
    createLines.value = [];
    selectedItemId.value = null;
    selectedQty.value = 1;
  }

  function openCreateDialog() {
    resetCreateForm();
    showCreateDialog.value = true;
  }

  function addCreateLine() {
    if (!selectedStockItem.value) return;
    const qty = Number(selectedQty.value || 0);
    if (qty <= 0) return;

    if ((selectedStockItem.value.qty_base ?? 0) < qty) {
      void Swal.fire(
        'Insufficient Stock',
        'Withdrawal quantity exceeds available stock',
        'warning'
      );
      return;
    }

    createLines.value.push({
      item_id: selectedStockItem.value.item_id,
      qty_base: qty,
      item_code: selectedStockItem.value.item_code,
      item_name_th: selectedStockItem.value.item_name_th,
      item_name_en: selectedStockItem.value.item_name_en || '-', // Add this
      usage_unit_name_th: selectedStockItem.value.usage_unit_name_th,
    });

    selectedItemId.value = null;
    selectedQty.value = 1;
  }

  function removeCreateLine(index: number) {
    createLines.value.splice(index, 1);
  }

  async function submitCreate() {
    if (!createReason.value?.trim()) {
      await Swal.fire(
        'Incomplete Data',
        'Please provide a reason for the withdrawal',
        'warning'
      );
      return;
    }
    if (createLines.value.length === 0) {
      await Swal.fire(
        'Incomplete Data',
        'Please add at least one item',
        'warning'
      );
      return;
    }

    try {
      loading.value = true;
      await SpecialDrugClaimService.createClaim({
        reason: createReason.value.trim(),
        items: createLines.value.map(line => ({
          item_id: line.item_id,
          qty_base: line.qty_base,
        })),
      });
      await Swal.fire(
        'Success',
        'Special drug claim saved successfully',
        'success'
      );
      showCreateDialog.value = false;
      await loadInitial();
    } catch (error: any) {
      await Swal.fire(
        'Error',
        error?.response?.data?.message || error?.message || String(error),
        'error'
      );
    } finally {
      loading.value = false;
    }
  }

  async function openDetail(claimId: number) {
    detailLoading.value = true;
    showDetailDialog.value = true;
    detail.value = null;
    try {
      detail.value = await SpecialDrugClaimService.getClaimById(claimId);
    } catch (error: any) {
      await Swal.fire(
        'Error',
        error?.response?.data?.message || error?.message || String(error),
        'error'
      );
      showDetailDialog.value = false;
    } finally {
      detailLoading.value = false;
    }
  }

  function openEditDialog() {
    if (!detail.value || !detail.value.header) return;

    editClaimId.value = detail.value.header.claim_id;
    editReason.value = detail.value.header.reason || '';
    editDatetime.value = detail.value.header.claim_datetime
      ? new Date(detail.value.header.claim_datetime)
      : new Date();

    editItems.value = detail.value.items.map(item => ({
      claim_item_id: item.claim_item_id,
      item_id: item.item_id,
      item_code: item.item_code,
      item_name_th: item.item_name_th,
      qty_issued_base: item.qty_issued_base,
      new_qty_issued_base: item.qty_issued_base,
      base_unit_name_th: item.base_unit_name_th,
    }));

    showEditDialog.value = true;
  }

  async function submitEdit() {
    if (!editClaimId.value) return;

    if (!editReason.value?.trim()) {
      await Swal.fire(
        'Incomplete Data',
        'Please provide a reason for the modification',
        'warning'
      );
      return;
    }

    const adjustments = editItems.value
      .filter(item => item.new_qty_issued_base !== item.qty_issued_base)
      .map(item => ({
        claim_item_id: item.claim_item_id,
        new_qty_issued_base: item.new_qty_issued_base,
      }));

    // Validate stock for increases
    for (const adj of adjustments) {
      const original = editItems.value.find(
        x => x.claim_item_id === adj.claim_item_id
      );
      if (!original) continue;

      const delta = adj.new_qty_issued_base - original.qty_issued_base;
      if (delta > 0) {
        const stock = stockItems.value.find(
          s => s.item_id === original.item_id
        );
        const currentStock = stock?.qty_base || 0;
        if (currentStock < delta) {
          await Swal.fire(
            'Insufficient Stock',
            `Item ${original.item_code} requires an increase of ${delta} but only ${currentStock} is available in stock`,
            'warning'
          );
          return;
        }
      }
    }

    if (
      adjustments.length === 0 &&
      editReason.value.trim() === detail.value?.header?.reason &&
      editDatetime.value?.toISOString() === detail.value?.header?.claim_datetime
    ) {
      showEditDialog.value = false;
      return;
    }

    try {
      loading.value = true;
      await SpecialDrugClaimService.updateClaim(editClaimId.value, {
        claim_datetime: editDatetime.value?.toISOString(),
        reason: editReason.value.trim(),
        adjustments: adjustments.length > 0 ? adjustments : undefined,
      });

      await Swal.fire(
        'Success',
        'Special drug claim modified successfully',
        'success'
      );
      showEditDialog.value = false;

      // Refresh detail and list
      await openDetail(editClaimId.value);
      await loadInitial();
    } catch (error: any) {
      await Swal.fire(
        'Error',
        error?.response?.data?.message || error?.message || String(error),
        'error'
      );
    } finally {
      loading.value = false;
    }
  }

  function openReturnDialog(item: ISpecialDrugClaimItem) {
    const remaining = getRemainingQty(item);
    if (remaining <= 0) return;
    returnClaimItemId.value = item.claim_item_id;
    returnItemLabel.value = `${item.item_name_en || '-'} [${item.item_name_th || ''}]`;
    returnRemainingQty.value = remaining;
    returnQty.value = 1;
    returnReason.value = '';
    showReturnDialog.value = true;
  }

  async function submitReturn() {
    if (!returnClaimItemId.value) return;

    if (!returnReason.value?.trim()) {
      await Swal.fire(
        'Incomplete Data',
        'Please provide a clear reason for the return',
        'warning'
      );
      return;
    }

    const qty = Number(returnQty.value || 0);
    if (qty <= 0) {
      await Swal.fire(
        'Invalid Data',
        'Return quantity must be greater than 0',
        'warning'
      );
      return;
    }
    if (qty > returnRemainingQty.value) {
      await Swal.fire(
        'Invalid Data',
        'Return quantity exceeds the remaining balance',
        'warning'
      );
      return;
    }

    try {
      loading.value = true;
      await SpecialDrugClaimService.returnClaimItem({
        claim_item_id: returnClaimItemId.value,
        qty_return_base: qty,
        reason: returnReason.value.trim(),
      });
      await Swal.fire('Success', 'Medicine returned successfully', 'success');
      showReturnDialog.value = false;

      if (detail.value?.header?.claim_id) {
        detail.value = await SpecialDrugClaimService.getClaimById(
          detail.value.header.claim_id
        );
      }
      await loadInitial();
    } catch (error: any) {
      await Swal.fire(
        'Error',
        error?.response?.data?.message || error?.message || String(error),
        'error'
      );
    } finally {
      loading.value = false;
    }
  }

  async function submitClose() {
    if (!detail.value?.header?.claim_id) return;

    const result = await Swal.fire({
      title: 'Confirm closing this claim?',
      text: 'Once closed, you will not be able to edit or return medicines to prevent stock discrepancies.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Confirm Close',
      cancelButtonText: 'Cancel',
    });

    if (!result.isConfirmed) return;

    try {
      loading.value = true;
      await SpecialDrugClaimService.closeClaim(detail.value.header.claim_id);
      await Swal.fire(
        'Success',
        'Special drug claim closed successfully',
        'success'
      );

      // Refresh detail and list
      await openDetail(detail.value.header.claim_id);
      await loadInitial();
    } catch (error: any) {
      await Swal.fire(
        'Error',
        error?.response?.data?.message || error?.message || String(error),
        'error'
      );
    } finally {
      loading.value = false;
    }
  }
</script>

<template>
  <div class="card">
    <div class="flex justify-between items-center mb-4">
      <div>
        <h2 class="text-2xl font-bold">Special Drug Claim</h2>
        <p class="text-surface-500 mt-1">
          Withdraw / Return records for special medicines
        </p>
      </div>
      <Button
        icon="pi pi-plus"
        label="Create Special Claim"
        @click="openCreateDialog"
      />
    </div>

    <DataTable
      :value="numberedClaims"
      v-model:filters="filters"
      :loading="loading"
      dataKey="claim_id"
      paginator
      :rows="20"
      :rowsPerPageOptions="[10, 20, 50]"
      :globalFilterFields="['claim_id', 'reason', 'created_by']"
      scrollable
      scrollHeight="550px"
      class="p-datatable-sm"
    >
      <template #header>
        <div class="flex justify-between items-center">
          <SelectButton
            v-model="statusFilter"
            :options="statusOptions"
            aria-labelledby="basic"
          />
          <IconField>
            <InputIcon class="pi pi-search" />
            <InputText v-model="filters.global.value" placeholder="Search..." />
          </IconField>
        </div>
      </template>

      <Column field="rowNo" header="#" style="width: 70px" />
      <Column field="claim_id" header="Claim ID" sortable />
      <Column field="status" header="Status" style="width: 100px">
        <template #body="{ data }">
          <Tag
            :severity="data.status === 'CLOSED' ? 'secondary' : 'success'"
            :value="data.status"
          />
        </template>
      </Column>
      <Column field="claim_datetime" header="Claim Date/Time" sortable>
        <template #body="{ data }">
          {{ formatSysdatetimeoffset(data.claim_datetime) }}
        </template>
      </Column>
      <Column field="reason" header="Reason" />
      <Column field="created_by" header="Created By" />
      <Column field="created_at" header="Created At" sortable>
        <template #body="{ data }">
          {{ formatSysdatetimeoffset(data.created_at) }}
        </template>
      </Column>
      <Column header="Actions" style="width: 120px">
        <template #body="{ data }">
          <Button
            icon="pi pi-eye"
            text
            rounded
            @click="openDetail(data.claim_id)"
          />
        </template>
      </Column>
    </DataTable>
  </div>

  <Dialog
    v-model:visible="showCreateDialog"
    modal
    :style="{ width: '850px' }"
    header="Create Special Drug Claim"
  >
    <div class="grid grid-cols-12 gap-3 mb-4">
      <div class="col-span-12">
        <label class="block mb-2 font-medium">Claim Reason</label>
        <Textarea
          v-model="createReason"
          rows="2"
          class="w-full"
          placeholder="Enter reason for special drug claim (Mandatory)"
        />
      </div>

      <div class="col-span-6">
        <label class="block mb-2 font-medium">Select Item</label>
        <Select
          v-model="selectedItemId"
          :options="selectableItems"
          optionLabel="item_name_th"
          optionValue="item_id"
          filter
          class="w-full"
          placeholder="Search and select medicine"
        >
          <template #value="{ value, placeholder }">
            <div v-if="selectedStockItem" class="truncate font-medium">
              {{ selectedStockItem.item_name_en || '-' }} [{{
                selectedStockItem.item_name_th
              }}] (Rem. {{ formatNumber(selectedStockItem.qty_base || 0) }})
            </div>
            <span v-else>{{ placeholder }}</span>
          </template>
          <template #option="{ option }">
            <div class="flex justify-between w-full gap-2">
              <span class="truncate">
                {{ option.item_name_en || '-' }} [{{ option.item_name_th }}]
              </span>
              <span class="text-surface-500 font-bold whitespace-nowrap">
                (Rem. {{ formatNumber(option.qty_base || 0) }})
              </span>
            </div>
          </template>
        </Select>
      </div>

      <div class="col-span-4">
        <label class="block mb-2 font-medium">Qty to Issue</label>
        <div class="flex items-center gap-2">
          <InputNumber
            v-model="selectedQty"
            :min="1"
            showButtons
            buttonLayout="stacked"
            :useGrouping="false"
            :inputStyle="{ width: '120px' }"
            placeholder="Qty"
          />
          <div
            class="text-primary font-bold bg-primary/10 px-2 py-1 rounded border border-primary/20 whitespace-nowrap"
          >
            {{
              selectedStockItem
                ? selectedStockItem.usage_unit_name_th || 'Unit'
                : 'Unit'
            }}
          </div>
        </div>
      </div>

      <div class="col-span-2 flex items-end">
        <Button
          icon="pi pi-plus"
          class="w-full"
          severity="info"
          v-tooltip.top="'Add to list'"
          :disabled="!selectedItemId || !selectedQty"
          @click="addCreateLine"
        />
      </div>
    </div>

    <DataTable :value="createLines" dataKey="item_id" class="p-datatable-sm">
      <Column field="item_code" header="Code" />
      <Column header="Medicine / Item Name">
        <template #body="{ data }">
          {{ data.item_name_en || '-' }} [{{ data.item_name_th }}]
        </template>
      </Column>
      <Column field="qty_base" header="Qty" bodyClass="text-right" />
      <Column field="usage_unit_name_th" header="Unit" />
      <Column header="" style="width: 70px">
        <template #body="{ index }">
          <Button
            icon="pi pi-trash"
            severity="danger"
            text
            rounded
            @click="removeCreateLine(index)"
          />
        </template>
      </Column>
    </DataTable>

    <template #footer>
      <Button
        label="Cancel"
        severity="secondary"
        text
        @click="showCreateDialog = false"
      />
      <Button label="Save Claim" icon="pi pi-check" @click="submitCreate" />
    </template>
  </Dialog>

  <Dialog
    v-model:visible="showDetailDialog"
    modal
    :style="{ width: '980px' }"
    :header="`Claim Detail #${detail?.header?.claim_id || ''}`"
  >
    <div v-if="detailLoading" class="py-8 text-center">
      <ProgressSpinner style="width: 40px; height: 40px" />
    </div>
    <div v-else-if="detail">
      <div class="grid grid-cols-12 gap-3 mb-4">
        <div class="col-span-4">
          <div class="text-surface-500 text-sm">Claim Date/Time</div>
          <div>
            {{ formatSysdatetimeoffset(detail.header?.claim_datetime || '') }}
          </div>
        </div>
        <div class="col-span-4">
          <div class="text-surface-500 text-sm">Created By</div>
          <div>{{ detail.header?.created_by || '-' }}</div>
        </div>
        <div class="col-span-4">
          <div class="text-surface-500 text-sm">Reason</div>
          <div>{{ detail.header?.reason || '-' }}</div>
        </div>
      </div>

      <DataTable
        :value="detail.items"
        dataKey="claim_item_id"
        class="p-datatable-sm"
      >
        <Column field="item_code" header="Code" />
        <Column header="Medicine / Item Name">
          <template #body="{ data }">
            {{ data.item_name_en || '-' }} [{{ data.item_name_th }}]
          </template>
        </Column>
        <Column
          field="qty_issued_base"
          header="Total Issued"
          bodyClass="text-right"
        >
          <template #body="{ data }">
            {{ formatNumber(data.qty_issued_base) }}
          </template>
        </Column>
        <Column header="Rem. Returnable" bodyClass="text-right">
          <template #body="{ data }">
            {{ formatNumber(getRemainingQty(data)) }}
          </template>
        </Column>
        <Column field="base_unit_name_th" header="Unit" />
        <Column header="Return" style="width: 100px">
          <template #body="{ data }">
            <Button
              icon="pi pi-undo"
              text
              rounded
              :disabled="getRemainingQty(data) <= 0"
              @click="openReturnDialog(data)"
            />
          </template>
        </Column>
      </DataTable>
    </div>

    <template #footer>
      <Button
        v-if="detail && isEditable"
        label="Edit Info"
        icon="pi pi-pencil"
        severity="warn"
        @click="openEditDialog"
      />
      <Button
        v-if="detail && !isClosed"
        label="Close Claim"
        icon="pi pi-lock"
        severity="danger"
        @click="submitClose"
      />
      <Button
        label="Close"
        severity="secondary"
        text
        @click="showDetailDialog = false"
      />
    </template>
  </Dialog>

  <Dialog
    v-model:visible="showEditDialog"
    modal
    :style="{ width: '850px' }"
    header="Edit Special Drug Claim"
  >
    <div class="grid grid-cols-12 gap-3 mb-4">
      <div class="col-span-6">
        <label class="block mb-2 font-medium">Claim Date/Time</label>
        <DatePicker
          v-model="editDatetime"
          showTime
          hourFormat="24"
          class="w-full"
        />
      </div>
      <div class="col-span-12">
        <label class="block mb-2 font-medium">Claim Reason</label>
        <Textarea
          v-model="editReason"
          rows="2"
          class="w-full"
          placeholder="Enter reason for adjustment (Mandatory)"
        />
      </div>
    </div>

    <DataTable
      :value="editItems"
      dataKey="claim_item_id"
      class="p-datatable-sm"
    >
      <Column field="item_code" header="Code" />
      <Column header="Medicine / Item Name">
        <template #body="{ data }">
          {{ data.item_name_en || '-' }} [{{ data.item_name_th }}]
        </template>
      </Column>
      <Column
        field="qty_issued_base"
        header="Old Qty"
        bodyClass="text-right font-bold"
      />
      <Column header="New Qty" style="width: 190px">
        <template #body="{ data }">
          <InputNumber
            v-model="data.new_qty_issued_base"
            :min="1"
            showButtons
            buttonLayout="horizontal"
            :useGrouping="false"
            class="w-full"
            inputClass="text-center"
            :inputStyle="{ width: '120px' }"
            incrementButtonIcon="pi pi-plus"
            decrementButtonIcon="pi pi-minus"
          />
        </template>
      </Column>
      <Column field="base_unit_name_th" header="Unit" />
      <Column header="Delta" bodyClass="text-right">
        <template #body="{ data }">
          <span
            :class="
              data.new_qty_issued_base - data.qty_issued_base > 0
                ? 'text-green-600'
                : data.new_qty_issued_base - data.qty_issued_base < 0
                  ? 'text-red-600'
                  : ''
            "
          >
            {{ data.new_qty_issued_base - data.qty_issued_base > 0 ? '+' : ''
            }}{{ data.new_qty_issued_base - data.qty_issued_base }}
          </span>
        </template>
      </Column>
    </DataTable>

    <template #footer>
      <Button
        label="Cancel"
        severity="secondary"
        text
        @click="showEditDialog = false"
      />
      <Button label="Save Changes" icon="pi pi-check" @click="submitEdit" />
    </template>
  </Dialog>

  <Dialog
    v-model:visible="showReturnDialog"
    modal
    :style="{ width: '520px' }"
    header="Return Special Drug"
  >
    <div class="mb-3">
      <div class="text-surface-500 text-sm">Item</div>
      <div class="font-medium">{{ returnItemLabel }}</div>
    </div>
    <div class="mb-3">
      <div class="text-surface-500 text-sm">Rem. Returnable</div>
      <div class="font-medium">{{ formatNumber(returnRemainingQty) }}</div>
    </div>
    <div class="mb-3">
      <label class="block mb-2 font-medium">Return Qty</label>
      <InputNumber
        v-model="returnQty"
        :min="1"
        :max="returnRemainingQty"
        showButtons
        buttonLayout="horizontal"
        :useGrouping="false"
        class="w-full"
        inputClass="text-center"
        :inputStyle="{ width: '120px' }"
        incrementButtonIcon="pi pi-plus"
        decrementButtonIcon="pi pi-minus"
      />
    </div>
    <div class="mb-3">
      <label class="block mb-2 font-medium">Return Reason</label>
      <Textarea
        v-model="returnReason"
        rows="2"
        class="w-full"
        placeholder="Enter return reason (Mandatory)"
      />
    </div>

    <template #footer>
      <Button
        label="Cancel"
        severity="secondary"
        text
        @click="showReturnDialog = false"
      />
      <Button label="Confirm Return" icon="pi pi-check" @click="submitReturn" />
    </template>
  </Dialog>
</template>
