import { readFile } from 'node:fs/promises';
import { basename } from 'node:path';
import type { ApiClient } from '../core/apiClient.js';
import { CREATED, NO_CONTENT, OK } from '../core/httpStatus.js';
import type {
  AuthenticationProvider,
  FirstAdminUserRequest,
  LDAPGroup,
  LDAPGroupAndRoleMappingDetail,
  LDAPGroupAndTeamMappingDetail,
  LDAPRoleMapping,
  LDAPServer,
  LDAPServerRequest,
  LDAPTeamMapping,
  MyProfile,
  MyProfileUpdateRequest,
  OIDCClient,
  OIDCClientRequest,
  Permission,
  Role,
  RoleRequest,
  SAMLIdentityProvider,
  SAMLRoleMapping,
  SAMLServiceProvider,
  SAMLTeamMapping,
  ServiceProvider,
  SMTPSetting,
  SMTPSettingRequest,
  SystemLocale,
  Team,
  User,
  UserRequest,
  WindowsDomain,
} from './types.js';

const JSON_HEADERS = { 'Content-Type': 'application/json' };

export interface SamlRoleMappingDetail {
  roleName?: string;
  samlAttributeValue?: string;
}

export interface SamlTeamMappingDetail {
  teamFullPath?: string;
  samlAttributeValue?: string;
}

export interface SamlIdentityProviderRequest {
  active?: boolean;
  name?: string;
  issuer?: string;
  loginUrl?: string;
  logoutUrl?: string;
  errorUrl?: string;
  signAuthnRequest?: boolean;
  authnRequestBinding?: string;
  isManualManagement?: boolean;
  defaultTeamId?: number;
  defaultRoleId?: number;
}

export class AccessControl {
  readonly apiClient: ApiClient;
  readonly acUrl: string;

  constructor(apiClient: ApiClient, acUrl?: string) {
    this.apiClient = apiClient;
    this.acUrl =
      acUrl ?? `${(apiClient.configuration.serverBaseUrl ?? '').replace(/\/+$/, '')}/cxrestapi/auth`;
  }

  async getAllAssignableUsers(): Promise<User[]> {
    const response = await this.apiClient.callApi({
      method: 'GET',
      url: `${this.acUrl}/AssignableUsers`,
    });
    return response.json<User[] | null>() ?? [];
  }

  async getAllAuthenticationProviders(): Promise<AuthenticationProvider[]> {
    const response = await this.apiClient.callApi({
      method: 'GET',
      url: `${this.acUrl}/AuthenticationProviders`,
    });
    return response.statusCode === OK ? response.json<AuthenticationProvider[]>() : [];
  }

  async submitFirstAdminUser(request: FirstAdminUserRequest): Promise<boolean> {
    const response = await this.apiClient.callApi({
      method: 'POST',
      url: `${this.acUrl}/Users/FirstAdmin`,
      json: request,
      headers: JSON_HEADERS,
    });
    return response.statusCode === CREATED;
  }

  async getAdminUserExistsConfirmation(): Promise<boolean> {
    const response = await this.apiClient.callApi({
      method: 'GET',
      url: `${this.acUrl}/Users/FirstAdminExistence`,
    });
    return (
      response.statusCode === OK &&
      Boolean(response.json<{ firstAdminExists?: boolean }>().firstAdminExists)
    );
  }

  async getAllLdapRoleMapping(ldapServerId?: number): Promise<LDAPRoleMapping[]> {
    const response = await this.apiClient.callApi({
      method: 'GET',
      url: `${this.acUrl}/LDAPRoleMappings`,
      params: ldapServerId ? { ldapServerId } : undefined,
    });
    return response.statusCode === OK ? response.json<LDAPRoleMapping[]>() : [];
  }

  async updateLdapRoleMapping(
    ldapServerId: number,
    mapping: LDAPGroupAndRoleMappingDetail,
  ): Promise<boolean> {
    const response = await this.apiClient.callApi({
      method: 'PUT',
      url: `${this.acUrl}/LDAPServers/${ldapServerId}/RoleMappings`,
      json: mapping,
      headers: JSON_HEADERS,
    });
    return response.statusCode === NO_CONTENT;
  }

  async deleteLdapRoleMapping(ldapRoleMappingId: number): Promise<boolean> {
    const response = await this.apiClient.callApi({
      method: 'DELETE',
      url: `${this.acUrl}/LDAPRoleMappings/${ldapRoleMappingId}`,
    });
    return response.statusCode === NO_CONTENT;
  }

