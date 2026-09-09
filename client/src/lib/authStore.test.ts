import { describe, it, expect, beforeEach } from "vitest";
import {
  normalizeRoleName,
  getRoleDisplayName,
  getDashboardPathForRole,
  getStoredUser,
  getStoredRoles,
  getActiveRole,
  logout,
  refreshAuthState,
  currentUserSignal,
  activeRoleSignal,
  isAuthenticatedSignal,
  isAuthenticated,
  setActiveRole,
  processLoginSuccess,
  canAccessRoute,
  getRequiredRoleForPath,
} from "./authStore";
import { setStorageItem } from "./storage";

describe("Auth Store & Role Engine (White-Box Unit Tests)", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    logout();
  });

  describe("normalizeRoleName", () => {
    it("returns 'guest' for empty or null/undefined inputs", () => {
      expect(normalizeRoleName(null)).toBe("guest");
      expect(normalizeRoleName(undefined)).toBe("guest");
      expect(normalizeRoleName("")).toBe("guest");
    });

    it("normalizes administrator variations", () => {
      expect(normalizeRoleName("admin")).toBe("administrator");
      expect(normalizeRoleName("Administrator")).toBe("administrator");
      expect(normalizeRoleName("sys_admin")).toBe("administrator");
    });

    it("normalizes academic department / prodi variations", () => {
      expect(normalizeRoleName("prodi")).toBe("course_department");
      expect(normalizeRoleName("jurusan")).toBe("course_department");
      expect(normalizeRoleName("kaprodi")).toBe("course_department");
      expect(normalizeRoleName("course_department")).toBe("course_department");
    });

    it("normalizes student variations", () => {
      expect(normalizeRoleName("student")).toBe("student");
      expect(normalizeRoleName("mahasiswa")).toBe("student");
      expect(normalizeRoleName("MHS")).toBe("student");
    });

    it("normalizes lecturer / faculty variations", () => {
      expect(normalizeRoleName("lecturer")).toBe("lecturer");
      expect(normalizeRoleName("dosen")).toBe("lecturer");
      expect(normalizeRoleName("pengajar")).toBe("lecturer");
      expect(normalizeRoleName("instructor")).toBe("lecturer");
    });

    it("normalizes candidate / PMB variations", () => {
      expect(normalizeRoleName("candidate")).toBe("candidate");
      expect(normalizeRoleName("camaba")).toBe("candidate");
      expect(normalizeRoleName("pmb")).toBe("candidate");
      expect(normalizeRoleName("applicant")).toBe("candidate");
    });

    it("normalizes rectorat / leadership variations", () => {
      expect(normalizeRoleName("rectorat")).toBe("rectorat");
      expect(normalizeRoleName("rektorat")).toBe("rectorat");
      expect(normalizeRoleName("pimpinan")).toBe("rectorat");
    });
  });

  describe("getRoleDisplayName", () => {
    it("returns formatted display names for roles in English and Indonesian", () => {
      // In Indonesian (default)
      expect(getRoleDisplayName("administrator")).toBe("Administrator");
      expect(getRoleDisplayName("course_department")).toBe("Program Studi & Jurusan");
      expect(getRoleDisplayName("student")).toBe("Mahasiswa");
      expect(getRoleDisplayName("lecturer")).toBe("Dosen");
      expect(getRoleDisplayName("candidate")).toBe("Calon Mahasiswa / PMB");
      expect(getRoleDisplayName("rectorat")).toBe("Rektorat");
      expect(getRoleDisplayName("guest")).toBe("Tamu");
    });
  });

  describe("getDashboardPathForRole", () => {
    it("maps roles to their respective primary dashboard route", () => {
      expect(getDashboardPathForRole("administrator")).toBe("/administrator/person/master/individual");
      expect(getDashboardPathForRole("course_department")).toBe("/course-department/institution/master/unit/[id]/show");
      expect(getDashboardPathForRole("student")).toBe("/student/person/master/individual/[id]/show");
      expect(getDashboardPathForRole("lecturer")).toBe("/lecturer/person/master/individual/[id]/show");
      expect(getDashboardPathForRole("candidate")).toBe("/candidate/academic/candidate/master/candidate");
      expect(getDashboardPathForRole("rectorat")).toBe("/dashboard/rectorat");
    });

    it("resolves user individual_id and roleable unit_id when provided", () => {
      expect(getDashboardPathForRole("student", undefined, { individual_id: "9b63ae16-3da7-437e-990c-82eb97df5e00" }))
        .toBe("/student/person/master/individual/9b63ae16-3da7-437e-990c-82eb97df5e00/show");
      expect(getDashboardPathForRole("lecturer", undefined, { individual_id: "lecturer-ind-123" }))
        .toBe("/lecturer/person/master/individual/lecturer-ind-123/show");
      expect(getDashboardPathForRole("course_department", { id: "1", name: "prodi", roleable_id: "unit-123" }))
        .toBe("/course-department/institution/master/unit/unit-123/show");
    });

    it("redirects staff with position type Kepala/Sekertaris/Staff Program Studi to unit show page", () => {
      expect(getDashboardPathForRole("Kepala Program Studi")).toBe("/course-department/institution/master/unit/[id]/show");
      expect(getDashboardPathForRole("Sekertaris Program Studi")).toBe("/course-department/institution/master/unit/[id]/show");
      expect(getDashboardPathForRole("Sekretaris Program Studi")).toBe("/course-department/institution/master/unit/[id]/show");
      expect(getDashboardPathForRole("Staff Program Studi")).toBe("/course-department/institution/master/unit/[id]/show");

      // When passed as role item with position_type or position_type_name
      expect(getDashboardPathForRole("staff", { id: "1", name: "Staff", position_type_name: "Kepala Program Studi" })).toBe("/course-department/institution/master/unit/[id]/show");
      expect(getDashboardPathForRole("staff", { id: "2", name: "Staff", position_type: { name: "Sekertaris Program Studi" } })).toBe("/course-department/institution/master/unit/[id]/show");
      expect(getDashboardPathForRole("staff", { id: "3", name: "Staff", position_type: { name: "Staff Program Studi" } })).toBe("/course-department/institution/master/unit/[id]/show");
    });
  });

  describe("Auth State Signals & Storage synchronization", () => {
    it("initializes in logged-out guest state", () => {
      expect(isAuthenticated()).toBe(false);
      expect(isAuthenticatedSignal()).toBe(false);
      expect(currentUserSignal()).toBeNull();
    });

    it("updates signals and stores user object on processLoginSuccess", async () => {
      const mockLoginResponse = {
        user: {
          id: "user-123",
          name: "Dr. Jane Doe",
          email: "jane@university.ac.id",
          current_role_id: "role-1",
          roles: [
            { id: "role-1", name: "lecturer" },
            { id: "role-2", name: "administrator" },
          ],
        },
      };

      setStorageItem("token", "jwt-mock-token-xyz");
      setStorageItem("user", JSON.stringify(mockLoginResponse.user));
      await processLoginSuccess(mockLoginResponse);

      expect(isAuthenticated()).toBe(true);
      expect(isAuthenticatedSignal()).toBe(true);
      expect(currentUserSignal()?.name).toBe("Dr. Jane Doe");
      expect(activeRoleSignal()).toBe("lecturer");
      expect(getStoredUser()?.email).toBe("jane@university.ac.id");
      expect(getStoredRoles().length).toBe(2);
    });

    it("allows switching active role for multi-role users", async () => {
      const mockLoginResponse = {
        user: {
          id: "user-456",
          name: "Admin John",
          current_role_id: "r1",
          roles: [
            { id: "r1", name: "student" },
            { id: "r2", name: "administrator" },
          ],
        },
      };

      setStorageItem("token", "token-123");
      setStorageItem("user", JSON.stringify(mockLoginResponse.user));
      await processLoginSuccess(mockLoginResponse);
      expect(activeRoleSignal()).toBe("student");

      setActiveRole("administrator");
      expect(activeRoleSignal()).toBe("administrator");
      expect(getActiveRole()).toBe("administrator");
    });

    it("correctly sets student role for marshamarshaif@gmail.com with Mahasiswa role and prevents administrator access", async () => {
      const mockStudentResponse = {
        token: "jwt-student-token",
        user: {
          id: "9bfa0478-a52d-4e24-a52e-6923ed281e49",
          name: "MARSHA",
          email: "marshamarshaif@gmail.com",
          individual_id: "9b63ae16-3da7-437e-990c-82eb97df5e00",
          current_role_id: "9bfa0479-2211-4509-8e95-00c9ac714620",
          roles: [
            {
              id: "9bfa0479-2211-4509-8e95-00c9ac714620",
              name: "Mahasiswa",
              user_id: "9bfa0478-a52d-4e24-a52e-6923ed281e49",
              roleable_type: "App\\Models\\Academic\\Student\\Master\\Student",
            },
          ],
        },
      };

      setStorageItem("token", "jwt-student-token");
      setStorageItem("user", JSON.stringify(mockStudentResponse.user));
      setStorageItem("individual_id", "9b63ae16-3da7-437e-990c-82eb97df5e00");
      const dashboardPath = await processLoginSuccess(mockStudentResponse);

      expect(isAuthenticatedSignal()).toBe(true);
      expect(currentUserSignal()?.name).toBe("MARSHA");
      expect(activeRoleSignal()).toBe("student");
      expect(getActiveRole()).toBe("student");
      expect(dashboardPath).toBe("/student/person/master/individual/9b63ae16-3da7-437e-990c-82eb97df5e00/show");

      const storedRoles = getStoredRoles();
      expect(storedRoles.length).toBe(1);
      expect(storedRoles[0].name).toBe("Mahasiswa");
      expect(storedRoles.some((r) => r.name.toLowerCase().includes("admin"))).toBe(false);
    });

    it("falls back to least-privileged student role for standard emails when roles are empty", async () => {
      const mockEmptyRolesResponse = {
        token: "jwt-generic-token",
        user: {
          id: "user-generic",
          name: "Marsha Generic",
          email: "marshamarshaif@gmail.com",
          current_role_id: null,
          roles: [],
        },
      };

      setStorageItem("token", "jwt-generic-token");
      setStorageItem("user", JSON.stringify(mockEmptyRolesResponse.user));
      const dashboardPath = await processLoginSuccess(mockEmptyRolesResponse);

      expect(activeRoleSignal()).toBe("student");
      expect(getActiveRole()).toBe("student");
      expect(dashboardPath).toBe("/student/person/master/individual/[id]/show");

      const storedRoles = getStoredRoles();
      expect(storedRoles.length).toBe(1);
      expect(storedRoles[0].name).toBe("student");
      expect(storedRoles.some((r) => r.name.toLowerCase().includes("admin"))).toBe(false);
    });

    it("cleans up user state on logout", () => {
      setStorageItem("token", "token-xyz");
      setStorageItem("user", JSON.stringify({ id: "1", name: "Temp" }));
      refreshAuthState();

      expect(isAuthenticatedSignal()).toBe(true);

      logout();

      expect(isAuthenticatedSignal()).toBe(false);
      expect(currentUserSignal()).toBeNull();
      expect(getStoredUser()).toBeNull();
    });
  });

  describe("getRequiredRoleForPath & canAccessRoute", () => {
    it("identifies required roles correctly for various URL paths", () => {
      expect(getRequiredRoleForPath("/course-department/academic/student/master")).toBe("course_department");
      expect(getRequiredRoleForPath("/course-department/institution/master/unit/show")).toBe("course_department");
      expect(getRequiredRoleForPath("/student/person/master/individual/show")).toBe("student");
      expect(getRequiredRoleForPath("/lecturer/academic/campaign/transaction/teach")).toBe("lecturer");
      expect(getRequiredRoleForPath("/administrator/person/master/individual")).toBe("administrator");
      expect(getRequiredRoleForPath("/candidate/academic/candidate/master/candidate")).toBe("candidate");
      expect(getRequiredRoleForPath("/authentification/login")).toBeNull();
      expect(getRequiredRoleForPath("/")).toBeNull();
      expect(getRequiredRoleForPath("/404")).toBeNull();
    });

    it("allows unauthenticated visitors on public routes", () => {
      const loginCheck = canAccessRoute("/authentification/login");
      expect(loginCheck.allowed).toBe(true);

      const rootCheck = canAccessRoute("/");
      expect(rootCheck.allowed).toBe(true);
    });

    it("redirects unauthenticated visitors attempting to access protected routes to login", () => {
      const check = canAccessRoute("/course-department/academic/student/master?unit_id=94a676ce-06e6-4fd5-88c2-3122533f9ccb");
      expect(check.allowed).toBe(false);
      expect(check.reason).toBe("unauthenticated");
      expect(check.redirectTo).toContain("/authentification/login");
      expect(check.redirectTo).toContain(encodeURIComponent("/course-department/academic/student/master?unit_id=94a676ce-06e6-4fd5-88c2-3122533f9ccb"));
    });

    it("PREVENTS student (e.g. Marsha) from accessing course-department pages and redirects to student dashboard", () => {
      // Set up authenticated student user
      setStorageItem("token", "student-valid-token");
      setStorageItem("active_role", "student");
      setStorageItem("current_role", "role-mhs-1");
      setStorageItem("individual_id", "9b63ae16-3da7-437e-990c-82eb97df5e00");
      setStorageItem("roles", JSON.stringify([
        { id: "role-mhs-1", name: "Mahasiswa" }
      ]));
      refreshAuthState();

      const result = canAccessRoute("/course-department/academic/student/master?unit_id=94a676ce-06e6-4fd5-88c2-3122533f9ccb");
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe("unauthorized");
      expect(result.redirectTo).toBe("/student/person/master/individual/9b63ae16-3da7-437e-990c-82eb97df5e00/show");
    });

    it("PREVENTS student from accessing administrator pages", () => {
      setStorageItem("token", "student-valid-token");
      setStorageItem("active_role", "student");
      setStorageItem("individual_id", "9b63ae16-3da7-437e-990c-82eb97df5e00");
      setStorageItem("roles", JSON.stringify([
        { id: "role-mhs-1", name: "Mahasiswa" }
      ]));
      refreshAuthState();

      const result = canAccessRoute("/administrator/person/master/individual");
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe("unauthorized");
      expect(result.redirectTo).toBe("/student/person/master/individual/9b63ae16-3da7-437e-990c-82eb97df5e00/show");
    });

    it("ALLOWS student to access student routes", () => {
      setStorageItem("token", "student-valid-token");
      setStorageItem("active_role", "student");
      setStorageItem("roles", JSON.stringify([
        { id: "role-mhs-1", name: "Mahasiswa" }
      ]));
      refreshAuthState();

      const result = canAccessRoute("/student/person/master/individual/9b63ae16-3da7-437e-990c-82eb97df5e00/show");
      expect(result.allowed).toBe(true);
    });

    it("ALLOWS administrator to access course-department routes as a bypass", () => {
      setStorageItem("token", "admin-valid-token");
      setStorageItem("active_role", "administrator");
      setStorageItem("roles", JSON.stringify([
        { id: "role-admin-1", name: "Administrator" }
      ]));
      refreshAuthState();

      const result = canAccessRoute("/course-department/academic/student/master");
      expect(result.allowed).toBe(true);
    });

    it("detects multi-role user and returns switchRole when visiting matching route", () => {
      setStorageItem("token", "multi-valid-token");
      setStorageItem("active_role", "lecturer");
      setStorageItem("current_role", "role-dosen-1");
      setStorageItem("roles", JSON.stringify([
        { id: "role-dosen-1", name: "Dosen" },
        { id: "role-prodi-1", name: "Kepala Program Studi" }
      ]));
      refreshAuthState();

      const result = canAccessRoute("/course-department/academic/student/master");
      expect(result.allowed).toBe(true);
      expect(result.switchRole).toBeDefined();
      expect(result.switchRole?.id).toBe("role-prodi-1");
    });
  });
});
