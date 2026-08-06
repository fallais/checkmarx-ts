import { OK } from '../core/httpStatus.js';
import { SastApiBase } from './baseApi.js';
import { getHeaders } from './config.js';

export interface CxSASTConfig {
  key?: string;
  value?: string;
  description?: string;
}

export class ConfigurationApi extends SastApiBase {
  async getCxComponentConfigurationSettings(
    group: string,
    apiVersion = '1.0',
  ): Promise<CxSASTConfig[]> {
    const response = await this.apiClient.callApi({
      method: 'GET',
      url: `${this.baseUrl}/cxrestapi/configurationsExtended/${group}`,
      headers: getHeaders(apiVersion),
    });
    return response.statusCode === OK ? response.json<CxSASTConfig[]>() : [];
  }

  async updateCxComponentConfigurationSettings(
    group: string,
    keyValueList: CxSASTConfig[],
    apiVersion = '1.0',
  ): Promise<boolean> {
    const response = await this.apiClient.callApi({
      method: 'PUT',
      url: `${this.baseUrl}/cxrestapi/configurationsExtended/${group}`,
      json: keyValueList.map((item) => ({ key: item.key, value: item.value })),
      headers: getHeaders(apiVersion),
    });
    return response.statusCode === OK;
  }
}
