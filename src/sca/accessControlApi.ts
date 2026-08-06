import { AccessControl } from '../accessControl/accessControl.js';
import { ApiClient, isApiClient } from '../core/apiClient.js';
import type { ScaApiInit } from './config.js';
import { scaConfiguration } from './config.js';

export class AccessControlApi extends AccessControl {
  constructor(init: ScaApiInit) {
    const client = isApiClient(init) ? init : new ApiClient(scaConfiguration(init));
    super(client, (client.configuration.iamBaseUrl ?? '').replace(/\/+$/, ''));
  }
}
