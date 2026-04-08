<script setup lang="ts">
  import { useMainStore } from '@/stores/main.store';
  const store = useMainStore();
</script>

<template>
  <Transition>
    <div v-show="store._loading">
      <div class="loading-overlay">
        <div class="loading-content">
          <div class="loading-spinner">
            <ProgressSpinner
              strokeWidth="5"
              animationDuration=".5s"
              aria-label="Custom ProgressSpinner"
            />
          </div>
          <div class="loading-text">
            {{ store._loadingMessage }}
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style lang="scss" scoped>
  .loading-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(5px);
    -webkit-backdrop-filter: blur(5px);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999 !important; /* Increased z-index to be above navbar and sidebar */
  }

  .loading-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem; // เพิ่มระยะห่างระหว่าง spinner กับ text
  }

  .loading-spinner {
    font-size: 2rem;
    color: white;
  }

  .loading-text {
    font-size: 1.5rem;
    color: white;
    text-align: center;
  }

  // เพิ่ม transition effects
  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 1s ease;
  }

  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
  }
</style>
