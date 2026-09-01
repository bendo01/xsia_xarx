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
});
