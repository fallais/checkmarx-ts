import { OK } from '../core/httpStatus.js';
import { SastApiBase } from './baseApi.js';
import { getHeaders } from './config.js';

export const CHECKMARX_SUPPORTED_LANGUAGES = [
  'Apex',
  'ASP',
  'Cobol',
  'CPP',
  'CSharp',
  'Dart',
  'Go',
  'Groovy',
  'Java',
  'JavaScript',
  'Kotlin',
  'Lua',
  'Objc',
  'Perl',
  'PHP',
  'PLSQL',
  'Python',
  'RPG',
  'Ruby',
  'Rust',
  'Scala',
  'Swift',
  'VB6',
  'VbNet',
  'VbScript',
] as const;

export type CheckmarxLanguage = (typeof CHECKMARX_SUPPORTED_LANGUAGES)[number];

export const QUERY_SEVERITIES = ['High', 'Medium', 'Low', 'Info'] as const;

export type QuerySeverity = (typeof QUERY_SEVERITIES)[number];

export interface CxQueryVersionCode {
  queryId?: number;
  queryVersionCode?: number;
  [key: string]: unknown;
}

export class QueriesApi extends SastApiBase {
  async getTheFullDescriptionOfTheQuery(
    queryId: number,
    apiVersion = '3.0',
  ): Promise<string | undefined> {
    const response = await this.apiClient.callApi({
      method: 'GET',
      url: `${this.baseUrl}/cxrestapi/queries/${queryId}/cxDescription`,
      headers: getHeaders(apiVersion),
    });
    return response.statusCode === OK ? response.json<string>() : undefined;
  }

  async getQueryIdAndQueryVersionCode(
    language: CheckmarxLanguage,
    queryName: string,
    severity: QuerySeverity = 'High',
    apiVersion = '4.0',
  ): Promise<CxQueryVersionCode | undefined> {
    if (language && !CHECKMARX_SUPPORTED_LANGUAGES.includes(language)) {
      throw new TypeError(
        `language wrong value, supported languages: ${CHECKMARX_SUPPORTED_LANGUAGES.join(',')}`,
      );
    }
    if (severity && !QUERY_SEVERITIES.includes(severity)) {
      throw new TypeError(
        `severity wrong value, supported severity: ${QUERY_SEVERITIES.join(',')}`,
      );
    }

    const response = await this.apiClient.callApi({
      method: 'GET',
      url: `${this.baseUrl}/cxrestapi/queries/queryVersionCode`,
      params: { language, severity, queryName },
      headers: getHeaders(apiVersion),
    });
    return response.statusCode === OK ? response.json<CxQueryVersionCode>() : undefined;
  }

  async getPresetDetail(
    presetId: number,
    apiVersion = '5.0',
  ): Promise<Record<string, unknown>[] | undefined> {
    const response = await this.apiClient.callApi({
      method: 'GET',
      url: `${this.baseUrl}/cxrestapi/sast/presetDetails/${presetId}`,
      headers: getHeaders(apiVersion),
    });
    return response.statusCode === OK ? response.json<Record<string, unknown>[]>() : undefined;
  }
}
