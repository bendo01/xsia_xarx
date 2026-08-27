import { test, expect } from "@playwright/test";

test.describe("Home Route Redirection (Black-Box E2E Tests)", () => {
  test("redirects unauthenticated user from root to login", async ({ page }) => {
    await page.goto("/");
    await page.waitForURL("/authentification/login");
    await expect(page).toHaveURL("/authentification/login");
    await expect(page.locator("h1")).toContainText("Macro Workspace");
  });
});
