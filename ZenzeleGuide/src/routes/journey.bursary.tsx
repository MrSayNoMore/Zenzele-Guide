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
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader as Loader2 } from "lucide-react";
import { computeBursaryMatch } from "@/lib/journey.functions";

export const Route = createFileRoute("/journey/bursary")({
  head: () => ({
    meta: [{ title: "Bursary Finder — Zenzele Guide" }],
  }),
  component: BursaryJourneyPage,
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

const FIELDS_OF_STUDY = [
  { code: "undecided", label: "Undecided / Not sure yet" },
  { code: "engineering", label: "Engineering & Technology" },
  { code: "health", label: "Health Sciences (Medicine, Nursing, Pharmacy)" },
  { code: "commerce", label: "Commerce (Business, Accounting, Finance)" },
  { code: "law", label: "Law" },
  { code: "education", label: "Education (Teaching)" },
  { code: "humanities", label: "Humanities & Social Sciences" },
  { code: "science", label: "Natural Sciences" },
  { code: "it", label: "Information Technology & Computer Science" },
  { code: "arts", label: "Arts (Visual, Performing, Music)" },
  { code: "agriculture", label: "Agriculture" },
  { code: "tourism", label: "Tourism & Hospitality" },
] as const;

const INCOME_BANDS = [
  { code: "unsure", label: "I am not sure" },
  { code: "le_350k", label: "R350,000 or less per year" },
  { code: "350k_600k", label: "Between R350,001 and R600,000 per year" },
  { code: "gt_600k", label: "More than R600,000 per year" },
] as const;

const BursaryFormSchema = z.object({
  province: z.string().min(1, "Please select your province"),
  citizenship: z.enum(["sa_citizen", "sa_permanent_resident", "other"], {
    required_error: "Please select your citizenship status",
  }),
  disability: z.boolean().default(false),
  sassa_recipient: z.boolean().default(false),
  household_income_band: z.enum(["unsure", "le_350k", "350k_600k", "gt_600k"]),
  field_of_study: z.string().default("undecided"),
  current_grade: z.enum(["grade_12", "gap_year", "first_year", "continuing"], {
    required_error: "Please select your current status",
  }).default("grade_12"),
  min_aps: z.number().min(0).max(56).optional(),
});

type BursaryFormValues = z.infer<typeof BursaryFormSchema>;

function BursaryJourneyPage() {
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<BursaryFormValues>({
    resolver: zodResolver(BursaryFormSchema) as any,
    defaultValues: {
      province: "",
      citizenship: "sa_citizen",
      disability: false,
      sassa_recipient: false,
      household_income_band: "unsure",
      field_of_study: "undecided",
      current_grade: "grade_12",
    },
  });

  const handleSubmit = async (data: BursaryFormValues) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const anonId = localStorage.getItem("anon_id") || crypto.randomUUID();
      localStorage.setItem("anon_id", anonId);

      const profile = {
        ...data,
        is_anonymous: true,
      };

      const result = await computeBursaryMatch({
        data: {
          profile,
          anonId,
          userId: null,
        },
      });

      window.location.href = `/results/${result.resultId}`;
    } catch (err) {
      console.error("Bursary submission error:", err);
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred. Please try again.";
      setError(errorMessage);
      setIsSubmitting(false);
    }
  };

  const totalSteps = 2;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Bursary Finder
          </h1>
          <p className="text-gray-600">
            Find bursaries you qualify for based on your profile and field of study.
          </p>
        </div>

        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            {[1, 2].map((s) => (
              <div
                key={s}
                className={`flex-1 h-2 mx-1 rounded ${
                  s <= step ? "bg-blue-600" : "bg-gray-200"
                }`}
              />
            ))}
          </div>
          <div className="flex justify-between text-sm text-gray-500">
            <span>Your Profile</span>
            <span>Study Plans</span>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={form.handleSubmit(handleSubmit as any)}>
          {/* Step 1: Personal Details */}
          {step === 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Your Details</CardTitle>
                <CardDescription>
                  We use this to match you to bursaries with specific eligibility criteria.
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
                </div>

                {/* Citizenship */}
                <div className="space-y-2">
                  <Label>Citizenship status</Label>
                  <RadioGroup
                    value={form.watch("citizenship")}
                    onValueChange={(value) =>
                      form.setValue("citizenship", value as "sa_citizen" | "sa_permanent_resident" | "other")
                    }
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="sa_citizen" id="sa_citizen" />
                      <Label htmlFor="sa_citizen">South African citizen</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="sa_permanent_resident" id="sa_permanent_resident" />
                      <Label htmlFor="sa_permanent_resident">South African permanent resident</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="other" id="other" />
                      <Label htmlFor="other">Other / International</Label>
                    </div>
                  </RadioGroup>
                  <p className="text-sm text-gray-500">
                    Some bursaries are only for South African citizens.
                  </p>
                </div>

                {/* Household Income */}
                <div className="space-y-2">
                  <Label>What is your total annual household income?</Label>
                  <Select
                    value={form.watch("household_income_band")}
                    onValueChange={(value) =>
                      form.setValue("household_income_band", value as "unsure" | "le_350k" | "350k_600k" | "gt_600k")
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select income range" />
                    </SelectTrigger>
                    <SelectContent>
                      {INCOME_BANDS.map((b) => (
                        <SelectItem key={b.code} value={b.code}>
                          {b.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-gray-500">
                    Many bursaries have income thresholds.
                  </p>
                </div>

                {/* SASSA & Disability */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="sassa"
                      checked={form.watch("sassa_recipient")}
                      onCheckedChange={(checked) => form.setValue("sassa_recipient", checked as boolean)}
                    />
                    <Label htmlFor="sassa" className="font-normal">
                      I receive a SASSA social grant
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="disability"
                      checked={form.watch("disability")}
                      onCheckedChange={(checked) => form.setValue("disability", checked as boolean)}
                    />
                    <Label htmlFor="disability" className="font-normal">
                      I have a disability
                    </Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Study Plans */}
          {step === 2 && (
            <Card>
              <CardHeader>
                <CardTitle>Your Study Plans</CardTitle>
                <CardDescription>
                  Tell us what and where you want to study so we can find matching bursaries.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Current Status */}
                <div className="space-y-2">
                  <Label>What is your current status?</Label>
                  <RadioGroup
                    value={form.watch("current_grade")}
                    onValueChange={(value) =>
                      form.setValue("current_grade", value as "grade_12" | "gap_year" | "first_year" | "continuing")
                    }
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="grade_12" id="grade_12" />
                      <Label htmlFor="grade_12">Grade 12 learner</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="gap_year" id="gap_year" />
                      <Label htmlFor="gap_year">Gap year (completed matric)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="first_year" id="first_year" />
                      <Label htmlFor="first_year">First year university/TVET student</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="continuing" id="continuing" />
                      <Label htmlFor="continuing">Continuing student (2nd year or higher)</Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Field of Study */}
                <div className="space-y-2">
                  <Label>What field do you want to study?</Label>
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

                {/* APS */}
                <div className="space-y-2">
                  <Label htmlFor="min_aps">Your APS score (if you know it)</Label>
                  <Input
                    id="min_aps"
                    type="number"
                    min={0}
                    max={56}
                    {...form.register("min_aps", { valueAsNumber: true })}
                    placeholder="e.g. 32"
                  />
                  <p className="text-sm text-gray-500">
                    Some bursaries have minimum APS requirements. Leave blank if you don't know your APS yet.
                  </p>
                </div>

                {/* Ready message */}
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium mb-2">Ready to find bursaries?</h3>
                  <p className="text-sm text-gray-600">
                    We'll match you to bursaries based on your field of study, location, and eligibility.
                    Results include deadlines and links to apply.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Navigation Buttons */}
          <div className="mt-6 flex justify-between">
            {step > 1 && (
              <Button type="button" variant="outline" onClick={() => setStep(step - 1)}>
                Previous
              </Button>
            )}
            {step < totalSteps ? (
              <Button
                type="button"
                onClick={() => {
                  if (step === 1) {
                    if (!form.getValues("province")) {
                      form.setError("province", { message: "Please select your province" });
                      return;
                    }
                    setStep(step + 1);
                  }
                }}
                className="ml-auto"
              >
                Next
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={isSubmitting}
                className="ml-auto bg-blue-600 hover:bg-blue-700"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Finding bursaries...
                  </>
                ) : (
                  "Find matching bursaries"
                )}
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
