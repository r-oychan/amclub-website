import * as pulumi from '@pulumi/pulumi';
import * as azure from '@pulumi/azure-native';
import * as dockerBuild from '@pulumi/docker-build';
import * as random from '@pulumi/random';

const location = azure.config.location ?? 'southeastasia';
const projectName = 'amclub';
const stack = pulumi.getStack();

// ── ElevenLabs config (env-var driven, set via GitHub Actions secrets) ─
// Matches the style used by AZURE_* / PULUMI_* — keeps Pulumi.<stack>.yaml
// clean and avoids requiring a local `pulumi config set` step.
const elevenlabsApiKeyRaw = process.env.ELEVENLABS_API_KEY ?? '';
const elevenlabsAgentId = process.env.ELEVENLABS_AGENT_ID ?? '';
const publicSiteUrl = process.env.PUBLIC_SITE_URL ?? 'https://amclub.example';
if (!elevenlabsApiKeyRaw) throw new Error('Missing env var ELEVENLABS_API_KEY (add as GitHub secret)');
if (!elevenlabsAgentId) throw new Error('Missing env var ELEVENLABS_AGENT_ID (set in deploy.yml)');
const elevenlabsApiKey = pulumi.secret(elevenlabsApiKeyRaw);

// ── Microsoft Entra ID SSO config (env-var driven) ────────────────
// Consumed by strapi-plugin-sso at the CMS layer. All four values are
// OPTIONAL — if AZUREAD_OAUTH_CLIENT_ID is empty, the plugin won't be able
// to start its OAuth flow and the admin falls back to local password login
// (intended graceful degradation while the GitHub secrets are being staged).
// Set the secrets per environment under GitHub Settings → Environments →
// {dev, uat, prod} → Secrets.
const azureadTenantId = process.env.AZUREAD_TENANT_ID ?? '';
const azureadClientId = process.env.AZUREAD_OAUTH_CLIENT_ID ?? '';
const azureadClientSecretRaw = process.env.AZUREAD_OAUTH_CLIENT_SECRET ?? '';
const azureadScope = process.env.AZUREAD_SCOPE || 'user.read';
const azureadClientSecret = pulumi.secret(azureadClientSecretRaw);
const ssoEnabled = Boolean(azureadTenantId && azureadClientId && azureadClientSecretRaw);

// ── Auto-generated secrets ───────────────────────────────────
const dbPassword = new random.RandomPassword(`${projectName}-db-pw`, {
  length: 24,
  special: false,
});
const appKey1 = new random.RandomPassword(`${projectName}-app-key-1`, {
  length: 32,
  special: false,
});
const appKey2 = new random.RandomPassword(`${projectName}-app-key-2`, {
  length: 32,
  special: false,
});
const apiTokenSalt = new random.RandomPassword(`${projectName}-api-salt`, {
  length: 32,
  special: false,
});
const adminJwtSecret = new random.RandomPassword(`${projectName}-admin-jwt`, {
  length: 32,
  special: false,
});
const transferTokenSalt = new random.RandomPassword(`${projectName}-xfer-salt`, {
  length: 32,
  special: false,
});
const encryptionKey = new random.RandomPassword(`${projectName}-enc-key`, {
  length: 32,
  special: false,
});
const jwtSecret = new random.RandomPassword(`${projectName}-jwt`, {
  length: 32,
  special: false,
});

// ── Resource Group ───────────────────────────────────────────
const rg = new azure.resources.ResourceGroup(`${projectName}-${stack}-rg`, {
  resourceGroupName: `${projectName}-${stack}-rg`,
  location,
});

// ── Container Registry ───────────────────────────────────────
// ACR names must be globally unique alphanumeric, no hyphens, 5-50 chars.
const registry = new azure.containerregistry.Registry(`${projectName}acr`, {
  registryName: `${projectName}${stack}acr`,
  resourceGroupName: rg.name,
  location: rg.location,
  sku: { name: 'Basic' },
  adminUserEnabled: true,
});

const registryCreds = pulumi
  .all([rg.name, registry.name])
  .apply(([rgName, registryName]) =>
    azure.containerregistry.listRegistryCredentials({
      resourceGroupName: rgName,
      registryName,
    })
  );

const registryUsername = registryCreds.apply((c) => c.username ?? '');
const registryPassword = registryCreds.apply(
  (c) => c.passwords?.[0]?.value ?? ''
);

