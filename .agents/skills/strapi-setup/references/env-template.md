# Environment Variable Template

## `.env` (Development)

```env
# Server
HOST=0.0.0.0
PORT=1337
PUBLIC_URL=http://localhost:1337

# Secrets (generate with: openssl rand -base64 32)
APP_KEYS=key1,key2,key3,key4
API_TOKEN_SALT=your-api-token-salt
ADMIN_JWT_SECRET=your-admin-jwt-secret
TRANSFER_TOKEN_SALT=your-transfer-token-salt
JWT_SECRET=your-jwt-secret

# Database (SQLite for dev — no config needed, uses .tmp/data.db by default)
# DATABASE_FILENAME=.tmp/data.db

# CORS
CORS_ORIGINS=http://localhost:5173

# Upload (local filesystem for dev — no config needed)
```

## `.env.production` (Production)

```env
# Server
HOST=0.0.0.0
PORT=1337
PUBLIC_URL=https://cms.yourdomain.com
NODE_ENV=production

# Secrets (MUST be unique per environment)
APP_KEYS=generate-unique-keys
API_TOKEN_SALT=generate-unique-salt
ADMIN_JWT_SECRET=generate-unique-secret
TRANSFER_TOKEN_SALT=generate-unique-salt
JWT_SECRET=generate-unique-secret

# Database (PostgreSQL)
DATABASE_HOST=your-db-host.postgres.database.azure.com
DATABASE_PORT=5432
DATABASE_NAME=strapi
DATABASE_USERNAME=strapi
DATABASE_PASSWORD=your-db-password
DATABASE_SSL=true
DATABASE_SSL_REJECT_UNAUTHORIZED=true

# CORS
CORS_ORIGINS=https://www.yourdomain.com,https://yourdomain.com

# Azure Blob Storage (if using Azure upload provider)
AZURE_STORAGE_ACCOUNT=yourstorageaccount
AZURE_STORAGE_ACCOUNT_KEY=your-account-key
AZURE_STORAGE_CONTAINER_NAME=strapi-uploads
AZURE_STORAGE_URL=https://yourstorageaccount.blob.core.windows.net

# AWS S3 (if using S3 upload provider)
# AWS_ACCESS_KEY_ID=your-access-key
# AWS_ACCESS_SECRET=your-secret-key
# AWS_REGION=us-east-1
# AWS_BUCKET=your-bucket-name

# Email (SMTP)
# SMTP_HOST=smtp.example.com
# SMTP_PORT=587
# SMTP_USERNAME=your-username
# SMTP_PASSWORD=your-password
# SMTP_FROM=noreply@yourdomain.com
# SMTP_REPLY_TO=noreply@yourdomain.com

# Email (SendGrid)
# SENDGRID_API_KEY=your-sendgrid-api-key
# SENDGRID_FROM=noreply@yourdomain.com
# SENDGRID_REPLY_TO=noreply@yourdomain.com
```

## Generating Secrets

Use `openssl` to generate cryptographically secure values:

```bash
# Generate APP_KEYS (4 comma-separated keys)
echo "APP_KEYS=$(openssl rand -base64 32),$(openssl rand -base64 32),$(openssl rand -base64 32),$(openssl rand -base64 32)"

# Generate individual secrets
echo "API_TOKEN_SALT=$(openssl rand -base64 32)"
echo "ADMIN_JWT_SECRET=$(openssl rand -base64 32)"
echo "TRANSFER_TOKEN_SALT=$(openssl rand -base64 32)"
echo "JWT_SECRET=$(openssl rand -base64 32)"
```

## Variable Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `HOST` | No | `0.0.0.0` | Server bind address |
| `PORT` | No | `1337` | Server port |
| `PUBLIC_URL` | Yes (prod) | `http://localhost:1337` | Public-facing URL of the CMS |
| `APP_KEYS` | Yes | — | Comma-separated session keys |
| `API_TOKEN_SALT` | Yes | — | Salt for API token hashing |
| `ADMIN_JWT_SECRET` | Yes | — | Secret for admin JWT signing |
| `TRANSFER_TOKEN_SALT` | Yes | — | Salt for transfer token hashing |
| `JWT_SECRET` | Yes | — | Secret for Content API JWT |
| `DATABASE_HOST` | Yes (prod) | `127.0.0.1` | PostgreSQL host |
| `DATABASE_PORT` | No | `5432` | PostgreSQL port |
| `DATABASE_NAME` | Yes (prod) | `strapi` | Database name |
| `DATABASE_USERNAME` | Yes (prod) | `strapi` | Database user |
| `DATABASE_PASSWORD` | Yes (prod) | — | Database password |
| `DATABASE_SSL` | No | `false` | Enable SSL for DB connection |
| `CORS_ORIGINS` | Yes | `http://localhost:5173` | Comma-separated allowed origins |
