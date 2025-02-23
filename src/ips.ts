import { randomUUID } from "node:crypto";
import { generateCompositionNarrative, generateSimpleNarrative } from "./narrative.js";
import {
  BundleEntry,
  HttpClient,
  PatientData,
  SectionName,
  SectionProfiles,
  SectionToGenerateFuncMap,
  SimpleNarrativeEntry,
} from "./types";
import { DomainResource } from "@aidbox/sdk-r4/types/index.js";
import Fastify from "fastify";
import { ClinicalImpressionStatus } from "@aidbox/sdk-r4/types/hl7-fhir-r4-core/ClinicalImpression.js";

const buildReference = (resourceType: string, id: string) => {
  return `${resourceType}/${id}`;
}

const addEntry = (patientData: PatientData) => {
  if (patientData.length === 0) return {};
  return {
    entry: patientData.map((resource) => ({
      reference: buildReference(resource.resource.resourceType, resource.resource.id!),
    })),
  };
};

const buildSection = (
  sectionData: { title: string; code: any; text: { status: string; div: string } },
  entry: PatientData
) => {
  if (entry.length === 0) return null;

  return {
    ...sectionData,
    ...addEntry(entry),
  };
};

const sectionProfiles: SectionProfiles = {
  MedicationSummary: {
    MedicationStatement: [
      "http://hl7.org.au/fhir/ps/StructureDefinition/au-ps-medicationstatement",
    ],
    MedicationRequest: [
      "http://hl7.org.au/fhir/ps/StructureDefinition/au-ps-medicationrequest",
    ],
  },
  AllergyIntolerance: {
    AllergyIntolerance: [
      "http://hl7.org.au/fhir/ps/StructureDefinition/au-ps-allergyintolerance",
    ],
  },
  ProblemList: {
    Condition: ["http://hl7.org.au/fhir/ps/StructureDefinition/au-ps-condition"],
  },
  Immunizations: {
    Immunization: ["http://hl7.org.au/fhir/ps/StructureDefinition/au-ps-immunization"],
  },
  Encounters: {
    Encounter: ["http://hl7.org.au/fhir/ps/StructureDefinition/au-ps-encounter"]
  },
  RelatedPersons: {
    RelatedPerson: ["http://hl7.org.au/fhir/ps/StructureDefinition/au-ps-relatedperson"]
  },
  DocumentReferences: {
    DocumentReference: ["http://hl7.org/fhir/StructureDefinition/DocumentReference"]
  },
  Consents: {
    Consent: ["http://hl7.org/fhir/StructureDefinition/Consent"]
  },
  CarePlans: {
    CarePlan: ["http://hl7.org/fhir/StructureDefinition/CarePlan"]
  },
  ClinicalImpressions: {
    ClinicalImpression: ["http://hl7.org/fhir/structuredefinition/clinicalimpression"]
  },
  Flags: {
    Flag: ["http://hl7.org/fhir/uv/ips/StructureDefinition/Flag-alert-uv-ips"]
  },
  Specimens: {
    Specimen: ["http://hl7.org/fhir/uv/ips/StructureDefinition/Specimen-uv-ips"]
  },
  Devices: {
    Device: ["http://hl7.org/fhir/StructureDefinition/Device"]
  },
  DeviceUseStatements: {
    DeviceUseStatement: ["http://hl7.org/fhir/uv/ips/StructureDefinition/DeviceUseStatement-uv-ips"]
  },
  DiagnosticReports: {
    DiagnosticReport: ["http://hl7.org/fhir/uv/ips/StructureDefinition/DiagnosticReport-uv-ips"]
  },
  ImagingStudies: {
    ImagingStudy: ["http://hl7.org/fhir/uv/ips/StructureDefinition/ImagingStudy-uv-ips"]
  },
  ObservationPregnancyEdd: {
    Observation: ["http://hl7.org/fhir/uv/ips/StructureDefinition/Observation-pregnancy-edd-uv-ips"]
  },
  ObservationPregnancyOutcome: {
    Observation: ["http://hl7.org/fhir/uv/ips/StructureDefinition/Observation-pregnancy-outcome-uv-ips"]
  },
  ObservationPregnancyStatus: {
    Observation: ["http://hl7.org/fhir/uv/ips/StructureDefinition/Observation-pregnancy-status-uv-ips"]
  },
  ObservationAlcoholUse: {
    Observation: ["http://hl7.org/fhir/uv/ips/StructureDefinition/Observation-alcoholuse-uv-ips"]
  },
  ObservationTobaccoUse: {
    Observation: ["http://hl7.org/fhir/uv/ips/StructureDefinition/Observation-tobaccouse-uv-ips"]
  },
  ObservationLabPath: {
    Observation: ["http://hl7.org/fhir/uv/ips/StructureDefinition/Observation-results-laboratory-pathology-uv-ips"]
  },
  ObservationResultRadiology: {
    Observation: ["http://hl7.org/fhir/uv/ips/StructureDefinition/Observation-results-radiology-uv-ips"]
  },
  ObservationVitalSigns: {
    Observation: ["http://hl7.org/fhir/StructureDefinition/vitalsigns"]
  },
  Procedures: {
    Procedure: ["http://hl7.org.au/fhir/ps/StructureDefinition/au-ps-procedure"]
  }
};

