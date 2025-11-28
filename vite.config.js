import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  preview: {
    allowedHosts: [
      "nil-journal.nilpapd.com",
       
    ],
  },

  server: {
    host: true,
    port: 8080,
  },
});
