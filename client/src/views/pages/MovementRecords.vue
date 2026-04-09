<script lang="ts" setup>
  import { ref, onMounted, computed } from 'vue';
  import { FilterMatchMode } from '@primevue/core/api';
  import { StockService } from '@/services/stock.service';
  import type { IStockMovement } from '@/interfaces/stock.interfaces';

  const movements = ref<IStockMovement[]>([]);
  const selectedMovementType = ref<string>('');
  const movementTypes = ref<string[]>([]);

  const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
  });

  const filteredMovements = computed(() => {
    if (!selectedMovementType.value || selectedMovementType.value === 'All') {
      return movements.value;
    }
    return movements.value.filter(
      m => m.movement_type === selectedMovementType.value
    );
  });

  // Get distinct movement types for dropdown
  const movementTypeOptions = computed(() => {
    const types = [
      ...new Set(movements.value.map(m => m.movement_type)),
    ].sort();
    return [
      { label: 'All', value: '' },
      ...types.map(t => ({ label: t, value: t })),
    ];
  });

  // Color mapping for movement types
  function getRowClass(movement: IStockMovement): string {
    const type = movement.movement_type.toUpperCase();
    const colorMap: Record<string, string> = {
      IN: 'bg-green-50',
      RECEIVE: 'bg-green-50',
      OUT: 'bg-red-50',
      ADJUST_OUT: 'bg-red-50',
      ADJUST_IN: 'bg-blue-50',
      ADJUST: 'bg-blue-50',
      RETURN: 'bg-yellow-50',
      TRANSFER: 'bg-purple-50',
    };
    return colorMap[type] || 'bg-surface-50';
  }

  // Severity badge for movement types
  function getMovementSeverity(type: string): string {
    const upperType = type.toUpperCase();
    const severityMap: Record<string, string> = {
      IN: 'success',
      RECEIVE: 'success',
      OUT: 'danger',
      ADJUST_OUT: 'danger',
      ADJUST_IN: 'info',
      ADJUST: 'info',
      RETURN: 'warn',
      TRANSFER: 'secondary',
    };
    return severityMap[upperType] || 'secondary';
  }

  async function loadMovements() {
    try {
      const data = await StockService.getMovementRecords();
      movements.value = data;

      // Extract unique movement types
      const types = [...new Set(data.map(m => m.movement_type))].sort();
      movementTypes.value = types;
    } catch (error) {
      console.error('Failed to load movements:', error);
    }
  }

  onMounted(() => {
    loadMovements();
  });
</script>

<template>
  <div class="card">
    <div class="font-semibold text-xl mb-4">ประวัติการเคลื่อนไหวสต็อก</div>

    <DataTable
      :value="filteredMovements"
      :paginator="true"
      :rows="15"
      :rowsPerPageOptions="[5, 10, 15, 25, 50]"
      v-model:filters="filters"
      filterDisplay="menu"
      :globalFilterFields="[
        'created_by_name',
        'movement_type',
        'item_name_th',
        'item_name_en',
        'reason',
      ]"
      dataKey="movement_id"
      stripedRows
      scrollable
      scrollHeight="65vh"
      tableStyle="min-width: 1200px"
      :rowClass="(data: IStockMovement) => getRowClass(data)"
    >
      <template #header>
        <div class="flex justify-between items-center gap-3">
          <div class="flex gap-2 items-center">
            <label for="movementType" class="text-sm">ประเภทเคลื่อนไหว:</label>
            <Select
              v-model="selectedMovementType"
              :options="movementTypeOptions"
              optionLabel="label"
              optionValue="value"
              class="w-40"
            >
              <template #value="slotProps">
                {{ slotProps.value ? slotProps.value : 'All' }}
              </template>
            </Select>
          </div>
          <div class="flex gap-2">
            <Button icon="pi pi-refresh" rounded text @click="loadMovements" />
            <IconField>
              <InputIcon class="pi pi-search" />
              <InputText
                v-model="filters['global'].value"
                placeholder="ค้นหา..."
              />
            </IconField>
          </div>
        </div>
      </template>

      <template #empty>
        <div class="text-center py-6 text-surface-500">ไม่มีข้อมูล</div>
      </template>

      <Column
        field="created_at"
        :header="'วันที่'"
        style="min-width: 160px"
        sortable
      >
        <template #body="{ data }">
          {{
            new Date(data.created_at).toLocaleString('th-TH', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
            })
          }}
        </template>
      </Column>

      <Column
        field="created_by_name"
        :header="'ผู้สร้าง'"
        style="min-width: 150px"
        sortable
      >
        <template #body="{ data }">
          {{ data.created_by_name || data.created_by }}
        </template>
      </Column>

      <Column
        field="movement_type"
        :header="'ประเภทเคลื่อนไหว'"
        style="min-width: 140px"
        sortable
      >
        <template #body="{ data }">
          <Tag
            :value="data.movement_type"
            :severity="getMovementSeverity(data.movement_type)"
          />
        </template>
      </Column>

      <Column
        field="item_name_th"
        :header="'รายการยา/เวชภัณฑ์'"
        style="min-width: 240px"
        sortable
      >
        <template #body="{ data }">
          <div>
            <div class="font-medium">{{ data.item_name_th }}</div>
            <small class="text-surface-400">{{ data.item_name_en }}</small>
          </div>
        </template>
      </Column>

      <Column
        field="qty_base"
        :header="'จำนวน'"
        style="min-width: 80px"
        align="right"
        sortable
      >
        <template #body="{ data }">
          {{ Number(data.qty_base).toLocaleString('en-US') }}
        </template>
      </Column>

      <Column
        field="reason"
        :header="'เหตุผล'"
        style="min-width: 200px"
        sortable
      >
        <template #body="{ data }">
          {{ data.reason || '-' }}
        </template>
      </Column>
    </DataTable>
  </div>
</template>

<style scoped>
  :deep(.bg-green-50) {
    background-color: rgba(34, 197, 94, 0.06) !important;
  }
  :deep(.bg-red-50) {
    background-color: rgba(239, 68, 68, 0.06) !important;
  }
  :deep(.bg-blue-50) {
    background-color: rgba(59, 130, 246, 0.06) !important;
  }
  :deep(.bg-yellow-50) {
    background-color: rgba(245, 158, 11, 0.06) !important;
  }
  :deep(.bg-purple-50) {
    background-color: rgba(168, 85, 247, 0.06) !important;
  }
</style>
