import { test } from "@playwright/test";
import { expect, gotoHydrated, mockBackend } from "./fixtures/roles";

test.describe("Authentication Flow (Black-Box E2E Tests)", () => {
  test.beforeEach(async ({ page }) => {
    // Pin the UI language (it otherwise defaults to Indonesian)
    await page.addInitScript(() => localStorage.setItem("app_locale", "en"));
    await mockBackend(page);
  });

  test("renders login page and all interactive controls", async ({ page }) => {
    await gotoHydrated(page, "/authentification/login");

    await expect(page.locator("h1")).toContainText("Macro Workspace");
    await expect(page.getByText("Enterprise Portal", { exact: true })).toBeVisible();

    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeVisible();
    await expect(submitButton).toContainText("Sign In to Portal");
  });

  test("interacts with form inputs and toggles remember checkbox", async ({ page }) => {
    await gotoHydrated(page, "/authentification/login");

    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');

    await emailInput.fill("admin@xsia.edu");
    await expect(emailInput).toHaveValue("admin@xsia.edu");

    await passwordInput.fill("SuperSecretPassword123");
    await expect(passwordInput).toHaveValue("SuperSecretPassword123");

    const rememberCheckbox = page.locator('input[type="checkbox"]');
    await expect(rememberCheckbox).toBeChecked();
    await rememberCheckbox.uncheck();
    await expect(rememberCheckbox).not.toBeChecked();
  });

  test("renders session login page with security controls", async ({ page }) => {
    await gotoHydrated(page, "/authentification/login_with_session");

    await expect(page.locator("h1")).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });
});
