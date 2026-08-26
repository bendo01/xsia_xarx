import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@solidjs/testing-library";
import { Router, Route } from "@solidjs/router";
import TopBar from "./TopBar";
import { logout, refreshAuthState } from "../../lib/authStore";
import { setStorageItem } from "../../lib/storage";

describe("TopBar Navigation Component (White-Box Component Tests)", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    logout();
    document.body.innerHTML = "";
  });

  it("renders branding and portal title for unauthenticated guest", () => {
    render(() => (
      <Router>
        <Route path="/" component={TopBar} />
      </Router>
    ));

    expect(screen.getByText("XSIA XARX")).toBeInTheDocument();
    expect(screen.getByText("Enterprise Portal")).toBeInTheDocument();
    expect(screen.getByText("Sign In (JWT)")).toBeInTheDocument();
  });

  it("renders active role badge and user name when authenticated", () => {
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
