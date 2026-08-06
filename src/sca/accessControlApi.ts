import { AccessControl } from '../accessControl/accessControl.js';
import { ApiClient } from '../core/apiClient.js';
import type { Configuration } from '../core/configuration.js';
import { constructConfiguration } from './config.js';

export class AccessControlApi extends AccessControl {
  constructor(apiClient?: ApiClient, configuration?: Partial<Configuration>) {
    const client = apiClient ?? new ApiClient(constructConfiguration(configuration));
    super(client, (client.configuration.iamBaseUrl ?? '').replace(/\/+$/, ''));
  }
}
