import type { CxOdataSeverity } from './query.js';

/**
 * Property names are PascalCase because that is what `$select` and `$filter`
 * have to match. Everything is optional: `$select` decides what comes back, and
 * navigation properties are absent unless `$expand`-ed.
 */
export interface CxOdataProject {
  Id?: number;
  Name?: string;
  IsPublic?: boolean;
  Description?: string;
  CreatedDate?: string;
  OwnerId?: number | null;
  /** A GUID string on 8.9 and earlier, a number from 9.0 on. */
  OwningTeamId?: string | number;
  EngineConfigurationId?: number;
  IssueTrackingSettings?: unknown;
  SourcePath?: string;
  SourceProviderCredentials?: string;
  ExcludedFiles?: string;
  ExcludedFolders?: string;
  OriginClientTypeId?: number;
  PresetId?: number;
  LastScanId?: number;
  TotalProjectScanCount?: number;
  SchedulingExpression?: string | null;
  LastScan?: CxOdataScan;
  Scans?: CxOdataScan[];
  CustomFields?: CxOdataCustomField[];
  Preset?: CxOdataPreset;
  OwningTeam?: CxOdataTeam;
}

export interface CxOdataScan {
  Id?: number;
  SourceId?: string;
  Comment?: string;
  IsIncremental?: boolean;
  ScanType?: number;
  Origin?: string;
  OwnerId?: number | null;
  OwningTeamId?: string | number;
  InitiatorName?: string;
  ProjectName?: string;
  PresetName?: string;
  TeamName?: string;
  Path?: string;
  FileCount?: number;
  LOC?: number;
  FailedLOC?: number;
  ProductVersion?: string;
  IsForcedScan?: boolean;
  ScanRequestedOn?: string;
  QueuedOn?: string;
  EngineStartedOn?: string | null;
  EngineFinishedOn?: string | null;
  ScanCompletedOn?: string;
  /** A duration expressed as a datetime offset from `1900-01-01`. */
  ScanDuration?: string;
  ProjectId?: number;
  EngineServerId?: number;
  PresetId?: number;
  QueryLanguageVersionId?: number;
  ScannedLanguageIds?: number;
  TotalVulnerabilities?: number;
  High?: number;
  Medium?: number;
  Low?: number;
  Info?: number;
  RiskScore?: number;
  QuantityLevel?: number;
  StatisticsUpdateDate?: string;
  StatisticsUpToDate?: number;
  IsPublic?: boolean;
  IsLocked?: boolean;
  Results?: CxOdataResult[];
  ResultSummary?: unknown;
}

export interface CxOdataResult {
  Id?: number;
  /** The composite `<scanId>-<pathId>` identifier, not the numeric `Id`. */
  ResultId?: string;
  ScanId?: number;
  SimilarityId?: number;
  RawPriority?: number | null;
  PathId?: number;
  ConfidenceLevel?: number;
  Date?: string;
  Severity?: CxOdataSeverity;
  StateId?: number;
  AssignedToUserId?: number | null;
  AssignedTo?: string | null;
  Comment?: string | null;
  QueryId?: number;
  QueryVersionId?: number;
  Query?: CxOdataQueryEntity;
  State?: CxOdataState;
  Scan?: CxOdataScan;
}

export interface CxOdataQueryEntity {
  Id?: number;
  Name?: string;
  QueryGroupId?: number;
  Cwe?: number;
  QueryGroup?: CxOdataQueryGroup;
}

export interface CxOdataQueryGroup {
  Id?: number;
  Name?: string;
  LanguageName?: string;
  PackageTypeName?: string;
}

export interface CxOdataState {
  Id?: number;
  Name?: string;
}

export interface CxOdataCustomField {
  ProjectId?: number;
  FieldName?: string;
  FieldValue?: string;
}

export interface CxOdataPreset {
  Id?: number;
  Name?: string;
}

export interface CxOdataTeam {
  Id?: string | number;
  FullName?: string;
  Name?: string;
}

/** The envelope every collection response arrives in. */
export interface CxOdataResponse<T> {
  '@odata.context'?: string;
  '@odata.count'?: number;
  '@odata.nextLink'?: string;
  value?: T[];
}

/** Flattened row from `ResultsOdataApi.getResultsWithQueryLanguageState`. */
export interface CxOdataResultSummaryRow {
  SimilarityId?: number;
  Language?: string;
  QueryGroup?: string;
  Query?: string;
  QueryId?: number;
  ResultId?: number;
  ResultState?: string;
  Origin?: string;
  LOC?: number;
  PathId?: number;
}

/** Flattened row from `ResultsOdataApi.getResultsBySimilarityIds`. */
export interface CxOdataResultRow extends CxOdataResultSummaryRow {
  ScanId?: number;
  RawPriority?: number | null;
  ConfidenceLevel?: number;
  Date?: string;
  Severity?: CxOdataSeverity;
  StateId?: number;
  AssignedToUserId?: number | null;
  AssignedTo?: string | null;
  Comment?: string | null;
  QueryVersionId?: number;
}

export interface CxOdataQueryCount {
  Query?: string;
  Count?: number;
}

export interface CxOdataQueryGroupCount {
  QueryGroup?: string;
  QueryList: CxOdataQueryCount[];
}

export interface CxOdataLanguageCount {
  Language?: string;
  QueryGroupList: CxOdataQueryGroupCount[];
}

export interface CxOdataProjectSummary {
  ProjectId?: number;
  ProjectName?: string;
}

export interface CxOdataProjectTeamSummary extends CxOdataProjectSummary {
  TeamId?: string | number;
  TeamName?: string;
}
