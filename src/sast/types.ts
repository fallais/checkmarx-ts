export interface CxLink {
  rel?: string;
  uri?: string;
}

export interface CxURI {
  absoluteUrl?: string;
  port?: number;
}

export interface CxCredential {
  username?: string;
  password?: string;
}

export interface CxSourceSettingsLink {
  type?: string;
  rel?: string;
  uri?: string;
}

export interface CxCustomField {
  id?: number;
  name?: string;
  value?: string;
  isMandatory?: boolean;
  projectId?: number;
}

export interface CxProjectQueueSetting {
  queueKeepMode?: string;
  scansType?: string;
  includeScansInProcess?: boolean;
  identicalCodeOnly?: boolean;
}

export interface CxProject {
  id?: number;
  teamId?: string;
  name?: string;
  isPublic?: boolean;
  sourceSettingsLink?: CxSourceSettingsLink;
  customFields?: CxCustomField[];
  links?: CxLink[];
  projectQueueSettings?: CxProjectQueueSetting;
  owner?: string;
  isDeprecated?: boolean;
  isBranched?: boolean;
  originalProjectId?: number;
  branchedOnScanId?: number;
  relatedProjects?: unknown;
}

export interface CxCreateProjectRequest {
  name: string;
  owningTeam: string;
  isPublic: boolean;
}

export interface CxUpdateProjectRequest {
  name: string;
  owningTeam: string;
  customFields?: CxCustomField[];
}

export interface CxUpdateProjectNameTeamIdRequest {
  name: string;
  owningTeam: string;
}

export interface CxCreateProjectResponse {
  id?: number;
  link?: CxLink;
}

export interface CxProjectExcludeSettings {
  projectId?: number;
  excludeFoldersPattern?: string;
  excludeFilesPattern?: string;
  link?: CxLink;
}

export interface CxGitSettings {
  url?: string;
  branch?: string;
  useSsh?: boolean;
  link?: CxLink;
  privateKey?: string;
}

export interface CxSVNSettings {
  uri?: CxURI;
  paths?: string[];
  useSsh?: boolean;
  link?: CxLink;
  credentials?: CxCredential;
  privateKey?: string;
}

export interface CxTFSSettings {
  uri?: CxURI;
  paths?: string[];
  link?: CxLink;
  credentials?: CxCredential;
}

export interface CxPerforceSettings {
  uri?: CxURI;
  paths?: string[];
  browseMode?: string;
  link?: CxLink;
  credentials?: CxCredential;
}

export interface CxCustomRemoteSourceSettings {
  path?: string;
  pullingCommandId?: number;
  link?: CxLink;
  credentials?: CxCredential;
}

export interface CxSharedRemoteSourceSettingsRequest {
  paths?: string[];
  credentials?: CxCredential;
}

export interface CxSharedRemoteSourceSettingsResponse {
  paths?: string[];
  link?: CxLink;
}

export interface CxPreset {
  id?: number;
  name?: string;
  ownerName?: string;
  link?: CxLink;
  queryIds?: number[];
}

export interface CxCustomTask {
  id?: number;
  name?: string;
  type?: string;
  data?: string;
  link?: CxLink;
}

export interface CxIssueTrackingSystem {
  id?: number;
  name?: string;
  type?: string;
  url?: string;
}

export interface CxIssueTrackingSystemFieldAllowedValue {
  id?: string;
  name?: string;
}

export interface CxIssueTrackingSystemField {
  id?: number;
  name?: string;
  multiple?: boolean;
  required?: boolean;
  supported?: boolean;
  allowedValues?: CxIssueTrackingSystemFieldAllowedValue[];
}

export interface CxIssueTrackingSystemType {
  id?: string;
  name?: string;
  subtask?: boolean;
  fields?: CxIssueTrackingSystemField[];
}

export interface CxIssueTrackingSystemDetail {
  id?: number;
  name?: string;
  issueTypes?: CxIssueTrackingSystemType[];
}

export interface CxIssueTrackingSystemJiraField {
  id: string;
  values: string[];
}

export interface CxIssueTrackingSystemJira {
  issueTrackingSystemId: number;
  jiraProjectId: string;
  issueTypeId: string;
  fields: CxIssueTrackingSystemJiraField[];
}

