import { createFileRoute, useNavigate } from "@tanstack/react-router";
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
import { computeGrade12Match } from "@/lib/journey.functions";

export const Route = createFileRoute("/journey/grade-12")({
  head: () => ({
    meta: [{ title: "Grade 12 University Matcher — Zenzele Guide" }],
  }),
  component: Grade12JourneyPage,
});

// Navigate to results using window location (simple approach for now)
function useNavigateToResults() {
  return (resultId: string) => {
    window.location.href = `/results/${resultId}`;
  };
}

const SUBJECT_CODES = [
  { code: "english_hl", label: "English Home Language" },
  { code: "english_fal", label: "English First Additional Language" },
  { code: "afrikaans_hl", label: "Afrikaans Home Language" },
  { code: "afrikaans_fal", label: "Afrikaans First Additional Language" },
  { code: "isizulu_hl", label: "isiZulu Home Language" },
  { code: "isizulu_fal", label: "isiZulu First Additional Language" },
  { code: "sesotho_hl", label: "Sesotho Home Language" },
  { code: "sesotho_fal", label: "Sesotho First Additional Language" },
  { code: "mathematics", label: "Mathematics" },
  { code: "mathematical_literacy", label: "Mathematical Literacy" },
  { code: "physical_sciences", label: "Physical Sciences" },
  { code: "life_sciences", label: "Life Sciences" },
  { code: "accounting", label: "Accounting" },
  { code: "business_studies", label: "Business Studies" },
  { code: "economics", label: "Economics" },
  { code: "geography", label: "Geography" },
  { code: "history", label: "History" },
  { code: "life_orientation", label: "Life Orientation" },
  { code: "information_technology", label: "Information Technology" },
  { code: "computer_applications_technology", label: "Computer Applications Technology" },
  { code: "art", label: "Visual Arts" },
  { code: "music", label: "Music" },
  { code: "drama", label: "Dramatic Arts" },
  { code: "tourism", label: "Tourism" },
  { code: "hospitality_studies", label: "Hospitality Studies" },
  { code: "civil_technology", label: "Civil Technology" },
  { code: "electrical_technology", label: "Electrical Technology" },
  { code: "mechanical_technology", label: "Mechanical Technology" },
  { code: "agricultural_sciences", label: "Agricultural Sciences" },
  { code: "other", label: "Other" },
] as const;

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
  { code: "health", label: "Health Sciences (Medicine, Nursing, etc.)" },
  { code: "commerce", label: "Commerce (Business, Accounting, Finance)" },
  { code: "law", label: "Law" },
  { code: "education", label: "Education (Teaching)" },
  { code: "humanities", label: "Humanities & Social Sciences" },
  { code: "science", label: "Natural Sciences" },
  { code: "it", label: "Information Technology & Computer Science" },
  { code: "arts", label: "Arts (Visual, Performing, Music)" },
] as const;

const INCOME_BANDS = [
  { code: "unsure", label: "I am not sure" },
  { code: "le_350k", label: "R350,000 or less per year" },
  { code: "350k_600k", label: "Between R350,001 and R600,000 per year" },
  { code: "gt_600k", label: "More than R600,000 per year" },
] as const;

const SubjectSchema = z.object({
  code: z.string(),
  percentage: z.number().min(0).max(100),
  label: z.string().optional(),
});

const Grade12FormSchema = z.object({
  province: z.string().min(1, "Please select your province"),
  citizenship: z.enum(["sa_citizen", "sa_permanent_resident", "other"], {
    required_error: "Please select your citizenship status",
  }),
  disability: z.boolean().default(false),
  sassa_recipient: z.boolean().default(false),
  household_income_band: z.enum(["unsure", "le_350k", "350k_600k", "gt_600k"], {
    required_error: "Please select your household income",
  }),
  subjects: z.array(SubjectSchema).min(7, "You need at least 7 subjects").max(9, "Maximum 9 subjects allowed"),
  nbt_aql: z.number().min(0).max(100).optional(),
  nbt_mat: z.number().min(0).max(100).optional(),
  intended_field: z.string().default("undecided"),
});

type Grade12FormValues = z.infer<typeof Grade12FormSchema>;

