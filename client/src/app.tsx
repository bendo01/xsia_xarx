import { Router, useLocation } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { Suspense, createEffect, onMount } from "solid-js";
import { Toaster } from "./components/toast/Toaster";
import { refreshAuthState } from "./lib/authStore";
import { syncLocaleFromClient } from "./i18n";
import RouteGuard from "./components/auth/RouteGuard";
import { titleFromPath } from "./lib/pageTitle";
import "./app.css";

/** Keeps the browser tab title in step with the route; a page may still set its own title afterwards */
function TabTitle() {
  const location = useLocation();
  createEffect(() => {
    document.title = titleFromPath(location.pathname);
  });
  return null;
}

export default function App() {
  return (
    <Router
      root={props => {
        onMount(() => {
          syncLocaleFromClient();
          refreshAuthState();
        });

        return (
          <main class="min-h-screen max-w-screen bg-background text-foreground antialiased">
            <TabTitle />
            <Toaster position="top-left" />
            <RouteGuard>
              <Suspense>{props.children}</Suspense>
            </RouteGuard>
          </main>
        );
      }}
    >
      <FileRoutes />
    </Router>
  );
}
