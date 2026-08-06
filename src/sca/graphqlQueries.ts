const bool = (value: boolean): string => (value ? 'true' : 'false');

const RISK_LEVEL_COUNTS = 'risksLevelCounts { critical, high, medium, low, none, empty }';

const PACKAGE_RISKS =
  'risks { vulnerabilities { critical, high, medium, low, none }, ' +
  'legalRisk { critical, high, medium, low, none }, ' +
  'supplyChainRisks { critical, high, medium, low, none }, ' +
  'vulnerabilitiesWithoutIgnored { critical, high, medium, low, none }, ' +
  'supplyChainRisksWithoutIgnored { critical, high, medium, low, none } }';

const PACKAGE_ROW_FIELDS =
  'items { packageId, name, version, isViolatingPolicy, isMalicious, dependencyPathCount, ' +
  'violatedPoliciesCount, violatedPolicies, relation, matchType, legalRiskLevel, isDev, ' +
  'remediationTaskId, isTest, isNpmVerified, isPluginDependency, isFramework, packageRepository, ' +
  'packageUsage, releaseDate, isPrivateDependency, ' +
  'outdatedModel { newestVersion, versionsInBetween, newestLibraryDate }, ' +
  'saasProviderInfo { name, key, type }, effectiveLicenses { name, riskLevel }, ' +
  `${PACKAGE_RISKS} }, totalCount`;

const PACKAGE_COUNTERS =
  '{ totalCount, totalDevCount, totalPolicyViolationsCount, maxVulnerabilitiesCount, ' +
  'hasMaliciousPackage, totalDevOrTestCount }';

const VULNERABILITY_ITEM_FIELDS =
  'items { credit, state, isIgnored, cve, cwe, description, packageId, severity, type, published, ' +
  'score, violatedPolicies, isExploitable, isKevDataExists, isExploitDbDataExists, relation, ' +
  'epssData { cve, date, epss, percentile }, isEpssDataExists, detectionDate, isVulnerabilityNew, ' +
  'cweInfo { title }, packageInfo { name, packageRepository, version }, ' +
  'exploitablePath { methodMatch { fullName, line, namespace, shortName, sourceFile }, ' +
  'methodSourceCall { fullName, line, namespace, shortName, sourceFile } }, ' +
  'vulnerablePackagePath { id, isDevelopment, isResolved, name, version, vulnerabilityRiskLevel }, ' +
  'references { comment, type, url }, cvss2 { attackComplexity, attackVector, authentication, ' +
  'availability, availabilityRequirement, baseScore, collateralDamagePotential, confidentiality, ' +
  'confidentialityRequirement, exploitCodeMaturity, integrityImpact, integrityRequirement, ' +
  'remediationLevel, reportConfidence, targetDistribution }, cvss3 { attackComplexity, attackVector,' +
  ' availability, availabilityRequirement, baseScore, confidentiality, confidentialityRequirement, ' +
  'exploitCodeMaturity, integrity, integrityRequirement, privilegesRequired, remediationLevel, ' +
  'reportConfidence, scope, userInteraction }, cvss4 { attackComplexity, attackVector, ' +
  'attackRequirements, baseScore, privilegesRequired, userInteraction, vulnerableSystemConfidentiality,' +
  ' vulnerableSystemIntegrity, vulnerableSystemAvailability, subsequentSystemConfidentiality, ' +
  'subsequentSystemIntegrity, subsequentSystemAvailability }, pendingState, pendingChanges, ' +
  'packageState { type, value }, pendingScore, pendingSeverity, isScoreOverridden }';

export function numberOfVulnerabilitiesRisksByScanId(
  scanId: string,
  isExploitablePathEnabled: boolean,
): string {
  return (
    'query { vulnerabilitiesRisksByScanId (' +
    `isExploitablePathEnabled: ${bool(isExploitablePathEnabled)},` +
    `scanId: "${scanId}",` +
    'where: {and:[{and:[{isIgnored:{eq:false}}]}]}' +
    `){ totalCount, ${RISK_LEVEL_COUNTS} }}`
  );
}

