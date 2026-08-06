import type { CxResponse } from './response.js';
import {
  ACCEPTED,
  BAD_REQUEST,
  CREATED,
  FORBIDDEN,
  NOT_FOUND,
  NO_CONTENT,
  OK,
} from './httpStatus.js';

/**
 * Base error for every failure surfaced by the SDK.
 *
 * @param msg  Human readable string describing the exception.
 * @param code Error code, normally the HTTP status code.
 */
export class CxError extends Error {
  readonly msg: string;
  readonly code: number;

  constructor(msg: string, code: number) {
    super(`CxError(msg=${msg}, code=${code})`);
    this.name = 'CxError';
    this.msg = msg;
    this.code = code;
  }
}

/** http 400, bad request */
export class BadRequestError extends CxError {
  constructor(msg: string) {
    super(msg, BAD_REQUEST);
    this.name = 'BadRequestError';
    this.message = `BadRequestError(http_code=400, msg=${msg})`;
  }
}

/** http 404, not found */
export class NotFoundError extends CxError {
  constructor(msg?: string) {
    super(msg ?? '', NOT_FOUND);
    this.name = 'NotFoundError';
    this.message = `NotFoundError(http_code=404, msg=${msg ?? 'undefined'}).`;
  }
}

/**
 * Raise the error matching the response status, or return silently when the
 * request succeeded.
 */
export function checkResponseStatusCode(response: CxResponse): void {
  const statusCode = response.statusCode;
  if ([OK, CREATED, NO_CONTENT, ACCEPTED].includes(statusCode)) {
    return;
  }
  if (statusCode === BAD_REQUEST) {
    throw new BadRequestError(response.text);
  }
  if (statusCode === NOT_FOUND) {
    throw new NotFoundError();
  }
  if (statusCode === FORBIDDEN) {
    throw new CxError(
      `${response.text} Please check the scope in your configuration file, please check if you have permission`,
      statusCode,
    );
  }
  throw new CxError(response.text, statusCode);
}
