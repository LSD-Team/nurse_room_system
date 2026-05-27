import AXIOS from '@/configs/axios.api.config';
import type { LoadingOptions } from '@/interfaces/api.interfaces';
import { useMainStore } from '@/stores/main.store';
import type { AxiosRequestConfig } from 'axios';

export class Api {
  private static defaultDelay = 0;
  private static requestCount = 0;

  private static async handleLoading(
    show: boolean,
    options?: LoadingOptions & { silent?: boolean }
  ): Promise<void> {
    if (options?.silent) return;

    const mainStore = useMainStore();
    if (show) {
      this.requestCount++;
      if (this.requestCount === 1) {
        const message = options?.message || 'Loading...';
        await mainStore.setLoading(true, message);
      }
    } else {
      this.requestCount = Math.max(0, this.requestCount - 1);
      if (this.requestCount === 0) {
        if (options?.delay) {
          await new Promise(resolve => setTimeout(resolve, options.delay));
        }
        await mainStore.setLoading(false);
      }
    }
  }

  private static shouldRefreshBullet(url: string): boolean {
    const cleanUrl = url.startsWith('/') ? url : `/${url}`;
    const bulletRelatedPaths = [
      '/po',
      '/gr',
      '/borrow',
      '/approval',
      '/physical-count',
      '/stock',
      '/treatment',
    ];
    const shouldRefresh = bulletRelatedPaths.some(path =>
      cleanUrl.startsWith(path)
    );
    return shouldRefresh;
  }

  private static async refreshBullet(): Promise<void> {
    try {
      // Use dynamic import to break circular dependency: Api -> Store -> Service -> Api
      const { useMenuNotificationsStore } = await import(
        '@/stores/menu-notifications.store'
      );
      const notificationsStore = useMenuNotificationsStore();
      await notificationsStore.loadAllCounts(true); // Always silent when refreshing in background
    } catch (error) {
      console.warn('[Api] Warning: Failed to refresh bullet counts:', error);
    }
  }

  static async get<T>(
    url: string,
    config?: AxiosRequestConfig,
    loadingOptions?: LoadingOptions & { silent?: boolean }
  ): Promise<T> {
    const finalConfig = { ...config, silent: loadingOptions?.silent } as any;
    try {
      await this.handleLoading(true, loadingOptions);
      const response = await AXIOS.get<T>(url, finalConfig);
      if (this.shouldRefreshBullet(url)) {
        await this.refreshBullet();
      }
      await this.handleLoading(false, {
        delay: loadingOptions?.delay || this.defaultDelay,
        silent: loadingOptions?.silent,
      } as any);
      return response.data;
    } catch (error) {
      await this.handleLoading(false, {
        silent: loadingOptions?.silent,
      } as any);
      throw error;
    }
  }

  static async post<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
    loadingOptions?: LoadingOptions & { silent?: boolean }
  ): Promise<T> {
    const finalConfig = { ...config, silent: loadingOptions?.silent } as any;
    try {
      await this.handleLoading(true, loadingOptions);
      const response = await AXIOS.post<T>(url, data, finalConfig);
      if (this.shouldRefreshBullet(url)) {
        await this.refreshBullet();
      }
      await this.handleLoading(false, {
        delay: loadingOptions?.delay || this.defaultDelay,
        silent: loadingOptions?.silent,
      } as any);
      return response.data;
    } catch (error) {
      if (this.shouldRefreshBullet(url)) {
        await this.refreshBullet();
      }
      await this.handleLoading(false, {
        silent: loadingOptions?.silent,
      } as any);
      throw error;
    }
  }

  static async put<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
    loadingOptions?: LoadingOptions & { silent?: boolean }
  ): Promise<T> {
    const finalConfig = { ...config, silent: loadingOptions?.silent } as any;
    try {
      await this.handleLoading(true, loadingOptions);
      const response = await AXIOS.put<T>(url, data, finalConfig);
      if (this.shouldRefreshBullet(url)) {
        await this.refreshBullet();
      }
      await this.handleLoading(false, {
        delay: loadingOptions?.delay || this.defaultDelay,
        silent: loadingOptions?.silent,
      } as any);
      return response.data;
    } catch (error) {
      if (this.shouldRefreshBullet(url)) {
        await this.refreshBullet();
      }
      await this.handleLoading(false, {
        silent: loadingOptions?.silent,
      } as any);
      throw error;
    }
  }

  static async patch<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
    loadingOptions?: LoadingOptions & { silent?: boolean }
  ): Promise<T> {
    const finalConfig = { ...config, silent: loadingOptions?.silent } as any;
    try {
      await this.handleLoading(true, loadingOptions);
      const response = await AXIOS.patch<T>(url, data, finalConfig);
      if (this.shouldRefreshBullet(url)) {
        await this.refreshBullet();
      }
      await this.handleLoading(false, {
        delay: loadingOptions?.delay || this.defaultDelay,
        silent: loadingOptions?.silent,
      } as any);
      return response.data;
    } catch (error) {
      if (this.shouldRefreshBullet(url)) {
        await this.refreshBullet();
      }
      await this.handleLoading(false, {
        silent: loadingOptions?.silent,
      } as any);
      throw error;
    }
  }

  static async delete<T>(
    url: string,
    config?: AxiosRequestConfig,
    loadingOptions?: LoadingOptions & { silent?: boolean }
  ): Promise<T> {
    const finalConfig = { ...config, silent: loadingOptions?.silent } as any;
    try {
      await this.handleLoading(true, loadingOptions);
      const response = await AXIOS.delete<T>(url, finalConfig);
      if (this.shouldRefreshBullet(url)) {
        await this.refreshBullet();
      }
      await this.handleLoading(false, {
        delay: loadingOptions?.delay || this.defaultDelay,
        silent: loadingOptions?.silent,
      } as any);
      return response.data;
    } catch (error) {
      if (this.shouldRefreshBullet(url)) {
        await this.refreshBullet();
      }
      await this.handleLoading(false, {
        silent: loadingOptions?.silent,
      } as any);
      throw error;
    }
  }
}
