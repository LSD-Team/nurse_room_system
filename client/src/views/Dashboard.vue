<script lang="ts" setup>
  import BestSellingWidget from '@/components/dashboard/BestSellingWidget.vue';
  import NotificationsWidget from '@/components/dashboard/NotificationsWidget.vue';
  import RecentSalesWidget from '@/components/dashboard/RecentSalesWidget.vue';
  import RevenueStreamWidget from '@/components/dashboard/RevenueStreamWidget.vue';
  import StatsWidget from '@/components/dashboard/StatsWidget.vue';

  import { useMainStore } from '@/stores/main.store';
  import { onMounted } from 'vue';
  const mainStore = useMainStore();

  onMounted(async () => {
    await mainStore.getEmployees();
  });
</script>

<template>
  <div class="grid grid-cols-12 gap-8">
    <StatsWidget />

    <div class="col-span-12 xl:col-span-6">
      <pre>{{ mainStore._employees }}</pre>
      <RecentSalesWidget />
      <BestSellingWidget />
    </div>
    <div class="col-span-12 xl:col-span-6">
      <RevenueStreamWidget />
      <NotificationsWidget />
    </div>
  </div>
</template>
