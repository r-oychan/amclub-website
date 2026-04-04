# Azure Deployment Architecture

Reference for generating Azure infrastructure with Pulumi (TypeScript).

## Architecture Diagram

```
                    ┌─────────────────┐
                    │  Azure Front    │
                    │  Door / CDN     │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  Container App  │
                    │  Environment    │
                    ├─────────────────┤
                    │ ┌─────────────┐ │
                    │ │  Frontend   │ │  ← nginx serving React build
                    │ │  Container  │ │
                    │ └─────────────┘ │
                    │ ┌─────────────┐ │
                    │ │  CMS        │ │  ← Strapi Node.js
                    │ │  Container  │ │
                    │ └──────┬──────┘ │
                    └────────┼────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
     ┌────────▼───────┐ ┌───▼──────┐ ┌────▼──────┐
     │  PostgreSQL     │ │  Blob    │ │  Container│
     │  Flexible       │ │  Storage │ │  Registry │
     │  Server         │ │          │ │  (ACR)    │
     └────────────────┘ └──────────┘ └───────────┘
```

## Resource Definitions

### Resource Group

```typescript
import * as azure from '@pulumi/azure-native';

const resourceGroup = new azure.resources.ResourceGroup('rg', {
  resourceGroupName: `rg-${projectName}-${stack}`,
  location: config.get('location') || 'eastus',
});
```

### Container Registry (ACR)

```typescript
const registry = new azure.containerregistry.Registry('acr', {
  resourceGroupName: resourceGroup.name,
  registryName: `${projectName}${stack}acr`,
  sku: { name: 'Basic' },
  adminUserEnabled: true,
});

// Export credentials for CI/CD
const credentials = azure.containerregistry.listRegistryCredentials({
  resourceGroupName: resourceGroup.name,
  registryName: registry.name,
});
```

### Container App Environment

```typescript
const logAnalytics = new azure.operationalinsights.Workspace('logs', {
  resourceGroupName: resourceGroup.name,
  workspaceName: `log-${projectName}-${stack}`,
  sku: { name: 'PerGB2018' },
  retentionInDays: 30,
});

const environment = new azure.app.ManagedEnvironment('env', {
  resourceGroupName: resourceGroup.name,
  environmentName: `cae-${projectName}-${stack}`,
  appLogsConfiguration: {
    destination: 'log-analytics',
    logAnalyticsConfiguration: {
      customerId: logAnalytics.customerId,
      sharedKey: logAnalytics.sharedKeys.primarySharedKey,
    },
  },
});
```

### CMS Container App

```typescript
const cmsApp = new azure.app.ContainerApp('cms', {
  resourceGroupName: resourceGroup.name,
  containerAppName: `ca-${projectName}-cms-${stack}`,
  managedEnvironmentId: environment.id,
  configuration: {
    ingress: {
      external: true,
      targetPort: 1337,
      transport: 'auto',
    },
    registries: [{
      server: registry.loginServer,
      username: credentials.username,
      passwordSecretRef: 'acr-password',
    }],
    secrets: [
      { name: 'acr-password', value: credentials.passwords[0].value },
      { name: 'database-password', value: config.requireSecret('dbPassword') },
      { name: 'app-keys', value: config.requireSecret('appKeys') },
      { name: 'api-token-salt', value: config.requireSecret('apiTokenSalt') },
      { name: 'admin-jwt-secret', value: config.requireSecret('adminJwtSecret') },
      { name: 'jwt-secret', value: config.requireSecret('jwtSecret') },
      { name: 'transfer-token-salt', value: config.requireSecret('transferTokenSalt') },
    ],
  },
  template: {
    containers: [{
      name: 'cms',
      image: pulumi.interpolate`${registry.loginServer}/${projectName}-cms:latest`,
      resources: {
        cpu: stack === 'production' ? 1.0 : 0.5,
        memory: stack === 'production' ? '2Gi' : '1Gi',
      },
      env: [
        { name: 'NODE_ENV', value: 'production' },
        { name: 'DATABASE_CLIENT', value: 'postgres' },
        { name: 'DATABASE_HOST', value: dbServer.fullyQualifiedDomainName },
        { name: 'DATABASE_PORT', value: '5432' },
        { name: 'DATABASE_NAME', value: 'strapi' },
        { name: 'DATABASE_USERNAME', value: config.require('dbUsername') },
        { name: 'DATABASE_PASSWORD', secretRef: 'database-password' },
        { name: 'DATABASE_SSL', value: 'true' },
        { name: 'APP_KEYS', secretRef: 'app-keys' },
        { name: 'API_TOKEN_SALT', secretRef: 'api-token-salt' },
        { name: 'ADMIN_JWT_SECRET', secretRef: 'admin-jwt-secret' },
        { name: 'JWT_SECRET', secretRef: 'jwt-secret' },
        { name: 'TRANSFER_TOKEN_SALT', secretRef: 'transfer-token-salt' },
      ],
      probes: [{
        type: 'Liveness',
        httpGet: { path: '/_health', port: 1337 },
        periodSeconds: 30,
      }],
    }],
    scale: {
      minReplicas: stack === 'production' ? 1 : 0,
      maxReplicas: stack === 'production' ? 3 : 1,
    },
  },
});
```

