/** A fully-buffered HTTP response. */
export interface CxResponse {
  /** HTTP status code. */
  readonly statusCode: number;
  /** Lower-cased response headers. */
  readonly headers: Record<string, string>;
  /** Raw response body. */
  readonly content: Buffer;
  /** Response body decoded as UTF-8. */
  readonly text: string;
  /** The request that produced this response. */
  readonly request: { readonly method: string; readonly url: string };
  /** Body parsed as JSON. Throws if the body is not valid JSON. */
  json<T = any>(): T;
}

export function createResponse(
  statusCode: number,
  headers: Record<string, string>,
  content: Buffer,
  request: { method: string; url: string },
): CxResponse {
  let text: string | undefined;
  return {
    statusCode,
    headers,
    content,
    request,
    get text(): string {
      text ??= content.toString('utf-8');
      return text;
    },
    json<T = any>(): T {
      return JSON.parse(content.toString('utf-8')) as T;
    },
  };
}
