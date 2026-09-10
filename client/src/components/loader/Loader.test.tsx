import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@solidjs/testing-library";
import { Spinner } from "./Spinner";
import { Loader } from "./Loader";
import { ErrorFallback } from "./ErrorFallback";
import { DataLoader } from "./DataLoader";

describe("Loader Component Suite (White-Box Component Tests)", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  describe("Spinner Component", () => {
    it("renders default spinner with role status and rounded-xs", () => {
      render(() => <Spinner />);
      const spinner = screen.getByRole("status");
      expect(spinner).toBeInTheDocument();
      expect(spinner.className).toContain("rounded-xs");
      expect(spinner.className).toContain("animate-spin");
      expect(spinner.className).toContain("border-indigo-600");
    });

    it("applies custom size and color classes", () => {
      render(() => <Spinner size="lg" color="teal" class="custom-spin" />);
      const spinner = screen.getByRole("status");
      expect(spinner.className).toContain("size-8");
      expect(spinner.className).toContain("border-teal-500");
      expect(spinner.className).toContain("custom-spin");
    });
  });

  describe("Loader Component", () => {
    it("renders block loader with message and subtitle", () => {
      render(() => (
        <Loader
          message="Memuat form penilaian mahasiswa..."
          subtitle="Harap tunggu sebentar"
          color="indigo"
        />
      ));

      expect(screen.getByText("Memuat form penilaian mahasiswa...")).toBeInTheDocument();
      expect(screen.getByText("Harap tunggu sebentar")).toBeInTheDocument();
      const statusEl = screen.getByRole("status");
      expect(statusEl.className).toContain("py-24");
    });

    it("renders inline loader variant", () => {
      render(() => (
        <Loader
          variant="inline"
          message="Menyimpan..."
          color="teal"
        />
      ));

      expect(screen.getByText("Menyimpan...")).toBeInTheDocument();
      const statusEl = screen.getByRole("status");
      expect(statusEl.className).toContain("inline-flex");
    });

    it("renders overlay loader variant", () => {
      render(() => (
        <Loader
          variant="overlay"
          message="Memproses data..."
        />
      ));

      expect(screen.getByText("Memproses data...")).toBeInTheDocument();
      const statusEl = screen.getByRole("status");
      expect(statusEl.className).toContain("absolute inset-0");
    });
  });

  describe("ErrorFallback Component", () => {
    it("renders error card with title, message, and retry button", () => {
      const handleRetry = vi.fn();
      render(() => (
        <ErrorFallback
          title="Terjadi Kendala Memuat Detail Mahasiswa"
          error={new Error("Failed to fetch student data from API")}
          onRetry={handleRetry}
          retryText="Coba Muat Ulang"
          accentColor="teal"
        />
      ));

      expect(screen.getByText("Terjadi Kendala Memuat Detail Mahasiswa")).toBeInTheDocument();
      expect(screen.getByText("Failed to fetch student data from API")).toBeInTheDocument();

      const retryBtn = screen.getByRole("button", { name: /Coba Muat Ulang/i });
      expect(retryBtn).toBeInTheDocument();
      expect(retryBtn.className).toContain("rounded-xs");
      expect(retryBtn.className).toContain("bg-teal-600");

      fireEvent.click(retryBtn);
      expect(handleRetry).toHaveBeenCalledTimes(1);
    });

    it("supports reset prop for ErrorBoundary compatibility", () => {
      const handleReset = vi.fn();
      render(() => (
        <ErrorFallback
          error="String error format"
          reset={handleReset}
        />
      ));

      expect(screen.getByText("String error format")).toBeInTheDocument();
      const retryBtn = screen.getByRole("button", { name: /Coba Muat Ulang/i });
      fireEvent.click(retryBtn);
      expect(handleReset).toHaveBeenCalledTimes(1);
    });

    it("renders banner variant for inline errors", () => {
      render(() => (
        <ErrorFallback
          variant="banner"
          title="Error"
          error="Network timeout"
        />
      ));

      expect(screen.getByText(/Network timeout/)).toBeInTheDocument();
    });
  });

  describe("DataLoader Component", () => {
    it("renders loading state when loading=true", () => {
      render(() => (
        <DataLoader loading={true} loadingMessage="Sedang memuat...">
          <div>Konten Utama</div>
        </DataLoader>
      ));

      expect(screen.getByText("Sedang memuat...")).toBeInTheDocument();
      expect(screen.queryByText("Konten Utama")).toBeNull();
    });

    it("renders error state when error is present", () => {
      render(() => (
        <DataLoader
          loading={false}
          error="Gagal mengambil data"
          errorTitle="Gagal"
        >
          <div>Konten Utama</div>
        </DataLoader>
      ));

      expect(screen.getByText("Gagal")).toBeInTheDocument();
      expect(screen.getByText("Gagal mengambil data")).toBeInTheDocument();
      expect(screen.queryByText("Konten Utama")).toBeNull();
    });

    it("renders children when not loading and no error", () => {
      render(() => (
        <DataLoader loading={false} error={null}>
          <div>Konten Utama Siap</div>
        </DataLoader>
      ));

      expect(screen.getByText("Konten Utama Siap")).toBeInTheDocument();
    });
  });
});
