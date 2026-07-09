import { defineConfig } from "@playwright/test";

const domain = process.env.REPLIT_DEV_DOMAIN;
const baseURL = domain ? `https://${domain}` : "http://localhost:5000";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  retries: 0,
  globalSetup: "./e2e/seed.ts",
  use: {
    baseURL,
    trace: "retain-on-failure",
  },
});
