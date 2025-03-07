import { randomUUID } from "node:crypto";
import {
  generateCompositionNarrative,
  generateSimpleNarrative,
} from "./narrative.js";
import {
  BundleEntry,
  Config,
  HttpClient,
  PatientData,
  SectionName,
  SectionProfiles,
  SectionToGenerateFuncMap,
  SimpleNarrativeEntry,
} from "./types";
import { DomainResource, Narrative } from "@aidbox/sdk-r4/types/index.js";
import Fastify from "fastify";
import { ClinicalImpressionStatus } from "@aidbox/sdk-r4/types/hl7-fhir-r4-core/ClinicalImpression.js";
import { generateTotalSummary } from "./services.js";
import { isSuccess } from "@beda.software/remote-data";
import { CompositionSection } from "@aidbox/sdk-r4/types/hl7-fhir-r4-core/Composition.js";

export const createDevice = () => {
  return {
    resourceType: "Device",
    meta: {
      profile: ["http://hl7.org/fhir/StructureDefinition/Device"],
    },
    manufacturer: "CSIRO",
    deviceName: [
      {
        name: "AU Patient Summary generator (Aidbox)",
        type: "manufacturer-name",
      },
    ],
  };
};

const buildReference = (resourceType: string, id: string) => {
  return `${resourceType}/${id}`;
};

const buildReferenceByUrl = (
  aidboxUrl: string,
  resourceType: string,
  id: string
) => {
  return `${aidboxUrl}/fhir/${resourceType}/${id}`;
};

const addEntry = (patientData: PatientData, aidboxUrl: string) => {
  if (patientData.length === 0) return {};
  return {
    entry: patientData.map((resource) => ({
      reference: buildReferenceByUrl(
        aidboxUrl,
        resource.resource.resourceType,
        resource.resource.id!
      ),
    })),
  };
};

const buildSection = (
  sectionData: {
    title: string;
    code: any;
    text: { status: string; div: string };
  },
  entry: PatientData,
  aidboxUrl: string
) => {
  if (entry.length === 0) return null;

  return {
    ...sectionData,
    ...addEntry(entry, aidboxUrl),
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
    Condition: [
      "http://hl7.org.au/fhir/ps/StructureDefinition/au-ps-condition",
    ],
  },
  Immunizations: {
    Immunization: [
      "http://hl7.org.au/fhir/ps/StructureDefinition/au-ps-immunization",
    ],
  },
  HistoryOfPregnancy: {
    Observation: [
      "http://hl7.org/fhir/uv/ips/StructureDefinition/Observation-pregnancy-outcome-uv-ips",
      "http://hl7.org/fhir/uv/ips/StructureDefinition/Observation-pregnancy-status-uv-ips",
    ],
  },
  Encounters: {
    Encounter: [
      "http://hl7.org.au/fhir/ps/StructureDefinition/au-ps-encounter",
    ],
  },
  RelatedPersons: {
    RelatedPerson: [
      "http://hl7.org.au/fhir/ps/StructureDefinition/au-ps-relatedperson",
    ],
  },
  DocumentReferences: {
    DocumentReference: [
      "http://hl7.org/fhir/StructureDefinition/DocumentReference",
    ],
  },
  Consents: {
    Consent: ["http://hl7.org/fhir/StructureDefinition/Consent"],
  },
  CarePlans: {
    CarePlan: ["http://hl7.org/fhir/StructureDefinition/CarePlan"],
  },
  ClinicalImpressions: {
    ClinicalImpression: [
      "http://hl7.org/fhir/structuredefinition/clinicalimpression",
    ],
  },
  Flags: {
    Flag: ["http://hl7.org/fhir/uv/ips/StructureDefinition/Flag-alert-uv-ips"],
  },
  Specimens: {
    Specimen: [
      "http://hl7.org/fhir/uv/ips/StructureDefinition/Specimen-uv-ips",
    ],
  },
  Devices: {
    Device: ["http://hl7.org/fhir/StructureDefinition/Device"],
  },
  DeviceUseStatements: {
    DeviceUseStatement: [
      "http://hl7.org/fhir/uv/ips/StructureDefinition/DeviceUseStatement-uv-ips",
    ],
  },
  DiagnosticReports: {
    DiagnosticReport: [
      "http://hl7.org/fhir/uv/ips/StructureDefinition/DiagnosticReport-uv-ips",
    ],
  },
  ImagingStudies: {
    ImagingStudy: [
      "http://hl7.org/fhir/uv/ips/StructureDefinition/ImagingStudy-uv-ips",
    ],
  },
  ObservationPregnancyEdd: {
    Observation: [
      "http://hl7.org/fhir/uv/ips/StructureDefinition/Observation-pregnancy-edd-uv-ips",
    ],
  },
  ObservationPregnancyOutcome: {
    Observation: [
      "http://hl7.org/fhir/uv/ips/StructureDefinition/Observation-pregnancy-outcome-uv-ips",
    ],
  },
  ObservationPregnancyStatus: {
    Observation: [
      "http://hl7.org/fhir/uv/ips/StructureDefinition/Observation-pregnancy-status-uv-ips",
    ],
  },
  ObservationAlcoholUse: {
    Observation: [
      "http://hl7.org/fhir/uv/ips/StructureDefinition/Observation-alcoholuse-uv-ips",
    ],
  },
  ObservationTobaccoUse: {
    Observation: [
      "http://hl7.org/fhir/uv/ips/StructureDefinition/Observation-tobaccouse-uv-ips",
    ],
  },
  ObservationLabPath: {
    Observation: [
      "http://hl7.org/fhir/uv/ips/StructureDefinition/Observation-results-laboratory-pathology-uv-ips",
    ],
  },
  ObservationResultRadiology: {
    Observation: [
      "http://hl7.org/fhir/uv/ips/StructureDefinition/Observation-results-radiology-uv-ips",
    ],
  },
  ObservationVitalSigns: {
    Observation: ["http://hl7.org/fhir/StructureDefinition/vitalsigns"],
  },
  Procedures: {
    Procedure: [
      "http://hl7.org.au/fhir/ps/StructureDefinition/au-ps-procedure",
    ],
  },
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
      profile: sectionProfile,
    },
    json: resource,
  });
};

