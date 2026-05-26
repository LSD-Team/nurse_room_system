<script lang="ts" setup>
  import { ref, computed, onMounted } from 'vue';
  import { useRouter } from 'vue-router';
  import { PhysicalCountService } from '@/services/physical-count.service';
  import type { IStockPeriod } from '@/interfaces/physical-count.interfaces';
  import { formatDate } from '@/utils/format.utils';
  import Swal from 'sweetalert2';

  const router = useRouter();

  // ─── State ───
  const allPeriods = ref<IStockPeriod[]>([]);
  const loading = ref(false);

  // ─── Computed: filter PENDING_APPROVAL with a SUBMITTED count ───
  const pendingApprovalItems = computed(() =>
    allPeriods.value.filter(
      p =>
        p.period_status === 'PENDING_APPROVAL' &&
        p.active_count_id !== null &&
        p.active_count_status === 'SUBMITTED'
    )
  );

  // ─── Lifecycle ───
  onMounted(() => loadData());

  // ─── API ───
  async function loadData() {
    try {
      loading.value = true;
      allPeriods.value = await PhysicalCountService.getAvailablePeriods();
    } catch (error: any) {
      Swal.fire(
        'ข้อผิดพลาด',
        error.message || 'ไม่สามารถโหลดข้อมูลได้',
        'error'
      );
    } finally {
      loading.value = false;
    }
  }

  function handleViewDetail(period: IStockPeriod) {
    router.push({
      name: 'stockCountDetail',
      params: { countId: period.active_count_id! },
      query: { from: 'approval' },
    });
  }
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
              class="pi pi-check-circle text-teal-500"
              style="font-size: 1.8rem"
            ></i>
            <span class="text-2xl font-bold">อนุมัติการนับ Stock</span>
          </div>
          <Button
            icon="pi pi-refresh"
            label="รีเฟรช"
            class="p-button-outlined p-button-secondary"
            size="small"
            :loading="loading"
            @click="loadData"
          />
        </div>

        <!-- Loading -->
        <div
          v-if="loading"
          class="flex justify-content-center align-items-center"
          style="min-height: 200px"
        >
          <ProgressSpinner />
        </div>

        <!-- Empty state -->
        <div
          v-else-if="pendingApprovalItems.length === 0"
          class="flex flex-column align-items-center justify-content-center py-8 text-gray-400"
        >
          <i class="pi pi-inbox mb-3" style="font-size: 3rem"></i>
          <span class="text-lg">ไม่มีรายการรออนุมัติ</span>
          <span class="text-sm mt-1">เมื่อมีการส่งขออนุมัติจะปรากฎที่นี่</span>
        </div>

        <!-- Approval list -->
        <div v-else class="flex flex-column gap-3">
          <div
            v-for="period in pendingApprovalItems"
            :key="period.period_code"
            class="border-1 border-round surface-border p-4 flex align-items-center justify-content-between flex-wrap gap-3 hover:surface-hover transition-colors transition-duration-150"
          >
            <div class="flex flex-column gap-2">
              <div class="flex align-items-center gap-3">
                <i
                  class="pi pi-calendar text-teal-500"
                  style="font-size: 1.2rem"
                ></i>
                <span class="text-xl font-bold">{{ period.period_code }}</span>
                <Tag value="รออนุมัติ" severity="info" />
              </div>
              <div class="flex flex-wrap gap-4 text-sm text-gray-600">
                <span>
                  <i class="pi pi-clock mr-1 text-xs"></i>
                  <strong>ช่วงเวลา:</strong>
                  {{ formatDate(period.period_start) }} –
                  {{ formatDate(period.period_end) }}
                </span>
                <span>
                  <i class="pi pi-hashtag mr-1 text-xs"></i>
                  <strong>Count ID:</strong>
                  {{ period.active_count_id }}
                </span>
              </div>
            </div>

            <Button
              icon="pi pi-eye"
              label="ตรวจสอบและอนุมัติ"
              class="p-button-primary"
              @click="handleViewDetail(period)"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
