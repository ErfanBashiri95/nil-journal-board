import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  // برای dev (لوکال)
  server: {
    host: true,
    port: 5173,
  },

  // برای preview روی Railway
  preview: {
    host: true,
    port: 8080,
    /**
     * این خط مهم است 👇
     * می‌تونی یا دامین خودت رو بزاری
     * یا اگر خواستی برای همه هاست‌ها باز باشه از true استفاده کنی
     */
    allowedHosts: ["nil-journal.nilpapd.com"],
    // اگر خواستی برای تمام دامین‌ها آزاد بشه:
    // allowedHosts: true,
  },
});
