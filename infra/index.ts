import * as pulumi from '@pulumi/pulumi';
import * as azure from '@pulumi/azure-native';
import * as docker from '@pulumi/docker';
import * as random from '@pulumi/random';

const location = azure.config.location ?? 'southeastasia';
const projectName = 'amclub';

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
const rg = new azure.resources.ResourceGroup(`${projectName}-rg`, {
  location,
});

// ── Container Registry ───────────────────────────────────────
const registry = new azure.containerregistry.Registry(`${projectName}acr`, {
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
const dbServer = new azure.dbforpostgresql.Server(`${projectName}-pg`, {
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
  resourceGroupName: rg.name,
  serverName: dbServer.name,
  startIpAddress: '0.0.0.0',
  endIpAddress: '0.0.0.0',
});

const database = new azure.dbforpostgresql.Database(`${projectName}-db`, {
  resourceGroupName: rg.name,
  serverName: dbServer.name,
  charset: 'UTF8',
  collation: 'en_US.utf8',
});

// ── Storage Account (Azure Files for uploads) ────────────────
const storage = new azure.storage.StorageAccount(`${projectName}data`, {
  resourceGroupName: rg.name,
  location: rg.location,
  sku: { name: azure.storage.SkuName.Standard_LRS },
  kind: azure.storage.Kind.StorageV2,
});

const dataShare = new azure.storage.FileShare(`${projectName}-data`, {
  resourceGroupName: rg.name,
  accountName: storage.name,
  shareQuota: 5,
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

// ── Log Analytics ────────────────────────────────────────────
const logAnalytics = new azure.operationalinsights.Workspace(
  `${projectName}-logs`,
  {
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

// ── Build Docker image ───────────────────────────────────────
const appImage = new docker.Image(`${projectName}-app-image`, {
  imageName: pulumi.interpolate`${registry.loginServer}/${projectName}-app:latest`,
  build: {
    context: '..',
    dockerfile: '../Dockerfile',
    platform: 'linux/amd64',
  },
  registry: {
    server: registry.loginServer,
    username: registryUsername,
    password: registryPassword,
  },
});

// ── Container App (Nginx + Strapi) ───────────────────────────
const appKeys = pulumi.interpolate`${appKey1.result},${appKey2.result}`;

const app = new azure.app.ContainerApp(`${projectName}-app`, {
  resourceGroupName: rg.name,
  location: rg.location,
  managedEnvironmentId: containerEnv.id,
  configuration: {
    ingress: {
      external: true,
      targetPort: 80,
      transport: azure.app.IngressTransportMethod.Auto,
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
    ],
  },
  template: {
    containers: [
      {
        name: 'app',
        image: appImage.repoDigest,
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
export const postgresHost = dbServer.fullyQualifiedDomainName;
export const containerRegistryLoginServer = registry.loginServer;
