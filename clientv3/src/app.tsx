import { Suspense, type Component } from 'solid-js';
import { A, useLocation } from '@solidjs/router';

const App: Component<{ children: Element }> = (props) => {
  const location = useLocation();

  return (
    <>
      <main class="min-h-screen max-w-screen bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-100">
        <Suspense>{props.children}</Suspense>
      </main>
    </>
  );
};

export default App;
