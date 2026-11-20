import { Title } from '@solidjs/meta';
import { Loading } from 'solid-js';
// Typed client env, validated and baked in at build time (see env.ts).
import { env } from 'virtual:solid-env/client';
import { Toaster } from 'solid-sonner';
import { Router } from './router';
import './App.css';

export default function App() {
  return (
    <Router>
      {(props) => (
        <>
          <Title>{env.VITE_APP_NAME}</Title>
          <Toaster position="top-right" richColors closeButton />
          <Loading fallback={<main class="p-6">…</main>}>{props.children}</Loading>
        </>
      )}
    </Router>
  );
}
