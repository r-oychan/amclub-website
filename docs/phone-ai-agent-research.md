# Phone AI agent: Panasonic TDE600 → Telnyx → ElevenLabs → Jotform

Research notes (2026-10-22). Nothing is built yet. Prices come from vendor and third-party pages, so confirm them in each portal before relying on them.

## Target call flow

```
Caller ──PSTN──▶ Club PBX (Panasonic KX-TDE600)
                    │  forward (option A: PSTN, option B: SIP trunk)
                    ▼
               Telnyx (+65 DID or SIP connection)
                    │  SIP over TCP/TLS → sip.rtc.elevenlabs.io
                    ▼
               ElevenLabs Agent ──webhook tool──▶ our backend /api/voice/jotform
                    │                                  │
                    │ transfer_to_number (optional)    └──▶ Jotform API (form submission)
                    ▼
               back to PBX / reception
```

## 1. PBX → Telnyx

The KX-TDE600 is discontinued. Panasonic exited the PBX business: global UC wind-down announced Dec 2020, NA hardware supply ended Jan 2023, and one reseller reports dealer support ended Mar 2025. Plan for a design that touches the PBX as little as possible.

| Option | How | Needs | Pros / cons |
|---|---|---|---|
| **A. PSTN forward (recommended for PoC)** | Set FWD/CO-to-CO (trunk-to-trunk) forwarding on the DDI or extension, pointing to the Telnyx +65 number | A Singapore DID on Telnyx. The dealer enables trunk-to-trunk transfer in PBX programming. | No new PBX hardware or licences. Each call uses 2 CO lines while it's active, plus a local-call charge from the club's carrier. |
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

**Recommendation: wrap it in our backend** rather than having the agent call Jotform directly.

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
1. Which calls go to the agent: all calls, after hours only, or an IVR option like "press 9"?
2. Which Jotform form(s), and which fields are required?
3. Should the agent transfer to reception, and to which number or extension?
4. Who is the PBX maintainer, and can they do CO-to-CO forwarding or SIP?
5. Does the club approve buying the SG DID with its documents?
