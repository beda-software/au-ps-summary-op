import { Client as AidboxClient } from "@aidbox/sdk-r4";
import { AllergyIntolerance } from "@aidbox/sdk-r4/types/hl7-fhir-r4-core/AllergyIntolerance";
import { CarePlan } from "@aidbox/sdk-r4/types/hl7-fhir-r4-core/CarePlan";
import { Condition } from "@aidbox/sdk-r4/types/hl7-fhir-r4-core/Condition";
import { Consent } from "@aidbox/sdk-r4/types/hl7-fhir-r4-core/Consent";
import { DeviceUseStatement } from "@aidbox/sdk-r4/types/hl7-fhir-r4-core/DeviceUseStatement";
import { DiagnosticReport } from "@aidbox/sdk-r4/types/hl7-fhir-r4-core/DiagnosticReport";
import { Flag } from "@aidbox/sdk-r4/types/hl7-fhir-r4-core/Flag";
import { Immunization } from "@aidbox/sdk-r4/types/hl7-fhir-r4-core/Immunization";
import { Medication } from "@aidbox/sdk-r4/types/hl7-fhir-r4-core/Medication";
import { MedicationRequest } from "@aidbox/sdk-r4/types/hl7-fhir-r4-core/MedicationRequest";
import { MedicationStatement } from "@aidbox/sdk-r4/types/hl7-fhir-r4-core/MedicationStatement";
import { Observation } from "@aidbox/sdk-r4/types/hl7-fhir-r4-core/Observation";
import { Procedure } from "@aidbox/sdk-r4/types/hl7-fhir-r4-core/Procedure";
import { ImagingStudy } from "@aidbox/sdk-r4/types/hl7-fhir-r4-core/ImagingStudy";
import { FastifyReply, FastifyRequest } from "fastify";
type BasicAuthorization = {
  method: "basic";
  credentials: {
    username: string;
    password: string;
  };
};

export type Client = AidboxClient<BasicAuthorization>;

export type HttpClient = ReturnType<Client["HTTPClient"]>;

export type Request = FastifyRequest<{
  Params: { id: string };
  Body: {
    type: string;
    operation: {
      id: string;
    };
    request: {
      params: Record<string, string>;
      "route-params": Record<string, any>;
      headers: Record<string, any>;
      "oauth/user": Record<string, any>;
    };
  };
}>;

export interface Config {
  app: {
    port: number;
    baseUrl: string;
    callbackUrl: string;
    secret: string;
    id: string;
    scriberUrl?: string;
  };
  aidbox: {
    url: string;
    client: {
      id: string;
      secret: string;
    };
  };
}

export type AppResourceOperation = {
  method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  path: (string | { name: string })[];
};

export type Operations = Record<string, Operation>;

export type Operation<
  T extends Request = any,
  U = any,
> = AppResourceOperation & {
  handlerFn: (request: Request, reply: FastifyReply) => Promise<any>;
};

export type PatientDataResource =
  | Condition
  | AllergyIntolerance
  | Medication
  | MedicationRequest
  | MedicationStatement
  | Immunization
  | Procedure
  | DeviceUseStatement
  | DiagnosticReport
  | Observation
  | CarePlan
  | Consent
  | ImagingStudy
  | Flag;

export type PatientData = Array<{ resource: PatientDataResource }>;

export type SimpleNarrativeEntry = Array<{
  resource:
    | Condition
    | AllergyIntolerance
    | Medication
    | Immunization
    | Observation;
}>;

export type SectionName =
  | "ProblemList"
  | "AllergyIntolerance"
  | "MedicationSummary"
  | "Immunizations"
  | "HistoryOfPregnancy"
  | "Encounters"
  | "RelatedPersons"
  | "DocumentReferences"
  | "Consents"
  | "CarePlans"
  | "ClinicalImpressions"
  | "Specimens"
  | "Devices"
  | "DeviceUseStatements"
  | "DiagnosticReports"
  | "ImagingStudies"
  | "ObservationPregnancyEdd"
  | "ObservationPregnancyOutcome"
  | "ObservationPregnancyStatus"
  | "ObservationAlcoholUse"
  | "ObservationTobaccoUse"
  | "ObservationLabPath"
  | "ObservationResultRadiology"
  | "ObservationVitalSigns"
  | "Procedures"
  | "Flags";

