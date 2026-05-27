<script lang="ts" setup>
  // ═══════════════════════════════════════════════════════════════════════════
  // Physical Count Page - 6 Step Workflow
  // ═══════════════════════════════════════════════════════════════════════════
  import { ref, onMounted, computed } from 'vue';
  import { FilterMatchMode } from '@primevue/core/api';
  import { PhysicalCountService } from '@/services/physical-count.service';
  import {
    formatDate,
    formatNumber,
    formatSysdatetimeoffset,
  } from '@/utils/format.utils';
  import type {
    IPhysicalCountHeader,
    IPhysicalCountLine,
  } from '@/interfaces/physical-count.interfaces';
  import Swal from 'sweetalert2';

  // ─── State Management ───
  const counts = ref<IPhysicalCountHeader[]>([]);
  const periods = ref<any[]>([]);
  const loading = ref(false);
  const errorMsg = ref('');

  // Dialog states
  const showCreatePeriodDialog = ref(false);
  const showCreateDialog = ref(false);
  const showCountingDialog = ref(false);
  const showComparisonDialog = ref(false);
  const showSubmitDialog = ref(false);
  const showApprovalDialog = ref(false);
  const showRejectDialog = ref(false);

  // Form data - Period Creation
  const periodEnd = ref<Date | null>(null);

  // Form data
  const selectedPeriodCode = ref<string>('');
  const selectedCountId = ref<number | null>(null);
  const selectedCountDetail = ref<IPhysicalCountHeader | null>(null);
  const countLines = ref<IPhysicalCountLine[]>([]);
  const comparisonData = ref<IPhysicalCountLine[]>([]);

  // Approval form
  const approvalNote = ref('');
  const rejectionReason = ref('');

  // Table filtering
  const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    count_no: { value: null, matchMode: FilterMatchMode.CONTAINS },
    count_status: { value: null, matchMode: FilterMatchMode.CONTAINS },
    period_code: { value: null, matchMode: FilterMatchMode.CONTAINS },
  });

  // ─── Load Initial Data ───
  onMounted(async () => {
    await Promise.all([loadPhysicalCounts(), loadAvailablePeriods()]);
  });

  // ─── API Calls ───
  async function loadPhysicalCounts() {
    // GET /physical-count list not available; counts list is managed via StockMonthlyRecord
    counts.value = [];
  }

  async function loadAvailablePeriods() {
    try {
      periods.value = await PhysicalCountService.getAvailablePeriods();
    } catch (error: any) {
      console.error('Failed to load periods:', error);
    }
  }

  async function openCreateDialog() {
    selectedPeriodCode.value = '';
    showCreateDialog.value = true;
  }

  async function openCreatePeriodDialog() {
    periodEnd.value = null;
    showCreatePeriodDialog.value = true;
  }

  async function handleCreatePeriod() {
    if (!periodEnd.value) {
      Swal.fire('Error', 'Please select a Period end date', 'warning');
      return;
    }

    try {
      loading.value = true;
      const formatDate = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      const result = await PhysicalCountService.createPeriod(
        formatDate(periodEnd.value)
      );
      await Swal.fire(
        'Success',
        `Created Period ${result.period_code} successfully`,
        'success'
      );
      showCreatePeriodDialog.value = false;
      // หลังสร้าง Period สำเร็จ อาจต้องเรียก refresh periods list
      // แต่สำหรับตอนนี้ไม่มี periods dropdown ให้ update
    } catch (error: any) {
      Swal.fire('Error', error.message, 'error');
    } finally {
      loading.value = false;
    }
  }

  async function handleCreate() {
    if (!selectedPeriodCode.value) {
      Swal.fire('Error', 'Please select a Period Code', 'warning');
      return;
    }

    try {
      loading.value = true;
      const result = await PhysicalCountService.createPhysicalCount({
        PeriodCode: selectedPeriodCode.value,
      });
      await Swal.fire('Success', result.Message, 'success');
      showCreateDialog.value = false;
      await loadPhysicalCounts();
    } catch (error: any) {
      Swal.fire('Error', error.message, 'error');
    } finally {
      loading.value = false;
    }
  }

  async function openCountingDialog(countId: number) {
    try {
      loading.value = true;
      selectedCountId.value = countId;
      const data = await PhysicalCountService.getComparison(countId);
      selectedCountDetail.value = data.header;
      countLines.value = data.lines;
      showCountingDialog.value = true;
    } catch (error: any) {
      Swal.fire('Error', error.message, 'error');
    } finally {
      loading.value = false;
    }
  }

  async function handleSaveLines() {
    if (!selectedCountId.value) return;

    try {
      loading.value = true;
      const linesToSave = countLines.value.map(line => ({
        item_id: line.item_id,
        qty_counted: line.qty_counted,
        note: line.note ?? '',
      }));

      const result = await PhysicalCountService.saveCountLines(
        selectedCountId.value,
        linesToSave
      );

      await Swal.fire('Success', result.Message, 'success');
      showCountingDialog.value = false;
      await loadPhysicalCounts();
    } catch (error: any) {
      Swal.fire('Error', error.message, 'error');
    } finally {
      loading.value = false;
    }
  }

  async function openComparisonDialog(countId: number) {
    try {
      loading.value = true;
      selectedCountId.value = countId;
      const data = await PhysicalCountService.getComparison(countId);
      selectedCountDetail.value = data.header;
      comparisonData.value = data.lines;
      showComparisonDialog.value = true;
    } catch (error: any) {
      Swal.fire('Error', error.message, 'error');
    } finally {
      loading.value = false;
    }
  }

  async function openSubmitDialog(countId: number) {
    selectedCountId.value = countId;
    approvalNote.value = '';
    showSubmitDialog.value = true;
  }

  async function handleSubmit() {
    if (!selectedCountId.value) return;

    try {
      loading.value = true;
      const result = await PhysicalCountService.submitCount(
        selectedCountId.value
      );

      await Swal.fire('Success', result.Message, 'success');
      showSubmitDialog.value = false;
      await loadPhysicalCounts();
    } catch (error: any) {
      Swal.fire('Error', error.message, 'error');
    } finally {
      loading.value = false;
    }
  }

  async function openApprovalDialog(countId: number) {
    selectedCountId.value = countId;
    approvalNote.value = '';
    showApprovalDialog.value = true;
  }

  async function handleApprove() {
    if (!selectedCountId.value) return;

    try {
      loading.value = true;
      const result = await PhysicalCountService.approveCount(
        selectedCountId.value
      );

      await Swal.fire('Success', result.Message, 'success');
      showApprovalDialog.value = false;
      await loadPhysicalCounts();
    } catch (error: any) {
      Swal.fire('Error', error.message, 'error');
    } finally {
      loading.value = false;
    }
  }

  async function openRejectDialog(countId: number) {
    selectedCountId.value = countId;
    rejectionReason.value = '';
    showRejectDialog.value = true;
  }

  async function handleReject() {
    if (!selectedCountId.value) return;

    if (!rejectionReason.value) {
      Swal.fire('Error', 'Please enter a rejection reason', 'warning');
      return;
    }

    try {
      loading.value = true;
      const result = await PhysicalCountService.rejectCount(
        selectedCountId.value,
        rejectionReason.value
      );

      await Swal.fire('Success', result.Message, 'success');
      showRejectDialog.value = false;
      await loadPhysicalCounts();
    } catch (error: any) {
      Swal.fire('Error', error.message, 'error');
    } finally {
      loading.value = false;
    }
  }

  // ─── Computed ───
  const statusBadgeClass = (status: string) => {
    const statusMap: Record<string, string> = {
      DRAFT: 'bg-slate-100 text-slate-800',
      PENDING_APPROVAL: 'bg-yellow-100 text-yellow-800',
      APPROVED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
    };
    return statusMap[status] || 'bg-gray-100 text-gray-800';
  };

  const statusLabel = (status: string) => {
    const labelMap: Record<string, string> = {
      DRAFT: 'Draft',
      PENDING_APPROVAL: 'Waiting for Approval',
      APPROVED: 'Approved',
      REJECTED: 'Rejected',
    };
    return labelMap[status] || status;
  };

  const diffStatusBadgeClass = (diffStatus: string) => {
    const map: Record<string, string> = {
      เกิน: 'bg-green-100 text-green-800',
      ขาด: 'bg-red-100 text-red-800',
      ตรง: 'bg-blue-100 text-blue-800',
    };
    return map[diffStatus] || 'bg-gray-100 text-gray-800';
  };