const getSectionResources = (
  patientData: PatientData,
  sectionsProfiles: Record<string, Array<string>>
) => {
  return patientData.reduce((acc: PatientData, { resource, summary }) => {
    const rightResourceType = Object.keys(sectionsProfiles).includes(
      resource.resourceType
    );

    if (rightResourceType) {
      acc.push({ resource, summary });
    }
    return acc;
  }, []);
};

const addEmptyReason = (entries: any[]) => {
  return entries.length === 0
    ? {
        emptyReason: {
          coding: [
            {
              system: "http://terminology.hl7.org/CodeSystem/list-empty-reason",
              code: "unavailable",
              display: "Unavailable",
            },
          ],
          text: "No information available",
        },
      }
    : {};
};

// ----- Required sections -----
const generateProblemListSection = async (
  patientData: PatientData,
  _http: HttpClient,
  config: Config
) => {
  const validConditions = getSectionResources(
    patientData,
    sectionProfiles.ProblemList
  );

  const sectionData: Partial<CompositionSection> = {
    title: "Problems",
    code: {
      coding: [
        {
          system: "http://loinc.org",
          code: "11450-4",
          display: "Problem list - Reported",
        },
      ],
    },
  };

  const section = await prepareSection(validConditions, sectionData, config);

  return section;
};

const generateAllergyIntoleranceSection = async (
  patientData: PatientData,
  _http: HttpClient,
  config: Config
) => {
  const validAllergies = getSectionResources(
    patientData,
    sectionProfiles.AllergyIntolerance
  );

  const sectionData: Partial<CompositionSection> = {
    title: "Allergies and Intolerances",
    code: {
      coding: [
        {
          system: "http://loinc.org",
          code: "48765-2",
          display: "Allergies and adverse reactions Document",
        },
      ],
    },
  };

  const section = prepareSection(validAllergies, sectionData, config);

  return section;
};

