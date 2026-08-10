export default function (nitroApp: any) {
  nitroApp.hooks.hook("request", (event: any) => {
    if (typeof globalThis !== "undefined") {
      const env = event.context?.cloudflare?.env;
      if (env) {
        (globalThis as any).__env__ = env;
      }
    }
  });
}
