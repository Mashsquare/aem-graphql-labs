"use client";

/** Provided — the search form. It only produces AdventureSearchCriteria; no GraphQL in here. */
import { Field, buttonClass, inputClass } from "@/components/lab-ui";
import type { AdventureSearchCriteria, AdventureSortKey } from "./types";

const ACTIVITIES = ["Camping", "Cycling", "Hiking", "Rock Climbing", "Skiing", "Social", "Surfing"];
const DIFFICULTIES = ["Beginner", "Intermediate", "Advanced", "Expert"];

const toNumber = (value: string) => (value === "" ? undefined : Number(value));

export function SearchForm({
  criteria,
  onChange,
  sort,
  onSortChange,
  countries,
}: {
  criteria: AdventureSearchCriteria;
  onChange: (criteria: AdventureSearchCriteria) => void;
  sort: AdventureSortKey;
  onSortChange: (sort: AdventureSortKey) => void;
  countries: string[];
}) {
  const set = (patch: Partial<AdventureSearchCriteria>) => onChange({ ...criteria, ...patch });
  const toggleActivity = (activity: string) =>
    set({
      activities: criteria.activities.includes(activity)
        ? criteria.activities.filter((item) => item !== activity)
        : [...criteria.activities, activity],
    });

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Title contains">
          <input value={criteria.search ?? ""} onChange={(event) => set({ search: event.target.value || undefined })} placeholder="camp" className={inputClass} />
        </Field>
        <Field label="Difficulty">
          <select value={criteria.difficulty ?? ""} onChange={(event) => set({ difficulty: event.target.value || undefined })} className={inputClass}>
            <option value="">any</option>
            {DIFFICULTIES.map((difficulty) => (
              <option key={difficulty}>{difficulty}</option>
            ))}
          </select>
        </Field>
        <Field label="Max price (USD)">
          <input type="number" step={100} min={0} value={criteria.maxPrice ?? ""} onChange={(event) => set({ maxPrice: toNumber(event.target.value) })} className={inputClass} />
        </Field>
        <Field label="Min group size">
          <input type="number" min={1} value={criteria.minGroupSize ?? ""} onChange={(event) => set({ minGroupSize: toNumber(event.target.value) })} className={inputClass} />
        </Field>
        <Field label="Country (nested filter)">
          <select value={criteria.country ?? ""} onChange={(event) => set({ country: event.target.value || undefined })} className={inputClass}>
            <option value="">any</option>
            {countries.map((country) => (
              <option key={country}>{country}</option>
            ))}
          </select>
        </Field>
        <Field label="Departs on/after">
          <input type="date" value={criteria.departureAfter ?? ""} onChange={(event) => set({ departureAfter: event.target.value || undefined })} className={inputClass} />
        </Field>
        <Field label="Sort">
          <select value={sort} onChange={(event) => onSortChange(event.target.value as AdventureSortKey)} className={inputClass}>
            <option value="title">Title</option>
            <option value="price-asc">Price ↑</option>
            <option value="price-desc">Price ↓</option>
            <option value="departure">Next departure</option>
          </select>
        </Field>
        <div className="flex items-end">
          <button onClick={() => onChange({ activities: [] })} className={buttonClass}>
            Reset
          </button>
        </div>
      </div>
      <fieldset className="flex flex-wrap gap-2">
        <legend className="mb-1 text-xs font-medium text-muted">Activity (any of — _logOp: OR)</legend>
        {ACTIVITIES.map((activity) => (
          <label key={activity} className={`${buttonClass} cursor-pointer gap-1.5 ${criteria.activities.includes(activity) ? "border-accent text-accent" : ""}`}>
            <input type="checkbox" className="sr-only" checked={criteria.activities.includes(activity)} onChange={() => toggleActivity(activity)} />
            {activity}
          </label>
        ))}
      </fieldset>
    </div>
  );
}