function Grade12JourneyPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [subjectEntries, setSubjectEntries] = useState<
    { code: string; label: string; percentage: number }[]
  >([
    { code: "english_hl", label: "English Home Language", percentage: 0 },
    { code: "mathematics", label: "Mathematics", percentage: 0 },
    { code: "life_orientation", label: "Life Orientation", percentage: 0 },
  ]);

  const form = useForm<Grade12FormValues>({
    resolver: zodResolver(Grade12FormSchema) as any,
    defaultValues: {
      province: "",
      citizenship: "sa_citizen",
      disability: false,
      sassa_recipient: false,
      household_income_band: "unsure",
      subjects: [],
      intended_field: "undecided",
    },
  });

  const addSubject = () => {
    if (subjectEntries.length < 9) {
      const usedCodes = new Set(subjectEntries.map((s) => s.code));
      const nextSubject = SUBJECT_CODES.find((s) => !usedCodes.has(s.code));
      if (nextSubject) {
        setSubjectEntries([...subjectEntries, { code: nextSubject.code, label: nextSubject.label, percentage: 0 }]);
      }
    }
  };

  const removeSubject = (index: number) => {
    if (subjectEntries.length > 7) {
      setSubjectEntries(subjectEntries.filter((_, i) => i !== index));
    }
  };

  const updateSubject = (index: number, field: "code" | "percentage", value: string | number) => {
    const updated = [...subjectEntries];
    if (field === "code") {
      const subject = SUBJECT_CODES.find((s) => s.code === value);
      updated[index] = { code: value as string, label: subject?.label || "", percentage: updated[index].percentage };
    } else {
      updated[index] = { ...updated[index], percentage: value as number };
    }
    setSubjectEntries(updated);
  };

  const handleSubmit = async (data: Grade12FormValues) => {
    const subjects = subjectEntries.map((s) => ({
      code: s.code,
      percentage: s.percentage,
      label: s.label,
    }));

    if (subjects.length < 7) {
      setError("Please enter at least 7 subjects");
      return;
    }

    for (const subject of subjects) {
      if (subject.percentage < 0 || subject.percentage > 100) {
        setError(`Invalid percentage for ${subject.label}. Please enter a value between 0 and 100.`);
        return;
      }
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const anonId = localStorage.getItem("anon_id") || crypto.randomUUID();
      localStorage.setItem("anon_id", anonId);

      const profile = {
        ...data,
        subjects,
      };

      console.log("Submitting profile:", profile);

      const result = await computeGrade12Match({
        data: {
          profile,
          anonId,
          userId: null,
        },
      });

      console.log("Got result:", result);

      // Navigate to results page
      window.location.href = `/results/${result.resultId}`;
    } catch (err) {
      console.error("Submission error:", err);
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred. Please try again.";
      setError(errorMessage);
      setIsSubmitting(false);
    }
  };

  const totalSteps = 3;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Grade 12 University Matcher
          </h1>
          <p className="text-gray-600">
            Enter your subject marks to see which universities and courses you qualify for.
          </p>
        </div>

        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`flex-1 h-2 mx-1 rounded ${
                  s <= step ? "bg-blue-600" : "bg-gray-200"
                }`}
              />
            ))}
          </div>
          <div className="flex justify-between text-sm text-gray-500">
            <span>Personal Details</span>
            <span>Subject Marks</span>
            <span>Review & Submit</span>
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
                  We use this to check NSFAS eligibility and match you to institutions in your province.
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
                      I or my family receive a SASSA social grant
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

                {/* Intended Field */}
                <div className="space-y-2">
                  <Label>What field are you most interested in studying?</Label>
                  <Select
                    value={form.watch("intended_field")}
                    onValueChange={(value) => form.setValue("intended_field", value)}
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
              </CardContent>
            </Card>
          )}

          {/* Step 2: Subject Marks */}
          {step === 2 && (
            <Card>
              <CardHeader>
                <CardTitle>Your Subject Marks</CardTitle>
                <CardDescription>
                  Enter your final Grade 12 marks (or expected marks). You need at least 7 subjects.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {subjectEntries.map((subject, index) => (
                  <div key={index} className="flex items-end gap-4">
                    <div className="flex-1">
                      <Label className="text-sm text-gray-600">Subject</Label>
                      <Select
                        value={subject.code}
                        onValueChange={(value) => updateSubject(index, "code", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SUBJECT_CODES.filter(
                            (s) => s.code === subject.code || !subjectEntries.some((e) => e.code === s.code)
                          ).map((s) => (
                            <SelectItem key={s.code} value={s.code}>
                              {s.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="w-28">
                      <Label className="text-sm text-gray-600">Percentage</Label>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={subject.percentage || ""}
                        onChange={(e) => updateSubject(index, "percentage", parseInt(e.target.value) || 0)}
                        placeholder="%"
                      />
                    </div>
                    {subjectEntries.length > 7 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSubject(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                ))}
                {subjectEntries.length < 9 && (
                  <Button type="button" variant="outline" onClick={addSubject} className="w-full">
                    + Add another subject
                  </Button>
                )}
                <p className="text-sm text-gray-500">
                  Tip: Include Life Orientation even though some universities count it differently.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Step 3: NBT and Review */}
          {step === 3 && (
            <Card>
              <CardHeader>
                <CardTitle>NBT Scores (Optional)</CardTitle>
                <CardDescription>
                  If you have written the NBTs, enter your scores here. This helps match you to courses that require them.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nbt_aql">AQL Score</Label>
                    <Input
                      id="nbt_aql"
                      type="number"
                      min={0}
                      max={100}
                      {...form.register("nbt_aql", { valueAsNumber: true })}
                      placeholder="0-100"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nbt_mat">MAT Score</Label>
                    <Input
                      id="nbt_mat"
                      type="number"
                      min={0}
                      max={100}
                      {...form.register("nbt_mat", { valueAsNumber: true })}
                      placeholder="0-100"
                    />
                  </div>
                </div>
                <p className="text-sm text-gray-500">
                  Leave blank if you have not written the NBTs yet. Some courses will show as "missing info" which is expected.
                </p>

                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium mb-2">Ready to see your matches?</h3>
                  <p className="text-sm text-gray-600">
                    We will compute your APS and match you to all published university courses that you qualify for.
                    The results will be saved and you can share them with a link.
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
                  } else if (step === 2) {
                    const validSubjects = subjectEntries.filter(
                      (s) => s.percentage >= 0 && s.percentage <= 100
                    );
                    if (validSubjects.length < 7) {
                      setError("Please enter valid percentages for at least 7 subjects");
                      return;
                    }
                    setError(null);
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
                    Computing matches...
                  </>
                ) : (
                  "See my matches"
                )}
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
