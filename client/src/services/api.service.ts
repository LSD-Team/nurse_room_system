import AXIOS from '@/configs/axios.api.config';
import type { LoadingOptions } from '@/interfaces/api.interfaces';
import { useMainStore } from '@/stores/main.store';
import { useMenuNotificationsStore } from '@/stores/menu-notifications.store';
import type { AxiosRequestConfig } from 'axios';

export class Api {
  // private static mainStore = useMainStore();
  private static defaultDelay = 0; // ค่า delay เริ่มต้น 300ms

  private static async handleLoading(
    show: boolean,
    options?: LoadingOptions
  ): Promise<void> {
    // console.info('handleLoading => ', show, options);
    const mainStore = useMainStore();
    if (show) {
      const message = options?.message || 'Loading...';
      await mainStore.setLoading(true, message);
    } else {
      if (options?.delay) {
        await new Promise(resolve => setTimeout(resolve, options.delay));
      }
      await mainStore.setLoading(false);
    }
  }

  private static shouldRefreshBullet(url: string): boolean {
    const bulletRelatedPaths = ['/po/', '/gr/', '/borrow/', '/approval/'];
    return bulletRelatedPaths.some(path => url.includes(path));
  }

  private static async refreshBullet(): Promise<void> {
    try {
      const notificationsStore = useMenuNotificationsStore();
      await notificationsStore.refreshAll();
    } catch (error) {
      console.warn('[Api] Warning: Failed to refresh bullet counts:', error);
      // Don't throw - this is a side effect and shouldn't break the main API call
    }
  }

  static async get<T>(
    url: string,
    config?: AxiosRequestConfig,
    loadingOptions?: LoadingOptions
  ): Promise<T> {
    try {
      await this.handleLoading(true, loadingOptions);
      const response = await AXIOS.get<T>(url, config);
      // console.info(`GET ${url} => `, response.data);
      if (this.shouldRefreshBullet(url)) {
        await this.refreshBullet();
      }
      await this.handleLoading(false, {
        delay: loadingOptions?.delay || this.defaultDelay,
      });
      return response.data;
    } catch (error) {
      await this.handleLoading(false);
      throw error;
    }
  }

  static async post<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
    loadingOptions?: LoadingOptions
  ): Promise<T> {
    try {
      await this.handleLoading(true, loadingOptions);
      const response = await AXIOS.post<T>(url, data, config);
      console.info(`POST ${url} => `, response.data);
      if (this.shouldRefreshBullet(url)) {
        await this.refreshBullet();
      }
      await this.handleLoading(false, {
        delay: loadingOptions?.delay || this.defaultDelay,
      });
      return response.data;
    } catch (error) {
      await this.handleLoading(false);
      throw error;
    }
  }
  static async put<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
    loadingOptions?: LoadingOptions
  ): Promise<T> {
    try {
      await this.handleLoading(true, loadingOptions);
      const response = await AXIOS.put<T>(url, data, config);
      console.info(`PUT ${url} => `, response.data);
      if (this.shouldRefreshBullet(url)) {
        await this.refreshBullet();
      }
      await this.handleLoading(false, {
        delay: loadingOptions?.delay || this.defaultDelay,
      });
      return response.data;
    } catch (error) {
      await this.handleLoading(false);
      throw error;
    }
  }

  static async patch<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
    loadingOptions?: LoadingOptions
  ): Promise<T> {
    try {
      await this.handleLoading(true, loadingOptions);
      const response = await AXIOS.patch<T>(url, data, config);
      console.info(`PATCH ${url} => `, response.data);
      if (this.shouldRefreshBullet(url)) {
        await this.refreshBullet();
      }
      await this.handleLoading(false, {
        delay: loadingOptions?.delay || this.defaultDelay,
      });
      return response.data;
    } catch (error) {
      await this.handleLoading(false);
      throw error;
    }
  }

  static async delete<T>(
    url: string,
    config?: AxiosRequestConfig,
    loadingOptions?: LoadingOptions
  ): Promise<T> {
    try {
      await this.handleLoading(true, loadingOptions);
      const response = await AXIOS.delete<T>(url, config);
      console.info(`DELETE ${url} => `, response.data);
      if (this.shouldRefreshBullet(url)) {
        await this.refreshBullet();
      }
      await this.handleLoading(false, {
        delay: loadingOptions?.delay || this.defaultDelay,
      });
      return response.data;
    } catch (error) {
      await this.handleLoading(false);
      throw error;
    }
  }
}
