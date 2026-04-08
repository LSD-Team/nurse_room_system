<script lang="ts" setup>
  import { useMainStore } from '@/stores/main.store';
  import { onMounted } from 'vue';
  import AuthService from './services/auth.service';
  const authService = new AuthService();

  const store = useMainStore();
  onMounted(async () => {
    await store.getUserData();
    const adminStatus = await authService.checkAdmin();
    console.log('Is Admin:', adminStatus);
  });
</script>

<template>
  <router-view />
  <LoadingOverlay />
</template>

<style scoped></style>
