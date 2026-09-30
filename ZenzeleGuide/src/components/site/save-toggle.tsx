import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bookmark } from "lucide-react";
import { listMySavedIds, toggleSavedItem } from "@/lib/journey.functions";
import { useAuth } from "@/hooks/use-auth";
import type { SavedKind } from "@/lib/saved";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Adds a course, bursary, TVET programme or opportunity to the signed-in learner's
 * shortlist (My Zenzele). Signed-out visitors get a link to sign up.
 * `variant="button"` shows a labelled button instead of a bare icon.
 */
export function SaveToggle({
  kind,
  refId,
  returnTo,
  variant = "icon",
}: {
  kind: SavedKind;
  refId?: string;
  returnTo: string;
  variant?: "icon" | "button";
}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const savedIds = useQuery({
    queryKey: ["my-saved-ids", user?.id ?? null],
    queryFn: () => listMySavedIds(),
    enabled: !!user,
  });
  const toggle = useMutation({
    mutationFn: () => toggleSavedItem({ data: { kind, refId: refId! } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-saved-ids"] });
      queryClient.invalidateQueries({ queryKey: ["my-saved"] });
    },
  });

  if (!refId || !UUID.test(refId)) return null;

  const buttonClass =
    "inline-flex h-10 items-center gap-2 rounded-md border border-border px-4 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50";

  if (!user) {
    return (
      <Link
        to="/auth"
        search={{ redirect: returnTo, mode: "signup" }}
        className={
          variant === "button"
            ? buttonClass
            : "rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-primary"
        }
        aria-label="Sign up to shortlist this"
        title="Sign up to shortlist this"
      >
        <Bookmark className="h-4 w-4" />
        {variant === "button" && "Save to my shortlist"}
      </Link>
    );
  }

  const saved = savedIds.data?.includes(refId) ?? false;
  return (
    <button
      onClick={() => toggle.mutate()}
      disabled={toggle.isPending || savedIds.isLoading}
      className={
        variant === "button"
          ? buttonClass
          : "rounded-md p-1.5 text-primary hover:bg-muted disabled:opacity-50"
      }
      aria-label={saved ? "Remove from shortlist" : "Add to shortlist"}
      aria-pressed={saved}
      title={saved ? "Remove from shortlist" : "Add to shortlist"}
    >
      <Bookmark className={saved ? "h-4 w-4 fill-current text-primary" : "h-4 w-4"} />
      {variant === "button" && (saved ? "Saved to my shortlist" : "Save to my shortlist")}
    </button>
  );
}
