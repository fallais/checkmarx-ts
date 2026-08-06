import { readFile } from 'node:fs/promises';
import { basename } from 'node:path';
import { ACCEPTED, CREATED, NO_CONTENT, OK } from '../core/httpStatus.js';
import { SastApiBase } from './baseApi.js';
import { getHeaders } from './config.js';
import type {
  CxCreateNewScanResponse,
  CxCreateScanSettingsResponse,
  CxPolicyFindingResponse,
  CxPolicyFindingsStatus,
  CxScanDetail,
  CxScanFailedGeneralQueries,
  CxScanFailedQueries,
  CxScanParsedFiles,
  CxScanQueueDetail,
  CxScanReportStatus,
  CxScanResult,
  CxScanResultAttackVector,
  CxScanResultAttackVectorByBFL,
  CxScanResultLabelsFields,
  CxScanResultsPage,
  CxScanSettings,
  CxScanStatistics,
  CxStatisticsResult,
  CxRegisterScanReportResponse,
} from './types.js';

export const SCAN_STATUSES = ['Scanning', 'Finished', 'Canceled', 'Failed'] as const;

export type ScanStatus = (typeof SCAN_STATUSES)[number];

export interface CxScanSucceededGeneralQueries {
  id?: number;
  generalQueriesResultCount?: Record<string, unknown>;
}

export interface LastScanIdFilters {
  onlyFinishedScans?: boolean;
  onlyCompletedScans?: boolean;
  onlyRealScans?: boolean;
  onlyFullScans?: boolean;
  onlyPublicScans?: boolean;
}

export interface SastScanSettingsInput {
  projectId: number;
  presetId: number;
  engineConfigurationId?: number;
  postScanActionId?: number;
  failedScanEmails?: string[];
  beforeScanEmails?: string[];
  afterScanEmails?: string[];
  runOnlyWhenNewResults?: boolean;
  runOnlyWhenNewResultsMinSeverity?: number;
  postScanActionArguments?: string;
}

export interface ScanWithSettingsInput {
  projectId: number;
  presetId: number;
  zippedSourceFilePath: string;
  comment?: string;
  overrideProjectSetting?: boolean;
  isIncremental?: boolean;
  isPublic?: boolean;
  forceScan?: boolean;
  engineConfigurationId?: number;
  customFields?: Record<string, unknown>;
  postScanActionId?: number;
  runPostScanOnlyWhenNewResults?: boolean;
  runPostScanMinSeverity?: number;
  postScanActionArguments?: string;
}

export class ScansApi extends SastApiBase {
  async getAllScansForProject(
    projectId?: number,
    scanStatus?: ScanStatus,
    last?: number,
    apiVersion = '1.0',
  ): Promise<CxScanDetail[]> {
    if (scanStatus && !SCAN_STATUSES.includes(scanStatus)) {
      throw new TypeError('scanStatus can only be Scanning, Finished, Canceled, Failed');
    }

    const response = await this.apiClient.callApi({
      method: 'GET',
      url: `${this.baseUrl}/cxrestapi/sast/scans`,
      params: { projectId, scanStatus, last },
      headers: getHeaders(apiVersion),
    });
    return response.statusCode === OK ? response.json<CxScanDetail[]>() : [];
  }

  async getLastScanIdOfAProject(
    projectId: number,
    filters: LastScanIdFilters = {},
  ): Promise<number | undefined> {
    if (!projectId) return undefined;

    const {
      onlyFinishedScans = false,
      onlyCompletedScans = true,
      onlyRealScans = true,
      onlyFullScans = true,
      onlyPublicScans = true,
    } = filters;

    let scans = await this.getAllScansForProject(projectId);
    if (onlyFinishedScans) {
      scans = scans.filter((scan) => scan.status?.name === 'Finished');
    }
    if (onlyCompletedScans) {
      scans = scans.filter(
        (scan) =>
          scan.finishedScanStatus?.value === 'Completed' ||
          scan.finishedScanStatus?.value === undefined,
      );
    }
    if (onlyRealScans) {
      scans = scans.filter((scan) => scan.dateAndTime?.startedOn !== scan.dateAndTime?.finishedOn);
    }
    if (onlyFullScans) {
      scans = scans.filter((scan) => scan.isIncremental === false);
    }
    if (onlyPublicScans) {
      scans = scans.filter((scan) => scan.isPublic === true);
    }

    return [...scans].sort((left, right) => (right.id ?? 0) - (left.id ?? 0))[0]?.id;
  }

