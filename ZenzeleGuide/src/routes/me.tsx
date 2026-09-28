import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  BookOpen,
  Bookmark,
  ExternalLink,
  GraduationCap,
  Loader2,
  Pencil,
  ShieldCheck,
  Trash2,
  Wallet,
} from "lucide-react";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { signOut, useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { CAREER_STAGES, careerStageLabel } from "@/lib/career";
import {
  deleteMyResult,
  listMyResults,
  listMySavedItems,
  toggleSavedItem,
} from "@/lib/journey.functions";

export const Route = createFileRoute("/me")({
  head: () => ({
    meta: [{ title: "My Zenzele — Zenzele Guide" }, { name: "robots", content: "noindex" }],
  }),
  component: MyZenzele,
});

const JOURNEYS: Record<string, { label: string; Icon: typeof GraduationCap; to: string }> = {
  grade_12: { label: "University matches", Icon: GraduationCap, to: "/journey/grade-12" },
  nsfas: { label: "NSFAS check", Icon: ShieldCheck, to: "/journey/nsfas" },
  bursary: { label: "Bursary matches", Icon: Wallet, to: "/journey/bursary" },
  tvet: { label: "TVET matches", Icon: BookOpen, to: "/journey/tvet" },
};

const KIND_LABEL: Record<string, string> = {
  course: "Courses",
  bursary: "Bursaries",
  tvet_program: "TVET programmes",
};

function MyZenzele() {
  const { user, loading } = useAuth();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 sm:px-6 md:py-14">
        {loading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : user ? (
          <Account email={user.email ?? ""} />
        ) : (
          <SignedOut />
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

function SignedOut() {
  return (
    <div className="mx-auto max-w-md rounded-xl border border-border bg-card p-8 text-center">
      <Bookmark className="mx-auto h-8 w-8 text-primary" />
      <h1 className="mt-4 text-2xl font-semibold">Keep everything in one place</h1>
      <p className="mt-3 text-muted-foreground">
        Sign in to see your saved results and your shortlist of courses, bursaries, and TVET
        programmes. Everything you did on this device before signing in comes with you.
      </p>
      <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
        <Link
          to="/auth"
          search={{ redirect: "/me", mode: "signup" }}
          className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          Create a free account
        </Link>
        <Link
          to="/auth"
          search={{ redirect: "/me", mode: undefined }}
          className="inline-flex h-11 items-center justify-center rounded-md border border-border px-5 text-sm font-semibold hover:bg-muted"
        >
          Sign in
        </Link>
      </div>
    </div>
  );
}

function Account({ email }: { email: string }) {
  const queryClient = useQueryClient();

  const results = useQuery({ queryKey: ["my-results"], queryFn: () => listMyResults() });
  const saved = useQuery({ queryKey: ["my-saved"], queryFn: () => listMySavedItems() });

  const removeResult = useMutation({
    mutationFn: (resultId: string) => deleteMyResult({ data: { resultId } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["my-results"] }),
  });
  const unsave = useMutation({
    mutationFn: (item: { kind: "course" | "bursary" | "tvet_program"; refId: string }) =>
      toggleSavedItem({ data: item }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-saved"] });
      queryClient.invalidateQueries({ queryKey: ["my-saved-ids"] });
    },
  });

  const groups = (saved.data ?? []).reduce<Record<string, NonNullable<typeof saved.data>>>(
    (acc, item) => {
      (acc[item.kind] ??= []).push(item);
      return acc;
    },
    {},
  );

  return (
    <>
      <div className="flex flex-col gap-4 border-b border-border pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">
            Your account
          </p>
          <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">My Zenzele</h1>
          <p className="mt-2 text-sm text-muted-foreground">Signed in as {email}</p>
        </div>
        <button
          onClick={() => signOut().then(() => (window.location.href = "/"))}
          className="self-start rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted sm:self-auto"
        >
          Sign out
        </button>
      </div>

      <ProfileCard />

      {/* Results */}
      <section className="mt-10">
        <h2 className="font-sans text-lg font-semibold text-foreground">Saved results</h2>
        {results.isLoading ? (
          <Loader2 className="mt-6 h-5 w-5 animate-spin text-primary" />
        ) : results.error ? (
          <p className="mt-4 text-sm text-destructive">
            We couldn't load your results. Please refresh.
          </p>
        ) : !results.data?.length ? (
          <div className="mt-4 rounded-lg border border-dashed border-border p-6">
            <p className="text-muted-foreground">
              No saved results yet. Run a check and it'll be kept here automatically while you're
              signed in.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {Object.entries(JOURNEYS).map(([key, j]) => (
                <a
                  key={key}
                  href={j.to}
                  className="inline-flex h-9 items-center gap-2 rounded-md border border-border px-3 text-sm hover:border-primary/40 hover:bg-muted"
                >
                  <j.Icon className="h-4 w-4 text-primary" />
                  {j.label.replace(" matches", "").replace(" check", "")}
                </a>
              ))}
            </div>
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-border rounded-lg border border-border bg-card">
            {results.data.map((r) => {
              const j = JOURNEYS[r.journey] ?? JOURNEYS.grade_12;
              return (
                <li key={r.id} className="flex items-center gap-4 p-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted text-[var(--brand-umhlaba)]">
                    <j.Icon className="h-5 w-5" />
                  </span>
                  <a href={`/results/${r.share_slug}`} className="group min-w-0 flex-1">
                    <p className="font-medium text-foreground group-hover:text-primary">
                      {j.label}
                    </p>
                    <p className="truncate text-sm text-muted-foreground">
                      {r.summary} ·{" "}
                      {new Date(r.created_at).toLocaleDateString("en-ZA", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </a>
                  <button
                    onClick={() => removeResult.mutate(r.id)}
                    disabled={removeResult.isPending}
                    className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-destructive"
                    aria-label="Remove this result"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <ArrowRight className="hidden h-4 w-4 text-muted-foreground sm:block" />
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Shortlist */}
      <section className="mt-12">
        <h2 className="font-sans text-lg font-semibold text-foreground">Shortlist</h2>
        {saved.isLoading ? (
          <Loader2 className="mt-6 h-5 w-5 animate-spin text-primary" />
        ) : !saved.data?.length ? (
          <p className="mt-4 rounded-lg border border-dashed border-border p-6 text-muted-foreground">
            Nothing shortlisted yet. Tap the <Bookmark className="inline h-4 w-4 align-[-2px]" /> on
            any course, bursary, or TVET programme in your results to keep it here.
          </p>
        ) : (
          <div className="mt-4 space-y-8">
            {Object.entries(groups).map(([kind, items]) => (
              <div key={kind}>
                <h3 className="font-sans text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  {KIND_LABEL[kind] ?? kind}
                </h3>
                <ul className="mt-3 grid gap-3 sm:grid-cols-2">
                  {items.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-start gap-3 rounded-lg border border-border bg-card p-4"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-foreground">{item.title}</p>
                        {item.subtitle && (
                          <p className="text-sm text-muted-foreground">{item.subtitle}</p>
                        )}
                        {item.url && (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                          >
                            Apply / learn more <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </div>
                      <button
                        onClick={() => unsave.mutate({ kind: item.kind, refId: item.ref_id })}
                        disabled={unsave.isPending}
                        className="rounded-md p-1.5 text-primary hover:bg-muted"
                        aria-label="Remove from shortlist"
                      >
                        <Bookmark className="h-4 w-4 fill-current" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

type Profile = { first_name: string | null; last_name: string | null; career_stage: string | null };

/** Name, surname and career stage; editable so earlier sign-ups can fill them in. */
function ProfileCard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const profile = useQuery({
    queryKey: ["my-profile", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<Profile | null> => {
      const { data, error } = await supabase
        .from("profiles")
        .select("first_name, last_name, career_stage")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Profile>({ first_name: "", last_name: "", career_stage: "" });
  const incomplete =
    !!profile.data &&
    (!profile.data.first_name || !profile.data.last_name || !profile.data.career_stage);

  useEffect(() => {
    if (profile.data) {
      setForm({
        first_name: profile.data.first_name ?? "",
        last_name: profile.data.last_name ?? "",
        career_stage: profile.data.career_stage ?? "",
      });
    }
  }, [profile.data]);

  const save = useMutation({
    mutationFn: async () => {
      const first = (form.first_name ?? "").trim();
      const last = (form.last_name ?? "").trim();
      if (!first || !last || !form.career_stage)
        throw new Error("Please fill in all three fields.");
      const { error } = await supabase
        .from("profiles")
        .update({
          first_name: first,
          last_name: last,
          career_stage: form.career_stage,
          display_name: `${first} ${last}`,
        })
        .eq("id", user!.id);
      if (error) throw new Error("Could not save your details. Please try again.");
      // Keep auth metadata in step so emails greet people by name.
      await supabase.auth.updateUser({
        data: {
          first_name: first,
          last_name: last,
          full_name: `${first} ${last}`,
          career_stage: form.career_stage,
        },
      });
    },
    onSuccess: () => {
      setEditing(false);
      queryClient.invalidateQueries({ queryKey: ["my-profile"] });
    },
  });

  if (!user || profile.isLoading) return null;
  const showForm = editing || incomplete;

  return (
    <section className="mt-10 rounded-lg border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-sans text-lg font-semibold text-foreground">Your details</h2>
          {!showForm && (
            <p className="mt-1 text-sm text-muted-foreground">
              {profile.data?.first_name} {profile.data?.last_name}
              {careerStageLabel(profile.data?.career_stage) &&
                ` · ${careerStageLabel(profile.data?.career_stage)}`}
            </p>
          )}
          {incomplete && !editing && (
            <p className="mt-1 text-sm text-muted-foreground">
              Add your name and where you are, so we can tailor your guidance.
            </p>
          )}
        </div>
        {!showForm && (
          <button
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium text-primary hover:bg-muted"
          >
            <Pencil className="h-3.5 w-3.5" /> Edit
          </button>
        )}
      </div>

      {showForm && (
        <form
          className="mt-4 grid gap-3 sm:grid-cols-3"
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate();
          }}
        >
          <input
            aria-label="Name"
            placeholder="Name"
            autoComplete="given-name"
            maxLength={60}
            value={form.first_name ?? ""}
            onChange={(e) => setForm({ ...form, first_name: e.target.value })}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <input
            aria-label="Surname"
            placeholder="Surname"
            autoComplete="family-name"
            maxLength={60}
            value={form.last_name ?? ""}
            onChange={(e) => setForm({ ...form, last_name: e.target.value })}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <select
            aria-label="Where are you right now?"
            value={form.career_stage ?? ""}
            onChange={(e) => setForm({ ...form, career_stage: e.target.value })}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="" disabled>
              Where are you right now?
            </option>
            {CAREER_STAGES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-3 sm:col-span-3">
            <button
              type="submit"
              disabled={save.isPending}
              className="inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
            >
              {save.isPending ? "Saving…" : "Save details"}
            </button>
            {editing && !incomplete && (
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
            )}
            {save.isError && (
              <p className="text-sm text-destructive">{(save.error as Error).message}</p>
            )}
          </div>
        </form>
      )}
    </section>
  );
}
