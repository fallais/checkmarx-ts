import type { Configuration } from '../../core/configuration.js';
import { envString } from '../../core/env.js';
import type { SastConfigInput } from '../config.js';
import { sastConfiguration, sastConfigurationFromEnv } from '../config.js';

/**
 * OData is not covered by the REST scope: Checkmarx's own tooling authenticates
 * against it with `sast_api` through a separate client, so the token a REST
 * class holds is not accepted here.
 */
export const ODATA_SCOPE = 'access_control_api sast_api';
export const ODATA_CLIENT_ID = 'resource_owner_sast_client';

export function sastOdataConfiguration(input: SastConfigInput): Configuration {
  return sastConfiguration({
    ...input,
    scope: input.scope ?? ODATA_SCOPE,
    clientId: input.clientId ?? ODATA_CLIENT_ID,
  });
}

/** As `sastConfigurationFromEnv`, with the OData scope and client id. */
export function sastOdataConfigurationFromEnv(env: NodeJS.ProcessEnv = process.env): Configuration {
  return {
    ...sastConfigurationFromEnv(env),
    scope: envString(env, 'CXSAST_SCOPE') ?? ODATA_SCOPE,
    clientId: envString(env, 'CXSAST_CLIENT_ID') ?? ODATA_CLIENT_ID,
  };
}
