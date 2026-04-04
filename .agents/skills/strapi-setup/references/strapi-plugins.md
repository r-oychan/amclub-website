# Strapi v5 Plugin Configuration Reference

## i18n (Internationalization)

i18n is included by default in Strapi v5. Configure it in `config/plugins.ts`:

```typescript
export default ({ env }) => ({
  i18n: {
    enabled: true,
    config: {
      defaultLocale: 'en',
    },
  },
});
```

Enable i18n on a content type by adding to schema.json:
```json
{
  "pluginOptions": {
    "i18n": {
      "localized": true
    }
  }
}
```

Individual fields can opt out:
```json
"fieldName": {
  "type": "string",
  "pluginOptions": {
    "i18n": {
      "localized": false
    }
  }
}
```

## Upload Provider — Azure Blob Storage

### Install

```bash
cd cms && npm install @strapi/provider-upload-azure-storage
```

### Configure

`config/plugins.ts`:
```typescript
export default ({ env }) => ({
  upload: {
    config: {
      provider: '@strapi/provider-upload-azure-storage',
      providerOptions: {
        authType: env('AZURE_STORAGE_AUTH_TYPE', 'default'),
        account: env('AZURE_STORAGE_ACCOUNT'),
        accountKey: env('AZURE_STORAGE_ACCOUNT_KEY', ''),
        sasToken: env('AZURE_STORAGE_SAS_TOKEN', ''),
        serviceBaseURL: env('AZURE_STORAGE_URL', ''),
        containerName: env('AZURE_STORAGE_CONTAINER_NAME', 'strapi-uploads'),
        defaultPath: 'assets',
      },
    },
  },
});
```

### Environment Variables

```
AZURE_STORAGE_ACCOUNT=yourstorageaccount
AZURE_STORAGE_ACCOUNT_KEY=your-account-key
AZURE_STORAGE_CONTAINER_NAME=strapi-uploads
AZURE_STORAGE_URL=https://yourstorageaccount.blob.core.windows.net
```

### Security Middleware Update

Add Azure Blob URL to CSP:
```typescript
{
  name: 'strapi::security',
  config: {
    contentSecurityPolicy: {
      directives: {
        'img-src': ["'self'", 'data:', 'blob:', 'https://yourstorageaccount.blob.core.windows.net'],
        'media-src': ["'self'", 'data:', 'blob:', 'https://yourstorageaccount.blob.core.windows.net'],
      },
    },
  },
}
```

## Upload Provider — AWS S3

### Install

```bash
cd cms && npm install @strapi/provider-upload-aws-s3
```

### Configure

`config/plugins.ts`:
```typescript
export default ({ env }) => ({
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
            ACL: env('AWS_ACL', 'public-read'),
            signedUrlExpires: env('AWS_SIGNED_URL_EXPIRES', 15 * 60),
            Bucket: env('AWS_BUCKET'),
          },
        },
      },
      actionOptions: {
        upload: {},
        uploadStream: {},
        delete: {},
      },
    },
  },
});
```

### Environment Variables

```
AWS_ACCESS_KEY_ID=your-access-key
AWS_ACCESS_SECRET=your-secret-key
AWS_REGION=us-east-1
AWS_BUCKET=your-bucket-name
```

## Email — Nodemailer (SMTP)

### Install

```bash
cd cms && npm install @strapi/provider-email-nodemailer
```

### Configure

`config/plugins.ts` (add to existing exports):
```typescript
email: {
  config: {
    provider: '@strapi/provider-email-nodemailer',
    providerOptions: {
      host: env('SMTP_HOST', 'smtp.example.com'),
      port: env.int('SMTP_PORT', 587),
      auth: {
        user: env('SMTP_USERNAME'),
        pass: env('SMTP_PASSWORD'),
      },
    },
    settings: {
      defaultFrom: env('SMTP_FROM', 'noreply@example.com'),
      defaultReplyTo: env('SMTP_REPLY_TO', 'noreply@example.com'),
    },
  },
},
```

## Email — SendGrid

### Install

```bash
cd cms && npm install @strapi/provider-email-sendgrid
```

### Configure

```typescript
email: {
  config: {
    provider: '@strapi/provider-email-sendgrid',
    providerOptions: {
      apiKey: env('SENDGRID_API_KEY'),
    },
    settings: {
      defaultFrom: env('SENDGRID_FROM', 'noreply@example.com'),
      defaultReplyTo: env('SENDGRID_REPLY_TO', 'noreply@example.com'),
    },
  },
},
```

## SSO (Enterprise Feature)

SSO requires a Strapi Enterprise license. If available:

### Azure AD

`config/admin.ts`:
```typescript
export default ({ env }) => ({
  auth: {
    secret: env('ADMIN_JWT_SECRET'),
    providers: [
      {
        uid: 'azure-ad',
        displayName: 'Azure AD',
        icon: 'https://upload.wikimedia.org/wikipedia/commons/a/a8/Microsoft_Azure_Logo.svg',
        createStrategy: (strapi) => {
          const MicrosoftStrategy = require('passport-azure-ad-oauth2');
          return new MicrosoftStrategy(
            {
              clientID: env('AZURE_AD_CLIENT_ID'),
              clientSecret: env('AZURE_AD_CLIENT_SECRET'),
              tenant: env('AZURE_AD_TENANT_ID'),
              callbackURL: `${strapi.config.server.url}/admin/connect/azure-ad/callback`,
            },
            (accessToken, refreshToken, profile, done) => {
              done(null, { email: profile.email, username: profile.email });
            }
          );
        },
      },
    ],
  },
});
```

**Note:** SSO is an enterprise feature. For community edition, use standard email/password authentication for the admin panel.

## Plugin Configuration File Pattern

All plugin configs go in `config/plugins.ts`. Combine them:

```typescript
export default ({ env }) => ({
  i18n: {
    enabled: true,
    config: {
      defaultLocale: 'en',
    },
  },
  upload: {
    config: {
      provider: '@strapi/provider-upload-azure-storage',
      providerOptions: {
        account: env('AZURE_STORAGE_ACCOUNT'),
        accountKey: env('AZURE_STORAGE_ACCOUNT_KEY'),
        containerName: env('AZURE_STORAGE_CONTAINER_NAME', 'strapi-uploads'),
        defaultPath: 'assets',
      },
    },
  },
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
  },
});
```

## Source
- https://docs.strapi.io/cms/plugins
- https://market.strapi.io/
