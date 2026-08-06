import { readFile } from 'node:fs/promises';
import { basename } from 'node:path';
import { ACCEPTED, CREATED, NO_CONTENT, OK } from '../core/httpStatus.js';
import { SastApiBase } from './baseApi.js';
import { getHeaders } from './config.js';
import { TeamApi } from './teamApi.js';
import type {
  CxCreateProjectResponse,
  CxCustomField,
  CxCustomRemoteSourceSettings,
  CxGitSettings,
  CxIssueTrackingSystem,
  CxIssueTrackingSystemDetail,
  CxIssueTrackingSystemJiraField,
  CxPerforceSettings,
  CxPreset,
  CxProject,
  CxProjectExcludeSettings,
  CxSharedRemoteSourceSettingsResponse,
  CxSVNSettings,
  CxTFSSettings,
} from './types.js';

export const GIT_AUTHENTICATION_MODES = ['Undefined', 'none', 'credentials', 'PAT', 'ssh'] as const;

export type GitAuthenticationMode = (typeof GIT_AUTHENTICATION_MODES)[number];

export interface GitRemoteSourceInput {
  url: string;
  branch: string;
  authentication?: GitAuthenticationMode;
  username?: string;
  password?: string;
  pat?: string;
  privateKey?: string;
}

export interface ProjectQueueSettingInput {
  queueKeepMode?: string;
  scansType?: string;
  includeScansInProcess?: boolean;
  identicalCodeOnly?: boolean;
}

export class ProjectsApi extends SastApiBase {
  async getAllProjectDetails(
    projectName?: string,
    teamId?: string | number,
    showAlsoDeletedProjects = false,
    apiVersion = '5.0',
  ): Promise<CxProject[] | undefined> {
    const response = await this.apiClient.callApi({
      method: 'GET',
      url: `${this.baseUrl}/cxrestapi/projects`,
      params: { showAlsoDeletedProjects, projectName, teamId },
      headers: getHeaders(apiVersion),
    });
    return response.statusCode === OK ? response.json<CxProject[]>() : undefined;
  }

  async createProjectWithDefaultConfiguration(
    projectName: string,
    teamId: string | number,
    isPublic = true,
    apiVersion = '5.0',
  ): Promise<CxCreateProjectResponse | undefined> {
    const response = await this.apiClient.callApi({
      method: 'POST',
      url: `${this.baseUrl}/cxrestapi/projects`,
      json: { name: projectName, owningTeam: teamId, isPublic },
      headers: getHeaders(apiVersion),
    });
    return response.statusCode === CREATED ? response.json<CxCreateProjectResponse>() : undefined;
  }

  async getProjectIdByProjectNameAndTeamFullName(
    projectName: string,
    teamFullName: string,
  ): Promise<number | undefined> {
    const teamId = await new TeamApi(this.apiClient).getTeamIdByTeamFullName(teamFullName);
    try {
      const allProjects = await this.getAllProjectDetails(projectName, teamId);
      return allProjects?.[0]?.id;
    } catch {
      return undefined;
    }
  }

  async getProjectDetailsById(
    projectId: number,
    apiVersion = '5.0',
  ): Promise<CxProject | undefined> {
    const response = await this.apiClient.callApi({
      method: 'GET',
      url: `${this.baseUrl}/cxrestapi/projects/${projectId}`,
      headers: getHeaders(apiVersion),
    });
    return response.statusCode === OK ? response.json<CxProject>() : undefined;
  }

  async updateProjectById(
    projectId: number,
    projectName: string,
    teamId: string | number,
    customFields: CxCustomField[] = [],
    apiVersion = '5.0',
  ): Promise<boolean> {
    const response = await this.apiClient.callApi({
      method: 'PUT',
      url: `${this.baseUrl}/cxrestapi/projects/${projectId}`,
      json: { name: projectName, owningTeam: teamId, CustomFields: customFields },
      headers: getHeaders(apiVersion),
    });
    return response.statusCode === NO_CONTENT;
  }

