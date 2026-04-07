<script lang="ts" setup>
import { ref, onMounted, computed, nextTick } from 'vue';
import { FilterMatchMode } from '@primevue/core/api';
import { ApprovalService } from '@/services/approval.service';
import { BorrowService } from '@/services/borrow.service';
import type { IPendingApprovalItem, IPoLine, IApprovalHistory, IBorrowApprovalLog } from '@/interfaces/approval.interfaces';
import type { IBorrowLine } from '@/interfaces/borrow.interfaces';
import Swal from 'sweetalert2';

const pendingItems = ref<IPendingApprovalItem[]>([]);
const historyItems = ref<IPendingApprovalItem[]>([]);
const viewMode = ref<'pending' | 'history'>('pending');
const showDetailDialog = ref(false);
const selectedItem = ref<IPendingApprovalItem | null>(null);

// Detail data
const poLines = ref<IPoLine[]>([]);
const borrowLines = ref<IBorrowLine[]>([]);
const approvalHistory = ref<IApprovalHistory[]>([]);
const approvalLogs = ref<IBorrowApprovalLog[]>([]);

// ─── Simulate user for testing ───
const simulateUsers = [
  { id: '0027', label: '0027 - GROUP_LEAD' },
  { id: '1547', label: '1547 - MANAGER' },
  { id: '3346', label: '3346 - DEPARTMENT' },
  { id: '', label: '8300 (\u0E1C\u0E39\u0E49\u0E43\u0E0A\u0E49\u0E07\u0E32\u0E19)' },
];
const simulatedUserId = ref('');

const realUserId = computed(() => {
  try {
    const token = localStorage.getItem('token');
    if (!token) return '';
    const payload = JSON.parse(atob(token.split('.')[1]));
    return String(payload.UserID || '');
  } catch {
    return '';
  }
});

const currentUserId = computed(() => simulatedUserId.value || realUserId.value);

const displayItems = computed(() => {
  return viewMode.value === 'pending' ? pendingItems.value : historyItems.value;
});

const filters = ref({
  global: { value: null, matchMode: FilterMatchMode.CONTAINS },
});

function typeLabel(type: string): string {
  return type === 'PO' ? '\u0E2A\u0E31\u0E48\u0E07\u0E0B\u0E37\u0E49\u0E2D' : '\u0E22\u0E37\u0E21';
}

function typeSeverity(type: string): string {
  return type === 'PO' ? 'info' : 'warn';
}

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    PENDING_APPROVAL: '\u0E23\u0E2D\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34',
    APPROVED_L1: '\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34\u0E23\u0E30\u0E14\u0E31\u0E1A 1',
    APPROVED_L2: '\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34\u0E23\u0E30\u0E14\u0E31\u0E1A 2',
  };
  return map[status] || status;
}

function statusSeverity(status: string): string {
  const map: Record<string, string> = {
    PENDING_APPROVAL: 'warn',
    APPROVED_L1: 'info',
    APPROVED_L2: 'info',
  };
  return map[status] || 'secondary';
}

function roleLabel(role: string): string {
  const map: Record<string, string> = {
    GROUP_LEAD: '\u0E2B\u0E31\u0E27\u0E2B\u0E19\u0E49\u0E32\u0E01\u0E25\u0E38\u0E48\u0E21',
    MANAGER: '\u0E1C\u0E39\u0E49\u0E08\u0E31\u0E14\u0E01\u0E32\u0E23',
    DEPARTMENT: '\u0E2B\u0E31\u0E27\u0E2B\u0E19\u0E49\u0E32\u0E41\u0E1C\u0E19\u0E01',
  };
  return map[role] || role;
}

function approvalStatusLabel(status: string): string {
  const map: Record<string, string> = {
    PENDING: '\u0E23\u0E2D\u0E14\u0E33\u0E40\u0E19\u0E34\u0E19\u0E01\u0E32\u0E23',
    APPROVE: '\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34',
    REJECT: '\u0E1B\u0E0F\u0E34\u0E40\u0E2A\u0E18',
    REWORK: '\u0E2A\u0E48\u0E07\u0E01\u0E25\u0E31\u0E1A\u0E41\u0E01\u0E49\u0E44\u0E02',
    CANCELLED: '\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01',
  };
  return map[status] || status;
}

