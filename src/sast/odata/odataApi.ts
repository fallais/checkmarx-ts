import { ApiClient, isApiClient } from '../../core/apiClient.js';
import type { CxResponse } from '../../core/response.js';
import { OK } from '../../core/httpStatus.js';
import { VERSION } from '../../core/version.js';
import { SastApiBase } from '../baseApi.js';
import type { SastApiInit } from '../config.js';
import { sastOdataConfiguration } from './config.js';
import { buildOdataQuery, type OdataQuery } from './query.js';
import type { CxOdataResponse } from './types.js';

/** OData wants plain JSON, not the versioned REST media type of `getHeaders`. */
export function getOdataHeaders(extraHeader?: Record<string, string>): Record<string, string> {
  return {
    cxOrigin: `checkmarx-ts ${VERSION}`,
    Accept: 'application/json',
    ...extraHeader,
  };
}

/**
 * The CxSAST OData v1 endpoint (9.x on premise), served by the web interface
 * rather than `/cxrestapi`. The entity classes extend this one, so these
 * helpers cover whatever they do not wrap.
 */
export class OdataApi extends SastApiBase {
  /**
   * A config object is built with the OData scope and client id rather than the
   * REST pair. An `ApiClient` is used as given, so one shared with the REST
   * classes carries a token the OData endpoint rejects.
   */
  constructor(init: SastApiInit) {
    super(isApiClient(init) ? init : new ApiClient(sastOdataConfiguration(init)));
  }

  get odataUrl(): string {
    return `${this.baseUrl}/Cxwebinterface/odata/v1`;
  }

  odataUrlFor(path: string, query?: OdataQuery): string {
    const suffix = path.replace(/^\/+/, '');
    return `${this.odataUrl}/${suffix}${buildOdataQuery(query)}`;
  }

  async request(
    path: string,
    query?: OdataQuery,
    headers?: Record<string, string>,
  ): Promise<CxResponse> {
    return this.apiClient.callApi({
      method: 'GET',
      url: this.odataUrlFor(path, query),
      headers: getOdataHeaders(headers),
    });
  }

  /** One page of entities; `queryAll` and `iterate` follow server-side paging. */
  async query<T>(path: string, query?: OdataQuery): Promise<T[]> {
    const response = await this.request(path, query);
    if (response.statusCode !== OK) return [];
    return response.json<CxOdataResponse<T>>().value ?? [];
  }

  /** Single-entity reads such as `Scans(1000005)` are wrapped in `value` too. */
  async queryOne<T>(path: string, query?: OdataQuery): Promise<T | undefined> {
    return (await this.query<T>(path, query))[0];
  }

  /** Yields every entity, following `@odata.nextLink`. */
  async *iterate<T>(path: string, query?: OdataQuery): AsyncGenerator<T> {
    let response = await this.request(path, query);

    for (;;) {
      if (response.statusCode !== OK) return;
      const payload = response.json<CxOdataResponse<T>>();
      yield* payload.value ?? [];

      const nextLink = payload['@odata.nextLink'];
      if (!nextLink) return;

      response = await this.apiClient.callApi({
        method: 'GET',
        // Relative on some deployments, absolute on others.
        url: new URL(nextLink, `${this.odataUrl}/`).toString(),
        headers: getOdataHeaders(),
      });
    }
  }

  async queryAll<T>(path: string, query?: OdataQuery): Promise<T[]> {
    const items: T[] = [];
    for await (const item of this.iterate<T>(path, query)) items.push(item);
    return items;
  }

  /**
   * `$count` answers with a bare number in plain text, sometimes BOM-prefixed.
   * It has no JSON representation, so asking only for JSON risks a 406.
   */
  async count(path: string, query?: OdataQuery): Promise<number> {
    const response = await this.request(`${path.replace(/\/+$/, '')}/$count`, query, {
      Accept: 'text/plain, */*;q=0.8',
    });
    if (response.statusCode !== OK) return 0;
    const parsed = Number(response.text.replace(/^\uFEFF/, '').trim());
    return Number.isFinite(parsed) ? parsed : 0;
  }
}
