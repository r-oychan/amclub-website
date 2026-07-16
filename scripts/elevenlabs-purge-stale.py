#!/usr/bin/env python3
"""Purge stale `am-club:*:id-N` KB doc generations after the documentId fix
is deployed and a sweep has re-created docs under their documentId names.

Any doc named `am-club:<type>:id-<n>` (or a `:file:` child of one) is stale
by definition once the fixed plugin has swept: current docs use slug or
documentId keys. Detaches stale docs from the given agent, deletes them,
then reports freed index bytes. The plugin's next KB refresh prunes the
dead sync-log rows automatically (PATCH failure -> per-doc GET validation).

Usage: purge-stale-idn.py <dev|uat>
"""
import json
import re
import sys
import time
import urllib.request
import urllib.error

REPO = '/Users/roychan/Documents/prefix/clients/amclub-sg/repo/amclub-website'
BASE = 'https://api.elevenlabs.io/v1'
STALE_RE = re.compile(r'^am-club:[^:]+:id-\d+(?::file:.+)?$')

env = sys.argv[1] if len(sys.argv) > 1 else ''
if env == 'dev':
    key_pattern, agent_id = r'^#ELEVENLABS_KEY=(sk_\S+)', 'agent_2501krr788f7esxaqkyqvxx5vrsh'
elif env == 'uat':
    key_pattern, agent_id = r'^ELEVENLABS_KEY=(sk_\S+)', 'agent_6001kvayq5h3f7p9p41hwzq4s3sp'
else:
    sys.exit('usage: purge-stale-idn.py <dev|uat>')

key = None
for line in open(f'{REPO}/.env'):
    m = re.match(key_pattern, line.strip())
    if m:
        key = m.group(1)
assert key


def call(method, path, body=None):
    data = json.dumps(body).encode() if body is not None else None
    h = {'xi-api-key': key}
    if data:
        h['Content-Type'] = 'application/json'
    req = urllib.request.Request(f'{BASE}{path}', data=data, headers=h, method=method)
    with urllib.request.urlopen(req, timeout=60) as r:
        t = r.read().decode()
        return json.loads(t) if t else {}


agent = call('GET', f'/convai/agents/{agent_id}')
kb = agent['conversation_config']['agent']['prompt'].get('knowledge_base', [])
stale = [d for d in kb if STALE_RE.match(d.get('name', ''))]
keep = [d for d in kb if not STALE_RE.match(d.get('name', ''))]
print(f'[{env}] attached={len(kb)} stale={len(stale)} keep={len(keep)}', flush=True)

if stale:
    call('PATCH', f'/convai/agents/{agent_id}',
         {'conversation_config': {'agent': {'prompt': {'knowledge_base': keep}}}})
    print(f'[{env}] detached {len(stale)} stale docs', flush=True)

freed = deleted = failed = 0
for d in stale:
    try:
        st = call('GET', f"/convai/knowledge-base/{d['id']}/rag-index")
        freed += max((i.get('document_model_index_usage', {}).get('used_bytes', 0)
                      for i in st.get('indexes', [])), default=0)
    except urllib.error.HTTPError:
        pass
    try:
        call('DELETE', f"/convai/knowledge-base/{d['id']}")
        deleted += 1
    except urllib.error.HTTPError as e:
        failed += 1
        print(f"[{env}] delete failed {d['name']}: {e.code} {e.read().decode()[:150]}", flush=True)
    time.sleep(0.1)

print(f'[{env}] deleted={deleted} failed={failed} freed_index_bytes={freed}', flush=True)
