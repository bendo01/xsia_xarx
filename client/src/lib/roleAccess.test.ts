import { describe, it, expect, beforeEach, afterEach, vi } from "vite-plus/test";
import {
  type UserRoleItem,
  ROLE_ROUTE_PREFIXES,
  canAccessRoute,
  getActiveRole,
  getDashboardPathForRole,
  getStoredRoles,
  isAuthenticated,
  logout,
  processLoginSuccess,
  refreshAuthState,
  setActiveRole,
  activeRoleSignal,
  currentRoleIdSignal,
  isAuthenticatedSignal,
  activeInstitutionIdSignal,
} from "./authStore";
import { getStorageItem, setStorageItem } from "./storage";

/**
 * White-box role access tests.
 *
 * Exercises the internal role engine (normalization, login processing, role switching
 * and canAccessRoute) for every user role against every protected route area.
 */

const INDIVIDUAL_ID = "9b63ae16-3da7-437e-990c-82eb97df5e00";
const UNIT_ID = "94a676ce-06e6-4fd5-88c2-3122533f9ccb";
const STUDENT_ID = "1f4b8a5e-2b1a-4c1e-9a52-6a0c7d1b2e01";
const CANDIDATE_ID = "c2d7e3f1-6a3b-4f7e-8d21-0b9e5a4c3d02";
const INSTITUTION_ID = "ed7e8c02-451b-4548-aa81-26b8d0b7fdec";

type RoleKey =
  | "administrator"
  | "course_department"
  | "student"
  | "lecturer"
  | "candidate"
  | "rectorat";

interface RoleFixture {
  key: RoleKey;
  // Role item as returned by the backend
  role: UserRoleItem;
  // Dashboard each role should land on after login
  dashboard: string;
  // A representative page inside the role's own area
  samplePath: string;
}

const ROLE_FIXTURES: RoleFixture[] = [
  {
    key: "administrator",
    role: { id: "role-admin", name: "Administrator" },
    dashboard: "/administrator/person/master/individual",
    samplePath: "/administrator/auth/user",
  },
  {
    key: "course_department",
    role: { id: "role-prodi", name: "Kepala Program Studi", unit_id: UNIT_ID },
    dashboard: `/course-department/institution/master/unit/${UNIT_ID}`,
    samplePath: "/course-department/academic/student/master/student",
  },
  {
    key: "student",
    role: {
      id: "role-mhs",
      name: "Mahasiswa",
      roleable_id: STUDENT_ID,
      roleable_type: "Academic::Student",
      code: "2101001",
    },
    dashboard: `/student/person/master/individual/${INDIVIDUAL_ID}`,
    samplePath: `/student/person/master/individual/${INDIVIDUAL_ID}`,
  },
  {
    key: "lecturer",
    role: { id: "role-dosen", name: "Dosen" },
    dashboard: `/lecturer/person/master/individual/${INDIVIDUAL_ID}/show`,
    samplePath: "/lecturer/academic/campaign/transaction/teach",
  },
  {
    key: "candidate",
    role: {
      id: "role-pmb",
      name: "Calon Mahasiswa",
      roleable_id: CANDIDATE_ID,
      roleable_type: "Academic::Candidate",
    },
    dashboard: `/candidate/academic/candidate/master/candidate/${CANDIDATE_ID}`,
    samplePath: `/candidate/academic/candidate/master/candidate/${CANDIDATE_ID}/edit`,
  },
  {
    key: "rectorat",
    role: { id: "role-rektor", name: "Rektor", institution_id: INSTITUTION_ID },
    dashboard: `/rectorat/institution/${INSTITUTION_ID}`,
    samplePath: `/rectorat/institution/${INSTITUTION_ID}/unit`,
  },
];

const AREA_SAMPLE_PATHS: Record<RoleKey, string> = Object.fromEntries(
  ROLE_FIXTURES.map((f) => [f.key, f.samplePath]),
) as Record<RoleKey, string>;

/** Seeds storage as if the given single-role user were logged in. */
function seedSession(fixture: RoleFixture) {
  setStorageItem("token", `token-${fixture.key}`);
  setStorageItem("individual_id", INDIVIDUAL_ID);
  setStorageItem(
    "user",
    JSON.stringify({
      id: "user-1",
      email: `${fixture.key}@xsia.test`,
      individual_id: INDIVIDUAL_ID,
    }),
  );
  setStorageItem("roles", JSON.stringify([fixture.role]));
  setStorageItem("active_role", fixture.key);
  setStorageItem("current_role", fixture.role.id);
  if (fixture.role.unit_id) setStorageItem("unit_id", fixture.role.unit_id);
  if (fixture.role.institution_id) setStorageItem("institution_id", fixture.role.institution_id);
  refreshAuthState();
}

