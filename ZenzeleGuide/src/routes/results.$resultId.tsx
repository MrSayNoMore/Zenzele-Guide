import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getResult } from "@/lib/journey.functions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader as Loader2, CircleCheck as CheckCircle2, TriangleAlert as AlertTriangle, Circle as XCircle, Circle as HelpCircle, Share2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/results/$resultId")({
  head: () => ({
    meta: [{ title: "Your Results — Zenzele Guide" }],
  }),
  component: ResultsPage,
});

function ResultsPage() {
  const { resultId } = Route.useParams() as { resultId: string };

  const { data: result, isLoading, error } = useQuery({
    queryKey: ["result", resultId],
    queryFn: () => getResult({ data: { idOrSlug: resultId } }),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading your results...</p>
        </div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Result not found</h2>
            <p className="text-gray-600 mb-4">
              This result link may have expired or does not exist.
            </p>
            <a href="/journey/grade-12">
              <Button>Start a new search</Button>
            </a>
          </CardContent>
        </Card>
      </div>
    );
  }

  const output = result.output as any;
  const isGrade12 = result.journey === "grade_12";
  const isNsfas = result.journey === "nsfas";
  const isBursary = result.journey === "bursary";
  const isTvet = result.journey === "tvet";

  const shareUrl = typeof window !== "undefined"
    ? `${window.location.origin}/results/${result.share_slug}`
    : "";

  const copyShareLink = () => {
    navigator.clipboard.writeText(shareUrl);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <a href="/journey/grade-12" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Start a new search
          </a>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {isGrade12 && "Your University Matches"}
                {isNsfas && "Your NSFAS Eligibility"}
                {isBursary && "Your Bursary Matches"}
                {isTvet && "Your TVET Programme Matches"}
              </h1>
              <p className="text-gray-600">
                Computed on {new Date(result.created_at).toLocaleDateString("en-ZA", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
            <Button variant="outline" onClick={copyShareLink} className="flex items-center gap-2">
              <Share2 className="h-4 w-4" />
              Copy share link
            </Button>
          </div>
        </div>

        {/* Grade 12 Results */}
        {isGrade12 && output && (
          <>
            {/* APS Score Card */}
            {output.learner_summary && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Your APS Score</CardTitle>
                  <CardDescription>
                    Based on the standard NSC scoring method
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end gap-4">
                    <div className="text-5xl font-bold text-blue-600">
                      {output.learner_summary.total_aps_avg}
                    </div>
                    <div className="text-gray-500 pb-2">
                      points
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Summary Counts */}
            {output.learner_summary && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <span className="text-2xl font-bold text-green-600">
                        {output.learner_summary.qualifies_count || 0}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">Qualify</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-yellow-600" />
                      <span className="text-2xl font-bold text-yellow-600">
                        {output.learner_summary.borderline_count || 0}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">Borderline</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2">
                      <XCircle className="h-5 w-5 text-red-600" />
                      <span className="text-2xl font-bold text-red-600">
                        {output.learner_summary.below_count || 0}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">Below requirements</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2">
                      <HelpCircle className="h-5 w-5 text-gray-400" />
                      <span className="text-2xl font-bold text-gray-400">
                        {output.learner_summary.missing_info_count || 0}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">Missing info</p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Course Matches List */}
            {output.course_matches && (
              <Card>
                <CardHeader>
                  <CardTitle>Course Matches</CardTitle>
                  <CardDescription>
                    Sorted by likelihood of acceptance
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {output.course_matches.map((match: any, index: number) => (
                      <div
                        key={match.course_id || index}
                        className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-medium">{match.course_name || "Unknown Course"}</h3>
                            <p className="text-sm text-gray-600">
                              {match.university_name && `${match.university_name}`}
                              {match.faculty_name && ` — ${match.faculty_name}`}
                            </p>
                          </div>
                          <StatusBadge status={match.status} />
                        </div>
                        <div className="flex gap-4 text-sm text-gray-600">
                          <span>APS: {match.total_aps} / {match.min_aps || "—"}</span>
                          {match.aps_gap !== undefined && match.aps_gap > 0 && (
                            <span className="text-red-600">Gap: {match.aps_gap} points</span>
                          )}
                        </div>
                        {match.reasons && match.reasons.length > 0 && (
                          <div className="mt-2 text-sm text-gray-500">
                            {match.reasons.map((reason: any, i: number) => (
                              <span key={i} className="inline-block mr-2">
                                {reason.kind === "aps_met" && "APS met"}
                                {reason.kind === "aps_short" && `APS short by ${reason.required - reason.learner}`}
                                {reason.kind === "subject_met" && `${reason.code} met`}
                                {reason.kind === "subject_short" && `${reason.code} short`}
                                {reason.kind === "missing_nbt" && "NBT required"}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* NSFAS Results */}
        {isNsfas && output && output.outcome && (
          <Card>
            <CardHeader>
              <CardTitle>NSFAS Eligibility Result</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-6">
                {output.outcome.status.includes("funded") || output.outcome.status === "auto_qualifies_sassa" ? (
                  <CheckCircle2 className="h-16 w-16 text-green-600" />
                ) : output.outcome.status === "needs_more_info" ? (
                  <HelpCircle className="h-16 w-16 text-yellow-600" />
                ) : (
                  <XCircle className="h-16 w-16 text-red-600" />
                )}
                <div>
                  <h2 className="text-2xl font-bold">
                    {formatNsfasStatus(output.outcome.status)}
                  </h2>
                  {output.outcome.reasons && output.outcome.reasons.length > 0 && (
                    <p className="text-gray-600 mt-1">
                      {output.outcome.reasons.map((r: any) => r.kind).join(", ")}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Bursary Results */}
        {isBursary && output && output.matches && (
          <Card>
            <CardHeader>
              <CardTitle>Matching Bursaries</CardTitle>
              <CardDescription>
                {output.eligible_count || 0} bursaries you may qualify for
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {output.matches.map((match: any, index: number) => (
                  <div
                    key={match.bursary_id || index}
                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-medium">{match.name}</h3>
                        <p className="text-sm text-gray-600">{match.provider}</p>
                      </div>
                      <BursaryStatusBadge status={match.status} />
                    </div>
                    {match.days_to_close !== undefined && (
                      <p className="text-sm text-gray-600">
                        {match.days_to_close > 0
                          ? `Closes in ${match.days_to_close} days`
                          : "Application closed"}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* TVET Results */}
        {isTvet && output && output.matches && (
          <Card>
            <CardHeader>
              <CardTitle>Matching TVET Programmes</CardTitle>
              <CardDescription>
                {output.qualifies_count || 0} programmes you qualify for
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {output.matches.map((match: any, index: number) => (
                  <div
                    key={match.programme_id || index}
                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-medium">{match.programme_name}</h3>
                        <p className="text-sm text-gray-600">
                          {match.college_name}
                          {match.same_province && (
                            <Badge variant="secondary" className="ml-2">In your province</Badge>
                          )}
                        </p>
                      </div>
                      <StatusBadge status={match.status} />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Engine version */}
        <div className="mt-6 text-center text-sm text-gray-400">
          Engine version: {result.engine_version}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, { bg: string; text: string }> = {
    qualifies: { bg: "bg-green-100", text: "text-green-800" },
    borderline: { bg: "bg-yellow-100", text: "text-yellow-800" },
    below: { bg: "bg-red-100", text: "text-red-800" },
    missing_info: { bg: "bg-gray-100", text: "text-gray-800" },
  };

  const variant = variants[status] || variants.missing_info;
  const labels: Record<string, string> = {
    qualifies: "Qualifies",
    borderline: "Borderline",
    below: "Below",
    missing_info: "Missing info",
  };

  return (
    <Badge className={`${variant.bg} ${variant.text} border-0`}>
      {labels[status] || status}
    </Badge>
  );
}

function BursaryStatusBadge({ status }: { status: string }) {
  const variants: Record<string, { bg: string; text: string }> = {
    eligible: { bg: "bg-green-100", text: "text-green-800" },
    partially_eligible: { bg: "bg-blue-100", text: "text-blue-800" },
    not_yet_open: { bg: "bg-gray-100", text: "text-gray-800" },
    closed: { bg: "bg-red-100", text: "text-red-800" },
    ineligible: { bg: "bg-red-100", text: "text-red-800" },
  };

  const variant = variants[status] || variants.ineligible;
  const labels: Record<string, string> = {
    eligible: "Eligible",
    partially_eligible: "Partially eligible",
    not_yet_open: "Not yet open",
    closed: "Closed",
    ineligible: "Not eligible",
  };

  return (
    <Badge className={`${variant.bg} ${variant.text} border-0`}>
      {labels[status] || status}
    </Badge>
  );
}

function formatNsfasStatus(status: string): string {
  const labels: Record<string, string> = {
    funded: "You qualify for NSFAS funding",
    funded_disability_threshold: "You qualify for NSFAS funding (disability threshold)",
    auto_qualifies_sassa: "You automatically qualify for NSFAS (SASSA recipient)",
    not_funded_income: "You do not qualify (household income too high)",
    not_funded_citizenship: "You do not qualify (citizenship requirements not met)",
    needs_more_info: "We need more information to determine your eligibility",
  };
  return labels[status] || status;
}
