import { createFileRoute, Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  Building2,
  GraduationCap,
  LayoutDashboard,
  Loader2,
  LogOut,
  Menu,
  Sparkles,
  ShieldAlert,
  Wallet,
  X,
} from "lucide-react";
import { Logo } from "@/components/site/logo";
import { Toaster } from "@/components/ui/sonner";
import { signOut, useAuth, useIsAdmin } from "@/hooks/use-auth";

// The admin panel is a separate space from the learner site: its own layout,
// navigation and look. Learners who reach it are sent back to My Zenzele.
export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [{ title: "Admin — Zenzele Guide" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminLayout,
});

const NAV = [
  { path: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/admin/universities", label: "Universities", icon: Building2 },
  { path: "/admin/courses", label: "Courses", icon: GraduationCap },
  { path: "/admin/bursaries", label: "Bursaries", icon: Wallet },
  { path: "/admin/subjects", label: "NSC subjects", icon: BookOpen },
  { path: "/admin/ai-import", label: "AI import", icon: Sparkles },
] as const;

function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: rolesLoading } = useIsAdmin();

  if (authLoading || rolesLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/40">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 px-4">
        <Link to="/" className="mb-8" aria-label="Zenzele Guide home">
          <Logo />
        </Link>
        <div className="w-full max-w-sm rounded-xl border border-border bg-card p-8 text-center">
          <ShieldAlert className="mx-auto h-8 w-8 text-[var(--brand-umhlaba)]" />
          <h1 className="mt-4 font-sans text-xl font-semibold">Staff area</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {user
              ? "This area is for Zenzele Guide staff. Your account doesn't have admin access."
              : "Sign in with a staff account to manage universities, courses and bursaries."}
          </p>
          {user ? (
            <Link
              to="/me"
              className="mt-6 inline-flex h-10 items-center justify-center rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Go to My Zenzele
            </Link>
          ) : (
            <Link
              to="/auth"
              search={{ redirect: "/admin/dashboard", mode: undefined }}
              className="mt-6 inline-flex h-10 items-center justify-center rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Staff sign in
            </Link>
          )}
        </div>
      </div>
    );
  }

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/" });
  };

  const name = (user.user_metadata?.first_name as string | undefined) ?? user.email?.split("@")[0];

  return (
    <div className="min-h-screen bg-muted/40">
      {/* Mobile top bar */}
      <div className="sticky top-0 z-40 flex items-center justify-between bg-[var(--brand-umhlaba)] px-4 py-3 text-white lg:hidden">
        <span className="flex items-center gap-2">
          <Logo onDark />
          <span className="rounded bg-white/15 px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider">
            Admin
          </span>
        </span>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="rounded-md p-2 hover:bg-white/10"
          aria-label={sidebarOpen ? "Close menu" : "Open menu"}
        >
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <div className="flex">
        <aside
          className={`${sidebarOpen ? "translate-x-0" : "-translate-x-full"} fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-[var(--brand-umhlaba)] text-white transition-transform duration-200 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0`}
        >
          <div className="hidden border-b border-white/10 px-5 py-5 lg:block">
            <Logo onDark />
            <span className="mt-2 inline-block rounded bg-white/15 px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider">
              Admin panel
            </span>
          </div>

          <nav className="flex-1 space-y-1 p-3">
            {NAV.map((item) => {
              const active = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition ${
                    active
                      ? "bg-white text-[var(--brand-umhlaba)]"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="space-y-1 border-t border-white/10 p-3">
            <Link
              to="/"
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-white/80 hover:bg-white/10 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" /> Back to the site
            </Link>
            <div className="flex items-center gap-3 px-3 py-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground">
                {(name ?? "A")[0].toUpperCase()}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{name}</span>
                <span className="block truncate text-xs text-white/60">{user.email}</span>
              </span>
            </div>
            <button
              onClick={handleSignOut}
              className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-white/80 hover:bg-white/10 hover:text-white"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>
        </aside>

        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <main className="min-h-screen min-w-0 flex-1">
          <div className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">
            <Outlet />
          </div>
        </main>
        <Toaster position="top-center" />
      </div>
    </div>
  );
}
