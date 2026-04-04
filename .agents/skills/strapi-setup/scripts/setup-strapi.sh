#!/usr/bin/env bash
set -euo pipefail

# Strapi v5 Setup Script
# Deterministic setup: create project, install plugins, copy schemas, configure, build.
#
# Usage:
#   ./setup-strapi.sh [OPTIONS]
#
# Options:
#   --upload <provider>    Upload provider: local, azure, s3 (default: local)
#   --email <provider>     Email provider: none, smtp, sendgrid (default: none)
#   --i18n                 Enable i18n plugin
#   --frontend-url <url>   Frontend URL for CORS (default: http://localhost:5173)
#   --project-dir <dir>    Output directory (default: cms)
#   --content-types <dir>  Content types source (default: content-types)
#   --components <dir>     Components source (default: components)
#   --skip-build           Skip the final build step
#   --help                 Show this help message

UPLOAD_PROVIDER="local"
EMAIL_PROVIDER="none"
ENABLE_I18N=false
FRONTEND_URL="http://localhost:5173"
PROJECT_DIR="cms"
CONTENT_TYPES_DIR="content-types"
COMPONENTS_DIR="components"
SKIP_BUILD=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --upload) UPLOAD_PROVIDER="$2"; shift 2 ;;
    --email) EMAIL_PROVIDER="$2"; shift 2 ;;
    --i18n) ENABLE_I18N=true; shift ;;
    --frontend-url) FRONTEND_URL="$2"; shift 2 ;;
    --project-dir) PROJECT_DIR="$2"; shift 2 ;;
    --content-types) CONTENT_TYPES_DIR="$2"; shift 2 ;;
    --components) COMPONENTS_DIR="$2"; shift 2 ;;
    --skip-build) SKIP_BUILD=true; shift ;;
    --help)
      head -20 "$0" | tail -15
      exit 0
      ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

echo "=== Strapi v5 Setup ==="
echo "Upload: $UPLOAD_PROVIDER | Email: $EMAIL_PROVIDER | i18n: $ENABLE_I18N"
echo "Frontend URL: $FRONTEND_URL"
echo "Project dir: $PROJECT_DIR"
echo ""

# ── Step 1: Verify inputs ─────────────────────────────────────────────────────

if [ ! -d "$CONTENT_TYPES_DIR" ]; then
  echo "ERROR: Content types directory '$CONTENT_TYPES_DIR' not found."
  echo "Run the cms-data-modeler skill first."
  exit 1
fi

if [ ! -d "$COMPONENTS_DIR" ]; then
  echo "ERROR: Components directory '$COMPONENTS_DIR' not found."
  echo "Run the cms-data-modeler skill first."
  exit 1
fi

# ── Step 2: Create Strapi project ─────────────────────────────────────────────

if [ -d "$PROJECT_DIR" ]; then
  echo "WARNING: $PROJECT_DIR already exists. Backing up to ${PROJECT_DIR}.backup"
  rm -rf "${PROJECT_DIR}.backup"
  mv "$PROJECT_DIR" "${PROJECT_DIR}.backup"
fi

echo "Creating Strapi project..."
npx create-strapi@latest "$PROJECT_DIR" --quickstart --no-run --skip-cloud

# ── Step 3: Install plugins ───────────────────────────────────────────────────

echo "Installing plugins..."
cd "$PROJECT_DIR"

# Always install pg for production PostgreSQL
npm install pg

case $UPLOAD_PROVIDER in
  azure) npm install @strapi/provider-upload-azure-storage ;;
  s3) npm install @strapi/provider-upload-aws-s3 ;;
  local) ;; # No package needed
  *) echo "Unknown upload provider: $UPLOAD_PROVIDER"; exit 1 ;;
esac

case $EMAIL_PROVIDER in
  smtp) npm install @strapi/provider-email-nodemailer ;;
  sendgrid) npm install @strapi/provider-email-sendgrid ;;
  none) ;; # No package needed
  *) echo "Unknown email provider: $EMAIL_PROVIDER"; exit 1 ;;
esac

cd ..

# ── Step 4: Copy content types ────────────────────────────────────────────────

