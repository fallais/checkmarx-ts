import { OdataApi } from './odataApi.js';
import { odataDate, odataSeverity, odataString, type CxOdataSeverity } from './query.js';
import type { CxOdataProject, CxOdataProjectSummary, CxOdataProjectTeamSummary } from './types.js';

/** `OwningTeamId` is a GUID string up to 8.9 and a number from 9.0 on. */
function teamIdLiteral(teamId: string | number): string {
  return typeof teamId === 'string' ? odataString(teamId) : String(teamId);
}

export class ProjectsOdataApi extends OdataApi {
  /** Projects whose most recent scan yielded the highest risk score. */
  async getTopProjectsByRiskScore(numberOfProjects: number): Promise<CxOdataProject[]> {
    return this.query<CxOdataProject>('Projects', {
      expand: 'LastScan',
      orderby: 'LastScan/RiskScore desc',
      top: numberOfProjects,
    });
  }

  /** Projects whose most recent scan took the longest. */
  async getTopProjectsByLastScanDuration(numberOfProjects: number): Promise<CxOdataProject[]> {
    return this.query<CxOdataProject>('Projects', {
      expand: 'LastScan',
      orderby: 'LastScan/ScanDuration desc',
      top: numberOfProjects,
    });
  }

  /** Every project with its last scan, results narrowed to one severity. */
  async getProjectsWithLastScanResultsBySeverity(
    severity: CxOdataSeverity = 'High',
  ): Promise<CxOdataProject[]> {
    return this.query<CxOdataProject>('Projects', {
      expand: `LastScan($expand=Results($filter=Severity eq ${odataSeverity(severity)}))`,
    });
  }

  /** Only projects whose last scan holds at least one result of that severity. */
  async getProjectsWithSeverityInLastScan(
    severity: CxOdataSeverity = 'High',
  ): Promise<CxOdataProject[]> {
    return this.query<CxOdataProject>('Projects', {
      expand: 'LastScan($expand=Results)',
      filter: `LastScan/Results/any(r: r/Severity eq ${odataSeverity(severity)})`,
    });
  }

  /** Result summaries for every project in a team, within a time range. */
  async getProjectScanSummariesForTeam(
    teamId: string | number,
    startDate: Date | string,
    endDate: Date | string,
  ): Promise<CxOdataProject[]> {
    return this.query<CxOdataProject>('Projects', {
      filter: `OwningTeamId eq ${teamIdLiteral(teamId)}`,
      expand:
        `Scans($expand=ResultSummary;$select=Id,ScanRequestedOn,ResultSummary;` +
        `$filter=ScanRequestedOn gt ${odataDate(startDate)} and ` +
        `ScanRequestedOn lt ${odataDate(endDate)})`,
    });
  }

  /** Scan ids for every project in a team, within a time range. */
  async getScanIdsForTeam(
    teamId: string | number,
    startDate: Date | string,
    endDate: Date | string,
  ): Promise<CxOdataProject[]> {
    return this.query<CxOdataProject>('Projects', {
      select: ['Id', 'Name'],
      filter: `OwningTeamId eq ${teamIdLiteral(teamId)}`,
      expand:
        `Scans($select=Id;` +
        `$filter=ScanRequestedOn gt ${odataDate(startDate)} and ` +
        `ScanRequestedOn lt ${odataDate(endDate)};$orderby=Id)`,
    });
  }

  async getProjectCount(): Promise<number> {
    return this.count('Projects');
  }

  async getProjectsByCustomFieldValue(
    fieldName: string,
    fieldValue: string,
  ): Promise<CxOdataProject[]> {
    return this.query<CxOdataProject>('Projects', {
      filter:
        `CustomFields/any(f: f/FieldName eq ${odataString(fieldName)} ` +
        `and f/FieldValue eq ${odataString(fieldValue)})`,
    });
  }

  /** Projects carrying a custom field, values inlined. */
  async getProjectsWithCustomField(fieldName: string): Promise<CxOdataProject[]> {
    return this.query<CxOdataProject>('Projects', {
      expand: 'CustomFields',
      filter: `CustomFields/any(f: f/FieldName eq ${odataString(fieldName)})`,
    });
  }

  async getProjectsWithPresets(): Promise<CxOdataProject[]> {
    return this.query<CxOdataProject>('Projects', { expand: 'Preset' });
  }

  /** Projects not using the default engine configuration. */
  async getProjectsWithNonStandardConfiguration(): Promise<CxOdataProject[]> {
    return this.query<CxOdataProject>('Projects', { filter: 'EngineConfigurationId gt 1' });
  }

  async getProjectIdNames(): Promise<CxOdataProjectSummary[]> {
    const projects = await this.queryAll<CxOdataProject>('Projects', { select: ['Id', 'Name'] });
    return projects.map((project) => ({ ProjectId: project.Id, ProjectName: project.Name }));
  }

  async getProjectAndTeamNames(): Promise<CxOdataProjectTeamSummary[]> {
    const projects = await this.queryAll<CxOdataProject>('Projects', {
      select: ['Id', 'Name', 'OwningTeamId'],
      expand: 'OwningTeam($select=FullName)',
    });
    return projects.map((project) => ({
      TeamId: project.OwningTeamId,
      TeamName: project.OwningTeam?.FullName,
      ProjectId: project.Id,
      ProjectName: project.Name,
    }));
  }
}
