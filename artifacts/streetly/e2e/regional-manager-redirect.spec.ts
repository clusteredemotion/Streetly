import { test, expect } from "@playwright/test";
import { REGIONAL_MANAGER_EMAIL, REGIONAL_MANAGER_PASSWORD } from "./seed";

async function loginAsRegionalManager(page: import("@playwright/test").Page) {
  await page.goto("/auth/login");
  await page.getByLabel("Email Address").fill(REGIONAL_MANAGER_EMAIL);
  await page.getByLabel("Password").fill(REGIONAL_MANAGER_PASSWORD);
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page.getByText(/invalid email or password/i)).toHaveCount(0);
  await page.waitForFunction(() => !!localStorage.getItem("streetly_token"));
}

const PORTALS = ["/admin", "/moderator"];

for (const portal of PORTALS) {
  test(`regional_manager visiting ${portal} is redirected to /regional-manager`, async ({ page }) => {
    await loginAsRegionalManager(page);

    await page.goto(portal);
    await page.waitForURL("**/regional-manager", { timeout: 15_000 });

    await expect(page).toHaveURL(/\/regional-manager$/);
    await expect(page.getByText(/access denied|no analytics data/i)).toHaveCount(0);
  });
}
