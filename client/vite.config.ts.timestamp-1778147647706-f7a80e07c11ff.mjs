// vite.config.ts
import { PrimeVueResolver } from "file:///E:/GitHub_Repo/nurse_room_system/client/node_modules/.pnpm/@primevue+auto-import-resolver@4.3.9/node_modules/@primevue/auto-import-resolver/index.mjs";
import vue from "file:///E:/GitHub_Repo/nurse_room_system/client/node_modules/.pnpm/@vitejs+plugin-vue@5.2.4_vi_7aaeb4981358f2dde91a9085306502d1/node_modules/@vitejs/plugin-vue/dist/index.mjs";
import * as path from "path";
import Components from "file:///E:/GitHub_Repo/nurse_room_system/client/node_modules/.pnpm/unplugin-vue-components@0.2_de90e486a024ea3fdd7a3b61d8dfb87a/node_modules/unplugin-vue-components/dist/vite.js";
import { defineConfig } from "file:///E:/GitHub_Repo/nurse_room_system/client/node_modules/.pnpm/vite@5.4.20_@types+node@24.4.0_sass@1.66.0/node_modules/vite/dist/node/index.js";
import vueDevTools from "file:///E:/GitHub_Repo/nurse_room_system/client/node_modules/.pnpm/vite-plugin-vue-devtools@7._c429fe5c68ac2fe7f10a77ab395d54a3/node_modules/vite-plugin-vue-devtools/dist/vite.mjs";
var __vite_injected_original_dirname = "E:\\GitHub_Repo\\nurse_room_system\\client";
var vite_config_default = defineConfig({
  optimizeDeps: {
    noDiscovery: true
  },
  base: "/nurse-room-system/",
  // Set your desired public
  plugins: [
    vue({}),
    vueDevTools(),
    Components({
      resolvers: [PrimeVueResolver()]
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "src")
    }
  },
  css: {
    preprocessorOptions: {
      scss: {
        // Silence the deprecation warnings for legacy JS API
        sassOptions: {
          silenceDeprecations: ["legacy-js-api"]
        },
        includePaths: [path.resolve(__vite_injected_original_dirname, "src/assets")]
      }
    }
  },
  build: {
    chunkSizeWarningLimit: 1e3
    // Set your desired limit in kilobytes
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJFOlxcXFxHaXRIdWJfUmVwb1xcXFxudXJzZV9yb29tX3N5c3RlbVxcXFxjbGllbnRcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkU6XFxcXEdpdEh1Yl9SZXBvXFxcXG51cnNlX3Jvb21fc3lzdGVtXFxcXGNsaWVudFxcXFx2aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vRTovR2l0SHViX1JlcG8vbnVyc2Vfcm9vbV9zeXN0ZW0vY2xpZW50L3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgUHJpbWVWdWVSZXNvbHZlciB9IGZyb20gJ0BwcmltZXZ1ZS9hdXRvLWltcG9ydC1yZXNvbHZlcic7XG5pbXBvcnQgdnVlIGZyb20gJ0B2aXRlanMvcGx1Z2luLXZ1ZSc7XG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IENvbXBvbmVudHMgZnJvbSAndW5wbHVnaW4tdnVlLWNvbXBvbmVudHMvdml0ZSc7XG5pbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJztcbmltcG9ydCB2dWVEZXZUb29scyBmcm9tICd2aXRlLXBsdWdpbi12dWUtZGV2dG9vbHMnO1xuXG4vLyBodHRwczovL3ZpdGVqcy5kZXYvY29uZmlnL1xuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgb3B0aW1pemVEZXBzOiB7XG4gICAgbm9EaXNjb3Zlcnk6IHRydWUsXG4gIH0sXG4gIGJhc2U6ICcvbnVyc2Utcm9vbS1zeXN0ZW0vJywgLy8gU2V0IHlvdXIgZGVzaXJlZCBwdWJsaWNcbiAgcGx1Z2luczogW1xuICAgIHZ1ZSh7fSkgYXMgYW55LFxuICAgIHZ1ZURldlRvb2xzKCksXG4gICAgQ29tcG9uZW50cyh7XG4gICAgICByZXNvbHZlcnM6IFtQcmltZVZ1ZVJlc29sdmVyKCldLFxuICAgIH0pLFxuICBdLFxuICByZXNvbHZlOiB7XG4gICAgYWxpYXM6IHtcbiAgICAgICdAJzogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJ3NyYycpLFxuICAgIH0sXG4gIH0sXG4gIGNzczoge1xuICAgIHByZXByb2Nlc3Nvck9wdGlvbnM6IHtcbiAgICAgIHNjc3M6IHtcbiAgICAgICAgLy8gU2lsZW5jZSB0aGUgZGVwcmVjYXRpb24gd2FybmluZ3MgZm9yIGxlZ2FjeSBKUyBBUElcbiAgICAgICAgc2Fzc09wdGlvbnM6IHtcbiAgICAgICAgICBzaWxlbmNlRGVwcmVjYXRpb25zOiBbJ2xlZ2FjeS1qcy1hcGknXSxcbiAgICAgICAgfSxcbiAgICAgICAgaW5jbHVkZVBhdGhzOiBbcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJ3NyYy9hc3NldHMnKV0sXG4gICAgICB9LFxuICAgIH0sXG4gIH0sXG4gIGJ1aWxkOiB7XG4gICAgY2h1bmtTaXplV2FybmluZ0xpbWl0OiAxMDAwLCAvLyBTZXQgeW91ciBkZXNpcmVkIGxpbWl0IGluIGtpbG9ieXRlc1xuICB9LFxufSk7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQStTLFNBQVMsd0JBQXdCO0FBQ2hWLE9BQU8sU0FBUztBQUNoQixZQUFZLFVBQVU7QUFDdEIsT0FBTyxnQkFBZ0I7QUFDdkIsU0FBUyxvQkFBb0I7QUFDN0IsT0FBTyxpQkFBaUI7QUFMeEIsSUFBTSxtQ0FBbUM7QUFRekMsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDMUIsY0FBYztBQUFBLElBQ1osYUFBYTtBQUFBLEVBQ2Y7QUFBQSxFQUNBLE1BQU07QUFBQTtBQUFBLEVBQ04sU0FBUztBQUFBLElBQ1AsSUFBSSxDQUFDLENBQUM7QUFBQSxJQUNOLFlBQVk7QUFBQSxJQUNaLFdBQVc7QUFBQSxNQUNULFdBQVcsQ0FBQyxpQkFBaUIsQ0FBQztBQUFBLElBQ2hDLENBQUM7QUFBQSxFQUNIO0FBQUEsRUFDQSxTQUFTO0FBQUEsSUFDUCxPQUFPO0FBQUEsTUFDTCxLQUFVLGFBQVEsa0NBQVcsS0FBSztBQUFBLElBQ3BDO0FBQUEsRUFDRjtBQUFBLEVBQ0EsS0FBSztBQUFBLElBQ0gscUJBQXFCO0FBQUEsTUFDbkIsTUFBTTtBQUFBO0FBQUEsUUFFSixhQUFhO0FBQUEsVUFDWCxxQkFBcUIsQ0FBQyxlQUFlO0FBQUEsUUFDdkM7QUFBQSxRQUNBLGNBQWMsQ0FBTSxhQUFRLGtDQUFXLFlBQVksQ0FBQztBQUFBLE1BQ3REO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFBQSxFQUNBLE9BQU87QUFBQSxJQUNMLHVCQUF1QjtBQUFBO0FBQUEsRUFDekI7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