const findIntersection = (
  sectionProfiles: Array<string>,
  resourceProfiles: Array<string>
) => sectionProfiles.find((profile) => resourceProfiles.includes(profile));

const validateByAidbox = async (
  http: HttpClient,
  resource: DomainResource,
  resourceType: string,
  sectionProfile: string
) => {
  return http.post(`fhir/${resourceType}/$validate`, {
    searchParams: {
      "profile": sectionProfile
    },
    json: resource,
  });
}

const getSectionResources = (
  patientData: PatientData,
  sectionsProfiles: Record<string, Array<string>>
) => {
  return patientData.reduce((acc: PatientData, { resource }) => {
    const rightResourceType = Object.keys(sectionsProfiles).includes(
      resource.resourceType
    );

    if (rightResourceType) {
      acc.push({ resource });
    }
    return acc;
  }, []);
};

// ----- Required sections -----
const generateProblemListSection = (patientData: PatientData) => {
  const validConditions = getSectionResources(patientData, sectionProfiles.ProblemList);

  const section = {
    title: "IPS Problems Section",
    code: {
      coding: [
        {
          system: "http://loinc.org",
          code: "11450-4",
          display: "Problem list - Reported",
        },
      ],
    },
    text: generateSimpleNarrative(validConditions as SimpleNarrativeEntry),
    ...addEntry(validConditions),
  };

  return section;
};

const generateAllergyIntoleranceSection = (patientData: PatientData) => {
  const validAllergies = getSectionResources(
    patientData,
    sectionProfiles.AllergyIntolerance
  );

  const section = {
    title: "IPS Allergies and Intolerances Section",
    code: {
      coding: [
        {
          system: "http://loinc.org",
          code: "48765-2",
          display: "Allergies and adverse reactions Document",
        },
      ],
    },
    text: generateSimpleNarrative(validAllergies as SimpleNarrativeEntry),
    ...addEntry(validAllergies),
  };

  return section;
};

const generateMedicationSummarySection = (patientData: PatientData) => {
  const validMedications = getSectionResources(
    patientData,
    sectionProfiles.MedicationSummary
  );

  const section = {
    title: "Medication Summary section",
    code: {
      coding: [
        {
          system: "http://loinc.org",
          code: "10160-0",
          display: "History of Medication use Narrative",
        },
      ],
    },
    text: generateSimpleNarrative(validMedications as SimpleNarrativeEntry),
    ...addEntry(validMedications),
  };

  return section;
};

// ----- Recommended sections -----
const generateImmunizationsSection = (patientData: PatientData) => {
  const validImmunizations = getSectionResources(
    patientData,
    sectionProfiles.Immunizations
  );

  const section = {
    title: "Immunizations Section",
    code: {
      coding: [
        {
          system: "http://loinc.org",
          code: "11369-6",
          display: "History of Immunization Narrative",
        },
      ],
    },
    text: generateSimpleNarrative(validImmunizations as SimpleNarrativeEntry),
  };

  return buildSection(section, validImmunizations);
};


