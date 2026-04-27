import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Shell } from "@/components/Shell";
import { Transcriber } from "@/components/Transcriber";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Polyglot Scribe" }] }),
  component: Dashboard,
});

function Dashboard() {
  const [refreshKey, setRefreshKey] = useState(0);
  return (
    <Shell refreshKey={refreshKey}>
      <Transcriber onSaved={() => setRefreshKey((k) => k + 1)} />
    </Shell>
  );
}
