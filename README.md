# OWASP LLM — Vulnerability & Mitigation Demos

Hands-on demonstrations of two risks from the [OWASP Top 10 for LLM Applications](https://genai.owasp.org/llm-top-10/), built with [Anthropic SDK](https://github.com/anthropics/anthropic-sdk-typescript).

- **[LLM01 Prompt Injection](./src/llm01-prompt-injection/RISK.md)**  
  `src/llm01-prompt-injection/`  
  Indirect injection makes a summarizer embed attacker-controlled content (phishing link / tracking token) into its output.
- **[LLM02 Sensitive Information Disclosure](./src/llm02-sensitive-info/RISK.md)**  
  `src/llm02-sensitive-info/`  
  A support assistant with over-broad context discloses another customer's PII.

For each risk you get:

- **vulnerable** implementation with a working attack,
- **risk assessment**,
- **mitigated** implementation that blocks the same attacks,
- **revised assessment** of the residual risk.

## Lessons learned

- A model safety alignment is **not** a security control.
- Both demos show modern Claude models resisting trivial attacks out of the box — yet leaking when the malicious request is framed as the model's normal job.
- The reliable fix in both cases is a **deterministic enforcement layer around the probabilistic model**:
    - **LLM01** → treat content as data (delimiting), constrain output with **structured output**, gate it deterministically in code, and add an independent LLM judge.
    - **LLM02** → enforce the **access-control / data boundary in code** (only put authorized data in context) and scan output for PII as a backstop.

The revised assessment: **risk is reduced, never "fully mitigated."**

## Setup

Requires Node 24+ and an Anthropic API key.

```bash
npm install
cp .env.example .env     # then put your key in .env
```

## Run

```bash
npm run llm01:vuln     # Prompt Injection — attacks SUCCEED against the vulnerable summarizer
npm run llm01:fixed    # Prompt Injection — same attacks BLOCKED by the mitigated summarizer

npm run llm02:vuln     # Sensitive Info — cross-user PII leaks from the vulnerable assistant
npm run llm02:fixed    # Sensitive Info — same attacks BLOCKED by the mitigated assistant
```

Each run prints a per-attack `ATTACK SUCCEEDS` / `ATTACK BLOCKED` verdict and a final tally.

### A note on non-determinism

These are live models, so exact wording and the occasional verdict vary run to run.
The demos are designed so the **vulnerable** runs reliably show successes depending on a specific model,
and the **mitigated** runs reliably show **zero** successes because the enforcement layers are deterministic.

## Project layout

```
src/
  client.ts                     # shared Anthropic client + verdict/banner helpers
  llm01-prompt-injection/
    attacks.ts                  # injection payloads (HACKED canary = attacker content)
    vulnerable.ts               # naive summarizer (no trust boundary)
    mitigated.ts                # delimiting + structured output + gate + LLM judge
    run-vuln.ts / run-fixed.ts  # runnable demos
    RISK.md                     # risk assessment (before & revised)
  llm02-sensitive-info/
    records.ts                  # fake customer DB + PII-leak detector
    attacks.ts                  # extraction attempts (lookups + controls)
    vulnerable.ts               # all records dumped into context
    mitigated.ts                # data boundary in code + output PII scanner
    run-vuln.ts / run-fixed.ts  # runnable demos
    RISK.md                     # risk assessment (before & revised)
```

All "secrets" and customer records here are fake and exist only to be leaked in the demo.
