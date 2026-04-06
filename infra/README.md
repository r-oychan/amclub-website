# Infrastructure — AMClub Website

All-in-one Azure deployment: PostgreSQL + Strapi CMS + React frontend in a single container.

## Architecture

```
┌─────────────────────────────────────────────────┐
│               Azure Container Apps              │
│  ┌───────────────────────────────────────────┐  │
│  │         Single Container (1 vCPU, 2 GB)   │  │
│  │                                           │  │
│  │   Nginx (:80)                             │  │
│  │     ├── /          → frontend SPA         │  │
│  │     ├── /api/*     → Strapi (:1337)       │  │
│  │     ├── /admin/*   → Strapi Admin         │  │
│  │     └── /uploads/* → Strapi Media         │  │
│  │                                           │  │
│  │   Strapi (:1337) ──→ PostgreSQL (:5432)   │  │
│  │                                           │  │
│  │   /data/postgres   ← Azure Files volume   │  │
│  │   /data/uploads    ← Azure Files volume   │  │
│  └───────────────────────────────────────────┘  │
├─────────────────────────────────────────────────┤
│  Azure Container Registry (ACR)   — images      │
│  Azure Storage (Files)            — persistence  │
│  Log Analytics                    — logs         │
└─────────────────────────────────────────────────┘
```

## Azure Resources

| Resource | Purpose | Est. Cost |
|---|---|---|
| Container App (1 vCPU / 2 GB) | Runs the all-in-one container | ~$39/mo |
| Container Registry (Basic) | Stores Docker images | ~$5/mo |
| Storage Account (Azure Files, 5 GB) | PostgreSQL data + uploads | ~$0.50/mo |
| Log Analytics (30-day retention) | Container logs | ~$2/mo |
| **Total** | | **~$47/mo** |

## Prerequisites