export interface CxTeam {
  id?: number;
  name?: string;
  fullName?: string;
  parentId?: number;
}

export interface CxStatusDetail {
  stage?: string;
  step?: string;
}

export interface CxStatus {
  id?: number;
  name?: string;
  details?: CxStatusDetail;
}

export interface CxScanStage {
  id?: number;
  value?: string;
}

export interface CxFinishedScanStatus {
  id?: number;
  value?: string;
}

export interface CxDateAndTime {
  startedOn?: string;
  finishedOn?: string;
  engineStartedOn?: string;
  engineFinishedOn?: string;
}

export interface CxLanguageState {
  languageID?: number;
  languageName?: string;
  languageHash?: string;
  stateCreationDate?: string;
}

export interface CxScanState {
  path?: string;
  sourceId?: string;
  filesCount?: number;
  linesOfCode?: number;
  failedLinesOfCode?: number;
  cxVersion?: string;
  languageStateCollection?: CxLanguageState[];
}

export interface CxResultsStatistics {
  link?: CxLink;
}

export interface CxScanDetail {
  id?: number;
  project?: { id?: number; name?: string; link?: CxLink };
  status?: CxStatus;
  scanType?: { id?: number; value?: string };
  comment?: string;
  dateAndTime?: CxDateAndTime;
  resultsStatistics?: CxResultsStatistics;
  scanState?: CxScanState;
  owner?: string;
  origin?: string;
  originURL?: string;
  initiatorName?: string;
  owningTeamId?: number;
  isPublic?: boolean;
  isLocked?: boolean;
  isIncremental?: boolean;
  scanRisk?: number;
  scanRiskSeverity?: number;
  engineServer?: { id?: number; name?: string; link?: CxLink };
  finishedScanStatus?: CxFinishedScanStatus;
  partialScanReasons?: unknown;
  customFields?: unknown;
}

export interface CxCreateNewScanResponse {
  id?: number;
  link?: CxLink;
}

export interface CxScanQueueDetail {
  id?: number;
  stage?: CxScanStage;
  stageDetails?: string;
  stepDetails?: string;
  project?: { id?: number; name?: string; link?: CxLink };
  engine?: { id?: number; link?: CxLink };
  languages?: { id?: number; name?: string }[];
  teamId?: string;
  dateCreated?: string;
  queuedOn?: string;
  engineStartedOn?: string;
  completedOn?: string;
  loc?: number;
  isIncremental?: boolean;
  isPublic?: boolean;
  origin?: string;
  queuePosition?: number;
  totalPercent?: number;
  stagePercent?: number;
  initiator?: string;
}

export interface CxStatisticsResult {
  criticalSeverity?: number;
  highSeverity?: number;
  mediumSeverity?: number;
  lowSeverity?: number;
  infoSeverity?: number;
  statisticsCalculationDate?: string;
}

export interface CxScanParsedFilesMetric {
  language?: string;
  parsedSuccessfully?: number;
  parsedUnsuccessfully?: number;
  parsedPartially?: number;
}

export interface CxScanParsedFiles {
  id?: number;
  scannedFilesPerLanguage?: Record<string, CxScanParsedFilesMetric>;
}

export interface CxScanFailedQueries {
  id?: number;
  failedQueries?: unknown[];
}

export interface CxScanFailedGeneralQueries {
  id?: number;
  failedGeneralQueries?: unknown[];
}

export interface CxLanguageStatistic {
  language?: string;
  parsedFiles?: {
    parsedSuccessfully?: number;
    parsedUnsuccessfully?: number;
    parsedPartially?: number;
  };
  scannedLOCPerLanguage?: { successfulLOC?: number; unsuccessfulLOC?: number };
  scannedSuccessfullyLOCPercentage?: number;
  countOfDomObjects?: number;
}

export interface CxScanStatistics {
  id?: number;
  scanId?: number;
  scanStatus?: string;
  productVersion?: string;
  engineVersion?: string;
  memoryPeakInMB?: number;
  virtualMemoryPeakInMB?: number;
  isIncrementalScan?: boolean;
  resultsCount?: number;
  totalUnScannedFilesCount?: number;
  fileCountOfDetectedButNotScannedLanguages?: Record<string, number>;
  totalFilteredParsedLOC?: number;
  totalUnFilteredParsedLOC?: number;
  languageStatistics?: CxLanguageStatistic[];
  pathFilterPattern?: string;
  failedQueriesCount?: number;
  generalQueries?: { succeededGeneralQueriesCount?: number; failedGeneralQueriesCount?: number };
  failedStages?: string;
  engineOperatingSystem?: string;
  enginePackVersion?: string;
}

