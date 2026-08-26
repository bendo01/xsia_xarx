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
  setActiveRole,
  processLoginSuccess,
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
    it("returns formatted display names for roles", () => {
      expect(getRoleDisplayName("administrator")).toBe("Administrator");
      expect(getRoleDisplayName("course_department")).toBe("Course & Department");
      expect(getRoleDisplayName("student")).toBe("Student");
      expect(getRoleDisplayName("lecturer")).toBe("Lecturer");
      expect(getRoleDisplayName("candidate")).toBe("Candidate / PMB");
      expect(getRoleDisplayName("rectorat")).toBe("Rectorat");
      expect(getRoleDisplayName("guest")).toBe("Guest");
    });
  });

  describe("getDashboardPathForRole", () => {
    it("maps roles to their respective primary dashboard route", () => {
      expect(getDashboardPathForRole("administrator")).toBe("/administrator/person/master/individual");
      expect(getDashboardPathForRole("course_department")).toBe("/course-department/academic/course/master/course");
      expect(getDashboardPathForRole("student")).toBe("/student/person/master/individual/show");
      expect(getDashboardPathForRole("lecturer")).toBe("/lecturer/academic/campaign/activity");
      expect(getDashboardPathForRole("candidate")).toBe("/candidate/academic/candidate/master/candidate");
      expect(getDashboardPathForRole("rectorat")).toBe("/dashboard/rectorat");
    });
  });

  describe("Auth State Signals & Storage synchronization", () => {
    it("initializes in logged-out guest state", () => {
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
});