  async createNewScan(
    projectId: number,
    isIncremental = false,
    isPublic = true,
    forceScan = true,
    comment = '',
    customFields?: Record<string, unknown>,
    apiVersion = '5.0',
  ): Promise<CxCreateNewScanResponse | undefined> {
    const response = await this.apiClient.callApi({
      method: 'POST',
      url: `${this.baseUrl}/cxrestapi/sast/scans`,
      json: { projectId, isIncremental, isPublic, forceScan, comment, customFields },
      headers: getHeaders(apiVersion),
    });
    return response.statusCode === CREATED ? response.json<CxCreateNewScanResponse>() : undefined;
  }

  async getSastScanDetailsByScanId(
    scanId: number,
    apiVersion = '5.0',
  ): Promise<CxScanDetail | undefined> {
    const response = await this.apiClient.callApi({
      method: 'GET',
      url: `${this.baseUrl}/cxrestapi/sast/scans/${scanId}`,
      headers: getHeaders(apiVersion),
    });
    return response.statusCode === OK ? response.json<CxScanDetail>() : undefined;
  }

  async addOrUpdateACommentByScanId(
    scanId: number,
    comment: string,
    apiVersion = '1.0',
  ): Promise<boolean> {
    const response = await this.apiClient.callApi({
      method: 'PATCH',
      url: `${this.baseUrl}/cxrestapi/sast/scans/${scanId}`,
      json: { comment },
      headers: getHeaders(apiVersion),
    });
    return response.statusCode === NO_CONTENT;
  }

  async deleteScanByScanId(scanId: number, apiVersion = '1.0'): Promise<boolean> {
    const response = await this.apiClient.callApi({
      method: 'DELETE',
      url: `${this.baseUrl}/cxrestapi/sast/scans/${scanId}`,
      headers: getHeaders(apiVersion),
    });
    return response.statusCode === ACCEPTED;
  }

  async getStatisticsResultsByScanId(
    scanId: number,
    apiVersion = '6.0',
  ): Promise<CxStatisticsResult | undefined> {
    const response = await this.apiClient.callApi({
      method: 'GET',
      url: `${this.baseUrl}/cxrestapi/sast/scans/${scanId}/resultsStatistics`,
      headers: getHeaders(apiVersion),
    });
    return response.statusCode === OK ? response.json<CxStatisticsResult>() : undefined;
  }

  async getScanQueueDetailsByScanId(
    scanId: number,
    apiVersion = '1.0',
  ): Promise<CxScanQueueDetail | undefined> {
    const response = await this.apiClient.callApi({
      method: 'GET',
      url: `${this.baseUrl}/cxrestapi/sast/scansQueue/${scanId}`,
      headers: getHeaders(apiVersion),
    });
    return response.statusCode === OK ? response.json<CxScanQueueDetail>() : undefined;
  }

  async updateQueuedScanStatusByScanId(scanId: number, apiVersion = '1.2'): Promise<boolean> {
    const response = await this.apiClient.callApi({
      method: 'PATCH',
      url: `${this.baseUrl}/cxrestapi/sast/scansQueue/${scanId}`,
      json: { status: 'Canceled' },
      headers: getHeaders(apiVersion),
    });
    return response.statusCode === OK;
  }

