import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  // dev روی لوکال خودت
  server: {
    host: true,
    port: 5173,
  },

  // preview روی Railway
  preview: {
    host: "0.0.0.0",
    port: 8080,

    /**
     * 🔥 مهم‌ترین خط:
     * با true کردن، Vite هر هاستی رو قبول می‌کنه
     * و دیگه پیغام "Blocked request / allowedHosts" نمی‌آد.
     */
    allowedHosts: true,
  },
});
