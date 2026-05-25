---
date: 2026-05-25
environment: prod (+ uat + dev IaC stack configs)
content_type: infrastructure (Pulumi stack config)
entry: "Declare customDomains in Pulumi.<stack>.yaml so deploys don't strip them"
author: dev (Claude) on 2026-05-25
dev: applied (05-25, lives on `dev` branch already as commit b0a5103)
uat: pending
seed: n/a (IaC code change)
---

## Applied to main

Updated three `infra/Pulumi.<env>.yaml` files on `main` to declare each env's `customDomains` binding so `pulumi up` no longer strips them on deploy. Code change, no prod Strapi writes. Takes effect on the **next deploy from main** (which triggers prod stack `pulumi up`).

Mirrors the fix that already shipped to the `dev` branch in commit `b0a5103 fix(infra): declare customDomains in stack config + session cookie secure:false`, with cert names re-discovered from the live envs (cert resource names embed a per-issuance timestamp, so they have to be read at apply time, not copied from another env).

## What changed and why

Azure Container Apps uses **PUT semantics** — every `pulumi up` replaces the full resource body. If `customDomains` isn't in the desired-state body Pulumi sends, Azure removes the binding. Previously the prod stack config had `customDomains` only as a commented-out TODO, so the bindings configured manually in the portal got stripped on each deploy.

A previous `ignoreChanges: ['configuration.ingress.customDomains']` attempt (commit `ab59e81` on the history) did NOT work, because `ignoreChanges` does not apply to nested array fields under a PUT.

`infra/index.ts` on `main` **already** reads `customDomains` via `stackConfig.getObject<CustomDomainEntry[]>('customDomains')` (line 268) and passes it into the ContainerApp ingress config. The wiring was in place — only the stack-config values were missing.

## Files touched

### `infra/Pulumi.prod.yaml`
- **Before:** `customDomains` block commented out (TODO).
- **After:** declares two bindings:
  - `amclub.org.sg` → `amclub.org.sg-amclub-p-260518090805`
  - `www.amclub.org.sg` → `www.amclub.org.sg-amclub-p-260519065509`

### `infra/Pulumi.uat.yaml`
- **Before:** legacy `customDomain` / `customDomainCertName` example comment (singular).
- **After:** declares:
  - `uat.amclub.org.sg` → `uat.amclub.org.sg-amclub-u-260519023822`

### `infra/Pulumi.dev.yaml`
- **Before:** no customDomains.
- **After:** declares:
  - `dev.amclub.org.sg` → `dev.amclub.org.sg-amclub-d-260519023012`

## How the cert names were obtained

```bash
az account set --subscription Website          # tenant 8137d2b4-…
az containerapp list --query "[].{name:name, customDomains:properties.configuration.ingress.customDomains}" -o json
az containerapp env certificate list -g amclub-prod-rg -n amclub-prod-env
az containerapp env certificate list -g amclub-uat-rg  -n amclub-uat-env
# (dev: switch back to the legacy "Prefix" subscription, same query against amclub-dev-rg)
```

Cert resource names embed a timestamp (`260518090805` = 2026-05-18 09:08:05). If a cert is reissued, its name changes and **this YAML must be updated** before the next `pulumi up` — otherwise the binding will fail with a "certificate not found" error. The comment in each yaml file documents the lookup command.

## What this fix does NOT include

Deliberately NOT pulled from dev's `b0a5103` or sibling commits:
- `cms/config/middlewares.ts` `secure: false` session cookie override — SSO-related, not custom-domain-related.
- `infra/docker/nginx.conf` `X-Forwarded-Proto` map — SSO-related.
- `infra/index.ts` Entra ID SSO env-var wiring (commit `5b25b50` / `16b5b2e`).

These move on their own promotion path (dev → uat → main) once SSO is ready for prod.

## Replay / promotion

- **prod:** takes effect on next `push` to `main`, which the GitHub Actions `deploy.yml` workflow turns into `pulumi up --stack prod`. Cert names are pre-filled, so the deploy will succeed and the bindings remain intact.
- **uat:** the `uat` branch will need this `Pulumi.uat.yaml` content merged in (already lives on `dev`; promote via PR `dev → uat`). Until then, the next `uat` deploy will strip `uat.amclub.org.sg`.
- **dev:** already shipped via commit `b0a5103` on the `dev` branch.

## Risk + rollback

- Risk: cert name typo → next `pulumi up` fails with "managed certificate not found". Mitigation: cert names were copy-pasted from `az` output, not transcribed. Verify in CI run logs before approving prod deploy.
- Rollback: revert the `Pulumi.prod.yaml` block to commented-out and apply manually re-bound domains in the portal. (Workaround only — same strip-on-next-deploy bug returns.)

## Verification

After the next prod deploy:
- Visit https://www.amclub.org.sg/ and https://amclub.org.sg/ — both should load over TLS with their managed certs intact.
- `az containerapp show -g amclub-prod-rg -n amclub-prod-app --query "properties.configuration.ingress.customDomains"` should still list both bindings.

## Related

- Linked entries: none. Future SSO-related infra changes will be tracked separately if they get pulled to main.
