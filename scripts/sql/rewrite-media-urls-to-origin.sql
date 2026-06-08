-- Rewrite existing Media Library file URLs from the raw Azure Blob host to the
-- site origin, so they match what the upload provider now emits for NEW uploads
-- (STORAGE_CDN_URL = site origin → file.url becomes <site>/uploads/...).
--
-- WHY: before STORAGE_CDN_URL was set, every uploaded file's `url` (and each
-- responsive variant in `formats`) was stored as the raw blob host, e.g.
--   https://amclubuatdata.blob.core.windows.net/media/uploads/large_x.jpeg
-- After the change, nginx reverse-proxies /uploads/ to the blob container, so
-- the same asset should be referenced as:
--   https://uat.amclub.org.sg/uploads/large_x.jpeg
-- New uploads get this automatically; this script fixes the pre-existing rows.
--
-- WHEN: run ONCE per environment, AFTER the new image is deployed (nginx must
-- already proxy /uploads/, or the rewritten URLs would 404). Idempotent — the
-- WHERE clause skips rows already migrated, so re-running is safe.
--
-- HOW (DB port 5432 is firewalled from local machines — run from Azure Cloud
-- Shell against the env's Postgres):
--
--   psql "host=amclub-uat-pg.postgres.database.azure.com port=5432 \
--         dbname=strapi user=<admin> sslmode=require" \
--        -v blob='https://amclubuatdata.blob.core.windows.net/media/' \
--        -v site='https://uat.amclub.org.sg/' \
--        -f rewrite-media-urls-to-origin.sql
--
--   # dev:  blob=https://amclubdevdata.blob.core.windows.net/media/  site=https://dev.amclub.org.sg/
--   # prod: blob=https://amclubproddata.blob.core.windows.net/media/ site=https://amclub.org.sg/
--
-- Always preview with the SELECT first, then run the UPDATE in a transaction.

\echo 'Preview — rows that will change:'
SELECT id, name,
       url AS old_url,
       replace(url, :'blob', :'site') AS new_url
FROM files
WHERE url LIKE :'blob' || '%'
   OR (formats IS NOT NULL AND formats::text LIKE '%' || :'blob' || '%')
ORDER BY id
LIMIT 50;

\echo 'Applying rewrite (url + responsive formats)...'
BEGIN;

UPDATE files
SET url = replace(url, :'blob', :'site'),
    formats = CASE
      WHEN formats IS NULL THEN NULL
      ELSE replace(formats::text, :'blob', :'site')::jsonb
    END
WHERE url LIKE :'blob' || '%'
   OR (formats IS NOT NULL AND formats::text LIKE '%' || :'blob' || '%');

\echo 'Rows still referencing the blob host (should be 0):'
SELECT count(*) AS remaining
FROM files
WHERE url LIKE :'blob' || '%'
   OR (formats IS NOT NULL AND formats::text LIKE '%' || :'blob' || '%');

-- Review the counts above, then:
COMMIT;
-- ROLLBACK;  -- use instead of COMMIT if the preview looked wrong