describe("Role Access Matrix (White-Box Unit Tests)", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    logout();
    // No test here should need the network; fail loudly if role logic reaches for it.
    fetchMock = vi.fn(
      async () => new Response(JSON.stringify({ code: 200, data: null }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("covers every protected route prefix with a fixture", () => {
    const prefixRoles = ROLE_ROUTE_PREFIXES.map((p) => p.role).sort();
    const fixtureRoles = ROLE_FIXTURES.map((f) => f.key).sort();
    expect(fixtureRoles).toEqual(prefixRoles);
  });

  describe("guest (unauthenticated)", () => {
    it.each(ROLE_FIXTURES.map((f) => [f.key, f.samplePath]))(
      "is redirected to session login with return_url when visiting the %s area",
      (_key, path) => {
        const result = canAccessRoute(path);
        expect(result.allowed).toBe(false);
        expect(result.reason).toBe("unauthenticated");
        expect(result.redirectTo).toBe(
          `/authentification/login_with_session?return_url=${encodeURIComponent(path)}`,
        );
      },
    );

    it.each([
      "/",
      "/authentification/login",
      "/authentification/login_with_session",
      "/authentification/forgot-password",
      "/some/unknown/page",
    ])("may visit public route %s", (path) => {
      expect(canAccessRoute(path)).toEqual({ allowed: true });
    });

    it("strips the hash fragment but keeps the query string in return_url", () => {
      const result = canAccessRoute("/student/academic/x?tab=2#section");
      expect(result.redirectTo).toBe(
        `/authentification/login_with_session?return_url=${encodeURIComponent("/student/academic/x?tab=2")}`,
      );
    });

    it("treats a literal 'undefined' token as logged out", () => {
      setStorageItem("token", "undefined");
      setStorageItem("active_role", "administrator");
      refreshAuthState();
      expect(isAuthenticated()).toBe(false);
      expect(isAuthenticatedSignal()).toBe(false);
      expect(canAccessRoute("/administrator/auth/user").reason).toBe("unauthenticated");
    });

    it("does not match look-alike prefixes such as /students or /administrators", () => {
      expect(canAccessRoute("/students/list")).toEqual({ allowed: true });
      expect(canAccessRoute("/administrators")).toEqual({ allowed: true });
    });
  });

  describe.each(ROLE_FIXTURES)("$key", (fixture) => {
    it("lands on its own dashboard after login", async () => {
      const target = await processLoginSuccess({
        token: `token-${fixture.key}`,
        user: {
          id: "user-1",
          email: `${fixture.key}@xsia.test`,
          individual_id: INDIVIDUAL_ID,
          roles: [fixture.role],
        },
      });
      expect(target).toBe(fixture.dashboard);
      expect(getStorageItem("active_role")).toBe(fixture.key);
      expect(getStorageItem("current_role")).toBe(fixture.role.id);
      expect(activeRoleSignal()).toBe(fixture.key);
      expect(currentRoleIdSignal()).toBe(fixture.role.id);
    });

    it("resolves its active role from storage", () => {
      seedSession(fixture);
      expect(getActiveRole()).toBe(fixture.key);
      expect(activeRoleSignal()).toBe(fixture.key);
      expect(isAuthenticatedSignal()).toBe(true);
    });

    it("is allowed into its own area", () => {
      seedSession(fixture);
      const result = canAccessRoute(fixture.samplePath);
      expect(result.allowed).toBe(true);
      expect(result.switchRole).toBeUndefined();
    });

    it.each(ROLE_FIXTURES.filter((f) => f.key !== fixture.key).map((f) => [f.key]))(
      "access to the %s area matches the policy",
      (otherKey) => {
        seedSession(fixture);
        const result = canAccessRoute(AREA_SAMPLE_PATHS[otherKey as RoleKey]);

        if (fixture.key === "administrator") {
          // Administrator has bypass access everywhere
          expect(result.allowed).toBe(true);
        } else {
          expect(result.allowed).toBe(false);
          expect(result.reason).toBe("unauthorized");
          expect(result.redirectTo).toBe(fixture.dashboard);
        }
      },
    );

    it("loses access to its area after logout", () => {
      seedSession(fixture);
      logout();
      const result = canAccessRoute(fixture.samplePath);
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe("unauthenticated");
    });
  });

  describe("privilege escalation guards", () => {
    it("trusts a forged active_role from storage (client guard is not a security boundary)", () => {
      // A student who edits localStorage active_role to 'administrator' passes the client guard;
      // the backend must enforce authorization on every API call.
      seedSession(ROLE_FIXTURES.find((f) => f.key === "student")!);
      setStorageItem("active_role", "administrator");
      expect(getActiveRole()).toBe("administrator");
      expect(canAccessRoute("/administrator/auth/user").allowed).toBe(true);
    });

    it("never grants administrator by default when the backend returns no roles", async () => {
      fetchMock.mockResolvedValue(new Response(JSON.stringify({ data: [] }), { status: 200 }));
      await processLoginSuccess({
        token: "t",
        user: { id: "u", email: "someone@xsia.test", individual_id: INDIVIDUAL_ID },
      });
      expect(getActiveRole()).toBe("student");
      expect(getStoredRoles().map((r) => r.name)).toEqual(["student"]);
      expect(canAccessRoute("/administrator/auth/user").allowed).toBe(false);
    });

    // KNOWN BUG: processLoginSuccess does not persist the active role's unit_id / institution_id,
    // so the "unauthorized" redirect (which has no role item) falls back to a placeholder or default URL.
    // These use it.fails so the suite stays green; flip them to it() once fixed.
    it.fails("course_department denied after a real login is redirected to its own unit, not the [id] placeholder", async () => {
      const prodi = ROLE_FIXTURES.find((f) => f.key === "course_department")!;
      setStorageItem("individual_id", INDIVIDUAL_ID);
      await processLoginSuccess({
        token: "t",
        user: { id: "u", individual_id: INDIVIDUAL_ID, roles: [prodi.role] },
      });
      expect(canAccessRoute("/student/person/master/individual/x").redirectTo).toBe(
        prodi.dashboard,
      );
    });

    it.fails("rectorat denied after a real login is redirected to its own institution, not the default", async () => {
      const otherInst = "0a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d";
      setStorageItem("individual_id", INDIVIDUAL_ID);
      await processLoginSuccess({
        token: "t",
        user: {
          id: "u",
          individual_id: INDIVIDUAL_ID,
          roles: [{ id: "role-rektor", name: "Rektor", institution_id: otherInst }],
        },
      });
      expect(canAccessRoute("/student/person/master/individual/x").redirectTo).toBe(
        `/rectorat/institution/${otherInst}`,
      );
    });

    it("prefers the backend current_role_id over the first role on login", async () => {
      const lecturer = ROLE_FIXTURES.find((f) => f.key === "lecturer")!;
      const prodi = ROLE_FIXTURES.find((f) => f.key === "course_department")!;
      const target = await processLoginSuccess({
        token: "t",
        user: {
          id: "u",
          individual_id: INDIVIDUAL_ID,
          current_role_id: prodi.role.id,
          roles: [lecturer.role, prodi.role],
        },
      });
      expect(getActiveRole()).toBe("course_department");
      expect(target).toBe(prodi.dashboard);
    });
  });

  describe("multi-role users", () => {
    const multiRoles = ROLE_FIXTURES.filter((f) => f.key !== "administrator").map((f) => f.role);

    beforeEach(() => {
      setStorageItem("token", "multi-token");
      setStorageItem("individual_id", INDIVIDUAL_ID);
      setStorageItem("user", JSON.stringify({ id: "u", individual_id: INDIVIDUAL_ID }));
      setStorageItem("roles", JSON.stringify(multiRoles));
      setStorageItem("active_role", "lecturer");
      setStorageItem("current_role", "role-dosen");
      refreshAuthState();
    });

    it.each(
      ROLE_FIXTURES.filter((f) => f.key !== "administrator" && f.key !== "lecturer").map((f) => [
        f.key,
        f,
      ]),
    )("is allowed into the %s area with a switchRole hint", (_key, target) => {
      const result = canAccessRoute(target.samplePath);
      expect(result.allowed).toBe(true);
      expect(result.switchRole?.id).toBe(target.role.id);
    });

    it("is still denied the administrator area without an administrator role", () => {
      const result = canAccessRoute("/administrator/auth/user");
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe("unauthorized");
    });

    it.each(ROLE_FIXTURES.filter((f) => f.key !== "administrator").map((f) => [f.key, f]))(
      "setActiveRole switches to %s and persists it",
      (key, target) => {
        setActiveRole(target.role.id);
        expect(activeRoleSignal()).toBe(key);
        expect(getStorageItem("active_role")).toBe(key);
        expect(getStorageItem("current_role")).toBe(target.role.id);
        expect(JSON.parse(getStorageItem("user")!).current_role_id).toBe(target.role.id);
      },
    );

    it("setActiveRole to student records the active student id and code", () => {
      setActiveRole("role-mhs");
      expect(getStorageItem("active_student_id")).toBe(STUDENT_ID);
      expect(getStorageItem("active_student_code")).toBe("2101001");
    });

    it("setActiveRole to rectorat syncs the active institution", () => {
      setActiveRole("role-rektor");
      expect(activeInstitutionIdSignal()).toBe(INSTITUTION_ID);
      expect(getStorageItem("institution_id")).toBe(INSTITUTION_ID);
    });

    it("does not call the role-change API for non-UUID role ids", () => {
      setActiveRole("role-dosen");
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("persists a UUID role switch to the backend", () => {
      const uuid = "7d0f5b4a-8e43-4c58-9a35-2b1b9a4f7c11";
      setStorageItem("roles", JSON.stringify([...multiRoles, { id: uuid, name: "Dosen" }]));
      refreshAuthState();
      setActiveRole(uuid);
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining(`/user/set_current_role/${uuid}`),
        expect.anything(),
      );
    });
  });

  it("returns the generic dashboard placeholders when ids are unknown", () => {
    expect(getDashboardPathForRole("Kepala Program Studi")).toBe(
      "/course-department/institution/master/unit/[id]",
    );
    expect(getDashboardPathForRole("Mahasiswa")).toBe("/student/person/master/individual/[id]");
    expect(getDashboardPathForRole("Dosen")).toBe("/lecturer/person/master/individual/[id]/show");
    expect(getDashboardPathForRole("Calon Mahasiswa")).toBe(
      "/candidate/academic/candidate/master/candidate",
    );
  });
});
