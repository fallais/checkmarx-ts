import { readFile } from 'node:fs/promises';
import { basename } from 'node:path';
import { ACCEPTED, OK } from '../core/httpStatus.js';
import { SastApiBase } from './baseApi.js';
import { getHeaders } from './config.js';
import type {
  CxOsaLibrary,
  CxOsaLicense,
  CxOsaScanDetail,
  CxOsaSummaryReport,
  CxOsaVulnerability,
  CxOsaVulnerabilityComment,
} from './types.js';

export interface OsaVulnerabilityFilters {
  page?: number;
  itemsPerPage?: number;
  libraryId?: string;
  stateId?: number;
  comment?: string;
  since?: number;
  until?: number;
}

export class OsaApi extends SastApiBase {
  async getAllOsaScanDetailsForProject(
    projectId: number,
    page = 1,
    itemsPerPage = 100,
    apiVersion = '1.0',
  ): Promise<CxOsaScanDetail[]> {
    const response = await this.apiClient.callApi({
      method: 'GET',
      url: `${this.baseUrl}/cxrestapi/osa/scans`,
      params: { projectId, page: page || undefined, itemsPerPage: itemsPerPage || undefined },
      headers: getHeaders(apiVersion),
    });
    return response.statusCode === OK ? response.json<CxOsaScanDetail[]>() : [];
  }

  async getLastOsaScanIdOfAProject(
    projectId: number,
    succeeded = true,
  ): Promise<string | undefined> {
    if (!projectId) return undefined;

    let scans = await this.getAllOsaScanDetailsForProject(projectId);
    if (scans.length === 0) return undefined;
    if (succeeded) {
      scans = scans.filter((scan) => scan.state?.name === 'Succeeded');
    }
    const sorted = [...scans].sort((left, right) =>
      (right.startAnalyzeTime ?? '').localeCompare(left.startAnalyzeTime ?? ''),
    );
    return sorted[0]?.id;
  }

  async getOsaScanByScanId(
    scanId: string,
    apiVersion = '1.0',
  ): Promise<CxOsaScanDetail | undefined> {
    const response = await this.apiClient.callApi({
      method: 'GET',
      url: `${this.baseUrl}/cxrestapi/osa/scans/${scanId}`,
      headers: getHeaders(apiVersion),
    });
    return response.statusCode === OK ? response.json<CxOsaScanDetail>() : undefined;
  }

  async createAnOsaScanRequest(
    projectId: number,
    zippedSourcePath: string,
    origin = 'REST API',
    apiVersion = '1.0',
  ): Promise<string | undefined> {
    const content = await readFile(zippedSourcePath);
    const headers = getHeaders(apiVersion);
    const response = await this.apiClient.callApi({
      method: 'POST',
      url: `${this.baseUrl}/cxrestapi/osa/scans`,
      params: { projectId },
      data: { projectId: String(projectId), origin: origin || headers['cxOrigin'] },
      files: {
        zippedSource: {
          filename: basename(zippedSourcePath),
          content,
          contentType: 'application/zip',
        },
      },
      headers,
    });
    return response.statusCode === ACCEPTED
      ? response.json<{ scanId: string }>().scanId
      : undefined;
  }

  async getAllOsaFileExtensions(apiVersion = '1.0'): Promise<string | undefined> {
    const response = await this.apiClient.callApi({
      method: 'GET',
      url: `${this.baseUrl}/cxrestapi/osa/fileextensions`,
      headers: getHeaders(apiVersion),
    });
    return response.statusCode === OK ? response.text : undefined;
  }

  async getOsaLicensesById(scanId: string, apiVersion = '1.0'): Promise<CxOsaLicense[]> {
    const response = await this.apiClient.callApi({
      method: 'GET',
      url: `${this.baseUrl}/cxrestapi/osa/licenses`,
      params: { scanId },
      headers: getHeaders(apiVersion),
    });
    return response.statusCode === OK ? response.json<CxOsaLicense[]>() : [];
  }

  async getOsaScanLibraries(
    scanId: string,
    page = 1,
    itemsPerPage = 100,
    apiVersion = '1.0',
  ): Promise<CxOsaLibrary[]> {
    const response = await this.apiClient.callApi({
      method: 'GET',
      url: `${this.baseUrl}/cxrestapi/osa/libraries`,
      params: { scanId, page: page || undefined, itemsPerPage: itemsPerPage || undefined },
      headers: getHeaders(apiVersion),
    });
    return response.statusCode === OK ? response.json<CxOsaLibrary[]>() : [];
  }

  async getOsaScanVulnerabilitiesById(
    scanId: string,
    filters: OsaVulnerabilityFilters = {},
    apiVersion = '1.0',
  ): Promise<CxOsaVulnerability[]> {
    const { page = 1, itemsPerPage = 100, libraryId, stateId, comment, since, until } = filters;
    const response = await this.apiClient.callApi({
      method: 'GET',
      url: `${this.baseUrl}/cxrestapi/osa/vulnerabilities`,
      params: {
        scanId,
        page: page || undefined,
        itemsPerPage: itemsPerPage || undefined,
        libraryId,
        stateId,
        comment,
        since,
        until,
      },
      headers: getHeaders(apiVersion),
    });
    return response.statusCode === OK ? response.json<CxOsaVulnerability[]>() : [];
  }

  async getFirstVulnerabilityId(scanId: string): Promise<string | undefined> {
    const vulnerabilities = await this.getOsaScanVulnerabilitiesById(scanId);
    return vulnerabilities[0]?.id;
  }

  async getOsaScanVulnerabilityCommentsById(
    vulnerabilityId: string,
    projectId: number,
    apiVersion = '1.0',
  ): Promise<CxOsaVulnerabilityComment[]> {
    const response = await this.apiClient.callApi({
      method: 'GET',
      url: `${this.baseUrl}/cxrestapi/osa/vulnerabilities/${vulnerabilityId}/comments`,
      params: { projectId },
      headers: getHeaders(apiVersion),
    });
    return response.statusCode === OK ? response.json<CxOsaVulnerabilityComment[]>() : [];
  }

  async getOsaScanSummaryReport(
    scanId: string,
    apiVersion = '1.0',
  ): Promise<CxOsaSummaryReport | undefined> {
    const response = await this.apiClient.callApi({
      method: 'GET',
      url: `${this.baseUrl}/cxrestapi/osa/reports`,
      params: { scanId },
      headers: getHeaders(apiVersion),
    });
    return response.statusCode === OK ? response.json<CxOsaSummaryReport>() : undefined;
  }
}
