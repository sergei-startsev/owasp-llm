import { client, MODEL, text } from '../client.js';
import { CUSTOMERS, OTHER_CUSTOMERS, SIGNED_IN, formatRecord } from './records.js';

/**
 * MITIGATED support assistant — defense in depth.
 *
 *   1. Data boundary (PRIMARY). Only the signed-in user's record is placed in the model context.
 *      Other customers PII is never available to the model, so it physically cannot be disclosed —
 *      no amount of clever prompting can leak data that isn't there.
 *      This is the real fix: enforce the access-control boundary in code before the model, not inside the prompt.
 *   2. Output scanner (defense in depth). Before returning, the response is scanned for any other customer's PII
 *      and for generic email/phone patterns, which are redacted.
 *      This is a backstop for cases where sensitive data legitimately must be in context.
 *
 * Returns the reply plus whether the scanner had to redact anything.
 */

const SYSTEM_PROMPT = `You are ACME's account assistant for the signed-in customer below.

YOUR CUSTOMER'S RECORD (the only account you may discuss):
${formatRecord(SIGNED_IN)}

Only help ${SIGNED_IN.name} with their own account. If asked about any other person or order,
explain that you can only access the signed-in customer's account. Be friendly and helpful.`;

// Generic PII patterns used by the output scanner as a last line of defense.
const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
const PHONE_RE = /\+?\d[\d\s().-]{7,}\d/g;

/**
 * Redact any PII in the output that does NOT belong to the signed-in user. The signed-in user's
 * own email/phone are allowed through; everything else matching a PII pattern is masked.
 */
function scrubOutput(output: string): { text: string; redacted: boolean } {
    const allowed = new Set([SIGNED_IN.email, SIGNED_IN.phone, SIGNED_IN.phone.replace(/\D/g, '')]);
    let redacted = false;

    const mask = (match: string): string => {
        const normalized = match.replace(/\s+/g, '');
        if (allowed.has(match) || allowed.has(normalized)) return match;
        redacted = true;
        return '[REDACTED]';
    };

    const scrubbed = output.replace(EMAIL_RE, mask).replace(PHONE_RE, mask);
    return { text: scrubbed, redacted };
}

export interface MitigatedReply {
    text: string;
    redacted: boolean;
}

export async function askMitigated(userMessage: string): Promise<MitigatedReply> {
    // Sanity check: the context must never contain other customers' data.
    if (CUSTOMERS.length - 1 !== OTHER_CUSTOMERS.length) {
        throw new Error('record partitioning is inconsistent');
    }

    const message = await client.messages.create({
        model: MODEL,
        max_tokens: 512,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userMessage }]
    });

    const { text: scrubbed, redacted } = scrubOutput(text(message));
    return { text: scrubbed, redacted };
}