export function numberOfSupplyChainRisksByScanId(scanId: string): string {
  return (
    'query { supplyChainRisksByScanId  (' +
    `scanId: "${scanId}",` +
    'where: {and:[{and:[{isIgnore:{eq:false}}]}]}' +
    `){ totalCount, ${RISK_LEVEL_COUNTS} }}`
  );
}

export function numberOfOutdatedPackagesByScanId(scanId: string): string {
  return (
    'query { packagesRows   (' +
    `scanId: "${scanId}",` +
    'where: {and:[{outdatedModel:{and:[{versionsInBetween:{gte:1}}]}}]}' +
    '){ totalCount }}'
  );
}

export function numberOfLegalRisksByScanId(scanId: string): string {
  return (
    'query { legalRisksByScanId   (' +
    `scanId: "${scanId}",` +
    'where: null' +
    `){  totalCount, ${RISK_LEVEL_COUNTS} }}`
  );
}

export function vulnerabilitiesRisksByScanId(
  scanId: string,
  isExploitablePathEnabled: boolean,
  take: number,
  skip: number,
): string {
  return (
    'query { vulnerabilitiesRisksByScanId (' +
    'where: null, ' +
    `take: ${take}, ` +
    `skip: ${skip}, ` +
    'order: {score: DESC}, ' +
    `scanId:  "${scanId}", ` +
    `isExploitablePathEnabled: ${bool(isExploitablePathEnabled)})` +
    ' { totalCount, undisclosedRiskLevelCounts { empty, critical, high, medium, low, none }, ' +
    `${VULNERABILITY_ITEM_FIELDS} } }`
  );
}

export function oneVulnerability(
  scanId: string,
  vulnerabilityId: string,
  packageId: string,
): string {
  return (
    'query { vulnerability  (' +
    `scanId:  "${scanId}", ` +
    `vulnerabilityId:  "${vulnerabilityId}", ` +
    `packageId:  "${packageId}"` +
    ')' +
    '{ packageState { type, value }, assignedPolicies, violatedPolicies, pendingChanges, pendingState, ' +
    'state, score, pendingScore, pendingSeverity, isScoreOverridden, morEntityProfilesApplied, credit, ' +
    'notes, isIgnored, cve, cwe, description, packageId, severity, type, published, isKevDataExists, ' +
    'isExploitDbDataExists, isVulnerabilityNew, detectionDate, relation, vulnerabilityFixResolutionText, ' +
    'cweInfo { title }, packageInfo { name, packageRepository, version }, isExploitable, exploitablePath ' +
    '{ methodMatch { fullName, line, namespace, shortName, sourceFile }, methodSourceCall { fullName, ' +
    'line, namespace, shortName, sourceFile } }, ' +
    'vulnerablePackagePath { id, isDevelopment, isResolved, name, version, vulnerabilityRiskLevel }, ' +
    'references { comment, type, url }, ' +
    'cvss2 { attackComplexity, attackVector, authentication, availability, availabilityRequirement,' +
    ' baseScore, collateralDamagePotential, confidentiality, confidentialityRequirement,' +
    ' exploitCodeMaturity, integrityImpact, integrityRequirement, remediationLevel, reportConfidence, ' +
    'targetDistribution, severity }, cvss3 { attackComplexity, attackVector, availability,' +
    ' availabilityRequirement, baseScore, confidentiality, confidentialityRequirement, ' +
    'exploitCodeMaturity, integrity, integrityRequirement, privilegesRequired, remediationLevel, ' +
    'reportConfidence, scope, userInteraction, severity }, ' +
    'cvss4 { attackComplexity, attackVector, attackRequirements, privilegesRequired, userInteraction, ' +
    'vulnerableSystemConfidentiality, vulnerableSystemIntegrity, vulnerableSystemAvailability, ' +
    'subsequentSystemConfidentiality, subsequentSystemIntegrity, subsequentSystemAvailability, ' +
    'baseScore, severity }, isEpssDataExists, epssData { cve, date, epss, percentile } } }'
  );
}