function approvalStatusSeverity(status: string): string {
  const map: Record<string, string> = {
    PENDING: 'warn',
    APPROVE: 'success',
    REJECT: 'danger',
    REWORK: 'warn',
    CANCELLED: 'secondary',
  };
  return map[status] || 'secondary';
}

function logActionIcon(action: string): string {
  const map: Record<string, string> = {
    SUBMIT: 'pi pi-send',
    APPROVE: 'pi pi-check',
    REJECT: 'pi pi-times',
    REWORK: 'pi pi-replay',
  };
  return map[action] || 'pi pi-circle';
}

function logActionColor(action: string): string {
  const map: Record<string, string> = {
    SUBMIT: '#3B82F6',
    APPROVE: '#22C55E',
    REJECT: '#EF4444',
    REWORK: '#F59E0B',
  };
  return map[action] || '#6B7280';
}

function logActionLabel(action: string): string {
  const map: Record<string, string> = {
    SUBMIT: '\u0E2A\u0E48\u0E07\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34',
    APPROVE: '\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34',
    REJECT: '\u0E1B\u0E0F\u0E34\u0E40\u0E2A\u0E18',
    REWORK: '\u0E2A\u0E48\u0E07\u0E01\u0E25\u0E31\u0E1A\u0E41\u0E01\u0E49\u0E44\u0E02',
  };
  return map[action] || action;
}

function canApprove(item: IPendingApprovalItem): boolean {
  return item.current_approver_id === currentUserId.value;
}

async function loadPendingApprovals() {
  try {
    pendingItems.value = await ApprovalService.getPendingApprovals();
  } catch {
    // handled by axios interceptor
  }
}

async function loadHistoryApprovals() {
  try {
    historyItems.value = await ApprovalService.getApprovalHistory();
  } catch {
    // handled by axios interceptor
  }
}

async function openDetail(item: IPendingApprovalItem) {
  selectedItem.value = item;
  poLines.value = [];
  borrowLines.value = [];
  approvalHistory.value = [];
  approvalLogs.value = [];
  showDetailDialog.value = true;

  try {
    if (item.type === 'PO') {
      const result = await ApprovalService.getPoDetail(item.id) as any;
      if (Array.isArray(result)) {
        // sp_PO_02_GetPO returns 3 recordsets
        poLines.value = result[1] || [];
        approvalHistory.value = result[2] || [];
      } else if (result && typeof result === 'object') {
        poLines.value = result.recordsets?.[1] || result.lines || [];
        approvalHistory.value = result.recordsets?.[2] || result.approvals || [];
      }
    } else {
      const [lines, history, logs] = await Promise.all([
        BorrowService.getBorrowLines(item.id),
        ApprovalService.getBorrowApprovalHistory(item.id),
        ApprovalService.getBorrowApprovalLogs(item.id),
      ]);
      borrowLines.value = lines;
      approvalHistory.value = history;
      approvalLogs.value = logs;
    }
  } catch {
    // handled by axios interceptor
  }
}

