import { describe, it, expect } from "vitest";
import {
    getInstitutionCode,
    hasInstitutionLogo,
    getInstitutionLogo,
    hasInstitutionFavicon,
    getInstitutionFavicon,
} from "./institutionLogo";

describe("institutionLogo helper", () => {
    it("detects institution code from environment", () => {
        const code = getInstitutionCode();
        expect(code).toBe("092010");
    });

    it("verifies existence of logo for 092010", () => {
        expect(hasInstitutionLogo("092010")).toBe(true);
        expect(getInstitutionLogo("092010")).toBe("/img/logo/092010/android-chrome-512x512.png");
    });

    it("verifies default configured code uses existing logo", () => {
        expect(hasInstitutionLogo()).toBe(true);
        expect(getInstitutionLogo()).toBe("/img/logo/092010/android-chrome-512x512.png");
    });

    it("returns false / null for non-existent institution code", () => {
        expect(hasInstitutionLogo("999999")).toBe(false);
        expect(getInstitutionLogo("999999")).toBeNull();
    });

    it("verifies existence of favicon.ico for 092010", () => {
        expect(hasInstitutionFavicon("092010")).toBe(true);
        expect(getInstitutionFavicon("092010")).toBe("/img/logo/092010/favicon.ico");
        expect(getInstitutionFavicon()).toBe("/img/logo/092010/favicon.ico");
    });

    it("falls back to /favicon.ico for non-existent institution favicon", () => {
        expect(hasInstitutionFavicon("999999")).toBe(false);
        expect(getInstitutionFavicon("999999")).toBe("/favicon.ico");
    });
});
