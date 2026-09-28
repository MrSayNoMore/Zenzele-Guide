import { createFileRoute, redirect } from "@tanstack/react-router";

// /admin has no page of its own; the dashboard is the landing page.
export const Route = createFileRoute("/admin/")({
  beforeLoad: () => {
    throw redirect({ to: "/admin/dashboard" });
  },
});
