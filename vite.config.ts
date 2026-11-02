import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { nitro } from "nitro/vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");
  const define = Object.fromEntries(
    Object.entries(env).map(([key, value]) => [`import.meta.env.${key}`, JSON.stringify(value)]),
  );

  return {
    define,
    css: { transformer: "lightningcss" },
    resolve: {
      alias: { "@": `${process.cwd()}/src` },
      dedupe: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
        "@tanstack/react-query",
        "@tanstack/query-core",
      ],
    },
    optimizeDeps: {
      include: ["react", "react-dom", "react-dom/client", "react/jsx-runtime", "react/jsx-dev-runtime"],
      ignoreOutdatedRequests: true,
    },
    plugins: [
      tailwindcss(),
      tsconfigPaths({ projects: ["./tsconfig.json"] }),
      tanstackStart({
        server: { entry: "server" },
        importProtection: {
          behavior: "error",
          client: { files: ["**/server/**"], specifiers: ["server-only"] },
        },
      }),
      nitro({
        preset: "vercel",
        noExternals: true,
        routeRules: {
          // Public pages are CDN-cached so browsing traffic never touches the
          // server functions during registration bursts.
          "/": { headers: { "cache-control": "public, s-maxage=60, stale-while-revalidate=300" } },
          "/members": { headers: { "cache-control": "public, s-maxage=60, stale-while-revalidate=300" } },
          "/members/**": { headers: { "cache-control": "public, s-maxage=60, stale-while-revalidate=300" } },
          "/projects": { headers: { "cache-control": "public, s-maxage=60, stale-while-revalidate=300" } },
          "/announcements": { headers: { "cache-control": "public, s-maxage=60, stale-while-revalidate=300" } },
          "/events": { headers: { "cache-control": "public, s-maxage=60, stale-while-revalidate=300" } },
          "/events/**": { headers: { "cache-control": "public, s-maxage=30, stale-while-revalidate=120" } },
          "/join": { headers: { "cache-control": "no-store" } },
          "/auth/**": { headers: { "cache-control": "no-store" } },
          "/me/**": { headers: { "cache-control": "no-store" } },
          "/admin": { headers: { "cache-control": "no-store" } },
          "/api/**": { headers: { "cache-control": "no-store" } },
        },
      }),
      react(),
    ],
  };
});
