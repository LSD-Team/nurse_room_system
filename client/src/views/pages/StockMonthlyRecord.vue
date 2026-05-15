<script lang="ts" setup>
  import { ref, onMounted, computed } from 'vue';
  import { PhysicalCountService } from '@/services/physical-count.service';
  import { formatDate, formatSysdatetimeoffset } from '@/utils/format.utils';
  import Swal from 'sweetalert2';

  // ─── State ───
  const periods = ref<any[]>([]);
  const loading = ref(false);
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
      Swal.fire('ข้อผิดพลาด', error.message || 'ไม่สามารถโหลดข้อมูลได้', 'error');
    } finally {
      loading.value = false;
    }
  }

  async function handleCreatePeriod() {
    if (!newPeriodEnd.value) {
      Swal.fire('ข้อผิดพลาด', 'กรุณาเลือกวันที่สิ้นสุด Period', 'warning');
      return;
    }
    try {
      loading.value = true;
      await PhysicalCountService.createPeriod(toDateString(newPeriodEnd.value));
      showCreateDialog.value = false;
      await Swal.fire({ title: 'สำเร็จ', text: 'สร้าง Period สำเร็จ', icon: 'success', timer: 1500, showConfirmButton: false });
      await loadPeriods();
    } catch (error: any) {
      Swal.fire('ข้อผิดพลาด', error.message || 'สร้าง Period ไม่สำเร็จ', 'error');
    } finally {
      loading.value = false;
    }
  }

  function openEditDialog(period: any) {
    editingPeriodCode.value = period.period_code;
    editingPeriodEnd.value = period.period_end ? new Date(period.period_end) : null;
    showEditDialog.value = true;
  }

  async function handleEditPeriod() {
    if (!editingPeriodEnd.value) {
      Swal.fire('ข้อผิดพลาด', 'กรุณาเลือกวันที่สิ้นสุดใหม่', 'warning');
      return;
    }
    try {
      loading.value = true;
      const result = await PhysicalCountService.editPeriodEnd(
        editingPeriodCode.value,
        toDateString(editingPeriodEnd.value),
      );
      if (result.result.Status === 'Success') {
        showEditDialog.value = false;
        await Swal.fire({ title: 'สำเร็จ', text: result.result.Message, icon: 'success', timer: 1500, showConfirmButton: false });
        await loadPeriods();
      } else {
        Swal.fire('ข้อผิดพลาด', result.result.Message, 'error');
      }
    } catch (error: any) {
      Swal.fire('ข้อผิดพลาด', error.message || 'แก้ไขไม่สำเร็จ', 'error');
    } finally {
      loading.value = false;
    }
  }

  async function handleDeletePeriod(period: any) {
    const confirm = await Swal.fire({
      title: 'ยืนยันการลบ',
      html: `ต้องการลบ Period <strong>${period.period_code}</strong> ใช่หรือไม่?<br>
             <small class="text-gray-500">(ลบได้เฉพาะสถานะ OPEN เท่านั้น)</small>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'ลบ',
      cancelButtonText: 'ยกเลิก',
    });
    if (!confirm.isConfirmed) return;

    try {
      loading.value = true;
      const result = await PhysicalCountService.deletePeriod(period.period_code);
      if (result.Status === 'Success') {
        await Swal.fire({ title: 'สำเร็จ', text: result.Message, icon: 'success', timer: 1500, showConfirmButton: false });
        await loadPeriods();
      } else {
        Swal.fire('ข้อผิดพลาด', result.Message, 'error');
      }
    } catch (error: any) {
      Swal.fire('ข้อผิดพลาด', error.message || 'ลบไม่สำเร็จ', 'error');
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
    { label: 'ทั้งหมด', value: null },
    { label: 'OPEN — เปิด', value: 'OPEN' },
    { label: 'COUNTING — กำลังนับ', value: 'COUNTING' },
    { label: 'PENDING_APPROVAL — รออนุมัติ', value: 'PENDING_APPROVAL' },
    { label: 'SNAPSHOT_DONE — บันทึกแล้ว', value: 'SNAPSHOT_DONE' },
    { label: 'CLOSED — ปิดแล้ว', value: 'CLOSED' },
  ];

  const filteredPeriods = computed(() =>
    statusFilter.value
      ? periods.value.filter((p) => p.period_status === statusFilter.value)
      : periods.value,
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

  const statusLabel = (status: string) => {
    const map: Record<string, string> = {
      OPEN: 'OPEN — เปิด',
      COUNTING: 'COUNTING — กำลังนับ',
      PENDING_APPROVAL: 'PENDING_APPROVAL — รออนุมัติ',
      SNAPSHOT_DONE: 'SNAPSHOT_DONE — บันทึกแล้ว',
      CLOSED: 'CLOSED — ปิดแล้ว',
    };
    return map[status] || status;
  };
</script>

<template>
  <div class="grid">
    <div class="col-12">
      <div class="card">

        <!-- Header -->
        <div class="flex align-items-center justify-content-between w-full mb-4">
          <div class="flex align-items-center gap-3">
            <i class="pi pi-calendar text-amber-400" style="font-size: 1.8rem"></i>
            <span class="text-2xl font-bold">บันทึก Stock ประจำเดือน</span>
          </div>
          <Button
            icon="pi pi-plus"
            label="สร้าง Period ใหม่"
            class="p-button-success"
            @click="showCreateDialog = true; newPeriodEnd = null"
          />
        </div>

        <!-- Status Filter -->
        <div class="flex align-items-center gap-2 mb-4">
          <span class="text-sm font-semibold text-gray-600">กรองตามสถานะ:</span>
          <div class="flex gap-2 flex-wrap">
            <Button
              v-for="opt in statusOptions"
              :key="String(opt.value)"
              :label="opt.value ?? 'ทั้งหมด'"
              size="small"
              :outlined="statusFilter !== opt.value"
              :severity="opt.value === null ? 'secondary' : statusSeverity(opt.value as string)"
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
              <p class="mt-3 text-gray-500">ไม่พบข้อมูล Stock Period</p>
            </div>
          </template>

          <Column field="period_code" header="Period Code" :sortable="true" style="min-width: 10rem" />
          <Column field="period_start" header="วันเริ่มต้น" :sortable="true" style="min-width: 11rem">
            <template #body="{ data }">
              {{ formatDate(data.period_start as string) }}
            </template>
          </Column>
          <Column field="period_end" header="วันสิ้นสุด" :sortable="true" style="min-width: 11rem">
            <template #body="{ data }">
              {{ formatDate(data.period_end as string) }}
            </template>
          </Column>
          <Column field="period_status" header="สถานะ" :sortable="true" style="min-width: 14rem">
            <template #body="{ data }">
              <Tag
                :value="statusLabel(data.period_status)"
                :severity="statusSeverity(data.period_status)"
              />
            </template>
          </Column>
          <Column field="created_by" header="สร้างโดย" style="min-width: 10rem" />
          <Column field="created_at" header="สร้างเมื่อ" style="min-width: 13rem">
            <template #body="{ data }">
              {{ formatSysdatetimeoffset(data.created_at as string) }}
            </template>
          </Column>
          <Column header="การกระทำ" style="min-width: 12rem; text-align: center">
            <template #body="{ data }">
              <template v-if="data.period_status === 'OPEN'">
                <Button
                  icon="pi pi-pencil"
                  label="แก้ไข"
                  size="small"
                  class="p-button-info mr-2"
                  @click="openEditDialog(data)"
                />
                <Button
                  icon="pi pi-trash"
                  label="ลบ"
                  size="small"
                  class="p-button-danger"
                  @click="handleDeletePeriod(data)"
                />
              </template>
              <span v-else class="text-gray-400 text-sm">—</span>
            </template>
          </Column>
        </DataTable>
      </div>
    </div>

    <!-- ══════════════════════ Dialog: สร้าง Period ══════════════════════ -->
    <Dialog
      v-model:visible="showCreateDialog"
      header="สร้าง Stock Period ใหม่"
      :modal="true"
      :style="{ width: '420px' }"
    >
      <div class="flex flex-column gap-3 pt-2">
        <p class="text-sm text-gray-500 m-0">
          ระบบจะคำนวณ <strong>วันเริ่มต้น</strong> จาก Period ก่อนหน้าให้อัตโนมัติ
        </p>
        <div>
          <label class="block text-sm font-semibold mb-2">วันที่สิ้นสุด Period <span class="text-red-500">*</span></label>
          <Calendar
            v-model="newPeriodEnd"
            dateFormat="dd/mm/yy"
            :showIcon="true"
            placeholder="เลือกวันที่สิ้นสุด"
            class="w-full"
          />
        </div>
      </div>
      <template #footer>
        <Button label="ยกเลิก" icon="pi pi-times" class="p-button-text" @click="showCreateDialog = false" />
        <Button
          label="สร้าง Period"
          icon="pi pi-check"
          class="p-button-success"
          :loading="loading"
          @click="handleCreatePeriod"
        />
      </template>
    </Dialog>

    <!-- ══════════════════════ Dialog: แก้ไข Period ══════════════════════ -->
    <Dialog
      v-model:visible="showEditDialog"
      header="แก้ไขวันสิ้นสุด Period"
      :modal="true"
      :style="{ width: '420px' }"
    >
      <div class="flex flex-column gap-3 pt-2">
        <div class="p-3 border-round surface-100">
          <span class="text-sm text-gray-500">Period Code: </span>
          <span class="font-bold">{{ editingPeriodCode }}</span>
        </div>
        <p class="text-sm text-amber-600 m-0">
          ⚠️ แก้ไขได้เฉพาะ Period ที่มีสถานะ <strong>OPEN</strong> เท่านั้น
        </p>
        <div>
          <label class="block text-sm font-semibold mb-2">วันที่สิ้นสุดใหม่ <span class="text-red-500">*</span></label>
          <Calendar
            v-model="editingPeriodEnd"
            dateFormat="dd/mm/yy"
            :showIcon="true"
            placeholder="เลือกวันที่สิ้นสุดใหม่"
            class="w-full"
          />
        </div>
      </div>
      <template #footer>
        <Button label="ยกเลิก" icon="pi pi-times" class="p-button-text" @click="showEditDialog = false" />
        <Button
          label="บันทึก"
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