export function supplyChainRisksByScanId(scanId: string, take: number, skip: number): string {
  return (
    'query { supplyChainRisksByScanId (' +
    'where: null, ' +
    `take: ${take}, ` +
    `skip: ${skip}, ` +
    'order: {score: DESC}, ' +
    `scanId:  "${scanId}"` +
    ')' +
    ' { totalCount, items { state, description, id, identifiedInPackage, identifiedInPackageName,' +
    ' identifiedInPackageVersion, score, severity, title, type, cve, violatedPolicies, relation,' +
    ' publishDate, detectionDate, pendingState, pendingChanges, packageState { type, value }, ' +
    'pendingScore, pendingSeverity, originalScore } } }'
  );
}

export function legalRisksByScanId(scanId: string, take: number, skip: number): string {
  return (
    'query { legalRisksByScanId  (' +
    'where: null, ' +
    `take: ${take}, ` +
    `skip: ${skip}, ` +
    'order: {score: DESC}, ' +
    `scanId:  "${scanId}"` +
    ')' +
    ' { totalCount, items { licenseName, packageId, violatedPolicies, packageName, packageVersion, ' +
    'relation, score, severity, state, isTest, isDev, message } }  }'
  );
}

export function directThirdPartyPackagesByScanId(
  scanId: string,
  isExploitablePathEnabled: boolean,
  take: number,
  skip: number,
  isPrivateDependency: boolean,
): string {
  const operator = isPrivateDependency ? 'eq' : 'neq';
  return (
    'query { packagesRows (' +
    `where: {relation:{or:[{eq:"Direct"},{eq:"Mixed"}]},isPrivateDependency:{${operator}:true},` +
    'isSaasProvider:{eq:false}}, ' +
    `take: ${take}, ` +
    `skip: ${skip}, ` +
    'order: {risks:DESC}, ' +
    `isExploitablePathEnabled: ${bool(isExploitablePathEnabled)}, ` +
    `scanId: "${scanId}"` +
    `){ ${PACKAGE_ROW_FIELDS} } }`
  );
}

export function transitiveThirdPartyPackagesByScanId(
  scanId: string,
  isExploitablePathEnabled: boolean,
  take: number,
  skip: number,
  isPrivateDependency: boolean,
): string {
  const operator = isPrivateDependency ? 'eq' : 'neq';
  return (
    'query { packagesRows (' +
    `where: {relation:{or:[{eq:"Transitive"},{eq:"Mixed"}]},isPrivateDependency:{${operator}:true}, ` +
    'isSaasProvider:{eq:false}}, ' +
    `take: ${take}, ` +
    `skip: ${skip}, ` +
    'order: {risks:DESC}, ' +
    `isExploitablePathEnabled: ${bool(isExploitablePathEnabled)}, ` +
    `scanId: "${scanId}"` +
    `){ ${PACKAGE_ROW_FIELDS} }}`
  );
}

export function packageDetailsByScanIdAndPackageId(
  scanId: string,
  packageId: string,
  isExploitablePathEnabled: boolean,
): string {
  return (
    'query { package (' +
    `packageId: "${packageId}", ` +
    `scanId: "${scanId}", ` +
    `isExploitablePathEnabled: ${bool(isExploitablePathEnabled)}` +
    ') ' +
    '{ dummyRiskyVersion, isPotentialRiskyPackage, isIgnored, pendingChanges, morEntityProfilesApplied, ' +
    'isViolatingPolicy, name, packageId, remediationTaskId, isPrivateDependency, isUnresolved, matchType, ' +
    'locations, directDependenciesCount, transitiveDependenciesCount, releaseDate, version, ' +
    'packageRepository, isMalicious, isTest, isPluginDependency, isDev, isNpmVerified, isFramework, ' +
    'packageCredibility { contributorReputation, packageReliability, runTimeBehavior }, ' +
    'dependencyPath { id, name, version, isResolved, isDevelopment, vulnerabilityRiskLevel }, ' +
    'licenses { referenceType, reference, packageId, packageName, packageVersion, name, riskLevel, ' +
    'copyrightRiskLevel, patentRiskLevel, copyLeftType, riskScore, state }, ' +
    'outdatedModel { newestVersion, versionsInBetween, newestLibraryDate }, ' +
    'packageUsageModel {  importsCalled { sourceFile, line, fullName, shortName },  ' +
    'methodsCalled { methodSourceCall { sourceFile, line, fullName, shortName } },  ' +
    'usageType, packageUsageComplexity }, ' +
    `${PACKAGE_RISKS} }}`
  );
}

