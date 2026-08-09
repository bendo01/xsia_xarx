import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { Suspense } from "solid-js";
import { Toaster } from "./components/toast/Toaster";
import "./app.css";

export default function App() {
  return (
    <Router
      root={props => (
        <main class="min-h-screen max-w-screen bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-100">
          <Toaster position="top-left" />
          <Suspense>{props.children}</Suspense>
        </main>
      )}
    >
      <FileRoutes />
    </Router>
  );
}
