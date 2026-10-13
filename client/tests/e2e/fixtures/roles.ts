import { expect as baseExpect, type Page, type Route } from "@playwright/test";

/** Vite dev compiles routes on first visit, so allow more time than the 5s default. */
export const expect = baseExpect.configure({ timeout: 20_000 });

/**
 * Shared role fixtures for black-box E2E tests.
 *
 * The backend API is mocked at the network layer so the tests only depend on what a
 * real user sees in the browser: the login form, the resulting URL and the UI.
 */

export const INDIVIDUAL_ID = "9b63ae16-3da7-437e-990c-82eb97df5e00";
export const UNIT_ID = "94a676ce-06e6-4fd5-88c2-3122533f9ccb";
export const STUDENT_ID = "1f4b8a5e-2b1a-4c1e-9a52-6a0c7d1b2e01";
export const CANDIDATE_ID = "c2d7e3f1-6a3b-4f7e-8d21-0b9e5a4c3d02";
export const INSTITUTION_ID = "ed7e8c02-451b-4548-aa81-26b8d0b7fdec";

export type RoleKey =
  | "administrator"
  | "course_department"
  | "student"
  | "lecturer"
  | "candidate"
  | "rectorat";

export interface RoleUser {
  key: RoleKey;
  label: string;
  email: string;
  role: Record<string, string>;
  /** URL the user lands on after logging in */
  dashboard: string;
  /** URL prefix the role owns */
  areaPrefix: string;
  /** A representative page inside the role's own area */
  samplePath: string;
}

export const ROLE_USERS: RoleUser[] = [
  {
    key: "administrator",
    label: "Administrator",
    email: "admin@xsia.test",
    role: { id: "role-admin", name: "Administrator" },
    dashboard: "/administrator/person/master/individual",
    areaPrefix: "/administrator",
    samplePath: "/administrator/auth/user",
  },
  {
    key: "course_department",
    label: "Course Department (Kaprodi)",
    email: "kaprodi@xsia.test",
    role: { id: "role-prodi", name: "Kepala Program Studi", unit_id: UNIT_ID },
    dashboard: `/course-department/institution/master/unit/${UNIT_ID}`,
    areaPrefix: "/course-department",
    samplePath: "/course-department/academic/student/master/student",
  },
  {
    key: "student",
    label: "Student (Mahasiswa)",
    email: "mahasiswa@xsia.test",
    role: {
      id: "role-mhs",
      name: "Mahasiswa",
      roleable_id: STUDENT_ID,
      roleable_type: "Academic::Student",
      code: "2101001",
    },
    dashboard: `/student/person/master/individual/${INDIVIDUAL_ID}`,
    areaPrefix: "/student",
    samplePath: `/student/person/master/individual/${INDIVIDUAL_ID}`,
  },
  {
    key: "lecturer",
    label: "Lecturer (Dosen)",
    email: "dosen@xsia.test",
    role: { id: "role-dosen", name: "Dosen" },
    dashboard: `/lecturer/person/master/individual/${INDIVIDUAL_ID}/show`,
    areaPrefix: "/lecturer",
    samplePath: "/lecturer/academic/campaign/transaction/teach",
  },
  {
    key: "candidate",
    label: "Candidate (Calon Mahasiswa)",
    email: "camaba@xsia.test",
    role: {
      id: "role-pmb",
      name: "Calon Mahasiswa",
      roleable_id: CANDIDATE_ID,
      roleable_type: "Academic::Candidate",
    },
    dashboard: `/candidate/academic/candidate/master/candidate/${CANDIDATE_ID}`,
    areaPrefix: "/candidate",
    samplePath: "/candidate/academic/candidate/master/candidate",
  },
  {
    key: "rectorat",
    label: "Rectorat (Rektor)",
    email: "rektor@xsia.test",
    role: { id: "role-rektor", name: "Rektor", institution_id: INSTITUTION_ID },
    dashboard: `/rectorat/institution/${INSTITUTION_ID}`,
    areaPrefix: "/rectorat",
    samplePath: `/rectorat/institution/${INSTITUTION_ID}/unit`,
  },
];

export const ACCESS_DENIED_TOAST = "Access Denied: You do not have permission to access this page.";
export const VERIFYING_TEXT = "Verifying access permissions...";

function buildUser(user: RoleUser, roles = [user.role]) {
  return {
    id: `user-${user.key}`,
    pid: `pid-${user.key}`,
    individual_id: INDIVIDUAL_ID,
    name: `Test ${user.label}`,
    email: user.email,
    is_active: true,
    current_role_id: roles[0].id,
    roles,
  };
}

const json = (route: Route, status: number, body: unknown) =>
  route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });

/**
 * Mocks the backend for a browser page. `/login` and `/login-with-session` accept
 * `users`' emails with the password "password"; every other API call returns an
 * empty successful payload so pages render without a running server.
 */
export async function mockBackend(
  page: Page,
  users: RoleUser[] = ROLE_USERS,
  rolesOverride?: Record<string, string>[],
) {
  await page.route(/:5800\//, async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.replace(/\/+$/, "");

    if (
      request.method() === "POST" &&
      (path.endsWith("/login") || path.endsWith("/login-with-session"))
    ) {
      const body = request.postDataJSON() as { email: string; password: string };
      const match = users.find((u) => u.email === body.email);
      if (!match || body.password !== "password") {
        return json(route, 401, { message: "Invalid email or password" });
      }
      return json(route, 200, {
        token: `token-${match.key}`,
        session_id: `session-${match.key}`,
        user: buildUser(match, rolesOverride ?? [match.role]),
      });
    }

    return json(route, 200, {
      code: 200,
      data: [],
      total: 0,
      page: 1,
      per_page: 10,
      total_pages: 0,
    });
  });
}

/**
 * Navigates and waits for SolidJS hydration; interacting earlier submits forms natively
 * and skips client-side route guards.
 */
export async function gotoHydrated(page: Page, path: string) {
  await page.goto(path);
  // Solid attaches delegated handlers as `$$click` on elements once hydrated
  await page.waitForFunction(() =>
    Array.from(document.querySelectorAll("button")).some(
      (b) => (b as unknown as { $$click?: unknown }).$$click,
    ),
  );
}

/** Logs in through the real login form and waits for the role dashboard. */
export async function loginViaUi(page: Page, user: RoleUser, password = "password") {
  await gotoHydrated(page, "/authentification/login");
  await page.locator('input[type="email"]').fill(user.email);
  await page.locator('input[type="password"]').fill(password);
  await page.locator('button[type="submit"]').click();
}

/** Asserts the page is showing protected content (not stuck on the access check). */
export async function expectAllowedAt(page: Page, path: string) {
  await expect(page).toHaveURL(path);
  await expect(page.getByText(VERIFYING_TEXT)).toBeHidden();
}
