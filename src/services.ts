import {
  failure,
  FetchError,
  resolveArray,
  serviceFetch,
} from "@beda.software/remote-data";
import { getConfig } from "./config";
import { PatientData, PatientDataResource } from "./types";

export interface SummurizeResourceResult {
  resource: PatientData;
  summary: string;
}
export async function summurizeResources(patientData: PatientData) {
  const promises = [];

  for (const item of patientData) {
    promises.push(aiSummurizeResource(item.resource));
  }

  return resolveArray(promises);
}

export async function aiSummurizeResource(resource: PatientDataResource) {
  const config = getConfig();
  if (config.app.scriberUrl) {
    const url = new URL("summarize_resource", config.app.scriberUrl);
    return await serviceFetch<SummurizeResourceResult>(url, {
      body: JSON.stringify(resource),
      method: "POST",
    });
  }

  return failure<FetchError>({ message: "AI scriber is not configured" });
}
