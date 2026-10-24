import { describe, it, expect, beforeEach, afterEach, vi } from "vite-plus/test";
import { render, screen, waitFor } from "@solidjs/testing-library";
import { MemoryRouter, Route, createMemoryHistory } from "@solidjs/router";
import RouteGuard from "./RouteGuard";
import { logout, activeRoleSignal, currentRoleIdSignal } from "~/lib/authStore";
import { setStorageItem } from "~/lib/storage";

/**
 * White-box component tests for RouteGuard: renders the guard inside a memory router
 * for each role and checks whether protected content is shown or the user is redirected.
 */

const INDIVIDUAL_ID = "9b63ae16-3da7-437e-990c-82eb97df5e00";
const UNIT_ID = "94a676ce-06e6-4fd5-88c2-3122533f9ccb";
const CANDIDATE_ID = "c2d7e3f1-6a3b-4f7e-8d21-0b9e5a4c3d02";
const INSTITUTION_ID = "ed7e8c02-451b-4548-aa81-26b8d0b7fdec";

const ROLES = [
  {
    key: "administrator",
    role: { id: "role-admin", name: "Administrator" },
    area: "/administrator/auth/user",
    dashboard: "/administrator/dashboard",
  },
  {
    key: "course_department",
    role: { id: "role-prodi", name: "Kepala Program Studi", unit_id: UNIT_ID },
    area: "/course-department/academic/student/master/student",
    dashboard: `/course-department/institution/master/unit/${UNIT_ID}`,
  },
  {
    key: "student",
    role: { id: "role-mhs", name: "Mahasiswa" },
    area: `/student/person/master/individual/${INDIVIDUAL_ID}`,
    dashboard: `/student/person/master/individual/${INDIVIDUAL_ID}`,
  },
  {
    key: "lecturer",
    role: { id: "role-dosen", name: "Dosen" },
    area: "/lecturer/academic/campaign/transaction/teach",
    dashboard: `/lecturer/person/master/individual/${INDIVIDUAL_ID}/show`,
  },
  {
    key: "candidate",
    role: {
      id: "role-pmb",
      name: "Calon Mahasiswa",
      roleable_id: CANDIDATE_ID,
      roleable_type: "Academic::Candidate",
    },
    area: "/candidate/academic/candidate/master/candidate",
    dashboard: `/candidate/academic/candidate/master/candidate/${CANDIDATE_ID}`,
  },
  {
    key: "rectorat",
    role: { id: "role-rektor", name: "Rektor", institution_id: INSTITUTION_ID },
    area: `/rectorat/institution/${INSTITUTION_ID}/unit`,
    dashboard: `/rectorat/institution/${INSTITUTION_ID}`,
  },
] as const;

function seed(entry: (typeof ROLES)[number]) {
  setStorageItem("token", `token-${entry.key}`);
  setStorageItem("individual_id", INDIVIDUAL_ID);
  setStorageItem("user", JSON.stringify({ id: "u", individual_id: INDIVIDUAL_ID }));
  setStorageItem("roles", JSON.stringify([entry.role]));
  setStorageItem("active_role", entry.key);
  setStorageItem("current_role", entry.role.id);
  if ("unit_id" in entry.role) setStorageItem("unit_id", entry.role.unit_id);
  if ("institution_id" in entry.role) setStorageItem("institution_id", entry.role.institution_id);
}

function renderAt(path: string) {
  const history = createMemoryHistory();
  history.set({ value: path });
  render(() => (
    <MemoryRouter history={history} root={(props) => <RouteGuard>{props.children}</RouteGuard>}>
      <Route path="*all" component={() => <div data-testid="protected">Protected content</div>} />
    </MemoryRouter>
  ));
  return history;
}

describe("RouteGuard (White-Box Component Tests)", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    document.body.innerHTML = "";
    logout();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("{}", { status: 200 })),
    );
    // jsdom does not implement scrollTo, which the router calls on navigation
    window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders public pages for guests without checking", () => {
    renderAt("/authentification/login");
    expect(screen.getByTestId("protected")).toBeInTheDocument();
  });

  it.each(ROLES.map((r) => [r.key, r.area]))(
    "redirects a guest away from the %s area to session login",
    async (_key, area) => {
      const history = renderAt(area);
      await waitFor(() =>
        expect(history.get()).toBe(
          `/authentification/login_with_session?return_url=${encodeURIComponent(area)}`,
        ),
      );
    },
  );

  describe.each(ROLES)("$key", (entry) => {
    it("sees protected content in its own area", async () => {
      seed(entry);
      renderAt(entry.area);
      expect(await screen.findByTestId("protected")).toBeInTheDocument();
    });

    it.each(ROLES.filter((r) => r.key !== entry.key).map((r) => [r.key, r.area]))(
      "visiting the %s area follows the access policy",
      async (_otherKey, otherArea) => {
        seed(entry);
        const history = renderAt(otherArea);

        if (entry.key === "administrator") {
          expect(await screen.findByTestId("protected")).toBeInTheDocument();
          expect(history.get()).toBe(otherArea);
        } else {
          await waitFor(() => expect(history.get()).toBe(entry.dashboard));
        }
      },
    );
  });

  it("auto-switches a multi-role user to the role required by the area", async () => {
    seed(ROLES[3]); // lecturer active
    setStorageItem("roles", JSON.stringify([ROLES[3].role, ROLES[1].role]));
    renderAt(ROLES[1].area);
    expect(await screen.findByTestId("protected")).toBeInTheDocument();
    expect(activeRoleSignal()).toBe("course_department");
    expect(currentRoleIdSignal()).toBe("role-prodi");
  });
});
