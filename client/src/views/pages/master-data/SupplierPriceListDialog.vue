<script setup lang="ts">
  import { computed, ref, watch } from 'vue';
  import Swal from 'sweetalert2';
  import { MasterDataService } from '@/services/master-data.service';
  import type {
    ISupplierMasterData,
    ISupplierPriceListBulkBody,
    ISupplierPriceListItemRow,
    IUnitLookupOption,
  } from '@/interfaces/master-data.interfaces';

  interface IProps {
    modelValue: boolean;
    supplier: ISupplierMasterData | null;
  }

  const props = defineProps<IProps>();
  const emit = defineEmits<{
    (event: 'update:modelValue', value: boolean): void;
    (event: 'saved'): void;
  }>();

  type RowFilter = 'all' | 'selected' | 'active';

  type IRowState = ISupplierPriceListItemRow & {
    unit_price_input: number | null;
    conversion_factor_input: number | null;
    effective_date_input: string;
  };

  const loading = ref(false);
  const saving = ref(false);
  const rows = ref<IRowState[]>([]);
  const units = ref<IUnitLookupOption[]>([]);
  const filterMode = ref<RowFilter>('all');
  const searchText = ref('');
  const submitted = ref(false);

  const visibleRows = computed(() => {
    const kw = searchText.value.trim().toLowerCase();
    return rows.value.filter(row => {
      if (filterMode.value === 'selected' && !row.selected) return false;
      if (filterMode.value === 'active' && !row.is_active) return false;
      if (!kw) return true;
      return (
        row.item_code.toLowerCase().includes(kw) ||
        row.item_name_en?.toLowerCase().includes(kw) ||
        row.item_name_th.toLowerCase().includes(kw)
      );
    });
  });

  const unitOptions = computed(() =>
    units.value.map(unit => ({
      ...unit,
      label: unitLabel(unit),
    }))
  );

  const allVisibleSelected = computed({
    get: () =>
      visibleRows.value.length > 0 &&
      visibleRows.value.every(row => row.selected),
    set: value => {
      visibleRows.value.forEach(row => {
        row.selected = value;
      });
    },
  });

  watch(
    () => props.modelValue,
    async isOpen => {
      if (!isOpen || !props.supplier) return;
      submitted.value = false;
      await loadData(props.supplier.supplier_id);
    }
  );

  function closeDialog(): void {
    emit('update:modelValue', false);
  }

  function getErrorMessage(error: unknown): string {
    if (typeof error === 'object' && error !== null && 'response' in error) {
      const err = error as { response?: { data?: { message?: string } } };
      const msg = err.response?.data?.message;
      if (msg) return msg;
    }
    if (error instanceof Error) return error.message;
    return 'Unexpected error';
  }

  function toDateInput(value: string | null): string {
    if (!value) return '';
    return value.slice(0, 10);
  }

  function displayItemName(row: IRowState): string {
    const en = row.item_name_en?.trim();
    if (en) return `${en} (${row.item_name_th})`;
    return row.item_name_th;
  }

  function unitLabel(unit: IUnitLookupOption): string {
    const en = unit.unit_name_en?.trim() || '';
    const th = unit.unit_name_th?.trim() || '';
    const name = en ? `${en}${th ? ` (${th})` : ''}` : th || '-';
    return `${unit.unit_code} - ${name}`;
  }

  function rowError(row: IRowState, field: string): string {
    if (!submitted.value || !row.selected) return '';
    if (field === 'unit_id' && (!row.unit_id || row.unit_id <= 0)) {
      return 'Unit is required.';
    }
    if (
      field === 'unit_price' &&
      (!row.unit_price_input || row.unit_price_input <= 0)
    ) {
      return 'Unit price must be greater than 0.';
    }
    if (
      field === 'conversion_factor' &&
      (!row.conversion_factor_input || row.conversion_factor_input <= 0)
    ) {
      return 'Conversion factor must be greater than 0.';
    }
    if (field === 'effective_date' && !row.effective_date_input) {
      return 'Effective date is required.';
    }
    return '';
  }

  function isRowValid(row: IRowState): boolean {
    if (!row.selected) return true;
    return (
      !rowError(row, 'unit_id') &&
      !rowError(row, 'unit_price') &&
      !rowError(row, 'conversion_factor') &&
      !rowError(row, 'effective_date')
    );
  }

  function validateRows(): boolean {
    return rows.value.every(isRowValid);
  }

  async function loadData(supplierId: number): Promise<void> {
    loading.value = true;
    try {
      const data =
        await MasterDataService.getSupplierPriceListItems(supplierId);
      units.value = data.units;
      rows.value = data.items.map(item => ({
        ...item,
        unit_price_input: item.unit_price,
        conversion_factor_input: item.conversion_factor ?? 1,
        effective_date_input: toDateInput(item.effective_date),
      }));
    } finally {
      loading.value = false;
    }
  }

  async function save(): Promise<void> {
    if (!props.supplier) return;
    submitted.value = true;

    if (!validateRows()) {
      await Swal.fire({
        icon: 'error',
        title: 'Please fill required fields for selected items.',
      });
      return;
    }

    const payload: ISupplierPriceListBulkBody = {
      rows: rows.value.map(row => ({
        item_id: row.item_id,
        selected: row.selected,
        price_id: row.price_id,
        unit_id: row.selected ? row.unit_id : null,
        unit_price: row.selected ? row.unit_price_input : null,
        conversion_factor: row.selected ? row.conversion_factor_input : null,
        effective_date: row.selected ? row.effective_date_input || null : null,
      })),
    };

    saving.value = true;
    try {
      await MasterDataService.saveSupplierPriceListBulk(
        props.supplier.supplier_id,
        payload
      );
      await Swal.fire({
        icon: 'success',
        title: 'Price list updated successfully.',
        timer: 1400,
        showConfirmButton: false,
      });
      emit('saved');
      closeDialog();
    } catch (error: unknown) {
      const message = getErrorMessage(error);
      await Swal.fire({
        icon: 'error',
        title: 'Operation failed',
        text: message,
      });
    } finally {
      saving.value = false;
    }
  }
