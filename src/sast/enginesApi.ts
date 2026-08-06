import { CREATED, NO_CONTENT, OK } from '../core/httpStatus.js';
import { SastApiBase } from './baseApi.js';
import { getHeaders } from './config.js';
import type { CxEngineConfiguration, CxEngineDedication, CxEngineServer } from './types.js';

export interface EngineServerInput {
  name: string;
  uri: string;
  minLoc: number;
  maxLoc: number;
  isBlocked: boolean;
  maxScans?: number;
  dedications?: CxEngineDedication[];
}

export class EnginesApi extends SastApiBase {
  async getAllEngineServerDetails(apiVersion = '5.0'): Promise<CxEngineServer[]> {
    const response = await this.apiClient.callApi({
      method: 'GET',
      url: `${this.baseUrl}/cxrestapi/sast/engineServers`,
      headers: getHeaders(apiVersion),
    });
    return response.statusCode === OK ? response.json<CxEngineServer[]>() : [];
  }

  async getEngineIdByName(engineName: string): Promise<number | undefined> {
    const engines = await this.getAllEngineServerDetails();
    return engines.find((engine) => engine.name === engineName)?.id;
  }

  async registerEngine(
    input: EngineServerInput,
    apiVersion = '5.0',
  ): Promise<CxEngineServer | undefined> {
    const response = await this.apiClient.callApi({
      method: 'POST',
      url: `${this.baseUrl}/cxrestapi/sast/engineServers`,
      json: { ...input, dedications: input.dedications ?? [] },
      headers: getHeaders(apiVersion),
    });
    return response.statusCode === CREATED ? response.json<CxEngineServer>() : undefined;
  }

  async unregisterEngineByEngineId(engineId: number, apiVersion = '5.0'): Promise<boolean> {
    const response = await this.apiClient.callApi({
      method: 'DELETE',
      url: `${this.baseUrl}/cxrestapi/sast/engineServers/${engineId}`,
      headers: getHeaders(apiVersion),
    });
    return response.statusCode === NO_CONTENT;
  }

  async getEngineDetails(
    engineId: number,
    apiVersion = '5.0',
  ): Promise<CxEngineServer | undefined> {
    const response = await this.apiClient.callApi({
      method: 'GET',
      url: `${this.baseUrl}/cxrestapi/sast/engineServers/${engineId}`,
      headers: getHeaders(apiVersion),
    });
    return response.statusCode === OK ? response.json<CxEngineServer>() : undefined;
  }

  async updateEngineServer(
    engineId: number,
    input: EngineServerInput,
    apiVersion = '5.0',
  ): Promise<CxEngineServer | undefined> {
    const response = await this.apiClient.callApi({
      method: 'PUT',
      url: `${this.baseUrl}/cxrestapi/sast/engineServers/${engineId}`,
      json: { ...input, dedications: input.dedications ?? [] },
      headers: getHeaders(apiVersion),
    });
    return response.statusCode === OK ? response.json<CxEngineServer>() : undefined;
  }

  /** Sends only the fields that are set, leaving the rest untouched. */
  async updateAnEngineServerByEditSingleField(
    engineId: number,
    input: Partial<EngineServerInput>,
    apiVersion = '5.0',
  ): Promise<boolean> {
    const payload: Record<string, unknown> = {};
    if (input.name !== undefined) payload['name'] = input.name;
    if (input.uri !== undefined) payload['uri'] = input.uri;
    if (input.minLoc !== undefined) payload['minLoc'] = input.minLoc;
    if (input.maxLoc !== undefined) payload['maxLoc'] = input.maxLoc;
    if (input.isBlocked !== undefined) payload['isBlocked'] = input.isBlocked;
    if (input.maxScans !== undefined) payload['maxScans'] = input.maxScans;
    if (input.dedications !== undefined) payload['dedications'] = input.dedications;

    const response = await this.apiClient.callApi({
      method: 'PATCH',
      url: `${this.baseUrl}/cxrestapi/sast/engineServers/${engineId}`,
      json: payload,
      headers: getHeaders(apiVersion),
    });
    return response.statusCode === NO_CONTENT;
  }

  async getAllEngineConfigurations(apiVersion = '1.0'): Promise<CxEngineConfiguration[]> {
    const response = await this.apiClient.callApi({
      method: 'GET',
      url: `${this.baseUrl}/cxrestapi/sast/engineConfigurations`,
      headers: getHeaders(apiVersion),
    });
    return response.statusCode === OK ? response.json<CxEngineConfiguration[]>() : [];
  }

  async getEngineConfigurationIdByName(
    engineConfigurationName: string,
  ): Promise<number | undefined> {
    const configurations = await this.getAllEngineConfigurations();
    return configurations.find((item) => item.name === engineConfigurationName)?.id;
  }

  async getEngineConfigurationById(
    configurationId: number,
    apiVersion = '1.0',
  ): Promise<CxEngineConfiguration | undefined> {
    const response = await this.apiClient.callApi({
      method: 'GET',
      url: `${this.baseUrl}/cxrestapi/sast/engineConfigurations/${configurationId}`,
      headers: getHeaders(apiVersion),
    });
    return response.statusCode === OK ? response.json<CxEngineConfiguration>() : undefined;
  }
}
