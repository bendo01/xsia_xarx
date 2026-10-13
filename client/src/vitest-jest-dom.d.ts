// jest-dom's bundled `@testing-library/jest-dom/vitest` typings augment Vitest 4's
// `Assertion<T>`, which no longer merges with Vitest 5's `Assertion<R, T>` (shipped via vite-plus).
// Augment `Matchers<R, T>` instead so `expect(el).toBeInTheDocument()` etc. type-check.
// The matcher types are not exposed through the package's `exports`, hence the relative path.
import type { TestingLibraryMatchers } from "../node_modules/@testing-library/jest-dom/types/matchers";

declare module "vitest" {
  interface Matchers<
    R extends void | Promise<void> = void | Promise<void>,
    T = unknown,
  > extends TestingLibraryMatchers<unknown, R> {}
}
