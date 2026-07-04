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
import { Loader as Loader2, Info } from "lucide-react";
import { computeNsfasCheck } from "@/lib/journey.functions";

export const Route = createFileRoute("/journey/nsfas")({
  head: () => ({
    meta: [{ title: "NSFAS Eligibility Check — Zenzele Guide" }],
  }),
  component: NsfasJourneyPage,
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

const INCOME_BANDS = [
  { code: "unsure", label: "I am not sure" },
  { code: "le_350k", label: "R350,000 or less per year (about R29,000/month or less)" },
  { code: "350k_600k", label: "Between R350,001 and R600,000 per year" },
  { code: "gt_600k", label: "More than R600,000 per year (about R50,000/month or more)" },
] as const;

const NsfasFormSchema = z.object({
  province: z.string().min(1, "Please select your province"),
  citizenship: z.enum(["sa_citizen", "sa_permanent_resident", "other"], {
    required_error: "Please select your citizenship status",
  }),
  disability: z.boolean().default(false),
  sassa_recipient: z.boolean().default(false),
  household_income_band: z.enum(["unsure", "le_350k", "350k_600k", "gt_600k"], {
    required_error: "Please select your household income",
  }),
  family_members_at_university: z.number().min(0).max(20).default(0),
});

type NsfasFormValues = z.infer<typeof NsfasFormSchema>;

function NsfasJourneyPage() {
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<NsfasFormValues>({
    resolver: zodResolver(NsfasFormSchema) as any,
    defaultValues: {
      province: "",
      citizenship: "sa_citizen",
      disability: false,
      sassa_recipient: false,
      household_income_band: "unsure",
      family_members_at_university: 0,
    },
  });

  const handleSubmit = async (data: NsfasFormValues) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const anonId = localStorage.getItem("anon_id") || crypto.randomUUID();
      localStorage.setItem("anon_id", anonId);

      const profile = {
        ...data,
        is_anonymous: true,
      };

      const result = await computeNsfasCheck({
        data: {
          profile,
          anonId,
          userId: null,
        },
      });

      window.location.href = `/results/${result.resultId}`;
    } catch (err) {
      console.error("NSFAS submission error:", err);
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
            NSFAS Eligibility Check
          </h1>
          <p className="text-gray-600">
            Answer a few questions to find out if you qualify for NSFAS funding.
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
            <span>Personal Details</span>
            <span>Household Income</span>
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
                  NSFAS has specific requirements for who can receive funding.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Citizenship */}
                <div className="space-y-2">
                  <Label>Are you a South African citizen?</Label>
                  <RadioGroup
                    value={form.watch("citizenship")}
                    onValueChange={(value) =>
                      form.setValue("citizenship", value as "sa_citizen" | "sa_permanent_resident" | "other")
                    }
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="sa_citizen" id="sa_citizen" />
                      <Label htmlFor="sa_citizen">Yes, I am a South African citizen</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="sa_permanent_resident" id="sa_permanent_resident" />
                      <Label htmlFor="sa_permanent_resident">I am a permanent resident</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="other" id="other" />
                      <Label htmlFor="other">Other / International</Label>
                    </div>
                  </RadioGroup>
                  <p className="text-sm text-gray-500 mt-1">
                    NSFAS is only for South African citizens and permanent residents.
                  </p>
                </div>

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

                {/* SASSA */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="sassa"
                    checked={form.watch("sassa_recipient")}
                    onCheckedChange={(checked) => form.setValue("sassa_recipient", checked as boolean)}
                  />
                  <Label htmlFor="sassa" className="font-normal">
                    I or my family receive a SASSA social grant (child support, disability, old age, etc.)
                  </Label>
                </div>

                {/* Disability */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="disability"
                    checked={form.watch("disability")}
                    onCheckedChange={(checked) => form.setValue("disability", checked as boolean)}
                  />
                  <Label htmlFor="disability" className="font-normal">
                    I have a documented disability
                  </Label>
                </div>

                <Alert className="bg-blue-50 border-blue-200">
                  <Info className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    If you receive a SASSA grant, you automatically qualify for NSFAS. No income check needed.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Household Income */}
          {step === 2 && (
            <Card>
              <CardHeader>
                <CardTitle>Household Income</CardTitle>
                <CardDescription>
                  NSFAS uses your total household income to determine eligibility.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Income Band */}
                <div className="space-y-2">
                  <Label>What is your total annual household income?</Label>
                  <p className="text-sm text-gray-500 mb-2">
                    Include all income from everyone who lives with you and contributes financially (parents, guardians, spouse).
                  </p>
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

                {/* Family at University */}
                <div className="space-y-2">
                  <Label htmlFor="family_at_uni">
                    How many family members are currently at university or TVET college?
                  </Label>
                  <p className="text-sm text-gray-500 mb-2">
                    This can affect your household income threshold. NSFAS considers whether you have siblings already studying.
                  </p>
                  <Input
                    id="family_at_uni"
                    type="number"
                    min={0}
                    max={20}
                    {...form.register("family_members_at_university", { valueAsNumber: true })}
                    placeholder="0"
                  />
                </div>

                {/* Ready message */}
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium mb-2">Ready to check your eligibility?</h3>
                  <p className="text-sm text-gray-600">
                    We'll check your answers against the official NSFAS rules and tell you whether you qualify for funding.
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
                    if (!form.getValues("citizenship")) {
                      form.setError("citizenship", { message: "Please select your citizenship status" });
                      return;
                    }
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
                    Checking eligibility...
                  </>
                ) : (
                  "Check my NSFAS eligibility"
                )}
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
