<script lang="ts" setup>
import { ref } from 'vue';
const title = ref<string>(import.meta.env.VITE_APP_TITLE);
const app_version = ref<string>(import.meta.env.VITE_APP_VERSION);
const create_year = ref<number>(2025);
</script>

<template>
  <div class="px-7 layout-footer mt-5">
    <span class="text-white ml-2"
      >© {{ create_year }} : {{ title }} <u>v.{{ app_version }}</u> by IT Section/LSD</span
    >
  </div>
</template>
<style lang="scss" scoped>

</style>