import vue from "@vitejs/plugin-vue";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

/** @type {import('vite').UserConfig} */
export default {
  plugins: [vue(), VitePWA()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "/src"),
    },
  },
};
