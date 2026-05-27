<script lang="ts" setup>
  import { ref, onMounted, computed } from 'vue';
  import { useRouter } from 'vue-router';
  import { PhysicalCountService } from '@/services/physical-count.service';
  import type { IStockPeriod } from '@/interfaces/physical-count.interfaces';
  import { formatDate, formatSysdatetimeoffset } from '@/utils/format.utils';
  import Swal from 'sweetalert2';

  const router = useRouter();

  // ─── State ───
  const periods = ref<IStockPeriod[]>([]);
  const loading = ref(false);
  const actionLoadingCode = ref<string | null>(null);
  const statusFilter = ref<string | null>(null);

  // Dialog states
  const showCreateDialog = ref(false);
  const showEditDialog = ref(false);

  // Form data
  const newPeriodEnd = ref<Date | null>(null);
  const editingPeriodCode = ref('');
  const editingPeriodEnd = ref<Date | null>(null);

  // ─── Lifecycle ───
  onMounted(() => loadPeriods());

  // ─── API ───
  async function loadPeriods() {
    try {
      loading.value = true;
      periods.value = await PhysicalCountService.getAvailablePeriods();
    } catch (error: any) {
      Swal.fire('Error', error.message || 'Unable to load data', 'error');
    } finally {
      loading.value = false;
    }
  }

  async function handleCreatePeriod() {
    if (!newPeriodEnd.value) {
      Swal.fire('Error', 'Please select the Period end date', 'warning');
      return;
    }
    try {
      loading.value = true;
      await PhysicalCountService.createPeriod(toDateString(newPeriodEnd.value));
      showCreateDialog.value = false;
      await Swal.fire({
        title: 'Success',
        text: 'Period created successfully',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
      });
      await loadPeriods();
    } catch (error: any) {
      Swal.fire('Error', error.message || 'Failed to create Period', 'error');
    } finally {
      loading.value = false;
    }
  }

  // ─── Count Actions ───
  async function handleStartCount(period: IStockPeriod) {
    const confirm = await Swal.fire({
      title: 'Start Stock Count',
      html: `Start stock count for Period <strong>${period.period_code}</strong>?<br>
             <small class="text-gray-500">The system will freeze the current stock levels as a baseline.</small>`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3b82f6',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Start Count',
      cancelButtonText: 'Cancel',
    });
    if (!confirm.isConfirmed) return;

    try {
      actionLoadingCode.value = period.period_code;
      const result = await PhysicalCountService.createPhysicalCount({
        PeriodCode: period.period_code,
      });
      if (result.Status === 1 && result.CountId) {
        router.push({
          name: 'stockCountDetail',
          params: { countId: result.CountId },
        });
      } else {
        Swal.fire('Error', result.Message, 'error');
        await loadPeriods();
      }
    } catch (error: any) {
      Swal.fire('Error', error.message || 'Failed to start count', 'error');
    } finally {
      actionLoadingCode.value = null;
    }
  }

  function navigateToCount(countId: number) {
    router.push({ name: 'stockCountDetail', params: { countId } });
  }

  function openEditDialog(period: any) {
    editingPeriodCode.value = period.period_code;
    editingPeriodEnd.value = period.period_end
      ? new Date(period.period_end)
      : null;
    showEditDialog.value = true;
  }

  async function handleEditPeriod() {
    if (!editingPeriodEnd.value) {
      Swal.fire('Error', 'Please select a new end date', 'warning');
      return;
    }
    try {
      loading.value = true;
      const result = await PhysicalCountService.editPeriodEnd(
        editingPeriodCode.value,
        toDateString(editingPeriodEnd.value)
      );
      if (result.result.Status === 'Success') {
        showEditDialog.value = false;
        await Swal.fire({
          title: 'Success',
          text: result.result.Message,
          icon: 'success',
          timer: 1500,
          showConfirmButton: false,
        });
        await loadPeriods();
      } else {
        Swal.fire('Error', result.result.Message, 'error');
      }
    } catch (error: any) {
      Swal.fire('Error', error.message || 'Failed to update', 'error');
    } finally {
      loading.value = false;
    }
  }

  async function handleDeletePeriod(period: any) {
    const confirm = await Swal.fire({
      title: 'Confirm Deletion',
      html: `Are you sure you want to delete Period <strong>${period.period_code}</strong>?<br>
             <small class="text-gray-500">(Only periods with status OPEN can be deleted)</small>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel',
    });
    if (!confirm.isConfirmed) return;

    try {
      loading.value = true;
      const result = await PhysicalCountService.deletePeriod(
        period.period_code
      );
      if (result.Status === 'Success') {
        await Swal.fire({
          title: 'Success',
          text: result.Message,
          icon: 'success',
          timer: 1500,
          showConfirmButton: false,
        });
        await loadPeriods();
      } else {
        Swal.fire('Error', result.Message, 'error');
      }
    } catch (error: any) {
      Swal.fire('Error', error.message || 'Failed to delete', 'error');
    } finally {
      loading.value = false;
    }
  }

  // ─── Helpers ───
  function toDateString(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  const statusOptions = [
    { label: 'All', value: null },
    { label: 'OPEN', value: 'OPEN' },
    { label: 'COUNTING', value: 'COUNTING' },
    { label: 'PENDING_APPROVAL', value: 'PENDING_APPROVAL' },
    { label: 'SNAPSHOT_DONE', value: 'SNAPSHOT_DONE' },
    { label: 'CLOSED', value: 'CLOSED' },
  ];

  const filteredPeriods = computed(() =>
    statusFilter.value
      ? periods.value.filter(p => p.period_status === statusFilter.value)
      : periods.value
  );

  const statusSeverity = (status: string) => {
    const map: Record<string, string> = {
      OPEN: 'success',
      COUNTING: 'warning',
      PENDING_APPROVAL: 'info',
      SNAPSHOT_DONE: 'secondary',
      CLOSED: 'secondary',
    };
    return map[status] || 'secondary';
  };

  const statusLabel = (status: string) => status;
</script>

<template>
  <div class="grid">
    <div class="col-12">
      <div class="card">
        <!-- Header -->
        <div
          class="flex align-items-center justify-content-between w-full mb-4"
        >
          <div class="flex align-items-center gap-3">
            <i
              class="pi pi-calendar text-amber-400"
              style="font-size: 1.8rem"
            ></i>
            <span class="text-2xl font-bold">Monthly Stock Record</span>
          </div>
          <Button
            icon="pi pi-plus"
            label="Create New Period"
            class="p-button-success mx-2"
            @click="
              showCreateDialog = true;
              newPeriodEnd = null;
            "
          />
        </div>

        <!-- Status Filter -->
        <div class="flex align-items-center gap-2 mb-4">
          <span class="text-sm font-semibold text-gray-600">
            Filter by Status:
          </span>
          <div class="flex gap-2 flex-wrap">
            <Button
              v-for="opt in statusOptions"
              :key="String(opt.value)"
              :label="opt.value ?? 'All '"
              size="small"
              :outlined="statusFilter !== opt.value"
              :severity="
                opt.value === null
                  ? 'secondary'
                  : statusSeverity(opt.value as string)
              "
              @click="statusFilter = opt.value"
            />
          </div>
        </div>

        <!-- Periods Table -->
        <DataTable
          :value="filteredPeriods"
          :loading="loading"
          :rows="10"
          paginator
          responsiveLayout="scroll"
          dataKey="period_code"
          stripedRows
        >
          <template #empty>
            <div class="text-center py-5">
              <i class="pi pi-inbox text-gray-400" style="font-size: 3rem"></i>
              <p class="mt-3 text-gray-500">No Stock Period data found</p>
            </div>
          </template>

          <Column
            field="period_code"
            header="Period Code"
            :sortable="true"
            style="min-width: 10rem"
          />
          <Column
            field="period_start"
            header="Start Date"
            :sortable="true"
            style="min-width: 11rem"
          >
            <template #body="{ data }">
              {{ formatDate(data.period_start as string) }}
            </template>
          </Column>
          <Column
            field="period_end"
            header="End Date"
            :sortable="true"
            style="min-width: 11rem"
          >
            <template #body="{ data }">
              {{ formatDate(data.period_end as string) }}
            </template>
          </Column>
          <Column
            field="period_status"
            header="Status"
            :sortable="true"
            style="min-width: 14rem"
          >
            <template #body="{ data }">
              <Tag
                :value="statusLabel(data.period_status)"
                :severity="statusSeverity(data.period_status)"
              />
            </template>
          </Column>
          <Column
            field="created_by"
            header="Created By"
            style="min-width: 10rem"
          />
          <Column
            field="created_at"
            header="Created At"
            style="min-width: 13rem"
          >
            <template #body="{ data }">
              {{ formatSysdatetimeoffset(data.created_at as string) }}
            </template>
          </Column>
          <Column header="Actions" style="min-width: 18rem">
            <template #body="{ data }">
              <!-- Period management: Edit / Delete (OPEN only) -->
              <template v-if="data.period_status === 'OPEN'">
                <Button
                  icon="pi pi-pencil"
                  label="Edit"
                  size="small"
                  class="p-button-info mr-1"
                  @click="openEditDialog(data)"
                />
                <Button
                  icon="pi pi-trash"
                  label="Delete"
                  size="small"
                  class="p-button-danger mr-1"
                  @click="handleDeletePeriod(data)"
                />
                <Button
                  icon="pi pi-list-check"
                  label="Start Count"
                  size="small"
                  class="p-button-primary"
                  :loading="actionLoadingCode === data.period_code"
                  @click="handleStartCount(data)"
                />
              </template>

              <!-- COUNTING: edit/delete period + continue DRAFT count OR start new (after rejection) -->
              <template v-else-if="data.period_status === 'COUNTING'">
                <Button
                  icon="pi pi-pencil"
                  label="Edit"
                  size="small"
                  class="p-button-info mr-1"
                  @click="openEditDialog(data)"
                />
                <Button
                  icon="pi pi-trash"
                  label="Delete"
                  size="small"
                  class="p-button-danger mr-1"
                  @click="handleDeletePeriod(data)"
                />
                <Button
                  v-if="
                    data.active_count_id && data.active_count_status === 'DRAFT'
                  "
                  icon="pi pi-pencil-square"
                  label="Counting"
                  size="small"
                  class="p-button-warning mr-1"
                  @click="navigateToCount(data.active_count_id)"
                />
                <Button
                  v-else
                  icon="pi pi-list-check"
                  label="Start New Count"
                  size="small"
                  class="p-button-primary mr-1"
                  :loading="actionLoadingCode === data.period_code"
                  @click="handleStartCount(data)"
                />
                <!-- Show rejected count for reference -->
                <Button
                  v-if="
                    data.active_count_id &&
                    data.active_count_status === 'REJECTED'
                  "
                  icon="pi pi-eye"
                  label="View Rejected"
                  size="small"
                  class="p-button-danger p-button-outlined"
                  @click="navigateToCount(data.active_count_id)"
                />
              </template>

              <!-- PENDING_APPROVAL: view/navigate to submitted count -->
              <Button
                v-else-if="
                  data.period_status === 'PENDING_APPROVAL' &&
                  data.active_count_id
                "
                icon="pi pi-eye"
                label="View Submitted"
                size="small"
                class="p-button-secondary"
                @click="navigateToCount(data.active_count_id)"
              />

              <!-- SNAPSHOT_DONE / CLOSED: view approved count detail -->
              <Button
                v-else-if="
                  (data.period_status === 'SNAPSHOT_DONE' ||
                    data.period_status === 'CLOSED') &&
                  data.active_count_id
                "
                icon="pi pi-eye"
                label="View Details"
                size="small"
                class="p-button-secondary"
                @click="navigateToCount(data.active_count_id)"
              />

              <span v-else class="text-gray-400 text-sm">—</span>
            </template>
          </Column>
        </DataTable>
      </div>
    </div>

    <!-- ══════════════════════ Dialog: Create Period ══════════════════════ -->
    <Dialog
      v-model:visible="showCreateDialog"
      header="Create New Stock Period"
      :modal="true"
      :style="{ width: '420px' }"
    >
      <div class="flex flex-column gap-3 pt-2">
        <p class="text-sm text-gray-500 m-0">
          The system will automatically calculate the
          <strong>start date</strong>
          from the previous period.
        </p>
        <div>
          <label class="block text-sm font-semibold mb-2">
            End Date of Period
            <span class="text-red-500">*</span>
          </label>
          <Calendar
            v-model="newPeriodEnd"
            dateFormat="dd/mm/yy"
            :showIcon="true"
            placeholder="Select End Date"
            class="w-full"
          />
        </div>
      </div>
      <template #footer>
        <Button
          label="Cancel"
          icon="pi pi-times"
          class="p-button-text"
          @click="showCreateDialog = false"
        />
        <Button
          label="Create Period"
          icon="pi pi-check"
          class="p-button-success"
          :loading="loading"
          @click="handleCreatePeriod"
        />
      </template>
    </Dialog>

    <!-- ══════════════════════ Dialog: Edit Period ══════════════════════ -->
    <Dialog
      v-model:visible="showEditDialog"
      header="Edit Period End Date"
      :modal="true"
      :style="{ width: '420px' }"
    >
      <div class="flex flex-column gap-3 pt-2">
        <div class="p-3 border-round surface-100">
          <span class="text-sm text-gray-500">Period Code:</span>
          <span class="font-bold">{{ editingPeriodCode }}</span>
        </div>
        <p class="text-sm text-amber-600 m-0">
          ⚠️ Only periods with status

          <strong>OPEN</strong>
          are editable.
        </p>
        <div>
          <label class="block text-sm font-semibold mb-2">
            New End Date
            <span class="text-red-500">*</span>
          </label>
          <Calendar
            v-model="editingPeriodEnd"
            dateFormat="dd/mm/yy"
            :showIcon="true"
            placeholder="Select New End Date"
            class="w-full"
          />
        </div>
      </div>
      <template #footer>
        <Button
          label="Cancel"
          icon="pi pi-times"
          class="p-button-text"
          @click="showEditDialog = false"
        />
        <Button
          label="Save"
          icon="pi pi-check"
          class="p-button-warning"
          :loading="loading"
          @click="handleEditPeriod"
        />
      </template>
    </Dialog>
  </div>
</template>

<style scoped>
  :deep(.p-datatable .p-datatable-thead > tr > th) {
    background-color: #f3f4f6;
    font-weight: 600;
  }
</style>