  async updateProjectNameTeamId(
    projectId: number,
    projectName: string,
    teamId: string,
    apiVersion = '5.0',
  ): Promise<boolean> {
    const response = await this.apiClient.callApi({
      method: 'PATCH',
      url: `${this.baseUrl}/cxrestapi/projects/${projectId}`,
      json: { name: projectName, owningTeam: teamId },
      headers: getHeaders(apiVersion),
    });
    return response.statusCode === NO_CONTENT;
  }

  async deleteProjectById(
    projectId: number,
    deleteRunningScans = false,
    apiVersion = '5.0',
  ): Promise<boolean> {
    const response = await this.apiClient.callApi({
      method: 'DELETE',
      url: `${this.baseUrl}/cxrestapi/projects/${projectId}`,
      json: { deleteRunningScans },
      headers: getHeaders(apiVersion),
    });
    return response.statusCode === ACCEPTED;
  }

  async createProjectIfNotExistsByProjectNameAndTeamFullName(
    projectName: string,
    teamFullName: string,
  ): Promise<number | undefined> {
    const teamApi = new TeamApi(this.apiClient);
    const teamId = await teamApi.getTeamIdByTeamFullName(teamFullName);
    let projectId = await this.getProjectIdByProjectNameAndTeamFullName(projectName, teamFullName);

    if (!projectId && teamId !== undefined) {
      const project = await this.createProjectWithDefaultConfiguration(projectName, teamId, true);
      projectId = project?.id;
    }
    return projectId;
  }

  async deleteProjectIfExistsByProjectNameAndTeamFullName(
    projectName: string,
    teamFullName: string,
  ): Promise<boolean> {
    const projectId = await this.getProjectIdByProjectNameAndTeamFullName(
      projectName,
      teamFullName,
    );
    return projectId ? this.deleteProjectById(projectId) : false;
  }

  async createBranchedProject(
    projectId: number,
    branchedProjectName: string,
    apiVersion = '1.0',
  ): Promise<CxCreateProjectResponse | undefined> {
    const response = await this.apiClient.callApi({
      method: 'POST',
      url: `${this.baseUrl}/cxrestapi/projects/${projectId}/branch`,
      json: { name: branchedProjectName },
      headers: getHeaders(apiVersion),
    });
    return response.statusCode === CREATED ? response.json<CxCreateProjectResponse>() : undefined;
  }

  async getBranchProjectStatus(
    branchProjectId: number,
    apiVersion = '4.0',
  ): Promise<string | undefined> {
    const response = await this.apiClient.callApi({
      method: 'GET',
      url: `${this.baseUrl}/cxrestapi/projects/branch/${branchProjectId}`,
      headers: getHeaders(apiVersion),
    });
    if (response.statusCode !== OK) return undefined;

    const status = response.json<{ status?: { value?: string } | string }>().status;
    return typeof status === 'object' ? status?.value : status;
  }

  async getAllIssueTrackingSystems(
    apiVersion = '1.0',
  ): Promise<CxIssueTrackingSystem[] | undefined> {
    const response = await this.apiClient.callApi({
      method: 'GET',
      url: `${this.baseUrl}/cxrestapi/issueTrackingSystems`,
      headers: getHeaders(apiVersion),
    });
    return response.statusCode === OK ? response.json<CxIssueTrackingSystem[]>() : undefined;
  }

  async getIssueTrackingSystemIdByName(name: string): Promise<number | undefined> {
    const systems = await this.getAllIssueTrackingSystems();
    return systems?.find((system) => system.name === name)?.id;
  }

  async getIssueTrackingSystemDetailsById(
    issueTrackingSystemId: number,
    apiVersion = '1.0',
  ): Promise<{ projects: CxIssueTrackingSystemDetail[] } | undefined> {
    const response = await this.apiClient.callApi({
      method: 'GET',
      url: `${this.baseUrl}/cxrestapi/issueTrackingSystems/${issueTrackingSystemId}/metadata`,
      headers: getHeaders(apiVersion),
    });
    if (response.statusCode !== OK) return undefined;
    return {
      projects: response.json<{ projects?: CxIssueTrackingSystemDetail[] }>().projects ?? [],
    };
  }

