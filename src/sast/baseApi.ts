import { ApiClient, isApiClient } from '../core/apiClient.js';
import type { SastApiInit } from './config.js';
import { sastConfiguration } from './config.js';

export abstract class SastApiBase {
  readonly apiClient: ApiClient;
  readonly baseUrl: string;

  constructor(init: SastApiInit) {
    this.apiClient = isApiClient(init) ? init : new ApiClient(sastConfiguration(init));
    this.baseUrl = (this.apiClient.configuration.serverBaseUrl ?? '').replace(/\/+$/, '');
  }
}
