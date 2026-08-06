import { readFile } from 'node:fs/promises';
import { basename } from 'node:path';
import { ApiClient } from '../core/apiClient.js';
import type { Configuration } from '../core/configuration.js';
import { ACCEPTED, CREATED, NO_CONTENT, OK } from '../core/httpStatus.js';
import { constructConfiguration } from './config.js';
import * as gql from './graphqlQueries.js';
import type {
  GraphQLResponse,
  ScaAnalysisResult,
  ScaComment,
  ScaEntity,
  ScaLicense,
  ScaPackage,
  ScaPackageCounters,
  ScaProject,
  ScaProjectSettings,
  ScaProjectType,
  ScaReportDataType,
  ScaReportFormat,
  ScaRiskAction,
  ScaRiskCounters,
  ScaRiskReportSummary,
  ScaSbomFileFormat,
  ScaSbomStatus,
  ScaScan,
  ScaScanSettings,
  ScaScanStatus,
  ScaState,
  ScaTotalCount,
  ScaVulnerability,
  ScaWarning,
} from './types.js';

const REPORT_FORMATS: ScaReportFormat[] = [
  'Json',
  'Xml',
  'Pdf',
  'Csv',
  'CycloneDxJson',
  'CycloneDxXml',
];

const REPORT_DATA_TYPES: ScaReportDataType[] = [
  'All',
  'Packages',
  'Vulnerabilities',
  'Licenses',
  'Policies',
  'SupplyChainRisks',
];

const SBOM_FILE_FORMATS: ScaSbomFileFormat[] = ['CycloneDxJson', 'CycloneDxXml', 'SpdxJson'];

export class ScaApi {
  readonly apiClient: ApiClient;
  readonly baseUrl: string;
  readonly gqlUrl: string;

  constructor(apiClient?: ApiClient, configuration?: Partial<Configuration>) {
    this.apiClient = apiClient ?? new ApiClient(constructConfiguration(configuration));
    this.baseUrl = (this.apiClient.configuration.serverBaseUrl ?? '').replace(/\/+$/, '');
    this.gqlUrl = `${this.baseUrl}/graphql/graphql`;
  }

  async getAllProjects(projectName?: string): Promise<ScaProject[]> {
    const url = `${this.baseUrl}/risk-management/projects`;
    const response = await this.apiClient.callApi({
      method: 'GET',
      url,
      params: projectName ? { name: projectName } : undefined,
    });
    return response.json<ScaProject[]>();
  }

  /** Resolves a single project by exact name, or `undefined` when there is no match. */
  async getProjectByName(projectName: string): Promise<ScaProject | undefined> {
    const url = `${this.baseUrl}/risk-management/projects`;
    const response = await this.apiClient.callApi({
      method: 'GET',
      url,
      params: { name: projectName },
    });
    const payload = response.json<ScaProject | ScaProject[]>();
    return Array.isArray(payload) ? payload[0] : payload;
  }

  async checkIfProjectAlreadyExists(projectName: string): Promise<boolean> {
    const allProjects = await this.getAllProjects();
    return allProjects.some((project) => project.name === projectName);
  }

  async createANewProject(projectName: string, assignedTeams: string[] = []): Promise<ScaProject> {
    const url = `${this.baseUrl}/risk-management/projects`;
    const response = await this.apiClient.callApi({
      method: 'POST',
      url,
      json: { Name: projectName, AssignedTeams: assignedTeams },
    });
    return response.json<ScaProject>();
  }

  async getProjectIdByName(projectName: string): Promise<string | undefined>;
  async getProjectIdByName(projectName: string[]): Promise<string[]>;
  async getProjectIdByName(projectName: string | string[]): Promise<string | string[] | undefined> {
    if (typeof projectName === 'string') {
      const project = await this.getProjectByName(projectName);
      return project?.id;
    }
    const projects = await this.getAllProjects();
    return projects
      .filter((project) => projectName.includes(project.name))
      .map((project) => project.id);
  }

  async getProjectById(projectId: string): Promise<ScaProject> {
    const url = `${this.baseUrl}/risk-management/projects/${projectId}`;
    const response = await this.apiClient.callApi({ method: 'GET', url });
    return response.json<ScaProject>();
  }

