import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { migrateAnonymousSession } from "@/lib/journey.functions";
import { peekAnonId, resetAnonId } from "@/lib/anon";

type AuthState = { user: User | null; session: Session | null; loading: boolean };

/** Current Supabase session, kept in sync with sign-in / sign-out. */
export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({ user: null, session: null, loading: true });

  useEffect(() => {
    let active = true;
    let unsubscribe = () => {};
    try {
      supabase.auth
        .getSession()
        .then(({ data }) => {
          if (active)
            setState({ user: data.session?.user ?? null, session: data.session, loading: false });
        })
        .catch(() => active && setState({ user: null, session: null, loading: false }));
      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        setState({ user: session?.user ?? null, session, loading: false });
      });
      unsubscribe = () => data.subscription.unsubscribe();
    } catch (err) {
      // Supabase not configured: behave as signed out rather than breaking the page.
      console.error(err);
      setState({ user: null, session: null, loading: false });
    }
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  return state;
}

export async function signOut() {
  await supabase.auth.signOut();
}

/**
 * Mounted once in the root layout. When someone signs in, results they made
 * on this device before signing in are moved into their account. Signing out
 * gives the device a fresh anonymous id.
 */
export function AuthSync() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const migrate = async () => {
      const anonId = peekAnonId();
      if (!anonId) return;
      try {
        const { migratedCount } = await migrateAnonymousSession({ data: { anonId } });
        if (migratedCount > 0) {
          queryClient.invalidateQueries({ queryKey: ["my-results"] });
          queryClient.invalidateQueries({ queryKey: ["result"] });
        }
      } catch (err) {
        console.error("Could not move earlier results to your account:", err);
      }
    };

    try {
      const { data } = supabase.auth.onAuthStateChange((event, session) => {
        // Only on an actual sign-in, not every page load, so results from
        // other people on a shared device aren't swept in later.
        if (session && event === "SIGNED_IN") {
          // Defer so the Supabase auth lock is released before the RPC reads the session.
          setTimeout(migrate, 0);
        }
        if (event === "SIGNED_OUT") {
          resetAnonId();
          queryClient.removeQueries({ queryKey: ["my-results"] });
          queryClient.removeQueries({ queryKey: ["my-saved"] });
          queryClient.removeQueries({ queryKey: ["my-saved-ids"] });
        }
      });
      return () => data.subscription.unsubscribe();
    } catch {
      return undefined; // Supabase not configured
    }
  }, [queryClient]);

  return null;
}

/** Whether the signed-in user has an admin role (super_admin or content_admin). */
export function useIsAdmin(): { isAdmin: boolean; loading: boolean } {
  const { user, loading: authLoading } = useAuth();
  const roles = useQuery({
    queryKey: ["my-roles", user?.id],
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user!.id);
      if (error) throw error;
      return data.map((r) => r.role);
    },
  });
  const isAdmin = !!roles.data?.some((r) => r === "super_admin" || r === "content_admin");
  return { isAdmin, loading: authLoading || (!!user && roles.isLoading) };
}

/** Admin check for a user id outside React (used right after sign-in). */
export async function userIsAdmin(userId: string): Promise<boolean> {
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  return !!data?.some((r) => r.role === "super_admin" || r.role === "content_admin");
}