// ----- Optional sections -----

const sectionNames: Array<SectionName> = [
  "ProblemList",
  "AllergyIntolerance",
  "MedicationSummary",
  "Immunizations",
  "Encounters",
  "RelatedPersons",
  "DocumentReferences",
  "Consents",
  "CarePlans",
  "ClinicalImpressions",
  "Specimens",
  "Devices",
  "DeviceUseStatements",
  "DiagnosticReports",
  "ImagingStudies",
  "ObservationPregnancyEdd",
  "ObservationPregnancyOutcome",
  "ObservationPregnancyStatus",
  "ObservationAlcoholUse",
  "ObservationTobaccoUse",
  "ObservationLabPath",
  "ObservationResultRadiology",
  "ObservationVitalSigns",
  "Flags",
  "Procedures"
];

const sectionToGenerateFuncMap: SectionToGenerateFuncMap = {
  ProblemList: generateProblemListSection,
  AllergyIntolerance: generateAllergyIntoleranceSection,
  MedicationSummary: generateMedicationSummarySection,
  Immunizations: generateImmunizationsSection,
  Encounters: () => {},
  RelatedPersons: () => {},
  DocumentReferences: () => {},
  Consents: () => {},
  CarePlans: () => {},
  ClinicalImpressions: () => {},
  Flags: () => {},
  Devices: () => {},
  Specimens: () => {},
  DeviceUseStatements: () => {},
  DiagnosticReports: () => {},
  ObservationPregnancyEdd: () => {},
  ObservationPregnancyOutcome: () => {},
  ObservationPregnancyStatus: () => {},
  ObservationAlcoholUse: () => {},
  ObservationTobaccoUse: () => {},
  ObservationLabPath: () => {},
  ObservationResultRadiology: () => {},
  ObservationVitalSigns: () => {},
  ImagingStudies: () => {},
  Procedures: () => {},
};

export const addFullUrl = (
  resources: Array<{ resource: { id: string; resourceType: string } }>,
  aidboxBaseUrl: string
) => {
  return resources.reduce(
    (acc, item) => {
      acc.push({
        resource: item.resource,
        fullUrl: `${aidboxBaseUrl}/fhir/${item.resource.resourceType}/${item.resource.id}`,
      });
      return acc;
    },
    [] as Array<{ resource: { id: string }; fullUrl: string }>
  );
};

const buildQueryForSection = (
  resourceType: string,
  patientId: string
): string => {
    return `/fhir/${resourceType}?patient=${patientId}`;
};

const fetchSummaryResources = async (http: HttpClient, patientId: string) => {
  const resourceTypes = sectionNames.reduce((acc: Set<string>, sectionName) => {

    Object.keys(sectionProfiles[sectionName]).map(
      (resourceType) => acc.add(resourceType)
    );

    return acc;
  }, new Set<string>());

  const entries = [...resourceTypes].map((resourceType) => ({
    request: { method: "GET", url: buildQueryForSection(resourceType, patientId) },
  }));

  const { response }: any = await http.post("", {
    json: {
      resourceType: "Bundle",
      type: "transaction",
      entry: entries,
    },
  });


  return response.data?.entry?.reduce((acc: PatientData, item: any) => {
    if (item.resource?.total > 0) {
      acc.push(...item.resource?.entry);
    }
    return acc;
  }, []);
};

const filterResourcesByProfiles = async (http: HttpClient, patientData: PatientData) => {
  const newPatientData: PatientData = [];
  const profileData: Record<string, Array<string>> = {};

  for (const resource of patientData) {
    let verifiedOnce = false;
    const resourceType = resource.resource.resourceType;
    console.log('resourceType', resourceType)

    for (const sectionName of sectionNames) {
      const sectionProfileEntries = Object.entries(sectionProfiles[sectionName]);

      for (const [profileResourceType, profiles] of sectionProfileEntries) {
        if (resourceType === profileResourceType) {
          for (const profile of profiles as Array<string>) {
            const result = await validateByAidbox(http, resource.resource, resourceType, profile);
            const validationResult = (result.response.data as Record<string, any>)["id"] as string;
            console.log('validationResult', validationResult)
            if (validationResult === "allok") {
              verifiedOnce = true;

              if (!profileData[sectionName]) {
                profileData[sectionName] = [];
              }
              profileData[sectionName].push(buildReference(resourceType, resource.resource.id!));
            }
          }
        }
      }
    }

    if (verifiedOnce) {
      newPatientData.push(resource);
    }
  }

  return { patientData: newPatientData, profileData: profileData };
};