  async testLdapServerConnection(request: LDAPServerRequest): Promise<boolean> {
    const response = await this.apiClient.callApi({
      method: 'POST',
      url: `${this.acUrl}/LDAPServers/TestConnection`,
      json: request,
      headers: JSON_HEADERS,
    });
    return response.statusCode === OK;
  }

  async getUserEntriesBySearchCriteria(
    ldapServerId: number,
    usernameContainsPattern?: string,
  ): Promise<User[]> {
    const response = await this.apiClient.callApi({
      method: 'GET',
      url: `${this.acUrl}/LDAPServers/${ldapServerId}/UserEntries`,
      params: usernameContainsPattern ? { userNameContainsPattern: usernameContainsPattern } : undefined,
    });
    return response.statusCode === OK ? response.json<User[]>() : [];
  }

  async getGroupEntriesBySearchCriteria(
    ldapServerId: number,
    nameContainsPattern?: string,
  ): Promise<LDAPGroup[]> {
    const response = await this.apiClient.callApi({
      method: 'GET',
      url: `${this.acUrl}/LDAPServers/${ldapServerId}/GroupEntries`,
      params: nameContainsPattern ? { nameContainsPattern } : undefined,
    });
    return response.statusCode === OK ? response.json<LDAPGroup[]>() : [];
  }

  async getAllLdapServers(): Promise<LDAPServer[]> {
    const response = await this.apiClient.callApi({
      method: 'GET',
      url: `${this.acUrl}/LDAPServers`,
    });
    return response.statusCode === OK ? response.json<LDAPServer[]>() : [];
  }

  async createNewLdapServer(request: LDAPServerRequest): Promise<boolean> {
    const response = await this.apiClient.callApi({
      method: 'POST',
      url: `${this.acUrl}/LDAPServers`,
      json: request,
      headers: JSON_HEADERS,
    });
    return response.statusCode === CREATED;
  }

  async getLdapServerById(ldapServerId: number): Promise<LDAPServer | undefined> {
    const response = await this.apiClient.callApi({
      method: 'GET',
      url: `${this.acUrl}/LDAPServers/${ldapServerId}`,
    });
    return response.statusCode === OK ? response.json<LDAPServer>() : undefined;
  }

  async updateLdapServer(ldapServerId: number, request: LDAPServerRequest): Promise<boolean> {
    const response = await this.apiClient.callApi({
      method: 'PUT',
      url: `${this.acUrl}/LDAPServers/${ldapServerId}`,
      json: request,
      headers: JSON_HEADERS,
    });
    return response.statusCode === NO_CONTENT;
  }

  async deleteLdapServer(ldapServerId: number): Promise<boolean> {
    const response = await this.apiClient.callApi({
      method: 'DELETE',
      url: `${this.acUrl}/LDAPServers/${ldapServerId}`,
    });
    return response.statusCode === NO_CONTENT;
  }

  async getLdapTeamMapping(ldapServerId?: number, teamId?: number): Promise<LDAPTeamMapping[]> {
    const response = await this.apiClient.callApi({
      method: 'GET',
      url: `${this.acUrl}/LDAPTeamMappings`,
      params: { ldapServerId: ldapServerId || undefined, teamId: teamId || undefined },
    });
    return response.statusCode === OK ? response.json<LDAPTeamMapping[]>() : [];
  }

  async updateLdapTeamMapping(
    ldapServerId: number,
    mapping: LDAPGroupAndTeamMappingDetail,
  ): Promise<boolean> {
    const response = await this.apiClient.callApi({
      method: 'PUT',
      url: `${this.acUrl}/LDAPServers/${ldapServerId}/TeamMappings`,
      json: mapping,
      headers: JSON_HEADERS,
    });
    return response.statusCode === NO_CONTENT;
  }

  async deleteLdapTeamMapping(ldapTeamMappingId: number): Promise<boolean> {
    const response = await this.apiClient.callApi({
      method: 'DELETE',
      url: `${this.acUrl}/LDAPTeamMappings/${ldapTeamMappingId}`,
    });
    return response.statusCode === NO_CONTENT;
  }

  async getMyProfile(): Promise<MyProfile | undefined> {
    const response = await this.apiClient.callApi({ method: 'GET', url: `${this.acUrl}/MyProfile` });
    return response.statusCode === OK ? response.json<MyProfile>() : undefined;
  }

