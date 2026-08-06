import { OK } from '../core/httpStatus.js';
import { SastApiBase } from './baseApi.js';
import { getHeaders } from './config.js';
import type { CxCustomField } from './types.js';

export class CustomFieldsApi extends SastApiBase {
  async getAllCustomFields(apiVersion = '5.0'): Promise<CxCustomField[]> {
    const response = await this.apiClient.callApi({
      method: 'GET',
      url: `${this.baseUrl}/cxrestapi/customFields`,
      headers: getHeaders(apiVersion),
    });
    return response.statusCode === OK ? response.json<CxCustomField[]>() : [];
  }

  async getCustomFieldIdByName(customFieldName: string): Promise<number | undefined> {
    const allCustomFields = await this.getAllCustomFields();
    return allCustomFields.find((field) => field.name === customFieldName)?.id;
  }
}
