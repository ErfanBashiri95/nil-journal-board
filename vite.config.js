import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  // برای dev روی لوکال
  server: {
    host: true,
    port: 5173,
  },

  // برای preview روی Railway
  preview: {
    host: "0.0.0.0",
    port: 8080,

    // 🔥 مهم‌ترین قسمت:
    // فقط این دوتا هاست مجاز هستند (لوکال و دامنه اصلی)
    allowedHosts: [
      "localhost",
      "127.0.0.1",
      "nil-journal.nilpapd.com",
    ],
    // (اگر باز هم گیر داد، می‌تونیم به‌جاش بذاریم allowedHosts: true)
  },
});