export const generateSections = async (http: HttpClient, patientId: string) => {
  const resources = await fetchSummaryResources(http, patientId);
  const {patientData, profileData} = await filterResourcesByProfiles(http, resources);
  const sections = sectionNames.reduce((acc: any, item) => {
    const section = sectionToGenerateFuncMap[item](patientData, http);

    if (section) {
      acc.push(section);
    }

    return acc;
  }, []);

  return { sections, bundleData: patientData };
};

const getRefs = (data: Array<{ reference: string }>) =>
  data.map(({ reference }) => reference);

export const getResourcesFromRefs = async (
  http: HttpClient,
  patientData: PatientData
) => {
  const { refs, bundleResources } = patientData.reduce(
    (acc: { refs: Array<string>; bundleResources: Array<string> }, { resource }: any) => {
      const performerRef = resource.performer ? getRefs(resource.performer) : [];
      const partOfRef = resource.partOf ? getRefs(resource.partOf) : [];
      const hasMemberRef = resource.hasMember ? getRefs(resource.hasMember) : [];
      const deviceRef = resource.device?.reference ? [resource.device?.reference] : [];
      const medicationRef = resource.medicationReference?.reference
        ? [resource.medicationReference?.reference]
        : [];
      const resourceRef = `${resource.resourceType}/${resource.id}`;
      return {
        refs: [
          ...acc.refs,
          ...performerRef,
          ...partOfRef,
          ...hasMemberRef,
          ...deviceRef,
          ...medicationRef,
        ],
        bundleResources: [...acc.bundleResources, resourceRef],
      };
    },
    {
      refs: [],
      bundleResources: [],
    }
  );

  const uniqueRefs = [...new Set(refs)];
  const missingRefs = uniqueRefs.filter((ref) => bundleResources.indexOf(ref) < 0);

  const bundleEntry = missingRefs.reduce(
    (acc: BundleEntry, ref: string) => {
      acc.push({
        request: { method: "GET", url: `/fhir/${ref}` },
      });
      return acc;
    },
    [
      {
        request: { method: "GET", url: "/fhir/Organization/TII-Organization1dddd" },
      },
    ]
  );

  const { response }: any = await http.post("", {
    json: {
      resourceType: "Bundle",
      type: "batch",
      entry: bundleEntry,
    },
  });

  return response.data?.entry?.reduce((acc: PatientData, item: any) => {
    if (item.response?.status == 200) {
      acc.push({ resource: item.resource });
    }
    return acc;
  }, []);
};

export const createComposition = (sections: any, patientId: string) => {
  const now = new Date();

  const composition = {
    resourceType: "Composition",
    id: randomUUID(),
    meta: {
      profile: ["http://hl7.org.au/fhir/ps/StructureDefinition/au-ps-composition"],
    },
    date: now.toISOString(),
    status: "final",
    type: {
      coding: [
        {
          system: "http://loinc.org",
          code: "60591-5",
          display: "Patient summary Document",
        },
      ],
    },
    subject: {
      reference: `Patient/${patientId}`,
    },
    author: [
      {
        display: "Aidbox",
        type: "Device",
      },
    ],
    title: `Patient Summary as of ${now.toString()}`,
    event: [
      {
        code: [
          {
            coding: [
              {
                system: "http://terminology.hl7.org/CodeSystem/v3-ActClass",
                code: "PCPR",
              },
            ],
          },
        ],
        period: {
          end: now.toISOString(),
        },
      },
    ],
    section: sections,
  };

  return {
    ...composition,
    text: generateCompositionNarrative({
      id: composition.id,
      status: composition.status,
      title: composition.title,
      eventDate: composition.event[0].period.end,
    }),
  };
};
