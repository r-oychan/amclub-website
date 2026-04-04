# AWS Deployment Architecture

Reference for generating AWS infrastructure with Pulumi (TypeScript).

## Architecture Diagram

```
                    ┌─────────────────┐
                    │   CloudFront    │
                    │   Distribution  │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  Application    │
                    │  Load Balancer  │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │   ECS Cluster   │
                    │   (Fargate)     │
                    ├─────────────────┤
                    │ ┌─────────────┐ │
                    │ │  Frontend   │ │  ← nginx serving React
                    │ │  Service    │ │
                    │ └─────────────┘ │
                    │ ┌─────────────┐ │
                    │ │  CMS        │ │  ← Strapi Node.js
                    │ │  Service    │ │
                    │ └──────┬──────┘ │
                    └────────┼────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
     ┌────────▼───────┐ ┌───▼──────┐ ┌────▼──────┐
     │  RDS            │ │  S3      │ │  ECR      │
     │  PostgreSQL     │ │  Bucket  │ │  Registry │
     └────────────────┘ └──────────┘ └───────────┘
```

## Resource Definitions

### VPC and Networking

```typescript
import * as aws from '@pulumi/aws';
import * as awsx from '@pulumi/awsx';

const vpc = new awsx.ec2.Vpc('vpc', {
  cidrBlock: '10.0.0.0/16',
  numberOfAvailabilityZones: 2,
  subnetStrategy: 'Auto',
  tags: { Name: `${projectName}-${stack}` },
});
```

### ECR Repositories

```typescript
const cmsRepo = new aws.ecr.Repository('cms-repo', {
  name: `${projectName}-cms`,
  imageTagMutability: 'MUTABLE',
  imageScanningConfiguration: { scanOnPush: true },
  forceDelete: stack !== 'production',
});

const frontendRepo = new aws.ecr.Repository('frontend-repo', {
  name: `${projectName}-frontend`,
  imageTagMutability: 'MUTABLE',
  imageScanningConfiguration: { scanOnPush: true },
  forceDelete: stack !== 'production',
});

// Lifecycle policy to keep only last 10 images
const lifecyclePolicy = new aws.ecr.LifecyclePolicy('cms-lifecycle', {
  repository: cmsRepo.name,
  policy: JSON.stringify({
    rules: [{
      rulePriority: 1,
      description: 'Keep last 10 images',
      selection: {
        tagStatus: 'any',
        countType: 'imageCountMoreThan',
        countNumber: 10,
      },
      action: { type: 'expire' },
    }],
  }),
});
```

### ECS Cluster and Services

```typescript
const cluster = new aws.ecs.Cluster('cluster', {
  name: `${projectName}-${stack}`,
  settings: [{
    name: 'containerInsights',
    value: stack === 'production' ? 'enabled' : 'disabled',
  }],
});

// CMS Task Definition
const cmsTaskDef = new awsx.ecs.FargateTaskDefinition('cms-task', {
  family: `${projectName}-cms-${stack}`,
  cpu: stack === 'production' ? '1024' : '512',
  memory: stack === 'production' ? '2048' : '1024',
  container: {
    name: 'cms',
    image: pulumi.interpolate`${cmsRepo.repositoryUrl}:latest`,
    portMappings: [{ containerPort: 1337 }],
    environment: [
      { name: 'NODE_ENV', value: 'production' },
      { name: 'DATABASE_CLIENT', value: 'postgres' },
      { name: 'DATABASE_HOST', value: dbInstance.address },
      { name: 'DATABASE_PORT', value: '5432' },
      { name: 'DATABASE_NAME', value: 'strapi' },
      { name: 'DATABASE_SSL', value: 'true' },
    ],
    secrets: [
      { name: 'DATABASE_USERNAME', valueFrom: dbUsernameSecret.arn },
      { name: 'DATABASE_PASSWORD', valueFrom: dbPasswordSecret.arn },
      { name: 'APP_KEYS', valueFrom: appKeysSecret.arn },
      { name: 'API_TOKEN_SALT', valueFrom: apiTokenSaltSecret.arn },
      { name: 'ADMIN_JWT_SECRET', valueFrom: adminJwtSecret.arn },
      { name: 'JWT_SECRET', valueFrom: jwtSecret.arn },
    ],
    healthCheck: {
      command: ['CMD-SHELL', 'curl -f http://localhost:1337/_health || exit 1'],
      interval: 30,
      timeout: 5,
      retries: 3,
    },
    logConfiguration: {
      logDriver: 'awslogs',
      options: {
        'awslogs-group': `/ecs/${projectName}-cms-${stack}`,
        'awslogs-region': aws.config.region!,
        'awslogs-stream-prefix': 'ecs',
      },
    },
  },
});

// CMS Service
const cmsService = new awsx.ecs.FargateService('cms-service', {
  cluster: cluster.arn,
  taskDefinition: cmsTaskDef.taskDefinition.arn,
  desiredCount: stack === 'production' ? 2 : 1,
  networkConfiguration: {
    subnets: vpc.privateSubnetIds,
    securityGroups: [cmsSecurityGroup.id],
  },
  loadBalancers: [{
    targetGroupArn: cmsTargetGroup.arn,
    containerName: 'cms',
    containerPort: 1337,
  }],
});

// Frontend Task Definition
const frontendTaskDef = new awsx.ecs.FargateTaskDefinition('frontend-task', {
  family: `${projectName}-frontend-${stack}`,
  cpu: '256',
  memory: '512',
  container: {
    name: 'frontend',
    image: pulumi.interpolate`${frontendRepo.repositoryUrl}:latest`,
    portMappings: [{ containerPort: 80 }],
    healthCheck: {
      command: ['CMD-SHELL', 'curl -f http://localhost:80/ || exit 1'],
      interval: 30,
      timeout: 5,
      retries: 3,
    },
  },
});

// Frontend Service
const frontendService = new awsx.ecs.FargateService('frontend-service', {
  cluster: cluster.arn,
  taskDefinition: frontendTaskDef.taskDefinition.arn,
  desiredCount: stack === 'production' ? 2 : 1,
  networkConfiguration: {
    subnets: vpc.privateSubnetIds,
    securityGroups: [frontendSecurityGroup.id],
  },
  loadBalancers: [{
    targetGroupArn: frontendTargetGroup.arn,
    containerName: 'frontend',
    containerPort: 80,
  }],
});
```

