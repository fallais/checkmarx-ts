import { OK } from '../core/httpStatus.js';
import { SastApiBase } from './baseApi.js';
import { getHeaders } from './config.js';
import type { CxCustomTask } from './types.js';

export class CustomTasksApi extends SastApiBase {
  async getAllCustomTasks(apiVersion = '1.0'): Promise<CxCustomTask[]> {
    const response = await this.apiClient.callApi({
      method: 'GET',
      url: `${this.baseUrl}/cxrestapi/customTasks`,
      headers: getHeaders(apiVersion),
    });
    return response.statusCode === OK ? response.json<CxCustomTask[]>() : [];
  }

  async getCustomTaskIdByName(taskName: string): Promise<number | undefined> {
    const customTasks = await this.getAllCustomTasks();
    return customTasks.find((task) => task.name === taskName)?.id;
  }

  async getCustomTaskById(taskId: number, apiVersion = '1.0'): Promise<CxCustomTask | undefined> {
    const response = await this.apiClient.callApi({
      method: 'GET',
      url: `${this.baseUrl}/cxrestapi/customTasks/${taskId}`,
      headers: getHeaders(apiVersion),
    });
    return response.statusCode === OK ? response.json<CxCustomTask>() : undefined;
  }

  async getCustomTaskByName(
    taskName: string,
    apiVersion = '1.0',
  ): Promise<CxCustomTask | undefined> {
    const response = await this.apiClient.callApi({
      method: 'GET',
      url: `${this.baseUrl}/cxrestapi/customTasks/name/${taskName}`,
      headers: getHeaders(apiVersion),
    });
    return response.statusCode === OK ? response.json<CxCustomTask[]>()[0] : undefined;
  }
}
