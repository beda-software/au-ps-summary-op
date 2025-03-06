import { getConfig } from './config';
import { PatientRelatedResource } from './types';

export async function aiSummurizeResource(resource: PatientRelatedResource) {
  const config = getConfig();
  if (config.app.aiScriberUrl) {
    return await fetch(config.app.aiScriberUrl, { method: 'POST', body: JSON.stringify(resource) });
  }
}