// ── PostgreSQL Flexible Server (cheapest tier) ───────────────
// Server FQDN must be globally unique: <name>.postgres.database.azure.com
const dbServer = new azure.dbforpostgresql.Server(`${projectName}-pg`, {
  serverName: `${projectName}-${stack}-pg`,
  resourceGroupName: rg.name,
  location: rg.location,
  version: '16',
  sku: {
    name: 'Standard_B1ms',
    tier: azure.dbforpostgresql.SkuTier.Burstable,
  },
  storage: {
    storageSizeGB: 32,
  },
  administratorLogin: 'strapi',
  administratorLoginPassword: dbPassword.result,
  authConfig: {
    activeDirectoryAuth: azure.dbforpostgresql.ActiveDirectoryAuth.Disabled,
    passwordAuth: azure.dbforpostgresql.PasswordAuth.Enabled,
  },
  backup: {
    backupRetentionDays: 7,
    geoRedundantBackup: azure.dbforpostgresql.GeoRedundantBackup.Disabled,
  },
});

// Allow Azure services to access PostgreSQL
new azure.dbforpostgresql.FirewallRule(`${projectName}-pg-allow-azure`, {
  firewallRuleName: 'allow-azure',
  resourceGroupName: rg.name,
  serverName: dbServer.name,
  startIpAddress: '0.0.0.0',
  endIpAddress: '0.0.0.0',
});

const database = new azure.dbforpostgresql.Database(`${projectName}-db`, {
  databaseName: projectName,
  resourceGroupName: rg.name,
  serverName: dbServer.name,
  charset: 'UTF8',
  collation: 'en_US.utf8',
});

// ── Storage Account (Azure Files for uploads + Blob for media) ──
// Storage account names must be globally unique lowercase alphanumeric,
// 3-24 chars, no hyphens. `amclubuatdata`/`amclubproddata` patterns.
const storage = new azure.storage.StorageAccount(`${projectName}data`, {
  accountName: `${projectName}${stack}data`,
  resourceGroupName: rg.name,
  location: rg.location,
  sku: { name: azure.storage.SkuName.Standard_LRS },
  kind: azure.storage.Kind.StorageV2,
  // Required so the media BlobContainer below can be created with
  // publicAccess: Blob — Azure's default for new accounts blocks this.
  allowBlobPublicAccess: true,
});

const dataShare = new azure.storage.FileShare(`${projectName}-data`, {
  shareName: 'data',
  resourceGroupName: rg.name,
  accountName: storage.name,
  shareQuota: 5,
});

// Blob container for Strapi Media Library uploads. Public access at the blob
// level so the frontend can fetch media URLs directly without going through
// Strapi or signed URLs.
const mediaContainer = new azure.storage.BlobContainer(`${projectName}-media`, {
  resourceGroupName: rg.name,
  accountName: storage.name,
  containerName: 'media',
  publicAccess: azure.storage.PublicAccess.Blob,
});

const storageKey = pulumi
  .all([rg.name, storage.name])
  .apply(([rgName, accountName]) =>
    azure.storage.listStorageAccountKeys({
      resourceGroupName: rgName,
      accountName,
    })
  )
  .apply((k) => k.keys[0].value);

const storageBlobUrl = pulumi.interpolate`https://${storage.name}.blob.core.windows.net`;

// ── Log Analytics ────────────────────────────────────────────
const logAnalytics = new azure.operationalinsights.Workspace(
  `${projectName}-logs`,
  {
    workspaceName: `${projectName}-${stack}-logs`,
    resourceGroupName: rg.name,
    location: rg.location,
    sku: {
      name: azure.operationalinsights.WorkspaceSkuNameEnum.PerGB2018,
    },
    retentionInDays: 30,
  }
);

const logKey = pulumi
  .all([rg.name, logAnalytics.name])
  .apply(([rgName, wsName]) =>
    azure.operationalinsights.getSharedKeys({
      resourceGroupName: rgName,
      workspaceName: wsName,
    })
  )
  .apply((k) => k.primarySharedKey ?? '');

// ── Container Apps Environment ───────────────────────────────
const containerEnv = new azure.app.ManagedEnvironment(`${projectName}-env`, {
  environmentName: `${projectName}-${stack}-env`,
  resourceGroupName: rg.name,
  location: rg.location,
  appLogsConfiguration: {
    destination: 'log-analytics',
    logAnalyticsConfiguration: {
      customerId: logAnalytics.customerId,
      sharedKey: logKey,
    },
  },
});

// Mount Azure Files for persistent uploads
new azure.app.ManagedEnvironmentsStorage(`${projectName}-env-storage`, {
  environmentName: containerEnv.name,
  resourceGroupName: rg.name,
  storageName: 'persistent-data',
  properties: {
    azureFile: {
      accountName: storage.name,
      accountKey: storageKey,
      shareName: dataShare.name,
      accessMode: azure.app.AccessMode.ReadWrite,
    },
  },
});

