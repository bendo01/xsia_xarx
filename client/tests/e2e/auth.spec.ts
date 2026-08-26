import { test, expect } from "@playwright/test";

test.describe("Authentication Flow (Black-Box E2E Tests)", () => {
  test("renders login page and all interactive controls", async ({ page }) => {
    await page.goto("/administrator/authentification/login");

    // Check header and branding titles
    await expect(page.locator("h1")).toContainText("Macro Workspace");
    await expect(page.getByText("Enterprise Portal")).toBeVisible();

    // Check input fields
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    const submitButton = page.locator('button[type="submit"]');

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(submitButton).toBeVisible();
    await expect(submitButton).toContainText("SIGN IN");
  });

  test("interacts with form inputs and toggles remember checkbox", async ({ page }) => {
    await page.goto("/administrator/authentification/login");

    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');

    // Fill in email
    await emailInput.fill("admin@xsia.edu");
    expect(await emailInput.inputValue()).toBe("admin@xsia.edu");

    // Fill in password
    await passwordInput.fill("SuperSecretPassword123");
    expect(await passwordInput.inputValue()).toBe("SuperSecretPassword123");

    // Toggle Remember Email checkbox
    const rememberCheckbox = page.locator('input[type="checkbox"]');
    await expect(rememberCheckbox).toBeChecked();
    await rememberCheckbox.uncheck();
    expect(await rememberCheckbox.isChecked()).toBe(false);
  });

  test("links from landing page to authentication routes", async ({ page }) => {
    await page.goto("/");

    const jwtLink = page.getByRole("link", { name: /Standard Sign In \(JWT\)/i });
    await expect(jwtLink).toBeVisible();
    const href = await jwtLink.getAttribute("href");
    expect(href).toBe("/administrator/authentification/login");

    // Navigate to destination and verify Macro Workspace login portal
    await page.goto(href!);
    await expect(page.locator("h1")).toContainText("Macro Workspace");
  });

  test("renders session login page with security controls", async ({ page }) => {
    await page.goto("/administrator/authentification/login_with_session");

    await expect(page.locator("h1")).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });
});