  async getProjectExcludeSettingsByProjectId(
    projectId: number,
    apiVersion = '1.0',
  ): Promise<CxProjectExcludeSettings | undefined> {
    const response = await this.apiClient.callApi({
      method: 'GET',
      url: `${this.baseUrl}/cxrestapi/projects/${projectId}/sourceCode/excludeSettings`,
      headers: getHeaders(apiVersion),
    });
    return response.statusCode === OK ? response.json<CxProjectExcludeSettings>() : undefined;
  }

  async setProjectExcludeSettingsByProjectId(
    projectId: number,
    excludeFoldersPattern: string[],
    excludeFilesPattern: string[],
    apiVersion = '1.0',
  ): Promise<boolean> {
    const response = await this.apiClient.callApi({
      method: 'PUT',
      url: `${this.baseUrl}/cxrestapi/projects/${projectId}/sourceCode/excludeSettings`,
      json: {
        excludeFoldersPattern: excludeFoldersPattern?.length
          ? excludeFoldersPattern.join(',')
          : null,
        excludeFilesPattern: excludeFilesPattern?.length ? excludeFilesPattern.join(',') : null,
      },
      headers: getHeaders(apiVersion),
    });
    return response.statusCode === OK;
  }

  async getRemoteSourceSettingsForGitByProjectId(
    projectId: number,
    apiVersion = '1.3',
  ): Promise<CxGitSettings | undefined> {
    const response = await this.apiClient.callApi({
      method: 'GET',
      url: `${this.baseUrl}/cxrestapi/projects/${projectId}/sourceCode/remoteSettings/git`,
      headers: getHeaders(apiVersion),
    });
    return response.statusCode === OK ? response.json<CxGitSettings>() : undefined;
  }

  async setRemoteSourceSettingToGit(
    projectId: number,
    input: GitRemoteSourceInput,
    apiVersion = '1.3',
  ): Promise<boolean> {
    if (input.authentication && !GIT_AUTHENTICATION_MODES.includes(input.authentication)) {
      throw new TypeError(
        `Value error for parameter 'authentication', it should be one of the list [${GIT_AUTHENTICATION_MODES.join(', ')}]`,
      );
    }

    const response = await this.apiClient.callApi({
      method: 'POST',
      url: `${this.baseUrl}/cxrestapi/projects/${projectId}/sourceCode/remoteSettings/git`,
      json: {
        url: input.url,
        branch: input.branch,
        authentication: input.authentication,
        userName: input.username,
        password: input.password,
        pat: input.pat,
        privateKey: input.privateKey,
      },
      headers: getHeaders(apiVersion),
    });
    return response.statusCode === NO_CONTENT;
  }

  async getRemoteSourceSettingsForSvnByProjectId(
    projectId: number,
    apiVersion = '1.0',
  ): Promise<CxSVNSettings | undefined> {
    const response = await this.apiClient.callApi({
      method: 'GET',
      url: `${this.baseUrl}/cxrestapi/projects/${projectId}/sourceCode/remoteSettings/svn`,
      headers: getHeaders(apiVersion),
    });
    return response.statusCode === OK ? response.json<CxSVNSettings>() : undefined;
  }

  async setRemoteSourceSettingsToSvn(
    projectId: number,
    absoluteUrl: string,
    port: number,
    paths: string[],
    username: string,
    password: string,
    privateKey?: string,
    apiVersion = '1.0',
  ): Promise<boolean> {
    const response = await this.apiClient.callApi({
      method: 'POST',
      url: `${this.baseUrl}/cxrestapi/projects/${projectId}/sourceCode/remoteSettings/svn`,
      json: {
        uri: { absoluteUrl, port },
        paths,
        credentials: { userName: username, password },
        privateKey,
      },
      headers: getHeaders(apiVersion),
    });
    return response.statusCode === NO_CONTENT;
  }

  async getRemoteSourceSettingsForTfsByProjectId(
    projectId: number,
    apiVersion = '1.0',
  ): Promise<CxTFSSettings | undefined> {
    const response = await this.apiClient.callApi({
      method: 'GET',
      url: `${this.baseUrl}/cxrestapi/projects/${projectId}/sourceCode/remoteSettings/tfs`,
      headers: getHeaders(apiVersion),
    });
    return response.statusCode === OK ? response.json<CxTFSSettings>() : undefined;
  }

