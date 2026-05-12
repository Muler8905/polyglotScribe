import { createMiddleware } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";

const API_URL = process.env.API_URL || process.env.VITE_API_URL || "http://localhost:5000/api";

export const requireApiAuth = createMiddleware({ type: "function" }).server(async ({ next }) => {
  const request = getRequest();
  if (!request?.headers) throw new Response("Unauthorized", { status: 401 });
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Response("Unauthorized: missing token", { status: 401 });
  }
  const token = authHeader.slice(7);
  const meRes = await fetch(`${API_URL}/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  if (!meRes.ok) throw new Response("Unauthorized: invalid token", { status: 401 });
  const meJson = await meRes.json();
  return next({
    context: {
      token,
      userId: meJson?.data?.user?.id,
      user: meJson?.data?.user,
    },
  });
});