// ── Build Docker image with BuildKit registry cache ──────────
// Cache layers are stored as a separate `:buildcache` tag in ACR.
// `mode: 'max'` exports cache for all stages (frontend-builder,
// cms-builder, runtime) so unchanged deps skip rebuild.
const buildCacheRef = pulumi.interpolate`${registry.loginServer}/${projectName}-app:buildcache`;

const appImage = new dockerBuild.Image(`${projectName}-app-image`, {
  tags: [pulumi.interpolate`${registry.loginServer}/${projectName}-app:latest`],
  context: { location: '..' },
  dockerfile: { location: '../Dockerfile' },
  platforms: ['linux/amd64'],
  push: true,
  cacheFrom: [{ registry: { ref: buildCacheRef } }],
  cacheTo: [{ registry: { ref: buildCacheRef, mode: 'max' } }],
  registries: [
    {
      address: registry.loginServer,
      username: registryUsername,
      password: registryPassword,
    },
  ],
});

// ── Container App (Nginx + Strapi) ───────────────────────────
const appKeys = pulumi.interpolate`${appKey1.result},${appKey2.result}`;

// Stack-aware custom domain binding. Config-driven so dev can run
// without a custom domain and prod can wire up its cert post-deploy.
//
// Prefer the plural `customDomains` config (array of { name, certName })
// so prod can serve both apex (amclub.org.sg) and www subdomain from the
// same Container App:
//
//   amclub-website:customDomains:
//     - name: amclub.org.sg
//       certName: amclub.org.sg-amclub-prod-<timestamp>
//     - name: www.amclub.org.sg
//       certName: www.amclub.org.sg-amclub-prod-<timestamp>
//
// The legacy singular `customDomain` + `customDomainCertName` keys are
// still honored for back-compat. Both forms require the managed cert
// to already exist in the Container Apps Environment (provisioned
// manually in the Azure portal). Pulumi only references certs by name.
const stackConfig = new pulumi.Config();
type CustomDomainEntry = { name: string; certName: string };
const customDomainEntries = stackConfig.getObject<CustomDomainEntry[]>('customDomains');
const legacyDomain = stackConfig.get('customDomain');
const legacyCertName = stackConfig.get('customDomainCertName');

const domainEntries: CustomDomainEntry[] = customDomainEntries
  ?? (legacyDomain && legacyCertName ? [{ name: legacyDomain, certName: legacyCertName }] : []);

const customDomains = domainEntries.length > 0
  ? domainEntries.map((entry) => ({
      name: entry.name,
      certificateId: azure.app.getManagedCertificateOutput({
        resourceGroupName: rg.name,
        environmentName: containerEnv.name,
        managedCertificateName: entry.certName,
      }).id,
      bindingType: azure.app.BindingType.SniEnabled,
    }))
  : undefined;

