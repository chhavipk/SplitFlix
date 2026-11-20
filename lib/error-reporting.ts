// Client-side error reporting hook. Replace the body with your own analytics or
// monitoring call (Sentry, LogRocket, etc.). It runs only in the browser.
export function reportRuntimeError(
  error: unknown,
  context: Record<string, unknown> = {},
) {
  if (typeof window === "undefined") return;
  console.error("[client-error]", window.location.pathname, error, context);
}
