import Anthropic from '@anthropic-ai/sdk';
import { styleText } from 'node:util';
import 'dotenv/config';

/**
 * Shared Anthropic client + small helpers used by every demo script.
 */

if (!process.env.ANTHROPIC_API_KEY) {
    console.error('Missing ANTHROPIC_API_KEY. Copy .env.example to .env and set your key before running the demos.');
    process.exit(1);
}

export const MODEL = process.env.ANTHROPIC_MODEL ?? 'claude-haiku-4-5-20251001';

export const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

/** Concatenate all text blocks from a Messages API response into a single string. */
export function text(message: Anthropic.Message): string {
    return message.content
        .filter((block): block is Anthropic.TextBlock => block.type === 'text')
        .map(block => block.text)
        .join('');
}

/**
 * Print a single attack verdict in a consistent format across all scripts.
 *
 * `attackSucceeded === true`  -> the exploit worked (bad). Printed in red.
 * `attackSucceeded === false` -> the attack was blocked (good). Printed in green.
 */
export function verdict(label: string, attackSucceeded: boolean, detail?: string): void {
    const tag = attackSucceeded
        ? styleText(['red', 'bold'], 'ATTACK SUCCEEDS')
        : styleText(['green', 'bold'], 'ATTACK BLOCKED');
    console.log(`\n• ${label}\n  ${tag}`);
    if (detail) {
        console.log(`  ${styleText('dim', detail.replace(/\s+/g, ' ').trim().slice(0, 240))}`);
    }
}

/** Print a section banner. */
export function banner(title: string): void {
    console.log(styleText('bold', `\n${'='.repeat(72)}\n${title}\n${'='.repeat(72)}`));
    console.log(styleText('dim', `model: ${MODEL}`));
}

/** Print a one-line summary of how many attacks succeeded. */
export function summary(succeeded: number, total: number): void {
    const color = succeeded === 0 ? 'green' : 'red';
    console.log(styleText([color, 'bold'], `\nResult: ${succeeded}/${total} attacks succeeded.\n`));
}