  async setRemoteSourceSettingsToTfs(
    projectId: number,
    username: string,
    password: string,
    absoluteUrl: string,
    port: number,
    paths: string[],
    apiVersion = '1.0',
  ): Promise<boolean> {
    const response = await this.apiClient.callApi({
      method: 'POST',
      url: `${this.baseUrl}/cxrestapi/projects/${projectId}/sourceCode/remoteSettings/tfs`,
      json: {
        credentials: { userName: username, password },
        uri: { absoluteUrl, port },
        paths,
      },
      headers: getHeaders(apiVersion),
    });
    return response.statusCode === NO_CONTENT;
  }

  async getRemoteSourceSettingsForCustomByProjectId(
    projectId: number,
    apiVersion = '1.0',
  ): Promise<CxCustomRemoteSourceSettings | undefined> {
    const response = await this.apiClient.callApi({
      method: 'GET',
      url: `${this.baseUrl}/cxrestapi/projects/${projectId}/sourceCode/remoteSettings/custom`,
      headers: getHeaders(apiVersion),
    });
    return response.statusCode === OK ? response.json<CxCustomRemoteSourceSettings>() : undefined;
  }

  async setRemoteSourceSettingForCustomByProjectId(
    projectId: number,
    path: string,
    preScanCommandId: number,
    username: string,
    password: string,
    apiVersion = '1.0',
  ): Promise<boolean> {
    const response = await this.apiClient.callApi({
      method: 'POST',
      url: `${this.baseUrl}/cxrestapi/projects/${projectId}/sourceCode/remoteSettings/custom`,
      json: { path, preScanCommandId, credentials: { userName: username, password } },
      headers: getHeaders(apiVersion),
    });
    return response.statusCode === NO_CONTENT;
  }

  async getRemoteSourceSettingsForSharedByProjectId(
    projectId: number,
    apiVersion = '1.0',
  ): Promise<CxSharedRemoteSourceSettingsResponse | undefined> {
    const response = await this.apiClient.callApi({
      method: 'GET',
      url: `${this.baseUrl}/cxrestapi/projects/${projectId}/sourceCode/remoteSettings/shared`,
      headers: getHeaders(apiVersion),
    });
    return response.statusCode === OK
      ? response.json<CxSharedRemoteSourceSettingsResponse>()
      : undefined;
  }

  async setRemoteSourceSettingsToShared(
    projectId: number,
    paths: string[],
    username: string,
    password: string,
    apiVersion = '1.0',
  ): Promise<boolean> {
    const response = await this.apiClient.callApi({
      method: 'POST',
      url: `${this.baseUrl}/cxrestapi/projects/${projectId}/sourceCode/remoteSettings/shared`,
      json: { paths, credentials: { userName: username, password } },
      headers: getHeaders(apiVersion),
    });
    return response.statusCode === NO_CONTENT;
  }

  async getRemoteSourceSettingsForPerforceByProjectId(
    projectId: number,
    apiVersion = '1.0',
  ): Promise<CxPerforceSettings | undefined> {
    const response = await this.apiClient.callApi({
      method: 'GET',
      url: `${this.baseUrl}/cxrestapi/projects/${projectId}/sourceCode/remoteSettings/perforce`,
      headers: getHeaders(apiVersion),
    });
    return response.statusCode === OK ? response.json<CxPerforceSettings>() : undefined;
  }

  async setRemoteSourceSettingsToPerforce(
    projectId: number,
    username: string,
    password: string,
    absoluteUrl: string,
    port: number,
    paths: string[],
    browseMode: string,
    apiVersion = '1.0',
  ): Promise<boolean> {
    const response = await this.apiClient.callApi({
      method: 'POST',
      url: `${this.baseUrl}/cxrestapi/projects/${projectId}/sourceCode/remoteSettings/perforce`,
      json: {
        credentials: { userName: username, password },
        uri: { absoluteUrl, port },
        paths,
        browseMode,
      },
      headers: getHeaders(apiVersion),
    });
    return response.statusCode === NO_CONTENT;
  }

