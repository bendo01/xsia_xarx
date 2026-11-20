import * as v from 'valibot';

// The typed env schema (probed by the plugin from the project root): plain
// objects of Standard Schema validators — valibot here, but zod, arktype, or
// any compliant library works, even mixed per key.
//
// `server` vars come through `virtual:solid-env/server` (server modules only;
// importing it from client code fails the build) and are read from
// process.env at BOOT, validated then: secrets rotate without a rebuild and
// never appear in build artifacts. `client` vars must carry the public
// VITE_ prefix and come through `virtual:solid-env/client` as validated values
// baked into the bundle. Generated types land in solid-env.d.ts.
export default {
  server: {
    // Comma-separated, newest first — see src/server/session.ts for the
    // rotation story. Generate one: `openssl rand -base64 32`.
    SESSION_SECRET: v.pipe(v.string(), v.minLength(32)),
    // Base URL of the Rust API. Only the web_app server talks to it: the
    // browser calls server functions, never this URL, and the API token
    // never leaves the signed session cookie.
    API_SERVER_URL: v.optional(
      v.pipe(v.string(), v.url()),
      'http://127.0.0.1:5800/api/v1',
    ),
  },
  client: {
    VITE_APP_NAME: v.optional(v.pipe(v.string(), v.minLength(1)), 'SIAKA'),
    VITE_INSTITUTION_CODE: v.optional(v.string(), ''),
    VITE_CURRENT_INSTITUTION_ID: v.optional(v.string(), ''),
  },
};