  async updateProject(
    projectId: string,
    projectName?: string,
    assignedTeams?: string[],
  ): Promise<boolean> {
    const url = `${this.baseUrl}/risk-management/projects/${projectId}`;
    const payload: Record<string, unknown> = {};
    if (projectName) payload['Name'] = projectName;
    if (assignedTeams) payload['AssignedTeams'] = assignedTeams;

    const response = await this.apiClient.callApi({ method: 'PUT', url, json: payload });
    return response.statusCode === NO_CONTENT;
  }

  async deleteProject(projectId: string): Promise<boolean> {
    const url = `${this.baseUrl}/risk-management/projects/${projectId}`;
    const response = await this.apiClient.callApi({ method: 'DELETE', url });
    return response.statusCode === NO_CONTENT;
  }

  async getAllScansAssociatedWithAProject(projectId: string): Promise<ScaScan[]> {
    const url = `${this.baseUrl}/risk-management/scans`;
    const response = await this.apiClient.callApi({
      method: 'GET',
      url,
      params: { projectId },
    });
    return response.json<ScaScan[]>();
  }

  async getLatestScanIdOfAProject(projectId: string): Promise<string | undefined> {
    const allScans = await this.getAllScansAssociatedWithAProject(projectId);
    if (allScans.length === 0) return undefined;

    const sorted =
      allScans.length > 1
        ? [...allScans].sort((left, right) => left.createdOn.localeCompare(right.createdOn))
        : allScans;
    return sorted[sorted.length - 1]?.scanId;
  }

  async getScanById(scanId: string): Promise<ScaScan> {
    const url = `${this.baseUrl}/risk-management/scans/${scanId}`;
    const response = await this.apiClient.callApi({ method: 'GET', url });
    return response.json<ScaScan>();
  }

  async getScanStatus(scanId: string): Promise<ScaScanStatus> {
    const url = `${this.baseUrl}/risk-management/scans/${scanId}/status`;
    const response = await this.apiClient.callApi({ method: 'GET', url });
    return response.json<ScaScanStatus>();
  }

  async getScanSettings(scanId: string): Promise<ScaScanSettings> {
    const url = `${this.baseUrl}/risk-management/scans/${scanId}/settings`;
    const response = await this.apiClient.callApi({ method: 'GET', url });
    return response.json<ScaScanSettings>();
  }

  async getRiskReportSummary(
    projectId?: string,
    size = 10,
    skip = 0,
  ): Promise<ScaRiskReportSummary[]> {
    const url = `${this.baseUrl}/risk-management/risk-reports`;
    const response = await this.apiClient.callApi({
      method: 'GET',
      url,
      params: {
        projectId: projectId || undefined,
        size: size || undefined,
        skip: skip || undefined,
      },
    });
    return response.json<ScaRiskReportSummary[]>();
  }

  async getPackagesOfAScan(scanId: string): Promise<ScaPackage[]> {
    const url = `${this.baseUrl}/risk-management/risk-reports/${scanId}/packages`;
    const response = await this.apiClient.callApi({ method: 'GET', url });
    return response.json<ScaPackage[]>();
  }

  async getVulnerabilitiesOfAScan(scanId: string): Promise<ScaVulnerability[]> {
    const url = `${this.baseUrl}/risk-management/risk-reports/${scanId}/vulnerabilities`;
    const response = await this.apiClient.callApi({ method: 'GET', url });
    return response.json<ScaVulnerability[]>();
  }

  async getLicensesOfAScan(scanId: string): Promise<ScaLicense[]> {
    const url = `${this.baseUrl}/risk-management/risk-reports/${scanId}/licenses`;
    const response = await this.apiClient.callApi({ method: 'GET', url });
    return response.json<ScaLicense[]>();
  }

  async getWarningsOfAScan(scanId: string): Promise<ScaWarning[]> {
    const url = `${this.baseUrl}/risk-management/risk-reports/${scanId}/warnings`;
    const response = await this.apiClient.callApi({ method: 'GET', url });
    return response.json<ScaWarning[]>();
  }