export interface CxScanResultNode {
  id?: number;
  order?: number;
  shortName?: string;
  fullName?: string;
  fileName?: string;
  folder?: string;
  line?: number;
  column?: number;
  length?: number;
  methodLine?: number;
  sourceUrl?: string;
}

export interface CxScanResultAttackVector {
  resultId?: string;
  bestFixLocationNode?: number;
  nodes?: CxScanResultNode[];
}

export interface CxScanResultAttackVectorByBFL {
  scanId?: number;
  queryVersion?: number;
  bestFixLocationNode?: CxScanResultNode;
  attackVectors?: CxScanResultAttackVector[];
}

export interface CxScanResultLabelsFields {
  state?: number;
  severity?: number;
  userAssignment?: string;
  comment?: string;
}

export interface CxScanResult {
  id?: string;
  similarityId?: string;
  pathId?: number;
  queryId?: number;
  queryVersionCode?: number;
  cweId?: number;
  severity?: string | number;
  status?: string;
  state?: string | number;
  assignedTo?: string;
  comment?: string;
  nodes?: CxScanResultNode[];
  [key: string]: unknown;
}

export interface CxScanResultsPage {
  scanId?: number;
  offset?: number;
  limit?: number;
  totalCount?: number;
  results?: CxScanResult[];
}

export interface CxRegisterScanReportResponse {
  reportId?: number;
  links?: unknown;
}

export interface CxScanReportStatus {
  link?: CxLink;
  contentType?: string;
  status?: { id?: number; value?: string };
}

export interface CxPolicyFindingResponse {
  id?: number;
  link?: CxLink;
}

export interface CxPolicyFindingsStatus {
  project?: unknown;
  scan?: unknown;
  status?: string;
  lastSync?: string;
}

export interface CxEmailNotification {
  failedScan?: string[];
  beforeScan?: string[];
  afterScan?: string[];
}

export interface CxPostScanActionConditions {
  runOnlyWhenNewResults?: boolean;
  runOnlyWhenNewResultsMinSeverity?: number;
}

export interface CxScanSettings {
  project?: { id?: number; link?: CxLink };
  preset?: { id?: number; link?: CxLink };
  engineConfiguration?: { id?: number; link?: CxLink };
  postScanAction?: number | null;
  emailNotifications?: CxEmailNotification;
  postScanActionData?: string;
  postScanActionName?: string;
  postScanActionConditions?: CxPostScanActionConditions;
  postScanActionArguments?: string;
}

export interface CxCreateScanSettingsRequestBody {
  projectId: number;
  presetId: number;
  engineConfigurationId: number;
  postScanActionId?: number;
  failedScanEmails?: string[];
  beforeScanEmails?: string[];
  afterScanEmails?: string[];
  postScanActionConditions?: CxPostScanActionConditions;
  postScanActionArguments?: string;
}

export interface CxCreateScanSettingsResponse {
  id?: number;
  link?: CxLink;
}

export interface CxSchedulingSettings {
  scheduleType: string;
  scheduleDays?: string[];
  scheduleTime?: string;
}

export interface CxLanguage {
  id?: number;
  name?: string;
}

export interface CxEngineConfiguration {
  id?: number;
  name?: string;
  link?: CxLink;
}

export interface CxEngineServerStatus {
  id?: number;
  value?: string;
}

export interface CxEngineDedication {
  itemType?: string;
  itemId?: string;
  itemName?: string;
  isDeprecated?: boolean;
}

export interface CxEngineServer {
  id?: number;
  name?: string;
  uri?: string;
  minLoc?: number;
  maxLoc?: number;
  maxScans?: number;
  cxVersion?: string;
  operatingSystem?: string;
  status?: CxEngineServerStatus;
  link?: CxLink;
  offlineReasonCode?: string;
  offlineReasonMessage?: string;
  offlineReasonMessageParameters?: string;
  dedications?: CxEngineDedication[];
}

