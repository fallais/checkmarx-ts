import { ApiClient } from '../core/apiClient.js';
import type { Configuration } from '../core/configuration.js';
import { constructConfiguration } from './config.js';

export abstract class SastApiBase {
  readonly apiClient: ApiClient;
  readonly baseUrl: string;

  constructor(apiClient?: ApiClient, configuration?: Partial<Configuration>) {
    this.apiClient = apiClient ?? new ApiClient(constructConfiguration(configuration));
    this.baseUrl = (this.apiClient.configuration.serverBaseUrl ?? '').replace(/\/+$/, '');
  }
}
