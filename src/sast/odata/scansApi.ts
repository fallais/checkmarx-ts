import { OdataApi } from './odataApi.js';
import { odataDate } from './query.js';
import type { CxOdataScan } from './types.js';

export class ScansOdataApi extends OdataApi {
  async getScan(scanId: number): Promise<CxOdataScan | undefined> {
    return this.queryOne<CxOdataScan>(`Scans(${scanId})`);
  }

  async getScanLoc(scanId: number): Promise<number | undefined> {
    const scan = await this.queryOne<CxOdataScan>(`Scans(${scanId})`, { select: ['LOC'] });
    return scan?.LOC;
  }

  async getLocForAllScans(): Promise<CxOdataScan[]> {
    return this.queryAll<CxOdataScan>('Scans', { select: ['Id', 'LOC'] });
  }

  async getScanIds(projectId: number): Promise<number[]> {
    const scans = await this.queryAll<CxOdataScan>(`Projects(${projectId})/Scans`, {
      select: ['Id'],
    });
    return scans.flatMap((scan) => (scan.Id === undefined ? [] : [scan.Id]));
  }

  async getLastScan(projectId: number): Promise<CxOdataScan | undefined> {
    return this.queryOne<CxOdataScan>(`Projects(${projectId})/Scans`, {
      orderby: 'Id desc',
      top: 1,
    });
  }

  async getLastScanId(projectId: number): Promise<number | undefined> {
    const scan = await this.queryOne<CxOdataScan>(`Projects(${projectId})/Scans`, {
      select: ['Id'],
      orderby: 'Id desc',
      top: 1,
    });
    return scan?.Id;
  }

  /** Most recent non-incremental scan. */
  async getLastFullScan(projectId: number): Promise<CxOdataScan | undefined> {
    return this.queryOne<CxOdataScan>(`Projects(${projectId})/Scans`, {
      filter: 'IsIncremental eq false',
      orderby: 'Id desc',
      top: 1,
    });
  }

  async getLastFullScanId(projectId: number): Promise<number | undefined> {
    const scan = await this.queryOne<CxOdataScan>(`Projects(${projectId})/Scans`, {
      select: ['Id'],
      filter: 'IsIncremental eq false',
      orderby: 'Id desc',
      top: 1,
    });
    return scan?.Id;
  }

  /** High/medium/low counts per scan within a time range. */
  async getScanSeveritiesInTimeRange(
    projectId: number,
    startDate: Date | string,
    endDate: Date | string,
  ): Promise<CxOdataScan[]> {
    return this.queryAll<CxOdataScan>(`Projects(${projectId})/Scans`, {
      filter:
        `ScanRequestedOn gt ${odataDate(startDate)} and ` +
        `ScanRequestedOn lt ${odataDate(endDate)}`,
      select: ['Id', 'ScanRequestedOn', 'High', 'Medium', 'Low'],
      orderby: 'ScanRequestedOn desc',
    });
  }

  /** Scans since a date, with each result's state inlined. */
  async getResultStatesSince(projectId: number, startDate: Date | string): Promise<CxOdataScan[]> {
    return this.queryAll<CxOdataScan>('Scans', {
      filter: `ProjectId eq ${projectId} and ScanRequestedOn gt ${odataDate(startDate)}`,
      expand: 'Results($expand=State;$select=Id,ScanId,StateId)',
    });
  }
}
