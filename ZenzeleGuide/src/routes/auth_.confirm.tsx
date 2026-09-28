import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import type { EmailOtpType } from "@supabase/supabase-js";
import { Loader2, TriangleAlert } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/site/logo";

// Email links land here instead of on the Supabase domain, e.g.
//   https://zenzeleguide.co.za/auth/confirm?token_hash=...&type=email
// We verify the one-time token with Supabase in the background.

const OTP_TYPES: EmailOtpType[] = [
  "email",
  "signup",
  "magiclink",
  "recovery",
  "invite",
  "email_change",
];

type Search = { token_hash?: string; type?: string; next?: string; redirect_to?: string };

export const Route = createFileRoute("/auth_/confirm")({
  head: () => ({
    meta: [{ title: "Confirming… — Zenzele Guide" }, { name: "robots", content: "noindex" }],
  }),
  validateSearch: (s: Record<string, unknown>): Search => ({
    token_hash: typeof s.token_hash === "string" ? s.token_hash : undefined,
    type: typeof s.type === "string" ? s.type : undefined,
    next: typeof s.next === "string" ? s.next : undefined,
    redirect_to: typeof s.redirect_to === "string" ? s.redirect_to : undefined,
  }),
  component: ConfirmPage,
});

function isSafePath(p: string | null | undefined): p is string {
  return !!p && p.startsWith("/") && !p.startsWith("//");
}

/** Where to go after confirming: ?next=/path, or the ?redirect= inside redirect_to, else /me. */
function destination(search: Search): string {
  if (isSafePath(search.next)) return search.next;
  if (search.redirect_to) {
    try {
      const url = new URL(search.redirect_to, window.location.origin);
      if (url.origin === window.location.origin) {
        const inner = url.searchParams.get("redirect");
        if (isSafePath(inner)) return inner;
        if (isSafePath(url.pathname) && !url.pathname.startsWith("/auth")) return url.pathname;
      }
    } catch {
      // ignore malformed redirect_to
    }
  }
  return "/me";
}

function ConfirmPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return; // one-time tokens: never verify twice (React strict mode)
    started.current = true;

    const type = search.type as EmailOtpType | undefined;
    if (!search.token_hash || !type || !OTP_TYPES.includes(type)) {
      setError("This link is incomplete. Please use the latest email we sent you.");
      return;
    }

    supabase.auth
      .verifyOtp({ token_hash: search.token_hash, type })
      .then(({ error: verifyError }) => {
        if (verifyError) {
          setError(
            /expired|invalid/i.test(verifyError.message)
              ? "This link has expired or was already used. Links work once and expire after a while."
              : verifyError.message,
          );
          return;
        }
        const to = type === "recovery" ? "/auth/update-password" : destination(search);
        navigate({ href: to, replace: true });
      })
      .catch(() => setError("We couldn't confirm this link. Please try again."));
  }, [navigate, search]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 px-4">
      <Link to="/" aria-label="Zenzele Guide home" className="mb-8">
        <Logo />
      </Link>
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-8 text-center">
        {error ? (
          <>
            <TriangleAlert className="mx-auto h-8 w-8 text-accent-foreground" />
            <h1 className="mt-4 text-xl font-semibold">Link didn't work</h1>
            <p className="mt-2 text-sm text-muted-foreground">{error}</p>
            <Link
              to="/auth"
              search={{ redirect: undefined, mode: undefined }}
              className="mt-6 inline-flex h-10 items-center justify-center rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Go to sign in
            </Link>
          </>
        ) : (
          <>
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
            <h1 className="mt-4 text-xl font-semibold">Confirming…</h1>
            <p className="mt-2 text-sm text-muted-foreground">One moment while we sign you in.</p>
          </>
        )}
      </div>
    </div>
  );
}
