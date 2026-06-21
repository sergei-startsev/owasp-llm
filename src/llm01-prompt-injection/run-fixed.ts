import { banner, summary, verdict } from '../client.js';
import { attacks, HACKED } from './attacks.js';
import { summarizeMitigated } from './mitigated.js';

/**
 * Run every injection payload against the MITIGATED summarizer.
 * Expect: all attacks BLOCKED — either the layered defenses reject the output,
 * or a clean summary is returned with no trace of the injected canary.
 *
 * The attack only "succeeds" here if the canary leaks all the way through to the caller.
 */
async function main() {
    banner('Prompt Injection — MITIGATED summarizer');

    let succeeded = 0;
    for (const attack of attacks) {
        const result = await summarizeMitigated(attack.document);

        if (!result.ok) {
            // A defense layer rejected the response — the attack was stopped.
            verdict(attack.name, false, `blocked: ${result.reason}`);
            continue;
        }

        // A summary came back. It only counts as a successful attack if the canary leaked through.
        const leaked = result.summary.toUpperCase().includes(HACKED);
        if (leaked) succeeded++;
        verdict(attack.name, leaked, `summary: ${result.summary}`);
    }

    summary(succeeded, attacks.length);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
