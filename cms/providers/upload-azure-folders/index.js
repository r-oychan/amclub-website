'use strict';

// Wraps strapi-provider-upload-azure-storage to honour `file.path`. The
// upstream provider always uses `config.defaultPath` for the blob prefix
// regardless of what Strapi passes on the file object, so blobs land in
// a single flat `uploads/` folder. With this wrapper, if `file.path` is
// set (Strapi service puts `metas.path` from upload-request body into
// `entity.path`), the effective blob prefix becomes
// `<defaultPath>/<file.path>`. Falls back to `defaultPath` alone when
// the path is absent.
//
// We re-init the upstream provider per call. The init cost is just a
// BlobServiceClient object — no connection opens lazily — so concurrent
// uploads with different `file.path` values can't clobber each other.

const upstream = require('strapi-provider-upload-azure-storage');

function joinPath(...parts) {
  return parts
    .filter(Boolean)
    .map((p) => String(p).replace(/^\/+|\/+$/g, ''))
    .filter((p) => p.length > 0)
    .join('/');
}

function providerForFile(config, file) {
  const effectivePath = file && file.path
    ? joinPath(config.defaultPath, file.path)
    : config.defaultPath;
  return upstream.init({ ...config, defaultPath: effectivePath });
}

// Tolerate "blob already gone" on delete so Strapi can still purge the
// DB row. Orphaned rows happen when an upload was interrupted (e.g. seed
// script killed mid-run) — the metadata insert committed but the blob
// upload never completed. Without this, every retry of the reset script
// gets a 404 from Azure and the row sticks around forever.
function isBlobNotFound(err) {
  if (!err) return false;
  const m = String(err.message ?? err);
  return /BlobNotFound|status[^\d]*404|specified blob does not exist/i.test(m);
}

module.exports = {
  provider: 'azure',
  auth: upstream.auth,
  init(config) {
    return {
      upload: (file) => providerForFile(config, file).upload(file),
      uploadStream: (file) => providerForFile(config, file).uploadStream(file),
      delete: async (file) => {
        try { return await providerForFile(config, file).delete(file); }
        catch (err) {
          if (isBlobNotFound(err)) return; // swallow — metadata row will be deleted
          throw err;
        }
      },
      isPrivate: () => false,
    };
  },
};
