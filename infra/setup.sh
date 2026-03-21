#!/bin/bash
# ============================================================
# AMClub Website — Azure + Pulumi Bootstrap
#
# Creates:
#   1. Pulumi state backend (Azure Blob Storage)
#   2. Service principal for GitHub Actions
#   3. Pulumi dev stack
#
# Run once per subscription. See infra/README.md for details.
# ============================================================
set -euo pipefail

CYAN='\033[0;36m'
GREEN='\033[0;32m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m'

info()   { echo -e "${CYAN}▸${NC} $*"; }
ok()     { echo -e "${GREEN}✔${NC} $*"; }
err()    { echo -e "${RED}✖${NC} $*" >&2; }
header() { echo -e "\n${BOLD}── $* ──${NC}"; }

# ── Prerequisites ─────────────────────────────────────────────
header "Checking prerequisites"
for cmd in az pulumi node npm docker; do
  if ! command -v "$cmd" &>/dev/null; then
    err "$cmd not found."
    case "$cmd" in
      az)     echo "  Install: https://aka.ms/install-azure-cli" ;;
      pulumi) echo "  Install: https://www.pulumi.com/docs/install/" ;;
      docker) echo "  Install: https://docs.docker.com/get-docker/" ;;
      *)      echo "  Install: https://nodejs.org/" ;;
    esac
    exit 1
  fi
done
ok "All tools found"

# ── Step 1: Azure Login ──────────────────────────────────────
header "Step 1 — Azure Login"
az login --output none

SUBSCRIPTION_ID=$(az account show --query id -o tsv)
TENANT_ID=$(az account show --query tenantId -o tsv)
SUB_NAME=$(az account show --query name -o tsv)
ok "Subscription: $SUB_NAME ($SUBSCRIPTION_ID)"

read -rp "Use this subscription? (y/n): " CONFIRM
if [[ "$CONFIRM" != "y" ]]; then
  az account list --query "[].{Name:name, ID:id}" -o table
  read -rp "Enter subscription ID: " SUBSCRIPTION_ID
  az account set --subscription "$SUBSCRIPTION_ID"
  TENANT_ID=$(az account show --query tenantId -o tsv)
  ok "Switched to $SUBSCRIPTION_ID"
fi

# ── Step 2: Pulumi State Backend (Azure Blob) ────────────────
header "Step 2 — Create Pulumi State Backend"

STATE_RG="pulumi-state-rg"
STATE_LOCATION="southeastasia"
STATE_CONTAINER="state"

read -rp "Storage account name (globally unique, lowercase, no dashes) [pulumistate<random>]: " STATE_ACCOUNT
STATE_ACCOUNT=${STATE_ACCOUNT:-"pulumistate$(openssl rand -hex 4)"}

info "Creating resource group: $STATE_RG"
az group create \
  --name "$STATE_RG" \
  --location "$STATE_LOCATION" \
  --output none

info "Creating storage account: $STATE_ACCOUNT"
az storage account create \
  --name "$STATE_ACCOUNT" \
  --resource-group "$STATE_RG" \
  --location "$STATE_LOCATION" \
  --sku Standard_LRS \
  --kind StorageV2 \
  --output none

info "Creating blob container: $STATE_CONTAINER"
az storage container create \
  --name "$STATE_CONTAINER" \
  --account-name "$STATE_ACCOUNT" \
  --output none

STATE_KEY=$(az storage account keys list \
  --account-name "$STATE_ACCOUNT" \
  --resource-group "$STATE_RG" \
  --query "[0].value" -o tsv)

ok "State backend ready"

# ── Step 3: Pulumi Login ─────────────────────────────────────
header "Step 3 — Pulumi Login"

export AZURE_STORAGE_ACCOUNT="$STATE_ACCOUNT"
export AZURE_STORAGE_KEY="$STATE_KEY"

info "Logging in to azblob://$STATE_CONTAINER"
pulumi login "azblob://$STATE_CONTAINER"
ok "Pulumi backend configured"

# ── Step 4: Service Principal ─────────────────────────────────
header "Step 4 — Create Service Principal"
SP_NAME="amclub-github-actions"

info "Creating: $SP_NAME"
SP_JSON=$(az ad sp create-for-rbac \
  --name "$SP_NAME" \
  --role Contributor \
  --scopes "/subscriptions/$SUBSCRIPTION_ID" \
  --output json)

CLIENT_ID=$(echo "$SP_JSON" | python3 -c "import sys,json; print(json.load(sys.stdin)['appId'])")
CLIENT_SECRET=$(echo "$SP_JSON" | python3 -c "import sys,json; print(json.load(sys.stdin)['password'])")

AZURE_CREDENTIALS=$(cat <<EOF
{"clientId":"$CLIENT_ID","clientSecret":"$CLIENT_SECRET","subscriptionId":"$SUBSCRIPTION_ID","tenantId":"$TENANT_ID"}
EOF
)
ok "Service principal created"

# ── Step 5: Init Pulumi Stack ─────────────────────────────────
header "Step 5 — Initialize Pulumi Stack"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

info "Installing dependencies..."
npm ci --silent

if pulumi stack ls 2>/dev/null | grep -q "dev"; then
  pulumi stack select dev
  ok "Selected existing 'dev' stack"
else
  pulumi stack init dev
  ok "Created 'dev' stack"
fi

pulumi config set azure-native:location "$STATE_LOCATION"
ok "Stack configured"

# ── Summary ───────────────────────────────────────────────────
header "Setup Complete"

cat <<SUMMARY

${BOLD}GitHub Secrets — add all 3 to Settings → Secrets → Actions:${NC}

${CYAN}1. AZURE_CREDENTIALS${NC}
$AZURE_CREDENTIALS

${CYAN}2. AZURE_STORAGE_ACCOUNT${NC}
$STATE_ACCOUNT

${CYAN}3. AZURE_STORAGE_KEY${NC}
$STATE_KEY

${BOLD}Local shell — add to ~/.zshrc or ~/.bashrc:${NC}

export AZURE_STORAGE_ACCOUNT="$STATE_ACCOUNT"
export AZURE_STORAGE_KEY="$STATE_KEY"

${BOLD}Deploy now:${NC}

  cd infra && pulumi up

${BOLD}Switch subscription later:${NC}

  az account set --subscription <OTHER_SUB_ID>
  pulumi stack select <dev|prod>
  pulumi up

SUMMARY
