#!/usr/bin/env python3
"""Sequential, retry-hardened RAG indexer for an agent's KB.

Usage: elevenlabs-index-kb.py <dev|uat>
dev = agency account (commented #ELEVENLABS_KEY in root .env);
uat = Club account (active ELEVENLABS_KEY).
"""
import json, sys, time, urllib.request, urllib.error
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENV = open(os.path.join(ROOT, '.env')).read()
env = sys.argv[1] if len(sys.argv) > 1 else ''
if env == 'dev':
    key_prefix, AID = '#ELEVENLABS_KEY=', 'agent_2501krr788f7esxaqkyqvxx5vrsh'
elif env == 'prod':
    key_prefix, AID = 'ELEVENLABS_KEY=', 'agent_8501kwyk5w3ben9vt241mq3q8hz3'
elif env == 'uat':
    key_prefix, AID = 'ELEVENLABS_KEY=', 'agent_6001kvayq5h3f7p9p41hwzq4s3sp'
else:
    sys.exit('usage: elevenlabs-index-kb.py <dev|uat|prod>')
KEY = [l.split('=', 1)[1].strip() for l in ENV.splitlines() if l.startswith(key_prefix)][0]


def call(path, method='GET', body=None, retries=4):
    for attempt in range(retries):
        try:
            req = urllib.request.Request(f'https://api.elevenlabs.io{path}',
                data=json.dumps(body).encode() if body is not None else None,
                headers={'xi-api-key': KEY, 'Content-Type': 'application/json'}, method=method)
            with urllib.request.urlopen(req, timeout=60) as r:
                return json.loads(r.read() or '{}')
        except urllib.error.HTTPError:
            raise
        except Exception:
            if attempt == retries - 1:
                raise
            time.sleep(5 * (attempt + 1))


def prio(k):
    order = [':restaurant:', ':dining-page:', ':fitness-page:', ':kids-page:', ':membership-page:',
             ':home-page:', ':about-page:', ':event-spaces-page:', ':whats-on-page:', ':contact-us-page:',
             'faq-master', ':footer:', ':event:', ':committee-member:', ':faq-item:']
    for i, t in enumerate(order):
        if t in k['name']:
            return i
    return 50


kb = call(f'/v1/convai/agents/{AID}')['conversation_config']['agent']['prompt']['knowledge_base']
docs = sorted(kb, key=prio)
print(f'{len(docs)} docs to index', flush=True)
done = skip = fail = limit = 0
for n, k in enumerate(docs):
    try:
        idx = call(f"/v1/convai/knowledge-base/{k['id']}/rag-index").get('indexes') or []
        if any(i['status'] == 'succeeded' for i in idx):
            skip += 1
            continue
        call(f"/v1/convai/knowledge-base/{k['id']}/rag-index", 'POST', {'model': 'e5_mistral_7b_instruct'})
        st = 'new'
        for _ in range(20):
            time.sleep(4)
            idx = call(f"/v1/convai/knowledge-base/{k['id']}/rag-index").get('indexes') or []
            st = idx[0]['status'] if idx else 'none'
            if st in ('succeeded', 'failed', 'rag_limit_exceeded'):
                break
        if st == 'succeeded':
            done += 1
        elif st == 'rag_limit_exceeded':
            limit += 1
            print('LIMIT at:', k['name'], flush=True)
            if limit >= 3:
                print('quota exhausted', flush=True)
                break
        else:
            fail += 1
            print('fail:', k['name'], st, flush=True)
    except Exception as e:
        fail += 1
        print('err:', k['name'], str(e)[:80], flush=True)
    if (n + 1) % 25 == 0:
        print(f'progress {n+1}/{len(docs)} done={done} skip={skip} fail={fail}', flush=True)
print(f'FINAL indexed={done} already={skip} failed={fail} limit_hits={limit}', flush=True)