  cancelScan(scanId: number, apiVersion = '1.2'): Promise<boolean> {
    return this.updateQueuedScanStatusByScanId(scanId, apiVersion);
  }

  async getAllScanDetailsInQueue(
    projectId?: number,
    apiVersion = '1.0',
  ): Promise<CxScanQueueDetail[]> {
    const response = await this.apiClient.callApi({
      method: 'GET',
      url: `${this.baseUrl}/cxrestapi/sast/scansQueue`,
      params: { projectId },
      headers: getHeaders(apiVersion),
    });
    return response.statusCode === OK ? response.json<CxScanQueueDetail[]>() : [];
  }

  async getScanSettingsByProjectId(
    projectId: number,
    apiVersion = '4.0',
  ): Promise<CxScanSettings | undefined> {
    const response = await this.apiClient.callApi({
      method: 'GET',
      url: `${this.baseUrl}/cxrestapi/sast/scanSettings/${projectId}`,
      headers: getHeaders(apiVersion),
    });
    return response.statusCode === OK ? response.json<CxScanSettings>() : undefined;
  }

  async defineSastScanSettings(
    input: SastScanSettingsInput,
    apiVersion = '4.0',
  ): Promise<CxCreateScanSettingsResponse | undefined> {
    const response = await this.apiClient.callApi({
      method: 'POST',
      url: `${this.baseUrl}/cxrestapi/sast/scanSettings`,
      json: scanSettingsPayload(input),
      headers: getHeaders(apiVersion),
    });
    return response.statusCode === OK ? response.json<CxCreateScanSettingsResponse>() : undefined;
  }

  async updateSastScanSettings(
    input: SastScanSettingsInput,
    apiVersion = '4.0',
  ): Promise<CxCreateScanSettingsResponse | undefined> {
    const response = await this.apiClient.callApi({
      method: 'PUT',
      url: `${this.baseUrl}/cxrestapi/sast/scanSettings`,
      json: scanSettingsPayload(input),
      headers: getHeaders(apiVersion),
    });
    return response.statusCode === OK ? response.json<CxCreateScanSettingsResponse>() : undefined;
  }

  async defineSastScanSchedulingSettings(
    projectId: number,
    scheduleType: string,
    scheduleDays: string[],
    scheduleTime: string,
    apiVersion = '1.0',
  ): Promise<boolean> {
    const response = await this.apiClient.callApi({
      method: 'PUT',
      url: `${this.baseUrl}/cxrestapi/sast/project/${projectId}/scheduling`,
      json: { scheduleType, scheduledDays: scheduleDays, scheduleTime },
      headers: getHeaders(apiVersion),
    });
    return response.statusCode === NO_CONTENT;
  }

  async assignTicketToScanResults(
    resultsId: string,
    ticketId: string,
    apiVersion = '1.0',
  ): Promise<boolean> {
    const response = await this.apiClient.callApi({
      method: 'POST',
      url: `${this.baseUrl}/cxrestapi/sast/results/tickets`,
      json: { resultsId: [resultsId], ticketId },
      headers: getHeaders(apiVersion),
    });
    return response.statusCode === NO_CONTENT;
  }

  async publishLastScanResultsToManagementAndOrchestrationByProjectId(
    projectId: number,
    apiVersion = '1.0',
  ): Promise<CxPolicyFindingResponse | undefined> {
    const response = await this.apiClient.callApi({
      method: 'POST',
      url: `${this.baseUrl}/cxrestapi/sast/projects/${projectId}/publisher/policyFindings`,
      headers: getHeaders(apiVersion),
    });
    return response.statusCode === CREATED ? response.json<CxPolicyFindingResponse>() : undefined;
  }

  async getThePublishLastScanResultsToManagementAndOrchestrationStatus(
    projectId: number,
    apiVersion = '1.0',
  ): Promise<CxPolicyFindingsStatus | undefined> {
    const response = await this.apiClient.callApi({
      method: 'GET',
      url: `${this.baseUrl}/cxrestapi/sast/projects/${projectId}/publisher/policyFindings/status`,
      headers: getHeaders(apiVersion),
    });
    return response.statusCode === OK ? response.json<CxPolicyFindingsStatus>() : undefined;
  }