const generateMedicationSummarySection = async (
  patientData: PatientData,
  _http: HttpClient,
  config: Config
) => {
  const validMedications = getSectionResources(
    patientData,
    sectionProfiles.MedicationSummary
  );

  const sectionData: Partial<CompositionSection> = {
    title: "Medication Summary",
    code: {
      coding: [
        {
          system: "http://loinc.org",
          code: "10160-0",
          display: "History of Medication use Narrative",
        },
      ],
    },
  };

  const section = prepareSection(validMedications, sectionData, config);

  return section;
};

// ----- Recommended sections -----
const generateImmunizationsSection = async (
  patientData: PatientData,
  _http: HttpClient,
  config: Config
) => {
  const validImmunizations = getSectionResources(
    patientData,
    sectionProfiles.Immunizations
  );

  const sectionData: Partial<CompositionSection> = {
    title: "Immunizations",
    code: {
      coding: [
        {
          system: "http://loinc.org",
          code: "11369-6",
          display: "History of Immunization Narrative",
        },
      ],
    },
  };

  const section = prepareSection(validImmunizations, sectionData, config);

  return section;
};

const generateHistoryOfPregnancySection = async (
  patientData: PatientData,
  _http: HttpClient,
  config: Config
) => {
  const validObservations = getSectionResources(
    patientData,
    sectionProfiles.HistoryOfPregnancy
  );

  const sectionData: Partial<CompositionSection> = {
    title: "History of pregnancy",
    code: {
      coding: [
        {
          system: "http://loinc.org",
          code: "10162-6",
          display: "History of pregnancies Narrative",
        },
      ],
    },
  };

  const section = prepareSection(validObservations, sectionData, config);

  return section;
};

// ----- Optional sections -----

const sectionNames: Array<SectionName> = [
  "ProblemList",
  "AllergyIntolerance",
  "MedicationSummary",
  "Immunizations",
  "HistoryOfPregnancy",
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
  "Procedures",
];

const emptyHandler = async (
  data: PatientData,
  client: HttpClient,
  config: Config
) => {};

const prepareSection = async (
  relevantPatientData: PatientData,
  sectionData: Partial<CompositionSection>,
  config: Config
): Promise<CompositionSection> => {
  let sectionSummary: string | undefined;
  if (config.app.scriberUrl) {
    const totalSummaryResponse = await generateTotalSummary(
      config.app.scriberUrl,
      relevantPatientData
    );

    if (isSuccess(totalSummaryResponse)) {
      sectionSummary = totalSummaryResponse.data.summary;
    }
  }

  return {
    text: generateSimpleNarrative(
      relevantPatientData as SimpleNarrativeEntry,
      sectionSummary
    ),
    ...addEntry(relevantPatientData, config.aidbox.url),
    ...addEmptyReason(relevantPatientData),
    ...sectionData,
  };
};

