import { test, expect } from "@playwright/test";
import { SCOUT_MANAGER_EMAIL, SCOUT_MANAGER_PASSWORD } from "./seed";

async function loginAsScoutManager(page: import("@playwright/test").Page) {
  await page.goto("/auth/login");
  await page.getByLabel("Email Address").fill(SCOUT_MANAGER_EMAIL);
  await page.getByLabel("Password").fill(SCOUT_MANAGER_PASSWORD);
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page.getByText(/invalid email or password/i)).toHaveCount(0);
  await page.waitForFunction(() => !!localStorage.getItem("streetly_token"));
}

const PORTALS = ["/admin", "/moderator", "/regional-manager"];

for (const portal of PORTALS) {
  test(`scout_manager visiting ${portal} is redirected to /scout-manager`, async ({ page }) => {
    await loginAsScoutManager(page);

    await page.goto(portal);
    await page.waitForURL("**/scout-manager", { timeout: 15_000 });

    await expect(page).toHaveURL(/\/scout-manager$/);
    await expect(page.getByText(/access denied|no analytics data/i)).toHaveCount(0);
  });
}
