import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { EmptyNotice } from "@/components/site/directory";
import { OpportunityCard } from "@/components/site/opportunity-card";
import { FIELDS_OF_STUDY, PROVINCES } from "@/lib/admin-options";
import {
  EDUCATION_LEVELS,
  fitsLearner,
  opportunityStatus,
  sortByStatus,
  type OpportunityListItem,
} from "@/lib/opportunities";

const selectClass =
  "h-11 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

/**
 * Filters published opportunities by what the learner tells us (education,
 * province, age, field). Anything left blank doesn't narrow the list.
 * Closed ones are left out and counted, so learners know to watch for the
 * next intake.
 */
export function OpportunityFinder({
  opportunities,
  educationChoices,
  defaultEducation,
  noun,
}: {
  opportunities: OpportunityListItem[];
  educationChoices: readonly string[];
  defaultEducation: string;
  noun: string;
}) {
  const [education, setEducation] = useState(defaultEducation);
  const [province, setProvince] = useState("");
  const [field, setField] = useState("");
  const [age, setAge] = useState("");

  const { current, closed } = useMemo(() => {
    const learner = { education, province, field, age: age ? Number(age) : null };
    const fitting = sortByStatus(
      opportunities
        .filter((o) => fitsLearner(o, learner))
        .map((o) => ({ ...o, status: opportunityStatus(o) })),
    );
    return {
      current: fitting.filter((o) => o.status.kind !== "closed"),
      closed: fitting.filter((o) => o.status.kind === "closed").length,
    };
  }, [opportunities, education, province, field, age]);

  const levels = EDUCATION_LEVELS.filter((l) => educationChoices.includes(l.value));

  return (
    <div className="space-y-6">
      <div className="grid gap-3 rounded-lg border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Your highest qualification</span>
          <select
            value={education}
            onChange={(e) => setEducation(e.target.value)}
            className={selectClass}
          >
            {levels.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>
        </label>
        <Choice
          label="Where you live"
          any="Any province"
          value={province}
          onChange={setProvince}
          options={PROVINCES}
        />
        <Choice
          label="Field you're interested in"
          any="Any field"
          value={field}
          onChange={setField}
          options={FIELDS_OF_STUDY}
        />
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Your age (optional)</span>
          <input
            inputMode="numeric"
            value={age}
            onChange={(e) => setAge(e.target.value.replace(/\D/g, "").slice(0, 2))}
            placeholder="e.g. 21"
            className={selectClass}
          />
        </label>
      </div>

      {opportunities.length === 0 ? (
        <EmptyNotice title={`We're adding verified ${noun}.`}>
          Every one is checked against the company's official advert before it appears here. Please
          check back soon.
        </EmptyNotice>
      ) : current.length === 0 ? (
        <EmptyNotice title={`No open ${noun} fit these answers right now.`}>
          Try "Any province" or "Any field", or{" "}
          <Link to="/opportunities" className="font-medium text-primary hover:underline">
            browse everything
          </Link>
          .
        </EmptyNotice>
      ) : (
        <section>
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {current.length === 1 ? `1 fits you` : `${current.length} fit you`}, open ones first.
          </p>
          <ul className="mt-3 grid gap-4 md:grid-cols-2">
            {current.map((o) => (
              <li key={o.id}>
                <OpportunityCard o={o} status={o.status} />
              </li>
            ))}
          </ul>
        </section>
      )}
      {closed > 0 && (
        <p className="text-sm text-muted-foreground">
          {closed === 1 ? "1 more that fits you has" : `${closed} more that fit you have`} closed
          for this intake. Many open again each year, so{" "}
          <Link to="/opportunities" className="font-medium text-primary hover:underline">
            check back
          </Link>
          .
        </p>
      )}
    </div>
  );
}

function Choice({
  label,
  any,
  value,
  onChange,
  options,
}: {
  label: string;
  any: string;
  value: string;
  onChange: (v: string) => void;
  options: readonly { value: string; label: string }[];
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className={selectClass}>
        <option value="">{any}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
