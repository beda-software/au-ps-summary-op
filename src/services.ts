import { failure, FetchError, resolveArray, serviceFetch } from '@beda.software/remote-data';
import { getConfig } from './config';
import { PatientRelatedResource } from './types';

export interface SummurizeResourceResult {
  resource: PatientRelatedResource;
  summary: string;
}
export async function summurizeResources(resources: PatientRelatedResource[]) {
  const promises = [];

  for (const resource of resources) {
    promises.push(aiSummurizeResource(resource));
  }

  return resolveArray(promises);
}

export async function aiSummurizeResource(resource: PatientRelatedResource) {
  const config = getConfig();
  if (config.app.aiScriberUrl) {
    const url = new URL('summarize_resource', config.app.aiScriberUrl);
    return await serviceFetch<SummurizeResourceResult>(url, {
      body: JSON.stringify(resource),
      method: 'POST',
    });
  }

  return failure<FetchError>({ message: 'AI scriber is not configured' });
}
