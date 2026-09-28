// Option lists for the admin editors. Values match what the matching engine
// reads (src/engine/schemas.ts), so saved records work in the journeys as-is.

export const PROVINCES = [
  { value: "EC", label: "Eastern Cape" },
  { value: "FS", label: "Free State" },
  { value: "GP", label: "Gauteng" },
  { value: "KZN", label: "KwaZulu-Natal" },
  { value: "LP", label: "Limpopo" },
  { value: "MP", label: "Mpumalanga" },
  { value: "NC", label: "Northern Cape" },
  { value: "NW", label: "North West" },
  { value: "WC", label: "Western Cape" },
] as const;

export const UNI_TYPES = [
  { value: "traditional", label: "Traditional university" },
  { value: "university_of_technology", label: "University of technology" },
  { value: "comprehensive", label: "Comprehensive university" },
] as const;

export const FIELDS_OF_STUDY = [
  { value: "health", label: "Health sciences" },
  { value: "engineering", label: "Engineering" },
  { value: "commerce", label: "Commerce" },
  { value: "humanities", label: "Humanities" },
  { value: "law", label: "Law" },
  { value: "education", label: "Education" },
  { value: "science", label: "Science" },
  { value: "it", label: "IT" },
  { value: "arts", label: "Arts" },
  { value: "agriculture", label: "Agriculture" },
] as const;

export const CITIZENSHIP = [
  { value: "sa_citizen", label: "SA citizens" },
  { value: "sa_permanent_resident", label: "SA permanent residents" },
] as const;

export function labelFor(
  options: readonly { value: string; label: string }[],
  value: string | null | undefined,
) {
  return options.find((o) => o.value === value)?.label ?? value ?? "";
}

/** "Wits University" -> "wits-university" */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function isHttpUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

/** Blank strings become null so optional columns stay empty rather than "". */
export function nullIfBlank(value: string | null | undefined): string | null {
  const v = (value ?? "").trim();
  return v === "" ? null : v;
}