  async ignoreAVulnerabilityForASpecificPackageAndProject(
    projectId: string,
    vulnerabilityId: string,
    packageId: string,
  ): Promise<boolean> {
    const url = `${this.baseUrl}/risk-management/risk-reports/IgnoreVulnerability`;
    const response = await this.apiClient.callApi({
      method: 'PUT',
      url,
      json: { ProjectId: projectId, VulnerabilityId: vulnerabilityId, PackageId: packageId },
    });
    return response.statusCode === NO_CONTENT;
  }

  async undoTheIgnoreStateOfAnIgnoredVulnerability(
    projectId: string,
    vulnerabilityId: string,
    packageId: string,
  ): Promise<boolean> {
    const url = `${this.baseUrl}/risk-management/risk-reports/UnIgnoreVulnerability`;
    const response = await this.apiClient.callApi({
      method: 'PUT',
      url,
      json: { ProjectId: projectId, VulnerabilityId: vulnerabilityId, PackageId: packageId },
    });
    return response.statusCode === NO_CONTENT;
  }

  async getSettingsForASpecificProject(projectId: string): Promise<ScaProjectSettings> {
    const url = `${this.baseUrl}/risk-management/settings/projects/${projectId}`;
    const response = await this.apiClient.callApi({ method: 'GET', url });
    return response.json<ScaProjectSettings>();
  }

  async updateSettingsForASpecificProject(
    projectId: string,
    enableExploitablePath: boolean,
  ): Promise<boolean> {
    const url = `${this.baseUrl}/risk-management/settings/projects/${projectId}`;
    const response = await this.apiClient.callApi({
      method: 'PUT',
      url,
      json: { EnableExploitablePath: enableExploitablePath },
    });
    return response.statusCode === NO_CONTENT;
  }

  async generateUploadLinkForScanning(projectId: string): Promise<string> {
    const url = `${this.baseUrl}/scan-runner/scans/generate-upload-link`;
    const response = await this.apiClient.callApi({ method: 'POST', url, json: { projectId } });
    return response.json<{ uploadUrl: string }>().uploadUrl;
  }

  async uploadZipContentForScanning(uploadLink: string, zipFilePath: string): Promise<boolean> {
    const content = await readFile(zipFilePath);
    const response = await this.apiClient.callApi({
      method: 'PUT',
      url: uploadLink,
      data: content,
    });
    return response.statusCode === OK;
  }

  async scanPreviouslyUploadedZip(projectId: string, uploadedFileUrl: string): Promise<string> {
    const url = `${this.baseUrl}/scan-runner/scans/uploaded-zip`;
    const response = await this.apiClient.callApi({
      method: 'POST',
      url,
      json: { projectId, uploadedFileUrl },
    });
    return response.json<{ scanId: string }>().scanId;
  }

  async generateUploadLink(): Promise<string> {
    const url = `${this.baseUrl}/api/uploads`;
    const response = await this.apiClient.callApi({ method: 'POST', url });
    return response.json<{ url: string }>().url;
  }

  async uploadZipFile(uploadLink: string, zipFilePath: string): Promise<boolean> {
    const content = await readFile(zipFilePath);
    const response = await this.apiClient.callApi({
      method: 'PUT',
      url: uploadLink,
      data: content,
    });
    return response.statusCode === OK;
  }

  async scanZipFileOrGithubFile(
    projectId: string,
    projectType: ScaProjectType,
    handlerUrl: string,
  ): Promise<string | undefined> {
    if (projectType !== 'git' && projectType !== 'upload') {
      throw new TypeError('project_type should be git or upload');
    }

    const url = `${this.baseUrl}/api/scans`;
    const response = await this.apiClient.callApi({
      method: 'POST',
      url,
      json: {
        project: { id: projectId, type: projectType, handler: { url: handlerUrl } },
      },
    });
    return response.statusCode === CREATED ? response.json<{ id: string }>().id : undefined;
  }

  async getCommentsAssociatedWithAProject(projectId: string): Promise<ScaComment[]> {
    const url = `${this.baseUrl}/risk-management/risk-metadata/${projectId}`;
    const response = await this.apiClient.callApi({ method: 'GET', url });
    return response.json<ScaComment[]>();
  }

