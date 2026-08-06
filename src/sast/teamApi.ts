import { CREATED, OK } from '../core/httpStatus.js';
import { SastApiBase } from './baseApi.js';
import { getHeaders } from './config.js';
import type { CxTeam } from './types.js';

export class TeamApi extends SastApiBase {
  async getAllTeams(): Promise<CxTeam[]> {
    const response = await this.apiClient.callApi({
      method: 'GET',
      url: `${this.baseUrl}/cxrestapi/auth/teams`,
      headers: getHeaders(),
    });
    if (response.statusCode !== OK) return [];
    return response
      .json<CxTeam[]>()
      .map((team) => ({ ...team, fullName: team.fullName?.replace(/\\/g, '/') }));
  }

  async getTeamIdByTeamFullName(teamFullName: string): Promise<number | undefined> {
    const allTeams = await this.getAllTeams();
    let name = teamFullName.replace(/\\/g, '/');
    if (teamFullName.startsWith('CxServer')) {
      name = `/${name}`;
    }
    return allTeams.find((team) => team.fullName === name)?.id;
  }

  async getTeamFullNameByTeamId(teamId: number): Promise<string | undefined> {
    const allTeams = await this.getAllTeams();
    return allTeams.find((team) => team.id === teamId)?.fullName;
  }

  /** The new team id is read from the `Location` response header. */
  async createTeam(teamName: string, parentId: number): Promise<number | undefined> {
    const response = await this.apiClient.callApi({
      method: 'POST',
      url: `${this.baseUrl}/cxrestapi/auth/teams`,
      json: { name: teamName, parentId },
      headers: getHeaders(),
    });
    if (response.statusCode !== CREATED) return undefined;

    const location = response.headers['location'];
    if (!location) return undefined;
    const parsed = Number(location.split('/').pop());
    return Number.isFinite(parsed) ? parsed : undefined;
  }
}
