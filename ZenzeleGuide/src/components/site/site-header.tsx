import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { Menu, UserRound } from "lucide-react";
import { Logo } from "@/components/site/logo";
import { signOut, useAuth } from "@/hooks/use-auth";

export function SiteHeader() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const signInHref = `/auth?redirect=${encodeURIComponent(location.pathname)}`;

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/" });
  };

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
        <Link to="/" aria-label="Zenzele Guide — home">
          <Logo />
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm">
          <a href="/#journeys" className="text-muted-foreground hover:text-foreground transition">Journeys</a>
          <a href="/universities" className="text-muted-foreground hover:text-foreground transition">Universities</a>
          <a href="/tvet-colleges" className="text-muted-foreground hover:text-foreground transition">TVETs</a>
          <a href="/bursaries" className="text-muted-foreground hover:text-foreground transition">Bursaries</a>
          <a href="/careers" className="text-muted-foreground hover:text-foreground transition">Careers</a>
        </nav>
        <div className="flex items-center gap-2">
          {!loading && user ? (
            <>
              <Link to="/me" className="hidden md:inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted transition">My Zenzele</Link>
              <button onClick={handleSignOut} className="hidden md:inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition">Sign out</button>
            </>
          ) : (
            <a href={signInHref} className="hidden md:inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted transition">Sign in</a>
          )}
          <a href="#journeys" className="inline-flex items-center rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition">Start</a>
          <a
            href={user ? "/me" : signInHref}
            className="md:hidden p-2 text-muted-foreground hover:text-foreground"
            aria-label={user ? "My Zenzele" : "Sign in"}
          >
            <UserRound className={user ? "h-5 w-5 text-primary" : "h-5 w-5"} />
          </a>
          <button className="md:hidden p-2 text-muted-foreground" aria-label="Menu"><Menu className="h-5 w-5" /></button>
        </div>
      </div>
    </header>
  );
}