  async updateMyProfile(request: MyProfileUpdateRequest): Promise<boolean> {
    const response = await this.apiClient.callApi({
      method: 'PUT',
      url: `${this.acUrl}/MyProfile`,
      json: request,
      headers: JSON_HEADERS,
    });
    return response.statusCode === NO_CONTENT;
  }

  async getAllOidcClients(): Promise<OIDCClient[]> {
    const response = await this.apiClient.callApi({
      method: 'GET',
      url: `${this.acUrl}/OIDCClients`,
    });
    return response.statusCode === OK ? response.json<OIDCClient[]>() : [];
  }

  async createNewOidcClient(request: OIDCClientRequest): Promise<boolean> {
    const response = await this.apiClient.callApi({
      method: 'POST',
      url: `${this.acUrl}/OIDCClients`,
      json: request,
      headers: JSON_HEADERS,
    });
    return response.statusCode === CREATED;
  }

  async getOidcClientById(oidcClientId: number): Promise<OIDCClient | undefined> {
    const response = await this.apiClient.callApi({
      method: 'GET',
      url: `${this.acUrl}/OIDCClients/${oidcClientId}`,
    });
    return response.statusCode === OK ? response.json<OIDCClient>() : undefined;
  }

  async updateAnOidcClient(oidcClientId: number, request: OIDCClientRequest): Promise<boolean> {
    const response = await this.apiClient.callApi({
      method: 'PUT',
      url: `${this.acUrl}/OIDCClients/${oidcClientId}`,
      json: request,
      headers: JSON_HEADERS,
    });
    return response.statusCode === NO_CONTENT;
  }

  async deleteAnOidcClient(oidcClientId: number): Promise<boolean> {
    const response = await this.apiClient.callApi({
      method: 'DELETE',
      url: `${this.acUrl}/OIDCClients/${oidcClientId}`,
    });
    return response.statusCode === NO_CONTENT;
  }

  async getAllPermissions(): Promise<Permission[]> {
    const response = await this.apiClient.callApi({
      method: 'GET',
      url: `${this.acUrl}/Permissions`,
    });
    return response.statusCode === OK ? response.json<Permission[]>() : [];
  }

  async getPermissionById(permissionId: number): Promise<Permission | undefined> {
    const response = await this.apiClient.callApi({
      method: 'GET',
      url: `${this.acUrl}/Permissions/${permissionId}`,
    });
    return response.statusCode === OK ? response.json<Permission>() : undefined;
  }

  async getAllRoles(): Promise<Role[]> {
    const response = await this.apiClient.callApi({ method: 'GET', url: `${this.acUrl}/Roles` });
    return response.statusCode === OK ? response.json<Role[]>() : [];
  }

  /** Returns the ids of every role whose name is in `name`. */
  async getRoleIdByName(name: string | string[]): Promise<number[]> {
    const names = typeof name === 'string' ? [name] : name;
    const allRoles = await this.getAllRoles();
    return allRoles
      .filter((role) => role.name !== undefined && names.includes(role.name))
      .map((role) => role.id)
      .filter((id): id is number => id !== undefined);
  }

  async createNewRole(request: RoleRequest): Promise<boolean> {
    const response = await this.apiClient.callApi({
      method: 'POST',
      url: `${this.acUrl}/Roles`,
      json: request,
      headers: JSON_HEADERS,
    });
    return response.statusCode === CREATED;
  }

  async getRoleById(roleId: number): Promise<Role | undefined> {
    const response = await this.apiClient.callApi({
      method: 'GET',
      url: `${this.acUrl}/Roles/${roleId}`,
    });
    return response.statusCode === OK ? response.json<Role>() : undefined;
  }

  async updateARole(roleId: number, request: RoleRequest): Promise<boolean> {
    const response = await this.apiClient.callApi({
      method: 'PUT',
      url: `${this.acUrl}/Roles/${roleId}`,
      json: request,
      headers: JSON_HEADERS,
    });
    return response.statusCode === NO_CONTENT;
  }

  async deleteARole(roleId: number): Promise<boolean> {
    const response = await this.apiClient.callApi({
      method: 'DELETE',
      url: `${this.acUrl}/Roles/${roleId}`,
    });
    return response.statusCode === NO_CONTENT;
  }

