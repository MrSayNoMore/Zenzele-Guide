import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type SubjectOption = { code: string; label: string };

/**
 * NSC subjects for learner forms, from the `subjects` table so subjects added
 * in /admin/subjects appear automatically. Falls back to `fallback` while
 * loading or if the database can't be reached.
 */
export function useSubjectOptions(fallback: SubjectOption[]): SubjectOption[] {
  const { data } = useQuery({
    queryKey: ["subjects"],
    staleTime: 60 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.from("subjects").select("code, name").order("name");
      if (error) throw error;
      return data.map((s) => ({ code: s.code, label: s.name }));
    },
  });
  if (!data?.length) return fallback;
  // "Other subject" last, like the fallback list.
  return [...data.filter((s) => s.code !== "other"), ...data.filter((s) => s.code === "other")];
}
