export interface AuthenticationProvider {
  id?: number;
  name?: string;
  providerId?: number;
  providerType?: string;
  isExternal?: boolean;
  active?: boolean;
}

export interface AccessControlConfiguration {
  registrationLink?: string;
  isAssignAllRolesByManageUsersEnabled?: boolean;
  isMultitenancyMode?: boolean;
}

export interface LDAPGroup {
  name?: string;
  dn?: string;
}

export interface LDAPGroupAndRoleMappingDetail {
  roleId?: number;
  ldapGroupDn?: string;
  ldapGroupDisplayName?: string;
}

export interface LDAPGroupAndTeamMappingDetail {
  teamId?: number;
  ldapGroupDn?: string;
  ldapGroupDisplayName?: string;
}

export interface LDAPRoleMapping {
  id?: number;
  ldapServerId?: number;
  roleId?: number;
  ldapGroupDn?: string;
  ldapGroupDisplayName?: string;
}

export interface LDAPTeamMapping {
  id?: number;
  ldapServerId?: number;
  teamId?: number;
  ldapGroupDn?: string;
  ldapGroupDisplayName?: string;
}

export interface LDAPServer {
  id?: number;
  active?: boolean;
  name?: string;
  host?: string;
  port?: number;
  username?: string;
  useSsl?: boolean;
  verifySslCertificate?: boolean;
  ldapDirectoryType?: string;
  ssoEnabled?: boolean;
  mappedDomainId?: number;
  baseDn?: string;
  additionalUserDn?: string;
  userObjectFilter?: string;
  userObjectClass?: string;
  usernameAttribute?: string;
  firstNameAttribute?: string;
  lastNameAttribute?: string;
  emailAttribute?: string;
  synchronizationEnabled?: boolean;
  defaultTeamId?: number;
  defaultRoleId?: number;
  updateTeamAndRoleUponLoginEnabled?: boolean;
  periodicalSynchronizationEnabled?: boolean;
  advancedTeamAndRoleMappingEnabled?: boolean;
  additionalGroupDn?: string;
  groupObjectClass?: string;
  groupObjectFilter?: string;
  groupNameAttribute?: string;
  groupMembersAttribute?: string;
  userMembershipAttribute?: string;
}

export interface LDAPServerRequest extends Omit<LDAPServer, 'id' | 'mappedDomainId'> {
  password?: string;
}

export interface MyProfile {
  id?: number;
  userName?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  cellPhoneNumber?: string;
  jobTitle?: string;
  other?: string;
  country?: string;
  localeId?: number;
  teams?: number[];
  authenticationProviderId?: number;
}

export interface MyProfileUpdateRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  cellPhoneNumber?: string;
  jobTitle?: string;
  other?: string;
  country?: string;
  localeId?: number;
}

export interface OIDCClient {
  id?: number;
  updateAccessTokenClaimsOnRefresh?: boolean;
  accessTokenType?: number;
  includeJwtId?: boolean;
  alwaysIncludeUserClaimsInIdToken?: boolean;
  clientId?: string;
  clientName?: string;
  allowOfflineAccess?: boolean;
  clientSecrets?: string[];
  allowedGrantTypes?: string[];
  allowedScopes?: string[];
  enabled?: boolean;
  requireClientSecret?: boolean;
  redirectUris?: string[];
  postLogoutRedirectUris?: string[];
  frontChannelLogoutUri?: string;
  frontChannelLogoutSessionRequired?: boolean;
  backChannelLogoutUri?: string;
  backChannelLogoutSessionRequired?: boolean;
  identityTokenLifetime?: number;
  accessTokenLifetime?: number;
  authorizationCodeLifetime?: number;
  absoluteRefreshTokenLifetime?: number;
  slidingRefreshTokenLifetime?: number;
  refreshTokenUsage?: number;
  refreshTokenExpiration?: number;
  allowedCorsOrigins?: string[];
  allowAccessTokensViaBrowser?: boolean;
  claims?: string[];
  clientClaimsPrefix?: string;
}

export type OIDCClientRequest = Omit<OIDCClient, 'id'>;

export interface Permission {
  id?: number;
  serviceProviderId?: number;
  name?: string;
  category?: string;
}

export interface Role {
  id?: number;
  isSystemRole?: boolean;
  name?: string;
  description?: string;
  permissionIds?: number[];
}

export interface RoleRequest {
  name?: string;
  description?: string;
  permissionIds?: number[];
}

export interface SAMLIdentityProvider {
  id?: number;
  certificateFileName?: string;
  certificateSubject?: string;
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

export interface SAMLRoleMapping {
  id?: number;
  samlIdentityProviderId?: number;
  roleId?: number;
  roleName?: string;
  samlAttributeValue?: string;
}

export interface SAMLTeamMapping {
  id?: number;
  samlIdentityProviderId?: number;
  teamId?: number;
  teamFullPath?: string;
  samlAttributeValue?: string;
}

export interface SAMLServiceProvider {
  assertionConsumerServiceUrl?: string;
  certificateFileName?: string;
  certificateSubject?: string;
  issuer?: string;
}

export interface ServiceProvider {
  id?: number;
  name?: string;
}

export interface SMTPSetting {
  id?: number;
  host?: string;
  port?: number;
  encryptionType?: string;
  fromAddress?: string;
  useDefaultCredentials?: boolean;
  username?: string;
}

export interface SMTPSettingRequest extends Omit<SMTPSetting, 'id'> {
  password?: string;
}

export interface SystemLocale {
  id?: number;
  lcid?: number;
  code?: string;
  displayName?: string;
}

export interface Team {
  id?: number;
  name?: string;
  fullName?: string;
  parentId?: number;
}

export interface User {
  id?: number;
  userName?: string;
  lastLoginDate?: string;
  roleIds?: number[];
  teamIds?: number[];
  authenticationProviderId?: number;
  creationDate?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  cellPhoneNumber?: string;
  jobTitle?: string;
  other?: string;
  country?: string;
  active?: boolean;
  expirationDate?: string;
  allowedIpList?: string[];
  localeId?: number;
}

export interface UserRequest extends Omit<User, 'id' | 'lastLoginDate' | 'creationDate'> {
  password?: string;
}

export interface FirstAdminUserRequest {
  username?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}

export interface WindowsDomain {
  id?: number;
  name?: string;
  fullyQualifiedName?: string;
}