  async getAllSamlIdentityProviders(): Promise<SAMLIdentityProvider[]> {
    const response = await this.apiClient.callApi({
      method: 'GET',
      url: `${this.acUrl}/SamlIdentityProviders`,
    });
    return response.statusCode === OK ? response.json<SAMLIdentityProvider[]>() : [];
  }

  async createNewSamlIdentityProvider(
    certificateFile: string,
    request: SamlIdentityProviderRequest,
  ): Promise<boolean> {
    const content = await readFile(certificateFile);
    const response = await this.apiClient.callApi({
      method: 'POST',
      url: `${this.acUrl}/SamlIdentityProviders`,
      files: { CertificateFile: { filename: basename(certificateFile), content } },
      data: toFormFields(request),
    });
    return response.statusCode === CREATED;
  }

  async getSamlIdentityProviderById(
    samlIdentityProviderId: number,
  ): Promise<SAMLIdentityProvider | undefined> {
    const response = await this.apiClient.callApi({
      method: 'GET',
      url: `${this.acUrl}/SamlIdentityProviders/${samlIdentityProviderId}`,
    });
    return response.statusCode === OK ? response.json<SAMLIdentityProvider>() : undefined;
  }

  async updateNewSamlIdentityProvider(
    samlIdentityProviderId: number,
    certificateFile: string,
    request: SamlIdentityProviderRequest,
  ): Promise<boolean> {
    const content = await readFile(certificateFile);
    const response = await this.apiClient.callApi({
      method: 'PUT',
      url: `${this.acUrl}/SamlIdentityProviders/${samlIdentityProviderId}`,
      files: { CertificateFile: { filename: basename(certificateFile), content } },
      data: toFormFields(request),
    });
    return response.statusCode === NO_CONTENT;
  }

  async deleteASamlIdentityProvider(samlIdentityProviderId: number): Promise<boolean> {
    const response = await this.apiClient.callApi({
      method: 'DELETE',
      url: `${this.acUrl}/SamlIdentityProviders/${samlIdentityProviderId}`,
    });
    return response.statusCode === NO_CONTENT;
  }

  async getDetailsOfSamlRoleMappings(
    samlIdentityProviderId?: number,
  ): Promise<SAMLRoleMapping[]> {
    const response = await this.apiClient.callApi({
      method: 'GET',
      url: `${this.acUrl}/SamlRoleMappings`,
      params: samlIdentityProviderId ? { samlIdentityProviderId } : undefined,
    });
    return response.statusCode === OK ? response.json<SAMLRoleMapping[]>() : [];
  }

  async setSamlGroupAndRoleMappingDetails(
    samlIdentityProviderId: number,
    samlRoleMappingDetails: SamlRoleMappingDetail[] = [],
  ): Promise<boolean> {
    const response = await this.apiClient.callApi({
      method: 'PUT',
      url: `${this.acUrl}/SamlIdentityProviders/${samlIdentityProviderId}/RoleMappings`,
      json: samlRoleMappingDetails.map((item) => ({
        roleName: item.roleName,
        samlAttributeValue: item.samlAttributeValue,
      })),
      headers: JSON_HEADERS,
    });
    return response.statusCode === NO_CONTENT;
  }

  async getSamlServiceProviderMetadata(): Promise<Buffer | undefined> {
    const response = await this.apiClient.callApi({
      method: 'GET',
      url: `${this.acUrl}/SamlServiceProvider/metadata`,
    });
    return response.statusCode === OK ? response.content : undefined;
  }

  async getSamlServiceProvider(): Promise<SAMLServiceProvider | undefined> {
    const response = await this.apiClient.callApi({
      method: 'GET',
      url: `${this.acUrl}/SamlServiceProvider`,
    });
    return response.statusCode === OK ? response.json<SAMLServiceProvider>() : undefined;
  }

  async updateASamlServiceProvider(
    certificateFile: string,
    certificatePassword: string,
    issuer: string,
  ): Promise<boolean> {
    const content = await readFile(certificateFile);
    const response = await this.apiClient.callApi({
      method: 'PUT',
      url: `${this.acUrl}/SamlServiceProvider`,
      files: { CertificateFile: { filename: basename(certificateFile), content } },
      data: { CertificatePassword: certificatePassword, Issuer: issuer },
    });
    return response.statusCode === NO_CONTENT;
  }

