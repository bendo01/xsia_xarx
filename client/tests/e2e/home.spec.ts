import { test, expect } from "@playwright/test";

test.describe("Home / Landing Page (Black-Box E2E Tests)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test("loads landing page with branding and top navigation", async ({ page }) => {
    // Assert page branding is visible
    await expect(page.locator("header")).toContainText("XSIA XARX");
    await expect(page.locator("header")).toContainText("Enterprise Portal");

    // Assert main hero heading
    const heading = page.locator("h1");
    await expect(heading).toBeVisible();
    await expect(heading).toContainText("High-Performance Academic Enterprise Management");
  });

  test("contains sign-in action buttons on hero section", async ({ page }) => {
    const jwtSignInBtn = page.getByRole("link", { name: /Standard Sign In \(JWT\)/i });
    const sessionSignInBtn = page.getByRole("link", { name: /Session Sign In/i });

    await expect(jwtSignInBtn).toBeVisible();
    await expect(sessionSignInBtn).toBeVisible();
  });

  test("toggles light/dark theme via top bar toggle button", async ({ page }) => {
    const themeBtn = page.locator('button[aria-label="Toggle dark mode"]');
    await expect(themeBtn).toBeVisible();

    const htmlElement = page.locator("html");

    // Check initial state, click toggle button
    const initialIsDark = await htmlElement.evaluate((el) => el.classList.contains("dark"));
    await themeBtn.click();

    await expect(async () => {
      const isNowDark = await htmlElement.evaluate((el) => el.classList.contains("dark"));
      expect(isNowDark).toBe(!initialIsDark);
    }).toPass({ timeout: 5000 });
  });
});
