import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  // برای dev روی لپ‌تاپ خودت
  server: {
    host: true,
    port: 5173,
  },

  // برای Railway (npm run preview)
  preview: {
    host: "0.0.0.0",
    port: 8080,
    // دقیقاً دامین خودت رو اینجا می‌نویسیم
    allowedHosts: [
      "nil-journal.nilpapd.com",
      "nil-journal.nilpapd.com:443",
      "nil-journal.nilpapd.com:80",
    ],
  },
});
