/*  ------  ➕ Imports ➕ ------ */
import router from '@/router/index';
import axios from 'axios';
import Swal, { type SweetAlertIcon } from 'sweetalert2';

//  Pinia Store for show / hide Loading Overlay
import { useMainStore } from '@/stores/main.store';
/*  ------ ➕ Imports ➕ ------ */

// Create a custom Axios instance with a specific base URL
const API = axios.create({
  baseURL: import.meta.env.VITE_APP_API_URL,
});

API.defaults.headers.common['Content-Type'] = 'application/x-www-form-urlencoded';

const loginUrl = decodeURIComponent(import.meta.env.VITE_APP_LSDSC);
const mainUrl = decodeURIComponent(import.meta.env.VITE_APP_LSDSC_SYSTEM);

// Axios Before Request
API.interceptors.request.use(
  async (config) => {
    try {
      let token = localStorage.getItem('token');
      // Check if the environment is development
      if (import.meta.env.MODE === 'development') {
        token = import.meta.env.VITE_DEV_TOKEN;
      }
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      //  Loading Overlay
      const mainStore = useMainStore();
      await mainStore.setLoading(true);
      return config;
    } catch (error) {
      return Promise.reject(error);
    }
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Axios After response
API.interceptors.response.use(
  async (config) => {
    try {
      //  Loading Overlay
      const mainStore = useMainStore();
      setTimeout(async () => {
        await mainStore.setLoading(false);
      }, 800);
      return config;
    } catch (error) {
      return Promise.reject(error);
    }
  },
  async (error) => {
    try {
      //  Loading Overlay
      const mainStore = useMainStore();
      setTimeout(async () => {
        await mainStore.setLoading(false);
      }, 800);

      const errorData = { ...error }.response.data;
      //  show error alert
      let message = '';
      if (typeof errorData.message === 'object') {
        message = errorData.message.join(',');
      } else {
        message = errorData.message;
      }
      // message = message+ apiroute
      console.error('Interceptors Error:', { ...error }.response.config.url, { ...error }.response);
      const title = errorData.statusCode === 500 ? 'Server Error' : 'Error';
      const html = message;
      const icon: SweetAlertIcon = errorData.statusCode === 500 ? 'error' : 'warning';
      await Swal.fire(title, html, icon);

      // get current href url
      const currentUrl = window.location.href;
      const encodedUrl = encodeURIComponent(currentUrl);

      switch (errorData.statusCode) {
        case 401:
          window.location.href = `${loginUrl}?redirectUrl=${encodedUrl}`;
          break;
        case 403:
          if (errorData.route) {
            await router.push(errorData.route);
          } else if (errorData.url) {
            window.location.href = errorData.url;
          } else {
            window.location.href = mainUrl;
          }
          break;
        default:
          console.log('error', error);
          break;
      }

      return Promise.reject(error);
    } catch (error) {
      return Promise.reject(error);
    }
  },
);

export default API;