  async getDetailsOfSamlTeamMappings(
    samlIdentityProviderId?: number,
  ): Promise<SAMLTeamMapping[]> {
    const response = await this.apiClient.callApi({
      method: 'GET',
      url: `${this.acUrl}/SamlTeamMappings`,
      params: samlIdentityProviderId ? { samlIdentityProviderId } : undefined,
    });
    return response.statusCode === OK ? response.json<SAMLTeamMapping[]>() : [];
  }

  async setSamlGroupAndTeamMappingDetails(
    samlIdentityProviderId: number,
    samlTeamMappingDetails: SamlTeamMappingDetail[] = [],
  ): Promise<boolean> {
    const response = await this.apiClient.callApi({
      method: 'PUT',
      url: `${this.acUrl}/SamlIdentityProviders/${samlIdentityProviderId}/TeamMappings`,
      json: samlTeamMappingDetails.map((item) => ({
        teamFullPath: item.teamFullPath,
        samlAttributeValue: item.samlAttributeValue,
      })),
      headers: JSON_HEADERS,
    });
    return response.statusCode === NO_CONTENT;
  }

  async getAllServiceProviders(): Promise<ServiceProvider[]> {
    const response = await this.apiClient.callApi({
      method: 'GET',
      url: `${this.acUrl}/ServiceProviders`,
    });
    return response.statusCode === OK ? response.json<ServiceProvider[]>() : [];
  }

  async getServiceProviderById(serviceProviderId: number): Promise<ServiceProvider | undefined> {
    const response = await this.apiClient.callApi({
      method: 'GET',
      url: `${this.acUrl}/ServiceProviders/${serviceProviderId}`,
    });
    return response.statusCode === OK ? response.json<ServiceProvider>() : undefined;
  }

  async getAllSmtpSettings(): Promise<SMTPSetting[]> {
    const response = await this.apiClient.callApi({
      method: 'GET',
      url: `${this.acUrl}/SMTPSettings`,
    });
    return response.statusCode === OK ? response.json<SMTPSetting[]>() : [];
  }

  async createSmtpSettings(request: SMTPSettingRequest): Promise<boolean> {
    const response = await this.apiClient.callApi({
      method: 'POST',
      url: `${this.acUrl}/SMTPSettings`,
      json: request,
      headers: JSON_HEADERS,
    });
    return response.statusCode === CREATED;
  }

  async getSmtpSettingsById(smtpSettingsId: number): Promise<SMTPSetting | undefined> {
    const response = await this.apiClient.callApi({
      method: 'GET',
      url: `${this.acUrl}/SMTPSettings/${smtpSettingsId}`,
    });
    return response.statusCode === OK ? response.json<SMTPSetting>() : undefined;
  }

  async updateSmtpSettings(
    smtpSettingsId: number,
    request: SMTPSettingRequest,
  ): Promise<boolean> {
    const response = await this.apiClient.callApi({
      method: 'PUT',
      url: `${this.acUrl}/SMTPSettings/${smtpSettingsId}`,
      json: request,
      headers: JSON_HEADERS,
    });
    return response.statusCode === NO_CONTENT;
  }

  async deleteSmtpSettings(smtpSettingsId: number): Promise<boolean> {
    const response = await this.apiClient.callApi({
      method: 'DELETE',
      url: `${this.acUrl}/SMTPSettings/${smtpSettingsId}`,
    });
    return response.statusCode === NO_CONTENT;
  }

  async testSmtpConnection(
    request: SMTPSettingRequest & { recieverEmail?: string },
  ): Promise<boolean> {
    const response = await this.apiClient.callApi({
      method: 'POST',
      url: `${this.acUrl}/SMTPSettings/testconnection`,
      json: request,
      headers: JSON_HEADERS,
    });
    return response.statusCode === OK;
  }

  async getAllSystemLocales(): Promise<SystemLocale[]> {
    const response = await this.apiClient.callApi({
      method: 'GET',
      url: `${this.acUrl}/SystemLocales`,
    });
    return response.statusCode === OK ? response.json<SystemLocale[]>() : [];
  }

  async getMembersByTeamId(teamId: number): Promise<User[]> {
    const response = await this.apiClient.callApi({
      method: 'GET',
      url: `${this.acUrl}/Teams/${teamId}/Users`,
    });
    return response.statusCode === OK ? response.json<User[]>() : [];
  }

