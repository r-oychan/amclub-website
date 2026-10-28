# Phone AI agent: Panasonic TDE600 → Telnyx → ElevenLabs → Jotform

Research notes started 2026-10-22. Architecture settled 2026-10-28. The agent → Strapi → Jotform part is built and running on dev and uat; the PBX forward and the Telnyx SG number are still to do. Prices come from vendor and third-party pages, so confirm them in each portal before relying on them.

## Architecture (settled)

```
Caller ──PSTN──▶ Club PBX (Panasonic KX-TDE600)
                    │  answered by staff → normal call, nothing below happens
                    │
                    │  busy, or no answer after 3 rings
                    │  → conditional call forward (CO-to-CO / PSTN, option A)
                    ▼
               Telnyx (+65 SG number)
                    │  SIP over TCP → sip.rtc.elevenlabs.io (FQDN connection)
                    ▼
               ElevenLabs Agent "Eli v2"   (system__channel = sip_trunk)
                    │  same agent as the website chat; it keeps phone answers short,
                    │  never reads out URLs, hangs up after goodbye (end_call)
                    │
                    │  webhook tool submit_talk2us_request
                    │  Authorization: Bearer <Strapi custom API token, stored as an ElevenLabs secret>
                    ▼
               Strapi proxy  POST /api/assistant-requests/submit
                    │  validates, classifies the department, idempotent per conversation,
                    │  logs every attempt in "Assistant: Talk2Us Requests"
                    │  APIKEY header (JOTFORM_API_KEY, Container App secret)
                    ▼
               Jotform Talk2Us form  →  form's own email routing to the department
```

