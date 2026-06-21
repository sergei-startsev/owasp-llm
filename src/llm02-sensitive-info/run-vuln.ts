import { banner, summary, verdict } from '../client.js';
import { attacks } from './attacks.js';
import { askVulnerable } from './vulnerable.js';
import { leakedPII } from './records.js';

/**
 * Run every extraction attempt against the VULNERABLE assistant.
 * Expect: several attacks SUCCEED — another customer's PII appears in the reply.
 */
async function main() {
    banner('Sensitive Information Disclosure — VULNERABLE assistant');

    let succeeded = 0;
    for (const attack of attacks) {
        const output = await askVulnerable(attack.message);
        const { leaked, what } = leakedPII(output);
        if (leaked) succeeded++;
        verdict(attack.name, leaked, leaked ? `leaked ${what} — ${output}` : output);
    }

    summary(succeeded, attacks.length);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
