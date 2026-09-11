import { OdataApi } from './odataApi.js';
import { resultStateId, type CxOdataResultState } from './query.js';
import type {
  CxOdataLanguageCount,
  CxOdataResult,
  CxOdataResultRow,
  CxOdataResultSummaryRow,
} from './types.js';

/** Not exploitable, proposed not exploitable. */
const FALSE_POSITIVE_STATE_FILTER = 'State/Id eq 1 or State/Id eq 4';

const QUERY_LANGUAGE_STATE_EXPAND =
  'Query($select=Name;$expand=QueryGroup($select=Name,LanguageName)),' +
  'State($select=Name),Scan($select=Origin,LOC)';

function compareRows(a: CxOdataResultSummaryRow, b: CxOdataResultSummaryRow): number {
  return (
    (a.Language ?? '').localeCompare(b.Language ?? '') ||
    (a.QueryGroup ?? '').localeCompare(b.QueryGroup ?? '') ||
    (a.QueryId ?? 0) - (b.QueryId ?? 0) ||
    (a.ResultId ?? 0) - (b.ResultId ?? 0)
  );
}

export class ResultsOdataApi extends OdataApi {
  async getResults(scanId: number): Promise<CxOdataResult[]> {
    return this.queryAll<CxOdataResult>(`Scans(${scanId})/Results`);
  }

  async getSimilarityIds(scanId: number): Promise<CxOdataResult[]> {
    return this.queryAll<CxOdataResult>(`Scans(${scanId})/Results`, {
      select: ['SimilarityId', 'PathId'],
    });
  }

  /** Results have a composite key, hence `Results(Id=...,ScanId=...)`. */
  async getQueryNameForResult(resultId: number, scanId: number): Promise<string | undefined> {
    const result = await this.queryOne<CxOdataResult>(`Results(Id=${resultId},ScanId=${scanId})`, {
      expand: 'Query($select=Name)',
    });
    return result?.Query?.Name;
  }

  /**
   * One flat row per result with query, language, state and scan origin.
   * `ScanId` must stay in `$select` or the endpoint fails to deserialise.
   *
   * `filterFalsePositive` restricts the rows to the not-exploitable and
   * proposed-not-exploitable states rather than excluding them, matching the
   * Python SDK's `filter_false_positive`.
   */
  async getResultsWithQueryLanguageState(
    scanId: number,
    filterFalsePositive = false,
  ): Promise<CxOdataResultSummaryRow[]> {
    const results = await this.queryAll<CxOdataResult>(`Scans(${scanId})/Results`, {
      select: ['Id', 'ScanId', 'QueryId', 'SimilarityId', 'PathId'],
      expand: QUERY_LANGUAGE_STATE_EXPAND,
      filter: filterFalsePositive ? FALSE_POSITIVE_STATE_FILTER : undefined,
    });

    return results
      .map((item) => ({
        SimilarityId: item.SimilarityId,
        Language: item.Query?.QueryGroup?.LanguageName,
        QueryGroup: item.Query?.QueryGroup?.Name,
        Query: item.Query?.Name,
        QueryId: item.QueryId,
        ResultId: item.Id,
        ResultState: item.State?.Name,
        Origin: item.Scan?.Origin,
        LOC: item.Scan?.LOC,
        PathId: item.PathId,
      }))
      .sort(compareRows);
  }

  /** Counts grouped by language, then query group, then query. */
  async getResultCountsByQuery(
    scanId: number,
    options: { filterFalsePositive?: boolean; threshold?: number } = {},
  ): Promise<CxOdataLanguageCount[]> {
    const { filterFalsePositive = false, threshold = 0 } = options;
    const rows = await this.getResultsWithQueryLanguageState(scanId, filterFalsePositive);

    const languages: CxOdataLanguageCount[] = [];
    for (const row of rows) {
      let language = languages.find((item) => item.Language === row.Language);
      if (!language) {
        language = { Language: row.Language, QueryGroupList: [] };
        languages.push(language);
      }

      let queryGroup = language.QueryGroupList.find((item) => item.QueryGroup === row.QueryGroup);
      if (!queryGroup) {
        queryGroup = { QueryGroup: row.QueryGroup, QueryList: [] };
        language.QueryGroupList.push(queryGroup);
      }

      const query = queryGroup.QueryList.find((item) => item.Query === row.Query);
      if (query) {
        query.Count = (query.Count ?? 0) + 1;
      } else {
        queryGroup.QueryList.push({ Query: row.Query, Count: 1 });
      }
    }

    if (threshold > 0) {
      for (const language of languages) {
        for (const queryGroup of language.QueryGroupList) {
          queryGroup.QueryList = queryGroup.QueryList.filter(
            (query) => (query.Count ?? 0) >= threshold,
          );
        }
      }
    }
    return languages;
  }

  /** Full rows for a set of similarity ids, to track findings across scans. */
  async getResultsBySimilarityIds(
    scanId: number,
    similarityIds: readonly number[],
  ): Promise<CxOdataResultRow[]> {
    if (similarityIds.length === 0) return [];

    const results = await this.queryAll<CxOdataResult>(`Scans(${scanId})/Results`, {
      expand: QUERY_LANGUAGE_STATE_EXPAND,
      filter: `SimilarityId in (${similarityIds.join(',')})`,
    });

    return results.map((item) => ({
      ResultId: item.Id,
      ScanId: item.ScanId,
      SimilarityId: item.SimilarityId,
      RawPriority: item.RawPriority,
      PathId: item.PathId,
      ConfidenceLevel: item.ConfidenceLevel,
      Date: item.Date,
      Severity: item.Severity,
      StateId: item.StateId,
      AssignedToUserId: item.AssignedToUserId,
      AssignedTo: item.AssignedTo,
      Comment: item.Comment,
      QueryId: item.QueryId,
      QueryVersionId: item.QueryVersionId,
      Language: item.Query?.QueryGroup?.LanguageName,
      QueryGroup: item.Query?.QueryGroup?.Name,
      Query: item.Query?.Name,
      ResultState: item.State?.Name,
      Origin: item.Scan?.Origin,
      LOC: item.Scan?.LOC,
    }));
  }

  /** How many results of a scan sit in the given states. */
  async getResultCountByState(
    scanId: number,
    resultStates: readonly CxOdataResultState[],
  ): Promise<number> {
    if (resultStates.length === 0) return 0;

    const stateIds = resultStates.map(resultStateId).join(',');
    const results = await this.queryAll<CxOdataResult>(`Scans(${scanId})/Results`, {
      select: ['Id'],
      filter: `State/Id in (${stateIds})`,
    });
    return results.length;
  }
}
