#!/usr/bin/env python3
"""Evaluate the dev ElevenLabs agent against FAQ base cases (round 2 harness).

Seeds the exact question in BOTH first_message and the simulated-user prompt
(the simulator ignores first_message alone). Checks: the user's actual first
message matches the intended question; reply answers it (any-of keywords);
counter-question-only; citation link/email present; marketing words; length.
"""
import json, re, sys, urllib.request, concurrent.futures

ENV = open('/Users/roychan/Documents/prefix/clients/amclub-sg/repo/amclub-website/.env').read()
KEY = [l.split('=', 1)[1].strip() for l in ENV.splitlines() if l.startswith('#ELEVENLABS_KEY=')][0]
AGENT = 'agent_2501krr788f7esxaqkyqvxx5vrsh'

# (question, expect_link, any-of keywords the answer must contain)
CASES = [
    ('Do I need to be American to join The American Club?', True, ['nationalit', 'open to']),
    ('What are the joining fees and monthly dues?', True, ['categor', 'fee']),
    ('What types of membership are available?', True, ['ordinary', 'term', 'corporate']),
    ('What documents do I need to apply for membership?', True, ['passport']),
    ('Can I visit the Club before becoming a member?', True, ['tour']),
    ('What dining venues are available at the Club?', True, ['grillhouse', 'tradewinds', 'central', '2nd floor']),
    ('Do I need a reservation for the Club restaurants?', True, ['reservation', 'recommend', 'book']),
    ('How do I contact the aquatics team?', True, ['aquatics@amclub.org.sg']),
    ('What are reciprocal clubs?', True, ['reciprocal']),
    ('What time is it in Singapore right now?', False, ['am', 'pm', ':']),
]

MARKETING = ['world-class', 'state-of-the-art', 'exceptional experience', 'curated', 'delighted to',
             'we are pleased', 'kindly be advised', 'premium offering']


def call(path, method='GET', body=None, timeout=240):
    req = urllib.request.Request(f'https://api.elevenlabs.io{path}',
        data=json.dumps(body).encode() if body is not None else None,
        headers={'xi-api-key': KEY, 'Content-Type': 'application/json'}, method=method)
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.loads(r.read() or '{}')


def run_case(args):
    i, (q, expect_link, keywords) = args
    user_prompt = (
        f'You are a website visitor with exactly one question. Your first message must be exactly: "{q}" '
        'Do not ask anything else, do not rephrase, do not add topics. After the agent answers, reply only '
        'with ==!END_CALL!== to end the conversation.'
    )
    body = {'simulation_specification': {'simulated_user_config': {
        'first_message': q, 'language': 'en', 'prompt': {'prompt': user_prompt},
    }}}
    try:
        res = call(f'/v1/convai/agents/{AGENT}/simulate-conversation', 'POST', body)
    except Exception as e:
        return i, q, '', [f'SIM ERROR: {e}'], ''
    convo = res.get('simulated_conversation', [])
    asked, reply = '', ''
    seen_user = False
    for t in convo:
        if t.get('role') == 'user' and not seen_user:
            seen_user = True
            asked = t.get('message') or ''
        elif seen_user and t.get('role') == 'agent':
            reply = t.get('message') or ''
            break
    flags = []
    if re.sub(r'\s', '', q.lower())[:28] not in re.sub(r'\s', '', asked.lower()):
        flags.append(f'HARNESS: user asked "{asked[:80]}"')
    low = reply.lower()
    if not any(k in low for k in keywords):
        flags.append(f'WRONG/OFF-TOPIC (none of {keywords})')
    sentences = [s for s in re.split(r'(?<=[.!?])\s+', reply.strip()) if s]
    if sentences and all(s.rstrip().endswith('?') for s in sentences):
        flags.append('COUNTER-QUESTION ONLY')
    has_url = bool(re.search(r'https?://\S+', reply))
    has_email = bool(re.search(r'[\w.+-]+@[\w-]+\.[\w.-]+', reply))
    if expect_link and not (has_url or has_email):
        flags.append('NO CITATION LINK/EMAIL')
    for w in MARKETING:
        if w.lower() in low:
            flags.append(f'MARKETING WORD: {w}')
    if len(reply) > 900:
        flags.append('TOO LONG')
    return i, q, reply, flags, asked


with concurrent.futures.ThreadPoolExecutor(max_workers=3) as ex:
    results = sorted(ex.map(run_case, enumerate(CASES)))

fails = 0
for i, q, reply, flags, asked in results:
    status = 'FAIL' if flags else 'ok  '
    if flags:
        fails += 1
    print(f'[{status}] Q{i+1}: {q}')
    print(f'      A: {reply.strip()[:550]}')
    if flags:
        print(f'      FLAGS: {flags}')
    print()
print(f'=== {len(CASES) - fails}/{len(CASES)} passed ===')