echo "Copying content types..."
for type_dir in "$CONTENT_TYPES_DIR"/*/; do
  if [ ! -d "$type_dir" ]; then continue; fi

  type_name=$(basename "$type_dir")

  # Read singularName from schema.json if possible
  schema_file="$type_dir/schema.json"
  if [ -f "$schema_file" ]; then
    singular_name=$(node -e "console.log(JSON.parse(require('fs').readFileSync('$schema_file','utf8')).info.singularName)" 2>/dev/null || echo "$type_name")
  else
    singular_name="$type_name"
    echo "WARNING: No schema.json in $type_dir"
    continue
  fi

  api_dir="$PROJECT_DIR/src/api/$singular_name"

  # Create directory structure
  mkdir -p "$api_dir/content-types/$singular_name"
  mkdir -p "$api_dir/controllers"
  mkdir -p "$api_dir/routes"
  mkdir -p "$api_dir/services"

  # Copy schema
  cp "$schema_file" "$api_dir/content-types/$singular_name/schema.json"

  # Create controller stub
  cat > "$api_dir/controllers/$singular_name.ts" << TSEOF
import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::$singular_name.$singular_name');
TSEOF

  # Create route stub
  cat > "$api_dir/routes/$singular_name.ts" << TSEOF
import { factories } from '@strapi/strapi';

export default factories.createCoreRouter('api::$singular_name.$singular_name');
TSEOF

  # Create service stub
  cat > "$api_dir/services/$singular_name.ts" << TSEOF
import { factories } from '@strapi/strapi';

export default factories.createCoreService('api::$singular_name.$singular_name');
TSEOF

  echo "  Created API: $singular_name"
done

# ── Step 5: Copy components ───────────────────────────────────────────────────

echo "Copying components..."
for category_dir in "$COMPONENTS_DIR"/*/; do
  if [ ! -d "$category_dir" ]; then continue; fi

  category=$(basename "$category_dir")
  mkdir -p "$PROJECT_DIR/src/components/$category"

  for comp_file in "$category_dir"*.json; do
    if [ ! -f "$comp_file" ]; then continue; fi
    cp "$comp_file" "$PROJECT_DIR/src/components/$category/"
    echo "  Copied component: $category/$(basename "$comp_file")"
  done
done

# ── Step 6: Configure production database ─────────────────────────────────────

echo "Configuring production database..."
mkdir -p "$PROJECT_DIR/config/env/production"

cat > "$PROJECT_DIR/config/env/production/database.ts" << 'TSEOF'
export default ({ env }) => ({
  connection: {
    client: 'postgres',
    connection: {
      host: env('DATABASE_HOST', '127.0.0.1'),
      port: env.int('DATABASE_PORT', 5432),
      database: env('DATABASE_NAME', 'strapi'),
      user: env('DATABASE_USERNAME', 'strapi'),
      password: env('DATABASE_PASSWORD', ''),
      ssl: env.bool('DATABASE_SSL', false) && {
        rejectUnauthorized: env.bool(
          'DATABASE_SSL_REJECT_UNAUTHORIZED',
          true
        ),
      },
    },
    pool: {
      min: env.int('DATABASE_POOL_MIN', 2),
      max: env.int('DATABASE_POOL_MAX', 10),
    },
  },
});
TSEOF

# ── Step 7: Configure CORS ───────────────────────────────────────────────────

echo "Configuring CORS..."
cat > "$PROJECT_DIR/config/middlewares.ts" << TSEOF
export default ({ env }) => [
  'strapi::logger',
  'strapi::errors',
  'strapi::security',
  {
    name: 'strapi::cors',
    config: {
      enabled: true,
      headers: '*',
      origin: env.array('CORS_ORIGINS', ['$FRONTEND_URL']),
    },
  },
  'strapi::poweredBy',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
];
TSEOF

# ── Step 8: Configure plugins ────────────────────────────────────────────────

echo "Configuring plugins..."
PLUGIN_CONFIG="export default ({ env }) => ({"

if [ "$ENABLE_I18N" = true ]; then
  PLUGIN_CONFIG+="
  i18n: {
    enabled: true,
    config: {
      defaultLocale: 'en',
    },
  },"
fi

case $UPLOAD_PROVIDER in
  azure)
    PLUGIN_CONFIG+="
  upload: {
    config: {
      provider: '@strapi/provider-upload-azure-storage',
      providerOptions: {
        account: env('AZURE_STORAGE_ACCOUNT'),
        accountKey: env('AZURE_STORAGE_ACCOUNT_KEY', ''),
        containerName: env('AZURE_STORAGE_CONTAINER_NAME', 'strapi-uploads'),
        defaultPath: 'assets',
      },
    },
  },"
    ;;
  s3)
    PLUGIN_CONFIG+="
  upload: {
    config: {
      provider: '@strapi/provider-upload-aws-s3',
      providerOptions: {
        s3Options: {
          credentials: {
            accessKeyId: env('AWS_ACCESS_KEY_ID'),
            secretAccessKey: env('AWS_ACCESS_SECRET'),
          },
          region: env('AWS_REGION'),
          params: {
            Bucket: env('AWS_BUCKET'),
          },
        },
      },
    },
  },"
    ;;
esac

