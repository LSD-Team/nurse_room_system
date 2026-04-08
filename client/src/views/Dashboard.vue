<script lang="ts" setup>
  import BestSellingWidget from '@/components/dashboard/BestSellingWidget.vue';
  import NotificationsWidget from '@/components/dashboard/NotificationsWidget.vue';
  import RecentSalesWidget from '@/components/dashboard/RecentSalesWidget.vue';
  import RevenueStreamWidget from '@/components/dashboard/RevenueStreamWidget.vue';
  import StatsWidget from '@/components/dashboard/StatsWidget.vue';

<<<<<<< HEAD
  import { useMainStore } from '@/stores/main.store';
  import { onMounted } from 'vue';
  const mainStore = useMainStore();

  onMounted(async () => {
    await mainStore.getEmployees();
  });
=======
import { useMainStore } from '@/stores/main.store';
import { onMounted } from 'vue';
const mainStore = useMainStore();

onMounted(async () => {
  await mainStore.getEmployees();
});
>>>>>>> dev_borrow
</script>

<template>
  <div class="grid grid-cols-12 gap-8">
    <StatsWidget />

    <div class="col-span-12 xl:col-span-6">
<<<<<<< HEAD
      <pre>{{ mainStore._employees }}</pre>
=======
>>>>>>> dev_borrow
      <RecentSalesWidget />
      <BestSellingWidget />
    </div>
    <div class="col-span-12 xl:col-span-6">
      <RevenueStreamWidget />
      <NotificationsWidget />
    </div>
  </div>
</template>
