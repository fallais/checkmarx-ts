import { AccessControl } from '../accessControl/accessControl.js';
import { ApiClient, isApiClient } from '../core/apiClient.js';
import type { SastApiInit } from './config.js';
import { sastConfiguration } from './config.js';

export class AccessControlApi extends AccessControl {
  constructor(init: SastApiInit) {
    super(isApiClient(init) ? init : new ApiClient(sastConfiguration(init)));
  }
}