  async updateMembersByTeamId(teamId: number, userIds: number[]): Promise<boolean> {
    const response = await this.apiClient.callApi({
      method: 'PUT',
      url: `${this.acUrl}/Teams/${teamId}/Users`,
      json: { userIds },
      headers: JSON_HEADERS,
    });
    return response.statusCode === NO_CONTENT;
  }

  async addAUserToATeam(teamId: number, userId: number): Promise<boolean> {
    const response = await this.apiClient.callApi({
      method: 'POST',
      url: `${this.acUrl}/Teams/${teamId}/Users/${userId}`,
    });
    return response.statusCode === NO_CONTENT;
  }

  async deleteAMemberFromATeam(teamId: number, userId: number): Promise<boolean> {
    const response = await this.apiClient.callApi({
      method: 'DELETE',
      url: `${this.acUrl}/Teams/${teamId}/Users/${userId}`,
    });
    return response.statusCode === NO_CONTENT;
  }

  async getAllTeams(): Promise<Team[]> {
    const response = await this.apiClient.callApi({ method: 'GET', url: `${this.acUrl}/Teams` });
    return response.statusCode === OK ? response.json<Team[]>() : [];
  }

  async getTeamIdByFullName(fullName: string): Promise<number | undefined> {
    const allTeams = await this.getAllTeams();
    return allTeams.find((team) => team.fullName === fullName)?.id;
  }

  async createNewTeam(name: string, parentId: number): Promise<boolean> {
    const response = await this.apiClient.callApi({
      method: 'POST',
      url: `${this.acUrl}/Teams`,
      json: { name, parentId },
      headers: JSON_HEADERS,
    });
    return response.statusCode === CREATED;
  }

  /** Creates every missing team along `/CxServer/a/b`, returning the new ids. */
  async createTeamsRecursively(teamFullName: string): Promise<number[]> {
    const result: number[] = [];
    if (!teamFullName.startsWith('/CxServer')) return result;

    const teams = teamFullName.split('/');
    let parentTeamId = await this.getTeamIdByFullName('/CxServer');

    for (let index = 2; index < teams.length; index += 1) {
      const childTeamFullName = teams.slice(0, index + 1).join('/');
      const childTeamName = teams[index];
      if (childTeamName === undefined) continue;

      let teamId = await this.getTeamIdByFullName(childTeamFullName);
      if (teamId === undefined) {
        if (parentTeamId === undefined) break;
        await this.createNewTeam(childTeamName, parentTeamId);
        teamId = await this.getTeamIdByFullName(childTeamFullName);
        if (teamId !== undefined) result.push(teamId);
      }
      parentTeamId = teamId;
    }
    return result;
  }

  async getTeamById(teamId: number): Promise<Team | undefined> {
    const response = await this.apiClient.callApi({
      method: 'GET',
      url: `${this.acUrl}/Teams/${teamId}`,
    });
    return response.statusCode === OK ? response.json<Team>() : undefined;
  }

  async updateATeam(teamId: number, name: string, parentId: number): Promise<boolean> {
    const response = await this.apiClient.callApi({
      method: 'PUT',
      url: `${this.acUrl}/Teams/${teamId}`,
      json: { name, parentId },
      headers: JSON_HEADERS,
    });
    return response.statusCode === NO_CONTENT;
  }

  async deleteATeam(teamId: number): Promise<boolean> {
    const response = await this.apiClient.callApi({
      method: 'DELETE',
      url: `${this.acUrl}/Teams/${teamId}`,
    });
    return response.statusCode === NO_CONTENT;
  }

  async generateANewTokenSigningCertificate(): Promise<boolean> {
    const response = await this.apiClient.callApi({
      method: 'POST',
      url: `${this.acUrl}/TokenSigningCertificateGeneration`,
    });
    return response.statusCode === CREATED;
  }

  async uploadANewTokenSigningCertificate(
    certificateFile: string,
    certificatePassword: string,
  ): Promise<boolean> {
    const content = await readFile(certificateFile);
    const response = await this.apiClient.callApi({
      method: 'POST',
      url: `${this.acUrl}/TokenSigningCertificate`,
      files: { CertificateFile: { filename: basename(certificateFile), content } },
      data: { CertificatePassword: certificatePassword },
    });
    return response.statusCode === CREATED;
  }

  async getAllUsers(): Promise<User[]> {
    const response = await this.apiClient.callApi({ method: 'GET', url: `${this.acUrl}/Users` });
    return response.statusCode === OK ? response.json<User[]>() : [];
  }

