import {
  failure,
  FetchError,
  resolveArray,
  serviceFetch,
  success,
} from "@beda.software/remote-data";
import { PatientData, PatientDataResource } from "./types";

export interface SummurizeResourceResult {
  resource: PatientDataResource;
  summary: string;
}

export interface TotalSummaryResult {
  input: string;
  summary: string;
}

export interface StructuredSummary {
  demographics: string;
  problem_list: string;
  past_medical_history: string;
  medications: string;
  allergies: string;
  immunizations: string;
  procedures: string;
  vital_signs: string;
  recent_lab_results: string;
  encounters: string;
  care_plan: string;
}

export async function summurizeResources(
  scriberBaseUrl: string,
  patientData: PatientData
) {
  const promises = [];
  const url = new URL("summarize_resource", scriberBaseUrl);
  for (const item of patientData) {
    promises.push(aiSummurizeResource(url, item.resource));
  }

  return resolveArray(promises);
}

export async function aiSummurizeResource(
  summarizeUrl: string | URL,
  resource: PatientDataResource
) {
  const resp = await serviceFetch<SummurizeResourceResult>(summarizeUrl, {
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(resource),
    method: "POST",
  });

  return resp;
}

export async function generateTotalSummary(
  scriberBaseUrl: string,
  patientData: PatientData
) {
  let sourceString = "";
  for (const item of patientData) {
    if (item.summary) {
      sourceString = sourceString.concat("/n", item.summary);
    }
  }

  if (sourceString.length === 0) {
    return failure<FetchError>({ message: "There are no prepared summaries" });
  }

  const url = new URL("summarize", scriberBaseUrl);
  const resp = await serviceFetch<TotalSummaryResult>(url, {
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ purpose: "General Summary", data: sourceString }),
    method: "POST",
  });

  return resp;
}
