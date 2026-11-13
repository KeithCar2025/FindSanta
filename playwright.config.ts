import { defineConfig } from "@playwright/test";
export default defineConfig({
  timeout: 60000,
  testDir: "./tests",
  fullyParallel: false,
  use: { baseURL: "http://localhost:5173", browserName: "chromium" },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:5173",
    reuseExistingServer: true,
  },
  reporter: "list",
});
