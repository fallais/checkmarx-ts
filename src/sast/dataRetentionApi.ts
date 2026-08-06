import { ACCEPTED, OK } from '../core/httpStatus.js';
import { SastApiBase } from './baseApi.js';
import { getHeaders } from './config.js';
import type { CxDataRetentionRequestStatus, CxDefineDataRetentionResponse } from './types.js';

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export class DataRetentionApi extends SastApiBase {
  async stopDataRetention(apiVersion = '1.0'): Promise<boolean> {
    const response = await this.apiClient.callApi({
      method: 'POST',
      url: `${this.baseUrl}/cxrestapi/sast/dataRetention/stop`,
      headers: getHeaders(apiVersion),
    });
    return response.statusCode === ACCEPTED;
  }

  async defineDataRetentionDateRange(
    startDate: string,
    endDate: string,
    durationLimitInHours: number,
    apiVersion = '1.0',
  ): Promise<CxDefineDataRetentionResponse | undefined> {
    const response = await this.apiClient.callApi({
      method: 'POST',
      url: `${this.baseUrl}/cxrestapi/sast/dataRetention/byDateRange`,
      json: { startDate, endDate, durationLimitInHours },
      headers: getHeaders(apiVersion),
    });
    if (response.statusCode === ACCEPTED && response.text) {
      return response.json<CxDefineDataRetentionResponse>();
    }
    return undefined;
  }

  async defineDataRetentionByNumberOfScans(
    numberOfSuccessfulScansToPreserve: number,
    durationLimitInHours: number,
    apiVersion = '1.0',
  ): Promise<CxDefineDataRetentionResponse | undefined> {
    const response = await this.apiClient.callApi({
      method: 'POST',
      url: `${this.baseUrl}/cxrestapi/sast/dataRetention/byNumberOfScans`,
      json: {
        numOfSuccessfulScansToPreserve: numberOfSuccessfulScansToPreserve,
        durationLimitInHours,
      },
      headers: getHeaders(apiVersion),
    });
    if (response.statusCode === ACCEPTED && response.text) {
      return response.json<CxDefineDataRetentionResponse>();
    }
    return undefined;
  }

  async getDataRetentionRequestStatus(
    requestId: number,
    apiVersion = '1.0',
  ): Promise<CxDataRetentionRequestStatus | undefined> {
    const response = await this.apiClient.callApi({
      method: 'GET',
      url: `${this.baseUrl}/cxrestapi/sast/dataRetention/${requestId}/status`,
      headers: getHeaders(apiVersion),
    });
    return response.statusCode === OK ? response.json<CxDataRetentionRequestStatus>() : undefined;
  }

  /** Keeps everything scanned within the last `numDays` days. */
  async defineDataRetentionByRollingDate(
    numDays: number,
    durationLimitInHours: number,
    apiVersion = '1.0',
  ): Promise<CxDefineDataRetentionResponse | undefined> {
    const startDate = '1900-01-01';
    const end = new Date();
    end.setUTCDate(end.getUTCDate() - numDays);
    return this.defineDataRetentionDateRange(
      startDate,
      toIsoDate(end),
      durationLimitInHours,
      apiVersion,
    );
  }

  /** Keeps everything scanned within the last `numMonths` whole months. */
  async defineDataRetentionByRollingMonths(
    numMonths: number,
    durationLimitInHours: number,
    apiVersion = '1.0',
  ): Promise<CxDefineDataRetentionResponse | undefined> {
    const startDate = '1900-01-01';
    const today = new Date();
    let year = today.getUTCFullYear();
    let month = today.getUTCMonth() + 1 - numMonths;
    while (month < 1) {
      month += 12;
      year -= 1;
    }
    // Day 0 of the following month is the last day of `month`.
    const endDate = new Date(Date.UTC(year, month, 0));
    return this.defineDataRetentionDateRange(
      startDate,
      toIsoDate(endDate),
      durationLimitInHours,
      apiVersion,
    );
  }
}