  async commentAVulnerabilityForASpecificPackageAndProject(
    projectId: string,
    vulnerabilityId: string,
    packageId: string,
    comment: string,
  ): Promise<boolean> {
    const url = `${this.baseUrl}/risk-management/risk-metadata`;
    const response = await this.apiClient.callApi({
      method: 'POST',
      url,
      json: { projectId, packageId, vulnerabilityId, comment, username: 'NOT USED' },
    });
    return response.statusCode === OK;
  }

  async getStatesAssociatedWithAProject(projectId: string): Promise<ScaState[]> {
    const url = `${this.baseUrl}/risk-management/risk-state/${projectId}`;
    const response = await this.apiClient.callApi({ method: 'GET', url });
    return response.json<ScaState[]>();
  }

  async changeStateOfAVulnerabilityForASpecificPackageAndProject(
    projectId: string,
    vulnerabilityId: string,
    packageId: string,
    state: string,
  ): Promise<boolean> {
    const url = `${this.baseUrl}/risk-management/risk-state`;
    const response = await this.apiClient.callApi({
      method: 'POST',
      url,
      json: { packageId, projectId, state, vulnerabilityId },
    });
    return response.statusCode === OK;
  }

  async getScanReports(
    scanId: string,
    reportFormat: ScaReportFormat = 'Json',
    dataTypes: ScaReportDataType[] = ['All'],
  ): Promise<Buffer> {
    if (!REPORT_FORMATS.includes(reportFormat)) {
      throw new TypeError(
        'parameter report_format can only be Json, Xml, Pdf, Csv, CycloneDxJson, or CycloneDxXml',
      );
    }
    if (!Array.isArray(dataTypes)) {
      throw new TypeError('parameter data_types can only be list or tuple');
    }
    for (const item of dataTypes) {
      if (!REPORT_DATA_TYPES.includes(item)) {
        throw new TypeError(
          'dataType can only be All, Packages, Vulnerabilities, Licenses, Policies, SupplyChainRisks',
        );
      }
    }

    const url = `${this.baseUrl}/risk-management/risk-reports/${scanId}/export`;
    const response = await this.apiClient.callApi({
      method: 'GET',
      url,
      params: { format: reportFormat, 'dataType[]': dataTypes },
    });
    return response.content;
  }

  async getAggregatedRisks(
    packageType: string,
    packageName: string,
    version: string,
  ): Promise<Record<string, unknown>> {
    const url = `${this.baseUrl}/public/risk-aggregation/aggregated-risks`;
    const response = await this.apiClient.callApi({
      method: 'POST',
      url,
      json: { packageName, version, packageManager: packageType },
    });
    return response.json<Record<string, unknown>>();
  }

  async getArtifactLicense(
    packageType: string,
    packageName: string,
    version: string,
  ): Promise<Record<string, unknown>> {
    const url = `${this.baseUrl}/public/packages/${packageType}/${packageName}/versions/${version}/licenses`;
    const response = await this.apiClient.callApi({ method: 'GET', url });
    return response.json<Record<string, unknown>>();
  }

  async getArtifactInfo(
    packageType: string,
    packageName: string,
    version: string,
  ): Promise<Record<string, unknown>> {
    const url = `${this.baseUrl}/public/packages/${packageType}/${packageName}/versions/${version}`;
    const response = await this.apiClient.callApi({ method: 'GET', url });
    return response.json<Record<string, unknown>>();
  }

  async getSuggestPrivatePackage(
    packageType: string,
    packageName: string,
    version: string,
  ): Promise<Record<string, unknown>> {
    const url = `${this.baseUrl}/private-dependencies-repository/dependencies`;
    const response = await this.apiClient.callApi({
      method: 'POST',
      url,
      json: [
        {
          origin: 'PrivateArtifactory',
          packageManager: packageType,
          name: packageName,
          version,
        },
      ],
    });
    return response.json<Record<string, unknown>>();
  }

  async executeActionOnPackageVulnerabilities(
    packageName: string,
    packageManager: string,
    vulnerabilityId: string,
    packageVersion: string,
    projectIds: string[],
    actions: ScaRiskAction[],
  ): Promise<boolean> {
    const url = `${this.baseUrl}/management-of-risk/package-vulnerabilities`;
    const response = await this.apiClient.callApi({
      method: 'POST',
      url,
      json: { packageName, packageManager, vulnerabilityId, packageVersion, projectIds, actions },
    });
    return response.statusCode === CREATED;
  }

