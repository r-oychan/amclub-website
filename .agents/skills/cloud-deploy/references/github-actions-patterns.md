# GitHub Actions CI/CD Patterns

Reference for generating GitHub Actions workflow files.

## CI Workflow (ci.yml)

Runs on every pull request to main. Validates code quality and builds.

```yaml
name: CI

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

jobs:
  lint-and-typecheck:
    name: Lint & Typecheck
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
          cache-dependency-path: |
            frontend/package-lock.json
            cms/package-lock.json

      - name: Install frontend dependencies
        run: npm ci
        working-directory: frontend

      - name: Lint frontend
        run: npm run lint
        working-directory: frontend

      - name: Typecheck frontend
        run: npm run typecheck
        working-directory: frontend

  build-frontend:
    name: Build Frontend
    runs-on: ubuntu-latest
    needs: lint-and-typecheck
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
          cache-dependency-path: frontend/package-lock.json

      - name: Install dependencies
        run: npm ci
        working-directory: frontend

      - name: Build
        run: npm run build
        working-directory: frontend
        env:
          VITE_API_URL: ${{ vars.VITE_API_URL || 'http://localhost:1337' }}

      - name: Upload build artifact
        uses: actions/upload-artifact@v4
        with:
          name: frontend-build
          path: frontend/dist
          retention-days: 1

  build-cms:
    name: Build CMS
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
          cache-dependency-path: cms/package-lock.json

      - name: Install dependencies
        run: npm ci
        working-directory: cms

      - name: Build
        run: npm run build
        working-directory: cms
```

## Deploy Staging Workflow (Azure)

Auto-deploys on merge to main.

```yaml
name: Deploy Staging

on:
  push:
    branches: [main]

concurrency:
  group: deploy-staging
  cancel-in-progress: false

env:
  REGISTRY: ${{ secrets.ACR_LOGIN_SERVER }}
  CMS_IMAGE: ${{ secrets.ACR_LOGIN_SERVER }}/cms
  FRONTEND_IMAGE: ${{ secrets.ACR_LOGIN_SERVER }}/frontend

jobs:
  build-and-push:
    name: Build & Push Images
    runs-on: ubuntu-latest
    outputs:
      image-tag: ${{ github.sha }}
    steps:
      - uses: actions/checkout@v4

      - name: Login to ACR
        uses: azure/docker-login@v2
        with:
          login-server: ${{ secrets.ACR_LOGIN_SERVER }}
          username: ${{ secrets.ACR_USERNAME }}
          password: ${{ secrets.ACR_PASSWORD }}

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Build and push CMS image
        uses: docker/build-push-action@v6
        with:
          context: ./cms
          file: ./Dockerfile.cms
          target: production
          push: true
          tags: |
            ${{ env.CMS_IMAGE }}:${{ github.sha }}
            ${{ env.CMS_IMAGE }}:latest
          cache-from: type=gha,scope=cms
          cache-to: type=gha,mode=max,scope=cms

      - name: Build and push Frontend image
        uses: docker/build-push-action@v6
        with:
          context: ./frontend
          file: ./Dockerfile.frontend
          target: production
          push: true
          tags: |
            ${{ env.FRONTEND_IMAGE }}:${{ github.sha }}
            ${{ env.FRONTEND_IMAGE }}:latest
          build-args: |
            VITE_API_URL=${{ vars.STAGING_API_URL }}
          cache-from: type=gha,scope=frontend
          cache-to: type=gha,mode=max,scope=frontend

  deploy-infra:
    name: Deploy Infrastructure
    runs-on: ubuntu-latest
    needs: build-and-push
    environment: staging
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
          cache-dependency-path: infra/package-lock.json

      - name: Install Pulumi dependencies
        run: npm ci
        working-directory: infra

      - uses: pulumi/actions@v6
        with:
          command: up
          stack-name: staging
          work-dir: infra
        env:
          PULUMI_ACCESS_TOKEN: ${{ secrets.PULUMI_ACCESS_TOKEN }}
          ARM_CLIENT_ID: ${{ secrets.AZURE_CLIENT_ID }}
          ARM_CLIENT_SECRET: ${{ secrets.AZURE_CLIENT_SECRET }}
          ARM_TENANT_ID: ${{ secrets.AZURE_TENANT_ID }}
          ARM_SUBSCRIPTION_ID: ${{ secrets.AZURE_SUBSCRIPTION_ID }}

  post-deploy:
    name: Post-Deploy Check
    runs-on: ubuntu-latest
    needs: deploy-infra
    steps:
      - name: Wait for deployment
        run: sleep 30

      - name: Health check
        run: |
          STATUS=$(curl -s -o /dev/null -w "%{http_code}" ${{ vars.STAGING_FRONTEND_URL }})
          if [ "$STATUS" != "200" ]; then
            echo "Health check failed with status $STATUS"
            exit 1
          fi
          echo "Health check passed"
```