async function handleApprove(item: IPendingApprovalItem, action: 'APPROVE' | 'REJECT' | 'REWORK') {
  const actionLabel: Record<string, string> = {
    APPROVE: '\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34',
    REJECT: '\u0E1B\u0E0F\u0E34\u0E40\u0E2A\u0E18',
    REWORK: '\u0E2A\u0E48\u0E07\u0E01\u0E25\u0E31\u0E1A\u0E41\u0E01\u0E49\u0E44\u0E02',
  };

  // Close dialog first so Swal is not blocked by modal overlay
  showDetailDialog.value = false;
  await nextTick();

  let remark: string | undefined;

  if (action === 'REJECT' || action === 'REWORK') {
    const { value, isConfirmed } = await Swal.fire({
      title: actionLabel[action] + ' ' + item.doc_no,
      input: 'textarea',
      inputLabel: '\u0E2B\u0E21\u0E32\u0E22\u0E40\u0E2B\u0E15\u0E38 (\u0E1A\u0E31\u0E07\u0E04\u0E31\u0E1A)',
      inputValidator: (v) => (!v ? '\u0E01\u0E23\u0E38\u0E13\u0E32\u0E01\u0E23\u0E2D\u0E01\u0E2B\u0E21\u0E32\u0E22\u0E40\u0E2B\u0E15\u0E38' : null),
      showCancelButton: true,
      confirmButtonText: actionLabel[action],
      cancelButtonText: '\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01',
    });
    if (!isConfirmed) {
      showDetailDialog.value = true;
      return;
    }
    remark = value;
  } else {
    const result = await Swal.fire({
      title: '\u0E22\u0E37\u0E19\u0E22\u0E31\u0E19' + actionLabel[action] + '?',
      text: item.doc_no,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: actionLabel[action],
      cancelButtonText: '\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01',
    });
    if (!result.isConfirmed) {
      showDetailDialog.value = true;
      return;
    }
  }

  try {
    const simAs = simulatedUserId.value || undefined;
    if (item.type === 'PO') {
      await ApprovalService.approvePo(item.id, { Action: action as 'APPROVE' | 'REJECT', Remark: remark, SimulateAs: simAs });
    } else {
      await ApprovalService.approveBorrow(item.id, { Action: action, Remark: remark, SimulateAs: simAs });
    }
    selectedItem.value = null;
    await Swal.fire('\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08', actionLabel[action] + '\u0E40\u0E23\u0E35\u0E22\u0E1A\u0E23\u0E49\u0E2D\u0E22', 'success');
    await loadPendingApprovals();
  } catch {
    // handled by axios interceptor
  }
}

onMounted(async () => {
  await loadPendingApprovals();
});
</script>