  async evaluatePackageVulnerabilities(
    scanId: string,
    entities: ScaEntity[],
  ): Promise<ScaEntity[] | undefined> {
    const url = `${this.baseUrl}/management-of-risk/evaluate/package-vulnerabilities`;
    const response = await this.apiClient.callApi({
      method: 'POST',
      url,
      json: { scanId, entities },
    });
    return response.statusCode === OK ? response.json<ScaEntity[]>() : undefined;
  }

  async disableAnActionOfPackageVulnerability(
    packageName: string,
    packageVersion: string,
    packageManager: string,
    vulnerabilityId: string,
    projectIds: string[],
    actionType: string,
  ): Promise<boolean> {
    const url = `${this.baseUrl}/management-of-risk/package-vulnerabilities/disable`;
    const response = await this.apiClient.callApi({
      method: 'POST',
      url,
      json: {
        packageName,
        packageVersion,
        packageManager,
        vulnerabilityId,
        projectIds,
        actionType,
      },
    });
    return response.statusCode === NO_CONTENT;
  }

  async getChangesOfPackageVulnerabilitiesOfAProject(
    projectId: string,
    fromWhen: string,
    skip: number,
    take: number,
  ): Promise<Record<string, unknown> | undefined> {
    const url = `${this.baseUrl}/management-of-risk/package-vulnerabilities/changes`;
    const response = await this.apiClient.callApi({
      method: 'POST',
      url,
      json: { projectId, from: fromWhen, skip, take },
    });
    return response.statusCode === OK ? response.json<Record<string, unknown>>() : undefined;
  }

  async searchEntityProfileOfPackageVulnerabilities(
    packageName: string,
    packageVersion: string,
    packageManager: string,
    vulnerabilityId: string,
    projectId: string,
    actionType: string,
    toWhen: string,
  ): Promise<Record<string, unknown> | undefined> {
    const url = `${this.baseUrl}/management-of-risk/package-vulnerabilities/entity-profile/search`;
    const response = await this.apiClient.callApi({
      method: 'POST',
      url,
      json: {
        packageName,
        packageVersion,
        packageManager,
        vulnerabilityId,
        projectId,
        actionType,
        to: toWhen,
      },
    });
    return response.statusCode === OK ? response.json<Record<string, unknown>>() : undefined;
  }

  async executeActionsOnSupplyChainRisks(
    packageName: string,
    packageManager: string,
    supplyChainRiskId: string,
    packageVersion: string,
    projectIds: string[],
    actions: ScaRiskAction[],
  ): Promise<boolean> {
    const url = `${this.baseUrl}/management-of-risk/package-supply-chain-risks`;
    const response = await this.apiClient.callApi({
      method: 'POST',
      url,
      json: {
        packageName,
        packageManager,
        supplyChainRiskId,
        packageVersion,
        projectIds,
        actions,
      },
    });
    return response.statusCode === CREATED;
  }

  async evaluateSupplyChainRisks(
    scanId: string,
    entities: string[],
  ): Promise<ScaEntity[] | undefined> {
    const url = `${this.baseUrl}/management-of-risk/evaluate/package-supply-chain-risks`;
    const response = await this.apiClient.callApi({
      method: 'POST',
      url,
      json: { scanId, entities },
    });
    return response.statusCode === CREATED ? response.json<ScaEntity[]>() : undefined;
  }

  async disableAnActionForASupplyChainRisk(
    packageName: string,
    packageVersion: string,
    packageManager: string,
    supplyChainRiskId: string,
    projectIds: string[],
    actionType: string,
  ): Promise<boolean> {
    const url = `${this.baseUrl}/management-of-risk/package-supply-chain-risks/disable`;
    const response = await this.apiClient.callApi({
      method: 'POST',
      url,
      json: {
        packageName,
        packageVersion,
        packageManager,
        supplyChainRiskId,
        projectIds,
        actionType,
      },
    });
    return response.statusCode === NO_CONTENT;
  }

