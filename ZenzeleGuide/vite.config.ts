import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";

// Standard TanStack Start + Nitro (Cloudflare Workers) build config.
// Nitro runs at build time only and targets the `cloudflare-module` preset so
// `npm run build` produces a deployable Cloudflare Worker.
export default defineConfig(async ({ command }) => {
  const plugins = [
    tailwindcss(),
    tsConfigPaths({ projects: ["./tsconfig.json"] }),
    tanstackStart({
      importProtection: {
        behavior: "error",
        // *.server.ts files hold secrets and service-role code: the build fails if
        // browser code imports one. (Don't use the "server-only" package: without
        // the react-server condition it throws at runtime on the server too.)
        client: { files: ["**/server/**", "**/*.server.ts"], specifiers: ["server-only"] },
      },
      // Route TanStack Start's server entry to src/server.ts (our SSR error wrapper).
      server: { entry: "server" },
    }),
  ];

  if (command === "build") {
    const { nitro } = await import("nitro/vite");
    plugins.push(
      nitro({
        defaultPreset: "cloudflare-module",
        // Keep the text variables set in the Cloudflare dashboard (e.g.
        // SUPABASE_URL). Without this, every `wrangler deploy` removes them
        // because the generated wrangler.json lists no vars. Secrets are kept
        // either way.
        cloudflare: { wrangler: { name: "zenzele-guide", keep_vars: true } },
      }),
    );
  }

  plugins.push(viteReact());

  return {
    plugins,
    resolve: {
      alias: { "@": `${process.cwd()}/src` },
      // Keep a single copy of React / TanStack Query to avoid hook + cache bugs.
      dedupe: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
        "@tanstack/react-query",
        "@tanstack/query-core",
      ],
    },
  };
});