  async getShortVulnerabilityDescriptionForAScanResult(
    scanId: number,
    pathId: number,
    apiVersion = '1.0',
  ): Promise<string | undefined> {
    const response = await this.apiClient.callApi({
      method: 'GET',
      url: `${this.baseUrl}/cxrestapi/sast/scans/${scanId}/results/${pathId}/shortDescription`,
      headers: getHeaders(apiVersion),
    });
    return response.statusCode === OK
      ? response.json<{ shortDescription?: string }>().shortDescription
      : undefined;
  }

  async registerScanReport(
    scanId: number,
    reportType: string,
    apiVersion = '1.0',
  ): Promise<CxRegisterScanReportResponse | undefined> {
    const response = await this.apiClient.callApi({
      method: 'POST',
      url: `${this.baseUrl}/cxrestapi/reports/sastScan`,
      json: { reportType, scanId },
      headers: getHeaders(apiVersion),
    });
    return response.statusCode === ACCEPTED
      ? response.json<CxRegisterScanReportResponse>()
      : undefined;
  }

  async getReportStatusById(
    reportId: number,
    apiVersion = '1.0',
  ): Promise<CxScanReportStatus | undefined> {
    const response = await this.apiClient.callApi({
      method: 'GET',
      url: `${this.baseUrl}/cxrestapi/reports/sastScan/${reportId}/status`,
      headers: getHeaders(apiVersion),
    });
    return response.statusCode === OK ? response.json<CxScanReportStatus>() : undefined;
  }

  async getReportById(reportId: number, apiVersion = '1.0'): Promise<Buffer | undefined> {
    const response = await this.apiClient.callApi({
      method: 'GET',
      url: `${this.baseUrl}/cxrestapi/reports/sastScan/${reportId}`,
      headers: getHeaders(apiVersion),
    });
    return response.statusCode === OK ? response.content : undefined;
  }

  async isScanningFinished(scanId: number): Promise<boolean> {
    const scanDetail = await this.getSastScanDetailsByScanId(scanId);
    return scanDetail?.status?.name === 'Finished';
  }

  async isReportGenerationFinished(reportId: number): Promise<boolean> {
    const reportStatus = await this.getReportStatusById(reportId);
    return reportStatus?.status?.value === 'Created';
  }

  async getScanResultsOfASpecificQuery(
    scanId: number,
    queryVersionCode: number,
    apiVersion = '1.0',
  ): Promise<CxScanResultAttackVector[]> {
    const response = await this.apiClient.callApi({
      method: 'GET',
      url: `${this.baseUrl}/cxrestapi/sast/results/attack-vectors`,
      params: { scanId, queryVersion: queryVersionCode },
      headers: getHeaders(apiVersion),
    });
    return response.statusCode === OK
      ? (response.json<{ attackVectors?: CxScanResultAttackVector[] }>().attackVectors ?? [])
      : [];
  }

  async getScanResultsForASpecificQueryGroupByBestFixLocation(
    scanId: number,
    queryVersionCode: number,
    apiVersion = '1.0',
  ): Promise<CxScanResultAttackVectorByBFL[]> {
    const response = await this.apiClient.callApi({
      method: 'GET',
      url: `${this.baseUrl}/cxrestapi/sast/results/attack-vectors-by-bfl`,
      params: { scanId, queryVersion: queryVersionCode },
      headers: getHeaders(apiVersion),
    });
    return response.statusCode === OK
      ? (response.json<{ attackVectorsByBFL?: CxScanResultAttackVectorByBFL[] }>()
          .attackVectorsByBFL ?? [])
      : [];
  }

