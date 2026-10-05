// @refresh reload
import { createHandler, StartServer } from "@solidjs/start/server";
import { getInstitutionLogo } from "~/lib/institutionLogo";

export default createHandler(() => {
  const iconHref = getInstitutionLogo() || "/favicon.ico";

  return (
    <StartServer
      document={({ assets, children, scripts }) => (
        <html lang="en">
          <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <title>SIAKA</title>
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
