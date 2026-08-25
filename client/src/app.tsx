import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { Suspense, onMount } from "solid-js";
import { Toaster } from "./components/toast/Toaster";
import { refreshAuthState } from "./lib/authStore";
import "./app.css";

export default function App() {
  return (
    <Router
      root={props => {
        onMount(() => {
          refreshAuthState();
        });

        return (
          <main class="min-h-screen max-w-screen bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-100">
            <Toaster position="top-left" />
            <Suspense>{props.children}</Suspense>
          </main>
        );
      }}
    >
      <FileRoutes />
    </Router>
  );
}
