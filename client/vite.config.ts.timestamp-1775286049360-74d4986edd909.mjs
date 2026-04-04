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
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJFOlxcXFxHaXRIdWJfUmVwb1xcXFxudXJzZV9yb29tX3N5c3RlbVxcXFxjbGllbnRcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkU6XFxcXEdpdEh1Yl9SZXBvXFxcXG51cnNlX3Jvb21fc3lzdGVtXFxcXGNsaWVudFxcXFx2aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vRTovR2l0SHViX1JlcG8vbnVyc2Vfcm9vbV9zeXN0ZW0vY2xpZW50L3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgUHJpbWVWdWVSZXNvbHZlciB9IGZyb20gJ0BwcmltZXZ1ZS9hdXRvLWltcG9ydC1yZXNvbHZlcic7XHJcbmltcG9ydCB2dWUgZnJvbSAnQHZpdGVqcy9wbHVnaW4tdnVlJztcclxuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJztcclxuaW1wb3J0IENvbXBvbmVudHMgZnJvbSAndW5wbHVnaW4tdnVlLWNvbXBvbmVudHMvdml0ZSc7XHJcbmltcG9ydCB7IGRlZmluZUNvbmZpZyB9IGZyb20gJ3ZpdGUnO1xyXG5pbXBvcnQgdnVlRGV2VG9vbHMgZnJvbSAndml0ZS1wbHVnaW4tdnVlLWRldnRvb2xzJztcclxuXHJcbi8vIGh0dHBzOi8vdml0ZWpzLmRldi9jb25maWcvXHJcbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XHJcbiAgICBvcHRpbWl6ZURlcHM6IHtcclxuICAgICAgICBub0Rpc2NvdmVyeTogdHJ1ZVxyXG4gICAgfSxcclxuICAgIHBsdWdpbnM6IFtcclxuICAgICAgICB2dWUoe30pIGFzIGFueSxcclxuICAgICAgICB2dWVEZXZUb29scygpLFxyXG4gICAgICAgIENvbXBvbmVudHMoe1xyXG4gICAgICAgICAgICByZXNvbHZlcnM6IFtQcmltZVZ1ZVJlc29sdmVyKCldXHJcbiAgICAgICAgfSlcclxuICAgIF0sXHJcbiAgICByZXNvbHZlOiB7XHJcbiAgICAgICAgYWxpYXM6IHtcclxuICAgICAgICAgICAgJ0AnOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnc3JjJylcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG4gICAgY3NzOiB7XHJcbiAgICAgICAgcHJlcHJvY2Vzc29yT3B0aW9uczoge1xyXG4gICAgICAgICAgICBzY3NzOiB7XHJcbiAgICAgICAgICAgICAgICAvLyBTaWxlbmNlIHRoZSBkZXByZWNhdGlvbiB3YXJuaW5ncyBmb3IgbGVnYWN5IEpTIEFQSVxyXG4gICAgICAgICAgICAgICAgc2Fzc09wdGlvbnM6IHtcclxuICAgICAgICAgICAgICAgICAgICBzaWxlbmNlRGVwcmVjYXRpb25zOiBbJ2xlZ2FjeS1qcy1hcGknXVxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIGluY2x1ZGVQYXRoczogW3BhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICdzcmMvYXNzZXRzJyldXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcbn0pO1xyXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQStTLFNBQVMsd0JBQXdCO0FBQ2hWLE9BQU8sU0FBUztBQUNoQixZQUFZLFVBQVU7QUFDdEIsT0FBTyxnQkFBZ0I7QUFDdkIsU0FBUyxvQkFBb0I7QUFDN0IsT0FBTyxpQkFBaUI7QUFMeEIsSUFBTSxtQ0FBbUM7QUFRekMsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDeEIsY0FBYztBQUFBLElBQ1YsYUFBYTtBQUFBLEVBQ2pCO0FBQUEsRUFDQSxTQUFTO0FBQUEsSUFDTCxJQUFJLENBQUMsQ0FBQztBQUFBLElBQ04sWUFBWTtBQUFBLElBQ1osV0FBVztBQUFBLE1BQ1AsV0FBVyxDQUFDLGlCQUFpQixDQUFDO0FBQUEsSUFDbEMsQ0FBQztBQUFBLEVBQ0w7QUFBQSxFQUNBLFNBQVM7QUFBQSxJQUNMLE9BQU87QUFBQSxNQUNILEtBQVUsYUFBUSxrQ0FBVyxLQUFLO0FBQUEsSUFDdEM7QUFBQSxFQUNKO0FBQUEsRUFDQSxLQUFLO0FBQUEsSUFDRCxxQkFBcUI7QUFBQSxNQUNqQixNQUFNO0FBQUE7QUFBQSxRQUVGLGFBQWE7QUFBQSxVQUNULHFCQUFxQixDQUFDLGVBQWU7QUFBQSxRQUN6QztBQUFBLFFBQ0EsY0FBYyxDQUFNLGFBQVEsa0NBQVcsWUFBWSxDQUFDO0FBQUEsTUFDeEQ7QUFBQSxJQUNKO0FBQUEsRUFDSjtBQUNKLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
