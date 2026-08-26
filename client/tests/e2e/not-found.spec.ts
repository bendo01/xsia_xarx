import { test, expect } from "@playwright/test";

test.describe("404 Catch-All Page (Black-Box E2E Tests)", () => {
  test("renders 404 page when visiting an undefined route", async ({ page }) => {
    await page.goto("/non-existent-page-route-xyz");

    // Assert 404 header and description
    await expect(page.locator("h1")).toContainText("404");
    await expect(page.getByRole("heading", { name: "Lost in the Digital Void" })).toBeVisible();
    await expect(page.getByText("/non-existent-page-route-xyz")).toBeVisible();

    // Assert 'Back to Home' navigation link
    const homeLink = page.getByRole("link", { name: /Back to Home/i });
    await expect(homeLink).toBeVisible();

    // Click 'Back to Home' and verify URL is root '/'
    await homeLink.click();
    await expect(page).toHaveURL("/");
  });
});
