<script lang="ts" setup>
  import { ref, computed, onMounted } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import { PhysicalCountService } from '@/services/physical-count.service';
  import type { IPhysicalCountHeader, IPhysicalCountLineEdit } from '@/interfaces/physical-count.interfaces';
  import { formatDate, formatSysdatetimeoffset } from '@/utils/format.utils';
  import Swal from 'sweetalert2';

  const route = useRoute();
  const router = useRouter();

  const countId = computed(() => Number(route.params.countId));

  // ─── State ───
  const header = ref<IPhysicalCountHeader | null>(null);
  const editableLines = ref<EditableLine[]>([]);
  const loading = ref(false);
  const saving = ref(false);
  const submitting = ref(false);
  const searchQuery = ref('');
  const showOnlyDiff = ref(false);

  // ─── Types ───
  interface EditableLine {
    line_id: number;
    item_id: number;
    item_code: string;
    item_name_th: string;
    item_name_en: string | null;
    unit_name_th: string | null;
    item_min: number | null;
    item_max: number | null;
    qty_system: number;
    snapshot_prev_qty: number;
    received_qty: number;
    issued_qty: number;
    editQtyCounted: number;
    editNote: string;
  }

  // ─── Computed ───
  const isEditable = computed(() => header.value?.count_status === 'DRAFT');

  const filteredLines = computed(() => {
    let result = editableLines.value;
    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase();
      result = result.filter(
        (l) => l.item_code.toLowerCase().includes(q) || l.item_name_th.toLowerCase().includes(q),
      );
    }
    if (showOnlyDiff.value) {
      result = result.filter((l) => l.editQtyCounted - l.qty_system !== 0);
    }
    return result;
  });

  function getDiffQty(line: EditableLine) {
    return line.editQtyCounted - line.qty_system;
  }

  function getDiffStatus(diff: number): string {
    if (diff > 0) return 'เกิน';
    if (diff < 0) return 'ขาด';
    return 'ตรง';
  }

  function getDiffSeverity(diff: number): string {
    if (diff > 0) return 'success';
    if (diff < 0) return 'danger';
    return 'secondary';
  }

  const countStatusLabel: Record<string, string> = {
    DRAFT: 'กำลังนับ',
    SUBMITTED: 'รออนุมัติ',
    APPROVED: 'อนุมัติแล้ว',
    REJECTED: 'ถูกปฏิเสธ',
  };

  const countStatusSeverity: Record<string, string> = {
    DRAFT: 'warning',
    SUBMITTED: 'info',
    APPROVED: 'success',
    REJECTED: 'danger',
  };

  // ─── Lifecycle ───
  onMounted(() => loadData());

  // ─── API ───
  async function loadData() {
    try {
      loading.value = true;
      const result = await PhysicalCountService.getComparison(countId.value);
      header.value = result.header;
      editableLines.value = result.lines.map((l) => ({
        line_id: l.line_id,
        item_id: l.item_id,
        item_code: l.item_code,
        item_name_th: l.item_name_th,
        item_name_en: l.item_name_en,
        unit_name_th: l.unit_name_th,
        item_min: l.item_min,
        item_max: l.item_max,
        qty_system: l.qty_system,
        snapshot_prev_qty: l.snapshot_prev_qty,
        received_qty: l.received_qty,
        issued_qty: l.issued_qty,
        editQtyCounted: l.qty_counted,
        editNote: l.note ?? '',
      }));
    } catch (error: any) {
      Swal.fire('ข้อผิดพลาด', error.message || 'ไม่สามารถโหลดข้อมูลได้', 'error');
    } finally {
      loading.value = false;
    }
  }

  function handleAutoFill() {
    editableLines.value.forEach((l) => {
      l.editQtyCounted = l.qty_system;
    });
  }

  async function handleSave() {
    try {
      saving.value = true;
      const lines: IPhysicalCountLineEdit[] = editableLines.value.map((l) => ({
        item_id: l.item_id,
        qty_counted: l.editQtyCounted,
        note: l.editNote ?? '',  // send '' if cleared (SP02 uses ISNULL so '' clears properly)
      }));
      const result = await PhysicalCountService.saveCountLines(countId.value, lines);
      if (result.Status === 1) {
        Swal.fire({
          title: 'บันทึกสำเร็จ',
          text: `บันทึกยอดนับ ${result.UpdatedRows ?? 0} รายการแล้ว`,
          icon: 'success',
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        Swal.fire('ข้อผิดพลาด', result.Message, 'error');
      }
    } catch (error: any) {
      Swal.fire('ข้อผิดพลาด', error.message || 'บันทึกไม่สำเร็จ', 'error');
    } finally {
      saving.value = false;
    }
  }

  async function handleSubmit() {
    const hasCounted = editableLines.value.some((l) => l.editQtyCounted > 0);
    if (!hasCounted) {
      Swal.fire('แจ้งเตือน', 'ยังไม่มีการบันทึกยอดนับ กรุณาบันทึกยอดก่อนส่งอนุมัติ', 'warning');
      return;
    }

    const confirm = await Swal.fire({
      title: 'ยืนยันส่งขออนุมัติ',
      html: `ส่งการนับ stock สำหรับ Period <strong>${header.value?.period_code}</strong> ให้ GROUP_LEAD อนุมัติใช่หรือไม่?<br>
             <small class="text-amber-600">⚠️ หลังส่งแล้วจะไม่สามารถแก้ไขได้</small>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3b82f6',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'ส่งขออนุมัติ',
      cancelButtonText: 'ยกเลิก',
    });
    if (!confirm.isConfirmed) return;

    try {
      submitting.value = true;
      const result = await PhysicalCountService.submitCount(countId.value);
      if (result.Status === 1) {
        await Swal.fire({
          title: 'ส่งสำเร็จ',
          text: 'ส่งขออนุมัติสำเร็จ ระบบส่ง Email แจ้ง GROUP_LEAD แล้ว',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false,
        });
        router.push({ name: 'stockMonthlyRecord' });
      } else {
        Swal.fire('ข้อผิดพลาด', result.Message, 'error');
      }
    } catch (error: any) {
      Swal.fire('ข้อผิดพลาด', error.message || 'ส่งอนุมัติไม่สำเร็จ', 'error');
    } finally {
      submitting.value = false;
    }
  }
</script>

<template>
  <div v-if="loading" class="flex justify-content-center align-items-center" style="min-height: 300px">
    <ProgressSpinner />
  </div>

  <div v-else class="grid">
    <!-- Back Button + Breadcrumb -->
    <div class="col-12">
      <Button
        icon="pi pi-arrow-left"
        label="กลับ"
        class="p-button-text p-button-plain mb-3"
        @click="router.push({ name: 'stockMonthlyRecord' })"
      />
    </div>

    <!-- Header Card -->
    <div class="col-12" v-if="header">
      <div class="card mb-0">
        <div class="flex align-items-start justify-content-between flex-wrap gap-3">
          <div>
            <div class="flex align-items-center gap-3 mb-2">
              <i class="pi pi-calendar text-amber-400" style="font-size: 1.6rem"></i>
              <span class="text-2xl font-bold">บันทึกการนับ Stock</span>
              <Tag
                :value="countStatusLabel[header.count_status] || header.count_status"
                :severity="countStatusSeverity[header.count_status] || 'secondary'"
              />
            </div>
            <div class="flex flex-wrap gap-4 text-sm text-gray-600">
              <span><strong>Period:</strong> {{ header.period_code }}</span>
              <span><strong>ช่วงเวลา:</strong> {{ formatDate(header.period_start) }} – {{ formatDate(header.period_end) }}</span>
              <span><strong>สร้างโดย:</strong> {{ header.created_by_name || header.created_by }}</span>
              <span><strong>สร้างเมื่อ:</strong> {{ formatSysdatetimeoffset(header.created_at) }}</span>
              <span v-if="header.submitted_by"><strong>ส่งโดย:</strong> {{ header.submitted_by_name || header.submitted_by }} เมื่อ {{ formatSysdatetimeoffset(header.submitted_at!) }}</span>
              <span v-if="header.approved_by"><strong>อนุมัติโดย:</strong> {{ header.approved_by_name || header.approved_by }} เมื่อ {{ formatSysdatetimeoffset(header.approved_at!) }}</span>
            </div>
            <!-- Rejection reason -->
            <div v-if="header.count_status === 'REJECTED' && header.rejected_reason"
                 class="mt-2 p-2 border-round border-1 border-red-300 bg-red-50 text-red-700 text-sm">
              <i class="pi pi-times-circle mr-2"></i>
              <strong>เหตุผลที่ถูกปฏิเสธ:</strong> {{ header.rejected_reason }}
            </div>
          </div>

          <!-- Action buttons -->
          <div v-if="isEditable" class="flex gap-2">
            <Button
              icon="pi pi-save"
              label="บันทึกยอดนับ"
              class="p-button-success"
              :loading="saving"
              @click="handleSave"
            />
            <Button
              icon="pi pi-send"
              label="ส่งขออนุมัติ"
              class="p-button-primary"
              :loading="submitting"
              @click="handleSubmit"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Count Lines Table -->
    <div class="col-12">
      <div class="card">
        <!-- Toolbar -->
        <div class="flex align-items-center justify-content-between flex-wrap gap-3 mb-4">
          <span class="text-lg font-bold">รายการยา / วัสดุ ({{ filteredLines.length }} รายการ)</span>
          <div class="flex align-items-center gap-3 flex-wrap">
            <Button
              v-if="isEditable"
              icon="pi pi-copy"
              label="ยอดนับจริงอัตโนมัติ"
              class="p-button-outlined p-button-secondary"
              size="small"
              v-tooltip.top="'คัดลอกยอดในระบบมาใส่ยอดนับจริงทุกรายการ'"
              @click="handleAutoFill"
            />
            <div class="flex align-items-center gap-2">
              <Checkbox v-model="showOnlyDiff" :binary="true" inputId="showDiff" />
              <label for="showDiff" class="text-sm cursor-pointer">แสดงเฉพาะรายการที่มีผลต่าง</label>
            </div>
            <IconField iconPosition="left">
              <InputIcon class="pi pi-search" />
              <InputText
                v-model="searchQuery"
                placeholder="ค้นหารหัส / ชื่อยา..."
                size="small"
              />
            </IconField>
          </div>
        </div>

        <DataTable
          :value="filteredLines"
          :rows="20"
          paginator
          responsiveLayout="scroll"
          dataKey="line_id"
          stripedRows
          scrollable
          scrollHeight="60vh"
        >
          <template #empty>
            <div class="text-center py-5 text-gray-400">ไม่พบรายการ</div>
          </template>

          <Column field="item_code" header="รหัส" :sortable="true" frozen style="min-width: 8rem; background: white" />
          <Column field="item_name_th" header="ชื่อรายการ" :sortable="true" frozen style="min-width: 20rem; background: white">
            <template #body="{ data }">
              <div>
                <div>{{ data.item_name_th }}</div>
                <div v-if="data.item_name_en" class="text-xs text-gray-400 mt-1">{{ data.item_name_en }}</div>
              </div>
            </template>
          </Column>
          <Column field="unit_name_th" header="หน่วย" style="min-width: 6rem">
            <template #body="{ data }">{{ data.unit_name_th || '-' }}</template>
          </Column>
          <Column header="Min / Max" style="min-width: 8rem; text-align: center">
            <template #body="{ data }">
              <span class="font-mono text-xs">
                {{ data.item_min ?? '-' }} / {{ data.item_max ?? '-' }}
              </span>
            </template>
          </Column>
          <Column field="snapshot_prev_qty" header="Snapshot ก่อนหน้า" :sortable="true" style="min-width: 10rem; text-align: right">
            <template #body="{ data }">
              <span class="font-mono">{{ data.snapshot_prev_qty.toFixed(0) }}</span>
            </template>
          </Column>
          <Column field="received_qty" header="รับเข้า (period)" :sortable="true" style="min-width: 9rem; text-align: right">
            <template #body="{ data }">
              <span class="font-mono text-green-600">+{{ data.received_qty.toFixed(0) }}</span>
            </template>
          </Column>
          <Column field="issued_qty" header="ใช้ออก (period)" :sortable="true" style="min-width: 9rem; text-align: right">
            <template #body="{ data }">
              <span class="font-mono text-red-500">-{{ data.issued_qty.toFixed(0) }}</span>
            </template>
          </Column>
          <Column field="qty_system" header="ยอดระบบ" :sortable="true" style="min-width: 9rem; text-align: right">
            <template #body="{ data }">
              <span class="font-mono">{{ data.qty_system.toFixed(2) }}</span>
            </template>
          </Column>
          <Column header="ยอดนับจริง *" style="min-width: 11rem">
            <template #body="{ data }">
              <InputNumber
                v-if="isEditable"
                v-model="data.editQtyCounted"
                :min="0"
                :max-fraction-digits="4"
                :min-fraction-digits="0"
                :use-grouping="false"
                size="small"
                class="w-full"
                inputClass="text-right font-mono"
              />
              <span v-else class="font-mono">{{ data.editQtyCounted.toFixed(2) }}</span>
            </template>
          </Column>
          <Column header="ผลต่าง" style="min-width: 9rem; text-align: right">
            <template #body="{ data }">
              <Tag
                :value="`${getDiffQty(data) > 0 ? '+' : ''}${getDiffQty(data).toFixed(2)} ${getDiffStatus(getDiffQty(data))}`"
                :severity="getDiffSeverity(getDiffQty(data))"
                class="font-mono"
              />
            </template>
          </Column>
          <Column header="หมายเหตุ" style="min-width: 14rem">
            <template #body="{ data }">
              <InputText
                v-if="isEditable"
                v-model="data.editNote"
                placeholder="หมายเหตุ..."
                size="small"
                class="w-full"
              />
              <span v-else class="text-gray-600">{{ data.editNote || '-' }}</span>
            </template>
          </Column>
        </DataTable>

        <!-- Bottom action bar (visible when editable) -->
        <div v-if="isEditable" class="flex justify-content-end gap-2 mt-4 pt-3 border-top-1 surface-border">
          <Button
            icon="pi pi-save"
            label="บันทึกยอดนับ"
            class="p-button-success"
            :loading="saving"
            @click="handleSave"
          />
          <Button
            icon="pi pi-send"
            label="ส่งขออนุมัติ"
            class="p-button-primary"
            :loading="submitting"
            @click="handleSubmit"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
  :deep(.p-datatable .p-datatable-thead > tr > th) {
    background-color: #f3f4f6;
    font-weight: 600;
  }
  :deep(.p-inputnumber-input) {
    width: 100%;
  }
</style>