  /**
   * `useLabelsPath` targets the CxSAST 9.4+ `/labels` endpoint. Set it to
   * `false` for older servers, which patch the result resource directly.
   */
  async updateScanResultLabelsFields(
    scanId: number,
    resultId: number,
    fields: CxScanResultLabelsFields,
    useLabelsPath = true,
    apiVersion = '1.0',
  ): Promise<boolean> {
    const suffix = useLabelsPath ? '/labels' : '';
    const response = await this.apiClient.callApi({
      method: 'PATCH',
      url: `${this.baseUrl}/cxrestapi/sast/scans/${scanId}/results/${resultId}${suffix}`,
      json: fields,
      headers: getHeaders(apiVersion),
    });
    return response.statusCode === OK;
  }

  async createNewScanWithSettings(
    input: ScanWithSettingsInput,
    apiVersion = '5.0',
  ): Promise<CxCreateNewScanResponse | undefined> {
    const content = await readFile(input.zippedSourceFilePath);

    const data: Record<string, string | number | boolean | undefined> = {
      projectId: String(input.projectId),
      overrideProjectSetting: String(input.overrideProjectSetting ?? false),
      isIncremental: String(input.isIncremental ?? false),
      isPublic: String(input.isPublic ?? true),
      forceScan: String(input.forceScan ?? true),
      presetId: String(input.presetId),
      engineConfigurationId: String(input.engineConfigurationId ?? 0),
    };
    if (input.comment) {
      data['comment'] = String(input.comment);
    }
    if (input.customFields) {
      data['customFields'] = JSON.stringify(input.customFields);
    }
    if (input.postScanActionId) {
      data['postScanActionId'] = String(input.postScanActionId);
      data['postScanActionArguments'] = String(input.postScanActionArguments);
      data['runPostScanOnlyWhenNewResults'] = input.runPostScanOnlyWhenNewResults ?? false;
      data['runPostScanMinSeverity'] = input.runPostScanMinSeverity;
    }

    const response = await this.apiClient.callApi({
      method: 'POST',
      url: `${this.baseUrl}/cxrestapi/sast/scanWithSettings`,
      data,
      files: {
        zippedSource: {
          filename: basename(input.zippedSourceFilePath),
          content,
          contentType: 'application/zip',
        },
      },
      headers: getHeaders(apiVersion),
    });
    return response.statusCode === CREATED ? response.json<CxCreateNewScanResponse>() : undefined;
  }

  async getScanResultLabelsFields(
    scanId: number,
    resultId: number,
    apiVersion = '1.0',
  ): Promise<CxScanResultLabelsFields | undefined> {
    const response = await this.apiClient.callApi({
      method: 'GET',
      url: `${this.baseUrl}/cxrestapi/sast/scans/${scanId}/results/${resultId}/labels`,
      headers: getHeaders(apiVersion),
    });
    return response.statusCode === OK ? response.json<CxScanResultLabelsFields>() : undefined;
  }

  async getScanLogs(scanId: number, apiVersion = '5.0'): Promise<Buffer | undefined> {
    const response = await this.apiClient.callApi({
      method: 'GET',
      url: `${this.baseUrl}/cxrestapi/sast/scans/${scanId}/logs`,
      headers: getHeaders(apiVersion),
    });
    return response.statusCode === OK ? response.content : undefined;
  }

  async getBasicMetricsOfAScan(
    scanId: number,
    apiVersion = '5.0',
  ): Promise<CxScanStatistics | undefined> {
    const response = await this.apiClient.callApi({
      method: 'GET',
      url: `${this.baseUrl}/cxrestapi/sast/scans/${scanId}/statistics`,
      headers: getHeaders(apiVersion),
    });
    return response.statusCode === OK ? response.json<CxScanStatistics>() : undefined;
  }

