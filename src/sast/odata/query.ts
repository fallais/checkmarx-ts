export interface OdataQuery {
  select?: readonly string[];
  filter?: string;
  expand?: string;
  orderby?: string;
  top?: number;
  skip?: number;
  count?: boolean;
  apply?: string;
  /** Escape hatch for options this interface does not model. */
  extra?: Record<string, string | number | boolean>;
}

/**
 * `$`, `(`, `)`, `'`, `,` and `/` carry meaning in OData and must reach the
 * server intact, which rules out `URLSearchParams`. Only what would corrupt the
 * query string is escaped; `%` is left alone so pre-encoded fragments pass through.
 */
const UNSAFE = /[ "#&+<>\\^`{|}]/g;
const UNSAFE_REPLACEMENTS: Record<string, string> = {
  ' ': '%20',
  '"': '%22',
  '#': '%23',
  '&': '%26',
  '+': '%2B',
  '<': '%3C',
  '>': '%3E',
  '\\': '%5C',
  '^': '%5E',
  '`': '%60',
  '{': '%7B',
  '|': '%7C',
  '}': '%7D',
};

export function encodeOdataValue(value: string): string {
  return value.replace(UNSAFE, (char) => UNSAFE_REPLACEMENTS[char] ?? char);
}

/** Quotes a `$filter` string literal, doubling embedded quotes. */
export function odataString(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

/** OData v4 datetimes are unquoted. */
export function odataDate(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : value;
}

/** Severity comparisons need the `CxDataRepository.Severity'High'` enum literal. */
export function odataSeverity(severity: CxOdataSeverity): string {
  return `CxDataRepository.Severity${odataString(severity)}`;
}

export const ODATA_SEVERITIES = ['Info', 'Low', 'Medium', 'High'] as const;

export type CxOdataSeverity = (typeof ODATA_SEVERITIES)[number];

export const ODATA_RESULT_STATES = [
  'TO_VERIFY',
  'NOT_EXPLOITABLE',
  'CONFIRMED',
  'URGENT',
  'PROPOSED_NOT_EXPLOITABLE',
] as const;

export type CxOdataResultState = (typeof ODATA_RESULT_STATES)[number];

/** States are stored as their index in `ODATA_RESULT_STATES`. */
export function resultStateId(state: CxOdataResultState): number {
  const id = ODATA_RESULT_STATES.indexOf(state);
  if (id < 0) {
    throw new TypeError(
      `Unknown result state '${state}', expected one of: ${ODATA_RESULT_STATES.join(', ')}`,
    );
  }
  return id;
}

export function buildOdataQuery(query: OdataQuery = {}): string {
  const parts: string[] = [];

  if (query.select?.length) parts.push(`$select=${encodeOdataValue(query.select.join(','))}`);
  if (query.filter) parts.push(`$filter=${encodeOdataValue(query.filter)}`);
  if (query.expand) parts.push(`$expand=${encodeOdataValue(query.expand)}`);
  if (query.orderby) parts.push(`$orderby=${encodeOdataValue(query.orderby)}`);
  if (query.top !== undefined) parts.push(`$top=${query.top}`);
  if (query.skip !== undefined) parts.push(`$skip=${query.skip}`);
  if (query.count) parts.push('$count=true');
  if (query.apply) parts.push(`$apply=${encodeOdataValue(query.apply)}`);

  for (const [key, value] of Object.entries(query.extra ?? {})) {
    parts.push(`${encodeOdataValue(key)}=${encodeOdataValue(String(value))}`);
  }

  return parts.length ? `?${parts.join('&')}` : '';
}