### RDS PostgreSQL

```typescript
const dbSubnetGroup = new aws.rds.SubnetGroup('db-subnets', {
  name: `${projectName}-${stack}-db`,
  subnetIds: vpc.privateSubnetIds,
});

const dbInstance = new aws.rds.Instance('db', {
  identifier: `${projectName}-${stack}`,
  engine: 'postgres',
  engineVersion: '16',
  instanceClass: stack === 'production' ? 'db.t3.medium' : 'db.t3.micro',
  allocatedStorage: stack === 'production' ? 50 : 20,
  dbName: 'strapi',
  username: config.require('dbUsername'),
  password: config.requireSecret('dbPassword'),
  dbSubnetGroupName: dbSubnetGroup.name,
  vpcSecurityGroupIds: [dbSecurityGroup.id],
  multiAz: stack === 'production',
  backupRetentionPeriod: stack === 'production' ? 7 : 1,
  skipFinalSnapshot: stack !== 'production',
  finalSnapshotIdentifier: stack === 'production'
    ? `${projectName}-final-snapshot`
    : undefined,
});
```

### S3 Bucket for Media

```typescript
const uploadsBucket = new aws.s3.BucketV2('uploads', {
  bucket: `${projectName}-${stack}-uploads`,
  forceDestroy: stack !== 'production',
});

const uploadsBucketPublicAccess = new aws.s3.BucketPublicAccessBlock('uploads-public', {
  bucket: uploadsBucket.id,
  blockPublicAcls: false,
  blockPublicPolicy: false,
  ignorePublicAcls: false,
  restrictPublicBuckets: false,
});

const uploadsBucketPolicy = new aws.s3.BucketPolicy('uploads-policy', {
  bucket: uploadsBucket.id,
  policy: pulumi.jsonStringify({
    Version: '2012-10-17',
    Statement: [{
      Sid: 'PublicReadGetObject',
      Effect: 'Allow',
      Principal: '*',
      Action: 's3:GetObject',
      Resource: pulumi.interpolate`${uploadsBucket.arn}/*`,
    }],
  }),
});
```

### CloudFront Distribution

```typescript
const cdn = new aws.cloudfront.Distribution('cdn', {
  enabled: true,
  origins: [{
    domainName: albDnsName,
    originId: 'alb',
    customOriginConfig: {
      httpPort: 80,
      httpsPort: 443,
      originProtocolPolicy: 'https-only',
      originSslProtocols: ['TLSv1.2'],
    },
  }],
  defaultCacheBehavior: {
    targetOriginId: 'alb',
    viewerProtocolPolicy: 'redirect-to-https',
    allowedMethods: ['GET', 'HEAD', 'OPTIONS'],
    cachedMethods: ['GET', 'HEAD'],
    forwardedValues: {
      queryString: false,
      cookies: { forward: 'none' },
    },
    minTtl: 0,
    defaultTtl: 86400,
    maxTtl: 31536000,
    compress: true,
  },
  restrictions: {
    geoRestriction: { restrictionType: 'none' },
  },
  viewerCertificate: {
    cloudfrontDefaultCertificate: true,
  },
});
```

### Application Load Balancer

```typescript
const alb = new aws.lb.LoadBalancer('alb', {
  name: `${projectName}-${stack}`,
  internal: false,
  loadBalancerType: 'application',
  securityGroups: [albSecurityGroup.id],
  subnets: vpc.publicSubnetIds,
});

const frontendTargetGroup = new aws.lb.TargetGroup('frontend-tg', {
  name: `${projectName}-fe-${stack}`,
  port: 80,
  protocol: 'HTTP',
  targetType: 'ip',
  vpcId: vpc.vpcId,
  healthCheck: {
    path: '/',
    healthyThreshold: 2,
    unhealthyThreshold: 5,
  },
});

const cmsTargetGroup = new aws.lb.TargetGroup('cms-tg', {
  name: `${projectName}-cms-${stack}`,
  port: 1337,
  protocol: 'HTTP',
  targetType: 'ip',
  vpcId: vpc.vpcId,
  healthCheck: {
    path: '/_health',
    healthyThreshold: 2,
    unhealthyThreshold: 5,
  },
});

// Listener with path-based routing
const listener = new aws.lb.Listener('https', {
  loadBalancerArn: alb.arn,
  port: 443,
  protocol: 'HTTPS',
  certificateArn: certificate.arn,
  defaultActions: [{
    type: 'forward',
    targetGroupArn: frontendTargetGroup.arn,
  }],
});

// Route /api/* to CMS
const cmsRule = new aws.lb.ListenerRule('cms-rule', {
  listenerArn: listener.arn,
  priority: 100,
  conditions: [{ pathPattern: { values: ['/api/*', '/admin/*', '/uploads/*'] } }],
  actions: [{ type: 'forward', targetGroupArn: cmsTargetGroup.arn }],
});
```

### Secrets Manager

```typescript
const dbPasswordSecret = new aws.secretsmanager.Secret('db-password', {
  name: `${projectName}/${stack}/db-password`,
});

const dbPasswordVersion = new aws.secretsmanager.SecretVersion('db-password-v', {
  secretId: dbPasswordSecret.id,
  secretString: config.requireSecret('dbPassword'),
});
```

### Stack Outputs

```typescript
export const clusterName = cluster.name;
export const cmsRepoUrl = cmsRepo.repositoryUrl;
export const frontendRepoUrl = frontendRepo.repositoryUrl;
export const albDnsName = alb.dnsName;
export const cdnDomainName = cdn.domainName;
export const dbEndpoint = dbInstance.endpoint;
export const uploadsBucketName = uploadsBucket.bucket;
```

## Cost Estimation Guidance

| Resource | Staging (approx/month) | Production (approx/month) |
|----------|----------------------|--------------------------|
| ECS Fargate (2 tasks) | $15–30 | $60–120 |
| RDS t3.micro | $15 | — |
| RDS t3.medium + Multi-AZ | — | $70–140 |
| S3 | $1–5 | $5–20 |
| CloudFront | $1–10 | $10–50 |
| ALB | $16 | $16 |
| NAT Gateway | $32 | $32 |
| **Estimated Total** | **$80–110** | **$195–380** |

Note: NAT Gateway cost is significant. For staging, consider using public
subnets with security groups instead of private subnets + NAT.

## Security Groups

```typescript
const albSecurityGroup = new aws.ec2.SecurityGroup('alb-sg', {
  vpcId: vpc.vpcId,
  ingress: [
    { protocol: 'tcp', fromPort: 80, toPort: 80, cidrBlocks: ['0.0.0.0/0'] },
    { protocol: 'tcp', fromPort: 443, toPort: 443, cidrBlocks: ['0.0.0.0/0'] },
  ],
  egress: [
    { protocol: '-1', fromPort: 0, toPort: 0, cidrBlocks: ['0.0.0.0/0'] },
  ],
});

const cmsSecurityGroup = new aws.ec2.SecurityGroup('cms-sg', {
  vpcId: vpc.vpcId,
  ingress: [
    { protocol: 'tcp', fromPort: 1337, toPort: 1337, securityGroups: [albSecurityGroup.id] },
  ],
  egress: [
    { protocol: '-1', fromPort: 0, toPort: 0, cidrBlocks: ['0.0.0.0/0'] },
  ],
});

const dbSecurityGroup = new aws.ec2.SecurityGroup('db-sg', {
  vpcId: vpc.vpcId,
  ingress: [
    { protocol: 'tcp', fromPort: 5432, toPort: 5432, securityGroups: [cmsSecurityGroup.id] },
  ],
});
```