const app = new azure.app.ContainerApp(`${projectName}-app`, {
  containerAppName: `${projectName}-${stack}-app`,
  resourceGroupName: rg.name,
  location: rg.location,
  managedEnvironmentId: containerEnv.id,
  configuration: {
    ingress: {
      external: true,
      targetPort: 80,
      transport: azure.app.IngressTransportMethod.Auto,
      ...(customDomains ? { customDomains } : {}),
    },
    registries: [
      {
        server: registry.loginServer,
        username: registryUsername,
        passwordSecretRef: 'registry-password',
      },
    ],
    secrets: [
      { name: 'registry-password', value: registryPassword },
      { name: 'db-password', value: dbPassword.result },
      { name: 'app-keys', value: appKeys },
      { name: 'api-token-salt', value: apiTokenSalt.result },
      { name: 'admin-jwt-secret', value: adminJwtSecret.result },
      { name: 'transfer-token-salt', value: transferTokenSalt.result },
      { name: 'encryption-key', value: encryptionKey.result },
      { name: 'jwt-secret', value: jwtSecret.result },
      { name: 'storage-account-key', value: storageKey },
      { name: 'elevenlabs-api-key', value: elevenlabsApiKey },
      // SSO client secret — only added when the GitHub secret is set for this
      // environment; the env block below references it conditionally to avoid
      // a Container App "missing secretRef" error on stacks where SSO isn't
      // configured yet.
      ...(ssoEnabled ? [{ name: 'azuread-client-secret', value: azureadClientSecret }] : []),
    ],
  },
  template: {
    containers: [
      {
        name: 'app',
        image: appImage.ref,
        resources: {
          cpu: 0.5,
          memory: '1Gi',
        },
        env: [
          { name: 'NODE_ENV', value: 'production' },
          { name: 'DATABASE_CLIENT', value: 'postgres' },
          { name: 'DATABASE_HOST', value: dbServer.fullyQualifiedDomainName },
          { name: 'DATABASE_PORT', value: '5432' },
          { name: 'DATABASE_NAME', value: database.name },
          { name: 'DATABASE_USERNAME', value: 'strapi' },
          { name: 'DATABASE_PASSWORD', secretRef: 'db-password' },
          { name: 'DATABASE_SSL', value: 'true' },
          { name: 'APP_KEYS', secretRef: 'app-keys' },
          { name: 'API_TOKEN_SALT', secretRef: 'api-token-salt' },
          { name: 'ADMIN_JWT_SECRET', secretRef: 'admin-jwt-secret' },
          { name: 'TRANSFER_TOKEN_SALT', secretRef: 'transfer-token-salt' },
          { name: 'ENCRYPTION_KEY', secretRef: 'encryption-key' },
          { name: 'JWT_SECRET', secretRef: 'jwt-secret' },
          { name: 'STORAGE_ACCOUNT', value: storage.name },
          { name: 'STORAGE_ACCOUNT_KEY', secretRef: 'storage-account-key' },
          { name: 'STORAGE_URL', value: storageBlobUrl },
          { name: 'STORAGE_CONTAINER_NAME', value: mediaContainer.name },
          { name: 'ELEVENLABS_API_KEY', secretRef: 'elevenlabs-api-key' },
          { name: 'ELEVENLABS_AGENT_ID', value: elevenlabsAgentId },
          { name: 'PUBLIC_SITE_URL', value: publicSiteUrl },
          // Microsoft Entra ID SSO — consumed by strapi-plugin-sso. If
          // ssoEnabled is false (any of the 3 GitHub secrets unset on this
          // env), we still inject empty values so the plugin gracefully
          // disables itself rather than crashing on missing env vars.
          { name: 'AZUREAD_TENANT_ID', value: azureadTenantId },
          { name: 'AZUREAD_OAUTH_CLIENT_ID', value: azureadClientId },
          ...(ssoEnabled
            ? [{ name: 'AZUREAD_OAUTH_CLIENT_SECRET', secretRef: 'azuread-client-secret' }]
            : [{ name: 'AZUREAD_OAUTH_CLIENT_SECRET', value: '' }]),
          { name: 'AZUREAD_SCOPE', value: azureadScope },
          // Redirect URI is derived from the public site URL so we don't
          // need a separate GitHub secret per env. The Entra app registration
          // must include this URL in its "Redirect URIs" allow-list.
          { name: 'AZUREAD_OAUTH_REDIRECT_URI', value: `${publicSiteUrl}/strapi-plugin-sso/azuread/callback` },
        ],
        volumeMounts: [
          {
            volumeName: 'persistent-data',
            mountPath: '/data',
          },
        ],
        probes: [
          {
            type: azure.app.Type.Liveness,
            httpGet: { path: '/', port: 80 },
            initialDelaySeconds: 60,
            periodSeconds: 30,
            failureThreshold: 3,
          },
          {
            type: azure.app.Type.Startup,
            httpGet: { path: '/', port: 80 },
            initialDelaySeconds: 20,
            periodSeconds: 5,
            failureThreshold: 30,
          },
        ],
      },
    ],
    scale: {
      minReplicas: 1,
      maxReplicas: 1,
    },
    volumes: [
      {
        name: 'persistent-data',
        storageName: 'persistent-data',
        storageType: azure.app.StorageType.AzureFile,
      },
    ],
  },
});


// ── Outputs ──────────────────────────────────────────────────
export const resourceGroupName = rg.name;
export const appUrl = pulumi.interpolate`https://${app.latestRevisionFqdn}`;
export const containerAppFqdn = app.configuration.apply((c) => c?.ingress?.fqdn ?? '');
export const customDomainVerificationId = app.customDomainVerificationId;
// Static public IP of the Container Apps Environment — stable for the
// lifetime of the env. Use this for Cloudflare A records at the apex
// or subdomains (A record sidesteps CNAME flattening issues with
// Cloudflare's proxy).
export const containerEnvStaticIp = containerEnv.staticIp;
export const postgresHost = dbServer.fullyQualifiedDomainName;
export const containerRegistryLoginServer = registry.loginServer;