## Deploy Staging Workflow (AWS)

```yaml
name: Deploy Staging

on:
  push:
    branches: [main]

concurrency:
  group: deploy-staging
  cancel-in-progress: false

jobs:
  build-and-push:
    name: Build & Push Images
    runs-on: ubuntu-latest
    permissions:
      id-token: write
      contents: read
    outputs:
      image-tag: ${{ github.sha }}
    steps:
      - uses: actions/checkout@v4

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
          aws-region: ${{ vars.AWS_REGION }}

      - name: Login to ECR
        id: ecr-login
        uses: aws-actions/amazon-ecr-login@v2

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Build and push CMS image
        uses: docker/build-push-action@v6
        with:
          context: ./cms
          file: ./Dockerfile.cms
          target: production
          push: true
          tags: |
            ${{ steps.ecr-login.outputs.registry }}/cms:${{ github.sha }}
            ${{ steps.ecr-login.outputs.registry }}/cms:latest
          cache-from: type=gha,scope=cms
          cache-to: type=gha,mode=max,scope=cms

      - name: Build and push Frontend image
        uses: docker/build-push-action@v6
        with:
          context: ./frontend
          file: ./Dockerfile.frontend
          target: production
          push: true
          tags: |
            ${{ steps.ecr-login.outputs.registry }}/frontend:${{ github.sha }}
            ${{ steps.ecr-login.outputs.registry }}/frontend:latest
          build-args: |
            VITE_API_URL=${{ vars.STAGING_API_URL }}
          cache-from: type=gha,scope=frontend
          cache-to: type=gha,mode=max,scope=frontend

  deploy-infra:
    name: Deploy Infrastructure
    runs-on: ubuntu-latest
    needs: build-and-push
    environment: staging
    permissions:
      id-token: write
      contents: read
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
          cache-dependency-path: infra/package-lock.json

      - name: Install Pulumi dependencies
        run: npm ci
        working-directory: infra

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
          aws-region: ${{ vars.AWS_REGION }}

      - uses: pulumi/actions@v6
        with:
          command: up
          stack-name: staging
          work-dir: infra
        env:
          PULUMI_ACCESS_TOKEN: ${{ secrets.PULUMI_ACCESS_TOKEN }}
```

## Deploy Production Workflow

Manual trigger with confirmation. Same for both Azure and AWS (only secrets differ).