export function numberOfPackagesByScanId(
  scanId: string,
  isExploitablePathEnabled: boolean,
): string {
  return (
    'query { packagesRows (' +
    `scanId: "${scanId}", ` +
    `isExploitablePathEnabled: ${bool(isExploitablePathEnabled)}, ` +
    'where: {}) { totalCount, totalDevCount, totalDevOrTestCount } }'
  );
}

export function numberOfDirectThirdPartyPackagesByScanId(
  scanId: string,
  isExploitablePathEnabled: boolean,
  isPrivateDependency: boolean,
): string {
  const operator = isPrivateDependency ? 'eq' : 'neq';
  return (
    'query { packagesRows (' +
    `scanId: "${scanId}", ` +
    `isExploitablePathEnabled: ${bool(isExploitablePathEnabled)}, ` +
    'where: {relation:{or:[{eq:"Direct"},{eq:"Mixed"}]},' +
    `isPrivateDependency:{${operator}:true},isSaasProvider:{eq:false}}` +
    `)${PACKAGE_COUNTERS}}`
  );
}

export function numberOfTransitiveThirdPartyPackagesByScanId(
  scanId: string,
  isExploitablePathEnabled: boolean,
  isPrivateDependency: boolean,
): string {
  const operator = isPrivateDependency ? 'eq' : 'neq';
  return (
    'query { packagesRows (' +
    `scanId: "${scanId}", ` +
    `isExploitablePathEnabled: ${bool(isExploitablePathEnabled)}, ` +
    `where: {relation:{or:[{eq:"Transitive"},{eq:"Mixed"}]},isPrivateDependency:{${operator}:true},` +
    'isSaasProvider:{eq:false}}' +
    `) ${PACKAGE_COUNTERS} }`
  );
}

export function numberOfPackagesUsedForAccessingSaasServices(
  scanId: string,
  isExploitablePathEnabled: boolean,
): string {
  return (
    'query { packagesRows (' +
    `scanId: "${scanId}", ` +
    `isExploitablePathEnabled: ${bool(isExploitablePathEnabled)}, ` +
    'where: {isSaasProvider:{eq:true}}' +
    `) ${PACKAGE_COUNTERS} }`
  );
}

export function containerPackagesByScanId(
  scanId: string,
  fetchRuntimeData: boolean,
  take: number,
  skip: number,
): string {
  return (
    'query { containerPackages  (' +
    `scanId: "${scanId}", ` +
    `fetchRuntimeData: ${bool(fetchRuntimeData)}, ` +
    `take: ${take}, ` +
    `skip: ${skip}, ` +
    'where: null, ' +
    'order: {isMalicious:DESC,runtimeUsage:DESC,vulnerabilitiesCounter:{high:DESC}}' +
    ')' +
    '{ totalCount, items { packageName, packageVersion, imageName, imageTag, identifiedBy, deploymentType,' +
    'runtimeUsage, imageOrigins, isMalicious, vulnerabilitiesCounter { high, medium, low } } }  }'
  );
}

export function containerVulnerabilitiesByScanId(
  scanId: string,
  fetchRuntimeData: boolean,
  take: number,
  skip: number,
): string {
  return (
    'query { containerVulnerabilities  (' +
    `scanId: "${scanId}", ` +
    `fetchRuntimeData: ${bool(fetchRuntimeData)}, ` +
    `take: ${take}, ` +
    `skip: ${skip}, ` +
    'where: null, ' +
    'order: {riskFactors:{isMalicious:DESC},severity:DESC}' +
    ')' +
    '{totalCount, items {cve, cwe, name, version, published, severity, riskFactors {isMalicious, isUsed}}}}'
  );
}