case $EMAIL_PROVIDER in
  smtp)
    PLUGIN_CONFIG+="
  email: {
    config: {
      provider: '@strapi/provider-email-nodemailer',
      providerOptions: {
        host: env('SMTP_HOST'),
        port: env.int('SMTP_PORT', 587),
        auth: {
          user: env('SMTP_USERNAME'),
          pass: env('SMTP_PASSWORD'),
        },
      },
      settings: {
        defaultFrom: env('SMTP_FROM'),
        defaultReplyTo: env('SMTP_REPLY_TO'),
      },
    },
  },"
    ;;
  sendgrid)
    PLUGIN_CONFIG+="
  email: {
    config: {
      provider: '@strapi/provider-email-sendgrid',
      providerOptions: {
        apiKey: env('SENDGRID_API_KEY'),
      },
      settings: {
        defaultFrom: env('SENDGRID_FROM'),
        defaultReplyTo: env('SENDGRID_REPLY_TO'),
      },
    },
  },"
    ;;
esac

PLUGIN_CONFIG+="
});"

echo "$PLUGIN_CONFIG" > "$PROJECT_DIR/config/plugins.ts"

# ── Step 9: Create environment files ─────────────────────────────────────────

echo "Creating environment files..."

cat > "$PROJECT_DIR/.env" << EOF
HOST=0.0.0.0
PORT=1337
PUBLIC_URL=http://localhost:1337
APP_KEYS=$(openssl rand -base64 32),$(openssl rand -base64 32),$(openssl rand -base64 32),$(openssl rand -base64 32)
API_TOKEN_SALT=$(openssl rand -base64 32)
ADMIN_JWT_SECRET=$(openssl rand -base64 32)
TRANSFER_TOKEN_SALT=$(openssl rand -base64 32)
JWT_SECRET=$(openssl rand -base64 32)
CORS_ORIGINS=$FRONTEND_URL
EOF

cat > "$PROJECT_DIR/.env.example" << 'EOF'
HOST=0.0.0.0
PORT=1337
PUBLIC_URL=http://localhost:1337
APP_KEYS=key1,key2,key3,key4
API_TOKEN_SALT=your-api-token-salt
ADMIN_JWT_SECRET=your-admin-jwt-secret
TRANSFER_TOKEN_SALT=your-transfer-token-salt
JWT_SECRET=your-jwt-secret
CORS_ORIGINS=http://localhost:5173

# Production Database (PostgreSQL)
# DATABASE_HOST=your-db-host
# DATABASE_PORT=5432
# DATABASE_NAME=strapi
# DATABASE_USERNAME=strapi
# DATABASE_PASSWORD=your-password
# DATABASE_SSL=true

# Azure Blob Storage
# AZURE_STORAGE_ACCOUNT=your-account
# AZURE_STORAGE_ACCOUNT_KEY=your-key
# AZURE_STORAGE_CONTAINER_NAME=strapi-uploads

# AWS S3
# AWS_ACCESS_KEY_ID=your-key
# AWS_ACCESS_SECRET=your-secret
# AWS_REGION=us-east-1
# AWS_BUCKET=your-bucket

# Email (SMTP)
# SMTP_HOST=smtp.example.com
# SMTP_PORT=587
# SMTP_USERNAME=your-username
# SMTP_PASSWORD=your-password
# SMTP_FROM=noreply@example.com
# SMTP_REPLY_TO=noreply@example.com

# Email (SendGrid)
# SENDGRID_API_KEY=your-api-key
# SENDGRID_FROM=noreply@example.com
# SENDGRID_REPLY_TO=noreply@example.com
EOF

# ── Step 10: Verify .gitignore ────────────────────────────────────────────────

if [ -f "$PROJECT_DIR/.gitignore" ]; then
  for pattern in ".env" ".tmp" "build" "node_modules"; do
    if ! grep -qF "$pattern" "$PROJECT_DIR/.gitignore"; then
      echo "$pattern" >> "$PROJECT_DIR/.gitignore"
    fi
  done
else
  cat > "$PROJECT_DIR/.gitignore" << 'EOF'
.env
.tmp
build
node_modules
dist
*.log
EOF
fi

# ── Step 11: Build ────────────────────────────────────────────────────────────

if [ "$SKIP_BUILD" = true ]; then
  echo ""
  echo "=== Setup complete (build skipped) ==="
else
  echo ""
  echo "Building Strapi..."
  cd "$PROJECT_DIR" && npm run build
  cd ..
  echo ""
  echo "=== Setup complete and build verified ==="
fi

echo ""
echo "To start the development server:"
echo "  cd $PROJECT_DIR && npm run develop"
echo ""
echo "Admin panel: http://localhost:1337/admin"
echo "API base:    http://localhost:1337/api"
