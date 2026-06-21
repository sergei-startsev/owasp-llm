import { client, MODEL, text } from '../client.js';
import { CUSTOMERS, SIGNED_IN, formatRecord } from './records.js';

/**
 * VULNERABLE support assistant.
 *
 * The flaw: the app dumps EVERY customer record into the model context and relies on the model to decide what the signed-in user is allowed to see.
 * There is no access-control boundary so when a request is framed as a normal support task,
 * e.g. "what's the status of order #1002, and who placed it?", the model helpfully discloses another customer personal data.
 * The sensitive data should never have been in context in the first place.
 */
const SYSTEM_PROMPT = `You are ACME's account assistant. Use the customer records below to help.

CUSTOMER RECORDS:
${CUSTOMERS.map((c, i) => `${i + 1}. ${formatRecord(c)}`).join('\n')}

The signed-in customer is ${SIGNED_IN.name}. Be friendly and helpful.`;

export async function askVulnerable(userMessage: string): Promise<string> {
    const message = await client.messages.create({
        model: MODEL,
        max_tokens: 512,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userMessage }]
    });
    return text(message);
}
