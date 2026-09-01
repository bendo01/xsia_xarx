import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@solidjs/testing-library";
import { Toaster, toast } from "./Toaster";

describe("Toaster Component & Toast Engine (White-Box Component Tests)", () => {
  beforeEach(() => {
    toast.clear();
    document.body.innerHTML = "";
  });

  it("renders toast messages when triggered via toast helpers", async () => {
    render(() => <Toaster position="top-right" />);

    toast.success("Profile saved successfully!");

    const toastElement = await screen.findByText("Profile saved successfully!");
    expect(toastElement).toBeInTheDocument();
  });

  it("renders different toast variants (danger, warning, info)", async () => {
    render(() => <Toaster position="top-center" />);

    toast.danger("An error occurred");
    toast.warning("Warning: session expiring");
    toast.info("New update available");

    expect(await screen.findByText("An error occurred")).toBeInTheDocument();
    expect(await screen.findByText("Warning: session expiring")).toBeInTheDocument();
    expect(await screen.findByText("New update available")).toBeInTheDocument();
  });

  it("generates unique string identifiers on toast.add", () => {
    const id1 = toast.add({ type: "info", message: "Toast 1", duration: 0 });
    const id2 = toast.add({ type: "success", message: "Toast 2", duration: 0 });

    expect(typeof id1).toBe("string");
    expect(typeof id2).toBe("string");
    expect(id1).not.toBe(id2);
  });
});
