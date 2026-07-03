import type { Reason } from "../types";
import { explainReason } from "../shared/explain";

/**
 * Formats a list of reasons into a human-readable qualification statement.
 */
export function formatQualificationStatement(reasons: Reason[]): string {
  const parts: string[] = [];

  for (const reason of reasons) {
    const explanation = explainReason(reason);
    parts.push(explanation);
  }

  return parts.join(" ");
}

/**
 * Formats a short status explanation.
 */
export function formatStatusExplanation(
  status: string,
  apsGap?: number,
  subjectShortfall?: number,
): string {
  switch (status) {
    case "qualifies":
      return "All requirements met.";
    case "borderline":
      if (apsGap != null && apsGap > 0) {
        return `APS short by ${apsGap} point${apsGap !== 1 ? "s" : ""}.`;
      }
      if (subjectShortfall != null && subjectShortfall > 0) {
        return `Subject requirement short by ${subjectShortfall} level${subjectShortfall !== 1 ? "s" : ""}.`;
      }
      return "Close to meeting requirements.";
    case "below":
      return "Requirements not met.";
    case "missing_info":
      return "Additional information required.";
    default:
      return "";
  }
}