- [Azure CLI](https://aka.ms/install-azure-cli)
- [Pulumi CLI](https://www.pulumi.com/docs/install/)
- [Node.js 20+](https://nodejs.org/)
- [Docker](https://docs.docker.com/get-docker/)

---

## Setup (One-Time)

### 1. Azure Login

```bash
az login
az account list -o table                         # list subscriptions
az account set --subscription <SUBSCRIPTION_ID>  # pick one
```

### 2. Create Pulumi State Backend (Azure Blob)

Pulumi needs somewhere to store its state file. We use an Azure Blob container
so everything stays in your Azure subscription — no external accounts needed.

```bash
# Variables — adjust as needed
STATE_RG="pulumi-state-rg"
STATE_LOCATION="southeastasia"
STATE_ACCOUNT="pulumistate$(openssl rand -hex 4)"  # must be globally unique
STATE_CONTAINER="state"

# Create resource group
az group create \
  --name "$STATE_RG" \
  --location "$STATE_LOCATION"

# Create storage account
az storage account create \
  --name "$STATE_ACCOUNT" \
  --resource-group "$STATE_RG" \
  --location "$STATE_LOCATION" \
  --sku Standard_LRS \
  --kind StorageV2

# Create blob container
az storage container create \
  --name "$STATE_CONTAINER" \
  --account-name "$STATE_ACCOUNT"

# Get the storage key
STATE_KEY=$(az storage account keys list \
  --account-name "$STATE_ACCOUNT" \
  --resource-group "$STATE_RG" \
  --query "[0].value" -o tsv)

# Print — save these values
echo ""
echo "=== Save these values ==="
echo "AZURE_STORAGE_ACCOUNT=$STATE_ACCOUNT"
echo "AZURE_STORAGE_KEY=$STATE_KEY"
echo "Backend URL: azblob://$STATE_CONTAINER"
```

### 3. Login Pulumi to the Blob Backend

```bash
export AZURE_STORAGE_ACCOUNT="<from step 2>"
export AZURE_STORAGE_KEY="<from step 2>"

pulumi login azblob://state
```

### 4. Create Service Principal (for CI/CD)

```bash
SUBSCRIPTION_ID=$(az account show --query id -o tsv)

az ad sp create-for-rbac \
  --name "amclub-github-actions" \
  --role Contributor \
  --scopes "/subscriptions/$SUBSCRIPTION_ID"
```

Save the output — you'll need `appId`, `password`, and `tenant`.

### 5. Initialize Pulumi Stack

```bash
cd infra
npm ci

# Create the dev stack (your subscription)
pulumi stack init dev
pulumi config set azure-native:location southeastasia
```

### 6. Deploy

```bash
pulumi up
```

First deploy takes ~10 minutes (Docker image build + Azure resource provisioning).
After completion, the app URL is printed in the outputs:

```bash
pulumi stack output appUrl
```

---

## Multi-Subscription Setup (Dev vs. Client)

Use separate Pulumi stacks + Azure subscriptions for isolation.

### Initial setup

```bash
# Dev stack (your subscription)
az account set --subscription <YOUR_SUB_ID>
pulumi stack init dev
pulumi config set azure-native:location southeastasia

# Prod stack (client subscription)
az account set --subscription <CLIENT_SUB_ID>
pulumi stack init prod
pulumi config set azure-native:location southeastasia
```

### Switching between environments

```bash
# Deploy to your subscription
az account set --subscription <YOUR_SUB_ID>
pulumi stack select dev
pulumi up

# Deploy to client subscription
az account set --subscription <CLIENT_SUB_ID>
pulumi stack select prod
pulumi up
```

Each stack stores its own config in `Pulumi.<stack>.yaml` and maintains
completely separate state. Nothing crosses over.

### Different settings per stack

Edit `Pulumi.prod.yaml` to override values for production:

```yaml
config:
  azure-native:location: southeastasia
```

---

## GitHub Actions CI/CD

### Setting Up Secrets (Automated)

Use the script in `infra/scripts/setup-github-secrets.sh`. It creates the service
principal, fetches Pulumi state credentials, and sets all 3 secrets on the GitHub
environment in one step.

```bash
# First time (dev)
bash infra/scripts/setup-github-secrets.sh dev

# Client production environment
az account set --subscription <CLIENT_SUB_ID>
bash infra/scripts/setup-github-secrets.sh prod

# Any other environment
bash infra/scripts/setup-github-secrets.sh staging
```

The script auto-detects the GitHub repo from your git remote. You can pass it
explicitly as a second argument: `bash setup-github-secrets.sh dev owner/repo`

#### Prerequisites for the script

- `az` — logged in to the target Azure subscription
- `gh` — logged in with secrets write permission (`gh auth login`)
- `python3`

If you get a permissions error from `gh`:

```bash
gh auth refresh --scopes write:org,repo
```

---

### Required Secrets (per GitHub environment)

| Secret | Value |
|---|---|
| `AZURE_CREDENTIALS` | `{"clientId":"...","clientSecret":"...","subscriptionId":"...","tenantId":"..."}` |
| `AZURE_STORAGE_ACCOUNT` | Pulumi state storage account name |
| `AZURE_STORAGE_KEY` | Pulumi state storage account key |

> The Pulumi state backend (`pulumi-state-rg`) is shared across all environments.
> Each environment deploys to a different Azure subscription.

---

### Branch → Environment Mapping

| Branch | GitHub Environment | Pulumi Stack | Azure Subscription |
|---|---|---|---|
| `main` | `dev` | `dev` | Your subscription |
| `prod` | `prod` | `prod` | Client subscription |

To deploy to prod:
1. Set up the `prod` GitHub environment with the client's Azure credentials (run `bash infra/scripts/setup-github-secrets.sh prod`)
2. Initialize the `prod` Pulumi stack (see Multi-Subscription Setup above)
3. Push or merge to the `prod` branch

### Pipelines

| Workflow | Trigger | What it does |
|---|---|---|
| `ci.yml` | Push/PR to `main` | Lint, typecheck, build (CMS + frontend + infra) |
| `deploy.yml` | Push to `main` or `prod` | CI → Docker build → `pulumi up` → deploy |

### How it works

1. PR opened → CI validates code
2. Merge to `main` → deploys to `dev`
3. Merge to `prod` → deploys to `prod`
4. Deployment URL printed in the GitHub Actions run summary

---

## Day-to-Day Commands

```bash
cd infra

# Preview changes without deploying
pulumi preview

# Deploy
pulumi up

# Show current outputs (app URL, etc.)
pulumi stack output

# View logs
pulumi logs

# Tear down everything
pulumi destroy

# Switch stack
pulumi stack select <dev|prod>

# List stacks
pulumi stack ls
```

---

## Troubleshooting

### "pulumi login" fails with blob backend

Make sure the env vars are set:

```bash
export AZURE_STORAGE_ACCOUNT="<account-name>"
export AZURE_STORAGE_KEY="<key>"
pulumi login azblob://state
```

### Container App not starting

Check logs in Azure Portal → Container Apps → your app → Log stream, or:

```bash
az containerapp logs show \
  --name <app-name> \
  --resource-group <rg-name> \
  --type console
```

### PostgreSQL data lost after restart

Verify the Azure Files volume is mounted. Check the Container App revision
has the volume mount configured at `/data`.

### Docker build fails in CI

The all-in-one `Dockerfile` builds frontend and CMS in separate stages.
Ensure both `frontend/package-lock.json` and `cms/package-lock.json` are
committed.

---

## File Reference

```
infra/
├── index.ts              # Pulumi program (all Azure resources)
├── package.json          # Node dependencies (@pulumi/azure-native, etc.)
├── tsconfig.json         # TypeScript config
├── Pulumi.yaml           # Project definition
├── Pulumi.dev.yaml       # Dev stack config
├── setup.sh              # Interactive bootstrap script
├── README.md             # This file
└── docker/
    ├── entrypoint.sh     # Container init (PostgreSQL + Strapi + Nginx)
    └── nginx.conf        # Nginx reverse proxy config

Dockerfile                # All-in-one production image (repo root)
Dockerfile.cms            # CMS-only image (for local dev)
Dockerfile.frontend       # Frontend-only image (for local dev)
docker-compose.dev.yml    # Local development environment
```
