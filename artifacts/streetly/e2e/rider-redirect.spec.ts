import { test, expect } from "@playwright/test";
import { RIDER_EMAIL, RIDER_PASSWORD } from "./seed";

async function loginAsRider(page: import("@playwright/test").Page) {
  await page.goto("/auth/login");
  await page.getByLabel("Email Address").fill(RIDER_EMAIL);
  await page.getByLabel("Password").fill(RIDER_PASSWORD);
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page.getByText(/invalid email or password/i)).toHaveCount(0);
  await page.waitForFunction(() => !!localStorage.getItem("streetly_token"));
}

const PORTALS = ["/admin", "/moderator", "/scout-manager"];

for (const portal of PORTALS) {
  test(`delivery_rider visiting ${portal} is redirected to /rider-dashboard`, async ({ page }) => {
    await loginAsRider(page);

    await page.goto(portal);
    await page.waitForURL("**/rider-dashboard", { timeout: 15_000 });

    await expect(page).toHaveURL(/\/rider-dashboard$/);
    await expect(page.getByText(/access denied|no analytics data/i)).toHaveCount(0);
  });
}