</script>

<template>
  <div class="grid">
    <div class="col-12">
      <div class="card">
        <div
          class="flex align-items-center justify-content-between w-full mb-4"
        >
          <span class="text-2xl font-bold">นับสต็อกยา/เวชภัณฑ์</span>
          <div class="flex gap-2">
            <Button
              icon="pi pi-calendar"
              label="สร้าง Period"
              @click="openCreatePeriodDialog"
              class="p-button-info"
            />
            <Button
              icon="pi pi-plus"
              label="สร้างการนับใหม่"
              @click="openCreateDialog"
              class="p-button-success"
            />
          </div>
        </div>

        <!-- Main Table -->
        <DataTable
          :value="counts"
          :loading="loading"
          :filters="filters"
          filterDisplay="menu"
          :rows="10"
          paginator
          responsiveLayout="scroll"
          dataKey="count_id"
          stripedRows
        >
          <template #header>
            <div class="flex align-items-center justify-content-between">
              <span class="p-input-icon-left">
                <i class="pi pi-search"></i>
                <InputText
                  v-model="filters['global'].value"
                  placeholder="ค้นหา..."
                />
              </span>
            </div>
          </template>

          <Column
            field="count_no"
            header="เลขที่นับ"
            :sortable="true"
            style="min-width: 12rem"
          />
          <Column
            field="period_code"
            header="รหัส Period"
            :sortable="true"
            style="min-width: 10rem"
          />
          <Column
            field="period_name"
            header="ชื่อ Period"
            style="min-width: 12rem"
          />
          <Column
            field="count_status"
            header="สถานะ"
            :sortable="true"
            style="min-width: 10rem"
          >
            <template #body="{ data }">
              <span
                :class="[
                  'px-3 py-1 rounded-full text-sm font-semibold',
                  statusBadgeClass(data.count_status),
                ]"
              >
                {{ statusLabel(data.count_status) }}
              </span>
            </template>
          </Column>
          <Column
            field="created_at"
            header="สร้างเมื่อ"
            style="min-width: 12rem"
          >
            <template #body="{ data }">
              {{ formatDate(data.created_at) }}
            </template>
          </Column>
          <Column
            field="created_by"
            header="สร้างโดย"
            style="min-width: 10rem"
          />
          <Column
            header="การกระทำ"
            style="min-width: 20rem; text-align: center"
          >
            <template #body="{ data }">
              <!-- DRAFT: ให้นับ -->
              <Button
                v-if="data.count_status === 'DRAFT'"
                icon="pi pi-edit"
                label="นับยอด"
                @click="openCountingDialog(data.count_id)"
                class="p-button-info p-button-sm mr-2"
              />

              <!-- DRAFT: ดูรายงาน + ส่งขออนุมัติ -->
              <Button
                v-if="data.count_status === 'DRAFT'"
                icon="pi pi-eye"
                label="ดูรายงาน"
                @click="openComparisonDialog(data.count_id)"
                class="p-button-secondary p-button-sm mr-2"
              />
              <Button
                v-if="data.count_status === 'DRAFT'"
                icon="pi pi-send"
                label="ส่งขออนุมัติ"
                @click="openSubmitDialog(data.count_id)"
                class="p-button-success p-button-sm"
              />

              <!-- PENDING_APPROVAL: อนุมัติ/ปฏิเสธ (GROUP_LEAD only) -->
              <Button
                v-if="data.count_status === 'PENDING_APPROVAL'"
                icon="pi pi-check"
                label="อนุมัติ"
                @click="openApprovalDialog(data.count_id)"
                class="p-button-success p-button-sm mr-2"
              />
              <Button
                v-if="data.count_status === 'PENDING_APPROVAL'"
                icon="pi pi-times"
                label="ปฏิเสธ"
                @click="openRejectDialog(data.count_id)"
                class="p-button-danger p-button-sm"
              />

              <!-- APPROVED/REJECTED: ดูรายงาน -->
              <Button
                v-if="['APPROVED', 'REJECTED'].includes(data.count_status)"
                icon="pi pi-eye"
                label="ดูรายงาน"
                @click="openComparisonDialog(data.count_id)"
                class="p-button-secondary p-button-sm"
              />
            </template>
          </Column>

          <template #empty>
            <div class="text-center py-5">
              <i class="pi pi-inbox text-gray-400" style="font-size: 3rem"></i>
              <p class="mt-3 text-gray-500">ไม่พบข้อมูลการนับสต็อก</p>
            </div>
          </template>
        </DataTable>
      </div>
    </div>

    <!-- Stock Periods Table -->
    <div class="col-12">
      <div class="card">
        <span class="text-2xl font-bold">รายการ Stock Periods</span>

        <DataTable
          :value="periods"
          :loading="loading"
          filterDisplay="menu"
          :rows="10"
          paginator
          responsiveLayout="scroll"
          dataKey="period_code"
          stripedRows
          class="mt-4"
        >
          <template #header>
            <div class="flex align-items-center justify-content-between">
              <span class="text-sm text-gray-600">
                รายการ Period ที่สามารถนำไปใช้สร้างการนับสต็อก
              </span>
            </div>
          </template>

          <Column
            field="period_code"
            header="Period Code"
            :sortable="true"
            style="min-width: 12rem"
          />
          <Column
            field="period_start"
            header="วันเริ่มต้น"
            style="min-width: 12rem"
          >
            <template #body="{ data }">
              {{ formatDate(data.period_start as string) }}
            </template>
          </Column>
          <Column
            field="period_end"
            header="วันสิ้นสุด"
            style="min-width: 12rem"
          >
            <template #body="{ data }">
              {{ formatDate(data.period_end as string) }}
            </template>
          </Column>
          <Column field="period_status" header="สถานะ" style="min-width: 10rem">
            <template #body="{ data }">
              <Tag
                :value="data.period_status"
                :severity="
                  data.period_status === 'OPEN'
                    ? 'success'
                    : data.period_status === 'COUNTING'
                      ? 'warning'
                      : data.period_status === 'PENDING_APPROVAL'
                        ? 'info'
                        : data.period_status === 'SNAPSHOT_DONE'
                          ? 'success'
                          : 'secondary'
                "
              />
            </template>
          </Column>
          <Column
            field="created_by"
            header="สร้างโดย"
            style="min-width: 12rem"
          />
          <Column
            field="created_at"
            header="สร้างเมื่อ"
            style="min-width: 14rem"
          >
            <template #body="{ data }">
              {{ formatSysdatetimeoffset(data.created_at) }}
            </template>
          </Column>

          <template #empty>
            <div class="text-center py-5">
              <i class="pi pi-inbox text-gray-400" style="font-size: 3rem"></i>
              <p class="mt-3 text-gray-500">ไม่พบข้อมูล Stock Period</p>
            </div>
          </template>
        </DataTable>
      </div>
    </div>

    <!-- ═════════════════════════════════════════ Dialog: Create Period ═════════════════════════════════════════ -->
    <Dialog
      v-model:visible="showCreatePeriodDialog"
      header="สร้าง Stock Period ใหม่"
      :modal="true"
      :style="{ width: '50vw' }"
    >
      <div class="grid">
        <div class="col-12">
          <label class="block text-sm font-semibold mb-2">
            วันที่สิ้นสุด Period *
          </label>
          <Calendar
            v-model="periodEnd"
            dateFormat="dd/mm/yy"
            :showIcon="true"
            placeholder="เลือกวันที่"
            class="w-full"
          />
        </div>
      </div>
      <template #footer>
        <Button
          label="ยกเลิก"
          icon="pi pi-times"
          @click="showCreatePeriodDialog = false"
          class="p-button-text"
        />
        <Button
          label="สร้าง Period"
          icon="pi pi-check"
          @click="handleCreatePeriod"
          :loading="loading"
          class="p-button-success"
        />
      </template>
    </Dialog>

    <!-- ═════════════════════════════════════════ Dialog: Create ═════════════════════════════════════════ -->
    <Dialog
      v-model:visible="showCreateDialog"
      header="สร้างการนับสต็อกใหม่"
      :modal="true"
      :style="{ width: '50vw' }"
    >
      <div class="grid">
        <div class="col-12">
          <label class="block text-sm font-semibold mb-2">
            เลือก Period Code *
          </label>
          <Select
            v-model="selectedPeriodCode"
            placeholder="เลือก Period Code"
            :options="['2025-01', '2025-02', '2025-03']"
            class="w-full"
          />
        </div>
      </div>
      <template #footer>
        <Button
          label="ยกเลิก"
          icon="pi pi-times"
          @click="showCreateDialog = false"
          class="p-button-text"
        />
        <Button
          label="สร้าง"
          icon="pi pi-check"
          @click="handleCreate"
          :loading="loading"
        />
      </template>
    </Dialog>

    <!-- ═════════════════════════════════════════ Dialog: Counting ═════════════════════════════════════════ -->
    <Dialog
      v-model:visible="showCountingDialog"
      header="บันทึกยอดนับสินค้า"
      :modal="true"
      :style="{ width: '80vw' }"
    >
      <div class="grid mb-4">
        <div class="col-6">
          <p>
            <strong>เลขที่นับ:</strong>
            #{{ selectedCountDetail?.count_id }}
          </p>
        </div>
        <div class="col-6">
          <p>
            <strong>Period:</strong>
            {{ selectedCountDetail?.period_code }}
          </p>
        </div>
      </div>

      <DataTable :value="countLines" stripedRows>
        <Column field="item_code" header="รหัสสินค้า" />
        <Column field="item_name_th" header="ชื่อสินค้า" />
        <Column header="ยอดระบบ" style="width: 8rem">
          <template #body="{ data }">
            {{ formatNumber(data.qty_system) }}
          </template>
        </Column>
        <Column header="ยอดนับ" style="width: 8rem">
          <template #body="{ data }">
            <InputNumber
              v-model="data.qty_counted"
              :min="0"
              :step="1"
              class="w-full"
            />
          </template>
        </Column>
        <Column field="unit_code" header="หน่วย" style="width: 6rem" />
        <Column header="หมายเหตุ" style="width: 12rem">
          <template #body="{ data }">
            <InputText v-model="data.remark" class="w-full" />
          </template>
        </Column>
      </DataTable>

      <template #footer>
        <Button
          label="ยกเลิก"
          icon="pi pi-times"
          @click="showCountingDialog = false"
          class="p-button-text"
        />
        <Button
          label="บันทึก"
          icon="pi pi-check"
          @click="handleSaveLines"
          :loading="loading"
        />
      </template>
    </Dialog>

    <!-- ═════════════════════════════════════════ Dialog: Comparison ═════════════════════════════════════════ -->
    <Dialog
      v-model:visible="showComparisonDialog"
      header="รายงานเปรียบเทียบ (ระบบ vs นับ)"
      :modal="true"
      :style="{ width: '90vw' }"
    >
      <DataTable :value="comparisonData" stripedRows>
        <Column field="item_code" header="รหัสสินค้า" />
        <Column field="item_name_th" header="ชื่อสินค้า" />
        <Column header="ยอดระบบ" style="width: 8rem">
          <template #body="{ data }">
            {{ formatNumber(data.qty_system) }}
          </template>
        </Column>
        <Column header="ยอดนับ" style="width: 8rem">
          <template #body="{ data }">
            {{ formatNumber(data.qty_counted) }}
          </template>
        </Column>
        <Column header="ผลต่าง" style="width: 8rem">
          <template #body="{ data }">
            {{ formatNumber(data.diff_qty) }}
          </template>
        </Column>
        <Column header="สถานะ" style="width: 6rem">
          <template #body="{ data }">
            <span
              :class="[
                'px-2 py-1 rounded-full text-sm font-semibold',
                data.diff_qty > 0
                  ? 'bg-green-100 text-green-800'
                  : data.diff_qty < 0
                    ? 'bg-red-100 text-red-800'
                    : 'bg-blue-100 text-blue-800',
              ]"
            >
              {{
                data.diff_qty > 0
                  ? 'เกิน ' + Math.abs(data.diff_qty)
                  : data.diff_qty < 0
                    ? 'ขาด ' + Math.abs(data.diff_qty)
                    : 'ตรง'
              }}
            </span>
          </template>
        </Column>
        <Column field="unit_code" header="หน่วย" style="width: 6rem" />
        <Column field="remark" header="หมายเหตุ" />
      </DataTable>

      <template #footer>
        <Button
          label="ปิด"
          icon="pi pi-times"
          @click="showComparisonDialog = false"
        />
      </template>
    </Dialog>

    <!-- ═════════════════════════════════════════ Dialog: Submit ═════════════════════════════════════════ -->
    <Dialog
      v-model:visible="showSubmitDialog"
      header="ส่งขออนุมัติการนับสต็อก"
      :modal="true"
      :style="{ width: '50vw' }"
    >
      <div class="grid">
        <div class="col-12">
          <label class="block text-sm font-semibold mb-2">หมายเหตุ</label>
          <Textarea
            v-model="approvalNote"
            rows="3"
            placeholder="เพิ่มหมายเหตุ (ไม่บังคับ)"
            class="w-full"
          />
        </div>
      </div>
      <template #footer>
        <Button
          label="ยกเลิก"
          icon="pi pi-times"
          @click="showSubmitDialog = false"
          class="p-button-text"
        />
        <Button
          label="ส่งขออนุมัติ"
          icon="pi pi-send"
          @click="handleSubmit"
          :loading="loading"
          class="p-button-success"
        />
      </template>
    </Dialog>

    <!-- ═════════════════════════════════════════ Dialog: Approval ═════════════════════════════════════════ -->
    <Dialog
      v-model:visible="showApprovalDialog"
      header="อนุมัติการนับสต็อก"
      :modal="true"
      :style="{ width: '50vw' }"
    >
      <div class="grid">
        <div class="col-12">
          <p class="mb-3 text-sm text-gray-600">
            กำลังจะอนุมัติการนับสต็อกและปรับยอดสินค้า
          </p>
          <label class="block text-sm font-semibold mb-2">หมายเหตุ</label>
          <Textarea
            v-model="approvalNote"
            rows="3"
            placeholder="เพิ่มหมายเหตุ (ไม่บังคับ)"
            class="w-full"
          />
        </div>
      </div>
      <template #footer>
        <Button
          label="ยกเลิก"
          icon="pi pi-times"
          @click="showApprovalDialog = false"
          class="p-button-text"
        />
        <Button
          label="อนุมัติ"
          icon="pi pi-check"
          @click="handleApprove"
          :loading="loading"
          class="p-button-success"
        />
      </template>
    </Dialog>

    <!-- ═════════════════════════════════════════ Dialog: Reject ═════════════════════════════════════════ -->
    <Dialog
      v-model:visible="showRejectDialog"
      header="ปฏิเสธการนับสต็อก"
      :modal="true"
      :style="{ width: '50vw' }"
    >
      <div class="grid">
        <div class="col-12">
          <p class="mb-3 text-sm text-red-600">
            ⚠️ การปฏิเสธจะส่งกลับให้นับซ้ำ กรุณากรอกเหตุผล
          </p>
          <label class="block text-sm font-semibold mb-2">
            เหตุผลการปฏิเสธ *
          </label>
          <Textarea
            v-model="rejectionReason"
            rows="4"
            placeholder="กรอกเหตุผลการปฏิเสธ..."
            class="w-full"
          />
        </div>
      </div>
      <template #footer>
        <Button
          label="ยกเลิก"
          icon="pi pi-times"
          @click="showRejectDialog = false"
          class="p-button-text"
        />
        <Button
          label="ปฏิเสธ"
          icon="pi pi-times"
          @click="handleReject"
          :loading="loading"
          class="p-button-danger"
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

  :deep(.p-button) {
    font-size: 0.875rem;
    padding: 0.5rem 1rem;
  }
</style>
