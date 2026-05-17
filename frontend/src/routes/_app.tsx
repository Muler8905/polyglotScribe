import { createFileRoute, Outlet, redirect, useRouter } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { apiClient } from "@/lib/api-client";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/_app")({
  beforeLoad: async () => {
    if (typeof window !== "undefined") {
      if (!apiClient.isAuthenticated()) throw redirect({ to: "/auth" });
    }
  },
  component: AppLayout,
});

function OfflineBanner() {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "var(--background, #121212)",
      color: "var(--foreground, #fff)",
      fontFamily: "system-ui, -apple-system, sans-serif",
      padding: "2rem",
      textAlign: "center",
    }}>
      <div style={{
        backgroundColor: "rgba(239, 68, 68, 0.1)",
        borderRadius: "50%",
        padding: "1rem",
        marginBottom: "1.5rem",
        display: "inline-flex",
        color: "rgb(239, 68, 68)",
      }}>
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="1" y1="1" x2="23" y2="23"></line>
          <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.5"></path>
          <path d="M5 12.5a10.94 10.94 0 0 1 5.83-2.84"></path>
          <path d="M7.34 18a16.5 16.5 0 0 1 9.32 0"></path>
          <path d="M1 7.5a16.53 16.53 0 0 1 5.82-1.92"></path>
          <path d="M17.18 5.58A16.54 16.54 0 0 1 23 7.5"></path>
          <line x1="12" y1="12.01" x2="12.01" y2="12"></line>
        </svg>
      </div>
      <h2 style={{ fontSize: "1.5rem", fontWeight: 700, margin: "0 0 0.5rem" }}>No Internet Connection</h2>
      <p style={{ color: "var(--muted-foreground, #a3a3a3)", maxWidth: "320px", fontSize: "0.95rem", lineHeight: 1.5, margin: "0 0 1.5rem" }}>
        Please check your internet connection and try again.
      </p>
      <button 
        onClick={() => window.location.reload()}
        style={{
          padding: "0.6rem 1.2rem",
          borderRadius: "8px",
          border: "none",
          backgroundColor: "var(--primary, #3b82f6)",
          color: "#fff",
          fontWeight: 600,
          cursor: "pointer",
          transition: "background 0.2s",
        }}
      >
        Retry
      </button>
    </div>
  );
}

function AppLayout() {
  const { loading, user } = useAuth();
  const router = useRouter();
  const [online, setOnline] = useState(() => typeof window !== "undefined" ? navigator.onLine : true);

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => {
      setOnline(false);
      router.invalidate();
    };
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [router]);

  if (loading) return null;
  if (!user) return null;

  if (!online) {
    return <OfflineBanner />;
  }

  return <Outlet />;
}