export function packageLicensesByScanId(scanId: string, take: number, skip: number): string {
  return (
    'query { packageLicensesByScanId   (' +
    `scanId: "${scanId}", ` +
    `take: ${take}, ` +
    `skip: ${skip}, ` +
    'where: null, ' +
    'order: {pendingState:ASC,riskScore:DESC}' +
    ')' +
    '{totalCount, items { copyLeftType, copyrightRiskLevel, isViolatingPolicy, licenseUrl, name, ' +
    'patentRiskLevel, reference, referenceType, licenseSourcePath, relation, riskLevel, riskScore, ' +
    'violatedPolicies, violatedPoliciesCount, state, pendingChanges, pendingState, isForbidden, status, ' +
    'package { link, numberOfLicensesInPackage, packageId, packageName, packageVersion }, ' +
    'packageState { type, value } } }}'
  );
}

export function downStreamRemediationByScanId(
  scanId: string,
  includeBrokenMethods: boolean,
  take: number,
  skip: number,
): string {
  return (
    'query { downstreamRemediation    (' +
    `scanId: "${scanId}", ` +
    `includeBrokenMethods: ${bool(includeBrokenMethods)}, ` +
    `take: ${take}, ` +
    `skip: ${skip}, ` +
    'where: null, ' +
    'order: {summaryQuery:{packageId:ASC}}' +
    ')' +
    '{totalCount, items { id, summaryQuery { effortEstimation, packageName, packageVersion, packageId, ' +
    'criticalVulnerabilityCount, highVulnerabilityCount, mediumVulnerabilityCount, lowVulnerabilityCount,' +
    'effortEstimation, impact, hasExploitablePath, packages { name, version, criticalVulnerabilityCount,' +
    ' highVulnerabilityCount, mediumVulnerabilityCount, lowVulnerabilityCount, parent { name, version}}}}}}'
  );
}

export function scanInfoByScanId(scanId: string): string {
  return (
    'query { scanInfo     (' +
    `scanId: "${scanId}" ` +
    ')' +
    '{hasWarnings, totalManifestsCount, totalPackagesCount, identifiedBy { matchType, count }, ' +
    'manifests { dependenciesCount, dependencyResolverStatus, manifestPath, message, resolvingModuleType},' +
    'deltaScan }}'
  );
}

export function scanProgressByScanId(scanId: string): string {
  return (
    'query { scanProgress  (' +
    `scanId: "${scanId}" ` +
    ')' +
    '{ totalDuration, data { name, startTime, duration, status } }}'
  );
}

export function packagesFromInventoryByNameAndVersion(
  packageName: string,
  packageVersion: string,
  take: number,
  skip: number,
): string {
  return (
    'query {  reportingPackages ( where: { ' +
    `   and:[{packageName:{contains:"${packageName}"} }, ` +
    `{packageVersion:{contains:"${packageVersion}"} }]` +
    ' }, ' +
    ` take: ${take}, ` +
    ` skip: ${skip}, ` +
    ' order: [ ' +
    '   {isMalicious:DESC},' +
    '   {aggregatedCriticalVulnerabilities:DESC},' +
    '   {aggregatedHighVulnerabilities:DESC},' +
    '   {aggregatedMediumVulnerabilities:DESC},' +
    '   {aggregatedLowVulnerabilities:DESC}, ' +
    '   {aggregatedNoneVulnerabilities:DESC}' +
    ' ])' +
    ' { packageId, packageName, packageVersion, packageRepository, outdated, releaseDate,' +
    ' newestVersion, newestVersionReleaseDate, numberOfVersionsSinceLastUpdate, ' +
    ' effectiveLicenses, licenses, projectName, projectId, scanId, ' +
    ' aggregatedCriticalVulnerabilities, aggregatedHighVulnerabilities, ' +
    ' aggregatedMediumVulnerabilities, aggregatedLowVulnerabilities, aggregatedNoneVulnerabilities,' +
    ' aggregatedCriticalSuspectedMalwares, aggregatedHighSuspectedMalwares, ' +
    ' aggregatedMediumSuspectedMalwares, aggregatedLowSuspectedMalwares, ' +
    ' aggregatedNoneSuspectedMalwares, relation, isDevDependency, isTest, isNpmVerified,' +
    ' isPluginDependency, isPrivateDependency, tags, scanDate, status, statusValue, ' +
    ' isMalicious, usage, isFixAvailable, fixRecommendationVersion, pendingStatus, ' +
    ' pendingStatusEndDate, groupIds, applicationIds } }'
  );
}