  async getParsedFilesMetricsOfAScan(
    scanId: number,
    apiVersion = '3.0',
  ): Promise<CxScanParsedFiles | undefined> {
    const response = await this.apiClient.callApi({
      method: 'GET',
      url: `${this.baseUrl}/cxrestapi/sast/scans/${scanId}/parsedFiles`,
      headers: getHeaders(apiVersion),
    });
    return response.statusCode === OK ? response.json<CxScanParsedFiles>() : undefined;
  }

  async getFailedQueriesMetricsOfAScan(
    scanId: number,
    apiVersion = '3.0',
  ): Promise<CxScanFailedQueries | undefined> {
    const response = await this.apiClient.callApi({
      method: 'GET',
      url: `${this.baseUrl}/cxrestapi/sast/scans/${scanId}/failedQueries`,
      headers: getHeaders(apiVersion),
    });
    return response.statusCode === OK ? response.json<CxScanFailedQueries>() : undefined;
  }

  async getFailedGeneralQueriesMetricsOfAScan(
    scanId: number,
    apiVersion = '3.0',
  ): Promise<CxScanFailedGeneralQueries | undefined> {
    const response = await this.apiClient.callApi({
      method: 'GET',
      url: `${this.baseUrl}/cxrestapi/sast/scans/${scanId}/failedGeneralQueries`,
      headers: getHeaders(apiVersion),
    });
    return response.statusCode === OK ? response.json<CxScanFailedGeneralQueries>() : undefined;
  }

  async getSucceededGeneralQueriesMetricsOfAScan(
    scanId: number,
    apiVersion = '3.0',
  ): Promise<CxScanSucceededGeneralQueries | undefined> {
    const response = await this.apiClient.callApi({
      method: 'GET',
      url: `${this.baseUrl}/cxrestapi/sast/scans/${scanId}/succeededGeneralQueries`,
      headers: getHeaders(apiVersion),
    });
    return response.statusCode === OK ? response.json<CxScanSucceededGeneralQueries>() : undefined;
  }

  async getResultPathCommentsHistory(
    scanId: number,
    pathId: number,
    commentToDisplay: 'All' | 'Latest' = 'All',
    apiVersion = '4.0',
  ): Promise<Record<string, unknown> | undefined> {
    if (commentToDisplay !== 'All' && commentToDisplay !== 'Latest') {
      throw new TypeError('parameter comment_to_display accepted value are All, Latest.');
    }

    const response = await this.apiClient.callApi({
      method: 'GET',
      url: `${this.baseUrl}/cxrestapi/sast/resultPathCommentsHistory`,
      params: { id: scanId, pathId, commentToDisplay },
      headers: getHeaders(apiVersion),
    });
    return response.statusCode === OK ? response.json<Record<string, unknown>>() : undefined;
  }

  async lockScan(scanId: number, apiVersion = '4.0'): Promise<boolean> {
    const response = await this.apiClient.callApi({
      method: 'PUT',
      url: `${this.baseUrl}/cxrestapi/sast/lockScan`,
      params: { id: scanId },
      headers: getHeaders(apiVersion),
    });
    return response.statusCode === OK;
  }

  async unlockScan(scanId: number, apiVersion = '4.0'): Promise<boolean> {
    const response = await this.apiClient.callApi({
      method: 'PUT',
      url: `${this.baseUrl}/cxrestapi/sast/unLockScan`,
      params: { id: scanId },
      headers: getHeaders(apiVersion),
    });
    return response.statusCode === OK;
  }

  async getScanResultLabelsActionFields(
    scanId: number,
    pathId: number,
    apiVersion = '5.0',
  ): Promise<Record<string, unknown>[] | undefined> {
    const response = await this.apiClient.callApi({
      method: 'GET',
      url: `${this.baseUrl}/cxrestapi/sast/scans/${scanId}/actionResults/${pathId}/labels`,
      headers: getHeaders(apiVersion),
    });
    return response.statusCode === OK ? response.json<Record<string, unknown>[]>() : undefined;
  }