</script>

<template>
  <Dialog
    :visible="modelValue"
    modal
    :style="{ width: '95vw', maxWidth: '1280px' }"
    :header="`Supplier Price List - ${supplier?.supplier_code ?? ''} ${supplier?.supplier_name ?? ''}`"
    @update:visible="emit('update:modelValue', $event)"
  >
    <div class="mb-3 text-sm text-surface-500">
      Select items and set unit, unit price, conversion factor, and effective
      date.
    </div>

    <div class="flex items-end flex-wrap gap-2 mb-3">
      <IconField>
        <InputIcon class="pi pi-search" />
        <InputText
          v-model="searchText"
          placeholder="Search by item code or item name"
        />
      </IconField>

      <Select
        v-model="filterMode"
        :options="[
          { label: 'All', value: 'all' },
          { label: 'Selected', value: 'selected' },
          { label: 'Active only', value: 'active' },
        ]"
        optionLabel="label"
        optionValue="value"
        class="w-12rem"
      />

      <div class="flex items-center gap-2 ml-2">
        <Checkbox v-model="allVisibleSelected" binary />
        <label class="text-sm">Select all (visible)</label>
      </div>

      <div class="flex-1" />
      <Button
        label="Reload"
        icon="pi pi-refresh"
        severity="secondary"
        outlined
        :loading="loading"
        @click="supplier && loadData(supplier.supplier_id)"
      />
    </div>

    <DataTable
      :value="visibleRows"
      dataKey="item_id"
      :loading="loading"
      paginator
      :rows="10"
      :rowsPerPageOptions="[10, 20, 50]"
      responsiveLayout="scroll"
      class="p-datatable-sm"
      emptyMessage="No items found"
    >
      <Column header="" style="width: 3rem">
        <template #body="{ data }">
          <Checkbox v-model="data.selected" binary />
        </template>
      </Column>
      <Column field="item_code" header="Item Code" style="width: 9rem" />
      <Column header="Item Name" style="min-width: 18rem">
        <template #body="{ data }">
          {{ displayItemName(data) }}
        </template>
      </Column>
      <Column header="Unit" style="width: 14rem">
        <template #body="{ data }">
          <div class="flex flex-col gap-1">
            <Select
              v-model="data.unit_id"
              :options="unitOptions"
              optionLabel="label"
              optionValue="unit_id"
              placeholder="Select unit"
              filter
              :disabled="!data.selected"
              :invalid="!!rowError(data, 'unit_id')"
            />
            <small v-if="rowError(data, 'unit_id')" class="text-red-500">
              {{ rowError(data, 'unit_id') }}
            </small>
          </div>
        </template>
      </Column>
      <Column header="Unit Price" style="width: 10rem">
        <template #body="{ data }">
          <div class="flex flex-col gap-1">
            <InputNumber
              v-model="data.unit_price_input"
              :min="0"
              :minFractionDigits="2"
              :maxFractionDigits="4"
              mode="decimal"
              :useGrouping="false"
              :disabled="!data.selected"
              :invalid="!!rowError(data, 'unit_price')"
            />
            <small v-if="rowError(data, 'unit_price')" class="text-red-500">
              {{ rowError(data, 'unit_price') }}
            </small>
          </div>
        </template>
      </Column>
      <Column header="Conversion Factor" style="width: 12rem">
        <template #body="{ data }">
          <div class="flex flex-col gap-1">
            <InputNumber
              v-model="data.conversion_factor_input"
              :min="0"
              :minFractionDigits="2"
              :maxFractionDigits="4"
              mode="decimal"
              :useGrouping="false"
              :disabled="!data.selected"
              :invalid="!!rowError(data, 'conversion_factor')"
            />
            <small
              v-if="rowError(data, 'conversion_factor')"
              class="text-red-500"
            >
              {{ rowError(data, 'conversion_factor') }}
            </small>
          </div>
        </template>
      </Column>
      <Column header="Effective Date" style="width: 10rem">
        <template #body="{ data }">
          <div class="flex flex-col gap-1">
            <InputText
              v-model="data.effective_date_input"
              type="date"
              :disabled="!data.selected"
              :invalid="!!rowError(data, 'effective_date')"
            />
            <small v-if="rowError(data, 'effective_date')" class="text-red-500">
              {{ rowError(data, 'effective_date') }}
            </small>
          </div>
        </template>
      </Column>
      <Column header="Active" style="width: 7rem">
        <template #body="{ data }">
          <Tag
            :value="data.is_active ? 'Active' : 'Inactive'"
            :severity="data.is_active ? 'success' : 'secondary'"
          />
        </template>
      </Column>
    </DataTable>

    <template #footer>
      <Button
        label="Cancel"
        severity="secondary"
        outlined
        @click="closeDialog"
      />
      <Button label="Save" icon="pi pi-save" :loading="saving" @click="save" />
    </template>
  </Dialog>
</template>
