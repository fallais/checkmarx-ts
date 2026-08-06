import { readFileSync } from 'node:fs';
import { Agent, FormData, ProxyAgent, fetch, type Dispatcher } from 'undici';
import type { Configuration } from './configuration.js';
import { CxError } from './errors.js';
import { ACCEPTED, CREATED, NO_CONTENT, OK, UNAUTHORIZED } from './httpStatus.js';
import type { Logger } from './logger.js';
import { createConsoleLogger, silentLogger } from './logger.js';
import { RateLimiter } from './rateLimiter.js';
import { createResponse, type CxResponse } from './response.js';
import { VERSION } from './version.js';

export type QueryValue = string | number | boolean | null | undefined;
export type QueryParams = Record<string, QueryValue | readonly QueryValue[]>;

export interface FilePart {
  filename: string;
  content: Buffer | Uint8Array | string;
  contentType?: string;
}

export interface CallApiOptions {
  method: string;
  url: string;
  params?: QueryParams;
  /**
   * A record is sent as `application/x-www-form-urlencoded`; a string, Buffer or
   * Uint8Array is sent verbatim as the request body.
   */
  data?: Record<string, string | number | boolean | undefined> | string | Buffer | Uint8Array;
  files?: Record<string, FilePart>;
  json?: unknown;
  headers?: Record<string, string>;
}

const RETRYABLE_SERVER_STATUSES = new Set([500, 502, 503, 504]);
const TOO_MANY_REQUESTS = 429;

function sleep(seconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
}

export function createDispatcher(configuration: Configuration): Dispatcher {
  const rawVerify = configuration.verify;
  const verifyDisabled = rawVerify === false || String(rawVerify).toLowerCase() === 'false';

  const tls: {
    rejectUnauthorized: boolean;
    ca?: Buffer;
    cert?: Buffer;
    key?: Buffer;
    minVersion: 'TLSv1.2';
    maxVersion: 'TLSv1.3';
  } = {
    rejectUnauthorized: !verifyDisabled,
    minVersion: 'TLSv1.2',
    maxVersion: 'TLSv1.3',
  };

  if (!verifyDisabled && typeof rawVerify === 'string' && rawVerify.toLowerCase() !== 'true') {
    tls.ca = readFileSync(rawVerify);
  }
  if (configuration.cert) {
    const pem = readFileSync(configuration.cert);
    tls.cert = pem;
    tls.key = configuration.key ? readFileSync(configuration.key) : pem;
  }

  if (configuration.proxy) {
    return new ProxyAgent({ uri: configuration.proxy, requestTls: tls });
  }
  return new Agent({ connect: tls });
}

export function createTokenRequestData(configuration: Configuration): Record<string, string> {
  const tokenUrl = configuration.tokenUrl ?? '';

  const withDefined = (entries: Record<string, string | undefined>): Record<string, string> => {
    const result: Record<string, string> = {};
    for (const [key, value] of Object.entries(entries)) {
      if (value !== undefined) result[key] = value;
    }
    return result;
  };

  if (tokenUrl.includes('/auth/realms/') && tokenUrl.includes('/protocol/openid-connect/token')) {
    if (configuration.grantType === 'refresh_token') {
      return withDefined({
        grant_type: 'refresh_token',
        client_id: 'ast-app',
        refresh_token: configuration.apiKey,
      });
    }
    return withDefined({
      grant_type: 'client_credentials',
      client_id: configuration.clientId,
      client_secret: configuration.clientSecret,
    });
  }

  if (tokenUrl.includes('platform.checkmarx.net')) {
    return withDefined({
      username: configuration.username,
      password: configuration.password,
      acr_values: `Tenant:${String(configuration.tenantName)}`,
      grant_type: 'password',
      scope: configuration.scope,
      client_id: 'sca_resource_owner',
    });
  }

  return withDefined({
    username: configuration.username,
    password: configuration.password,
    grant_type: configuration.grantType,
    scope: configuration.scope,
    client_id: configuration.clientId,
    client_secret: configuration.clientSecret,
  });
}

export class TokenManager {
  private currentToken: string | undefined;
  private inFlight: Promise<string> | undefined;

  constructor(private readonly tokenRefreshFunc: () => Promise<string>) {}

