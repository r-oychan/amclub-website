#!/bin/bash
# ============================================================
# Setup GitHub Actions secrets for a given environment.
#
# Usage:
#   bash setup-github-secrets.sh <environment> [github-repo]
#
# Examples:
#   bash setup-github-secrets.sh dev
#   bash setup-github-secrets.sh prod r-oychan/amclub-website
#
# What it does:
#   1. Creates (or reuses) an Azure service principal
#   2. Fetches Pulumi state storage credentials
#   3. Sets AZURE_CREDENTIALS, AZURE_STORAGE_ACCOUNT,
#      AZURE_STORAGE_KEY on the GitHub environment via gh CLI
# ============================================================
set -euo pipefail

CYAN='\033[0;36m'; GREEN='\033[0;32m'; RED='\033[0;31m'; BOLD='\033[1m'; NC='\033[0m'
info()   { echo -e "${CYAN}▸${NC} $*"; }
ok()     { echo -e "${GREEN}✔${NC} $*"; }
err()    { echo -e "${RED}✖${NC} $*" >&2; exit 1; }
header() { echo -e "\n${BOLD}── $* ──${NC}"; }

# ── Args ─────────────────────────────────────────────────────
ENVIRONMENT="${1:-}"
GH_REPO="${2:-}"

if [ -z "$ENVIRONMENT" ]; then
  echo "Usage: bash setup-github-secrets.sh <environment> [github-repo]"
  echo "  environment : dev | prod | staging | ..."
  echo "  github-repo : owner/repo  (auto-detected from git remote if omitted)"
  exit 1
fi

# ── Prerequisites ─────────────────────────────────────────────
header "Checking prerequisites"
for cmd in az gh python3; do
  command -v "$cmd" &>/dev/null || err "$cmd not found. Install it first."
done
ok "az, gh, python3 found"

# Auto-detect repo from git remote if not provided
if [ -z "$GH_REPO" ]; then
  REMOTE=$(git remote get-url origin 2>/dev/null || true)
  # Handle both SSH (git@github.com:owner/repo.git) and HTTPS formats
  GH_REPO=$(echo "$REMOTE" | sed -E 's|.*[:/]([^/]+/[^/]+)(\.git)?$|\1|')
  if [ -z "$GH_REPO" ]; then
    err "Could not detect GitHub repo. Pass it as second argument: owner/repo"
  fi
  ok "Detected repo: $GH_REPO"
fi

# Check gh auth
gh auth status &>/dev/null || err "Not logged in to gh. Run: gh auth login"
ok "gh authenticated"

# ── Azure login check ─────────────────────────────────────────
header "Azure"
az account show &>/dev/null || err "Not logged in to Azure. Run: az login"
SUB_ID=$(az account show --query id -o tsv)
SUB_NAME=$(az account show --query name -o tsv)
ok "Subscription: $SUB_NAME ($SUB_ID)"

# ── Service Principal ─────────────────────────────────────────
header "Service Principal"
SP_NAME="amclub-github-actions"
info "Creating/updating service principal: $SP_NAME"

SP_RAW=$(az ad sp create-for-rbac \
  --name "$SP_NAME" \
  --role "Contributor" \
  --scopes "/subscriptions/$SUB_ID" \
  --output json 2>&1)

# Strip WARNING lines, parse JSON
SP_JSON=$(echo "$SP_RAW" | grep -v '^WARNING' || true)

AZURE_CREDENTIALS=$(python3 -c "
import json, sys
sp = json.loads('''$SP_JSON''')
print(json.dumps({
  'clientId':       sp['appId'],
  'clientSecret':   sp['password'],
  'subscriptionId': '$SUB_ID',
  'tenantId':       sp['tenant']
}))
")
ok "Service principal ready"

# ── Pulumi State Storage ──────────────────────────────────────
header "Pulumi State Backend"
STATE_RG="pulumi-state-rg"

STORAGE_ACCOUNT=$(az storage account list \
  --resource-group "$STATE_RG" \
  --query "[0].name" -o tsv 2>/dev/null || true)

if [ -z "$STORAGE_ACCOUNT" ]; then
  err "No storage account found in $STATE_RG. Run infra/setup.sh first."
fi

STORAGE_KEY=$(az storage account keys list \
  --account-name "$STORAGE_ACCOUNT" \
  --resource-group "$STATE_RG" \
  --query "[0].value" -o tsv)

ok "Storage account: $STORAGE_ACCOUNT"

# ── Set GitHub Secrets ────────────────────────────────────────
header "Setting GitHub Secrets on environment: $ENVIRONMENT"

set_secret() {
  local name="$1"
  local value="$2"
  echo -n "  Setting $name ... "
  echo "$value" | gh secret set "$name" \
    --repo "$GH_REPO" \
    --env "$ENVIRONMENT" 2>&1
  echo -e "${GREEN}✔${NC}"
}

set_secret "AZURE_CREDENTIALS"      "$AZURE_CREDENTIALS"
set_secret "AZURE_STORAGE_ACCOUNT"  "$STORAGE_ACCOUNT"
set_secret "AZURE_STORAGE_KEY"      "$STORAGE_KEY"

# PULUMI_CONFIG_PASSPHRASE — prompt if not already set
if [ -z "${PULUMI_CONFIG_PASSPHRASE:-}" ]; then
  echo ""
  echo -e "${CYAN}ℹ${NC}  PULUMI_CONFIG_PASSPHRASE — press Enter if you used no passphrase when running 'pulumi stack init'"
  read -rsp "  Passphrase (hidden): " PASSPHRASE
  echo ""
else
  PASSPHRASE="$PULUMI_CONFIG_PASSPHRASE"
fi
set_secret "PULUMI_CONFIG_PASSPHRASE" "$PASSPHRASE"

# ── Summary ───────────────────────────────────────────────────
header "Done"
echo ""
echo -e "Secrets set on ${BOLD}$GH_REPO${NC} / environment ${BOLD}$ENVIRONMENT${NC}:"
echo "  ✔ AZURE_CREDENTIALS"
echo "  ✔ AZURE_STORAGE_ACCOUNT  ($STORAGE_ACCOUNT)"
echo "  ✔ AZURE_STORAGE_KEY"
echo "  ✔ PULUMI_CONFIG_PASSPHRASE"
echo ""
echo -e "${BOLD}If you see permission errors above:${NC}"
echo "  gh auth refresh -s write:org,repo"
echo "  gh auth refresh -s secrets"
echo ""
echo -e "${BOLD}To deploy:${NC} push to main, or update deploy.yml environment to '$ENVIRONMENT'"