  async getChangesOfSupplyChainRisk(
    projectId: string,
    fromWhen: string,
    skip: number,
    take: number,
  ): Promise<Record<string, unknown> | undefined> {
    const url = `${this.baseUrl}/management-of-risk/package-supply-chain-risks/changes`;
    const response = await this.apiClient.callApi({
      method: 'POST',
      url,
      json: { projectId, from: fromWhen, skip, take },
    });
    return response.statusCode === OK ? response.json<Record<string, unknown>>() : undefined;
  }

  async searchEntityProfileOfPackageSupplyChainRisks(
    packageName: string,
    packageVersion: string,
    packageManager: string,
    supplyChainRiskId: string,
    projectId: string,
    actionType: string,
    toWhen: string,
  ): Promise<Record<string, unknown> | undefined> {
    const url = `${this.baseUrl}/management-of-risk/package-supply-chain-risks/entity-profile/search`;
    const response = await this.apiClient.callApi({
      method: 'POST',
      url,
      json: {
        packageName,
        packageVersion,
        packageManager,
        supplyChainRiskId,
        projectId,
        actionType,
        to: toWhen,
      },
    });
    return response.statusCode === OK ? response.json<Record<string, unknown>>() : undefined;
  }

  async executeActionsOnPackageLicense(
    packageId: string,
    licenseName: string,
    projectIds: string[],
    actions: ScaRiskAction[],
  ): Promise<boolean> {
    const url = `${this.baseUrl}/management-of-risk/package-licenses`;
    const response = await this.apiClient.callApi({
      method: 'POST',
      url,
      json: { packageId, licenseName, projectIds, actions },
    });
    return response.statusCode === CREATED;
  }

  async evaluatePackageLicenses(
    entities: ScaEntity[],
    scanId: string,
  ): Promise<ScaEntity[] | undefined> {
    const url = `${this.baseUrl}/management-of-risk/evaluate/package-licenses`;
    const response = await this.apiClient.callApi({
      method: 'POST',
      url,
      json: { entities, scanId },
    });
    return response.statusCode === OK ? response.json<ScaEntity[]>() : undefined;
  }

  async searchEntityProfilesOfPackageLicenses(
    packageId: string,
    licenseName: string,
    projectId: string,
    actionType: string,
    toWhen: string,
  ): Promise<Record<string, unknown> | undefined> {
    const url = `${this.baseUrl}/management-of-risk/package-licenses/entity-profile/search`;
    const response = await this.apiClient.callApi({
      method: 'POST',
      url,
      json: { packageId, licenseName, projectId, actionType, to: toWhen },
    });
    return response.statusCode === OK ? response.json<Record<string, unknown>>() : undefined;
  }

  async createSbomReport(
    scanId: string,
    fileFormat: ScaSbomFileFormat,
    hideDevAndTestDependencies = false,
    showOnlyEffectiveLicenses = false,
  ): Promise<string | undefined> {
    if (!SBOM_FILE_FORMATS.includes(fileFormat)) {
      throw new TypeError('file_format should be CycloneDxJson, CycloneDxXml or SpdxJson');
    }

    const url = `${this.baseUrl}/export/requests`;
    const response = await this.apiClient.callApi({
      method: 'POST',
      url,
      params: {
        hideDevAndTestDependencies: hideDevAndTestDependencies ? 'True' : undefined,
        showOnlyEffectiveLicenses: showOnlyEffectiveLicenses ? 'True' : undefined,
      },
      json: { ScanId: scanId, FileFormat: fileFormat },
    });
    return response.statusCode === ACCEPTED
      ? response.json<{ exportId: string }>().exportId
      : undefined;
  }

  async getSbomReportCreationStatus(exportId: string): Promise<ScaSbomStatus | undefined> {
    const url = `${this.baseUrl}/export/requests`;
    const response = await this.apiClient.callApi({ method: 'GET', url, params: { exportId } });
    return response.statusCode === OK ? response.json<ScaSbomStatus>() : undefined;
  }

  async getSbomSupportedFileFormats(): Promise<Record<string, unknown> | undefined> {
    const url = `${this.baseUrl}/export/file-formats`;
    const response = await this.apiClient.callApi({ method: 'GET', url });
    return response.statusCode === OK ? response.json<Record<string, unknown>>() : undefined;
  }