export interface CxRegisterEngineRequestBody {
  name: string;
  uri: string;
  minLoc: number;
  maxLoc: number;
  isBlocked: boolean;
  maxScans?: number;
}

export interface CxDataRetentionRequestStatusStage {
  id?: number;
  value?: string;
}

export interface CxDataRetentionRequestStatus {
  id?: number;
  stage?: CxDataRetentionRequestStatusStage;
  link?: CxLink;
}

export interface CxDefineDataRetentionResponse {
  id?: number;
  link?: CxLink;
}

export interface CxSupportedLanguage {
  isSupported?: boolean;
  language?: string;
}

export interface CxServerLicenseData {
  currentAuditUsers?: number;
  currentProjectsCount?: number;
  currentUsers?: number;
  edition?: string;
  expirationDate?: string;
  hid?: string;
  isOsaEnabled?: boolean;
  maxAuditUsers?: number;
  maxConcurrentScans?: number;
  maxLOC?: number;
  maxUsers?: number;
  osaExpirationDate?: string;
  projectsAllowed?: number;
  supportedLanguages?: CxSupportedLanguage[];
}

export interface CxUserPersistence {
  key: string;
  value: string;
}

export interface CxTranslationInput {
  languageId: number;
  name: string;
}

export interface CxOsaMatchType {
  id?: number;
  name?: string;
  description?: string;
}

export interface CxOsaSeverity {
  id?: number;
  name?: string;
}

export interface CxOsaState {
  id?: number;
  name?: string;
  failureReason?: number;
}

export interface CxOsaLocation {
  path?: string;
  matchType?: CxOsaMatchType;
}

export interface CxOsaLibrary {
  id?: string;
  name?: string;
  version?: string;
  releaseDate?: string;
  highUniqueVulnerabilityCount?: number;
  mediumUniqueVulnerabilityCount?: number;
  lowUniqueVulnerabilityCount?: number;
  notExploitableVulnerabilityCount?: number;
  newestVersion?: string;
  newestVersionReleaseDate?: string;
  numberOfVersionsSinceLastUpdate?: number;
  confidenceLevel?: number;
  matchType?: CxOsaMatchType;
  licenses?: string[];
  outdated?: boolean;
  severity?: CxOsaSeverity;
  riskScore?: number;
  locations?: CxOsaLocation[];
  codeUsageStatus?: string;
  codeReferenceCount?: number;
  packageRepository?: string;
}

export interface CxOsaLicense {
  id?: string;
  name?: string;
  riskLevel?: string;
  copyrightRiskScore?: number;
  patentRiskScore?: number;
  copyLeft?: string;
  linking?: string;
  /** Spelled `royalityFree` on the wire. */
  royalityFree?: string;
  referenceType?: string;
  reference?: string;
  url?: string;
}

export interface CxOsaVulnerabilityState {
  id?: number;
  name?: string;
  actionType?: string;
}

export interface CxOsaVulnerability {
  id?: string;
  cveName?: string;
  score?: number;
  severity?: CxOsaSeverity;
  publishDate?: string;
  url?: string;
  description?: string;
  recommendations?: string;
  sourceFileName?: string;
  libraryId?: string;
  state?: CxOsaVulnerabilityState;
  commentsAmount?: number;
  similarityId?: string;
  fixUrl?: string;
}

export interface CxOsaVulnerabilityComment {
  userName?: string;
  timeStamp?: number;
  content?: string;
}

export interface CxOsaScanDetail {
  findingsStatus?: string;
  id?: string;
  startAnalyzeTime?: string;
  endAnalyzeTime?: string;
  origin?: string;
  sourceCodeOrigin?: string;
  state?: CxOsaState;
  sharedSourceLocationPaths?: string[];
}

export interface CxOsaSummaryReport {
  totalLibraries?: number;
  highVulnerabilityLibraries?: number;
  mediumVulnerabilityLibraries?: number;
  lowVulnerabilityLibraries?: number;
  nonVulnerableLibraries?: number;
  vulnerableAndUpdated?: number;
  vulnerableAndOutdated?: number;
  vulnerabilityScore?: number;
  totalHighVulnerabilities?: number;
  totalMediumVulnerabilities?: number;
  totalLowVulnerabilities?: number;
}