  async getToken(): Promise<string> {
    if (this.currentToken === undefined) {
      await this.refreshToken();
    }
    return this.currentToken as string;
  }

  /** Concurrent callers share a single refresh rather than stampeding the IdP. */
  async refreshToken(): Promise<void> {
    this.inFlight ??= this.tokenRefreshFunc().finally(() => {
      this.inFlight = undefined;
    });
    this.currentToken = await this.inFlight;
  }
}

export function checkResponse(response: CxResponse): void {
  const { method } = response.request;
  const status = response.statusCode;

  const invalid =
    (['GET', 'HEAD'].includes(method) && ![OK, UNAUTHORIZED].includes(status)) ||
    (method === 'POST' && ![OK, NO_CONTENT, CREATED, UNAUTHORIZED, ACCEPTED].includes(status)) ||
    (['PUT', 'PATCH', 'DELETE'].includes(method) &&
      ![OK, NO_CONTENT, ACCEPTED, UNAUTHORIZED].includes(status));

  if (invalid) {
    throw new CxError(response.text, status);
  }
}

export class ApiClient {
  readonly configuration: Configuration;
  readonly urlPrefix: string;
  readonly logger: Logger;

  private readonly dispatcher: Dispatcher;
  private readonly tokenReqData: Record<string, string>;
  private readonly tokenManager: TokenManager;
  private readonly rateLimiter: RateLimiter;

  constructor(configuration: Configuration, urlPrefix = '') {
    this.configuration = configuration;
    this.urlPrefix = urlPrefix;
    this.logger =
      configuration.logger ??
      (configuration.loggingLevel === 'SILENT'
        ? silentLogger
        : createConsoleLogger(configuration.loggingLevel, 'checkmarx-ts'));

    this.dispatcher = createDispatcher(configuration);
    this.tokenReqData = createTokenRequestData(configuration);
    this.tokenManager = new TokenManager(() => this.refreshToken());

    const capacity = configuration.rateLimitCapacity;
    const refillRate =
      configuration.rateLimitRefillRate ?? capacity / configuration.rateLimitPeriod;
    this.rateLimiter = new RateLimiter(capacity, refillRate, this.logger);
  }

  async refreshToken(): Promise<string> {
    const tokenUrl = this.configuration.tokenUrl;
    if (!tokenUrl) {
      throw new CxError('No token_url configured', 0);
    }

    const response = await fetch(tokenUrl, {
      method: 'POST',
      body: new URLSearchParams(this.tokenReqData),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': `checkmarx-ts/${VERSION}`,
      },
      dispatcher: this.dispatcher,
      signal: AbortSignal.timeout(this.configuration.timeout * 1000),
    });

