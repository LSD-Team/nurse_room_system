/*  ------  ➕ Imports ➕ ------ */
import router from '@/router/index';
import axios from 'axios';
import Swal, { type SweetAlertIcon } from 'sweetalert2';

//  Pinia Store for show / hide Loading Overlay
// import { useMainStore } from '@/stores/main.store';
/*  ------ ➕ Imports ➕ ------ */

// Create a custom Axios instance with a specific base URL
const API = axios.create({
  baseURL: import.meta.env.VITE_APP_API_URL,
});

API.defaults.headers.common['Content-Type'] = 'application/json';

const loginUrl = decodeURIComponent(import.meta.env.VITE_APP_LSDSC);
const mainUrl = decodeURIComponent(import.meta.env.VITE_APP_LSDSC_SYSTEM);

// Axios Before Request
API.interceptors.request.use(
  async config => {
    try {
      let token = localStorage.getItem('token');
      // Check if the environment is development
      if (import.meta.env.MODE === 'development') {
        token = import.meta.env.VITE_DEV_TOKEN;
      }
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      return config;
    } catch (error) {
      return Promise.reject(error);
    }
  },
  error => {
    return Promise.reject(error);
  }
);

// Axios After response
API.interceptors.response.use(
  async response => {
    return response;
  },
  async error => {
    try {
      const response = { ...error }.response;

      // Network error or server down — no response at all
      if (!response) {
        await Swal.fire('Error', 'Unable to connect to the server', 'error');
        return Promise.reject(error);
      }

      const errorData = response.data;
      //  show error alert
      let message = '';
      if (typeof errorData.message === 'object') {
        message = errorData.message.join(',');
      } else {
        message = errorData.message;
      }

      console.error(
        'Interceptors Error:',
        { ...error }.response.config.url,
        { ...error }.response
      );

      // Only show error dialog if not a silent request
      if (!(error.config && (error.config as any).silent)) {
        const title = errorData.statusCode === 500 ? 'Server Error' : 'Error';
        const html = message;
        const icon: SweetAlertIcon =
          errorData.statusCode === 500 ? 'error' : 'warning';
        void Swal.fire(title, html, icon);
      }

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
  }
);

export default API;