### Frontend Container App

```typescript
const frontendApp = new azure.app.ContainerApp('frontend', {
  resourceGroupName: resourceGroup.name,
  containerAppName: `ca-${projectName}-frontend-${stack}`,
  managedEnvironmentId: environment.id,
  configuration: {
    ingress: {
      external: true,
      targetPort: 80,
      transport: 'auto',
    },
    registries: [{
      server: registry.loginServer,
      username: credentials.username,
      passwordSecretRef: 'acr-password',
    }],
    secrets: [
      { name: 'acr-password', value: credentials.passwords[0].value },
    ],
  },
  template: {
    containers: [{
      name: 'frontend',
      image: pulumi.interpolate`${registry.loginServer}/${projectName}-frontend:latest`,
      resources: {
        cpu: 0.25,
        memory: '0.5Gi',
      },
      probes: [{
        type: 'Liveness',
        httpGet: { path: '/', port: 80 },
        periodSeconds: 30,
      }],
    }],
    scale: {
      minReplicas: stack === 'production' ? 1 : 0,
      maxReplicas: stack === 'production' ? 3 : 1,
    },
  },
});
```

### PostgreSQL Flexible Server

```typescript
const dbServer = new azure.dbforpostgresql.Server('db', {
  resourceGroupName: resourceGroup.name,
  serverName: `psql-${projectName}-${stack}`,
  version: '16',
  administratorLogin: config.require('dbUsername'),
  administratorLoginPassword: config.requireSecret('dbPassword'),
  storage: {
    storageSizeGB: stack === 'production' ? 64 : 32,
  },
  sku: {
    name: stack === 'production' ? 'Standard_D2ds_v4' : 'Standard_B1ms',
    tier: stack === 'production' ? 'GeneralPurpose' : 'Burstable',
  },
  highAvailability: {
    mode: stack === 'production' ? 'ZoneRedundant' : 'Disabled',
  },
});

const db = new azure.dbforpostgresql.Database('strapidb', {
  resourceGroupName: resourceGroup.name,
  serverName: dbServer.name,
  databaseName: 'strapi',
  charset: 'UTF8',
});

// Allow Azure services to connect
const firewallRule = new azure.dbforpostgresql.FirewallRule('allow-azure', {
  resourceGroupName: resourceGroup.name,
  serverName: dbServer.name,
  firewallRuleName: 'AllowAzureServices',
  startIpAddress: '0.0.0.0',
  endIpAddress: '0.0.0.0',
});
```

### Blob Storage

```typescript
const storageAccount = new azure.storage.StorageAccount('storage', {
  resourceGroupName: resourceGroup.name,
  accountName: `${projectName}${stack}storage`,
  kind: 'StorageV2',
  sku: { name: 'Standard_LRS' },
  allowBlobPublicAccess: true,
});

const uploadsContainer = new azure.storage.BlobContainer('uploads', {
  resourceGroupName: resourceGroup.name,
  accountName: storageAccount.name,
  containerName: 'uploads',
  publicAccess: 'Blob',
});
```

### Stack Outputs

```typescript
export const cmsUrl = pulumi.interpolate`https://${cmsApp.configuration.ingress.fqdn}`;
export const frontendUrl = pulumi.interpolate`https://${frontendApp.configuration.ingress.fqdn}`;
export const acrLoginServer = registry.loginServer;
export const dbHost = dbServer.fullyQualifiedDomainName;
export const storageAccountName = storageAccount.name;
```

## Cost Estimation Guidance

| Resource | Staging (approx/month) | Production (approx/month) |
|----------|----------------------|--------------------------|
| Container Apps | $10–30 (scale to 0) | $50–150 (always on) |
| PostgreSQL Burstable B1ms | $13 | — |
| PostgreSQL GP D2ds_v4 | — | $130 |
| Blob Storage | $1–5 | $5–20 |
| Front Door | $35 | $35 |
| Container Registry Basic | $5 | $5 |
| **Estimated Total** | **$65–90** | **$225–340** |

## Networking Considerations

For production, consider adding:
- VNet integration for Container Apps
- Private endpoints for PostgreSQL (disable public access)
- Private endpoints for Blob Storage
- Network Security Groups

These add complexity and cost. For MVP / staging, public endpoints with
firewall rules are acceptable.