    const text = await response.text();
    if (response.status < 200 || response.status >= 300) {
      throw new CxError(`Failed to obtain access token: ${text}`, response.status);
    }
    const payload = JSON.parse(text) as { access_token?: string };
    if (!payload.access_token) {
      throw new CxError(
        'Access token missing from the identity provider response',
        response.status,
      );
    }
    return payload.access_token;
  }

  /** Retries on 401 (after refreshing the token), 5xx, and 429. */
  async callApi(options: CallApiOptions): Promise<CxResponse> {
    const maxRetries = this.configuration.maxRetries;
    let retries = 0;

    for (;;) {
      const headers = { ...(options.headers ?? {}) };
      headers['Authorization'] = `Bearer ${await this.tokenManager.getToken()}`;

      const response = await this.sendRequest({ ...options, headers });

      if (response.statusCode === UNAUTHORIZED) {
        if (retries < maxRetries) {
          await this.tokenManager.refreshToken();
          retries += 1;
          continue;
        }
        throw new CxError(response.text, response.statusCode);
      }

      if (RETRYABLE_SERVER_STATUSES.has(response.statusCode)) {
        if (retries < maxRetries) {
          retries += 1;
          continue;
        }
        throw new CxError(response.text, response.statusCode);
      }

      if (response.statusCode === TOO_MANY_REQUESTS) {
        if (retries < maxRetries) {
          const backoff = resolveBackoff(response.headers['retry-after'], retries);
          this.logger.warning(
            `Rate limited (429), waiting ${backoff.toFixed(2)} seconds before retrying...`,
          );
          await sleep(backoff);
          retries += 1;
          continue;
        }
        throw new CxError(response.text, response.statusCode);
      }

      checkResponse(response);
      return response;
    }
  }

  private async sendRequest(options: CallApiOptions): Promise<CxResponse> {
    if (!(await this.rateLimiter.acquire())) {
      throw new CxError('Rate limiter failed to acquire token', 0);
    }

    const headers: Record<string, string> = {
      'User-Agent': `checkmarx-ts/${VERSION}`,
      ...(options.headers ?? {}),
    };

    let body: string | Uint8Array | FormData | undefined;
    if (options.files) {
      // Let fetch set the multipart boundary; an inherited Content-Type would break it.
      delete headers['Content-Type'];
      delete headers['content-type'];
      const form = new FormData();
      for (const [field, part] of Object.entries(options.files)) {
        const bytes =
          typeof part.content === 'string' ? Buffer.from(part.content) : Buffer.from(part.content);
        form.append(
          field,
          new Blob([bytes], { type: part.contentType ?? 'application/octet-stream' }),
          part.filename,
        );
      }
      if (options.data && typeof options.data === 'object') {
        for (const [field, value] of Object.entries(options.data)) {
          if (value !== undefined) form.append(field, String(value));
        }
      }
      body = form;
    } else if (options.json !== undefined) {
      headers['Content-Type'] ??= 'application/json';
      body = JSON.stringify(options.json);
    } else if (typeof options.data === 'string' || ArrayBuffer.isView(options.data)) {
      body = options.data;
    } else if (options.data) {
      headers['Content-Type'] ??= 'application/x-www-form-urlencoded';
      const form = new URLSearchParams();
      for (const [field, value] of Object.entries(options.data)) {
        if (value !== undefined) form.append(field, String(value));
      }
      body = form.toString();
    }

    const url = buildUrl(options.url, options.params);
    const response = await fetch(url, {
      method: options.method,
      headers,
      body,
      dispatcher: this.dispatcher,
      signal: AbortSignal.timeout(this.configuration.timeout * 1000),
      redirect: 'follow',
    });

    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key.toLowerCase()] = value;
    });

    return createResponse(
      response.status,
      responseHeaders,
      Buffer.from(await response.arrayBuffer()),
      { method: options.method, url },
    );
  }

  headRequest(url: string, headers?: Record<string, string>, params?: QueryParams) {
    return this.callApi({ method: 'HEAD', url, headers, params });
  }

  getRequest(url: string, headers?: Record<string, string>, params?: QueryParams) {
    return this.callApi({ method: 'GET', url, headers, params });
  }

  postRequest(url: string, options: Omit<CallApiOptions, 'method' | 'url'> = {}) {
    return this.callApi({ method: 'POST', url, ...options });
  }

  putRequest(url: string, options: Omit<CallApiOptions, 'method' | 'url'> = {}) {
    return this.callApi({ method: 'PUT', url, ...options });
  }

  patchRequest(url: string, options: Omit<CallApiOptions, 'method' | 'url'> = {}) {
    return this.callApi({ method: 'PATCH', url, ...options });
  }

  deleteRequest(url: string, options: Omit<CallApiOptions, 'method' | 'url'> = {}) {
    return this.callApi({ method: 'DELETE', url, ...options });
  }

  /** Releases the underlying sockets. */
  async close(): Promise<void> {
    await this.dispatcher.close();
  }
}

function buildUrl(url: string, params?: QueryParams): string {
  if (!params) return url;

  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item !== undefined && item !== null) search.append(key, String(item));
      }
    } else {
      search.append(key, String(value));
    }
  }

  const query = search.toString();
  if (!query) return url;
  return url.includes('?') ? `${url}&${query}` : `${url}?${query}`;
}

function resolveBackoff(retryAfter: string | undefined, retries: number): number {
  if (retryAfter) {
    const seconds = Number(retryAfter);
    if (Number.isFinite(seconds)) return seconds;

    const retryDate = Date.parse(retryAfter);
    if (!Number.isNaN(retryDate)) {
      return Math.max(1, (retryDate - Date.now()) / 1000);
    }
  }
  return Math.min(60 * 2 ** retries, 300);
}