const sectionToGenerateFuncMap: SectionToGenerateFuncMap = {
  ProblemList: generateProblemListSection,
  AllergyIntolerance: generateAllergyIntoleranceSection,
  MedicationSummary: generateMedicationSummarySection,
  Immunizations: generateImmunizationsSection,
  HistoryOfPregnancy: generateHistoryOfPregnancySection,
  Encounters: emptyHandler,
  RelatedPersons: emptyHandler,
  DocumentReferences: emptyHandler,
  Consents: emptyHandler,
  CarePlans: emptyHandler,
  ClinicalImpressions: emptyHandler,
  Flags: emptyHandler,
  Devices: emptyHandler,
  Specimens: emptyHandler,
  DeviceUseStatements: emptyHandler,
  DiagnosticReports: emptyHandler,
  ObservationPregnancyEdd: emptyHandler,
  ObservationPregnancyOutcome: emptyHandler,
  ObservationPregnancyStatus: emptyHandler,
  ObservationAlcoholUse: emptyHandler,
  ObservationTobaccoUse: emptyHandler,
  ObservationLabPath: emptyHandler,
  ObservationResultRadiology: emptyHandler,
  ObservationVitalSigns: emptyHandler,
  ImagingStudies: emptyHandler,
  Procedures: emptyHandler,
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

export const fetchSummaryResources = async (
  http: HttpClient,
  patientId: string
): Promise<PatientData> => {
  const resourceTypes = sectionNames.reduce((acc: Set<string>, sectionName) => {
    Object.keys(sectionProfiles[sectionName]).map((resourceType) =>
      acc.add(resourceType)
    );

    return acc;
  }, new Set<string>());

  const entries = [...resourceTypes].map((resourceType) => ({
    request: {
      method: "GET",
      url: buildQueryForSection(resourceType, patientId),
    },
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

const filterResourcesByProfiles = async (
  http: HttpClient,
  patientData: PatientData
) => {
  const newPatientData: PatientData = [];
  const profileData: Record<string, Array<string>> = {};

  for (const resource of patientData) {
    let verifiedOnce = false;
    const resourceType = resource.resource.resourceType;

    for (const sectionName of sectionNames) {
      const sectionProfileEntries = Object.entries(
        sectionProfiles[sectionName]
      );

      for (const [profileResourceType, profiles] of sectionProfileEntries) {
        if (resourceType === profileResourceType) {
          for (const profile of profiles as Array<string>) {
            const result = await validateByAidbox(
              http,
              resource.resource,
              resourceType,
              profile
            );
            const validationResult = (
              result.response.data as Record<string, any>
            )["id"] as string;
            if (validationResult === "allok") {
              verifiedOnce = true;

              if (!profileData[sectionName]) {
                profileData[sectionName] = [];
              }
              profileData[sectionName].push(
                buildReference(resourceType, resource.resource.id!)
              );
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

export const generateSections = async (
  http: HttpClient,
  config: Config,
  resources: PatientData
) => {
  const { patientData } = await filterResourcesByProfiles(http, resources);

  const sections = [];
  for (const item of sectionNames) {
    const sectionHandler = sectionToGenerateFuncMap[item];
    if (sectionHandler) {
      const section = await sectionHandler(patientData, http, config);
      if (section) {
        sections.push(section);
      }
    }
  }

  return { sections, bundleData: patientData };
};

const getRefs = (data: Array<{ reference: string }>) =>
  data.map(({ reference }) => reference);

export const getResourcesFromRefs = async (
  http: HttpClient,
  patientData: PatientData
) => {
  const { refs, bundleResources } = patientData.reduce(
    (
      acc: { refs: Array<string>; bundleResources: Array<string> },
      { resource }: any
    ) => {
      const performerRef = resource.performer
        ? getRefs(resource.performer)
        : [];
      const partOfRef = resource.partOf ? getRefs(resource.partOf) : [];
      const hasMemberRef = resource.hasMember
        ? getRefs(resource.hasMember)
        : [];
      const deviceRef = resource.device?.reference
        ? [resource.device?.reference]
        : [];
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
  const missingRefs = uniqueRefs.filter(
    (ref) => bundleResources.indexOf(ref) < 0
  );

  const bundleEntry = missingRefs.reduce(
    (acc: BundleEntry, ref: string) => {
      acc.push({
        request: { method: "GET", url: `/fhir/${ref}` },
      });
      return acc;
    },
    [
      {
        request: {
          method: "GET",
          url: "/fhir/Organization/TII-Organization1dddd",
        },
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

export const createComposition = (
  sections: any,
  patientId: string,
  compositionUUID: string,
  aidboxUrl: string,
  deviceUUID: string,
  preparedSummary?: string
) => {
  const now = new Date();

  const composition = {
    resourceType: "Composition",
    meta: {
      profile: [
        "http://hl7.org.au/fhir/ps/StructureDefinition/au-ps-composition",
      ],
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
      reference: buildReferenceByUrl(aidboxUrl, "Patient", patientId),
    },
    author: [
      {
        reference: `urn:uuid:${deviceUUID}`,
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

  const preparedNarrative: Narrative | undefined = preparedSummary
    ? { status: "generated", div: preparedSummary }
    : undefined;

  return {
    ...composition,
    text: preparedNarrative
      ? preparedNarrative
      : generateCompositionNarrative({
          id: compositionUUID,
          status: composition.status,
          title: composition.title,
          eventDate: composition.event[0].period.end,
        }),
  };
};