  async getUserIdByName(username: string): Promise<number | undefined> {
    const allUsers = await this.getAllUsers();
    return allUsers.find((user) => user.userName === username)?.id;
  }

  async createNewUser(request: UserRequest): Promise<boolean> {
    const response = await this.apiClient.callApi({
      method: 'POST',
      url: `${this.acUrl}/Users`,
      json: request,
      headers: JSON_HEADERS,
    });
    return response.statusCode === CREATED;
  }

  async getUserById(userId: number): Promise<User | undefined> {
    const response = await this.apiClient.callApi({
      method: 'GET',
      url: `${this.acUrl}/Users/${userId}`,
    });
    return response.statusCode === OK ? response.json<User>() : undefined;
  }

  async updateAUser(userId: number, request: UserRequest): Promise<boolean> {
    const response = await this.apiClient.callApi({
      method: 'PUT',
      url: `${this.acUrl}/Users/${userId}`,
      json: request,
      headers: JSON_HEADERS,
    });
    return response.statusCode === NO_CONTENT;
  }

  async deleteAUser(userId: number): Promise<boolean> {
    const response = await this.apiClient.callApi({
      method: 'DELETE',
      url: `${this.acUrl}/Users/${userId}`,
    });
    return response.statusCode === NO_CONTENT;
  }

  async migrateExistingUser(request: UserRequest): Promise<boolean> {
    const response = await this.apiClient.callApi({
      method: 'POST',
      url: `${this.acUrl}/Users/migration`,
      json: request,
      headers: JSON_HEADERS,
    });
    return response.statusCode === CREATED;
  }

  async getAllWindowsDomains(): Promise<WindowsDomain[]> {
    const response = await this.apiClient.callApi({
      method: 'GET',
      url: `${this.acUrl}/WindowsDomains`,
    });
    return response.statusCode === OK ? response.json<WindowsDomain[]>() : [];
  }

  async getWindowsDomainIdByName(name: string): Promise<number | undefined> {
    const domains = await this.getAllWindowsDomains();
    return domains.find((domain) => domain.name === name)?.id;
  }

  async createANewWindowsDomain(name: string, fullQualifiedName: string): Promise<boolean> {
    const response = await this.apiClient.callApi({
      method: 'POST',
      url: `${this.acUrl}/WindowsDomains`,
      json: { name, fullyQualifiedName: fullQualifiedName },
      headers: JSON_HEADERS,
    });
    return response.statusCode === CREATED;
  }

  async getWindowsDomainById(windowsDomainId: number): Promise<WindowsDomain | undefined> {
    const response = await this.apiClient.callApi({
      method: 'GET',
      url: `${this.acUrl}/WindowsDomains/${windowsDomainId}`,
    });
    return response.statusCode === OK ? response.json<WindowsDomain>() : undefined;
  }

  async updateAWindowsDomain(
    windowsDomainId: number,
    name: string,
    fullQualifiedName: string,
  ): Promise<boolean> {
    const response = await this.apiClient.callApi({
      method: 'PUT',
      url: `${this.acUrl}/WindowsDomains/${windowsDomainId}`,
      json: { name, fullyQualifiedName: fullQualifiedName },
      headers: JSON_HEADERS,
    });
    return response.statusCode === NO_CONTENT;
  }

  async deleteAWindowsDomain(windowsDomainId: number): Promise<boolean> {
    const response = await this.apiClient.callApi({
      method: 'DELETE',
      url: `${this.acUrl}/WindowsDomains/${windowsDomainId}`,
    });
    return response.statusCode === NO_CONTENT;
  }

  async getWindowsDomainUserEntriesBySearchCriteria(
    windowsDomainId: number,
    usernameContainsPattern?: string,
  ): Promise<User[]> {
    const response = await this.apiClient.callApi({
      method: 'GET',
      url: `${this.acUrl}/WindowsDomains/${windowsDomainId}/UserEntries`,
      params: usernameContainsPattern ? { userNameContainsPattern: usernameContainsPattern } : undefined,
    });
    return response.statusCode === OK ? response.json<User[]>() : [];
  }
}

function toFormFields(
  request: object,
): Record<string, string | number | boolean | undefined> {
  const fields: Record<string, string | number | boolean | undefined> = {};
  for (const [key, value] of Object.entries(request)) {
    if (value === undefined || value === null) continue;
    fields[key] = value as string | number | boolean;
  }
  return fields;
}