  async setRemoteSourceSettingToGitUsingSsh(
    projectId: number,
    url: string,
    branch: string,
    privateKeyFilePath: string,
    apiVersion = '1.3',
  ): Promise<boolean> {
    const content = await readFile(privateKeyFilePath);
    const response = await this.apiClient.callApi({
      method: 'POST',
      url: `${this.baseUrl}/cxrestapi/projects/${projectId}/sourceCode/remoteSettings/git/ssh`,
      data: { url, branch },
      files: {
        privateKey: {
          filename: basename(privateKeyFilePath),
          content,
          contentType: 'text/plain',
        },
      },
      headers: getHeaders(apiVersion),
    });
    return response.statusCode === NO_CONTENT;
  }

  async setRemoteSourceSettingToSvnUsingSsh(
    projectId: number,
    absoluteUrl: string,
    port: number,
    paths: string[],
    privateKeyFilePath: string,
    apiVersion = '1.0',
  ): Promise<boolean> {
    const content = await readFile(privateKeyFilePath);
    const response = await this.apiClient.callApi({
      method: 'POST',
      url: `${this.baseUrl}/cxrestapi/projects/${projectId}/sourceCode/remoteSettings/svn/ssh`,
      data: { absoluteUrl, port: String(port), paths: String(paths) },
      files: {
        privateKey: {
          filename: basename(privateKeyFilePath),
          content,
          contentType: 'text/plain',
        },
      },
      headers: getHeaders(apiVersion),
    });
    return response.statusCode === NO_CONTENT;
  }

  async uploadSourceCodeZipFile(
    projectId: number,
    zipFilePath: string,
    apiVersion = '4.0',
  ): Promise<boolean> {
    const content = await readFile(zipFilePath);
    const response = await this.apiClient.callApi({
      method: 'POST',
      url: `${this.baseUrl}/cxrestapi/projects/${projectId}/sourceCode/attachments`,
      files: {
        zippedSource: {
          filename: basename(zipFilePath),
          content,
          contentType: 'application/zip',
        },
      },
      headers: getHeaders(apiVersion),
    });
    return response.statusCode === NO_CONTENT;
  }

  async setDataRetentionSettingsByProjectId(
    projectId: number,
    scansToKeep = 10,
    apiVersion = '1.0',
  ): Promise<boolean> {
    const response = await this.apiClient.callApi({
      method: 'POST',
      url: `${this.baseUrl}/cxrestapi/projects/${projectId}/dataRetentionSettings`,
      json: { scansToKeep },
      headers: getHeaders(apiVersion),
    });
    return response.statusCode === NO_CONTENT;
  }

  async setIssueTrackingSystemAsJiraById(
    projectId: number,
    issueTrackingSystemId: number,
    jiraProjectId: string,
    issueTypeId: string,
    jiraFields: CxIssueTrackingSystemJiraField[],
    apiVersion = '1.0',
  ): Promise<boolean> {
    const response = await this.apiClient.callApi({
      method: 'POST',
      url: `${this.baseUrl}/cxrestapi/projects/${projectId}/issueTrackingSettings/jira`,
      json: {
        issueTrackingSystemId,
        jiraProjectId,
        issueType: {
          id: issueTypeId,
          fields: jiraFields.map((field) => ({ id: field.id, values: field.values })),
        },
      },
      headers: getHeaders(apiVersion),
    });
    return response.statusCode === NO_CONTENT;
  }

  async getAllPresetDetails(apiVersion = '1.0'): Promise<CxPreset[]> {
    const response = await this.apiClient.callApi({
      method: 'GET',
      url: `${this.baseUrl}/cxrestapi/sast/presets`,
      headers: getHeaders(apiVersion),
    });
    return response.statusCode === OK ? response.json<CxPreset[]>() : [];
  }

  async getPresetIdByName(presetName: string): Promise<number | undefined> {
    const allPresets = await this.getAllPresetDetails();
    return allPresets.find((preset) => preset.name === presetName)?.id;
  }

  async getPresetDetailsByPresetId(
    presetId: number,
    apiVersion = '1.0',
  ): Promise<CxPreset | undefined> {
    const response = await this.apiClient.callApi({
      method: 'GET',
      url: `${this.baseUrl}/cxrestapi/sast/presets/${presetId}`,
      headers: getHeaders(apiVersion),
    });
    return response.statusCode === OK ? response.json<CxPreset>() : undefined;
  }