  async runFileAnalysis(
    filePathToAnalyze: string,
    analysisType = 'sbom',
  ): Promise<string | undefined> {
    const url = `${this.baseUrl}/analysis/requests/`;
    const content = await readFile(filePathToAnalyze);
    const response = await this.apiClient.callApi({
      method: 'POST',
      url,
      params: { AnalysisType: analysisType },
      files: {
        fileToAnalyse: {
          filename: basename(filePathToAnalyze),
          content,
          contentType: 'text/plain',
        },
      },
    });
    return response.statusCode === ACCEPTED
      ? response.json<{ requestId: string }>().requestId
      : undefined;
  }

  async retrieveAnalysisResult(requestId: string): Promise<ScaAnalysisResult | undefined> {
    const url = `${this.baseUrl}/analysis/requests/${requestId}`;
    const response = await this.apiClient.callApi({ method: 'GET', url });
    return response.statusCode === OK ? response.json<ScaAnalysisResult>() : undefined;
  }

  private async query<T>(query: string): Promise<GraphQLResponse<T>> {
    const response = await this.apiClient.callApi({
      method: 'GET',
      url: this.gqlUrl,
      params: { query },
    });
    return response.json<GraphQLResponse<T>>();
  }

  getNumberOfVulnerabilitiesRisksByScanId(scanId: string, isExploitablePathEnabled = false) {
    return this.query<{ vulnerabilitiesRisksByScanId: ScaRiskCounters }>(
      gql.numberOfVulnerabilitiesRisksByScanId(scanId, isExploitablePathEnabled),
    );
  }

  getNumberOfSupplyChainRisksByScanId(scanId: string) {
    return this.query<{ supplyChainRisksByScanId: ScaRiskCounters }>(
      gql.numberOfSupplyChainRisksByScanId(scanId),
    );
  }

  getNumberOfOutdatedPackagesByScanId(scanId: string) {
    return this.query<{ packagesRows: ScaTotalCount }>(
      gql.numberOfOutdatedPackagesByScanId(scanId),
    );
  }

  getNumberOfLegalRisksByScanId(scanId: string) {
    return this.query<{ legalRisksByScanId: ScaRiskCounters }>(
      gql.numberOfLegalRisksByScanId(scanId),
    );
  }

  getVulnerabilitiesRisksByScanId(
    scanId: string,
    isExploitablePathEnabled = false,
    take = 10,
    skip = 0,
  ) {
    return this.query<{
      vulnerabilitiesRisksByScanId: ScaTotalCount & { items: Record<string, unknown>[] };
    }>(gql.vulnerabilitiesRisksByScanId(scanId, isExploitablePathEnabled, take, skip));
  }

  getOneVulnerability(scanId: string, vulnerabilityId: string, packageId: string) {
    return this.query<{ vulnerability: Record<string, unknown> }>(
      gql.oneVulnerability(scanId, vulnerabilityId, packageId),
    );
  }

  getSupplyChainRisksByScanId(scanId: string, take = 10, skip = 0) {
    return this.query<{
      supplyChainRisksByScanId: ScaTotalCount & { items: Record<string, unknown>[] };
    }>(gql.supplyChainRisksByScanId(scanId, take, skip));
  }

  getLegalRisksByScanId(scanId: string, take = 10, skip = 0) {
    return this.query<{ legalRisksByScanId: ScaTotalCount & { items: Record<string, unknown>[] } }>(
      gql.legalRisksByScanId(scanId, take, skip),
    );
  }

  getDirectThirdPartyPackagesByScanId(
    scanId: string,
    isExploitablePathEnabled = false,
    take = 10,
    skip = 0,
    isPrivateDependency = false,
  ) {
    return this.query<{ packagesRows: ScaTotalCount & { items: Record<string, unknown>[] } }>(
      gql.directThirdPartyPackagesByScanId(
        scanId,
        isExploitablePathEnabled,
        take,
        skip,
        isPrivateDependency,
      ),
    );
  }

