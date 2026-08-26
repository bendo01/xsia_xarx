import { test, expect } from "@playwright/test";

test.describe("Real-time Studio (Black-Box E2E Tests)", () => {
  test("loads WebSocket and real-time studio view", async ({ page }) => {
    await page.goto("/example/websocket");

    // Assert page header and title
    await expect(page.locator("body")).toBeVisible();
    await expect(
      page.getByText(/Real-time/i).or(page.getByText(/WebSocket/i)).first()
    ).toBeVisible();
  });
});