  async setProjectQueueSetting(
    projectId: number,
    input: ProjectQueueSettingInput = {},
    apiVersion = '2.1',
  ): Promise<boolean> {
    const response = await this.apiClient.callApi({
      method: 'POST',
      url: `${this.baseUrl}/cxrestapi/sast/project/${projectId}/queueSettings`,
      json: queueSettingsPayload(input),
      headers: getHeaders(apiVersion),
    });
    return response.statusCode === NO_CONTENT;
  }

  async updateProjectQueueSetting(
    projectId: number,
    input: ProjectQueueSettingInput = {},
    apiVersion = '2.1',
  ): Promise<boolean> {
    const response = await this.apiClient.callApi({
      method: 'PUT',
      url: `${this.baseUrl}/cxrestapi/sast/project/${projectId}/queueSettings`,
      json: queueSettingsPayload(input),
      headers: getHeaders(apiVersion),
    });
    return response.statusCode === NO_CONTENT;
  }

  async setProjectNextScheduledScanToBeExcludedFromNoCodeChangeDetection(
    projectId: number,
    apiVersion = '4.0',
  ): Promise<boolean> {
    return this.forceScanOnNoCodeChanges(projectId, apiVersion);
  }

  async forceScanOnNoCodeChanges(projectId: number, apiVersion = '4.0'): Promise<boolean> {
    const response = await this.apiClient.callApi({
      method: 'POST',
      url: `${this.baseUrl}/cxrestapi/projects/${projectId}/forceScanOnNoCodeChanges`,
      headers: getHeaders(apiVersion),
    });
    return response.statusCode === OK;
  }

  async precheckTeam(
    teamId: number,
    apiVersion = '1.0',
  ): Promise<Record<string, unknown> | undefined> {
    const response = await this.apiClient.callApi({
      method: 'GET',
      url: `${this.baseUrl}/cxrestapi/projects/precheck/teams/${teamId}`,
      headers: getHeaders(apiVersion),
    });
    return response.statusCode === OK ? response.json<Record<string, unknown>>() : undefined;
  }

  async getProjectBranchingStatus(
    projectId: number,
    apiVersion = '4.0',
  ): Promise<Record<string, unknown> | undefined> {
    const response = await this.apiClient.callApi({
      method: 'GET',
      url: `${this.baseUrl}/cxrestapi/projects/branch/${projectId}`,
      headers: getHeaders(apiVersion),
    });
    return response.statusCode === OK ? response.json<Record<string, unknown>>() : undefined;
  }

  async getPathFilter(projectId: number, apiVersion = '5.0'): Promise<string | undefined> {
    const response = await this.apiClient.callApi({
      method: 'GET',
      url: `${this.baseUrl}/cxrestapi/projects/${projectId}/sourceCode/pathFilter`,
      headers: getHeaders(apiVersion),
    });
    return response.statusCode === OK
      ? response.json<{ pathFilter?: string }>().pathFilter
      : undefined;
  }

  async setPathFilter(projectId: number, pathFilter: string, apiVersion = '5.0'): Promise<boolean> {
    const response = await this.apiClient.callApi({
      method: 'PUT',
      url: `${this.baseUrl}/cxrestapi/projects/${projectId}/sourceCode/pathFilter`,
      json: { pathFilter },
      headers: getHeaders(apiVersion),
    });
    return response.statusCode === OK;
  }

  async getProjectValidityForRunningIncrementalScan(
    projectId: number,
    apiVersion = '5.0',
  ): Promise<Record<string, unknown> | undefined> {
    const response = await this.apiClient.callApi({
      method: 'GET',
      url: `${this.baseUrl}/cxrestapi/projects/${projectId}/incrementalScanValidityStatus`,
      headers: getHeaders(apiVersion),
    });
    return response.statusCode === OK ? response.json<Record<string, unknown>>() : undefined;
  }
}

function queueSettingsPayload(input: ProjectQueueSettingInput): Record<string, unknown> {
  return {
    queueKeepMode: input.queueKeepMode ?? 'KeepAll',
    scansType: input.scansType ?? 'OnlyFull',
    includeScansInProcess: input.includeScansInProcess ?? false,
    identicalCodeOnly: input.identicalCodeOnly ?? false,
  };
}