```yaml
name: Deploy Production

on:
  workflow_dispatch:
    inputs:
      image-tag:
        description: 'Image tag to deploy (git SHA from staging)'
        required: true
        type: string
      confirm:
        description: 'Type "deploy-production" to confirm'
        required: true
        type: string

jobs:
  validate:
    name: Validate Input
    runs-on: ubuntu-latest
    steps:
      - name: Check confirmation
        if: github.event.inputs.confirm != 'deploy-production'
        run: |
          echo "Confirmation failed. You must type 'deploy-production' to proceed."
          exit 1

  deploy:
    name: Deploy to Production
    runs-on: ubuntu-latest
    needs: validate
    environment: production  # Requires approval via GitHub environment protection
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
          cache-dependency-path: infra/package-lock.json

      - name: Install Pulumi dependencies
        run: npm ci
        working-directory: infra

      # Azure credentials (use Azure section) or AWS credentials (use AWS section)
      - uses: pulumi/actions@v6
        with:
          command: up
          stack-name: production
          work-dir: infra
        env:
          PULUMI_ACCESS_TOKEN: ${{ secrets.PULUMI_ACCESS_TOKEN }}
          # Add cloud-specific env vars here

  smoke-test:
    name: Production Smoke Test
    runs-on: ubuntu-latest
    needs: deploy
    steps:
      - name: Wait for rollout
        run: sleep 60

      - name: Health check frontend
        run: |
          STATUS=$(curl -s -o /dev/null -w "%{http_code}" ${{ vars.PRODUCTION_FRONTEND_URL }})
          if [ "$STATUS" != "200" ]; then
            echo "Frontend health check failed: $STATUS"
            exit 1
          fi

      - name: Health check CMS
        run: |
          STATUS=$(curl -s -o /dev/null -w "%{http_code}" ${{ vars.PRODUCTION_CMS_URL }}/_health)
          if [ "$STATUS" != "200" ]; then
            echo "CMS health check failed: $STATUS"
            exit 1
          fi

      - name: Report success
        run: echo "Production deployment verified successfully"
```

## Required GitHub Secrets

### Azure

| Secret | Description |
|--------|-------------|
| `ACR_LOGIN_SERVER` | Azure Container Registry login server (e.g., `myacr.azurecr.io`) |
| `ACR_USERNAME` | ACR admin username |
| `ACR_PASSWORD` | ACR admin password |
| `AZURE_CLIENT_ID` | Service principal client ID |
| `AZURE_CLIENT_SECRET` | Service principal secret |
| `AZURE_TENANT_ID` | Azure AD tenant ID |
| `AZURE_SUBSCRIPTION_ID` | Azure subscription ID |
| `PULUMI_ACCESS_TOKEN` | Pulumi Cloud access token |

### AWS

| Secret | Description |
|--------|-------------|
| `AWS_ROLE_ARN` | IAM role ARN for OIDC authentication |
| `PULUMI_ACCESS_TOKEN` | Pulumi Cloud access token |

### GitHub Variables (not secrets)

| Variable | Description | Example |
|----------|-------------|---------|
| `STAGING_API_URL` | CMS URL for staging frontend build | `https://cms-staging.example.com` |
| `STAGING_FRONTEND_URL` | Staging frontend URL for health checks | `https://staging.example.com` |
| `PRODUCTION_FRONTEND_URL` | Production frontend URL | `https://example.com` |
| `PRODUCTION_CMS_URL` | Production CMS URL | `https://cms.example.com` |
| `AWS_REGION` | AWS region (AWS only) | `us-east-1` |

## Cache Strategies

### npm Cache

```yaml
- uses: actions/setup-node@v4
  with:
    node-version: 20
    cache: npm
    cache-dependency-path: frontend/package-lock.json
```

### Docker Layer Cache (GitHub Actions Cache)

```yaml
- uses: docker/build-push-action@v6
  with:
    cache-from: type=gha,scope=cms
    cache-to: type=gha,mode=max,scope=cms
```

This uses GitHub Actions cache backend for Docker BuildKit, which is faster
than pulling from the registry for cache.

## Environment Protection Rules

Configure in GitHub Settings > Environments:

- **staging:** No protection needed (auto-deploy on merge)
- **production:**
  - Required reviewers (at least 1 team member)
  - Wait timer (optional, e.g., 5 minutes)
  - Deployment branches: `main` only
