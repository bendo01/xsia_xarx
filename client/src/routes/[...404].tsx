import { useLocation } from "@solidjs/router";
import { createSignal } from "solid-js";
import TopBar from "../components/navigation/TopBar";

export default function NotFound() {
  const location = useLocation();
  const [copied, setCopied] = createSignal(false);

  const handleCopyPath = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const quickLinks = [
    {
      title: "Home Page",
      description: "Return to the main overview and portal landing page.",
      href: "/",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      ),
      badge: "Primary",
    },
    {
      title: "User Dashboard",
      description: "Inspect analytics, system stats, charts, and spatial maps.",
      href: "/dashboard/user",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect width="7" height="9" x="3" y="3" rx="1" />
          <rect width="7" height="5" x="14" y="3" rx="1" />
          <rect width="7" height="9" x="14" y="12" rx="1" />
          <rect width="7" height="5" x="3" y="16" rx="1" />
        </svg>
      ),
      badge: "Overview",
    },
    {
      title: "Person Reference Catalog",
      description: "Browse master reference catalogs, demographics, and classifications.",
      href: "/administrator/person/reference/age-classification",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
      badge: "13 Modules",
    },
    {
      title: "Sign In / Authentication",
      description: "Access authentication portals, credentials, and secured areas.",
      href: "/authentification/login",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
          <polyline points="10 17 15 12 10 7" />
          <line x1="15" x2="3" y1="12" y2="12" />
        </svg>
      ),
      badge: "Security",
    },
  ];

  return (
    <div class="min-h-screen flex flex-col bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 selection:bg-neutral-800 selection:text-white dark:selection:bg-white dark:selection:text-neutral-900">
      <TopBar />

      <main class="flex-1 flex flex-col items-center justify-center relative overflow-hidden px-4 py-12 sm:py-16">
        {/* Ambient background decoration */}
        <div class="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
          <div class="absolute -top-40 -left-40 size-96 rounded-full bg-gradient-to-br from-blue-500/10 to-indigo-500/0 dark:from-blue-500/15 blur-3xl" />
          <div class="absolute -bottom-40 -right-40 size-96 rounded-full bg-gradient-to-tl from-amber-500/10 to-purple-500/0 dark:from-amber-500/15 blur-3xl" />
          <div class="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#262626_1px,transparent_1px)] [background-size:16px_16px] opacity-60" />
        </div>

        <div class="relative z-1 max-w-3xl w-full mx-auto text-center">
          {/* Status Badge */}
          <div class="inline-flex items-center gap-2 px-3 py-1 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs font-semibold text-neutral-700 dark:text-neutral-300 tracking-wide uppercase shadow-2xs mb-6">
            <span class="relative flex size-2">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span class="relative inline-flex rounded-full size-2 bg-red-500" />
            </span>
            <span>Error 404 • Page Not Found</span>
          </div>

          {/* Hero 404 Graphic */}
          <div class="relative flex items-center justify-center my-2">
            <h1 class="text-8xl sm:text-9xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-neutral-900 via-neutral-700 to-neutral-400 dark:from-white dark:via-neutral-200 dark:to-neutral-600 select-none">
              404
            </h1>
            <div class="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10 dark:opacity-20">
              <svg class="size-48 sm:size-64 text-neutral-900 dark:text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                <circle cx="12" cy="12" r="10" />
                <path d="m4.93 4.93 4.24 4.24" />
                <path d="m14.83 9.17 4.24-4.24" />
                <path d="m14.83 14.83 4.24 4.24" />
                <path d="m9.17 14.83-4.24 4.24" />
                <circle cx="12" cy="12" r="4" />
              </svg>
            </div>
          </div>

          {/* Title & Description */}
          <h2 class="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white mt-2">
            Lost in the Digital Void
          </h2>
          <p class="mt-3 text-sm sm:text-base text-neutral-600 dark:text-neutral-400 max-w-lg mx-auto leading-relaxed">
            The page you are looking for might have been removed, had its name changed, or is temporarily unreachable.
          </p>

          {/* Requested Path Badge with Copy */}
          <div class="mt-5 inline-flex items-center gap-2 p-1.5 px-3 bg-white dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 shadow-2xs max-w-full">
            <span class="text-xs font-medium text-neutral-500 dark:text-neutral-400 shrink-0">
              Target:
            </span>
            <code class="text-xs font-mono text-neutral-800 dark:text-neutral-200 truncate max-w-xs sm:max-w-md">
              {location.pathname}
            </code>
            <button
              type="button"
              onClick={handleCopyPath}
              class="size-6 inline-flex justify-center items-center text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors cursor-pointer"
              title={copied() ? "Copied to clipboard!" : "Copy URL"}
              aria-label="Copy current URL"
            >
              {copied() ? (
                <svg xmlns="http://www.w3.org/2000/svg" class="size-3.5 text-green-600 dark:text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" class="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                  <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                </svg>
              )}
            </button>
          </div>

          {/* Action Buttons */}
          <div class="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a
              href="/"
              class="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100 shadow-xs hover:shadow-md transition-all cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              Back to Home
            </a>

            <button
              type="button"
              onClick={() => window.history.back()}
              class="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-neutral-700 bg-white hover:bg-neutral-50 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 shadow-2xs hover:shadow-xs transition-all cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="m12 19-7-7 7-7" />
                <path d="M19 12H5" />
              </svg>
              Go Back
            </button>

            <a
              href="/person/reference/age-classification"
              class="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-yellow-50 hover:text-yellow-600 hover:border-yellow-500 dark:text-blue-400 dark:bg-blue-950/50 dark:hover:text-yellow-400 dark:hover:border-yellow-500 border border-blue-200 dark:border-blue-800 shadow-2xs transition-all cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
                <path d="M6 6h10" />
                <path d="M6 10h10" />
              </svg>
              Reference Master
            </a>
          </div>

          {/* Quick Links Section */}
          <div class="mt-12 text-left">
            <div class="flex items-center justify-between mb-4 border-b border-neutral-200 dark:border-neutral-700 pb-2">
              <h3 class="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                Popular Destinations
              </h3>
              <span class="text-xs text-neutral-400 dark:text-neutral-500">
                Quick Navigation
              </span>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {quickLinks.map((link) => (
                <a
                  href={link.href}
                  class="group flex items-start gap-3 p-3.5 bg-white dark:bg-neutral-800/90 border border-neutral-200 dark:border-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-500 hover:shadow-sm transition-all"
                >
                  <div class="size-9 shrink-0 flex items-center justify-center bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200 group-hover:bg-neutral-900 group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-neutral-900 transition-colors">
                    {link.icon}
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center justify-between gap-2">
                      <div class="text-sm font-semibold text-neutral-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {link.title}
                      </div>
                      <span class="text-[10px] font-medium px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-700/80 text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-600">
                        {link.badge}
                      </span>
                    </div>
                    <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-1 leading-snug line-clamp-2">
                      {link.description}
                    </p>
                  </div>
                  <div class="shrink-0 text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-white group-hover:translate-x-0.5 transition-all self-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="m9 18 6-6-6-6" />
                    </svg>
                  </div>
                </a>
              ))}
            </div>
          </div>

          {/* Assistance & System Info Footer */}
          <div class="mt-10 pt-6 border-t border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-500 dark:text-neutral-400">
            <div class="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" class="size-4 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4" />
                <path d="M12 8h.01" />
              </svg>
              <span>Need help? Check the sidebar menu in the top right corner.</span>
            </div>
            <div class="font-mono text-[11px] text-neutral-400 dark:text-neutral-500">
              ERR_CODE: 404_PAGE_NOT_FOUND
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