  async getCompareResultsOfTwoScans(
    oldScanId: number,
    newScanId: number,
    apiVersion = '5.1',
  ): Promise<Record<string, unknown>[] | undefined> {
    const response = await this.apiClient.callApi({
      method: 'GET',
      url: `${this.baseUrl}/cxrestapi/sast/scans/${oldScanId}/compareResultsTo/${newScanId}`,
      headers: getHeaders(apiVersion),
    });
    return response.statusCode === OK
      ? response.json<{ results?: Record<string, unknown>[] }>().results
      : undefined;
  }

  async getCompareResultsSummaryOfTwoScans(
    oldScanId: number,
    newScanId: number,
    apiVersion = '5.0',
  ): Promise<Record<string, unknown> | undefined> {
    const response = await this.apiClient.callApi({
      method: 'GET',
      url: `${this.baseUrl}/cxrestapi/sast/scans/${oldScanId}/compareSummaryTo/${newScanId}`,
      headers: getHeaders(apiVersion),
    });
    return response.statusCode === OK ? response.json<Record<string, unknown>>() : undefined;
  }

  async getACollectionOfScansByProject(
    last?: number,
    projectId?: number,
    scanStatus?: ScanStatus,
    apiVersion = '5.0',
  ): Promise<Record<string, unknown> | undefined> {
    if (scanStatus && !SCAN_STATUSES.includes(scanStatus)) {
      throw new TypeError(
        `parameter scan_status should be a member from list [${SCAN_STATUSES.join(', ')}]`,
      );
    }
    if (scanStatus && (!last || !projectId)) {
      throw new TypeError('Both last and project_id can not be None when scan_status is not None');
    }

    const response = await this.apiClient.callApi({
      method: 'GET',
      url: `${this.baseUrl}/cxrestapi/sast/scans`,
      params: { last, projectId, scanStatus },
      headers: getHeaders(apiVersion),
    });
    return response.statusCode === OK ? response.json<Record<string, unknown>>() : undefined;
  }

  /** `offset` is a page number, not a record offset. */
  async getScanResultsInPagedMode(
    scanId: number,
    offset: number,
    limit: number,
    lcid?: number,
  ): Promise<CxScanResultsPage | undefined> {
    const response = await this.apiClient.callApi({
      method: 'GET',
      url: `${this.baseUrl}/cxrestapi/sast/results`,
      params: { scanId, offset, limit, LCID: lcid },
    });
    return response.statusCode === OK ? response.json<CxScanResultsPage>() : undefined;
  }

  async getAllScanResults(scanId: number, lcid?: number, limit = 200): Promise<CxScanResult[]> {
    const allResults: CxScanResult[] = [];
    const seenPathIds = new Set<number | undefined>();
    let offset = 0;

    for (;;) {
      const page = await this.getScanResultsInPagedMode(scanId, offset, limit, lcid);
      if (!page?.results?.length) break;

      for (const result of page.results) {
        if (!seenPathIds.has(result.pathId)) {
          seenPathIds.add(result.pathId);
          allResults.push(result);
        }
      }

      if (offset * limit + page.results.length >= (page.totalCount ?? 0)) break;
      offset += 1;
    }
    return allResults;
  }
}

function scanSettingsPayload(input: SastScanSettingsInput): Record<string, unknown> {
  return {
    projectId: input.projectId,
    presetId: input.presetId,
    engineConfigurationId: input.engineConfigurationId ?? 1,
    postScanActionId: input.postScanActionId,
    emailNotifications: {
      failedScan: input.failedScanEmails,
      beforeScan: input.beforeScanEmails,
      afterScan: input.afterScanEmails,
    },
    postScanActionConditions: {
      runOnlyWhenNewResults: input.runOnlyWhenNewResults ?? true,
      runOnlyWhenNewResultsMinSeverity: input.runOnlyWhenNewResultsMinSeverity ?? 0,
    },
    postScanActionArguments: input.postScanActionArguments,
  };
}
