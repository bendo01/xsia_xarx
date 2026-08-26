import { describe, it, expect, beforeEach } from "vitest";
import {
  isKeyExists,
  getStorageItem,
  setStorageItem,
  setSessionStorageItem,
  getSessionStorageItem,
  removeSessionStorageItem,
  removeStorageItem,
} from "./storage";

describe("Storage Utilities (White-Box Unit Tests)", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  describe("setStorageItem & getStorageItem", () => {
    it("stores and retrieves item in localStorage by default", () => {
      setStorageItem("test_key", "test_value");
      expect(localStorage.getItem("test_key")).toBe("test_value");
      expect(getStorageItem("test_key")).toBe("test_value");
    });

    it("stores item in sessionStorage when isSession is true", () => {
      setStorageItem("session_key", "session_value", true);
      expect(sessionStorage.getItem("session_key")).toBe("session_value");
      expect(localStorage.getItem("session_key")).toBeNull();
      expect(getStorageItem("session_key")).toBe("session_value");
    });

    it("prioritizes sessionStorage over localStorage when key exists in both", () => {
      localStorage.setItem("shared_key", "from_local");
      sessionStorage.setItem("shared_key", "from_session");
      expect(getStorageItem("shared_key")).toBe("from_session");
    });

    it("returns null when key does not exist", () => {
      expect(getStorageItem("non_existent_key")).toBeNull();
    });
  });

  describe("isKeyExists", () => {
    it("returns false for nonexistent key", () => {
      expect(isKeyExists("random_key")).toBe(false);
    });

    it("returns true when key is in localStorage", () => {
      localStorage.setItem("local_key", "val");
      expect(isKeyExists("local_key")).toBe(true);
    });

    it("returns true when key is in sessionStorage", () => {
      sessionStorage.setItem("session_key", "val");
      expect(isKeyExists("session_key")).toBe(true);
    });
  });

  describe("session-specific storage helpers", () => {
    it("sets, gets, and removes session storage item", () => {
      setSessionStorageItem("my_session", "secret");
      expect(getSessionStorageItem("my_session")).toBe("secret");

      removeSessionStorageItem("my_session");
      expect(getSessionStorageItem("my_session")).toBeNull();
    });
  });

  describe("removeStorageItem", () => {
    it("removes item from both localStorage and sessionStorage", () => {
      localStorage.setItem("cleanup_key", "1");
      sessionStorage.setItem("cleanup_key", "2");

      removeStorageItem("cleanup_key");

      expect(localStorage.getItem("cleanup_key")).toBeNull();
      expect(sessionStorage.getItem("cleanup_key")).toBeNull();
      expect(isKeyExists("cleanup_key")).toBe(false);
    });
  });
});
