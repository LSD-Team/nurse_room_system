<script lang="ts" setup>
import FloatingConfigurator from '@/components/FloatingConfigurator.vue';
</script>

<template>
  <FloatingConfigurator />
  <div class="flex items-center justify-center min-h-screen overflow-hidden">
    <div class="flex flex-col items-center justify-center">
      <div
        style="
          border-radius: 56px;
          padding: 0.3rem;
          background: linear-gradient(
            180deg,
            color-mix(in srgb, var(--primary-color), transparent 60%) 10%,
            var(--surface-ground) 30%
          );
        "
      >
        <div
          class="w-full bg-surface-0 dark:bg-surface-900 py-20 px-8 sm:px-20 flex flex-col items-center"
          style="border-radius: 53px"
        >
          <img src="@/assets/shindengen-logo.svg" alt="Logo" class="logo-image" />
          <!-- horizontal line tailwindcss -->
            <div class="border-t border-surface-300 dark:border-surface-500 w-full my-8"></div>
          <h1 class="text-surface-900 dark:text-surface-0 font-bold text-3xl lg:text-3xl mb-2">
            404 : Not Found
          </h1>
          <div class="text-surface-600 dark:text-surface-200 mb-8">
            Requested resource is not available.
          </div>
          <Button as="router-link" label="Go to Dashboard" to="/" />
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.logo-image {
  width: 35vw;
  height: auto;
  margin-bottom: 1rem;
}
</style>