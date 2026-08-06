export type ScaReportFormat = 'Json' | 'Xml' | 'Pdf' | 'Csv' | 'CycloneDxJson' | 'CycloneDxXml';

export type ScaReportDataType =
  'All' | 'Packages' | 'Vulnerabilities' | 'Licenses' | 'Policies' | 'SupplyChainRisks';

export type ScaSbomFileFormat = 'CycloneDxJson' | 'CycloneDxXml' | 'SpdxJson';

export type ScaProjectType = 'git' | 'upload';

export interface ScaProject {
  id: string;
  name: string;
  isManaged: boolean;
  createdOn: string;
  tenantId: string;
  branch: string | null;
  assignedTeams: string[];
  lastSuccessfulScanId: string | null;
}

export interface ScaScanStatus {
  name: string;
  message: string | null;
}

export interface ScaScanProgressStep {
  name: string;
  startTime: string;
  endTime: string;
  status: string;
}

export interface ScaScan {
  projectId: string;
  createdOn: string;
  lastUpdate: string;
  status: ScaScanStatus;
  origin: string;
  riskReportId: string;
  scanId: string;
  revision: string | null;
  username: string;
  tenantId: string;
  scanProgress: ScaScanProgressStep[];
}

export interface ScaScanSettings {
  enableExploitablePath: boolean;
  sourceControlBranch?: string;
  sourceControlRevision?: string;
}

export interface ScaProjectSettings {
  enableExploitablePath: boolean;
}

export interface ScaRiskReportSummary {
  riskReportId: string;
  projectId: string;
  highVulnerabilityCount: number;
  mediumVulnerabilityCount: number;
  lowVulnerabilityCount: number;
  totalPackages: number;
  directPackages: number;
  createdOn: string;
  riskScore: number;
  totalOutdatedPackages: number;
}

export interface ScaDependencyPathNode {
  id: string;
  name: string;
  version: string;
  isResolved: boolean;
  isDevelopment: boolean;
}

export interface ScaPackageUsage {
  usageType: string;
  packageId: string | null;
  importsCalled: unknown[];
  methodsCalled: unknown[];
  packageUsageComplexity: number;
}

export interface ScaPackage {
  id: string;
  name: string;
  version: string;
  licenses: string[];
  matchType: string;
  highVulnerabilityCount: number;
  mediumVulnerabilityCount: number;
  lowVulnerabilityCount: number;
  ignoredVulnerabilityCount: number;
  numberOfVersionsSinceLastUpdate: number;
  newestVersionReleaseDate: string;
  newestVersion: string;
  outdated: boolean;
  releaseDate: string;
  confidenceLevel: string;
  riskScore: number;
  severity: string;
  locations: string[];
  dependencyPaths: ScaDependencyPathNode[][];
  packageRepository: string;
  isDirectDependency: boolean;
  isDevelopment: boolean;
  packageUsage: ScaPackageUsage;
}

export interface ScaCvss {
  version: number;
  attackVector: string;
  attackComplexity: string;
  confidentiality: string;
  availability: string;
  integrityImpact: string;
  authentication: string | null;
}

export interface ScaVulnerability {
  id: string;
  cveName: string;
  score: number;
  severity: string;
  publishDate: string;
  references: unknown[];
  referencesData: unknown[];
  description: string;
  cvss: ScaCvss;
  recommendations: string | null;
  packageId: string;
  similarityId: string | null;
  fixResolutionText: string;
  isIgnored: boolean;
  exploitableMethods: unknown[];
  cwe: string;
}

export interface ScaLicense {
  id: string;
  referenceType: string;
  reference: string;
  royaltyFree: string;
  copyrightRiskScore: number;
  riskLevel: string;
  linking: string;
  copyLeft: string;
  patentRiskScore: number;
  name: string;
  url: string;
}

export interface ScaWarning {
  warningCode: string;
  affectedFiles: string[];
}

export interface ScaComment {
  projectId: string;
  vulnerabilityId: string;
  packageId: string;
  comment: string;
  username: string;
  createdOn: string;
}

export interface ScaState {
  projectId: string;
  packageId: string;
  vulnerabilityId: string;
  state: string;
  createdOn: string;
}

export interface ScaRiskAction {
  [key: string]: unknown;
}

export interface ScaEntity {
  [key: string]: unknown;
}

export interface ScaSbomStatus {
  exportId: string;
  exportStatus: string;
  fileUrl: string | null;
  [key: string]: unknown;
}

export interface ScaAnalysisResult {
  requestId: string;
  status: string;
  [key: string]: unknown;
}

export interface ScaRiskLevelCounts {
  critical: number;
  high: number;
  medium: number;
  low: number;
  none: number;
  empty: number;
}

export interface ScaTotalCount {
  totalCount: number;
}

export interface ScaRiskCounters extends ScaTotalCount {
  risksLevelCounts: ScaRiskLevelCounts;
}

export interface ScaPackageCounters extends ScaTotalCount {
  totalDevCount: number;
  totalDevOrTestCount: number;
  totalPolicyViolationsCount?: number;
  maxVulnerabilitiesCount?: number;
  hasMaliciousPackage?: boolean;
}

export interface GraphQLError {
  message: string;
  path?: (string | number)[];
  extensions?: Record<string, unknown>;
}

export interface GraphQLResponse<T> {
  data: T;
  errors?: GraphQLError[];
}
