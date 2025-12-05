import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  // برای dev روی لپ‌تاپ خودت
  server: {
    host: "0.0.0.0",
    port: 5173,
    allowedHosts: [
      "localhost",
      "127.0.0.1",
      "nil-journal.nilpapd.com",
    ],
  },

  // برای محیط deploy (npm run preview روی Railway)
  preview: {
    host: "0.0.0.0",
    port: 8080,
    allowedHosts: [
      "localhost",
      "127.0.0.1",
      "nil-journal.nilpapd.com",
    ],
  },
});