| Hop | Detail | Status |
|---|---|---|
| Panasonic → Telnyx | Forward on busy or after 3 rings (no answer) to the Telnyx +65 number over the PSTN (option A below). The club's Panasonic dealer programs it. | To do: dealer, plus caller ID passthrough check |
| Telnyx → ElevenLabs | Telnyx FQDN connection to `sip.rtc.elevenlabs.io`, TCP, +E.164. The number is imported in ElevenLabs as a SIP trunk number and assigned to Eli v2. | To do: SG number (needs the club's documents) |
| ElevenLabs agent | One agent for both phone and web chat. It can tell which one it's on (`system__channel`, `system__is_text_only`). Prompt: `agent/prompt.md`; pushed by `scripts/elevenlabs-configure-agent.mjs <env>`. | Built (dev, uat) |
| Agent → Strapi | Webhook tool `submit_talk2us_request`. Each environment has its own custom API token, allowed only `assistant-request.submit`. | Built (dev, uat) |
| Strapi → Jotform | `cms/src/api/assistant-request`. Non-prod submissions are tagged `[DEV TEST]` / `[UAT TEST]`. | Built: verified end to end on dev; uat needs the `JOTFORM_*` settings |

Rejected along the way: a separate voice-only agent (kept one agent, which changes its style by channel); the agent calling Jotform directly (the key would sit in ElevenLabs, and we'd have no validation or log); option B SIP trunk from the PBX (licences for this end-of-life model are hard to get). The Twilio number used for the first SIP test was only for testing.

## 1. PBX → Telnyx

The KX-TDE600 is discontinued. Panasonic exited the PBX business: global UC wind-down announced Dec 2020, NA hardware supply ended Jan 2023, and one reseller reports dealer support ended Mar 2025. Plan for a design that touches the PBX as little as possible.

| Option | How | Needs | Pros / cons |
|---|---|---|---|
| **A. PSTN forward (chosen: on busy or after 3 rings)** | Set conditional FWD (busy / no answer after 3 rings) with CO-to-CO (trunk-to-trunk) forwarding on the DDI or extension, pointing to the Telnyx +65 number | A Singapore DID on Telnyx. The dealer enables trunk-to-trunk transfer in PBX programming. | No new PBX hardware or licences. Each call uses 2 CO lines while it's active, plus a local-call charge from the club's carrier. |
| **B. SIP trunk from PBX** | Set up a Virtual SIP trunk card (V-SIPGW) on the IPCMPR, pointing at a Telnyx credential SIP connection | KX-NCS4xxx SIP trunk activation keys (discontinued, grey market only), PGMPR ≥ 2.0 firmware, dealer programming | No CO lines are used and it's the cleanest route. The licences are hard to buy for an EOL box. |
| **C. Small SBC/Asterisk in between** | PBX → existing line or IP trunk → FreePBX/Asterisk → Telnyx | A box or VM at the club | Flexible (you can add headers like `X-Caller-ID`), but it's one more thing to run. |

Why keep Telnyx in the middle instead of PBX → ElevenLabs directly: ElevenLabs inbound SIP wants TCP/TLS (UDP is "experimental, testing only"). Legacy PBXs are usually UDP SIP, and Telnyx also gives us a real PSTN number.

**To confirm with the club's Panasonic dealer:** card inventory (IPCMPR, V-SIPGW, any NCS keys), firmware version, whether CO-to-CO forwarding is allowed, the trunk type (ISDN PRI or analog), and whether the original caller ID is passed through on forward. If the caller ID isn't passed, the agent sees the club's number instead of the member's.

## 2. Telnyx → ElevenLabs

Source: ElevenLabs "Telnyx SIP trunking" and "SIP trunking" docs.

1. In Telnyx: Voice → SIP Trunking → create an **FQDN** connection with FQDN `sip.rtc.elevenlabs.io`.
   - Inbound tab: destination format **+E.164**, transport **TCP**, and pick an Asia SIP region. Don't set digest credentials on the inbound side.
   - Outbound (only if the agent dials out or transfers): credentials auth plus an outbound voice profile.
   - Numbers tab: assign the +65 number.
2. In ElevenLabs: Phone numbers → import SIP trunk number, using the same E.164 format as the number Telnyx sends, and assign the agent.
3. Notes:
   - Codecs: G.722, PCMU, PCMA.
   - Origination URIs: `sip:<e164>@sip.rtc.elevenlabs.io:5060;transport=tcp` or `:5061;transport=tls`.
   - Singapore data residency endpoint `sip-static.rtc.sg.residency.elevenlabs.io` exists (static IPs are Enterprise only).
   - `system__caller_id` and `system__called_number` are available to prompts and tools. Custom `X-Foo` SIP headers arrive as `{{sip_foo}}`.
   - Hand-off to a human: the `transfer_to_number` system tool supports conference, blind, or **SIP REFER** transfers. REFER needs the trunk (Telnyx) to allow it and can carry custom headers and UUI.

## 3. Agent → Jotform

**Decision: wrap it in our backend** (built as `POST /api/assistant-requests/submit`; see SPECS.md "Assistant: Talk2Us requests"). The original research notes follow; the built version uses the tool name `submit_talk2us_request` and a Strapi custom API token instead of a shared secret.

- ElevenLabs **webhook (server) tool** `submit_enquiry` → `POST https://<site>/api/voice/jotform-submit`. The URL comes from env per environment. Auth is a shared-secret header stored as an ElevenLabs secret.
- The body is a JSON schema the LLM fills (name, phone, email, enquiry type, preferred date…). Include `{{system__conversation_id}}` and `{{system__caller_id}}` as dynamic variables.
- The backend validates the payload, maps friendly field names to Jotform question IDs (`GET /form/{id}/questions`), and calls Jotform:
  - `POST https://api.jotform.com/form/{formId}/submissions`, header `APIKEY: …`, form-encoded `submission[3_first]=…&submission[4]=…`, or
  - `PUT /form/{formId}/submissions` with a JSON array (used by the official clients).
  - Use `eu-api.jotform.com` or `hipaa-api.jotform.com` if the account lives there.
- Return a short JSON result (`{ ok: true, reference: "…" }`) so the agent can read a confirmation back to the caller.

Why we need the wrapper:
- The Jotform key stays off the ElevenLabs config.
- Jotform's `submission[qid_sub]` shape is awkward for an LLM-filled schema.
- We get idempotency on `conversation_id` (the LLM may retry), logging, validation and phone normalisation.
- We can switch forms without re-editing the agent.

Things to verify:
- Whether Jotform email notifications and webhooks fire for API-created submissions (a third-party guide says webhooks don't).
- The daily API limits per plan (Starter 1k, Bronze 10k…).

## 4. Testing from Hong Kong

Two things need testing separately: the **agent and Jotform logic**, which doesn't need a phone, and the **telephony path**.

| Method | Cost | Notes |
|---|---|---|
| ElevenLabs dashboard test / web widget | Agent minutes only | Fastest loop for prompt and tool work. The transfer tool doesn't work here. |
| **Softphone (Linphone/Zoiper) on a Telnyx credential SIP connection, dialling the +65 DID** | Telnyx per-minute only (cents) | Cheapest real-SIP test from HK. Needs internet only. |
| Temporary **US Telnyx number (~$1/mo)** → ElevenLabs | ~$1 + minutes | Lets us start before the SG DID documents are approved. Same SIP config. |
| Call app to the +65 number (mytello ~HK$0.17/min + HK$0.40 setup, Rebtel, Yolla, Localphone) | Cents per minute | Real PSTN path from HK. Skype is gone (retired May 2025). |
| HK mobile IDD | HK$1.5–4/min | Most expensive, but simplest. |

To test the whole PBX path, someone at the club (or a call app) dials the club's main number and lets it forward.

### Singapore number on Telnyx
- Types: local `6xxx xxxx` and `3xxx xxxx` (VoIP-designated). The SG page says "from $5/mo" and other pages say $1/mo, so check the portal.
- Requirements for local and national numbers: company registration certificate, authorised representative's ID, a **Singapore address with proof dated within 3 months**, and a usage description. Validation takes about 72h. The club's own documents are the natural fit. A HK entity would need a SG address anyway.
- Telnyx sub-accounts: L1 verification can buy SG numbers only. L2 is needed for international numbers or international outbound.

## Rough running cost per call minute (USD, to verify)

- Telnyx inbound SG DID: low cents, not published. Check the portal rate deck.
- ElevenLabs Agents: about $0.08/min on paid plans (burst above the concurrency limit is about $0.16), plus LLM cost.
- Option A also adds the club carrier's local-call charge for the forward leg.

## Open questions for the client
1. ~~Which calls go to the agent?~~ Settled: calls that are busy or unanswered after 3 rings.
2. ~~Which Jotform form(s)?~~ Settled: Talk2Us.
3. Should the agent transfer to reception, and to which number or extension?
4. Who is the PBX maintainer, and can they do CO-to-CO forwarding or SIP?
5. Does the club approve buying the SG DID with its documents?