<template>
  <div class="card">
    <div class="flex justify-between items-center mb-4">
      <div class="font-semibold text-xl">&#x0E2D;&#x0E19;&#x0E38;&#x0E21;&#x0E31;&#x0E15;&#x0E34;&#x0E01;&#x0E32;&#x0E23;&#x0E2A;&#x0E31;&#x0E48;&#x0E07;&#x0E0B;&#x0E37;&#x0E49;&#x0E2D; / &#x0E22;&#x0E37;&#x0E21;</div>
      <!-- Simulate user buttons (DEV) -->
      <div class="flex items-center gap-2">
        <span class="text-sm text-surface-500">&#x0E08;&#x0E33;&#x0E25;&#x0E2D;&#x0E07;&#x0E2A;&#x0E34;&#x0E17;&#x0E18;&#x0E34;&#x0E4C;:</span>
        <SelectButton
          v-model="simulatedUserId"
          :options="simulateUsers"
          optionLabel="label"
          optionValue="id"
          :allowEmpty="false"
          size="small"
        />
        <Tag :value="'\u0E01\u0E33\u0E25\u0E31\u0E07\u0E43\u0E0A\u0E49: ' + (currentUserId || realUserId)" severity="info" />
      </div>
    </div>

    <DataTable
      :value="displayItems"
      :paginator="true"
      :rows="15"
      v-model:filters="filters"
      filterDisplay="menu"
      :globalFilterFields="['doc_no', 'supplier_name', 'created_by_name', 'current_approver_name', 'type']"
      dataKey="doc_no"
      stripedRows
      scrollable
      scrollHeight="65vh"
      tableStyle="min-width: 900px"
      :rowClass="(data: any) => canApprove(data) ? 'row-my-turn' : ''"
    >
      <template #header>
        <div class="flex justify-between items-center gap-2">
          <div class="flex gap-2">
            <Button
              :label="'Wait Approve'"
              :outlined="viewMode !== 'pending'"
              severity="info"
              size="small"
              @click="viewMode = 'pending'; loadPendingApprovals()"
            />
            <Button
              :label="'History'"
              :outlined="viewMode !== 'history'"
              severity="secondary"
              size="small"
              @click="viewMode = 'history'; loadHistoryApprovals()"
            />
          </div>
          <div class="flex gap-2">
            <Button icon="pi pi-refresh" rounded text @click="viewMode === 'pending' ? loadPendingApprovals() : loadHistoryApprovals()" />
            <IconField>
              <InputIcon class="pi pi-search" />
              <InputText v-model="filters['global'].value" :placeholder="'\u0E04\u0E49\u0E19\u0E2B\u0E32...'" />
            </IconField>
          </div>
        </div>
      </template>

      <template #empty>
        <div class="text-center py-6 text-surface-500">&#x0E44;&#x0E21;&#x0E48;&#x0E21;&#x0E35;&#x0E23;&#x0E32;&#x0E22;&#x0E01;&#x0E32;&#x0E23;&#x0E23;&#x0E2D;&#x0E2D;&#x0E19;&#x0E38;&#x0E21;&#x0E31;&#x0E15;&#x0E34;</div>
      </template>

      <Column :header="'\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17'" style="min-width: 100px">
        <template #body="{ data }">
          <Tag :value="typeLabel(data.type)" :severity="typeSeverity(data.type)" />
        </template>
      </Column>

      <Column field="doc_no" :header="'\u0E40\u0E25\u0E02\u0E17\u0E35\u0E48\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23'" style="min-width: 160px" />

      <Column field="doc_date" :header="'\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48'" style="min-width: 120px" />

      <Column field="supplier_name" :header="'\u0E1C\u0E39\u0E49\u0E08\u0E31\u0E14\u0E08\u0E33\u0E2B\u0E19\u0E48\u0E32\u0E22'" style="min-width: 160px" />

      <Column :header="'\u0E2A\u0E16\u0E32\u0E19\u0E30'" style="min-width: 140px">
        <template #body="{ data }">
          <Tag :value="statusLabel(data.status)" :severity="statusSeverity(data.status)" />
        </template>
      </Column>

      <Column field="created_by_name" :header="'\u0E1C\u0E39\u0E49\u0E2A\u0E23\u0E49\u0E32\u0E07'" style="min-width: 140px" />

      <Column :header="'\u0E23\u0E2D\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34\u0E42\u0E14\u0E22'" style="min-width: 240px">
        <template #body="{ data }">
          <div class="flex items-center gap-2">
            <Tag :value="data.current_approval_role" severity="secondary" />
            <span>{{ data.current_approver_name || data.current_approver_id }}</span>
            <Tag v-if="canApprove(data)" value="To approve" severity="danger" icon="pi pi-bell" />
          </div>
        </template>
      </Column>

      <Column :header="'\u0E08\u0E31\u0E14\u0E01\u0E32\u0E23'" style="min-width: 120px" frozen alignFrozen="right">
        <template #body="{ data }">
          <Button icon="pi pi-eye" :label="'\u0E14\u0E39\u0E23\u0E32\u0E22\u0E25\u0E30\u0E40\u0E2D\u0E35\u0E22\u0E14'" severity="info" size="small" text @click="openDetail(data)" />
        </template>
      </Column>
    </DataTable>
  </div>

  <!-- ===== Detail Dialog ===== -->
  <Dialog
    v-model:visible="showDetailDialog"
    :header="selectedItem ? (typeLabel(selectedItem.type) + ' ' + selectedItem.doc_no) : ''"
    modal
    :style="{ width: '70vw' }"
    :breakpoints="{ '768px': '95vw' }"
  >
    <template v-if="selectedItem">
      <!-- Info Section -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div>
          <div class="text-surface-500 text-sm">&#x0E1B;&#x0E23;&#x0E30;&#x0E40;&#x0E20;&#x0E17;</div>
          <Tag :value="typeLabel(selectedItem.type)" :severity="typeSeverity(selectedItem.type)" />
        </div>
        <div>
          <div class="text-surface-500 text-sm">&#x0E2A;&#x0E16;&#x0E32;&#x0E19;&#x0E30;</div>
          <Tag :value="statusLabel(selectedItem.status)" :severity="statusSeverity(selectedItem.status)" />
        </div>
        <div>
          <div class="text-surface-500 text-sm">&#x0E1C;&#x0E39;&#x0E49;&#x0E08;&#x0E31;&#x0E14;&#x0E08;&#x0E33;&#x0E2B;&#x0E19;&#x0E48;&#x0E32;&#x0E22;</div>
          <div>{{ selectedItem.supplier_name }}</div>
        </div>
        <div>
          <div class="text-surface-500 text-sm">&#x0E1C;&#x0E39;&#x0E49;&#x0E2A;&#x0E23;&#x0E49;&#x0E32;&#x0E07;</div>
          <div>{{ selectedItem.created_by_name || selectedItem.created_by }}</div>
        </div>
      </div>

      <div v-if="selectedItem.note" class="mb-4">
        <div class="text-surface-500 text-sm">&#x0E2B;&#x0E21;&#x0E32;&#x0E22;&#x0E40;&#x0E2B;&#x0E15;&#x0E38;</div>
        <div>{{ selectedItem.note }}</div>
      </div>

      <!-- PO Lines -->
      <div v-if="selectedItem.type === 'PO' && poLines.length > 0" class="mb-4">
        <div class="font-semibold mb-2">&#x0E23;&#x0E32;&#x0E22;&#x0E01;&#x0E32;&#x0E23;&#x0E2A;&#x0E34;&#x0E19;&#x0E04;&#x0E49;&#x0E32;</div>
        <DataTable :value="poLines" size="small" stripedRows>
          <Column field="item_name_th" :header="'\u0E0A\u0E37\u0E48\u0E2D\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23'" style="min-width: 200px">
            <template #body="{ data }">
              {{ data.item_name_th }}<br /><small class="text-surface-400">{{ data.item_name_en }}</small>
            </template>
          </Column>
          <Column field="qty_order" :header="'\u0E08\u0E33\u0E19\u0E27\u0E19\u0E2A\u0E31\u0E48\u0E07'" style="min-width: 80px" />
          <Column :header="'\u0E23\u0E32\u0E04\u0E32/\u0E2B\u0E19\u0E48\u0E27\u0E22'" style="min-width: 100px">
            <template #body="{ data }">&#x0E3F;{{ Number(data.unit_price).toLocaleString('en-US', { minimumFractionDigits: 2 }) }}</template>
          </Column>
          <Column :header="'\u0E23\u0E27\u0E21'" style="min-width: 100px">
            <template #body="{ data }">&#x0E3F;{{ Number(data.total_price).toLocaleString('en-US', { minimumFractionDigits: 2 }) }}</template>
          </Column>
          <Column field="purchase_unit_name_th" :header="'\u0E2B\u0E19\u0E48\u0E27\u0E22'" style="min-width: 80px" />
        </DataTable>
      </div>

      <!-- Borrow Lines -->
      <div v-if="selectedItem.type === 'BORROW' && borrowLines.length > 0" class="mb-4">
        <div class="font-semibold mb-2">&#x0E23;&#x0E32;&#x0E22;&#x0E01;&#x0E32;&#x0E23;&#x0E22;&#x0E37;&#x0E21;</div>
        <DataTable :value="borrowLines" size="small" stripedRows>
          <Column field="item_name_th" :header="'\u0E0A\u0E37\u0E48\u0E2D\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23'" style="min-width: 200px">
            <template #body="{ data }">
              {{ data.item_name_th }}<br /><small class="text-surface-400">{{ data.item_name_en }}</small>
            </template>
          </Column>
          <Column field="qty_borrow" :header="'\u0E08\u0E33\u0E19\u0E27\u0E19\u0E22\u0E37\u0E21'" style="min-width: 80px" />
          <Column :header="'\u0E23\u0E32\u0E04\u0E32/\u0E2B\u0E19\u0E48\u0E27\u0E22'" style="min-width: 100px">
            <template #body="{ data }">&#x0E3F;{{ Number(data.unit_price).toLocaleString('en-US', { minimumFractionDigits: 2 }) }}</template>
          </Column>
          <Column :header="'\u0E23\u0E27\u0E21'" style="min-width: 100px">
            <template #body="{ data }">&#x0E3F;{{ Number(data.total_price).toLocaleString('en-US', { minimumFractionDigits: 2 }) }}</template>
          </Column>
          <Column field="purchase_unit_name_th" :header="'\u0E2B\u0E19\u0E48\u0E27\u0E22'" style="min-width: 80px" />
        </DataTable>
      </div>

      <!-- Approval History -->
      <div class="mb-4">
        <div class="font-semibold mb-2">&#x0E1B;&#x0E23;&#x0E30;&#x0E27;&#x0E31;&#x0E15;&#x0E34;&#x0E01;&#x0E32;&#x0E23;&#x0E2D;&#x0E19;&#x0E38;&#x0E21;&#x0E31;&#x0E15;&#x0E34;</div>
        <DataTable :value="approvalHistory" size="small" stripedRows>
          <Column :header="'\u0E25\u0E33\u0E14\u0E31\u0E1A'" field="approval_level" style="min-width: 60px" />
          <Column :header="'\u0E15\u0E33\u0E41\u0E2B\u0E19\u0E48\u0E07'" style="min-width: 120px">
            <template #body="{ data }">
              {{ roleLabel(data.approval_role) }}
            </template>
          </Column>
          <Column :header="'\u0E2A\u0E16\u0E32\u0E19\u0E30'" style="min-width: 120px">
            <template #body="{ data }">
              <Tag :value="approvalStatusLabel(data.status)" :severity="approvalStatusSeverity(data.status)" />
            </template>
          </Column>
          <Column :header="'\u0E1C\u0E39\u0E49\u0E14\u0E33\u0E40\u0E19\u0E34\u0E19\u0E01\u0E32\u0E23'" style="min-width: 140px">
            <template #body="{ data }">
              {{ data.actioned_by_name || data.actioned_by || '-' }}
            </template>
          </Column>
          <Column field="actioned_at" :header="'\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48'" style="min-width: 150px">
            <template #body="{ data }">
              {{ data.actioned_at ? new Date(data.actioned_at).toLocaleString('th-TH') : '-' }}
            </template>
          </Column>
          <Column field="remark" :header="'\u0E2B\u0E21\u0E32\u0E22\u0E40\u0E2B\u0E15\u0E38'" style="min-width: 200px">
            <template #body="{ data }">
              {{ data.remark || '-' }}
            </template>
          </Column>
        </DataTable>
      </div>

      <!-- Action Buttons (only if current user can approve) -->
      <div v-if="canApprove(selectedItem)" class="flex gap-2 justify-end pt-2 border-t mb-4">
        <Button :label="'\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34'" icon="pi pi-check" severity="success" @click="handleApprove(selectedItem!, 'APPROVE')" />
        <Button :label="'\u0E1B\u0E0F\u0E34\u0E40\u0E2A\u0E18'" icon="pi pi-times" severity="danger" @click="handleApprove(selectedItem!, 'REJECT')" />
        <Button
          v-if="selectedItem.type === 'BORROW'"
          :label="'\u0E2A\u0E48\u0E07\u0E01\u0E25\u0E31\u0E1A\u0E41\u0E01\u0E49\u0E44\u0E02'"
          icon="pi pi-replay"
          severity="warn"
          @click="handleApprove(selectedItem!, 'REWORK')"
        />
      </div>

      <!-- Approval Timeline (Borrow only) -->
      <div v-if="selectedItem.type === 'BORROW' && approvalLogs.length > 0" class="mb-4">
        <div class="font-semibold mb-2">Timeline &#x0E01;&#x0E32;&#x0E23;&#x0E2D;&#x0E19;&#x0E38;&#x0E21;&#x0E31;&#x0E15;&#x0E34;</div>
        <Timeline :value="approvalLogs" align="left" class="pl-2">
          <template #marker="{ item }">
            <span
              class="flex items-center justify-center rounded-full border-2 w-8 h-8"
              :style="{ borderColor: logActionColor(item.action), backgroundColor: logActionColor(item.action) + '1A' }"
            >
              <i :class="logActionIcon(item.action)" :style="{ color: logActionColor(item.action) }" />
            </span>
          </template>
          <template #content="{ item }">
            <div class="mb-3">
              <div class="flex items-center gap-2 mb-1">
                <Tag :value="logActionLabel(item.action)" :style="{ backgroundColor: logActionColor(item.action), color: '#fff' }" />
                <span v-if="item.approval_role !== 'SUBMITTER'" class="text-sm text-surface-500">{{ item.approval_role }}</span>
              </div>
              <div class="text-sm">
                <span class="font-medium">{{ item.actioned_by_name || item.actioned_by }}</span>
                <span class="text-surface-400 ml-2">{{ new Date(item.actioned_at).toLocaleString('th-TH') }}</span>
              </div>
              <div v-if="item.remark" class="text-sm text-surface-500 mt-1">
                <i class="pi pi-comment mr-1" />{{ item.remark }}
              </div>
            </div>
          </template>
        </Timeline>
      </div>
    </template>
  </Dialog>
</template>

<style scoped>
:deep(.row-my-turn) {
  background-color: rgba(34, 197, 94, 0.08) !important;
  border-left: 3px solid #22c55e;
}
</style>
