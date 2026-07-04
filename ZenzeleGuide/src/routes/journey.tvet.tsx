import { createFileRoute } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader as Loader2 } from "lucide-react";
import { computeTvetMatch } from "@/lib/journey.functions";

export const Route = createFileRoute("/journey/tvet")({
  head: () => ({
    meta: [{ title: "TVET Pathway — Zenzele Guide" }],
  }),
  component: TvetJourneyPage,
});

const PROVINCES = [
  { code: "EC", label: "Eastern Cape" },
  { code: "FS", label: "Free State" },
  { code: "GP", label: "Gauteng" },
  { code: "KZN", label: "KwaZulu-Natal" },
  { code: "LP", label: "Limpopo" },
  { code: "MP", label: "Mpumalanga" },
  { code: "NC", label: "Northern Cape" },
  { code: "NW", label: "North West" },
  { code: "WC", label: "Western Cape" },
] as const;

const PROGRAM_TYPES = [
  { code: "ncv", label: "NC(V) — National Certificate (Vocational)" },
  { code: "nated", label: "Report 191 (NATED) — N1-N6" },
  { code: "learnership", label: "Learnership / Skills Programme" },
  { code: "undecided", label: "Not sure yet" },
] as const;

const FIELDS_OF_STUDY = [
  { code: "undecided", label: "Undecided / Not sure yet" },
  { code: "engineering", label: "Engineering & Related" },
  { code: "business", label: "Business & Management" },
  { code: "it", label: "Information Technology" },
  { code: "hospitality", label: "Hospitality & Tourism" },
  { code: "education", label: "Education & Development" },
  { code: "health", label: "Health & Community Services" },
  { code: "arts", label: "Arts & Design" },
  { code: "agriculture", label: "Agriculture & Nature Conservation" },
] as const;

const GRADE_COMPLETED = [
  { code: "grade_9", label: "Grade 9" },
  { code: "grade_10", label: "Grade 10" },
  { code: "grade_11", label: "Grade 11" },
  { code: "grade_12", label: "Grade 12 (Matric)" },
] as const;

const TvetFormSchema = z.object({
  province: z.string().min(1, "Please select your province"),
  citizenship: z.enum(["sa_citizen", "sa_permanent_resident", "other"], {
    required_error: "Please select your citizenship status",
  }).default("sa_citizen"),
  grade_completed: z.enum(["grade_9", "grade_10", "grade_11", "grade_12"], {
    required_error: "Please select your highest completed grade",
  }),
  program_type: z.enum(["ncv", "nated", "learnership", "undecided"], {
    required_error: "Please select a programme type",
  }).default("undecided"),
  field_of_study: z.string().default("undecided"),
});

type TvetFormValues = z.infer<typeof TvetFormSchema>;

function TvetJourneyPage() {
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<TvetFormValues>({
    resolver: zodResolver(TvetFormSchema) as any,
    defaultValues: {
      province: "",
      citizenship: "sa_citizen",
      program_type: "undecided",
      field_of_study: "undecided",
    },
  });

  const handleSubmit = async (data: TvetFormValues) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const anonId = localStorage.getItem("anon_id") || crypto.randomUUID();
      localStorage.setItem("anon_id", anonId);

      const profile = {
        ...data,
        is_anonymous: true,
      };

      const result = await computeTvetMatch({
        data: {
          profile,
          anonId,
          userId: null,
        },
      });

      window.location.href = `/results/${result.resultId}`;
    } catch (err) {
      console.error("TVET submission error:", err);
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred. Please try again.";
      setError(errorMessage);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            TVET Pathway Finder
          </h1>
          <p className="text-gray-600">
            Find TVET colleges and programmes that match your qualifications and interests.
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={form.handleSubmit(handleSubmit as any)}>
          <Card>
            <CardHeader>
              <CardTitle>Your Profile</CardTitle>
              <CardDescription>
                Tell us about your background and what you want to study. We'll match you to TVET programmes in your province first.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Province */}
              <div className="space-y-2">
                <Label>Which province do you live in?</Label>
                <Select
                  value={form.watch("province")}
                  onValueChange={(value) => form.setValue("province", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select province" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROVINCES.map((p) => (
                      <SelectItem key={p.code} value={p.code}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.province && (
                  <p className="text-sm text-red-500">{form.formState.errors.province.message}</p>
                )}
                <p className="text-sm text-gray-500">
                  We'll show colleges in your province first.
                </p>
              </div>

              {/* Grade Completed */}
              <div className="space-y-2">
                <Label>What is the highest grade you have completed?</Label>
                <RadioGroup
                  value={form.watch("grade_completed")}
                  onValueChange={(value) =>
                    form.setValue("grade_completed", value as "grade_9" | "grade_10" | "grade_11" | "grade_12")
                  }
                >
                  {GRADE_COMPLETED.map((g) => (
                    <div key={g.code} className="flex items-center space-x-2">
                      <RadioGroupItem value={g.code} id={g.code} />
                      <Label htmlFor={g.code}>{g.label}</Label>
                    </div>
                  ))}
                </RadioGroup>
                <p className="text-sm text-gray-500">
                  NC(V) programmes require Grade 9 or higher. Report 191 (NATED) requires matric.
                </p>
              </div>

              {/* Programme Type */}
              <div className="space-y-2">
                <Label>What type of programme are you interested in?</Label>
                <Select
                  value={form.watch("program_type")}
                  onValueChange={(value) =>
                    form.setValue("program_type", value as "ncv" | "nated" | "learnership" | "undecided")
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select programme type" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROGRAM_TYPES.map((p) => (
                      <SelectItem key={p.code} value={p.code}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Field of Study */}
              <div className="space-y-2">
                <Label>What field interests you?</Label>
                <Select
                  value={form.watch("field_of_study")}
                  onValueChange={(value) => form.setValue("field_of_study", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select field of study" />
                  </SelectTrigger>
                  <SelectContent>
                    {FIELDS_OF_STUDY.map((f) => (
                      <SelectItem key={f.code} value={f.code}>
                        {f.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Ready message */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium mb-2">Ready to find TVET programmes?</h3>
                <p className="text-sm text-gray-600">
                  We'll match you to programmes at public TVET colleges based on your qualifications
                  and show you which ones you qualify for.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="mt-6 flex justify-end">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Finding programmes...
                </>
              ) : (
                "Find matching TVET programmes"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
