import { banner, summary, verdict } from '../client.js';
import { attacks } from './attacks.js';
import { askMitigated } from './mitigated.js';
import { leakedPII } from './records.js';

/**
 * Run every extraction attempt against the MITIGATED assistant.
 * Expect: all attacks BLOCKED — other customers' PII is not in context,
 * so it cannot be disclosed, and the output scanner would redact any that somehow appeared.
 */
async function main() {
    banner('Sensitive Information Disclosure — MITIGATED assistant');

    let succeeded = 0;
    for (const attack of attacks) {
        const reply = await askMitigated(attack.message);
        const { leaked, what } = leakedPII(reply.text);
        if (leaked) succeeded++;

        const note = reply.redacted ? ' (output scanner redacted PII)' : '';
        verdict(attack.name, leaked, leaked ? `leaked ${what} — ${reply.text}` : `${reply.text}${note}`);
    }

    summary(succeeded, attacks.length);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
