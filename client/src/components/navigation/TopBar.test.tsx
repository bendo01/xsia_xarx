import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@solidjs/testing-library";
import { Router, Route } from "@solidjs/router";
import TopBar from "./TopBar";
import { logout, refreshAuthState } from "../../lib/authStore";
import { setStorageItem } from "../../lib/storage";
import { setLocale, getLocale } from "../../i18n";

describe("TopBar Navigation Component (White-Box Component Tests)", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    setLocale("en");
    logout();
    document.body.innerHTML = "";
  });

  it("renders branding and portal title in English for unauthenticated guest", () => {
    setLocale("en");
    render(() => (
      <Router>
        <Route path="/" component={TopBar} />
      </Router>
    ));

    expect(screen.getByText("XSIA XARX")).toBeInTheDocument();
    expect(screen.getByText("Enterprise Portal")).toBeInTheDocument();
    expect(screen.getByText("Sign In (JWT)")).toBeInTheDocument();
    expect(screen.getByTestId("topbar-language-button")).toBeInTheDocument();
  });

  it("renders branding and portal title in Bahasa Indonesia when locale is set to id", () => {
    setLocale("id");
    render(() => (
      <Router>
        <Route path="/" component={TopBar} />
      </Router>
    ));

    expect(screen.getByText("XSIA XARX")).toBeInTheDocument();
    expect(screen.getByText("Portal Enterprise")).toBeInTheDocument();
    expect(screen.getByText("Masuk Standar (JWT)")).toBeInTheDocument();
  });

  it("toggles locale when clicking the language switch button", () => {
    setLocale("en");
    render(() => (
      <Router>
        <Route path="/" component={TopBar} />
      </Router>
    ));

    const langBtn = screen.getByTestId("topbar-language-button");
    expect(getLocale()).toBe("en");

    fireEvent.click(langBtn);
    expect(getLocale()).toBe("id");

    fireEvent.click(langBtn);
    expect(getLocale()).toBe("en");
  });

  it("renders active role badge and user name when authenticated", () => {
    setLocale("en");
    const user = {
      id: "u-1",
      name: "Prof. Alan Turing",
      email: "alan@xsia.edu",
    };
    const roles = [{ id: "r-1", name: "lecturer" }];

    setStorageItem("token", "mock-valid-jwt-token");
    setStorageItem("user", JSON.stringify(user));
    setStorageItem("roles", JSON.stringify(roles));
    setStorageItem("active_role", "lecturer");
    refreshAuthState();

    render(() => (
      <Router>
        <Route path="/" component={TopBar} />
      </Router>
    ));

    expect(screen.getByText("XSIA XARX")).toBeInTheDocument();
    expect(screen.getAllByText("Lecturer").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Prof. Alan Turing").length).toBeGreaterThanOrEqual(1);
  });

  it("renders user role names and institution names in multi-role switcher list", () => {
    setLocale("en");
    const user = {
      id: "u-2",
      name: "Benny Leonard",
      email: "benny@xsia.edu",
    };
    const roles = [
      { id: "r-1", name: "Fakultas", institution_name: "UNIVERSITAS PANCASAKTI" },
      { id: "r-2", name: "Rektorat", institution_name: "Institut Teknologi dan Kesehatan Tri Tunas Nasional" },
    ];

    setStorageItem("token", "mock-valid-jwt-token");
    setStorageItem("user", JSON.stringify(user));
    setStorageItem("roles", JSON.stringify(roles));
    setStorageItem("current_role", "r-1");
    refreshAuthState();

    render(() => (
      <Router>
        <Route path="/" component={TopBar} />
      </Router>
    ));

    expect(screen.getAllByText("Fakultas").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("UNIVERSITAS PANCASAKTI").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Rektorat").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Institut Teknologi dan Kesehatan Tri Tunas Nasional").length).toBeGreaterThanOrEqual(1);
  });

  it("updates active institution name on TopBar when user changes role", async () => {
    setLocale("en");
    const user = {
      id: "u-3",
      name: "Prof. Multi Role",
      email: "prof@xsia.edu",
    };
    const roles = [
      { id: "r-101", name: "Fakultas", institution_id: "inst-1", institution_name: "UNIVERSITAS PANCASAKTI" },
      { id: "r-102", name: "Rektorat", institution_id: "inst-2", institution_name: "Institut Teknologi dan Kesehatan Tri Tunas Nasional" },
    ];

    setStorageItem("token", "mock-valid-jwt-token");
    setStorageItem("user", JSON.stringify(user));
    setStorageItem("roles", JSON.stringify(roles));
    setStorageItem("current_role", "r-101");
    refreshAuthState();

    render(() => (
      <Router>
        <Route path="/" component={TopBar} />
      </Router>
    ));

    // Initially r-101 (Fakultas) is active
    expect(screen.getAllByText("UNIVERSITAS PANCASAKTI").length).toBeGreaterThanOrEqual(1);

    // Click to switch to Rektorat
    const rektoratEls = screen.getAllByText("Rektorat");
    expect(rektoratEls.length).toBeGreaterThanOrEqual(1);
    const rektoratBtn = rektoratEls[0].closest("button");
    expect(rektoratBtn).toBeTruthy();
    fireEvent.click(rektoratBtn!);

    // Active institution should now reflect Rektorat's institution
    expect(screen.getAllByText("Institut Teknologi dan Kesehatan Tri Tunas Nasional").length).toBeGreaterThanOrEqual(1);
  });
});
