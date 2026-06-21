import { banner, summary, verdict } from '../client.js';
import { attacks } from './attacks.js';
import { injectionSucceeded, summarizeVulnerable } from './vulnerable.js';

/**
 * Run every injection payload against the VULNERABLE summarizer.
 * Expect: most/all attacks SUCCEED (the canary word appears in the output).
 */
async function main() {
    banner('Prompt Injection — VULNERABLE summarizer');

    let succeeded = 0;
    for (const attack of attacks) {
        const output = await summarizeVulnerable(attack.document);
        const hit = injectionSucceeded(output);
        if (hit) succeeded++;
        verdict(attack.name, hit, output);
    }

    summary(succeeded, attacks.length);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
