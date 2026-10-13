import { test } from "@playwright/test";
import {
  expect,
  gotoHydrated,
  ROLE_USERS,
  ACCESS_DENIED_TOAST,
  mockBackend,
  loginViaUi,
  expectAllowedAt,
} from "./fixtures/roles";

/**
 * Black-box role-based access tests.
 *
 * For each user role: log in through the real login form, land on the role dashboard,
 * then try every other role's area and verify the user is allowed or turned away.
 */

// Each test logs in through the UI and the dev server compiles routes on demand.
test.describe.configure({ timeout: 90_000 });

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

test.describe("Guest (unauthenticated) access", () => {
  test.beforeEach(async ({ page }) => {
    await mockBackend(page);
  });

  for (const target of ROLE_USERS) {
    test(`is sent to session login when opening the ${target.key} area`, async ({ page }) => {
      await page.goto(target.samplePath);
      await expect(page).toHaveURL(
        `/authentification/login_with_session?return_url=${encodeURIComponent(target.samplePath)}`,
      );
      await expect(page.getByText("Please sign in to access this page.")).toBeVisible();
      await expect(page.locator('input[type="email"]')).toBeVisible();
    });
  }

  test("sees an error and stays on login with wrong credentials", async ({ page }) => {
    await loginViaUi(page, ROLE_USERS[0], "wrong-password");
    await expect(page.getByText("Invalid email or password").first()).toBeVisible();
    await expect(page).toHaveURL("/authentification/login");
  });

  test("cannot submit the login form empty", async ({ page }) => {
    await gotoHydrated(page, "/authentification/login");
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL("/authentification/login");
  });
});

for (const user of ROLE_USERS) {
  test.describe(`${user.label}`, () => {
    test.beforeEach(async ({ page }) => {
      await mockBackend(page);
      await loginViaUi(page, user);
      await expect(page).toHaveURL(user.dashboard);
    });

    test("logs in and lands on its dashboard", async ({ page }) => {
      await expectAllowedAt(page, user.dashboard);
    });

    test("can open a page in its own area", async ({ page }) => {
      await page.goto(user.samplePath);
      await expectAllowedAt(page, user.samplePath);
    });

    test("is redirected from the login page back to its dashboard while signed in", async ({
      page,
    }) => {
      await page.goto("/authentification/login");
      await expect(page).toHaveURL(new RegExp(`^[^?]*${escapeRegExp(user.areaPrefix)}/`));
    });

    for (const other of ROLE_USERS.filter((o) => o.key !== user.key)) {
      if (user.key === "administrator") {
        test(`can open the ${other.key} area (administrator bypass)`, async ({ page }) => {
          await page.goto(other.samplePath);
          await expectAllowedAt(page, other.samplePath);
        });
      } else {
        test(`is denied the ${other.key} area and sent back to its own area`, async ({ page }) => {
          await page.goto(other.samplePath);
          await expect(page.getByText(ACCESS_DENIED_TOAST)).toBeVisible();
          await expect(page).toHaveURL(new RegExp(`^[^?]*${escapeRegExp(user.areaPrefix)}/`));
          expect(new URL(page.url()).pathname.startsWith(other.areaPrefix)).toBe(false);
        });
      }
    }

    test("loses access after the session is cleared", async ({ page }) => {
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
      await page.goto(user.samplePath);
      await expect(page).toHaveURL(/\/authentification\/login_with_session\?return_url=/);
    });
  });
}

test.describe("Session login (login_with_session) per role", () => {
  for (const user of ROLE_USERS) {
    test(`${user.key} lands on its dashboard`, async ({ page }) => {
      await mockBackend(page);
      await gotoHydrated(page, "/authentification/login_with_session");
      await page.locator('input[type="email"]').fill(user.email);
      await page.locator('input[type="password"]').fill("password");
      await page.locator('button[type="submit"]').click();
      await expectAllowedAt(page, user.dashboard);
    });
  }
});

test.describe("Multi-role user (Dosen + Kaprodi)", () => {
  const lecturer = ROLE_USERS.find((u) => u.key === "lecturer")!;
  const prodi = ROLE_USERS.find((u) => u.key === "course_department")!;
  const admin = ROLE_USERS.find((u) => u.key === "administrator")!;

  test.beforeEach(async ({ page }) => {
    await mockBackend(page, [lecturer], [lecturer.role, prodi.role]);
    await loginViaUi(page, lecturer);
    await expect(page).toHaveURL(lecturer.dashboard);
  });

  test("can open both of its role areas", async ({ page }) => {
    await page.goto(prodi.samplePath);
    await expectAllowedAt(page, prodi.samplePath);
    await page.goto(lecturer.samplePath);
    await expectAllowedAt(page, lecturer.samplePath);
  });

  test("is still denied the administrator area", async ({ page }) => {
    await page.goto(admin.samplePath);
    await expect(page.getByText(ACCESS_DENIED_TOAST)).toBeVisible();
    expect(new URL(page.url()).pathname.startsWith("/administrator")).toBe(false);
  });
});
