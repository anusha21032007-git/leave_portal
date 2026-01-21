import { defineConfig } from "vite";
import dyadComponentTagger from "@dyad-sh/react-vite-component-tagger";
import path from "path";
import { resolve } from 'path';

export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [dyadComponentTagger()],
  root: '.',
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        studentDashboard: resolve(__dirname, 'pages/student-dashboard.html'),
        applyRequest: resolve(__dirname, 'pages/apply-request.html'),
        teacherDashboard: resolve(__dirname, 'pages/teacher-dashboard.html'),
        hodDashboard: resolve(__dirname, 'pages/hod-dashboard.html'),
        requestDetails: resolve(__dirname, 'pages/request-details.html'),
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));