import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { apiClient } from "@/lib/api-client";

interface AuthCtx {
  user: { id: string; email: string; displayName?: string; isEmailVerified?: boolean } | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  verifyOtp: (email: string, otp: string) => Promise<void>;
  resendOtp: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | undefined>(undefined);

let currentToken: string | null = null;

if (typeof window !== "undefined" && !(window as unknown as { __authedFetchInstalled?: boolean }).__authedFetchInstalled) {
  (window as unknown as { __authedFetchInstalled?: boolean }).__authedFetchInstalled = true;
  const originalFetch = window.fetch.bind(window);
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
        ? input.toString()
        : input.url;
    if (currentToken && url.includes("/_serverFn/")) {
      const headers = new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined));
      if (!headers.has("authorization")) {
        headers.set("Authorization", `Bearer ${currentToken}`);
      }
      return originalFetch(input, { ...(init ?? {}), headers });
    }
    return originalFetch(input, init);
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthCtx["user"]>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const localUser = apiClient.getCurrentUser();
    const token = localStorage.getItem("accessToken");
    setUser(localUser);
    currentToken = token;
    setLoading(false);
  }, []);

  const signIn = async (email: string, password: string) => {
    const response = await apiClient.signin(email, password);
    if (!response.success || !response.data?.user) {
      throw new Error(response.message || "Sign in failed");
    }
    setUser(response.data.user);
    currentToken = localStorage.getItem("accessToken");
  };

  const signUp = async (email: string, password: string, displayName: string) => {
    const response = await apiClient.signup(email, password, displayName);
    if (!response.success) {
      throw new Error(response.message || "Sign up failed");
    }
  };

  const verifyOtp = async (email: string, otp: string) => {
    const response = await apiClient.verifyOTP(email, otp);
    if (!response.success || !response.data?.user) {
      throw new Error(response.message || "OTP verification failed");
    }
    setUser(response.data.user);
    currentToken = localStorage.getItem("accessToken");
  };

  const resendOtp = async (email: string) => {
    const response = await apiClient.resendOTP(email);
    if (!response.success) {
      throw new Error(response.message || "Failed to resend OTP");
    }
  };

  const signOut = async () => {
    await apiClient.signout();
    setUser(null);
    currentToken = null;
  };

  return <Ctx.Provider value={{ user, loading, signIn, signUp, verifyOtp, resendOtp, signOut }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth outside AuthProvider");
  return v;
}

// Helper to authenticate fetch calls to server routes
export async function authedFetch(input: string, init: RequestInit = {}) {
  const token = localStorage.getItem("accessToken");
  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return fetch(input, { ...init, headers });
}
