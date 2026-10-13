import { test } from "@playwright/test";
import { expect, gotoHydrated } from "./fixtures/roles";

test.describe("404 Catch-All Page (Black-Box E2E Tests)", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem("app_locale", "en"));
  });

  test("renders 404 page when visiting an undefined route", async ({ page }) => {
    await gotoHydrated(page, "/non-existent-page-route-xyz");

    await expect(page.locator("h1")).toContainText("404");
    await expect(page.getByRole("heading", { name: "Lost in the Digital Void" })).toBeVisible();
    await expect(page.getByText("/non-existent-page-route-xyz")).toBeVisible();
    // Every label must be translated, never a raw i18n key
    await expect(page.getByText(/errors\.notFound\./)).toHaveCount(0);

    const homeLink = page.getByRole("link", { name: /Back to Home/i });
    await expect(homeLink).toBeVisible();
    await homeLink.click();
    await expect(page).toHaveURL("/");
  });
});
