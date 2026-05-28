import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router/index';

import Aura from '@primeuix/themes/aura';
import PrimeVue from 'primevue/config';
import ConfirmationService from 'primevue/confirmationservice';
import ToastService from 'primevue/toastservice';

import '@/assets/styles.scss';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);
app.use(PrimeVue as any, {
  theme: {
    preset: Aura,
    options: {
      darkModeSelector: '.app-dark',
    },
  },
});
app.use(ToastService as any);
app.use(ConfirmationService as any);

// Load user data before mounting
import { useMainStore } from '@/stores/main.store';
const mainStore = useMainStore();

// Add router guard to wait for user data before navigation
let isUserDataLoaded = false;
router.beforeEach(async (to, from, next) => {
  if (!isUserDataLoaded) {
    try {
      await mainStore.getUserData();
      isUserDataLoaded = true;
    } catch (error) {
      console.error('Failed to load user data:', error);
      isUserDataLoaded = true; // Allow navigation even if user data fails
    }
  }
  next();
});

mainStore.getUserData().then(() => {
  isUserDataLoaded = true;
  app.mount('#app');
}).catch(() => {
  isUserDataLoaded = true;
  app.mount('#app');
});
