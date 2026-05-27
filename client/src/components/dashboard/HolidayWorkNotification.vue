<script lang="ts" setup>
import { onMounted, onUnmounted, ref } from 'vue';
import { HolidayWorkService } from '@/services/holiday-work.service';
import type { IHolidayWorkAnnouncement, HolidayWorkMessageType } from '@/interfaces/holiday-work.interfaces';
import Popover from 'primevue/popover';
import Tag from 'primevue/tag';

const activeAnnouncements = ref<IHolidayWorkAnnouncement[]>([]);
const hasBeenViewed = ref(false);
const op = ref<InstanceType<typeof Popover> | null>(null);
const loading = ref(false);
let pollingInterval: any = null;

const fetchAnnouncements = async (silent = false) => {
  try {
    const data = await HolidayWorkService.getActive(silent);
    const newData = data || [];

    // Check if data actually changed
    if (JSON.stringify(newData) !== JSON.stringify(activeAnnouncements.value)) {
      activeAnnouncements.value = newData;
      // If data changes (new announcement or update), reset the viewed state
      // so the nurse sees the animation again
      hasBeenViewed.value = false;
    }
  } catch (error) {
    if (!silent) {
      console.error('Failed to fetch holiday work announcements:', error);
    }
  }
};

const toggle = (event: any) => {
  if (op.value) {
    op.value.toggle(event);
    // Mark as viewed when the popover is opened
    hasBeenViewed.value = true;
  }
};

const getMessageLabel = (type: HolidayWorkMessageType) => {
  const labels: Record<string, string> = {
    'CHECK_IN_5AM': 'เข้าเวร 05:00 น. (ฝากกระเป๋ายาที่ป้อมยาม)',
    'NO_SHIFT_ALL': 'ไม่มีเวรทั้งกลางวันและกลางคืน',
    'NORMAL_8AM': 'เข้าเวรปกติ 08:00 น.',
    'OTHER': 'อื่นๆ (ระบุข้อความเอง)',
  };
  return labels[type] || type;
};

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const targetDate = new Date(dateStr);
  targetDate.setHours(0, 0, 0, 0);

  if (targetDate.getTime() === today.getTime()) return 'วันนี้ (Today)';
  return 'พรุ่งนี้ (Tomorrow)';
};

function formatFullDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

onMounted(async () => {
  loading.value = true;
  await fetchAnnouncements(false);
  loading.value = false;
  // Polling every 1 minute for testing (using silent mode)
  pollingInterval = setInterval(() => fetchAnnouncements(true), 1 * 60 * 1000);
});

onUnmounted(() => {
  if (pollingInterval) clearInterval(pollingInterval);
});
</script>

<template>
  <div class="holiday-work-notification">
    <button
      type="button"
      class="layout-topbar-action relative"
      @click="toggle"
      :class="{ 'has-notifications': activeAnnouncements.length > 0 }"
    >
      <i :class="['pi pi-bell', { 'text-primary': activeAnnouncements.length > 0, 'animate-swing': activeAnnouncements.length > 0 && !hasBeenViewed }]"></i>

      <!-- Red Dot / Badge with Ping Effect -->
      <span v-if="activeAnnouncements.length > 0" class="absolute top-0 right-0 flex h-3 w-3 translate-x-1 -translate-y-1">
        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
        <span class="relative inline-flex rounded-full h-3 w-3 bg-red-500 border-2 border-white"></span>
      </span>
    </button>

    <Popover ref="op" style="width: 350px">
      <div class="p-1">
        <div class="flex items-center justify-between mb-3 pb-2 border-b">
          <span class="font-bold text-lg flex items-center gap-2 text-surface-900 dark:text-surface-0">
            <i class="pi pi-calendar text-primary"></i>
            ข้อมูลจำนวนพนักงานที่มาทำงานในวันหยุด (Holiday Work Info)
          </span>
          <Tag v-if="activeAnnouncements.length > 0" severity="danger" :value="`${activeAnnouncements.length} รายการ`" />
        </div>

        <div v-if="activeAnnouncements.length > 0" class="flex flex-col gap-4">
          <div v-for="item in activeAnnouncements" :key="item.work_date"
            class="p-2 rounded-lg bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700"
          >
            <div class="flex items-center justify-between mb-1">
              <span class="font-bold text-primary">{{ formatFullDate(item.work_date) }}</span>
              <small class="text-surface-500">{{ formatDate(item.work_date) }}</small>
            </div>
            <div class="text-sm font-semibold text-surface-900 dark:text-surface-0 mb-2">
              {{ item.message_type === 'OTHER' ? item.custom_message : getMessageLabel(item.message_type) }}
            </div>
            <div class="flex gap-2">
              <Tag severity="info" :value="`กลางวัน: ${item.day_shift_count}`" class="text-[10px]" />
              <Tag severity="secondary" :value="`กลางคืน: ${item.night_shift_count}`" class="text-[10px]" />
            </div>
          </div>
        </div>
        <div v-else class="text-center py-6">
          <i class="pi pi-bell-slash text-4xl text-surface-300 mb-2"></i>
          <div class="text-surface-500">ไม่มีประกาศการเข้าเวรวันหยุด</div>
        </div>
      </div>
    </Popover>
  </div>
</template>

<style scoped>
/* Ensure the button matches layout-topbar-action style */
.layout-topbar-action {
  border: none;
  background: transparent;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.animate-swing {
  animation: swing 2s infinite;
  transform-origin: top center;
}

@keyframes swing {
  0% { transform: rotate(0deg); }
  10% { transform: rotate(10deg); }
  20% { transform: rotate(-10deg); }
  30% { transform: rotate(8deg); }
  40% { transform: rotate(-8deg); }
  50% { transform: rotate(0deg); }
  100% { transform: rotate(0deg); }
}
</style>
