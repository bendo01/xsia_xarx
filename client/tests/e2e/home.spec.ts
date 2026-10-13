import { test } from "@playwright/test";
import { expect, gotoHydrated, loginViaUi, mockBackend, ROLE_USERS } from "./fixtures/roles";

test.describe("Home Route (Black-Box E2E Tests)", () => {
  test.beforeEach(async ({ page }) => {
    await mockBackend(page);
  });

  test("shows the public landing page to unauthenticated visitors", async ({ page }) => {
    await gotoHydrated(page, "/");
    await expect(page).toHaveURL("/");
    await expect(page.locator("h1").first()).toBeVisible();

    // The guest sidebar drawer holds a hidden copy of this link; use a visible one (hero CTA)
    const sessionLink = page
      .locator('a[href="/authentification/login_with_session"]')
      .filter({ visible: true })
      .first();
    await expect(sessionLink).toBeVisible();
    await sessionLink.click();
    await expect(page).toHaveURL("/authentification/login_with_session");
  });

  test("redirects a signed-in user from the landing page to their dashboard", async ({ page }) => {
    const student = ROLE_USERS.find((u) => u.key === "student")!;
    await loginViaUi(page, student);
    await expect(page).toHaveURL(student.dashboard);

    await page.goto("/");
    await expect(page).toHaveURL(student.dashboard);
  });
});
