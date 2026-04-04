<script setup lang="ts">
import { useLayout } from '@/layout/composables/layout';
import { onMounted } from 'vue';
import AppConfigurator from './AppConfigurator.vue';
import { employeeImageUrl } from '@/utils/employee-image.utils';
import { useMainStore } from '@/stores/main.store';

const mainStore = useMainStore();

const { onMenuToggle, toggleDarkMode, isDarkTheme } = useLayout();

onMounted(() => {
  // auto toggle darkmode if system is darkmode
  const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (prefersDarkMode && !isDarkTheme.value) {
    toggleDarkMode();
  }
});

const title = import.meta.env.VITE_APP_TITLE || 'Vue PrimeAdmin';
</script>

<template>
  <div class="layout-topbar">
    <div class="layout-topbar-logo-container">
      <button class="layout-menu-button layout-topbar-action" @click="onMenuToggle">
        <i class="pi pi-bars"></i>
      </button>
      <router-link to="/" class="layout-topbar-logo">
        <img src="@/assets/icon.png" alt="logo" />
        <span>{{ title }}</span>
      </router-link>
    </div>

    <div class="layout-topbar-actions">
      <div class="layout-config-menu">
        <button type="button" class="layout-topbar-action" @click="toggleDarkMode">
          <i :class="['pi', { 'pi-moon': isDarkTheme, 'pi-sun': !isDarkTheme }]"></i>
        </button>
        <div class="relative">
          <button
            v-styleclass="{
              selector: '@next',
              enterFromClass: 'hidden',
              enterActiveClass: 'animate-scalein',
              leaveToClass: 'hidden',
              leaveActiveClass: 'animate-fadeout',
              hideOnOutsideClick: true,
            }"
            type="button"
            class="layout-topbar-action layout-topbar-action-highlight"
          >
            <i class="pi pi-palette"></i>
          </button>
          <AppConfigurator />
        </div>
      </div>

      <button
        class="layout-topbar-menu-button layout-topbar-action"
        v-styleclass="{
          selector: '@next',
          enterFromClass: 'hidden',
          enterActiveClass: 'animate-scalein',
          leaveToClass: 'hidden',
          leaveActiveClass: 'animate-fadeout',
          hideOnOutsideClick: true,
        }"
      >
        <i class="pi pi-ellipsis-v"></i>
      </button>

      <div class="layout-topbar-menu hidden lg:block">
        <div class="layout-topbar-menu-content">
          <button type="button" class="layout-topbar-action">
            <i class="pi pi-calendar"></i>
            <span>Calendar</span>
          </button>
          <button type="button" class="layout-topbar-action">
            <i class="pi pi-inbox"></i>
            <span>Messages</span>
          </button>
          <!-- User Profile Section -->
          <div class="flex align-items-center gap-2 mr-4" v-tooltip.top="JSON.stringify(mainStore._userInfo)">
            <img
              :src="employeeImageUrl(mainStore._userInfo.cardcode)"
              alt="user profile"
              class="user-image"
            />
            <div class="text-right">
              <div class="font-bold">{{ mainStore._userInfo.eng_name }}</div>
              <div class="text-xs text-600 italic">
                {{ mainStore._userInfo.position_name }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<style lang="scss" scoped>
.layout-topbar {
  .user-image {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid var(--surface-border);
  }
}
</style>
