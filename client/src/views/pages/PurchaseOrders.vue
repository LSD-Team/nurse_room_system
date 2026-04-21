<script lang="ts" setup>
  import { ref, onMounted, computed } from 'vue';
  import { FilterMatchMode } from '@primevue/core/api';
  import { PoService } from '@/services/po.service';
  import { BorrowService } from '@/services/borrow.service';
  import { StockService, type IStockOnHand } from '@/services/stock.service';
  import type {
    IPoHeader,
    IPoLine,
    IPoApproval,
    IPendingBorrow,
  } from '@/interfaces/po.interfaces';
  import type {
    ISupplier,
    ISupplierItemPrice,
    IBorrowLine,
  } from '@/interfaces/borrow.interfaces';
  import { formatDate, formatNumber } from '@/utils/format.utils';
  import Swal from 'sweetalert2';

  const poHeaders = ref<IPoHeader[]>([]);
  const suppliers = ref<ISupplier[]>([]);
  const supplierPrices = ref<ISupplierItemPrice[]>([]);
  const stockOnHands = ref<IStockOnHand[]>([]);
  const pendingBorrows = ref<IPendingBorrow[]>([]);
  const loading = ref(false);
  const errorMsg = ref('');

  const showFormDialog = ref(false);
  const showDetailDialog = ref(false);
  const isEditing = ref(false);
  const editingPoId = ref<number | null>(null);

  const selectedSupplierId = ref<number | null>(null);
  const formPoDate = ref<Date>(new Date());
  const formDueDate = ref<Date | null>(null);
  const formNote = ref('');
  interface IOrderItem {
    item_id: number;
    item_code: string;
    item_name_th: string;
    item_name_en: string;
    unit_name_th: string;
    unit_price: number;
    qty_base: number | null;
    item_min: number | null;
    item_max: number | null;
    qty_order: number;
  }

  const orderItems = ref<IOrderItem[]>([]);
  const itemsFilterText = ref('');
  const selectedBorrowIds = ref<number[]>([]);

  const detailPo = ref<IPoHeader | null>(null);
  const detailLines = ref<IPoLine[]>([]);
  const detailApprovals = ref<IPoApproval[]>([]);
  const detailLoading = ref(false);
  const editBorrowLines = ref<IPoLine[]>([]);

  const showBorrowDetailDialog = ref(false);
  const borrowDetailLines = ref<IBorrowLine[]>([]);
  const borrowDetailLoading = ref(false);
  const borrowDetailNo = ref('');

  const selectedStatusFilter = ref<string>('');

  const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    po_no: { value: null, matchMode: FilterMatchMode.CONTAINS },
    po_status: { value: null, matchMode: FilterMatchMode.CONTAINS },
    supplier_name: { value: null, matchMode: FilterMatchMode.CONTAINS },
  });

  onMounted(async () => {
    await loadPoHeaders();
    await loadStockOnHands();
  });

  function getErrorMessage(err: unknown): string {
    if (err instanceof Error) {
      return err.message;
    }
    if (typeof err === 'object' && err !== null && 'response' in err) {
      const apiError = err as { response?: { data?: { message?: string } } };
      return apiError.response?.data?.message || String(err);
    }
    return String(err);
  }

  async function loadPoHeaders(): Promise<void> {
    loading.value = true;
    errorMsg.value = '';
    try {
      poHeaders.value = await PoService.getPoHeaders();
    } catch (err: unknown) {
      errorMsg.value = getErrorMessage(err);
    } finally {
      loading.value = false;
    }
  }

  async function loadStockOnHands(): Promise<void> {
    try {
      const data = await StockService.getStockStatus();
      stockOnHands.value = data;
    } catch (err: unknown) {
      console.error('Error loading stock on hands:', err);
    }
  }

  const numberedHeaders = computed(() =>
    poHeaders.value.map((item, index) => ({ ...item, rowNo: index + 1 }))
  );

  const filteredHeaders = computed(() => {
    if (!selectedStatusFilter.value) return numberedHeaders.value;
    return numberedHeaders.value.filter(
      item => item.po_status === selectedStatusFilter.value
    );
  });

  const formTotalAmount = computed(() =>
    orderItems.value.reduce(
      (sum, item) =>
        sum + (item.qty_order > 0 ? item.qty_order * item.unit_price : 0),
      0
    )
  );

  const filteredOrderItems = computed(() => {
    if (!itemsFilterText.value) return orderItems.value;
    const search = itemsFilterText.value.toLowerCase();
    return orderItems.value.filter(
      item =>
        item.item_code.toLowerCase().includes(search) ||
        item.item_name_th.toLowerCase().includes(search) ||
        item.item_name_en.toLowerCase().includes(search)
    );
  });

  const orderItemsWithQty = computed(() =>
    orderItems.value.filter(item => item.qty_order > 0)
  );

  const countDraft = computed(
    () =>
      numberedHeaders.value.filter(item => item.po_status === 'DRAFT').length
  );

  const countPendingApproval = computed(
    () =>
      numberedHeaders.value.filter(
        item => item.po_status === 'PENDING_APPROVAL'
      ).length
  );

  const countOrdered = computed(
    () =>
      numberedHeaders.value.filter(item => item.po_status === 'ORDERED').length
  );

  function formatDateToString(date: Date | null): string {
    if (!date) return '';
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  function parseDateString(dateStr: string | null): Date | null {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d;
  }

  function stockStatusClass(item: IOrderItem): string {
    if (item.qty_base == null) return '';
    if (item.item_min != null && item.qty_base < item.item_min)
      return 'text-red-600 font-bold';
    if (item.item_max != null && item.qty_base > item.item_max)
      return 'text-yellow-600 font-bold';
    return 'text-blue-600 font-semibold';
  }

  function printPo(): void {
    if (!detailPo.value || !detailLines.value) return;

    const printWindow = window.open('', '', 'width=900,height=1200');
    if (!printWindow) return;

    const tableRows = detailLines.value
      .map(
        (line, idx) => `
        <tr>
          <td style="text-align: center; padding: 8px; border: 1px solid #999;">${idx + 1}</td>
          <td style="padding: 8px; border: 1px solid #999;">${line.item_code}</td>
          <td style="padding: 8px; border: 1px solid #999;">
            <div><strong>${line.item_name_th}</strong></div>
            <div style="font-size: 12px; color: #666;">${line.item_name_en}</div>
          </td>
          <td style="text-align: right; padding: 8px; border: 1px solid #999;">${formatNumber(line.qty_order)}</td>
          <td style="text-align: center; padding: 8px; border: 1px solid #999;">${line.purchase_unit_name_th}</td>
          <td style="text-align: right; padding: 8px; border: 1px solid #999;">฿${formatNumber(line.unit_price)}</td>
          <td style="text-align: right; padding: 8px; border: 1px solid #999;">฿${formatNumber(line.total_price)}</td>
        </tr>
      `
      )
      .join('');

    const grandTotal = detailLines.value.reduce(
      (sum, line) => sum + (line.total_price || 0),
      0
    );

    const creatorName = detailPo.value.created_by_eng_name || '-';
    const today = new Date();
    const todayDate = today.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>ใบสั่งซื้อ - ${detailPo.value.po_no}</title>
        <style>
          * { margin: 0; padding: 0; }
          body { font-family: 'Trebuchet MS', Arial, sans-serif; padding: 30px; line-height: 1.4; }
          .container { max-width: 900px; margin: 0 auto; }
          .header { text-align: center; margin-bottom: 25px; }
          .header h1 { font-size: 22px; margin-bottom: 5px; font-weight: bold; }
          .header p { font-size: 13px; color: #666; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; font-size: 13px; }
          .info-label { font-weight: bold; color: #333; display: inline-block; width: 130px; }
          .info-value { display: inline; }
          .section-title { font-weight: bold; font-size: 14px; margin-top: 15px; margin-bottom: 10px; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 20px; }
          th { background-color: #e8e8e8; padding: 10px; border: 1px solid #999; text-align: left; font-weight: bold; }
          td { padding: 8px; border: 1px solid #999; }
          .total-row { font-weight: bold; background-color: #f5f5f5; }
          .total-row td { text-align: right; }
          .signature-section { display: grid; grid-template-columns: 1fr 1fr; gap: 50px; margin-top: 50px; }
          .signature-box { text-align: center; font-size: 12px; }
          .signature-line { border-top: 1px solid #000; margin-top: 50px; padding-top: 10px; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>ใบสั่งซื้อยา/เวชภัณฑ์</h1>
            <p>Purchase Order</p>
          </div>
          <div class="info-grid">
            <div>
              <div><span class="info-label">PO No.:</span><span class="info-value">${detailPo.value.po_no}</span></div>
              <div><span class="info-label">Supplier:</span><span class="info-value">${detailPo.value.supplier_name}</span></div>
            </div>
            <div>
              <div><span class="info-label">วันที่สั่งซื้อ:</span><span class="info-value">${formatDate(detailPo.value.po_date)}</span></div>
              <div><span class="info-label">วันครบกำหนด:</span><span class="info-value">${detailPo.value.due_date ? formatDate(detailPo.value.due_date) : '-'}</span></div>
              <div><span class="info-label">Created by:</span><span class="info-value">${creatorName}</span></div>
            </div>
          </div>
          <div class="section-title">รายละเอียดสินค้า / Item Details:</div>
          <table>
            <thead>
              <tr>
                <th style="width: 4%">#</th>
                <th style="width: 8%">Code</th>
                <th style="width: 36%">Name / ชื่อยา</th>
                <th style="width: 8%">Qty</th>
                <th style="width: 10%">Unit</th>
                <th style="width: 12%">Price/Unit</th>
                <th style="width: 12%">Total</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
              <tr class="total-row">
                <td colspan="6">Grand Total / รวมทั้งสิ้น</td>
                <td>฿${formatNumber(grandTotal)}</td>
              </tr>
            </tbody>
          </table>
          <div class="signature-section">
            <div class="signature-box">
              <div>ผู้สั่งซื้อ / Requestor</div>
              <div class="signature-line"></div>
              <div style="font-size: 11px;">${creatorName}</div>
              <div style="font-size: 11px;">${todayDate}</div>
            </div>
            <div class="signature-box">
              <div>ผู้อนุมัติ / Approved by</div>
              <div class="signature-line"></div>
              <br>
              <div style="font-size: 11px;">(.......................................................)</div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
  }

  function statusSeverity(status: string): string {
    const map: Record<string, string> = {
      DRAFT: 'secondary',
      PENDING_APPROVAL: 'warn',
      APPROVED_L1: 'info',
      APPROVED_L2: 'info',
      ORDERED: 'success',
      PARTIAL: 'warn',
      CLOSED: 'contrast',
      CANCELLED: 'danger',
    };
    return map[status] || 'secondary';
  }

  function statusLabel(status: string): string {
    return status;
  }

  async function openCreateDialog(): Promise<void> {
    isEditing.value = false;
    editingPoId.value = null;
    selectedSupplierId.value = null;
    formPoDate.value = new Date();
    formDueDate.value = null;
    formNote.value = '';
    orderItems.value = [];
    supplierPrices.value = [];
    pendingBorrows.value = [];
    itemsFilterText.value = '';
    selectedBorrowIds.value = [];

    try {
      suppliers.value = await PoService.getSuppliers();
    } catch (err: any) {
      errorMsg.value = getErrorMessage(err);
      return;
    }
    showFormDialog.value = true;
  }

  async function openEditDialog(row: IPoHeader) {
    isEditing.value = true;
    editingPoId.value = row.po_id;
    selectedSupplierId.value = row.supplier_id;
    formPoDate.value = parseDateString(row.po_date) || new Date();
    formDueDate.value = parseDateString(row.due_date);
    formNote.value = row.note || '';
    orderItems.value = [];
    itemsFilterText.value = '';
    selectedBorrowIds.value = [];
    pendingBorrows.value = [];
    editBorrowLines.value = [];

    try {
      suppliers.value = await PoService.getSuppliers();
      await onSupplierChange();
      const lines = await PoService.getPoLines(row.po_id);
      // Pre-populate qty from existing ORDER lines
      for (const line of lines.filter(l => l.line_type === 'ORDER')) {
        const orderItem = orderItems.value.find(
          oi => oi.item_id === line.item_id
        );
        if (orderItem) {
          orderItem.qty_order = line.qty_order;
        }
      }
      // Get settled borrow IDs for this PO and merge into pendingBorrows
      editBorrowLines.value = lines.filter(l => l.line_type === 'BORROW');
      const settledBorrowIds = [
        ...new Set(editBorrowLines.value.map(l => l.borrow_line_id)),
      ];
      // Fetch settled borrows from borrow_headers via pending borrows query
      // They won't appear in pending (status=RECEIVED) so we add them manually
      if (settledBorrowIds.length > 0) {
        // Group BORROW lines by borrow_id (derived from borrow_line linkage)
        // Use borrow_headers info from the PO lines
        const settledBorrows = await PoService.getSettledBorrows(row.po_id);
        // Merge: settled borrows + pending borrows (no duplicates)
        const pendingIds = pendingBorrows.value.map(b => b.borrow_id);
        for (const sb of settledBorrows) {
          if (!pendingIds.includes(sb.borrow_id)) {
            pendingBorrows.value.unshift(sb);
          }
        }
        // Pre-select the settled ones
        selectedBorrowIds.value = settledBorrows.map(b => b.borrow_id);
      }
    } catch (err: any) {
      errorMsg.value = getErrorMessage(err);
      return;
    }
    showFormDialog.value = true;
  }

  async function onSupplierChange(): Promise<void> {
    orderItems.value = [];
    if (!selectedSupplierId.value) {
      supplierPrices.value = [];
      pendingBorrows.value = [];
      return;
    }
    try {
      supplierPrices.value = await PoService.getSupplierPrices(
        selectedSupplierId.value
      );
      pendingBorrows.value = await PoService.getPendingBorrows(
        selectedSupplierId.value
      );
      // Merge supplier prices with stock data
      orderItems.value = supplierPrices.value.map(price => {
        const stock = stockOnHands.value.find(
          s => s.item_id === price.item_id
        );
        return {
          item_id: price.item_id,
          item_code: price.item_code,
          item_name_th: price.item_name_th,
          item_name_en: price.item_name_en,
          unit_name_th: price.unit_name_th,
          unit_price: price.unit_price,
          qty_base: stock?.qty_base ?? null,
          item_min: stock?.item_min ?? null,
          item_max: stock?.item_max ?? null,
          qty_order: 0,
        };
      });
    } catch (err: unknown) {
      errorMsg.value = getErrorMessage(err);
    }
  }

  function toggleBorrowSelection(borrowId: number): void {
    const idx = selectedBorrowIds.value.indexOf(borrowId);
    if (idx >= 0) {
      selectedBorrowIds.value.splice(idx, 1);
    } else {
      selectedBorrowIds.value.push(borrowId);
    }
  }

  async function viewBorrowDetail(borrow: IPendingBorrow): Promise<void> {
    borrowDetailNo.value = borrow.borrow_no;
    borrowDetailLines.value = [];
    borrowDetailLoading.value = true;
    showBorrowDetailDialog.value = true;
    try {
      borrowDetailLines.value = await BorrowService.getBorrowLines(
        borrow.borrow_id
      );
    } catch (err: unknown) {
      console.error('Error loading borrow lines:', err);
    } finally {
      borrowDetailLoading.value = false;
    }
  }

  async function savePo() {
    if (!selectedSupplierId.value) {
      await Swal.fire('แจ้งเตือน', 'กรุณาเลือก Supplier', 'warning');
      return;
    }

    const itemsToOrder = orderItems.value.filter(
      item => item.qty_order > 0
    );
    if (itemsToOrder.length === 0 && selectedBorrowIds.value.length === 0) {
      await Swal.fire(
        'แจ้งเตือน',
        'กรุณากรอกจำนวนสั่งซื้อหรือเลือกรายการยืมที่ต้องการ Settle อย่างน้อย 1 รายการ',
        'warning'
      );
      return;
    }

    const jsonLines =
      itemsToOrder.length > 0
        ? JSON.stringify(
            itemsToOrder.map(l => ({
              item_id: l.item_id,
              qty: l.qty_order,
            }))
          )
        : '[]';

    try {
      if (isEditing.value && editingPoId.value) {
        await PoService.updatePo(editingPoId.value, {
          DueDate: formatDateToString(formDueDate.value) || undefined,
          JsonLines: itemsToOrder.length > 0 ? jsonLines : undefined,
          BorrowIds: JSON.stringify(selectedBorrowIds.value),
          Note: formNote.value || undefined,
        });
        showFormDialog.value = false;
        await loadPoHeaders();
        await Swal.fire('สำเร็จ', 'แก้ไข PO เรียบร้อย', 'success');
      } else {
        const poDate = formatDateToString(formPoDate.value);
        if (!poDate) {
          await Swal.fire(
            'แจ้งเตือน',
            'กรุณาระบุวันที่สั่งซื้อ',
            'warning'
          );
          return;
        }

        await PoService.createPo({
          SupplierId: String(selectedSupplierId.value),
          PoDate: poDate,
          DueDate: formatDateToString(formDueDate.value) || undefined,
          JsonLines: jsonLines,
          BorrowIds:
            selectedBorrowIds.value.length > 0
              ? JSON.stringify(selectedBorrowIds.value)
              : undefined,
          Note: formNote.value || undefined,
        });
        showFormDialog.value = false;
        await loadPoHeaders();
        await Swal.fire('สำเร็จ', 'สร้าง PO เรียบร้อย', 'success');
      }
    } catch (err: any) {
      // Error handled by axios interceptor
    }
  }

  function approvalStatusIcon(status: string): string {
    const map: Record<string, string> = {
      APPROVE: 'pi pi-check',
      REJECT: 'pi pi-times',
      PENDING: 'pi pi-clock',
      CANCELLED: 'pi pi-ban',
    };
    return map[status] || 'pi pi-circle';
  }

  function approvalStatusColor(status: string): string {
    const map: Record<string, string> = {
      APPROVE: '#22C55E',
      REJECT: '#EF4444',
      PENDING: '#F59E0B',
      CANCELLED: '#6B7280',
    };
    return map[status] || '#6B7280';
  }

  function approvalStatusLabel(status: string): string {
    const map: Record<string, string> = {
      APPROVE: 'อนุมัติ',
      REJECT: 'ปฏิเสธ',
      PENDING: 'รอการอนุมัติ',
      CANCELLED: 'ยกเลิก',
    };
    return map[status] || status;
  }

  async function viewDetail(row: IPoHeader) {
    detailPo.value = row;
    detailLoading.value = true;
    detailLines.value = [];
    detailApprovals.value = [];
    showDetailDialog.value = true;
    try {
      const [lines, approvals] = await Promise.all([
        PoService.getPoLines(row.po_id),
        PoService.getPoApprovals(row.po_id),
      ]);
      detailLines.value = lines;
      detailApprovals.value = approvals;
    } catch (err: any) {
      errorMsg.value = getErrorMessage(err);
    } finally {
      detailLoading.value = false;
    }
  }

  async function submitPo(row: IPoHeader) {
    const result = await Swal.fire({
      title: 'ยืนยันส่งอนุมัติ?',
      text: 'PO ' + row.po_no,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'ส่งอนุมัติ',
      cancelButtonText: 'ยกเลิก',
    });
    if (!result.isConfirmed) return;

    try {
      await PoService.submitPo(row.po_id);
      await Swal.fire('สำเร็จ', 'ส่งอนุมัติเรียบร้อย', 'success');
      await loadPoHeaders();
    } catch (err: any) {
      // Error handled by axios interceptor
    }
  }

  async function cancelPo(row: IPoHeader) {
    const { value, isConfirmed } = await Swal.fire({
      title: 'ยกเลิก PO ' + row.po_no + '?',
      input: 'textarea',
      inputLabel: 'เหตุผล (ถ้ามี)',
      showCancelButton: true,
      confirmButtonText: 'ยกเลิก PO',
      confirmButtonColor: '#dc3545',
      cancelButtonText: 'ปิด',
    });
    if (!isConfirmed) return;

    try {
      await PoService.cancelPo(row.po_id, value || undefined);
      await Swal.fire(
        'สำเร็จ',
        'ยกเลิก PO ' + row.po_no + ' สำเร็จ',
        'success'
      );
      await loadPoHeaders();
    } catch (err: any) {
      // Error handled by axios interceptor
    }
  }
</script>

<template>
  <div class="card">
    <div class="flex items-center justify-between mb-4">
      <div>
        <h2 class="text-2xl font-bold text-surface-900 dark:text-surface-0">
          สั่งซื้อยา/เวชภัณฑ์
        </h2>
        <p class="text-surface-500 mt-1">
          รายละเอียดการสั่งซื้อยา/เวชภัณฑ์ (Purchase Orders)
        </p>
      </div>
      <Button
        label="สร้าง PO"
        icon="pi pi-plus"
        @click="openCreateDialog"
      />
    </div>

    <Message v-if="errorMsg" severity="error" class="mb-4">
      <span class="font-semibold">ข้อผิดพลาด: </span>
      {{ errorMsg }}
    </Message>

    <DataTable
      v-model:filters="filters"
      :value="filteredHeaders"
      :loading="loading"
      dataKey="po_id"
      paginator
      :rows="20"
      :rowsPerPageOptions="[10, 20, 50, 100]"
      stateStorage="local"
      stateKey="dt-po-headers"
      sortMode="multiple"
      removableSort
      scrollable
      scrollHeight="600px"
      :globalFilterFields="['po_no', 'supplier_name', 'po_status']"
      class="p-datatable-sm"
    >
      <template #header>
        <div class="flex justify-between items-center gap-2">
          <div class="flex gap-2 flex-wrap">
            <Button
              label="All"
              :variant="selectedStatusFilter === '' ? 'contained' : 'outlined'"
              @click="selectedStatusFilter = ''"
              class="text-sm"
            />
            <Button
              :variant="
                selectedStatusFilter === 'DRAFT' ? 'contained' : 'outlined'
              "
              @click="selectedStatusFilter = 'DRAFT'"
              class="text-sm"
            >
              <template #default>
                <span>DRAFT</span>
                <Badge
                  v-if="countDraft > 0"
                  :value="countDraft"
                  severity="warning"
                  class="ml-2"
                />
              </template>
            </Button>
            <Button
              :variant="
                selectedStatusFilter === 'PENDING_APPROVAL'
                  ? 'contained'
                  : 'outlined'
              "
              @click="selectedStatusFilter = 'PENDING_APPROVAL'"
              class="text-sm"
            >
              <template #default>
                <span>PENDING_APPROVAL</span>
                <Badge
                  v-if="countPendingApproval > 0"
                  :value="countPendingApproval"
                  severity="warning"
                  class="ml-2"
                />
              </template>
            </Button>
            <Button
              :variant="
                selectedStatusFilter === 'ORDERED' ? 'contained' : 'outlined'
              "
              @click="selectedStatusFilter = 'ORDERED'"
              class="text-sm"
            >
              <template #default>
                <span>ORDERED</span>
                <Badge
                  v-if="countOrdered > 0"
                  :value="countOrdered"

                  class="ml-2"
                />
              </template>
            </Button>
            <Button
              label="PARTIAL"
              :variant="
                selectedStatusFilter === 'PARTIAL' ? 'contained' : 'outlined'
              "
              @click="selectedStatusFilter = 'PARTIAL'"
              class="text-sm"
            />
            <Button
              label="CLOSED"
              :variant="
                selectedStatusFilter === 'CLOSED' ? 'contained' : 'outlined'
              "
              @click="selectedStatusFilter = 'CLOSED'"
              class="text-sm"
            />
            <Button
              label="CANCELLED"
              :variant="
                selectedStatusFilter === 'CANCELLED' ? 'contained' : 'outlined'
              "
              @click="selectedStatusFilter = 'CANCELLED'"
              class="text-sm"
            />
          </div>
          <IconField>
            <InputIcon class="pi pi-search" />
            <InputText
              v-model="filters['global'].value"
              placeholder="ค้นหา..."
            />
          </IconField>
        </div>
      </template>

      <template #empty>ไม่พบข้อมูล</template>
      <template #loading>กำลังโหลดข้อมูล...</template>

      <Column
        field="rowNo"
        header="#"
        sortable
        style="min-width: 60px; max-width: 80px"
        frozen
      />
      <Column
        field="po_no"
        header="เลขที่ PO"
        sortable
        style="min-width: 160px"
        frozen
      >
        <template #body="{ data }">
          <a
            class="text-primary cursor-pointer font-semibold hover:underline"
            @click="viewDetail(data)"
          >
            {{ data.po_no }}
          </a>
        </template>
      </Column>
      <Column
        field="po_date"
        header="วันที่สั่งซื้อ"
        sortable
        style="min-width: 130px"
      >
        <template #body="{ data }">{{ formatDate(data.po_date) }}</template>
      </Column>
      <Column
        field="due_date"
        header="วันครบกำหนด"
        sortable
        style="min-width: 130px"
      >
        <template #body="{ data }">
          {{ data.due_date ? formatDate(data.due_date) : '-' }}
        </template>
      </Column>
      <Column
        field="supplier_name"
        header="Supplier"
        sortable
        style="min-width: 200px"
      />
      <Column
        field="po_status"
        header="สถานะ PO"
        sortable
        style="min-width: 160px"
      >
        <template #body="{ data }">
          <Tag
            :value="statusLabel(data.po_status)"
            :severity="statusSeverity(data.po_status)"
          />
        </template>
      </Column>
      <Column
        field="approval_role"
        header="บทบาทผู้อนุมัติ"
        style="min-width: 130px"
      >
        <template #body="{ data }">
          {{ data.approval_role || '-' }}
        </template>
      </Column>
      <Column
        field="approval_status"
        header="สถานะการอนุมัติ"
        style="min-width: 130px"
      >
        <template #body="{ data }">
          {{ data.approval_status || '-' }}
        </template>
      </Column>
      <Column
        field="created_by_eng_name"
        header="ผู้สร้าง"
        style="min-width: 130px"
      >
        <template #body="{ data }">
          {{ data.created_by_eng_name || '-' }}
        </template>
      </Column>
      <Column
        header="จัดการ"
        style="min-width: 200px"
        frozen
        alignFrozen="right"
      >
        <template #body="{ data }">
          <div class="flex gap-1 flex-wrap">
            <template v-if="data.po_status === 'DRAFT'">
              <Button
                label="แก้ไข"
                icon="pi pi-pencil"
                severity="info"
                size="small"
                text
                @click="openEditDialog(data)"
              />
              <Button
                label="ส่งอนุมัติ"
                icon="pi pi-send"
                severity="info"
                size="small"
                text
                @click="submitPo(data)"
              />
              <Button
                label="ยกเลิก"
                icon="pi pi-times"
                severity="danger"
                size="small"
                text
                @click="cancelPo(data)"
              />
            </template>
            <template
              v-else-if="
                ['PENDING_APPROVAL', 'APPROVED_L1', 'APPROVED_L2'].includes(
                  data.po_status
                )
              "
            >
              <Badge value="รอการอนุมัติ" severity="warn" />
            </template>
            <template v-else-if="data.po_status === 'ORDERED'">
              <Button
                label="ยกเลิก"
                icon="pi pi-times"
                severity="danger"
                size="small"
                text
                @click="cancelPo(data)"
              />
            </template>
            <template
              v-else-if="['PARTIAL', 'CLOSED'].includes(data.po_status)"
            >
              <Badge value="สำเร็จ" severity="info" />
            </template>
            <template v-else-if="data.po_status === 'CANCELLED'">
              <Badge value="ยกเลิก" severity="danger" />
            </template>
          </div>
        </template>
      </Column>
    </DataTable>

    <!-- ===== Form Dialog (Create / Edit PO) ===== -->
    <Dialog
      v-model:visible="showFormDialog"
      :header="isEditing ? 'แก้ไข PO' : 'สร้างใบสั่งซื้อ (PO)'"
      modal
      :style="{ width: '1300px' }"
      :closable="true"
    >
      <div class="flex flex-col gap-4">
        <!-- Supplier -->
        <div class="flex flex-col gap-2">
          <label class="font-semibold">Supplier *</label>
          <Select
            v-model="selectedSupplierId"
            :options="suppliers"
            optionLabel="supplier_name"
            optionValue="supplier_id"
            placeholder="เลือก Supplier"
            :disabled="isEditing"
            filter
            @change="onSupplierChange"
          />
        </div>

        <!-- Dates -->
        <div class="grid grid-cols-2 gap-4">
          <div class="flex flex-col gap-2">
            <label class="font-semibold">วันที่สั่งซื้อ *</label>
            <DatePicker
              v-model="formPoDate"
              dateFormat="dd/mm/yy"
              :disabled="isEditing"
              showIcon
            />
          </div>
          <div class="flex flex-col gap-2">
            <label class="font-semibold">วันครบกำหนด</label>
            <DatePicker
              v-model="formDueDate"
              dateFormat="dd/mm/yy"
              showIcon
              showButtonBar
            />
          </div>
        </div>

        <!-- Note -->
        <div class="flex flex-col gap-2">
          <label class="font-semibold">หมายเหตุ (optional)</label>
          <Textarea v-model="formNote" rows="2" />
        </div>

        <!-- All Items Table -->
        <div v-if="selectedSupplierId" class="flex flex-col gap-2">
          <div class="flex items-center justify-between">
            <label class="font-semibold">รายการยา/เวชภัณฑ์ทั้งหมด</label>
            <div class="flex items-center gap-3">
              <span
                v-if="orderItemsWithQty.length > 0"
                class="text-sm font-semibold text-primary"
              >
                เลือก {{ orderItemsWithQty.length }} รายการ
              </span>
              <IconField>
                <InputIcon class="pi pi-search" />
                <InputText
                  v-model="itemsFilterText"
                  placeholder="ค้นหารายการยา..."
                  class="w-64"
                />
              </IconField>
            </div>
          </div>
          <DataTable
            :value="filteredOrderItems"
            dataKey="item_id"
            class="p-datatable-sm"
            scrollable
            scrollHeight="400px"
            paginator
            :rows="50"
            :rowsPerPageOptions="[20, 50, 100]"
          >
            <template #empty>ไม่พบรายการ</template>
            <Column
              field="item_code"
              header="รหัส"
              style="min-width: 100px"
            />
            <Column
              field="item_name_th"
              header="ชื่อยา"
              style="min-width: 220px"
            >
              <template #body="{ data }">
                <div>{{ data.item_name_th }}</div>
                <div class="text-sm text-surface-400">
                  {{ data.item_name_en }}
                </div>
              </template>
            </Column>
            <Column
              header="คงเหลือ"
              style="min-width: 90px"
              bodyClass="text-right"
            >
              <template #body="{ data }">
                <span :class="stockStatusClass(data)">
                  {{
                    data.qty_base != null ? formatNumber(data.qty_base) : '-'
                  }}
                </span>
              </template>
            </Column>
            <Column
              header="Min"
              style="min-width: 70px"
              bodyClass="text-right"
            >
              <template #body="{ data }">
                {{ data.item_min != null ? formatNumber(data.item_min) : '-' }}
              </template>
            </Column>
            <Column
              header="Max"
              style="min-width: 70px"
              bodyClass="text-right"
            >
              <template #body="{ data }">
                {{ data.item_max != null ? formatNumber(data.item_max) : '-' }}
              </template>
            </Column>
            <Column
              field="unit_name_th"
              header="หน่วย"
              style="min-width: 80px"
            />
            <Column
              header="ราคา/หน่วย"
              style="min-width: 100px"
              bodyClass="text-right"
            >
              <template #body="{ data }">
                ฿{{ formatNumber(data.unit_price) }}
              </template>
            </Column>
            <Column
              header="จำนวนสั่งซื้อ"
              style="min-width: 150px"
            >
              <template #body="{ data }">
                <InputNumber
                  v-model="data.qty_order"
                  :min="0"
                  showButtons
                  size="small"
                  class="w-full"
                />
              </template>
            </Column>
            <Column
              header="รวม"
              style="min-width: 110px"
              bodyClass="text-right"
            >
              <template #body="{ data }">
                <span v-if="data.qty_order > 0" class="font-semibold">
                  ฿{{ formatNumber(data.qty_order * data.unit_price) }}
                </span>
                <span v-else class="text-surface-400">-</span>
              </template>
            </Column>
          </DataTable>
        </div>

        <div
          v-if="orderItemsWithQty.length > 0"
          class="flex justify-end text-lg font-bold"
        >
          รวมทั้งหมด: ฿{{ formatNumber(formTotalAmount) }}
        </div>

        <!-- Borrow Settlement Section -->
        <div
          v-if="
            selectedSupplierId &&
            pendingBorrows.length > 0
          "
          class="flex flex-col gap-2"
        >
          <label class="font-semibold">
            รายการยืมที่สามารถ Settle (เลือกเพื่อรวมเข้า PO)
          </label>
          <DataTable
            :value="pendingBorrows"
            dataKey="borrow_id"
            class="p-datatable-sm"
          >
            <Column header="" style="min-width: 50px">
              <template #body="{ data }">
                <Checkbox
                  :modelValue="selectedBorrowIds.includes(data.borrow_id)"
                  :binary="true"
                  @update:modelValue="toggleBorrowSelection(data.borrow_id)"
                />
              </template>
            </Column>
            <Column
              field="borrow_no"
              header="เลขที่ใบยืม"
              style="min-width: 150px"
            >
              <template #body="{ data }">
                <a
                  class="text-primary cursor-pointer font-semibold hover:underline"
                  @click="viewBorrowDetail(data)"
                >
                  {{ data.borrow_no }}
                </a>
              </template>
            </Column>
            <Column
              field="borrow_date"
              header="วันที่ยืม"
              style="min-width: 120px"
            >
              <template #body="{ data }">
                {{ formatDate(data.borrow_date) }}
              </template>
            </Column>
            <Column
              field="supplier_name"
              header="Supplier"
              style="min-width: 150px"
            />
            <Column
              field="item_count"
              header="จำนวนรายการ"
              style="min-width: 100px"
              bodyClass="text-right"
            />
            <Column
              header="มูลค่ารวม"
              style="min-width: 120px"
              bodyClass="text-right"
            >
              <template #body="{ data }">
                ฿{{ formatNumber(data.total_amount) }}
              </template>
            </Column>
          </DataTable>
        </div>
      </div>

      <template #footer>
        <Button
          label="ยกเลิก"
          icon="pi pi-times"
          severity="secondary"
          text
          @click="showFormDialog = false"
        />
        <Button
          :label="isEditing ? 'บันทึก' : 'สร้าง PO'"
          icon="pi pi-check"
          @click="savePo"
        />
      </template>
    </Dialog>

    <!-- ===== Detail Dialog ===== -->
    <Dialog
      v-model:visible="showDetailDialog"
      modal
      :style="{ width: '1000px' }"
      :closable="true"
    >
      <template #header>
        <div class="flex justify-between items-center w-full">
          <span>รายละเอียด PO</span>
          <Button
            v-if="
              ['ORDERED', 'PARTIAL', 'CLOSED'].includes(
                detailPo?.po_status || ''
              )
            "
            icon="pi pi-print"
            label="Print"
            severity="info"
            size="small"
            class="mr-8"
            @click="printPo"
          />
        </div>
      </template>
      <div v-if="detailPo" class="flex flex-col gap-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <span class="font-semibold text-surface-500">เลขที่ PO:</span>
            <span class="ml-2">{{ detailPo.po_no }}</span>
          </div>
          <div>
            <span class="font-semibold text-surface-500">วันที่สั่งซื้อ:</span>
            <span class="ml-2">{{ formatDate(detailPo.po_date) }}</span>
          </div>
          <div>
            <span class="font-semibold text-surface-500">Supplier:</span>
            <span class="ml-2">{{ detailPo.supplier_name }}</span>
          </div>
          <div>
            <span class="font-semibold text-surface-500">วันครบกำหนด:</span>
            <span class="ml-2">
              {{ detailPo.due_date ? formatDate(detailPo.due_date) : '-' }}
            </span>
          </div>
          <div>
            <span class="font-semibold text-surface-500">สถานะ PO:</span>
            <Tag
              class="ml-2"
              :value="statusLabel(detailPo.po_status)"
              :severity="statusSeverity(detailPo.po_status)"
            />
          </div>
          <div v-if="detailPo.created_by_eng_name">
            <span class="font-semibold text-surface-500">ผู้สร้าง:</span>
            <span class="ml-2">{{ detailPo.created_by_eng_name }}</span>
          </div>
          <div v-if="detailPo.note" class="col-span-2">
            <span class="font-semibold text-surface-500">หมายเหตุ:</span>
            <span class="ml-2">{{ detailPo.note }}</span>
          </div>
        </div>

        <!-- Lines Table -->
        <DataTable
          :value="detailLines"
          :loading="detailLoading"
          dataKey="po_line_id"
          class="p-datatable-sm"
        >
          <template #empty>ไม่พบข้อมูล</template>
          <Column header="#" style="min-width: 50px">
            <template #body="{ index }">{{ index + 1 }}</template>
          </Column>
          <Column
            field="item_code"
            header="รหัสยา"
            style="min-width: 100px"
          />
          <Column
            field="item_name_th"
            header="ชื่อยา"
            style="min-width: 220px"
          >
            <template #body="{ data }">
              <div>{{ data.item_name_th }}</div>
              <div class="text-sm text-surface-400">
                {{ data.item_name_en }}
              </div>
            </template>
          </Column>
          <Column
            field="line_type"
            header="ประเภท"
            style="min-width: 90px"
          >
            <template #body="{ data }">
              <Tag
                :value="data.line_type"
                :severity="
                  data.line_type === 'ORDER' ? 'info' : 'warn'
                "
              />
            </template>
          </Column>
          <Column
            field="qty_order"
            header="จำนวนสั่ง"
            style="min-width: 90px"
            bodyClass="text-right"
          >
            <template #body="{ data }">
              {{ formatNumber(data.qty_order, 0) }}
            </template>
          </Column>
          <Column
            field="qty_received"
            header="รับแล้ว"
            style="min-width: 80px"
            bodyClass="text-right"
          >
            <template #body="{ data }">
              {{ formatNumber(data.qty_received, 0) }}
            </template>
          </Column>
          <Column
            field="purchase_unit_name_th"
            header="หน่วยซื้อ"
            style="min-width: 100px"
          />
          <Column
            field="unit_price"
            header="ราคา/หน่วย"
            style="min-width: 110px"
            bodyClass="text-right"
          >
            <template #body="{ data }">
              ฿{{ formatNumber(data.unit_price) }}
            </template>
          </Column>
          <Column
            field="total_price"
            header="รวม"
            style="min-width: 110px"
            bodyClass="text-right"
          >
            <template #body="{ data }">
              ฿{{ formatNumber(data.total_price) }}
            </template>
          </Column>
        </DataTable>

        <!-- Approval Timeline -->
        <div v-if="detailApprovals.length > 0" class="mt-4">
          <div class="font-semibold text-surface-500 mb-2">
            Timeline การอนุมัติ
          </div>
          <Timeline :value="detailApprovals" align="left" class="pl-2">
            <template #marker="{ item }">
              <span
                class="flex items-center justify-center rounded-full border-2 w-8 h-8"
                :style="{
                  borderColor: approvalStatusColor(item.status),
                  backgroundColor:
                    approvalStatusColor(item.status) + '1A',
                }"
              >
                <i
                  :class="approvalStatusIcon(item.status)"
                  :style="{ color: approvalStatusColor(item.status) }"
                />
              </span>
            </template>
            <template #content="{ item }">
              <div class="mb-3">
                <div class="flex items-center gap-2 mb-1">
                  <Tag
                    :value="approvalStatusLabel(item.status)"
                    :style="{
                      backgroundColor: approvalStatusColor(item.status),
                      color: '#fff',
                    }"
                  />
                  <span class="text-sm text-surface-500">
                    {{ item.approval_role }}
                    (L{{ item.approval_level }})
                  </span>
                </div>
                <div v-if="item.actioned_by" class="text-sm">
                  <span class="font-medium">
                    {{ item.actioned_by_name || item.actioned_by }}
                  </span>
                  <span class="text-surface-400 ml-2">
                    {{
                      item.actioned_at
                        ? new Date(item.actioned_at).toLocaleString('th-TH')
                        : ''
                    }}
                  </span>
                </div>
                <div
                  v-if="item.remark"
                  class="text-sm text-surface-500 mt-1"
                >
                  <i class="pi pi-comment mr-1" />
                  {{ item.remark }}
                </div>
              </div>
            </template>
          </Timeline>
        </div>
      </div>
    </Dialog>

    <!-- ===== Borrow Detail Dialog ===== -->
    <Dialog
      v-model:visible="showBorrowDetailDialog"
      :header="'รายละเอียดใบยืม ' + borrowDetailNo"
      modal
      :style="{ width: '800px' }"
      :closable="true"
    >
      <DataTable
        :value="borrowDetailLines"
        :loading="borrowDetailLoading"
        dataKey="borrow_line_id"
        class="p-datatable-sm"
      >
        <template #empty>ไม่พบข้อมูล</template>
        <Column header="#" style="min-width: 50px">
          <template #body="{ index }">{{ index + 1 }}</template>
        </Column>
        <Column
          field="item_code"
          header="รหัสยา"
          style="min-width: 100px"
        />
        <Column
          field="item_name_th"
          header="ชื่อยา"
          style="min-width: 250px"
        >
          <template #body="{ data }">
            <div>{{ data.item_name_th }}</div>
            <div class="text-sm text-surface-400">
              {{ data.item_name_en }}
            </div>
          </template>
        </Column>
        <Column
          field="qty_borrow"
          header="จำนวน"
          style="min-width: 80px"
          bodyClass="text-right"
        />
        <Column
          field="purchase_unit_name_th"
          header="หน่วย"
          style="min-width: 100px"
        />
        <Column
          field="unit_price"
          header="ราคา/หน่วย"
          style="min-width: 110px"
          bodyClass="text-right"
        >
          <template #body="{ data }">
            ฿{{ formatNumber(data.unit_price) }}
          </template>
        </Column>
        <Column
          field="total_price"
          header="รวม"
          style="min-width: 110px"
          bodyClass="text-right"
        >
          <template #body="{ data }">
            ฿{{ formatNumber(data.total_price) }}
          </template>
        </Column>
      </DataTable>
    </Dialog>
  </div>
</template>
