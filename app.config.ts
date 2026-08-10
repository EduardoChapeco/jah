import { defineConfig } from "@tanstack/start/config";

export default defineConfig({
  server: {
    preset: "cloudflare-pages",
    prerender: {
      routes: [],
      crawlLinks: false,
    },
    experimental: {
      asyncContext: true,
    },
  },
  tsr: {
    // Tanstack Router config if any
  },
  vite: {
    plugins: [
      (function nitroPlugin() {
        return {
          name: "nitro-plugin",
          config(config: any) {
            if (config.build?.ssr) {
              return {
                nitro: {
                  plugins: ["./src/plugins/env-injector.ts"],
                },
              };
            }
          },
        };
      })(),
    ],
    build: {
      rollupOptions: {
        external: ["vinxi/routes"]
      }
    }
  },
});
