// @refresh reload
import { createHandler, StartServer } from "@solidjs/start/server";
import { getInstitutionFavicon } from "~/lib/institutionLogo";

export default createHandler(() => {
  const iconHref = getInstitutionFavicon();

  return (
    <StartServer
      document={({ assets, children, scripts }) => (
        <html lang="en">
          <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <title>{import.meta.env.VITE_APP_NAME ?? 'XSIA XARX'}</title>
            <link rel="icon" href={iconHref} />
          <script>
            {`
              if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                document.documentElement.classList.add('dark');
              } else {
                document.documentElement.classList.remove('dark');
              }
            `}
          </script>
          {assets}
        </head>
        <body>
          <div id="app">{children}</div>
          {scripts}
        </body>
      </html>
      )}
    />
  );
});
