import { createRouter, useRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

function DefaultErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  const isOffline = typeof window !== "undefined" && !navigator.onLine;

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "var(--background, #121212)",
      color: "var(--foreground, #fff)",
      fontFamily: "system-ui, -apple-system, sans-serif",
      padding: "1rem",
    }}>
      <div style={{
        maxWidth: "400px",
        width: "100%",
        textAlign: "center",
        backgroundColor: "var(--card, #1e1e1e)",
        border: "1px solid var(--border, #2d2d2d)",
        borderRadius: "12px",
        padding: "2rem",
        boxShadow: "0 10px 30px rgba(0, 0, 0, 0.2)",
      }}>
        <div style={{
          backgroundColor: isOffline ? "rgba(239, 68, 68, 0.1)" : "rgba(245, 158, 11, 0.1)",
          color: isOffline ? "rgb(239, 68, 68)" : "rgb(245, 158, 11)",
          borderRadius: "50%",
          width: "64px",
          height: "64px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 1.5rem",
        }}>
          {isOffline ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="1" y1="1" x2="23" y2="23"></line>
              <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.5"></path>
              <path d="M5 12.5a10.94 10.94 0 0 1 5.83-2.84"></path>
              <path d="M7.34 18a16.5 16.5 0 0 1 9.32 0"></path>
              <path d="M1 7.5a16.53 16.53 0 0 1 5.82-1.92"></path>
              <path d="M17.18 5.58A16.54 16.54 0 0 1 23 7.5"></path>
              <line x1="12" y1="12.01" x2="12.01" y2="12"></line>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
          )}
        </div>

        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, margin: "0 0 0.5rem" }}>
          {isOffline ? "Connection Failure" : "Something went wrong"}
        </h1>
        <p style={{ color: "var(--muted-foreground, #a3a3a3)", fontSize: "0.95rem", lineHeight: 1.5, margin: "0 0 1.5rem" }}>
          {isOffline
            ? "We couldn't reach the server. Please check your internet connection and try again."
            : "An unexpected error occurred while loading this page."}
        </p>

        {import.meta.env.DEV && error.message && (
          <pre style={{
            margin: "0 0 1.5rem",
            padding: "0.75rem",
            backgroundColor: "rgba(0, 0, 0, 0.2)",
            borderRadius: "6px",
            fontSize: "0.8rem",
            fontFamily: "monospace",
            color: "rgb(239, 68, 68)",
            overflowX: "auto",
            textAlign: "left",
            maxHeight: "150px",
          }}>
            {error.message}
          </pre>
        )}

        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            style={{
              padding: "0.55rem 1.1rem",
              borderRadius: "8px",
              border: "none",
              backgroundColor: "var(--primary, #3b82f6)",
              color: "#fff",
              fontWeight: 600,
              cursor: "pointer",
              fontSize: "0.9rem",
            }}
          >
            Retry
          </button>
          <a
            href="/"
            style={{
              padding: "0.55rem 1.1rem",
              borderRadius: "8px",
              border: "1px solid var(--border, #2d2d2d)",
              backgroundColor: "transparent",
              color: "var(--foreground, #fff)",
              fontWeight: 600,
              cursor: "pointer",
              fontSize: "0.9rem",
              textDecoration: "none",
            }}
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const getRouter = () => {
  const router = createRouter({
    routeTree,
    context: {},
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    defaultErrorComponent: DefaultErrorComponent,
  });

  return router;
};
