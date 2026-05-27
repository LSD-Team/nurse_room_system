<script lang="ts" setup>
  import { ref, computed, onMounted } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import { PhysicalCountService } from '@/services/physical-count.service';
  import type {
    IPhysicalCountHeader,
    IPhysicalCountLineEdit,
  } from '@/interfaces/physical-count.interfaces';
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
  const approving = ref(false);
  const rejecting = ref(false);
  const showRejectDialog = ref(false);
  const rejectReason = ref('');
  const searchQuery = ref('');
  const showOnlyDiff = ref(false);

  // ─── Back navigation: 'approval' → stockCountApproval, else → stockMonthlyRecord ───
  const backRoute = computed(() =>
    route.query.from === 'approval'
      ? { name: 'stockCountApproval' }
      : { name: 'stockMonthlyRecord' }
  );

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
  const isSubmitted = computed(
    () => header.value?.count_status === 'SUBMITTED'
  );

  const filteredLines = computed(() => {
    let result = editableLines.value;
    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase();
      result = result.filter(
        l =>
          l.item_code.toLowerCase().includes(q) ||
          l.item_name_th.toLowerCase().includes(q)
      );
    }
    if (showOnlyDiff.value) {
      result = result.filter(l => l.editQtyCounted - l.qty_system !== 0);
    }
    return result;
  });

  function getDiffQty(line: EditableLine) {
    return line.editQtyCounted - line.qty_system;
  }

  function getDiffStatus(diff: number): string {
    if (diff > 0) return 'Surplus';
    if (diff < 0) return 'Shortage';
    return 'Exact';
  }

  function getDiffSeverity(diff: number): string {
    if (diff > 0) return 'success';
    if (diff < 0) return 'danger';
    return 'secondary';
  }

  const countStatusLabel: Record<string, string> = {
    DRAFT: 'Counting',
    SUBMITTED: 'Pending Approval',
    APPROVED: 'Approved',
    REJECTED: 'Rejected',
  };

  const countStatusSeverity: Record<string, string> = {
    DRAFT: 'warning',
    SUBMITTED: 'info',
    APPROVED: 'success',
    REJECTED: 'danger',
  };

  const printDate = computed(() =>
    new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  );

  function handlePrint() {
    window.print();
  }

  // ─── Lifecycle ───
  onMounted(() => loadData());

  // ─── API ───
  async function loadData() {
    try {
      loading.value = true;
      const result = await PhysicalCountService.getComparison(countId.value);
      header.value = result.header;
      editableLines.value = result.lines.map(l => ({
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
      Swal.fire('Error', error.message || 'Unable to load data', 'error');
    } finally {
      loading.value = false;
    }
  }

  function handleAutoFill() {
    editableLines.value.forEach(l => {
      l.editQtyCounted = l.qty_system;
    });
  }

  // ─── Validation: diff lines must have notes ───
  function validateNotesForDiffLines(): boolean {
    const missing = editableLines.value.filter(
      l => l.editQtyCounted - l.qty_system !== 0 && !l.editNote.trim()
    );
    if (missing.length > 0) {
      const itemList = missing
        .slice(0, 5)
        .map(l => `• ${l.item_code} ${l.item_name_th}`)
        .join('<br>');
      const more =
        missing.length > 5 ? `<br>and ${missing.length - 5} more items` : '';
      Swal.fire({
        title: 'Please enter a note',
        html: `There are <strong>${missing.length} items</strong> with discrepancies that do not have a note.<br><br>${itemList}${more}`,
        icon: 'warning',
        confirmButtonText: 'OK',
      });
      return false;
    }
    return true;
  }

  async function handleSave() {
    if (!validateNotesForDiffLines()) return;
    try {
      saving.value = true;
      const lines: IPhysicalCountLineEdit[] = editableLines.value.map(l => ({
        item_id: l.item_id,
        qty_counted: l.editQtyCounted,
        note: l.editNote ?? '', // send '' if cleared (SP02 uses ISNULL so '' clears properly)
      }));
      const result = await PhysicalCountService.saveCountLines(
        countId.value,
        lines
      );
      if (result.Status === 1) {
        Swal.fire({
          title: 'Saved Successfully',
          text: `Recorded count for ${result.UpdatedRows ?? 0} items.`,
          icon: 'success',
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        Swal.fire('Error', result.Message, 'error');
      }
    } catch (error: any) {
      Swal.fire('Error', error.message || 'Save failed', 'error');
    } finally {
      saving.value = false;
    }
  }

  async function handleSubmit() {
    const hasCounted = editableLines.value.some(l => l.editQtyCounted > 0);
    if (!hasCounted) {
      Swal.fire(
        'Warning',
        'No count recorded. Please save the count before submitting for approval.',
        'warning'
      );
      return;
    }

    if (!validateNotesForDiffLines()) return;

    const confirm = await Swal.fire({
      title: 'Confirm Submission',
      html: `Submit stock count for Period <strong>${header.value?.period_code}</strong> to GROUP_LEAD for approval?<br>
             <small class="text-amber-600">⚠️ Once submitted, it cannot be edited.</small>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3b82f6',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Submit for Approval',
      cancelButtonText: 'Cancel',
    });
    if (!confirm.isConfirmed) return;

    try {
      submitting.value = true;
      const result = await PhysicalCountService.submitCount(countId.value);
      if (result.Status === 1) {
        await Swal.fire({
          title: 'Submitted Successfully',
          text: 'Approval request submitted. Email notification sent to GROUP_LEAD.',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false,
        });
        router.push(backRoute.value);
      } else {
        Swal.fire('Error', result.Message, 'error');
      }
    } catch (error: any) {
      Swal.fire('Error', error.message || 'Submission failed', 'error');
    } finally {
      submitting.value = false;
    }
  }
  async function handleApprove() {
    const confirm = await Swal.fire({
      title: 'Confirm Approval',
      html: `Approve stock count for Period <strong>${header.value?.period_code}</strong>?<br>
             <small class="text-gray-500">The system will adjust stock levels and create a Snapshot immediately.</small>`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#16a34a',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Approve',
      cancelButtonText: 'Cancel',
    });
    if (!confirm.isConfirmed) return;

    try {
      approving.value = true;
      const result = await PhysicalCountService.approveCount(countId.value);
      if (result.Status === 1) {
        await Swal.fire({
          title: 'Approved Successfully',
          text: 'Stock adjusted and Snapshot created. Email notification sent to requester.',
          icon: 'success',
          timer: 2500,
          showConfirmButton: false,
        });
        router.push({ name: 'stockCountApproval' });
      } else {
        // Refresh to get latest status (concurrent approval edge case)
        await loadData();
        Swal.fire('Error', result.Message, 'error');
      }
    } catch (error: any) {
      await loadData();
      Swal.fire('Error', error.message || 'Approval failed', 'error');
    } finally {
      approving.value = false;
    }
  }

  function openRejectDialog() {
    rejectReason.value = '';
    showRejectDialog.value = true;
  }

  async function handleReject() {
    if (!rejectReason.value.trim()) {
      Swal.fire('Warning', 'Please provide a reason for rejection.', 'warning');
      return;
    }

    try {
      rejecting.value = true;
      const result = await PhysicalCountService.rejectCount(
        countId.value,
        rejectReason.value.trim()
      );
      if (result.Status === 1) {
        showRejectDialog.value = false;
        await Swal.fire({
          title: 'Rejected Successfully',
          text: 'Email notification with reason sent to requester.',
          icon: 'info',
          timer: 2000,
          showConfirmButton: false,
        });
        router.push({ name: 'stockCountApproval' });
      } else {
        // Refresh to get latest status
        await loadData();
        showRejectDialog.value = false;
        Swal.fire('Error', result.Message, 'error');
      }
    } catch (error: any) {
      await loadData();
      showRejectDialog.value = false;
      Swal.fire('Error', error.message || 'Rejection failed', 'error');
    } finally {
      rejecting.value = false;
    }
  }
</script>

<template>
  <div
    v-if="loading"
    class="flex justify-content-center align-items-center"
    style="min-height: 300px"
  >
    <ProgressSpinner />
  </div>

  <div v-else class="grid">
    <!-- Back Button + Breadcrumb -->
    <div class="col-12">
      <Button
        icon="pi pi-arrow-left"
        label="Back"
        class="p-button-text p-button-plain mb-3"
        @click="router.push(backRoute)"
      />
    </div>

    <!-- Header Card -->
    <div class="col-12" v-if="header">
      <div class="card mb-0">
        <div
          class="flex align-items-start justify-content-between flex-wrap gap-3"
        >
          <div>
            <div class="flex align-items-center gap-3 mb-2">
              <i
                class="pi pi-calendar text-amber-400"
                style="font-size: 1.6rem"
              ></i>
              <span class="text-2xl font-bold">Stock Count Record</span>
              <Tag
                :value="
                  countStatusLabel[header.count_status] || header.count_status
                "
                :severity="
                  countStatusSeverity[header.count_status] || 'secondary'
                "
              />
            </div>
            <div class="flex flex-wrap gap-4 text-sm text-gray-600">
              <span>
                <strong>Period:</strong>
                {{ header.period_code }}
              </span>
              <span>
                <strong>Period:</strong>
                {{ formatDate(header.period_start) }} –
                {{ formatDate(header.period_end) }}
              </span>
              <span>
                <strong>Created By:</strong>
                {{ header.created_by_name || header.created_by }}
              </span>
              <span>
                <strong>Created At:</strong>
                {{ formatSysdatetimeoffset(header.created_at) }}
              </span>
              <span v-if="header.submitted_by">
                <strong>Submitted By:</strong>
                {{ header.submitted_by_name || header.submitted_by }} on
                {{ formatSysdatetimeoffset(header.submitted_at!) }}
              </span>
              <span v-if="header.approved_by">
                <strong>Approved By:</strong>
                {{ header.approved_by_name || header.approved_by }} on
                {{ formatSysdatetimeoffset(header.approved_at!) }}
              </span>
            </div>
            <!-- Rejection reason -->
            <div
              v-if="
                header.count_status === 'REJECTED' && header.rejected_reason
              "
              class="mt-2 p-2 border-round border-1 border-red-300 bg-red-50 text-red-700 text-sm"
            >
              <i class="pi pi-times-circle mr-2"></i>
              <strong>Rejection Reason:</strong>
              {{ header.rejected_reason }}
            </div>
          </div>

          <!-- Action buttons (DRAFT) -->
          <div v-if="isEditable" class="flex gap-2">
            <Button
              icon="pi pi-save"
              label="Save Count"
              class="p-button-success"
              :loading="saving"
              @click="handleSave"
            />
            <Button
              icon="pi pi-send"
              label="Submit for Approval"
              class="p-button-primary"
              :loading="submitting"
              @click="handleSubmit"
            />
          </div>

          <!-- Action button (REJECTED) -->
          <div v-if="header.count_status === 'REJECTED'" class="flex gap-2">
            <Button
              icon="pi pi-list-check"
              label="Create New Count"
              class="p-button-primary"
              @click="router.push({ name: 'stockMonthlyRecord' })"
            />
          </div>

          <!-- Approve / Reject buttons for GROUP_LEAD -->
          <div v-if="isSubmitted" class="flex gap-2">
            <Button
              icon="pi pi-check"
              label="Approve"
              class="p-button-success"
              :loading="approving"
              :disabled="rejecting"
              @click="handleApprove"
            />
            <Button
              icon="pi pi-times"
              label="Reject"
              class="p-button-danger p-button-outlined"
              :loading="rejecting"
              :disabled="approving"
              @click="openRejectDialog"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Count Lines Table -->
    <div class="col-12">
      <div class="card">
        <!-- Toolbar -->
        <div
          class="flex align-items-center justify-content-between flex-wrap gap-3 mb-4"
        >
          <span class="text-lg font-bold">
            Items / Supplies ({{ filteredLines.length }} items)
          </span>
          <div class="flex align-items-center gap-3 flex-wrap">
            <Button
              icon="pi pi-print"
              label="Print Count Sheet"
              class="p-button-outlined p-button-info"
              size="small"
              v-tooltip.top="'Print stock count sheet for manual counting'"
              @click="handlePrint"
            />
            <Button
              v-if="isEditable"
              icon="pi pi-copy"
              label="Auto-fill System Qty"
              class="p-button-outlined p-button-secondary"
              size="small"
              v-tooltip.top="
                'Copy system quantity to actual count for all items'
              "
              @click="handleAutoFill"
            />
            <div class="flex align-items-center gap-2">
              <Checkbox
                v-model="showOnlyDiff"
                :binary="true"
                inputId="showDiff"
              />
              <label for="showDiff" class="text-sm cursor-pointer">
                Show only discrepancies
              </label>
            </div>
            <IconField iconPosition="left">
              <InputIcon class="pi pi-search" />
              <InputText
                v-model="searchQuery"
                placeholder="Search code / item name..."
                size="small"
              />
            </IconField>
          </div>
        </div>

        <DataTable
          :value="filteredLines"
          responsiveLayout="scroll"
          dataKey="line_id"
          stripedRows
          scrollable
          scrollHeight="60vh"
        >
          <template #empty>
            <div class="text-center py-5 text-gray-400">No items found</div>
          </template>

          <Column
            field="item_code"
            header="Code"
            :sortable="true"
            frozen
            style="min-width: 8rem; background: white"
          />
          <Column
            field="item_name_th"
            header="Item Name"
            :sortable="true"
            frozen
            style="min-width: 20rem; background: white"
          >
            <template #body="{ data }">
              <div>
                <div>{{ data.item_name_th }}</div>
                <div
                  v-if="data.item_name_en"
                  class="text-xs text-gray-400 mt-1"
                >
                  {{ data.item_name_en }}
                </div>
              </div>
            </template>
          </Column>
          <Column field="unit_name_th" header="Unit" style="min-width: 6rem">
            <template #body="{ data }">{{ data.unit_name_th || '-' }}</template>
          </Column>
          <Column
            header="Min / Max"
            style="min-width: 8rem; text-align: center"
          >
            <template #body="{ data }">
              <span class="font-mono text-xs">
                {{ data.item_min ?? '-' }} / {{ data.item_max ?? '-' }}
              </span>
            </template>
          </Column>
          <Column
            field="snapshot_prev_qty"
            header="Prev. Snapshot"
            :sortable="true"
            style="min-width: 10rem; text-align: right"
          >
            <template #body="{ data }">
              <span class="font-mono">
                {{ data.snapshot_prev_qty.toFixed(0) }}
              </span>
            </template>
          </Column>
          <Column
            field="received_qty"
            header="Received"
            :sortable="true"
            style="min-width: 9rem; text-align: right"
          >
            <template #body="{ data }">
              <span class="font-mono text-green-600">
                +{{ data.received_qty.toFixed(0) }}
              </span>
            </template>
          </Column>
          <Column
            field="issued_qty"
            header="Issued"
            :sortable="true"
            style="min-width: 9rem; text-align: right"
          >
            <template #body="{ data }">
              <span class="font-mono text-red-500">
                -{{ data.issued_qty.toFixed(0) }}
              </span>
            </template>
          </Column>
          <Column
            field="qty_system"
            header="System Qty"
            :sortable="true"
            style="min-width: 9rem; text-align: right"
          >
            <template #body="{ data }">
              <span class="font-mono">{{ data.qty_system.toFixed(2) }}</span>
            </template>
          </Column>
          <Column header="Actual Count *" style="min-width: 11rem">
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
              <span v-else class="font-mono">
                {{ data.editQtyCounted.toFixed(2) }}
              </span>
            </template>
          </Column>
          <Column header="Diff" style="min-width: 9rem; text-align: right">
            <template #body="{ data }">
              <Tag
                :value="`${getDiffQty(data) > 0 ? '+' : ''}${getDiffQty(data).toFixed(2)} ${getDiffStatus(getDiffQty(data))}`"
                :severity="getDiffSeverity(getDiffQty(data))"
                class="font-mono"
              />
            </template>
          </Column>
          <Column header="Note" style="min-width: 14rem">
            <template #body="{ data }">
              <InputText
                v-if="isEditable"
                v-model="data.editNote"
                placeholder="Note..."
                size="small"
                class="w-full"
                :class="{
                  'p-invalid': getDiffQty(data) !== 0 && !data.editNote.trim(),
                }"
              />
              <span v-else class="text-gray-600">
                {{ data.editNote || '-' }}
              </span>
            </template>
          </Column>
        </DataTable>

        <!-- Bottom action bar (visible when editable) -->
        <div
          v-if="isEditable"
          class="flex justify-content-end gap-2 mt-4 pt-3 border-top-1 surface-border"
        >
          <Button
            icon="pi pi-save"
            label="Save Count"
            class="p-button-success"
            :loading="saving"
            @click="handleSave"
          />
          <Button
            icon="pi pi-send"
            label="Submit for Approval"
            class="p-button-primary"
            :loading="submitting"
            @click="handleSubmit"
          />
        </div>
      </div>
    </div>
  </div>

  <!-- ════════════ REJECT DIALOG ════════════ -->
  <Dialog
    v-model:visible="showRejectDialog"
    header="Specify Rejection Reason"
    :modal="true"
    :draggable="false"
    style="width: 480px"
  >
    <div class="flex flex-column gap-3 pt-2">
      <p class="text-gray-600 text-sm m-0">
        Please specify the reason for rejecting stock count Period
        <strong>{{ header?.period_code }}</strong>
        to inform the staff.
      </p>
      <Textarea
        v-model="rejectReason"
        rows="4"
        placeholder="Rejection reason..."
        class="w-full"
        :disabled="rejecting"
        autofocus
      />
    </div>
    <template #footer>
      <Button
        label="Cancel"
        icon="pi pi-times"
        class="p-button-text"
        :disabled="rejecting"
        @click="showRejectDialog = false"
      />
      <Button
        label="Confirm Rejection"
        icon="pi pi-check"
        class="p-button-danger"
        :loading="rejecting"
        :disabled="!rejectReason.trim()"
        @click="handleReject"
      />
    </template>
  </Dialog>

  <!-- ════════════ PRINT SECTION ════════════ -->
  <div class="print-section" v-if="header">
    <!-- Print Header -->
    <div class="ps-header">
      <div class="ps-title">
        Monthly Stock Count Sheet (Physical Count Sheet)
      </div>
      <table class="ps-info">
        <tr>
          <td><strong>Period:</strong></td>
          <td>{{ header.period_code }}</td>
          <td><strong>Period:</strong></td>
          <td>
            {{ formatDate(header.period_start) }} –
            {{ formatDate(header.period_end) }}
          </td>
          <td><strong>Status:</strong></td>
          <td>
            {{ countStatusLabel[header.count_status] || header.count_status }}
          </td>
        </tr>
        <tr>
          <td><strong>Created By:</strong></td>
          <td>{{ header.created_by_name || header.created_by }}</td>
          <td><strong>Print Date:</strong></td>
          <td>{{ printDate }}</td>
          <td><strong>Item Count:</strong></td>
          <td>{{ editableLines.length }} items</td>
        </tr>
      </table>
    </div>

    <!-- Print Table -->
    <table class="ps-table">
      <thead>
        <tr>
          <th style="width: 4%">No.</th>
          <th style="width: 9%">Code</th>
          <th style="width: 27%">Item Name</th>
          <th style="width: 6%">Unit</th>
          <th style="width: 7%">Min/Max</th>
          <th style="width: 8%">System Qty</th>
          <th style="width: 16%">Actual Count</th>
          <th style="width: 23%">Note</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(line, index) in editableLines" :key="line.line_id">
          <td class="ps-center">{{ index + 1 }}</td>
          <td class="ps-mono">{{ line.item_code }}</td>
          <td>
            {{ line.item_name_th }}
            <div v-if="line.item_name_en" class="ps-en">
              {{ line.item_name_en }}
            </div>
          </td>
          <td class="ps-center">{{ line.unit_name_th || '-' }}</td>
          <td class="ps-center ps-mono">
            {{ line.item_min ?? '-' }} / {{ line.item_max ?? '-' }}
          </td>
          <td class="ps-right ps-mono">{{ line.qty_system.toFixed(2) }}</td>
          <td class="ps-counted"></td>
          <td class="ps-note">{{ line.editNote || '' }}</td>
        </tr>
      </tbody>
    </table>

    <!-- Signature Section -->
    <div class="ps-footer">
      <div class="ps-sig-block">
        <div>Counter ...............................................</div>
        <div class="ps-sig-sub">
          ( ......................................... )
        </div>
        <div>Date .............. / .............. / ..............</div>
      </div>
      <div class="ps-sig-block">
        <div>Verifier ..........................................</div>
        <div class="ps-sig-sub">
          ( ......................................... )
        </div>
        <div>Date .............. / .............. / ..............</div>
      </div>
      <div class="ps-sig-block">
        <div>Approver ............................................</div>
        <div class="ps-sig-sub">
          ( ......................................... )
        </div>
        <div>Date ........... / .............. / ..............</div>
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

<style>
  /* ── Hidden in normal view ───────────────────────── */
  .print-section {
    display: none;
  }

  /* ── Print layout ────────────────────────────────── */
  @media print {
    @page {
      size: A4 portrait;
      margin: 12mm 10mm;
    }

    /* Hide everything except print-section */
    body * {
      visibility: hidden;
    }
    .print-section,
    .print-section * {
      visibility: visible;
    }
    .print-section {
      display: block !important;
      position: absolute;
      inset: 0;
      padding: 0;
      font-family: 'TH Sarabun New', 'Sarabun', 'Noto Sans Thai', sans-serif;
      font-size: 10pt;
      color: #000;
    }

    /* Print Header */
    .ps-header {
      margin-bottom: 6pt;
    }
    .ps-title {
      font-size: 14pt;
      font-weight: 700;
      text-align: center;
      margin-bottom: 6pt;
      border-bottom: 2px solid #000;
      padding-bottom: 4pt;
    }
    .ps-info {
      width: 100%;
      border-collapse: collapse;
      font-size: 9.5pt;
    }
    .ps-info td {
      padding: 2pt 6pt;
    }

    /* Print Table */
    .ps-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 9pt;
      margin-top: 6pt;
    }
    .ps-table thead tr {
      background-color: #e5e7eb !important;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .ps-table th,
    .ps-table td {
      border: 1px solid #555;
      padding: 3pt 4pt;
      vertical-align: middle;
    }
    .ps-table th {
      font-weight: 700;
      text-align: center;
    }
    .ps-table tbody tr:nth-child(even) {
      background-color: #f9fafb !important;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .ps-table tbody tr {
      page-break-inside: avoid;
    }

    /* Counted cell — blank box for writing */
    .ps-counted {
      background-color: #fffbeb !important;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .ps-mono {
      font-family: 'Courier New', monospace;
      font-size: 8.5pt;
    }
    .ps-center {
      text-align: center;
    }
    .ps-right {
      text-align: right;
    }
    .ps-en {
      font-size: 7.5pt;
      color: #555;
      margin-top: 1pt;
    }
    .ps-note {
      font-size: 8.5pt;
      color: #444;
    }

    /* Signature Section */
    .ps-footer {
      display: flex;
      justify-content: space-around;
      margin-top: 20pt;
      padding-top: 10pt;
      border-top: 1px solid #888;
      page-break-inside: avoid;
    }
    .ps-sig-block {
      text-align: center;
      font-size: 9.5pt;
      line-height: 1.8;
    }
    .ps-sig-sub {
      color: #555;
    }
  }
</style>
