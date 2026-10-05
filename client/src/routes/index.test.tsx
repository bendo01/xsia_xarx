import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@solidjs/testing-library";
import { Router, Route } from "@solidjs/router";
import Home from "./index";

describe("Landing Page Home Component", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    document.body.innerHTML = "";
  });

  it("renders Landing Page without throwing uncaught client error", () => {
    render(() => (
      <Router>
        <Route path="/" component={Home} />
      </Router>
    ));

    expect(screen.getAllByText(/Masuk Sesi/i).length).toBeGreaterThan(0);
    expect(screen.getByText("Semua Panduan (4)")).toBeInTheDocument();
    expect(screen.queryByText(/4. Verifikasi/i)).not.toBeInTheDocument();
    expect(screen.getByText(/4. Reset Sandi/i)).toBeInTheDocument();
  });
});