  getTransitiveThirdPartyPackagesByScanId(
    scanId: string,
    isExploitablePathEnabled = false,
    take = 10,
    skip = 0,
    isPrivateDependency = false,
  ) {
    return this.query<{ packagesRows: ScaTotalCount & { items: Record<string, unknown>[] } }>(
      gql.transitiveThirdPartyPackagesByScanId(
        scanId,
        isExploitablePathEnabled,
        take,
        skip,
        isPrivateDependency,
      ),
    );
  }

  getPackageDetailsByScanIdAndPackageId(
    scanId: string,
    packageId: string,
    isExploitablePathEnabled = false,
  ) {
    return this.query<{ package: Record<string, unknown> }>(
      gql.packageDetailsByScanIdAndPackageId(scanId, packageId, isExploitablePathEnabled),
    );
  }

  getNumberOfPackagesByScanId(scanId: string, isExploitablePathEnabled = false) {
    return this.query<{
      packagesRows: ScaTotalCount & { totalDevCount: number; totalDevOrTestCount: number };
    }>(gql.numberOfPackagesByScanId(scanId, isExploitablePathEnabled));
  }

  getNumberOfDirectThirdPartyPackagesByScanId(
    scanId: string,
    isExploitablePathEnabled = false,
    isPrivateDependency = false,
  ) {
    return this.query<{ packagesRows: ScaPackageCounters }>(
      gql.numberOfDirectThirdPartyPackagesByScanId(
        scanId,
        isExploitablePathEnabled,
        isPrivateDependency,
      ),
    );
  }

  getNumberOfTransitiveThirdPartyPackagesByScanId(
    scanId: string,
    isExploitablePathEnabled = false,
    isPrivateDependency = false,
  ) {
    return this.query<{ packagesRows: ScaPackageCounters }>(
      gql.numberOfTransitiveThirdPartyPackagesByScanId(
        scanId,
        isExploitablePathEnabled,
        isPrivateDependency,
      ),
    );
  }

  getNumberOfPackagesUsedForAccessingSaasServices(
    scanId: string,
    isExploitablePathEnabled = false,
  ) {
    return this.query<{ packagesRows: ScaPackageCounters }>(
      gql.numberOfPackagesUsedForAccessingSaasServices(scanId, isExploitablePathEnabled),
    );
  }

  getContainerPackagesByScanId(scanId: string, fetchRuntimeData = false, take = 10, skip = 0) {
    return this.query<{ containerPackages: ScaTotalCount & { items: Record<string, unknown>[] } }>(
      gql.containerPackagesByScanId(scanId, fetchRuntimeData, take, skip),
    );
  }

  getContainerVulnerabilitiesByScanId(
    scanId: string,
    fetchRuntimeData = false,
    take = 10,
    skip = 0,
  ) {
    return this.query<{
      containerVulnerabilities: ScaTotalCount & { items: Record<string, unknown>[] };
    }>(gql.containerVulnerabilitiesByScanId(scanId, fetchRuntimeData, take, skip));
  }

  getPackageLicensesByScanId(scanId: string, take = 10, skip = 0) {
    return this.query<{
      packageLicensesByScanId: ScaTotalCount & { items: Record<string, unknown>[] };
    }>(gql.packageLicensesByScanId(scanId, take, skip));
  }

  getDownStreamRemediationByScanId(
    scanId: string,
    includeBrokenMethods = true,
    take = 10,
    skip = 0,
  ) {
    return this.query<{
      downstreamRemediation: ScaTotalCount & { items: Record<string, unknown>[] };
    }>(gql.downStreamRemediationByScanId(scanId, includeBrokenMethods, take, skip));
  }

  getScanInfoByScanId(scanId: string) {
    return this.query<{ scanInfo: Record<string, unknown> }>(gql.scanInfoByScanId(scanId));
  }

  getScanProgressByScanId(scanId: string) {
    return this.query<{ scanProgress: Record<string, unknown> }>(gql.scanProgressByScanId(scanId));
  }

  getPackagesFromInventoryByNameAndVersion(
    packageName: string,
    packageVersion: string,
    take = 10,
    skip = 0,
  ) {
    return this.query<{ reportingPackages: Record<string, unknown>[] }>(
      gql.packagesFromInventoryByNameAndVersion(packageName, packageVersion, take, skip),
    );
  }
}
