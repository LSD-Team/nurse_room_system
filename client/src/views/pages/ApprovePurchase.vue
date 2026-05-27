<script lang="ts" setup>
  import { ref, onMounted, computed, nextTick } from 'vue';
  import { FilterMatchMode } from '@primevue/core/api';
  import { ApprovalService } from '@/services/approval.service';
  import { BorrowService } from '@/services/borrow.service';
  import { useMenuNotificationsStore } from '@/stores/menu-notifications.store';
  import { formatSysdatetimeoffset } from '@/utils/format.utils';
  import type {
    IPendingApprovalItem,
    IPoLine,
    IApprovalHistory,
    IBorrowApprovalLog,
  } from '@/interfaces/approval.interfaces';
  import type { IBorrowLine } from '@/interfaces/borrow.interfaces';
  import Swal from 'sweetalert2';

  const pendingItems = ref<IPendingApprovalItem[]>([]);
  const historyItems = ref<IPendingApprovalItem[]>([]);
  const viewMode = ref<'pending' | 'history'>('pending');
  const showDetailDialog = ref(false);
  const selectedItem = ref<IPendingApprovalItem | null>(null);
  const userApprovalRoles = ref<string[]>([]);

  // Detail data
  const poLines = ref<IPoLine[]>([]);
  const borrowLines = ref<IBorrowLine[]>([]);
  const approvalHistory = ref<IApprovalHistory[]>([]);
  const approvalLogs = ref<IBorrowApprovalLog[]>([]);

  // ─── Use actual logged-in user ID ───
  const currentUserId = computed(() => {
    try {
      // Try localStorage first
      let token = localStorage.getItem('token');

      // Fallback to VITE_DEV_TOKEN in development mode
      if (!token && import.meta.env.MODE === 'development') {
        token = import.meta.env.VITE_DEV_TOKEN;
      }

      if (!token) return '';
      const payload = JSON.parse(atob(token.split('.')[1]));
      return String(payload.UserID || '');
    } catch {
      return '';
    }
  });

  const displayItems = computed(() => {
    return viewMode.value === 'pending'
      ? pendingItems.value
      : historyItems.value;
  });

  const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
  });

  function typeLabel(type: string): string {
    return type === 'PO' ? 'Purchase Order' : 'Borrow';
  }

  function typeSeverity(type: string): string {
    return type === 'PO' ? 'info' : 'warn';
  }

  function statusLabel(status: string): string {
    const map: Record<string, string> = {
      PENDING_APPROVAL: 'PENDING APPROVAL',
      APPROVED_L1: 'APPROVED LEVEL 1',
      APPROVED_L2: 'APPROVED LEVEL 2',
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

  function formatRole(role: string): string {
    const map: Record<string, string> = {
      GROUP_LEAD: 'Group Leader',
      MANAGER: 'Manager',
      DEPARTMENT: 'Department Head',
    };
    return map[role] || role;
  }

  function getStepStatusLabel(item: any, currentLevel: number): string {
    if (item.status === 'APPROVE') return 'Approved';
    if (item.status === 'REJECT') return 'Rejected';
    if (item.status === 'REWORK') return 'Rework Required';
    if (item.status === 'CANCELLED') return 'Cancelled';

    if (item.approval_level === currentLevel) return 'Waiting for Approval';
    if (item.approval_level > currentLevel) return 'Upcoming Step';

    return 'Pending';
  }

  function getStepSeverity(item: any, currentLevel: number): string {
    if (item.status === 'APPROVE') return 'success';
    if (item.status === 'REJECT') return 'danger';
    if (item.status === 'REWORK') return 'warn';
    if (item.status === 'CANCELLED') return 'secondary';

    if (item.approval_level === currentLevel) return 'warn';
    return 'secondary';
  }

  function getStepIcon(item: any, currentLevel: number): string {
    if (item.status === 'APPROVE') return 'pi pi-check';
    if (item.status === 'REJECT') return 'pi pi-times';
    if (item.status === 'CANCELLED') return 'pi pi-ban';

    if (item.approval_level === currentLevel) return 'pi pi-clock';
    if (item.approval_level > currentLevel) return 'pi pi-calendar-plus';

    return 'pi pi-circle';
  }

  function approvalStatusLabel(status: string): string {
    const map: Record<string, string> = {
      PENDING: 'Waiting for Approval',
      APPROVE: 'Approved',
      REJECT: 'Rejected',
      REWORK: 'Rework Required',
      CANCELLED: 'Cancelled',
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

  function canApprove(item: IPendingApprovalItem | null): boolean {
    if (!item) return false;
    // Check if user has the required approval role
    const requiredRole = String(item.current_approval_role || '').trim();
    const hasRole = userApprovalRoles.value.includes(requiredRole);
    return hasRole;
  }

  async function loadPendingApprovals() {
    try {
      console.log('[loadPendingApprovals] starting...');
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error('API request timeout after 30s')),
          30000
        )
      );

      const data = (await Promise.race([
        ApprovalService.getPendingApprovals(),
        timeoutPromise,
      ])) as IPendingApprovalItem[];

      console.log('[loadPendingApprovals] success, data:', data);
      pendingItems.value = data;
    } catch (error) {
      console.error('[loadPendingApprovals] error:', error);
      // Re-throw so axios interceptor can handle it
      throw error;
    }
  }

  async function loadUserRoles() {
    try {
      const roles = await ApprovalService.getUserRoles();
      userApprovalRoles.value = roles;
    } catch (error) {
      console.error('[loadUserRoles] error:', error);
      // handled by axios interceptor
    }
  }

  async function loadHistoryApprovals() {
    try {
      const allHistory = await ApprovalService.getApprovalHistory();
      historyItems.value = allHistory.filter(item => item.status !== 'DRAFT');
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
        const result = await ApprovalService.getPoDetail(item.id);
        poLines.value = result.lines || [];
        approvalHistory.value = result.approvals || [];
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

  async function handleApprove(
    item: IPendingApprovalItem,
    action: 'APPROVE' | 'REJECT' | 'REWORK'
  ) {
    const actionLabel: Record<string, string> = {
      APPROVE: 'Approve',
      REJECT: 'Reject',
      REWORK: 'Rework',
    };

    // Close dialog first so Swal is not blocked by modal overlay
    showDetailDialog.value = false;
    await nextTick();

    let remark: string | undefined;

    if (action === 'REJECT' || action === 'REWORK') {
      const { value, isConfirmed } = await Swal.fire({
        title: actionLabel[action] + ' ' + item.doc_no,
        input: 'textarea',
        inputLabel: 'Reason (Required)',
        inputValidator: v => {
          if (!v || v.trim() === '') {
            return 'Please enter a reason';
          }
          return null;
        },
        showCancelButton: true,
        confirmButtonText: actionLabel[action],
        cancelButtonText: 'Cancel',
      });
      if (!isConfirmed) {
        showDetailDialog.value = true;
        return;
      }
      remark = value;
    } else {
      const result = await Swal.fire({
        title: 'Confirm ' + actionLabel[action] + '?',
        text: item.doc_no,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: actionLabel[action],
        cancelButtonText: 'Cancel',
      });
      if (!result.isConfirmed) {
        showDetailDialog.value = true;
        return;
      }
    }

    try {
      if (item.type === 'PO') {
        await ApprovalService.approvePo(item.id, {
          Action: action as 'APPROVE' | 'REJECT' | 'REWORK',
          Remark: remark,
        });
      } else {
        await ApprovalService.approveBorrow(item.id, {
          Action: action,
          Remark: remark,
        });
      }
      selectedItem.value = null;
      await Swal.fire('Success', actionLabel[action] + ' processed successfully', 'success');

      try {
        await loadPendingApprovals();
      } catch (loadError) {
        console.error(
          '[handleApprove] Error reloading pending approvals:',
          loadError
        );
        // Still continue to refresh badges
      }

      // Refresh badges
      const menuNotificationsStore = useMenuNotificationsStore();
      try {
        await Promise.all([
          menuNotificationsStore.refreshApprovalPendingCount(),
          menuNotificationsStore.refreshPoPendingCount(),
          menuNotificationsStore.refreshBorrowPendingCount(),
        ]);
      } catch (badgeError) {
        console.error('[handleApprove] Error refreshing badges:', badgeError);
      }
    } catch (error) {
      console.error('[handleApprove] Error in approval action:', error);
      // handled by axios interceptor
    }
  }

  onMounted(async () => {
    console.log(
      '[ApprovePurchase] onMounted - loading pending approvals and user roles'
    );
    await Promise.all([loadUserRoles(), loadPendingApprovals()]);
  });
</script>

<template>
  <div class="card">
    <div class="flex justify-between items-center mb-4">
      <div class="font-semibold text-xl">Medicine Purchase Approval</div>
    </div>

    <DataTable
      :value="displayItems"
      :paginator="true"
      :rows="15"
      v-model:filters="filters"
      filterDisplay="menu"
      :globalFilterFields="[
        'doc_no',
        'supplier_name',
        'created_by_name',
        'current_approver_name',
        'type',
      ]"
      dataKey="doc_no"
      stripedRows
      scrollable
      scrollHeight="65vh"
      tableStyle="min-width: 900px"
      :rowClass="(data: any) => (canApprove(data) ? 'row-my-turn' : '')"
    >
      <template #header>
        <div class="flex justify-between items-center gap-2">
          <div class="flex gap-2">
            <Button
              :label="'Pending Approvals'"
              :outlined="viewMode !== 'pending'"
              severity="info"
              size="small"
              @click="
                viewMode = 'pending';
                loadPendingApprovals();
              "
            />
            <Button
              :label="'History'"
              :outlined="viewMode !== 'history'"
              severity="secondary"
              size="small"
              @click="
                viewMode = 'history';
                loadHistoryApprovals();
              "
            />
          </div>
          <div class="flex gap-2">
            <Button
              icon="pi pi-refresh"
              rounded
              text
              @click="
                viewMode === 'pending'
                  ? loadPendingApprovals()
                  : loadHistoryApprovals()
              "
            />
            <IconField>
              <InputIcon class="pi pi-search" />
              <InputText
                v-model="filters['global'].value"
                :placeholder="'Search...'"
              />
            </IconField>
          </div>
        </div>
      </template>

      <template #empty>
        <div class="text-center py-6 text-surface-500">No data available</div>
      </template>

      <Column :header="'Type'" style="min-width: 100px">
        <template #body="{ data }">
          <Tag
            :value="typeLabel(data.type)"
            :severity="typeSeverity(data.type)"
          />
        </template>
      </Column>

      <Column
        field="doc_no"
        :header="'Document Number'"
        style="min-width: 160px"
      />

      <Column field="doc_date" :header="'Date'" style="min-width: 120px" />

      <Column
        field="supplier_name"
        :header="'Supplier'"
        style="min-width: 160px"
      />

      <!-- <Column :header="'Status'" style="min-width: 140px">
        <template #body="{ data }">
          <Tag
            :value="statusLabel(data.status)"
            :severity="statusSeverity(data.status)"
          />
        </template>
      </Column> -->

      <Column
        field="created_by_name"
        :header="'Created By'"
        style="min-width: 140px"
      />

      <Column :header="'Pending Approval By'" style="min-width: 240px">
        <template #body="{ data }">
          <div class="flex items-center gap-2">
            <Tag :value="data.current_approval_role" severity="secondary" />
            <span>
              {{ data.current_approver_name || data.current_approver_id }}
            </span>
            <Tag
              v-if="canApprove(data)"
              value="Requires Approval"
              severity="danger"
              icon="pi pi-bell"
            />
          </div>
        </template>
      </Column>

      <Column
        :header="'Actions'"
        style="min-width: 120px"
        frozen
        alignFrozen="right"
      >
        <template #body="{ data }">
          <Button
            icon="pi pi-eye"
            :label="'View Details'"
            severity="info"
            size="small"
            text
            @click="openDetail(data)"
          />
        </template>
      </Column>
    </DataTable>
  </div>

  <!-- ===== Detail Dialog ===== -->
  <Dialog
    v-model:visible="showDetailDialog"
    :header="
      selectedItem
        ? typeLabel(selectedItem.type) + ' ' + selectedItem.doc_no
        : ''
    "
    modal
    :style="{ width: '70vw' }"
    :breakpoints="{ '768px': '95vw' }"
  >
    <template v-if="selectedItem">
      <!-- Info Section -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div>
          <div class="text-surface-500 text-sm">Type</div>
          <Tag
            :value="typeLabel(selectedItem.type)"
            :severity="typeSeverity(selectedItem.type)"
          />
        </div>
        <div>
          <div class="text-surface-500 text-sm">Status</div>
          <Tag
            :value="statusLabel(selectedItem.status)"
            :severity="statusSeverity(selectedItem.status)"
          />
        </div>
        <div>
          <div class="text-surface-500 text-sm">Supplier</div>
          <div>{{ selectedItem.supplier_name }}</div>
        </div>
        <div>
          <div class="text-surface-500 text-sm">Created By</div>
          <div>
            {{ selectedItem.created_by_name || selectedItem.created_by }}
          </div>
        </div>
      </div>

      <div v-if="selectedItem.note" class="mb-4">
        <div class="text-surface-500 text-sm">Note</div>
        <div>{{ selectedItem.note }}</div>
      </div>

      <!-- PO Lines -->
      <div v-if="selectedItem.type === 'PO' && poLines.length > 0" class="mb-4">
        <div class="font-semibold mb-2">Purchase Order Lines</div>
        <DataTable :value="poLines" size="small" stripedRows>
          <Column :header="'Type'" style="min-width: 80px">
            <template #body="{ data }">
              <Tag
                :value="data.line_type === 'BORROW' ? 'Borrow' : 'Purchase Order'"
                :severity="data.line_type === 'BORROW' ? 'warning' : 'info'"
              />
            </template>
          </Column>
          <Column
            field="item_name_th"
            :header="'Item Name'"
            style="min-width: 200px"
          >
            <template #body="{ data }">
              {{ data.item_name_th }}
              <br />
              <small class="text-surface-400">{{ data.item_name_en }}</small>
            </template>
          </Column>
          <Column
            field="qty_order"
            :header="'Quantity Ordered'"
            style="min-width: 80px"
          />
          <Column :header="'Unit Price'" style="min-width: 100px">
            <template #body="{ data }">
              &#x0E3F;{{
                Number(data.unit_price).toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                })
              }}
            </template>
          </Column>
          <Column :header="'Total Price'" style="min-width: 100px">
            <template #body="{ data }">
              &#x0E3F;{{
                Number(data.total_price).toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                })
              }}
            </template>
          </Column>
          <Column
            field="purchase_unit_name_th"
            :header="'Purchase Unit'"
            style="min-width: 80px"
          />
        </DataTable>

        <!-- PO Total Summary -->
        <div class="mt-2 bg-surface-100 p-3 rounded border border-surface-200">
          <div class="flex justify-end items-center gap-3 text-xl">
            <span class="font-semibold">Total:</span>
            <span class="font-bold text-primary">
              ฿{{
                Number(
                  poLines.reduce(
                    (sum, line) => sum + (line.total_price || 0),
                    0
                  )
                ).toLocaleString('en-US', { minimumFractionDigits: 2 })
              }}
            </span>
          </div>
        </div>
      </div>

      <!-- Borrow Lines -->
      <div
        v-if="selectedItem.type === 'BORROW' && borrowLines.length > 0"
        class="mb-4"
      >
        <div class="font-semibold mb-2">Borrow Lines</div>
        <DataTable :value="borrowLines" size="small" stripedRows>
          <Column :header="'Type'" style="min-width: 80px">
            <template #body="{ data }">
              <Tag
                :value="data.line_type === 'ORDER' ? 'Purchase Order' : 'Borrow'"
                :severity="data.line_type === 'ORDER' ? 'info' : 'warning'"
              />
            </template>
          </Column>
          <Column
            field="item_name_th"
            :header="'Item Name'"
            style="min-width: 200px"
          >
            <template #body="{ data }">
              {{ data.item_name_th }}
              <br />
              <small class="text-surface-400">{{ data.item_name_en }}</small>
            </template>
          </Column>
          <Column
            field="qty_borrow"
            :header="'Quantity Borrowed'"
            style="min-width: 80px"
          />
          <Column :header="'Unit Price'" style="min-width: 100px">
            <template #body="{ data }">
              &#x0E3F;{{
                Number(data.unit_price).toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                })
              }}
            </template>
          </Column>
          <Column :header="'Total Price'" style="min-width: 100px">
            <template #body="{ data }">
              &#x0E3F;{{
                Number(data.total_price).toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                })
              }}
            </template>
          </Column>
          <Column
            field="purchase_unit_name_th"
            :header="'Purchase Unit'"
            style="min-width: 80px"
          />
        </DataTable>

        <!-- Borrow Total Summary -->
        <div class="mt-2 bg-surface-100 p-3 rounded border border-surface-200">
          <div class="flex justify-end items-center gap-3 text-xl">
            <span class="font-semibold">Total:</span>
            <span class="font-bold text-primary">
              ฿{{
                Number(
                  borrowLines.reduce(
                    (sum, line) => sum + (line.total_price || 0),
                    0
                  )
                ).toLocaleString('en-US', { minimumFractionDigits: 2 })
              }}
            </span>
          </div>
        </div>
      </div>

      <!-- Approval History -->
      <div class="mb-4">
        <div class="font-semibold mb-2">Approval History</div>
        <DataTable :value="approvalHistory" size="small" stripedRows>
          <Column
            :header="'No.'"
            field="approval_level"
            style="min-width: 60px"
          />
          <Column :header="'Approval Role'" style="min-width: 120px">
            <template #body="{ data }">
              {{ formatRole(data.approval_role) }}
            </template>
          </Column>
          <Column :header="'Status'" style="min-width: 120px">
            <template #body="{ data }">
              <Tag
                :value="approvalStatusLabel(data.status)"
                :severity="approvalStatusSeverity(data.status)"
              />
            </template>
          </Column>
          <Column :header="'Actioned By'" style="min-width: 140px">
            <template #body="{ data }">
              {{ data.actioned_by_name || data.actioned_by || '-' }}
            </template>
          </Column>
          <Column
            field="actioned_at"
            :header="'Actioned At'"
            style="min-width: 150px"
          >
            <template #body="{ data }">
              {{ formatSysdatetimeoffset(data.actioned_at) }}
            </template>
          </Column>
          <Column field="remark" :header="'Remark'" style="min-width: 200px">
            <template #body="{ data }">
              {{ data.remark || '-' }}
            </template>
          </Column>
        </DataTable>
      </div>

      <!-- Action Buttons (only if current user can approve) -->
      <div
        v-if="canApprove(selectedItem)"
        class="flex gap-2 justify-end pt-2 border-t mb-4"
      >
        <Button
          :label="'Approve'"
          icon="pi pi-check"
          severity="success"
          @click="handleApprove(selectedItem!, 'APPROVE')"
        />
        <Button
          :label="'Reject'"
          icon="pi pi-times"
          severity="danger"
          @click="handleApprove(selectedItem!, 'REJECT')"
        />
        <Button
          :label="'Rework'"
          icon="pi pi-replay"
          severity="warn"
          @click="handleApprove(selectedItem!, 'REWORK')"
        />
      </div>

      <!-- Approval Timeline -->
      <div v-if="approvalHistory.length > 0" class="mt-6 border-t pt-4">
        <div class="font-semibold mb-3 flex items-center gap-2">
          <i class="pi pi-history text-primary"></i>
          Approval Timeline
        </div>
        <Timeline :value="approvalHistory" align="left" class="pl-2">
          <template #marker="{ item }">
            <span
              class="flex items-center justify-center rounded-full border-2 w-8 h-8"
              :style="{
                borderColor:
                  getStepSeverity(
                    item,
                    selectedItem?.current_approval_level || 0
                  ) === 'success'
                    ? '#22C55E'
                    : getStepSeverity(
                          item,
                          selectedItem?.current_approval_level || 0
                        ) === 'danger'
                      ? '#EF4444'
                      : getStepSeverity(
                            item,
                            selectedItem?.current_approval_level || 0
                          ) === 'warn'
                        ? '#F59E0B'
                        : '#6B7280',
                backgroundColor:
                  (getStepSeverity(
                    item,
                    selectedItem?.current_approval_level || 0
                  ) === 'success'
                    ? '#22C55E'
                    : getStepSeverity(
                          item,
                          selectedItem?.current_approval_level || 0
                        ) === 'danger'
                      ? '#EF4444'
                      : getStepSeverity(
                            item,
                            selectedItem?.current_approval_level || 0
                          ) === 'warn'
                        ? '#F59E0B'
                        : '#6B7280') + '1A',
              }"
            >
              <i
                :class="
                  getStepIcon(item, selectedItem?.current_approval_level || 0)
                "
                :style="{
                  color:
                    getStepSeverity(
                      item,
                      selectedItem?.current_approval_level || 0
                    ) === 'success'
                      ? '#22C55E'
                      : getStepSeverity(
                            item,
                            selectedItem?.current_approval_level || 0
                          ) === 'danger'
                        ? '#EF4444'
                        : getStepSeverity(
                              item,
                              selectedItem?.current_approval_level || 0
                            ) === 'warn'
                          ? '#F59E0B'
                          : '#6B7280',
                }"
              />
            </span>
          </template>
          <template #content="{ item }">
            <div class="mb-4">
              <div class="flex items-center gap-2 mb-1">
                <Tag
                  :value="
                    getStepStatusLabel(
                      item,
                      selectedItem?.current_approval_level || 0
                    )
                  "
                  :severity="
                    getStepSeverity(
                      item,
                      selectedItem?.current_approval_level || 0
                    )
                  "
                />
                <span class="text-sm font-semibold text-surface-700">
                  {{ formatRole(item.approval_role) }}
                  <small class="text-surface-500 ml-1"
                    >(Level {{ item.approval_level }})</small
                  >
                </span>
              </div>
              <div v-if="item.actioned_by" class="text-sm">
                <span class="font-medium text-surface-900">
                  {{ item.actioned_by_name || item.actioned_by }}
                </span>
                <span class="text-surface-400 ml-2">
                  {{ formatSysdatetimeoffset(item.actioned_at) }}
                </span>
              </div>
              <div
                v-if="item.remark"
                class="text-sm text-surface-600 mt-1 italic p-2 rounded border-l-4 border-surface-200 bg-surface-50"
              >
                "{{ item.remark }}"
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
