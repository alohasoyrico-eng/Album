export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Next.js 15.3.2 bug: DevOverlay component is SSR'd with a `localStorage`
    // stub that has no methods, causing `localStorage.getItem is not a function`.
    // Polyfill it with a no-op implementation so the dev overlay renders safely.
    if (
      typeof localStorage !== "undefined" &&
      typeof (localStorage as Storage).getItem !== "function"
    ) {
      const noop = () => null;
      Object.defineProperty(globalThis, "localStorage", {
        value: {
          getItem: noop,
          setItem: () => {},
          removeItem: () => {},
          clear: () => {},
          key: noop,
          length: 0,
        },
        writable: true,
        configurable: true,
      });
    }
  }
}
