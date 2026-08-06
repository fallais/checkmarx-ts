import { ACCEPTED, NO_CONTENT, OK } from '../core/httpStatus.js';
import { SastApiBase } from './baseApi.js';
import { getHeaders } from './config.js';
import type { CxServerLicenseData, CxTranslationInput, CxUserPersistence } from './types.js';

export const RESULT_AUDIT_UPDATE_TYPES = [
  'ALL',
  'ASSIGN',
  'RESULT_COMMENT',
  'RESULT_SEVERITY',
  'RESULT_STATE',
] as const;

export type ResultAuditUpdateType = (typeof RESULT_AUDIT_UPDATE_TYPES)[number];

export interface CxResultStateName {
  languageId?: number;
  name?: string;
  isConstant?: boolean;
}

export interface CxResultState {
  id?: number;
  names?: CxResultStateName[];
  permission?: string;
}

export interface CxSystemVersion {
  version?: string;
  hotFix?: string;
  enginePackVersion?: string;
  [key: string]: unknown;
}

export class GeneralApi extends SastApiBase {
  async getServerLicenseData(apiVersion = '4.0'): Promise<CxServerLicenseData | undefined> {
    const response = await this.apiClient.callApi({
      method: 'GET',
      url: `${this.baseUrl}/cxrestapi/serverLicenseData`,
      headers: getHeaders(apiVersion),
    });
    return response.statusCode === OK ? response.json<CxServerLicenseData>() : undefined;
  }

  async getServerSystemVersion(apiVersion = '1.1'): Promise<CxSystemVersion | undefined> {
    const response = await this.apiClient.callApi({
      method: 'GET',
      url: `${this.baseUrl}/cxrestapi/system/version`,
      headers: getHeaders(apiVersion),
    });
    return response.statusCode === OK ? response.json<CxSystemVersion>() : undefined;
  }

  async getResultStates(apiVersion = '4.0'): Promise<CxResultState[] | undefined> {
    const response = await this.apiClient.callApi({
      method: 'GET',
      url: `${this.baseUrl}/cxrestapi/sast/resultStates`,
      headers: getHeaders(apiVersion),
    });
    return response.statusCode === OK ? response.json<CxResultState[]>() : undefined;
  }

  async createResultState(
    translationInputs: CxTranslationInput[],
    permission: string,
    apiVersion = '4.0',
  ): Promise<number | undefined> {
    const response = await this.apiClient.callApi({
      method: 'POST',
      url: `${this.baseUrl}/cxrestapi/sast/resultStates`,
      json: { names: translationInputs, permission },
      headers: getHeaders(apiVersion),
    });
    return response.statusCode === OK ? response.json<{ id: number }>().id : undefined;
  }

  async updateResultState(
    stateId: number,
    translationInputs: CxTranslationInput[],
    permission: string,
    apiVersion = '4.0',
  ): Promise<boolean> {
    const response = await this.apiClient.callApi({
      method: 'PATCH',
      url: `${this.baseUrl}/cxrestapi/sast/resultStates/${stateId}`,
      json: { names: translationInputs, permission },
      headers: getHeaders(apiVersion),
    });
    return response.statusCode === NO_CONTENT;
  }

  async deleteResultState(stateId: number, apiVersion = '4.0'): Promise<boolean> {
    const response = await this.apiClient.callApi({
      method: 'DELETE',
      url: `${this.baseUrl}/cxrestapi/sast/resultStates/${stateId}`,
      headers: getHeaders(apiVersion),
    });
    return response.statusCode === ACCEPTED;
  }

  async getAllScheduledJobs(apiVersion = '4.0'): Promise<Record<string, unknown>[] | undefined> {
    const response = await this.apiClient.callApi({
      method: 'GET',
      url: `${this.baseUrl}/cxrestapi/sast/scheduledJobs`,
      headers: getHeaders(apiVersion),
    });
    return response.statusCode === OK ? response.json<Record<string, unknown>[]>() : undefined;
  }

  async getUserPersistenceDataForCurrentUser(
    persistenceKeys: string[],
    apiVersion = '5.0',
  ): Promise<CxUserPersistence[] | undefined> {
    const response = await this.apiClient.callApi({
      method: 'GET',
      url: `${this.baseUrl}/cxrestapi/userPersistence`,
      params: { persistenceKeys },
      headers: getHeaders(apiVersion),
    });
    return response.statusCode === OK ? response.json<CxUserPersistence[]>() : undefined;
  }

  async updatePersistenceDataForCurrentUser(
    persistenceItems: CxUserPersistence[],
    apiVersion = '5.0',
  ): Promise<boolean> {
    const response = await this.apiClient.callApi({
      method: 'PATCH',
      url: `${this.baseUrl}/cxrestapi/userPersistence`,
      json: persistenceItems,
      headers: getHeaders(apiVersion),
    });
    return response.statusCode === OK;
  }

  async getAuditTrailForRoles(
    fromDate: string,
    toDate: string,
    apiVersion = '5.0',
  ): Promise<Record<string, unknown>[] | undefined> {
    return this.getAuditTrail('roles', { fromDate, toDate }, apiVersion);
  }

  async getAuditTrailForTeams(
    fromDate: string,
    toDate: string,
    apiVersion = '5.0',
  ): Promise<Record<string, unknown>[] | undefined> {
    return this.getAuditTrail('teams', { fromDate, toDate }, apiVersion);
  }

  async getAuditTrailForPresets(
    fromDate: string,
    toDate: string,
    apiVersion = '5.0',
  ): Promise<Record<string, unknown>[] | undefined> {
    return this.getAuditTrail('presets', { fromDate, toDate }, apiVersion);
  }

  async getAuditTrailForResults(
    fromDate: string,
    toDate: string,
    updateType: ResultAuditUpdateType = 'ALL',
    apiVersion = '5.0',
  ): Promise<Record<string, unknown>[] | undefined> {
    if (!RESULT_AUDIT_UPDATE_TYPES.includes(updateType)) {
      throw new TypeError(
        `parameter update_type should be a member of list [${RESULT_AUDIT_UPDATE_TYPES.join(', ')}]`,
      );
    }
    return this.getAuditTrail('results', { updateType, fromDate, toDate }, apiVersion);
  }

  private async getAuditTrail(
    resource: string,
    params: Record<string, string>,
    apiVersion: string,
  ): Promise<Record<string, unknown>[] | undefined> {
    const response = await this.apiClient.callApi({
      method: 'GET',
      url: `${this.baseUrl}/cxrestapi/sast/${resource}/auditTrail`,
      params,
      headers: getHeaders(apiVersion),
    });
    return response.statusCode === OK ? response.json<Record<string, unknown>[]>() : undefined;
  }
}
