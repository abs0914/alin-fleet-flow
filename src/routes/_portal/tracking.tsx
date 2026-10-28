import { createFileRoute, redirect } from "@tanstack/react-router";

// Tracking now lives on the Dashboard; keep the old URL working.
export const Route = createFileRoute("/_portal/tracking")({
  beforeLoad: () => {
    throw redirect({ to: "/", hash: "tracking", statusCode: 301 });
  },
});
