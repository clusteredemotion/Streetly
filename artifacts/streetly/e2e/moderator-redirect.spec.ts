import { test, expect } from "@playwright/test";
import { MODERATOR_EMAIL, MODERATOR_PASSWORD } from "./seed";

async function loginAsModerator(page: import("@playwright/test").Page) {
  await page.goto("/auth/login");
  await page.getByLabel("Email Address").fill(MODERATOR_EMAIL);
  await page.getByLabel("Password").fill(MODERATOR_PASSWORD);
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page.getByText(/invalid email or password/i)).toHaveCount(0);
  await page.waitForFunction(() => !!localStorage.getItem("streetly_token"));
}

const PORTALS = ["/admin", "/scout-manager", "/regional-manager"];

for (const portal of PORTALS) {
  test(`moderator visiting ${portal} is redirected to /moderator`, async ({ page }) => {
    await loginAsModerator(page);

    await page.goto(portal);
    await page.waitForURL("**/moderator", { timeout: 15_000 });

    await expect(page).toHaveURL(/\/moderator$/);
    await expect(page.getByText(/access denied|no analytics data/i)).toHaveCount(0);
  });
}