export type IpsProfile =
  | "http://hl7.org.au/fhir/ps/StructureDefinition/au-ps-allergyintolerance"
  | "http://hl7.org.au/fhir/ps/StructureDefinition/au-ps-condition"
  | "http://hl7.org.au/fhir/ps/StructureDefinition/au-ps-encounter"
  | "http://hl7.org.au/fhir/ps/StructureDefinition/au-ps-immunization"
  | "http://hl7.org.au/fhir/ps/StructureDefinition/au-ps-medication"
  | "http://hl7.org.au/fhir/ps/StructureDefinition/au-ps-medicationstatement"
  | "http://hl7.org.au/fhir/ps/StructureDefinition/au-ps-medicationrequest"
  | "http://hl7.org.au/fhir/ps/StructureDefinition/au-ps-organization"
  | "http://hl7.org.au/fhir/ps/StructureDefinition/au-ps-patient"
  | "http://hl7.org.au/fhir/ps/StructureDefinition/au-ps-practitioner"
  | "http://hl7.org.au/fhir/ps/StructureDefinition/au-ps-practitionerrole"
  | "http://hl7.org.au/fhir/ps/StructureDefinition/au-ps-procedure"
  | "http://hl7.org.au/fhir/ps/StructureDefinition/au-ps-relatedperson"
  | "http://hl7.org.au/fhir/core/StructureDefinition/au-core-location"
  | "http://hl7.org/fhir/uv/ips/StructureDefinition/Device-uv-ips"
  | "http://hl7.org/fhir/uv/ips/StructureDefinition/DeviceUseStatement-uv-ips"
  | "http://hl7.org/fhir/uv/ips/StructureDefinition/DiagnosticReport-uv-ips"
  | "http://hl7.org/fhir/uv/ips/StructureDefinition/Observation-results-laboratory-pathology-uv-ips"
  | "http://hl7.org/fhir/uv/ips/StructureDefinition/Observation-results-radiology-uv-ips"
  | "http://hl7.org/fhir/StructureDefinition/DocumentReference"
  | "http://hl7.org/fhir/StructureDefinition/Consent"
  | "http://hl7.org/fhir/StructureDefinition/CarePlan"
  | "http://hl7.org/fhir/structuredefinition/clinicalimpression"
  | "http://hl7.org/fhir/uv/ips/StructureDefinition/Specimen-uv-ips"
  | "http://hl7.org/fhir/StructureDefinition/Device"
  | "http://hl7.org/fhir/uv/ips/StructureDefinition/DeviceUseStatement-uv-ips"
  | "http://hl7.org/fhir/uv/ips/StructureDefinition/DiagnosticReport-uv-ips"
  | "http://hl7.org/fhir/uv/ips/StructureDefinition/ImagingStudy-uv-ips"
  | "http://hl7.org/fhir/uv/ips/StructureDefinition/Observation-pregnancy-edd-uv-ips"
  | "http://hl7.org/fhir/uv/ips/StructureDefinition/Observation-pregnancy-outcome-uv-ips"
  | "http://hl7.org/fhir/uv/ips/StructureDefinition/Observation-pregnancy-status-uv-ips"
  | "http://hl7.org/fhir/uv/ips/StructureDefinition/Observation-alcoholuse-uv-ips"
  | "http://hl7.org/fhir/uv/ips/StructureDefinition/Observation-tobaccouse-uv-ips"
  | "http://hl7.org/fhir/uv/ips/StructureDefinition/Observation-results-laboratory-pathology-uv-ips"
  | "http://hl7.org/fhir/uv/ips/StructureDefinition/Observation-results-radiology-uv-ips"
  | "http://hl7.org/fhir/StructureDefinition/vitalsigns"
  | "http://hl7.org/fhir/uv/ips/StructureDefinition/Flag-alert-uv-ips";
export type SectionToGenerateFuncMap = {
  [K in SectionName]?: any;
};

export type BundleEntry = Array<{
  request: {
    method: string;
    url: string;
  };
}>;

export type SectionProfiles = {
  [K in SectionName]: Record<string, Array<string>>;
};

export type SectionProfilesSearches = {
  [k in IpsProfile]: string | null;
};
