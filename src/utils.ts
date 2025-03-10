import { StructuredSummary } from "./services";

export function filterSummaryByKeys(
  summary: StructuredSummary,
  keys: Array<keyof StructuredSummary>
) {
  let filteredSummary = "";
  for (const [key, value] of Object.entries(summary)) {
    if (keys.includes(key as keyof StructuredSummary)) {
      if (filteredSummary.length > 0) {
        filteredSummary = filteredSummary.concat("\n", value);
      } else {
        filteredSummary = value;
      }
    }
  }
  return filteredSummary;
}
